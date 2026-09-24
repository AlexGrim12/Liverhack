-- =====================================================================
-- Talento 360 — esquema inicial
--
-- Flujo: Requisición → Alineación → Búsqueda → Atracción → Selección → Oferta → Cerrada
-- Roles: hm (captura la requisición) | hrbp (BP: solo VALIDA lo que necesita el HM)
--        | at (reclutamiento) | user (solicitante, solo lectura)
--
-- Convenciones:
--   * Autorización basada en la tabla public.profiles (NUNCA en user_metadata).
--   * RLS activado en todas las tablas; los GRANT son explícitos porque las
--     tablas nuevas ya no se exponen automáticamente a la Data API.
--   * Lógica de negocio (transiciones, SLA, notificaciones) en triggers, para que
--     el flujo sea coherente sin importar qué cliente escriba.
--   * Helpers privilegiados viven en el schema "private" (no expuesto por la API).
--   * Escrituras de sistema (cron de Drive, extracción de IA) usan service_role,
--     que se salta RLS; en esos casos auth.uid() es NULL y los triggers lo tratan
--     como "sistema" (se validan reglas de negocio, no permisos por rol).
-- =====================================================================

create schema if not exists private;
grant usage on schema private to authenticated, service_role;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema private to supabase_auth_admin;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.app_role             as enum ('hrbp', 'at', 'hm', 'user');
create type public.vacancy_stage        as enum ('requisicion', 'alineacion', 'busqueda', 'atraccion', 'seleccion', 'oferta', 'cerrada');
create type public.vacancy_level        as enum ('bajo', 'medio', 'alto', 'complejo');
create type public.vacancy_close_reason as enum ('contratado', 'cancelada', 'sin_candidatos', 'presupuesto');
create type public.education_level      as enum ('preparatoria', 'licenciatura_trunca', 'licenciatura', 'posgrado');
create type public.language_level       as enum ('basico', 'intermedio', 'avanzado', 'nativo');
create type public.application_status   as enum ('screening', 'entrevista_agendada', 'en_proceso', 'finalista', 'descartado', 'contratado');
create type public.interview_type       as enum ('screening', 'tecnica', 'cultural', 'final');
create type public.interview_status     as enum ('agendada', 'completada', 'cancelada', 'no_show');
create type public.interviewer_verdict  as enum ('recomendado', 'con_reservas', 'no_recomendado');
create type public.attribute_source     as enum ('cv', 'entrevista', 'manual');
create type public.chat_role            as enum ('user', 'assistant');

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create function private.try_uuid(p text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when p ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then p::uuid
  end
$$;

-- ---------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  nombre      text not null,
  avatar_url  text,
  role        public.app_role not null default 'user',
  area        text,
  cargo       text,               -- p.ej. "Tech Lead", "Product Lead"
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is
  'Directorio de usuarios. El rol lo asigna un administrador (service_role / SQL); el usuario NO puede cambiarlo.';

create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

-- Rol del usuario actual (SECURITY DEFINER para no recursar en las políticas de profiles)
create function private.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.activo
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, nombre, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------
-- Catálogos / configuración
-- ---------------------------------------------------------------------
create table public.holidays (
  fecha   date primary key,
  nombre  text not null
);
comment on table public.holidays is 'Días inhábiles (se excluyen del cálculo de SLA en días hábiles).';

create table public.competencies (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null unique,
  activo  boolean not null default true
);

create table public.vacancy_templates (
  id                 uuid primary key default gen_random_uuid(),
  categoria          text not null unique,               -- "TI-Sistemas", "Logística"...
  area               text not null,                      -- "TI y Sistemas"
  stack_opciones     text[] not null default '{}',       -- chips de "Herramientas y tecnologías"
  cert_ejemplo       text,                               -- placeholder de certificación
  exp_minima_default smallint not null default 2 check (exp_minima_default between 0 and 40),
  -- Campos estructurados/filtrables por candidato. Arreglo de objetos:
  --   { "key": "github", "label": "GitHub", "tipo": "url|text|number|select|multiselect|boolean",
  --     "opciones": [...], "requerido": bool, "filtrable": bool }
  campos             jsonb not null default '[]' check (jsonb_typeof(campos) = 'array'),
  activo             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger vacancy_templates_updated_at before update on public.vacancy_templates
  for each row execute function private.set_updated_at();

-- SLA objetivo (días hábiles) por nivel de vacante y etapa. Valores por defecto EDITABLES:
-- son una suposición razonable, confirmar con Liverpool.
create table public.sla_targets (
  nivel         public.vacancy_level not null,
  etapa         public.vacancy_stage not null,
  dias_habiles  smallint not null check (dias_habiles > 0),
  primary key (nivel, etapa)
);

-- Máquina de estados: qué transiciones existen y qué rol puede ejecutarlas.
create table public.stage_transitions (
  desde  public.vacancy_stage not null,
  hacia  public.vacancy_stage not null,
  roles  public.app_role[] not null check (cardinality(roles) > 0),
  primary key (desde, hacia)
);

insert into public.sla_targets (nivel, etapa, dias_habiles) values
  ('bajo','requisicion',1),  ('medio','requisicion',2),  ('alto','requisicion',3),  ('complejo','requisicion',3),
  ('bajo','alineacion',1),   ('medio','alineacion',2),   ('alto','alineacion',3),   ('complejo','alineacion',5),
  ('bajo','busqueda',5),     ('medio','busqueda',10),    ('alto','busqueda',15),    ('complejo','busqueda',20),
  ('bajo','atraccion',3),    ('medio','atraccion',5),    ('alto','atraccion',7),    ('complejo','atraccion',10),
  ('bajo','seleccion',5),    ('medio','seleccion',8),    ('alto','seleccion',12),   ('complejo','seleccion',15),
  ('bajo','oferta',3),       ('medio','oferta',5),       ('alto','oferta',5),       ('complejo','oferta',8);

insert into public.stage_transitions (desde, hacia, roles) values
  ('requisicion','alineacion', '{hrbp}'),
  ('alineacion', 'busqueda',   '{at,hm}'),
  ('busqueda',   'atraccion',  '{at}'),
  ('atraccion',  'seleccion',  '{at}'),      -- "Enviar pool al Hiring Manager"
  ('atraccion',  'busqueda',   '{at}'),      -- el pool no alcanzó
  ('seleccion',  'oferta',     '{hm,hrbp}'),
  ('seleccion',  'busqueda',   '{hm,at}'),   -- todos descartados
  ('oferta',     'seleccion',  '{hm,hrbp}'), -- oferta rechazada
  ('requisicion','cerrada',    '{hrbp,hm}'),  -- el HM retira su requisición
  ('alineacion', 'cerrada',    '{hrbp,hm}'),
  ('busqueda',   'cerrada',    '{hrbp,hm}'),
  ('atraccion',  'cerrada',    '{hrbp,hm}'),
  ('seleccion',  'cerrada',    '{hrbp,hm}'),
  ('oferta',     'cerrada',    '{hrbp}');     -- solo el BP cierra con "contratado"

-- Días hábiles transcurridos entre dos instantes (lun–vie, sin festivos), zona CDMX.
-- Cuenta [desde, hasta): mismo día = 0.
create function public.business_days_between(p_from timestamptz, p_to timestamptz)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer
  from generate_series(
         (p_from at time zone 'America/Mexico_City')::date,
         (p_to   at time zone 'America/Mexico_City')::date - 1,
         interval '1 day'
       ) as d
  where extract(isodow from d) < 6
    and not exists (select 1 from public.holidays h where h.fecha = d::date)
$$;

-- ---------------------------------------------------------------------
-- Vacantes
-- ---------------------------------------------------------------------
create table public.vacancies (
  id            uuid primary key default gen_random_uuid(),
  folio         bigint generated always as identity unique,   -- mostrar como REQ-000123
  titulo        text not null check (length(btrim(titulo)) > 0),
  area          text not null,
  template_id   uuid not null references public.vacancy_templates (id),
  nivel         public.vacancy_level not null default 'medio',
  etapa         public.vacancy_stage not null default 'requisicion',
  etapa_desde   timestamptz not null default now(),

  -- Contenido de la requisición: lo captura el HM (lo que él necesita)
  stack_requerido        text[] not null default '{}',
  certificacion_deseable text,
  exp_minima             smallint not null default 0 check (exp_minima between 0 and 40),
  estudios_minimos       public.education_level not null default 'licenciatura',
  habilidades_clave      text,
  competencias           text[] not null default '{}',
  requisitos             jsonb not null default '{}' check (jsonb_typeof(requisitos) = 'object'),  -- valores de template.campos
  salario_min            numeric(12,2) check (salario_min >= 0),
  salario_max            numeric(12,2) check (salario_max >= 0),

  -- Validación del BP: solo aprueba lo que pidió el HM (viabilidad y banda salarial)
  bp_validado_at  timestamptz,
  bp_validado_por uuid references public.profiles (id),
  bp_comentarios  text,
  bp_devuelta_at  timestamptz,                 -- el BP la devolvió con comentarios
  enviada_at      timestamptz not null default now(),  -- última vez que el HM la envió / modificó

  -- Responsables
  hm_id          uuid not null references public.profiles (id),   -- captura la requisición
  hrbp_id        uuid not null references public.profiles (id),   -- BP que la valida
  at_id          uuid references public.profiles (id),            -- lo asigna el BP al validar
  solicitante_id uuid references public.profiles (id),            -- rol "user": seguimiento solo lectura

  cierre_motivo  public.vacancy_close_reason,
  cerrada_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint vacancies_salary_range check (salario_max is null or salario_min is null or salario_max >= salario_min),
  constraint vacancies_closed_reason check ((etapa = 'cerrada') = (cierre_motivo is not null))
);
create index vacancies_hrbp_idx        on public.vacancies (hrbp_id);
create index vacancies_at_idx          on public.vacancies (at_id);
create index vacancies_hm_idx          on public.vacancies (hm_id);
create index vacancies_solicitante_idx on public.vacancies (solicitante_id);
create index vacancies_template_idx    on public.vacancies (template_id);
create index vacancies_abiertas_idx    on public.vacancies (etapa) where etapa <> 'cerrada';

create trigger vacancies_updated_at before update on public.vacancies
  for each row execute function private.set_updated_at();

-- Historial de etapas (alimentado por trigger). Fuente del SLA real vs. objetivo.
create table public.vacancy_stage_history (
  id                    uuid primary key default gen_random_uuid(),
  vacancy_id            uuid not null references public.vacancies (id) on delete cascade,
  etapa                 public.vacancy_stage not null,
  entered_at            timestamptz not null,
  exited_at             timestamptz,
  entered_by            uuid references public.profiles (id),
  dias_habiles_objetivo smallint,
  dias_habiles_reales   integer
);
create index vacancy_stage_history_vacancy_idx on public.vacancy_stage_history (vacancy_id, entered_at);
create unique index vacancy_stage_history_open_uidx on public.vacancy_stage_history (vacancy_id) where exited_at is null;

-- ---------------------------------------------------------------------
-- Candidatos y postulaciones
-- ---------------------------------------------------------------------
create table public.candidates (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null check (length(btrim(nombre)) > 0),
  email               text,
  telefono            text,
  nivel_estudios      public.education_level,
  institucion         text,                       -- "UNAM"  (filtrable)
  carrera             text,                       -- "Ing. en Computación"
  compensacion_actual  numeric(12,2) check (compensacion_actual >= 0),
  compensacion_deseada numeric(12,2) check (compensacion_deseada >= 0),
  moneda              char(3) not null default 'MXN',
  cv_path             text,                       -- bucket "cvs": {candidate_id}/{archivo}
  cv_texto            text,                       -- texto extraído (para Gemini)
  cv_procesado_at     timestamptz,
  fuente              text,                       -- bolsa de trabajo, chatbot, referido...
  aviso_privacidad_at timestamptz,                -- consentimiento (LFPDPPP)
  created_by          uuid references public.profiles (id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create unique index candidates_email_uidx on public.candidates (lower(email)) where email is not null;
create index candidates_created_by_idx on public.candidates (created_by);
create trigger candidates_updated_at before update on public.candidates
  for each row execute function private.set_updated_at();

create table public.candidate_languages (
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  idioma       text not null,
  nivel        public.language_level not null,
  primary key (candidate_id, idioma)
);

create table public.applications (
  id             uuid primary key default gen_random_uuid(),
  vacancy_id     uuid not null references public.vacancies (id) on delete cascade,
  candidate_id   uuid not null references public.candidates (id) on delete cascade,
  estatus        public.application_status not null default 'screening',
  compat_pct     numeric(5,2) check (compat_pct between 0 and 100),
  compat_fuente  text check (compat_fuente in ('assessfirst', 'ia', 'manual')),
  compat_detalle jsonb,                                   -- desglose (cognitivo, soft skills, requisitos)
  custom_fields  jsonb not null default '{}' check (jsonb_typeof(custom_fields) = 'object'),  -- valores de template.campos
  decision_por           uuid references public.profiles (id),
  decision_at            timestamptz,
  decision_justificacion text,
  created_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (vacancy_id, candidate_id),
  unique (id, vacancy_id),                                -- FK compuesta desde interviews
  constraint applications_decision_stamp check (
    estatus not in ('finalista', 'descartado') or (decision_por is not null and decision_at is not null)
  ),
  constraint applications_discard_reason check (
    estatus <> 'descartado' or length(btrim(coalesce(decision_justificacion, ''))) > 0
  )
);
create index applications_vacancy_idx   on public.applications (vacancy_id, estatus);
create index applications_candidate_idx on public.applications (candidate_id);
create index applications_custom_gin    on public.applications using gin (custom_fields jsonb_path_ops);
create trigger applications_updated_at before update on public.applications
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Entrevistas
-- ---------------------------------------------------------------------
create table public.interviews (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  vacancy_id     uuid not null,                            -- denormalizado; garantizado por la FK compuesta
  tipo           public.interview_type not null default 'tecnica',
  estado         public.interview_status not null default 'agendada',
  inicio         timestamptz not null,
  fin            timestamptz not null,
  calendar_event_id text unique,                           -- Google Calendar
  meet_link      text,
  drive_doc_id   text unique,                              -- nota de Gemini en Drive
  notas_path     text,                                     -- bucket "interview-notes": {interview_id}/{archivo}
  resumen_ia     text,
  resumen_puntos text[] not null default '{}',             -- chips: "✓ Microservicios AWS"
  resumen_actualizado_at timestamptz,
  agendada_por   uuid references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint interviews_application_fk foreign key (application_id, vacancy_id)
    references public.applications (id, vacancy_id) on delete cascade,
  constraint interviews_time_range check (fin > inicio)
);
create index interviews_application_idx on public.interviews (application_id);
create index interviews_vacancy_idx     on public.interviews (vacancy_id, inicio);
create index interviews_proximas_idx    on public.interviews (inicio) where estado = 'agendada';
create trigger interviews_updated_at before update on public.interviews
  for each row execute function private.set_updated_at();

-- Panel de entrevistadores + su feedback (una fila por entrevistador)
create table public.interview_panel (
  interview_id uuid not null references public.interviews (id) on delete cascade,
  profile_id   uuid not null references public.profiles (id),
  veredicto    public.interviewer_verdict,
  notas        text,
  feedback_at  timestamptz,
  created_at   timestamptz not null default now(),
  primary key (interview_id, profile_id),
  constraint interview_panel_feedback_pair check ((veredicto is null) = (feedback_at is null))
);
create index interview_panel_profile_idx on public.interview_panel (profile_id);

-- Atributos detectados por IA (CV / entrevista) o capturados a mano — vocabulario abierto
create table public.candidate_attributes (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  tag          text not null check (length(btrim(tag)) > 0),
  fuente       public.attribute_source not null,
  contexto     text,
  interview_id uuid references public.interviews (id) on delete set null,
  created_at   timestamptz not null default now()
);
create unique index candidate_attributes_uidx on public.candidate_attributes (candidate_id, lower(tag));
create index candidate_attributes_interview_idx on public.candidate_attributes (interview_id);

-- ---------------------------------------------------------------------
-- Notificaciones ("Pendientes" y alertas) — las generan los triggers
-- ---------------------------------------------------------------------
create table public.notifications (
  id             uuid primary key default gen_random_uuid(),
  recipient_id   uuid not null references public.profiles (id) on delete cascade,
  tipo           text not null check (tipo in (
                   'etapa_cambio', 'validar_requisicion', 'requisicion_validada', 'requisicion_devuelta', 'requisitos_actualizados',
                   'alinear_requisicion', 'pool_listo', 'solicitar_oferta',
                   'entrevista_agendada', 'feedback_pendiente', 'candidato_finalista',
                   'sla_riesgo', 'general')),
  titulo         text not null,
  detalle        text,
  vacancy_id     uuid references public.vacancies (id) on delete cascade,
  application_id uuid references public.applications (id) on delete cascade,
  interview_id   uuid references public.interviews (id) on delete cascade,
  urgente        boolean not null default false,
  due_at         timestamptz,
  leida_at       timestamptz,
  created_at     timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc) where leida_at is null;
create index notifications_vacancy_idx   on public.notifications (vacancy_id);
create index notifications_application_idx on public.notifications (application_id);
create index notifications_interview_idx on public.notifications (interview_id);

-- ---------------------------------------------------------------------
-- Asistente de IA (chat del Hiring Manager / AT)
-- ---------------------------------------------------------------------
create table public.ai_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  vacancy_id uuid references public.vacancies (id) on delete cascade,
  titulo     text,
  created_at timestamptz not null default now()
);
create index ai_conversations_user_idx    on public.ai_conversations (user_id, created_at desc);
create index ai_conversations_vacancy_idx on public.ai_conversations (vacancy_id);

create table public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role            public.chat_role not null,
  content         text not null,
  fuentes         jsonb,                                  -- candidatos/entrevistas citados
  created_at      timestamptz not null default now()
);
create index ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

-- =====================================================================
-- Helpers de acceso (SECURITY DEFINER, schema private)
-- =====================================================================

-- ¿Es entrevistador asignado en alguna entrevista de la vacante?
create function private.is_panelist(p_vacancy uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.interviews i
    join public.interview_panel ip on ip.interview_id = i.id
    where i.vacancy_id = p_vacancy and ip.profile_id = (select auth.uid())
  )
$$;

-- ¿Puede ver la vacante? responsables + solicitante + entrevistadores asignados.
create function private.can_read_vacancy(p_vacancy uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
           select 1 from public.vacancies v
           where v.id = p_vacancy
             and (select auth.uid()) in (v.hrbp_id, v.at_id, v.hm_id, v.solicitante_id)
         )
      or exists (
           select 1
           from public.interviews i
           join public.interview_panel ip on ip.interview_id = i.id
           where i.vacancy_id = p_vacancy and ip.profile_id = (select auth.uid())
         )
$$;

-- ¿Puede ver candidatos/entrevistas de la vacante? Igual que arriba, SIN el solicitante.
create function private.can_read_candidates(p_vacancy uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
           select 1 from public.vacancies v
           where v.id = p_vacancy
             and (select auth.uid()) in (v.hrbp_id, v.at_id, v.hm_id)
         )
      or exists (
           select 1
           from public.interviews i
           join public.interview_panel ip on ip.interview_id = i.id
           where i.vacancy_id = p_vacancy and ip.profile_id = (select auth.uid())
         )
$$;

create function private.can_access_candidate(p_candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_candidate is not null and (
    exists (select 1 from public.candidates c where c.id = p_candidate and c.created_by = (select auth.uid()))
    or exists (
         select 1 from public.applications a
         where a.candidate_id = p_candidate and private.can_read_candidates(a.vacancy_id)
       )
  )
$$;

create function private.can_read_interview(p_interview uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_interview is not null and exists (
    select 1 from public.interviews i
    where i.id = p_interview and private.can_read_candidates(i.vacancy_id)
  )
$$;

-- Candidatos vivos de una vacante (cuenta visible también para el solicitante)
create function private.active_applications_count(p_vacancy uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when private.can_read_vacancy(p_vacancy)
      then (select count(*)::integer from public.applications a
            where a.vacancy_id = p_vacancy and a.estatus <> 'descartado')
    else 0
  end
$$;

-- Inserta una notificación (omite destinatarios nulos y al propio actor).
create function private.notify(
  p_recipient uuid, p_tipo text, p_titulo text, p_detalle text,
  p_vacancy uuid, p_application uuid, p_interview uuid,
  p_urgente boolean default false, p_due timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_recipient is null or p_recipient = (select auth.uid()) then
    return;
  end if;
  insert into public.notifications
    (recipient_id, tipo, titulo, detalle, vacancy_id, application_id, interview_id, urgente, due_at)
  values
    (p_recipient, p_tipo, p_titulo, p_detalle, p_vacancy, p_application, p_interview, p_urgente, p_due);
end
$$;

-- Seguimiento para el rol "user": próxima entrevista + historial, SIN exponer
-- compensación, feedback ni resúmenes. Único punto de acceso del solicitante a entrevistas.
create function private.vacancy_tracking(p_vacancy uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can_read_vacancy(p_vacancy) then
    return null;
  end if;
  return jsonb_build_object(
    'proxima_entrevista', (
      select jsonb_build_object(
               'inicio', i.inicio,
               'meet_link', i.meet_link,
               'candidato', c.nombre,
               'entrevistadores', (
                 select coalesce(jsonb_agg(p.nombre order by p.nombre), '[]'::jsonb)
                 from public.interview_panel ip
                 join public.profiles p on p.id = ip.profile_id
                 where ip.interview_id = i.id))
      from public.interviews i
      join public.applications a on a.id = i.application_id
      join public.candidates c on c.id = a.candidate_id
      where i.vacancy_id = p_vacancy and i.estado = 'agendada' and i.inicio >= now()
      order by i.inicio
      limit 1),
    'historial', (
      select coalesce(jsonb_agg(
               jsonb_build_object('fecha', i.inicio, 'candidato', c.nombre, 'estado', i.estado)
               order by i.inicio desc), '[]'::jsonb)
      from public.interviews i
      join public.applications a on a.id = i.application_id
      join public.candidates c on c.id = a.candidate_id
      where i.vacancy_id = p_vacancy and i.estado in ('completada', 'cancelada', 'no_show'))
  );
end
$$;

-- Wrapper expuesto por la API (SECURITY INVOKER); la lógica privilegiada queda en "private".
create function public.vacancy_tracking(p_vacancy_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select private.vacancy_tracking(p_vacancy_id)
$$;

-- =====================================================================
-- Reglas de negocio (triggers)
-- =====================================================================

-- ----- Vacantes: coherencia de roles --------------------------------
create function private.vacancy_roles_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = new.hrbp_id and p.role = 'hrbp' and p.activo) then
    raise exception 'El BP de la vacante debe ser un usuario activo con rol HRBP' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.profiles p where p.id = new.hm_id and p.role = 'hm' and p.activo) then
    raise exception 'El Hiring Manager de la vacante debe ser un usuario activo con rol HM' using errcode = 'check_violation';
  end if;
  if new.at_id is not null
     and not exists (select 1 from public.profiles p where p.id = new.at_id and p.role = 'at' and p.activo) then
    raise exception 'El reclutador de la vacante debe ser un usuario activo con rol AT' using errcode = 'check_violation';
  end if;
  if new.solicitante_id is not null
     and not exists (select 1 from public.profiles p where p.id = new.solicitante_id and p.role = 'user' and p.activo) then
    raise exception 'El solicitante debe ser un usuario activo con rol usuario' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create trigger vacancies_roles_check before insert or update of hrbp_id, at_id, hm_id, solicitante_id on public.vacancies
  for each row execute function private.vacancy_roles_check();

-- ----- Vacantes: guardas ---------------------------------------------
create function private.vacancy_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := (select auth.uid());
  v_role public.app_role := private.my_role();
  v_tr   public.stage_transitions%rowtype;
  v_sys  text[] := array['etapa', 'etapa_desde', 'cierre_motivo', 'cerrada_at', 'updated_at'];
  -- Contenido de la requisición: lo edita el HM
  v_content text[] := array['titulo', 'area', 'template_id', 'nivel', 'stack_requerido', 'certificacion_deseable',
                            'exp_minima', 'estudios_minimos', 'habilidades_clave', 'competencias', 'requisitos',
                            'salario_min', 'salario_max', 'solicitante_id', 'hrbp_id'];
  -- Lo único que toca el BP: su validación (+ comentarios) y la asignación del reclutador
  v_bp   text[] := array['bp_validado_at', 'bp_validado_por', 'bp_comentarios', 'bp_devuelta_at', 'at_id'];
begin
  if old.etapa = 'cerrada' then
    raise exception 'La vacante REQ-% ya está cerrada', old.folio using errcode = 'check_violation';
  end if;

  -- Qué columnas puede tocar cada rol (usuarios autenticados; service_role = sistema)
  if v_uid is not null then
    if v_role = 'hm' then
      if (to_jsonb(new) - v_sys - v_content) is distinct from (to_jsonb(old) - v_sys - v_content) then
        raise exception 'El Hiring Manager solo edita el contenido de la requisición'
          using errcode = 'insufficient_privilege';
      end if;
      -- Cualquier cambio del HM es un reenvío al BP; si ya estaba validada, hay que revalidar
      if (to_jsonb(new) - v_sys) is distinct from (to_jsonb(old) - v_sys) then
        new.enviada_at := now();
        if old.bp_validado_at is not null then
          new.bp_validado_at  := null;
          new.bp_validado_por := null;
        end if;
      end if;
    elsif v_role = 'hrbp' then
      if (to_jsonb(new) - v_sys - v_bp) is distinct from (to_jsonb(old) - v_sys - v_bp) then
        raise exception 'El BP solo valida lo que necesita el Hiring Manager (no edita su contenido)'
          using errcode = 'insufficient_privilege';
      end if;
      if new.bp_devuelta_at is not null and new.bp_devuelta_at is distinct from old.bp_devuelta_at then
        -- Devolver exige explicar qué ajustar y deja la requisición sin validar
        if length(btrim(coalesce(new.bp_comentarios, ''))) = 0 then
          raise exception 'Escribe un comentario para que el HM sepa qué ajustar'
            using errcode = 'check_violation';
        end if;
        new.bp_validado_at  := null;
        new.bp_validado_por := null;
      elsif new.bp_validado_at is distinct from old.bp_validado_at then
        new.bp_validado_por := case when new.bp_validado_at is null then null else v_uid end;
      end if;
    else
      if (to_jsonb(new) - v_sys) is distinct from (to_jsonb(old) - v_sys) then
        raise exception 'Tu rol solo puede cambiar la etapa de la vacante'
          using errcode = 'insufficient_privilege';
      end if;
    end if;
  end if;

  -- Cambio de etapa
  if new.etapa is distinct from old.etapa then
    select * into v_tr from public.stage_transitions t where t.desde = old.etapa and t.hacia = new.etapa;
    if not found then
      raise exception 'Transición no permitida: % → %', old.etapa, new.etapa using errcode = 'check_violation';
    end if;
    if v_uid is not null and not (v_role = any (v_tr.roles)) then
      raise exception 'Tu rol no puede mover la vacante de % a %', old.etapa, new.etapa
        using errcode = 'insufficient_privilege';
    end if;

    -- Condiciones de entrada a cada etapa (coherencia del flujo)
    case new.etapa
      when 'alineacion' then
        if new.bp_validado_at is null then
          raise exception 'El BP debe validar la requisición del Hiring Manager antes de pasar a Alineación'
            using errcode = 'check_violation';
        end if;
        if new.at_id is null then
          raise exception 'Asigna un reclutador (AT) antes de pasar a Alineación'
            using errcode = 'check_violation';
        end if;
      when 'atraccion' then
        if not exists (select 1 from public.applications a where a.vacancy_id = new.id) then
          raise exception 'Agrega al menos un candidato antes de pasar a Atracción'
            using errcode = 'check_violation';
        end if;
      when 'seleccion' then
        if not exists (select 1 from public.applications a where a.vacancy_id = new.id and a.estatus <> 'descartado') then
          raise exception 'No hay candidatos vigentes para enviar al Hiring Manager'
            using errcode = 'check_violation';
        end if;
      when 'oferta' then
        if not exists (select 1 from public.applications a where a.vacancy_id = new.id and a.estatus = 'finalista') then
          raise exception 'Marca al menos un finalista antes de pasar a Oferta'
            using errcode = 'check_violation';
        end if;
      when 'cerrada' then
        if new.cierre_motivo = 'contratado' and old.etapa <> 'oferta' then
          raise exception 'Solo se cierra como contratado desde Oferta' using errcode = 'check_violation';
        end if;
      else
        null;
    end case;

    new.etapa_desde := now();
    if new.etapa = 'cerrada' then
      new.cerrada_at := now();
    end if;
  end if;

  return new;
end
$$;

create trigger vacancies_guard before update on public.vacancies
  for each row execute function private.vacancy_guard();

-- ----- Vacantes: historial de etapas + notificaciones ------------------
create function private.vacancy_after()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target smallint;
begin
  if tg_op = 'UPDATE' then
    -- Validación del BP (o revalidación pedida porque el HM cambió la requisición)
    if new.bp_validado_at is not null and old.bp_validado_at is null then
      perform private.notify(new.hm_id, 'requisicion_validada', 'El BP validó tu requisición', new.titulo,
                             new.id, null, null, false, null);
    elsif new.bp_validado_at is null and old.bp_validado_at is not null then
      perform private.notify(new.hrbp_id, 'requisitos_actualizados', 'El HM modificó la requisición: revalídala',
                             new.titulo, new.id, null, null, true, null);
    end if;

    if new.bp_devuelta_at is not null and new.bp_devuelta_at is distinct from old.bp_devuelta_at then
      perform private.notify(new.hm_id, 'requisicion_devuelta', 'El BP devolvió tu requisición',
                             new.titulo || ' — ' || coalesce(new.bp_comentarios, ''), new.id, null, null, true, null);
    end if;
    if new.enviada_at is distinct from old.enviada_at and old.bp_validado_at is null then
      perform private.notify(new.hrbp_id, 'validar_requisicion', 'Requisición reenviada por el HM', new.titulo,
                             new.id, null, null, true, null);
    end if;

    if new.etapa is not distinct from old.etapa then
      return null;
    end if;
    update public.vacancy_stage_history h
       set exited_at = now(),
           dias_habiles_reales = public.business_days_between(h.entered_at, now())
     where h.vacancy_id = new.id and h.exited_at is null;
  end if;

  select s.dias_habiles into v_target from public.sla_targets s where s.nivel = new.nivel and s.etapa = new.etapa;

  insert into public.vacancy_stage_history (vacancy_id, etapa, entered_at, entered_by, dias_habiles_objetivo)
  values (new.id, new.etapa, new.etapa_desde, (select auth.uid()), v_target);

  if tg_op = 'INSERT' then
    perform private.notify(new.hrbp_id, 'validar_requisicion', 'Requisición por validar', new.titulo,
                           new.id, null, null, true, null);
    return null;
  end if;

  case new.etapa
    when 'alineacion' then
      perform private.notify(new.at_id, 'alinear_requisicion', 'Alinear requisición con el HM', new.titulo, new.id, null, null, true, null);
      perform private.notify(new.hm_id, 'alinear_requisicion', 'Alinear requisición con el reclutador', new.titulo, new.id, null, null, false, null);
    when 'busqueda' then
      perform private.notify(new.at_id, 'etapa_cambio', 'Inicia la búsqueda', new.titulo, new.id, null, null, false, null);
    when 'seleccion' then
      perform private.notify(new.hm_id, 'pool_listo', 'Pool de candidatos listo', new.titulo, new.id, null, null, true, null);
    when 'oferta' then
      perform private.notify(new.hrbp_id, 'solicitar_oferta', 'Solicitar carta oferta', new.titulo, new.id, null, null, true, null);
    else
      null;
  end case;
  -- El solicitante siempre se entera del avance
  perform private.notify(new.solicitante_id, 'etapa_cambio', 'Actualización de estatus',
                         new.titulo || ' avanzó a ' || new.etapa::text, new.id, null, null, false, null);

  return null;
end
$$;

create trigger vacancies_after after insert or update on public.vacancies
  for each row execute function private.vacancy_after();

-- ----- Postulaciones ---------------------------------------------------
create function private.application_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_role  public.app_role := private.my_role();
  v_etapa public.vacancy_stage;
  v_free  text[] := array['updated_at'];
  v_ok    boolean;
begin
  select v.etapa into v_etapa from public.vacancies v where v.id = new.vacancy_id;

  if tg_op = 'INSERT' then
    if v_etapa not in ('busqueda', 'atraccion', 'seleccion', 'oferta') then
      raise exception 'Solo se agregan candidatos de Búsqueda a Oferta (etapa actual: %)', v_etapa
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  if new.vacancy_id is distinct from old.vacancy_id or new.candidate_id is distinct from old.candidate_id then
    raise exception 'No se puede mover una postulación a otra vacante o candidato' using errcode = 'check_violation';
  end if;

  if v_uid is not null then
    if v_etapa = 'cerrada' then
      raise exception 'La vacante está cerrada' using errcode = 'check_violation';
    end if;

    if v_role = 'at' then
      -- AT edita datos libremente (compat, custom_fields, estatus), salvo el sello de decisión
      if new.decision_por is distinct from old.decision_por or new.decision_at is distinct from old.decision_at then
        raise exception 'La decisión se registra automáticamente' using errcode = 'insufficient_privilege';
      end if;
    elsif v_role = 'hm' then
      if (to_jsonb(new) - array['estatus', 'decision_justificacion'] - v_free)
         is distinct from (to_jsonb(old) - array['estatus', 'decision_justificacion'] - v_free) then
        raise exception 'El Hiring Manager solo decide el estatus del candidato' using errcode = 'insufficient_privilege';
      end if;
    elsif v_role = 'hrbp' then
      if (to_jsonb(new) - array['estatus'] - v_free) is distinct from (to_jsonb(old) - array['estatus'] - v_free) then
        raise exception 'HRBP solo puede marcar contratado' using errcode = 'insufficient_privilege';
      end if;
    else
      raise exception 'Tu rol no puede modificar postulaciones' using errcode = 'insufficient_privilege';
    end if;

    if new.estatus is distinct from old.estatus then
      v_ok := case v_role
                when 'at'   then new.estatus in ('screening', 'entrevista_agendada', 'en_proceso', 'descartado')
                when 'hm'   then new.estatus in ('en_proceso', 'finalista', 'descartado')
                when 'hrbp' then new.estatus = 'contratado'
                else false
              end;
      if not v_ok then
        raise exception 'Tu rol no puede poner el estatus %', new.estatus using errcode = 'insufficient_privilege';
      end if;
    end if;
  end if;

  -- Sello de decisión
  if new.estatus is distinct from old.estatus then
    if new.estatus in ('finalista', 'descartado', 'contratado') then
      new.decision_por := coalesce(v_uid, new.decision_por);
      new.decision_at  := now();
    else
      new.decision_por := null;
      new.decision_at := null;
      new.decision_justificacion := null;
    end if;
  end if;

  return new;
end
$$;

create trigger applications_guard before insert or update on public.applications
  for each row execute function private.application_guard();

create function private.application_after()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vac  public.vacancies%rowtype;
  v_cand text;
begin
  if new.estatus = 'finalista' and new.estatus is distinct from old.estatus then
    select * into v_vac from public.vacancies v where v.id = new.vacancy_id;
    select c.nombre into v_cand from public.candidates c where c.id = new.candidate_id;
    perform private.notify(v_vac.hrbp_id, 'candidato_finalista', 'Nuevo finalista', v_cand || ' — ' || v_vac.titulo,
                           v_vac.id, new.id, null, true, null);
    perform private.notify(v_vac.at_id, 'candidato_finalista', 'Nuevo finalista', v_cand || ' — ' || v_vac.titulo,
                           v_vac.id, new.id, null, false, null);
  end if;
  return null;
end
$$;

create trigger applications_after after update of estatus on public.applications
  for each row execute function private.application_after();

-- ----- Entrevistas -----------------------------------------------------
create function private.interview_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_etapa public.vacancy_stage;
begin
  select v.etapa into v_etapa from public.vacancies v where v.id = new.vacancy_id;
  if v_etapa = 'cerrada' and (select auth.uid()) is not null then
    raise exception 'La vacante está cerrada' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create trigger interviews_guard before insert or update on public.interviews
  for each row execute function private.interview_guard();

create function private.interview_after()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app  public.applications%rowtype;
  v_vac  public.vacancies%rowtype;
  v_cand text;
  r      record;
begin
  select * into v_app from public.applications a where a.id = new.application_id;
  select * into v_vac from public.vacancies v where v.id = new.vacancy_id;
  select c.nombre into v_cand from public.candidates c where c.id = v_app.candidate_id;

  if tg_op = 'INSERT' then
    if new.estado = 'agendada' and v_app.estatus = 'screening' then
      update public.applications set estatus = 'entrevista_agendada' where id = v_app.id;
    end if;
    perform private.notify(v_vac.hm_id, 'entrevista_agendada', 'Entrevista programada', v_cand || ' — ' || v_vac.titulo,
                           v_vac.id, v_app.id, new.id, false, new.inicio);
    perform private.notify(v_vac.solicitante_id, 'entrevista_agendada', 'Entrevista programada', v_vac.titulo,
                           v_vac.id, v_app.id, new.id, false, new.inicio);

  elsif new.estado is distinct from old.estado then
    if new.estado = 'completada' then
      if v_app.estatus = 'entrevista_agendada' then
        update public.applications set estatus = 'en_proceso' where id = v_app.id;
      end if;
      perform private.notify(v_vac.hm_id, 'feedback_pendiente', 'Evaluar entrevista completada',
                             v_cand || ' — feedback pendiente', v_vac.id, v_app.id, new.id, true, now());
      for r in select ip.profile_id from public.interview_panel ip
               where ip.interview_id = new.id and ip.profile_id is distinct from v_vac.hm_id and ip.veredicto is null
      loop
        perform private.notify(r.profile_id, 'feedback_pendiente', 'Deja tu feedback de la entrevista',
                               v_cand || ' — ' || v_vac.titulo, v_vac.id, v_app.id, new.id, true, now());
      end loop;

    elsif new.estado in ('cancelada', 'no_show') then
      if v_app.estatus = 'entrevista_agendada' and not exists (
           select 1 from public.interviews i
           where i.application_id = v_app.id and i.estado = 'agendada' and i.id <> new.id) then
        update public.applications set estatus = 'screening' where id = v_app.id;
      end if;
    end if;
  end if;
  return null;
end
$$;

create trigger interviews_after after insert or update of estado on public.interviews
  for each row execute function private.interview_after();

-- ----- Panel de entrevistadores ---------------------------------------
create function private.panel_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.profiles p where p.id = new.profile_id and p.activo) then
      raise exception 'El entrevistador no está activo' using errcode = 'check_violation';
    end if;
    new.veredicto := null;
    new.notas := null;
    new.feedback_at := null;
    return new;
  end if;

  if v_uid is not null then
    if (to_jsonb(new) - array['veredicto', 'notas', 'feedback_at'])
       is distinct from (to_jsonb(old) - array['veredicto', 'notas', 'feedback_at']) then
      raise exception 'Solo puedes editar tu feedback' using errcode = 'insufficient_privilege';
    end if;
    if not exists (select 1 from public.interviews i where i.id = new.interview_id and i.estado = 'completada') then
      raise exception 'El feedback se captura cuando la entrevista está completada' using errcode = 'check_violation';
    end if;
  end if;

  if new.veredicto is distinct from old.veredicto then
    new.feedback_at := case when new.veredicto is null then null else now() end;
  end if;
  return new;
end
$$;

create trigger interview_panel_guard before insert or update on public.interview_panel
  for each row execute function private.panel_guard();

create function private.panel_after()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_int  public.interviews%rowtype;
  v_vac  public.vacancies%rowtype;
  v_cand text;
begin
  select * into v_int from public.interviews i where i.id = new.interview_id;
  select * into v_vac from public.vacancies v where v.id = v_int.vacancy_id;
  select c.nombre into v_cand
    from public.applications a join public.candidates c on c.id = a.candidate_id
   where a.id = v_int.application_id;
  perform private.notify(new.profile_id, 'entrevista_agendada', 'Te asignaron una entrevista',
                         v_cand || ' — ' || v_vac.titulo, v_vac.id, v_int.application_id, v_int.id, false, v_int.inicio);
  return null;
end
$$;

create trigger interview_panel_after after insert on public.interview_panel
  for each row execute function private.panel_after();

-- =====================================================================
-- Vista de vacantes con SLA calculado (reemplaza el color de SLA fijo del mock)
--   verde: < 80% del objetivo · amarillo: ≥ 80% · rojo: > objetivo
-- =====================================================================
create view public.vacancy_overview
with (security_invoker = true) as
select
  v.id,
  v.folio,
  v.titulo,
  v.area,
  t.categoria,
  v.nivel,
  v.etapa,
  (array_position(enum_range(null::public.vacancy_stage), v.etapa) - 1) as etapa_indice,
  v.etapa_desde,
  v.hrbp_id,
  v.at_id,
  v.hm_id,
  v.solicitante_id,
  v.bp_validado_at,
  v.bp_devuelta_at,
  v.bp_comentarios,
  v.enviada_at,
  case
    when v.bp_validado_at is not null then 'validada'
    when v.bp_devuelta_at is not null and v.bp_devuelta_at >= v.enviada_at then 'devuelta'
    else 'por_validar'
  end as bp_estado,
  -- Bandeja del BP: requisiciones nuevas o reenviadas/cambiadas que aún no valida
  (v.etapa <> 'cerrada' and v.bp_validado_at is null
     and not (v.bp_devuelta_at is not null and v.bp_devuelta_at >= v.enviada_at)) as pendiente_bp,
  -- Contenido de la requisición (el solicitante no ve la banda salarial)
  v.stack_requerido,
  v.certificacion_deseable,
  v.exp_minima,
  v.estudios_minimos,
  v.habilidades_clave,
  v.competencias,
  case when private.my_role() <> 'user' then v.salario_min end as salario_min,
  case when private.my_role() <> 'user' then v.salario_max end as salario_max,
  hp.nombre  as hrbp_nombre,
  ap.nombre  as at_nombre,
  hmp.nombre as hm_nombre,
  sp.nombre  as solicitante_nombre,
  private.active_applications_count(v.id) as candidatos_activos,
  public.business_days_between(v.etapa_desde, now()) as dias_habiles_en_etapa,
  s.dias_habiles as dias_habiles_objetivo,
  case
    when v.etapa = 'cerrada' or s.dias_habiles is null then null
    when public.business_days_between(v.etapa_desde, now()) > s.dias_habiles then 'rojo'
    when public.business_days_between(v.etapa_desde, now()) >= ceil(s.dias_habiles * 0.8) then 'amarillo'
    else 'verde'
  end as sla,
  v.created_at
from public.vacancies v
join public.vacancy_templates t on t.id = v.template_id
left join public.profiles hp  on hp.id  = v.hrbp_id
left join public.profiles ap  on ap.id  = v.at_id
left join public.profiles hmp on hmp.id = v.hm_id
left join public.profiles sp  on sp.id  = v.solicitante_id
left join public.sla_targets s on s.nivel = v.nivel and s.etapa = v.etapa;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles               enable row level security;
alter table public.holidays               enable row level security;
alter table public.competencies           enable row level security;
alter table public.vacancy_templates      enable row level security;
alter table public.sla_targets            enable row level security;
alter table public.stage_transitions      enable row level security;
alter table public.vacancies              enable row level security;
alter table public.vacancy_stage_history  enable row level security;
alter table public.candidates             enable row level security;
alter table public.candidate_languages    enable row level security;
alter table public.candidate_attributes   enable row level security;
alter table public.applications           enable row level security;
alter table public.interviews             enable row level security;
alter table public.interview_panel        enable row level security;
alter table public.notifications          enable row level security;
alter table public.ai_conversations       enable row level security;
alter table public.ai_messages            enable row level security;

-- Perfiles: directorio visible para usuarios autenticados; cada quien edita lo suyo (columnas limitadas por GRANT)
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Catálogos: lectura para todos; HRBP administra plantillas y competencias
create policy holidays_select          on public.holidays          for select to authenticated using (true);
create policy sla_targets_select       on public.sla_targets       for select to authenticated using (true);
create policy stage_transitions_select on public.stage_transitions for select to authenticated using (true);
create policy competencies_select      on public.competencies      for select to authenticated using (true);
create policy templates_select         on public.vacancy_templates for select to authenticated using (true);

create policy competencies_insert on public.competencies for insert to authenticated
  with check (private.my_role() = 'hrbp');
create policy competencies_update on public.competencies for update to authenticated
  using (private.my_role() = 'hrbp') with check (private.my_role() = 'hrbp');
create policy templates_insert on public.vacancy_templates for insert to authenticated
  with check (private.my_role() = 'hrbp');
create policy templates_update on public.vacancy_templates for update to authenticated
  using (private.my_role() = 'hrbp') with check (private.my_role() = 'hrbp');

-- Vacantes
-- Condición inline (no solo función STABLE): INSERT ... RETURNING evalúa esta política
-- con el snapshot previo a la fila nueva, y una función no vería la vacante recién creada.
create policy vacancies_select on public.vacancies for select to authenticated
  using ((select auth.uid()) in (hrbp_id, at_id, hm_id, solicitante_id) or private.is_panelist(id));
create policy vacancies_insert on public.vacancies for insert to authenticated
  with check (
    private.my_role() = 'hm' and hm_id = (select auth.uid()) and etapa = 'requisicion'
    and bp_validado_at is null and bp_validado_por is null and at_id is null
  );
create policy vacancies_update on public.vacancies for update to authenticated
  using ((select auth.uid()) in (hrbp_id, at_id, hm_id))
  with check ((select auth.uid()) in (hrbp_id, at_id, hm_id));

create policy stage_history_select on public.vacancy_stage_history for select to authenticated
  using (private.can_read_vacancy(vacancy_id));

-- Candidatos (los ve quien participa en alguna vacante donde aplicó; NO el solicitante)
create policy candidates_select on public.candidates for select to authenticated
  using (created_by = (select auth.uid()) or private.can_access_candidate(id));
create policy candidates_insert on public.candidates for insert to authenticated
  with check (private.my_role() = 'at' and created_by = (select auth.uid()));
create policy candidates_update on public.candidates for update to authenticated
  using (private.my_role() = 'at' and private.can_access_candidate(id))
  with check (private.my_role() = 'at' and private.can_access_candidate(id));

create policy candidate_languages_select on public.candidate_languages for select to authenticated
  using (private.can_access_candidate(candidate_id));
create policy candidate_languages_write on public.candidate_languages for insert to authenticated
  with check (private.my_role() = 'at' and private.can_access_candidate(candidate_id));
create policy candidate_languages_update on public.candidate_languages for update to authenticated
  using (private.my_role() = 'at' and private.can_access_candidate(candidate_id))
  with check (private.my_role() = 'at' and private.can_access_candidate(candidate_id));
create policy candidate_languages_delete on public.candidate_languages for delete to authenticated
  using (private.my_role() = 'at' and private.can_access_candidate(candidate_id));

create policy candidate_attributes_select on public.candidate_attributes for select to authenticated
  using (private.can_access_candidate(candidate_id));
create policy candidate_attributes_insert on public.candidate_attributes for insert to authenticated
  with check (private.my_role() in ('at', 'hm') and private.can_access_candidate(candidate_id));
create policy candidate_attributes_delete on public.candidate_attributes for delete to authenticated
  using (private.my_role() in ('at', 'hm') and private.can_access_candidate(candidate_id));

-- Postulaciones
create policy applications_select on public.applications for select to authenticated
  using (private.can_read_candidates(vacancy_id));
create policy applications_insert on public.applications for insert to authenticated
  with check (
    private.my_role() = 'at'
    and created_by = (select auth.uid())
    and exists (select 1 from public.vacancies v where v.id = vacancy_id and v.at_id = (select auth.uid()))
  );
create policy applications_update on public.applications for update to authenticated
  using (private.my_role() in ('at', 'hm', 'hrbp') and private.can_read_candidates(vacancy_id))
  with check (private.my_role() in ('at', 'hm', 'hrbp') and private.can_read_candidates(vacancy_id));

-- Entrevistas
create policy interviews_select on public.interviews for select to authenticated
  using (private.can_read_candidates(vacancy_id));
create policy interviews_insert on public.interviews for insert to authenticated
  with check (
    private.my_role() = 'at'
    and agendada_por = (select auth.uid())
    and exists (select 1 from public.vacancies v where v.id = vacancy_id and v.at_id = (select auth.uid()))
  );
create policy interviews_update on public.interviews for update to authenticated
  using (private.my_role() = 'at'
         and exists (select 1 from public.vacancies v where v.id = vacancy_id and v.at_id = (select auth.uid())))
  with check (private.my_role() = 'at'
         and exists (select 1 from public.vacancies v where v.id = vacancy_id and v.at_id = (select auth.uid())));

create policy panel_select on public.interview_panel for select to authenticated
  using (private.can_read_interview(interview_id));
create policy panel_insert on public.interview_panel for insert to authenticated
  with check (
    private.my_role() = 'at'
    and exists (select 1 from public.interviews i join public.vacancies v on v.id = i.vacancy_id
                where i.id = interview_id and v.at_id = (select auth.uid()))
  );
create policy panel_update_own on public.interview_panel for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy panel_delete on public.interview_panel for delete to authenticated
  using (
    private.my_role() = 'at'
    and exists (select 1 from public.interviews i join public.vacancies v on v.id = i.vacancy_id
                where i.id = interview_id and v.at_id = (select auth.uid()))
  );

-- Notificaciones: cada quien las suyas (se crean solo por trigger / service_role)
create policy notifications_select on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));

-- Chat de IA: privado por usuario (el solicitante no lo usa)
create policy ai_conversations_select on public.ai_conversations for select to authenticated
  using (user_id = (select auth.uid()));
create policy ai_conversations_insert on public.ai_conversations for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.my_role() in ('hrbp', 'at', 'hm')
    and (vacancy_id is null or private.can_read_candidates(vacancy_id))
  );
create policy ai_conversations_delete on public.ai_conversations for delete to authenticated
  using (user_id = (select auth.uid()));

create policy ai_messages_select on public.ai_messages for select to authenticated
  using (exists (select 1 from public.ai_conversations c
                 where c.id = conversation_id and c.user_id = (select auth.uid())));
create policy ai_messages_insert on public.ai_messages for insert to authenticated
  with check (exists (select 1 from public.ai_conversations c
                      where c.id = conversation_id and c.user_id = (select auth.uid())));

-- =====================================================================
-- Storage (buckets privados)
--   cvs             : {candidate_id}/{archivo}      — CVs de candidatos
--   interview-notes : {interview_id}/{archivo}      — notas de Meet/Gemini exportadas (solo service_role escribe)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cvs', 'cvs', false, 10485760, array[
     'application/pdf',
     'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('interview-notes', 'interview-notes', false, 5242880, array[
     'application/pdf',
     'text/plain',
     'text/markdown',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

-- Subir/reemplazar (upsert) requiere INSERT + SELECT + UPDATE
create policy "cvs_select" on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and private.can_access_candidate(private.try_uuid((storage.foldername(name))[1])));
create policy "cvs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and private.my_role() = 'at'
              and private.can_access_candidate(private.try_uuid((storage.foldername(name))[1])));
create policy "cvs_update" on storage.objects for update to authenticated
  using (bucket_id = 'cvs' and private.my_role() = 'at'
         and private.can_access_candidate(private.try_uuid((storage.foldername(name))[1])))
  with check (bucket_id = 'cvs' and private.my_role() = 'at'
              and private.can_access_candidate(private.try_uuid((storage.foldername(name))[1])));
create policy "cvs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and private.my_role() = 'at'
         and private.can_access_candidate(private.try_uuid((storage.foldername(name))[1])));

create policy "interview_notes_select" on storage.objects for select to authenticated
  using (bucket_id = 'interview-notes' and private.can_read_interview(private.try_uuid((storage.foldername(name))[1])));

-- =====================================================================
-- Integración con Google Workspace
-- =====================================================================

-- Refresh tokens de Google (Calendar/Drive/Gmail) de cada usuario. Se guardan CIFRADOS (AES-256-GCM)
-- por el servidor; sin políticas RLS ni GRANT a authenticated: solo service_role (rutas /api) puede leerlos.
create table public.google_credentials (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  refresh_token_enc text not null,
  scopes            text,
  updated_at        timestamptz not null default now()
);
alter table public.google_credentials enable row level security;
create trigger google_credentials_updated_at before update on public.google_credentials
  for each row execute function private.set_updated_at();

-- Bitácora de correos enviados al candidato por Gmail (estatus por etapa, cierre del proceso)
create table public.candidate_messages (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  plantilla      text not null check (plantilla in ('recibida', 'avanza', 'entrevista', 'cierre')),
  asunto         text not null,
  gmail_message_id text,
  enviado_por    uuid references public.profiles (id),
  enviado_at     timestamptz not null default now()
);
create index candidate_messages_application_idx on public.candidate_messages (application_id, enviado_at desc);
create index candidate_messages_enviado_por_idx on public.candidate_messages (enviado_por);
alter table public.candidate_messages enable row level security;
create policy candidate_messages_select on public.candidate_messages for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and private.can_read_candidates(a.vacancy_id)));

-- =====================================================================
-- Privilegios (Data API): explícitos, mínimos; RLS decide las filas
-- =====================================================================
revoke all on all tables    in schema public from anon;
revoke all on all functions in schema public from anon;
revoke execute on function public.business_days_between(timestamptz, timestamptz) from public;
revoke execute on function public.vacancy_tracking(uuid) from public;

grant select                       on public.profiles              to authenticated;
grant update (nombre, avatar_url)  on public.profiles              to authenticated;   -- NO role/activo/email
grant select                       on public.holidays, public.sla_targets, public.stage_transitions to authenticated;
grant select, insert, update       on public.competencies, public.vacancy_templates                 to authenticated;
grant select, insert, update       on public.vacancies             to authenticated;
grant select                       on public.vacancy_stage_history to authenticated;
grant select, insert, update       on public.candidates            to authenticated;
grant select, insert, update, delete on public.candidate_languages to authenticated;
grant select, insert, delete       on public.candidate_attributes  to authenticated;
grant select, insert, update       on public.applications          to authenticated;
grant select, insert, update       on public.interviews            to authenticated;
grant select, insert, update, delete on public.interview_panel     to authenticated;
grant select                       on public.notifications         to authenticated;
grant update (leida_at)            on public.notifications         to authenticated;
grant select, insert, delete       on public.ai_conversations      to authenticated;
grant select, insert               on public.ai_messages           to authenticated;
grant select                       on public.vacancy_overview      to authenticated;
grant select                       on public.candidate_messages    to authenticated;
grant execute on function public.business_days_between(timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.vacancy_tracking(uuid) to authenticated, service_role;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- =====================================================================
-- Realtime (dashboards y notificaciones en vivo)
-- =====================================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime
      add table public.vacancies, public.applications, public.interviews, public.notifications;
  end if;
end $$;
