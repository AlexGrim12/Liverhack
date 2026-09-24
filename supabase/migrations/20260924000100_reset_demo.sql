-- Reinicio de la base al HAPPY PATH de la demo, como función: la llama la app (botón oculto, solo HRBP) y también se puede
-- correr a mano desde el SQL Editor con `select public.reset_demo();`
-- Borra lo transaccional (vacantes, candidatos, entrevistas, notificaciones, chat de IA), reinicia folios y lo vuelve a crear.
-- Conserva usuarios/perfiles, catálogos (plantillas, SLA, festivos, transiciones) y credenciales de Google.
-- Requiere los 12 usuarios demo (node scripts/create-demo-users.mjs) y supabase/seed.sql aplicado.
-- Solo service_role puede ejecutarla: ni anon ni usuarios autenticados.

create or replace function private.bd_ago(n int) returns timestamptz language plpgsql set search_path = '' as $$
declare d date := current_date; k int := 0;
begin
  while k < n loop
    d := d - 1;
    if extract(isodow from d) < 6 and not exists (select 1 from public.holidays h where h.fecha = d) then k := k + 1; end if;
  end loop;
  return (d::timestamp + interval '10 hours') at time zone 'America/Mexico_City';
end $$;

create or replace function private.demo_uid(p_email text) returns uuid language sql set search_path = '' as $$
  select id from public.profiles where email = p_email || '@demo.liverpool.test'
$$;

create or replace function public.reset_demo() returns void
language plpgsql security definer set search_path = ''
as $fn$
declare
  n int;
  hrbp   uuid := private.demo_uid('patricia.vega');
  sofia  uuid := private.demo_uid('sofia.martinez');
  andrea uuid := private.demo_uid('andrea.lopez');
  jorge  uuid := private.demo_uid('jorge.salinas');
  luis   uuid := private.demo_uid('luis.herrera');
  valeria uuid := private.demo_uid('valeria.campos');
  ricardo uuid := private.demo_uid('ricardo.mena');
  diego  uuid := private.demo_uid('diego.ramirez');
  karla  uuid := private.demo_uid('karla.ibarra');
  carlos uuid := private.demo_uid('carlos.nunez');
  renata uuid := private.demo_uid('renata.cifuentes');
  pablo  uuid := private.demo_uid('pablo.estrada');

  t_ti  uuid := (select id from public.vacancy_templates where categoria = 'TI-Sistemas');
  t_mkt uuid := (select id from public.vacancy_templates where categoria = 'Mercadotecnia');
  t_log uuid := (select id from public.vacancy_templates where categoria = 'Logística');

  v1 uuid; v2 uuid; v3 uuid; v4 uuid;
  mariana uuid; emiliano uuid; daniela uuid; ximena uuid; rodrigo uuid; paulina uuid;
  a_mariana uuid; a_emiliano uuid; a_daniela uuid; a_ximena uuid; a_rodrigo uuid; a_paulina uuid;
  i uuid;
begin
-- ---- Perfiles: rol, cargo y nombre de cada usuario demo ---------------------------------
update public.profiles p set role = d.role::public.app_role, nombre = d.nombre, cargo = d.cargo, area = d.area
from (values
  ('patricia.vega@demo.liverpool.test',  'hrbp', 'Patricia Vega',       'HR Business Partner', 'Recursos Humanos'),
  ('sofia.martinez@demo.liverpool.test', 'at',   'Sofía Martínez',      'Reclutadora',         'Reclutamiento'),
  ('andrea.lopez@demo.liverpool.test',   'at',   'Andrea López',        'Reclutadora',         'Reclutamiento'),
  ('jorge.salinas@demo.liverpool.test',  'at',   'Jorge Salinas',       'Reclutador',          'Reclutamiento'),
  ('luis.herrera@demo.liverpool.test',   'hm',   'Luis Herrera',        'Gerente de Ingeniería','TI y Sistemas'),
  ('valeria.campos@demo.liverpool.test', 'hm',   'Valeria Campos',      'Gerente de Marketing','Mercadotecnia'),
  ('ricardo.mena@demo.liverpool.test',   'hm',   'Ricardo Mena',        'Gerente de Logística','Logística'),
  ('diego.ramirez@demo.liverpool.test',  'hm',   'Diego Ramírez',       'Tech Lead',           'TI y Sistemas'),
  ('karla.ibarra@demo.liverpool.test',   'hm',   'Karla Ibarra',        'Product Lead',        'TI y Sistemas'),
  ('carlos.nunez@demo.liverpool.test',   'user', 'Carlos Núñez Ibarra', 'Director de Pagos',   'TI y Sistemas'),
  ('renata.cifuentes@demo.liverpool.test','user','Renata Cifuentes',    'Directora Comercial', 'Mercadotecnia'),
  ('pablo.estrada@demo.liverpool.test',  'user', 'Pablo Estrada',       'Director de Operaciones','Logística')
) as d(email, role, nombre, cargo, area)
where p.email = d.email;

  select count(*) into n from public.profiles where email like '%@demo.liverpool.test';
  if n <> 12 then
    raise exception 'Faltan usuarios demo (%/12). Ejecuta primero: node scripts/create-demo-users.mjs', n;
  end if;

-- ---- REINICIO: borra lo transaccional y reinicia los folios (REQ-000001 …) ----------------
truncate table public.ai_messages, public.ai_conversations, public.candidate_messages, public.notifications,
  public.interview_panel, public.interviews, public.candidate_attributes, public.candidate_languages,
  public.applications, public.candidates, public.vacancy_stage_history, public.vacancies
  restart identity cascade;

  -- =========================== v1 · Backend Developer Sr — Pagos (Selección, amarillo) ===========================
  insert into public.vacancies (titulo, area, template_id, nivel, hm_id, hrbp_id, solicitante_id,
      stack_requerido, certificacion_deseable, exp_minima, estudios_minimos, habilidades_clave, competencias,
      salario_min, salario_max)
  values ('Backend Developer Sr — Equipo Pagos', 'TI y Sistemas', t_ti, 'medio', luis, hrbp, carlos,
      array['Node.js','AWS','Docker'], 'AWS Certified Solutions Architect', 3, 'licenciatura',
      'Arquitectura de microservicios en sistemas de pagos', array['Liderazgo','Comunicación efectiva'], 55000, 75000)
  returning id into v1;
  update public.vacancies set bp_validado_at = now(), bp_comentarios = 'Banda dentro del presupuesto del área.', at_id = sofia, etapa = 'alineacion' where id = v1;
  update public.vacancies set etapa = 'busqueda' where id = v1;

  insert into public.candidates (nombre, email, nivel_estudios, institucion, carrera, compensacion_actual, compensacion_deseada, fuente, aviso_privacidad_at, created_by)
  values ('Mariana Coronado Reyes', 'mariana.coronado@example.com', 'licenciatura', 'UNAM', 'Ing. en Computación', 55000, 68000, 'Bolsa de trabajo', now(), sofia)
  returning id into mariana;
  insert into public.candidates (nombre, email, nivel_estudios, institucion, carrera, compensacion_actual, compensacion_deseada, fuente, aviso_privacidad_at, created_by)
  values ('Emiliano Vázquez Tello', 'emiliano.vazquez@example.com', 'licenciatura', 'ITESO', 'Ing. en Sistemas', 48000, 60000, 'Referido', now(), sofia)
  returning id into emiliano;
  insert into public.candidates (nombre, email, nivel_estudios, institucion, carrera, compensacion_actual, compensacion_deseada, fuente, aviso_privacidad_at, created_by)
  values ('Daniela Ríos Landa', 'daniela.rios@example.com', 'licenciatura', 'Tec de Monterrey', 'Ing. en TI', 42000, 52000, 'Chatbot', now(), sofia)
  returning id into daniela;

  insert into public.candidate_languages (candidate_id, idioma, nivel) values
    (mariana, 'Inglés', 'avanzado'), (emiliano, 'Inglés', 'intermedio'), (daniela, 'Inglés', 'basico');
  insert into public.candidate_attributes (candidate_id, tag, fuente, contexto) values
    (mariana, 'AWS Certified', 'cv', 'Sección certificaciones'),
    (mariana, 'Liderazgo de equipo', 'entrevista', 'Lideró a 4 desarrolladores'),
    (mariana, 'Arquitectura de microservicios', 'entrevista', 'Sistemas transaccionales de alto volumen'),
    (emiliano, 'Certificación Scrum', 'cv', 'Sección certificaciones'),
    (emiliano, 'Mentoría técnica', 'cv', 'Experiencia previa'),
    (daniela, 'Google Cloud Certified', 'cv', 'Sección certificaciones');

  insert into public.applications (vacancy_id, candidate_id, compat_pct, compat_fuente, created_by)
  values (v1, mariana, 94, 'ia', sofia) returning id into a_mariana;
  insert into public.applications (vacancy_id, candidate_id, compat_pct, compat_fuente, created_by)
  values (v1, emiliano, 81, 'ia', sofia) returning id into a_emiliano;
  insert into public.applications (vacancy_id, candidate_id, compat_pct, compat_fuente, created_by)
  values (v1, daniela, 68, 'ia', sofia) returning id into a_daniela;

  update public.vacancies set etapa = 'atraccion' where id = v1;
  update public.vacancies set etapa = 'seleccion' where id = v1;

  -- Mariana, ronda 1: screening de RH con Sofía (la hace el AT), completado hace 8 días hábiles
  insert into public.interviews (application_id, vacancy_id, tipo, estado, inicio, fin, meet_link, agendada_por)
  values (a_mariana, v1, 'screening', 'agendada', private.bd_ago(8) + interval '5 hours', private.bd_ago(8) + interval '5 hours 30 minutes', 'meet.google.com/mar-scr-000', sofia)
  returning id into i;
  insert into public.interview_panel (interview_id, profile_id) values (i, sofia);
  update public.interviews set estado = 'completada', resumen_actualizado_at = now(),
      resumen_ia = 'Disponible en 30 días, pretensión de $68,000 dentro de la banda, inglés avanzado y esquema híbrido en CDMX sin problema.',
      resumen_puntos = array['Disponible en 30 días','Pretensión dentro de la banda','Inglés avanzado']
    where id = i;
  update public.interview_panel set veredicto = 'recomendado',
      notas = 'Disponibilidad en 30 días, pretensión de $68,000 dentro de la banda, inglés avanzado y esquema híbrido en CDMX sin problema.'
    where interview_id = i and profile_id = sofia;

  -- Mariana, ronda 2: entrevista técnica completada hace 3 días hábiles, con el feedback ya capturado por el panel
  insert into public.interviews (application_id, vacancy_id, tipo, estado, inicio, fin, meet_link, agendada_por)
  values (a_mariana, v1, 'tecnica', 'agendada', private.bd_ago(3) + interval '5 hours', private.bd_ago(3) + interval '6 hours', 'meet.google.com/mar-tech-001', sofia)
  returning id into i;
  insert into public.interview_panel (interview_id, profile_id) values (i, diego), (i, karla);
  update public.interview_panel set veredicto = 'recomendado',
      notas = 'Fuerte en fundamentos de sistemas distribuidos y mentoría. Muy recomendable para el equipo de pagos.'
    where interview_id = i and profile_id = diego;
  update public.interview_panel set veredicto = 'recomendado',
      notas = 'Excelente comunicación con negocio. Entiende las métricas de conversión de liverpool.com.mx.'
    where interview_id = i and profile_id = karla;
  update public.interviews set estado = 'completada', resumen_actualizado_at = now(),
      resumen_ia = 'Mariana demostró un dominio muy sólido en arquitecturas de microservicios y AWS en entornos transaccionales de alto volumen. Explicó con claridad la resolución de concurrencia y su liderazgo con un equipo de 4 desarrolladores. Su inglés técnico es fluido y mostró excelente alineación con la cultura técnica de Liverpool.',
      resumen_puntos = array['Microservicios AWS','Mentoría de equipo','Inglés técnico C1']
    where id = i;

  -- Emiliano: entrevista técnica agendada en 3 días
  insert into public.interviews (application_id, vacancy_id, tipo, estado, inicio, fin, meet_link, agendada_por)
  values (a_emiliano, v1, 'tecnica', 'agendada', now() + interval '3 days', now() + interval '3 days 1 hour', 'meet.google.com/emi-tech-002', sofia)
  returning id into i;
  insert into public.interview_panel (interview_id, profile_id) values (i, diego), (i, karla);

  -- =========================== v2 · Marketing Digital (Atracción, verde) ===========================
  insert into public.vacancies (titulo, area, template_id, nivel, hm_id, hrbp_id, solicitante_id,
      stack_requerido, certificacion_deseable, exp_minima, habilidades_clave, competencias, salario_min, salario_max)
  values ('Especialista en Marketing Digital', 'Mercadotecnia', t_mkt, 'medio', valeria, hrbp, renata,
      array['Google Ads','Analytics'], 'Google Ads Certified', 2, 'Campañas de performance y reporteo',
      array['Orientación a resultados'], 38000, 48000)
  returning id into v2;
  update public.vacancies set bp_validado_at = now(), at_id = andrea, etapa = 'alineacion' where id = v2;
  update public.vacancies set etapa = 'busqueda' where id = v2;
  insert into public.candidates (nombre, email, institucion, carrera, compensacion_actual, compensacion_deseada, fuente, aviso_privacidad_at, created_by)
  values ('Ximena Alcántara Robles', 'ximena.alcantara@example.com', 'Universidad Iberoamericana', 'Mercadotecnia', 38000, 46000, 'Bolsa de trabajo', now(), andrea)
  returning id into ximena;
  insert into public.candidate_languages (candidate_id, idioma, nivel) values (ximena, 'Inglés', 'avanzado');
  insert into public.candidate_attributes (candidate_id, tag, fuente, contexto) values (ximena, 'Google Ads Certified', 'cv', 'Sección certificaciones');
  insert into public.applications (vacancy_id, candidate_id, compat_pct, compat_fuente, created_by)
  values (v2, ximena, 76, 'ia', andrea) returning id into a_ximena;
  update public.vacancies set etapa = 'atraccion' where id = v2;
  insert into public.interviews (application_id, vacancy_id, tipo, estado, inicio, fin, meet_link, agendada_por)
  values (a_ximena, v2, 'screening', 'agendada', now() + interval '1 day', now() + interval '1 day 30 minutes', 'meet.google.com/xim-scr-003', andrea)
  returning id into i;
  insert into public.interview_panel (interview_id, profile_id) values (i, andrea);

  -- =========================== v3 · Coordinador de Logística (Oferta, rojo) ===========================
  insert into public.vacancies (titulo, area, template_id, nivel, hm_id, hrbp_id, solicitante_id,
      stack_requerido, certificacion_deseable, exp_minima, habilidades_clave, competencias, salario_min, salario_max)
  values ('Coordinador de Logística CDMX', 'Logística', t_log, 'medio', ricardo, hrbp, pablo,
      array['SAP WM','Comercio Exterior'], 'Certificación en Comercio Exterior', 3, 'Operación de centros de distribución',
      array['Liderazgo','Trabajo en equipo'], 34000, 42000)
  returning id into v3;
  update public.vacancies set bp_validado_at = now(), at_id = jorge, etapa = 'alineacion' where id = v3;
  update public.vacancies set etapa = 'busqueda' where id = v3;
  insert into public.candidates (nombre, email, nivel_estudios, institucion, carrera, compensacion_actual, compensacion_deseada, fuente, aviso_privacidad_at, created_by)
  values ('Rodrigo Beltrán Ochoa', 'rodrigo.beltran@example.com', 'licenciatura', 'IPN', 'Ing. Industrial', 34000, 40000, 'Referido', now(), jorge)
  returning id into rodrigo;
  insert into public.candidates (nombre, email, institucion, carrera, compensacion_actual, compensacion_deseada, fuente, aviso_privacidad_at, created_by)
  values ('Paulina Estrada Cano', 'paulina.estrada@example.com', 'Universidad Anáhuac', 'Logística', 32000, 39000, 'Bolsa de trabajo', now(), jorge)
  returning id into paulina;
  insert into public.candidate_languages (candidate_id, idioma, nivel) values (rodrigo, 'Inglés', 'intermedio'), (paulina, 'Inglés', 'basico');
  insert into public.candidate_attributes (candidate_id, tag, fuente, contexto) values
    (rodrigo, 'Certificación en Comercio Exterior', 'cv', 'Sección certificaciones'),
    (paulina, 'Manejo de SAP WM', 'cv', 'Experiencia previa');
  insert into public.applications (vacancy_id, candidate_id, compat_pct, compat_fuente, created_by)
  values (v3, rodrigo, 72, 'ia', jorge) returning id into a_rodrigo;
  insert into public.applications (vacancy_id, candidate_id, compat_pct, compat_fuente, created_by)
  values (v3, paulina, 65, 'ia', jorge) returning id into a_paulina;
  update public.vacancies set etapa = 'atraccion' where id = v3;
  update public.vacancies set etapa = 'seleccion' where id = v3;

  insert into public.interviews (application_id, vacancy_id, tipo, estado, inicio, fin, meet_link, agendada_por)
  values (a_rodrigo, v3, 'tecnica', 'agendada', private.bd_ago(8) + interval '5 hours', private.bd_ago(8) + interval '6 hours', 'meet.google.com/rod-tech-004', jorge)
  returning id into i;
  insert into public.interview_panel (interview_id, profile_id) values (i, ricardo);
  update public.interview_panel set veredicto = 'recomendado', notas = 'Conoce la operación del CEDIS y cumple la banda.' where interview_id = i and profile_id = ricardo;
  update public.interviews set estado = 'completada', resumen_actualizado_at = now(),
      resumen_ia = 'Rodrigo mostró experiencia sólida en operación de centros de distribución y comercio exterior, con resultados medibles en tiempos de despacho.',
      resumen_puntos = array['Comercio exterior','Operación de CEDIS'] where id = i;

  update public.applications set estatus = 'finalista', decision_por = ricardo where id = a_rodrigo;
  update public.applications set estatus = 'descartado', decision_por = jorge,
      decision_justificacion = 'No cubre la certificación en comercio exterior requerida.' where id = a_paulina;
  update public.vacancies set etapa = 'oferta' where id = v3;

  -- =========================== v4 · Ejecutivo de Ventas Digital (Requisición, por validar por el BP) ===========================
  insert into public.vacancies (titulo, area, template_id, nivel, hm_id, hrbp_id, solicitante_id,
      stack_requerido, certificacion_deseable, exp_minima, habilidades_clave, competencias, salario_min, salario_max)
  values ('Ejecutivo de Ventas Digital', 'Mercadotecnia', t_mkt, 'bajo', valeria, hrbp, renata,
      array['SEO/SEM','Meta Ads'], 'Meta Certified Digital Marketing Associate', 2, 'Venta consultiva digital y seguimiento de leads',
      array['Comunicación efectiva','Orientación a resultados'], 28000, 36000)
  returning id into v4;

  -- ---- SLA realista: retroceder cuándo entró cada vacante a su etapa actual (días hábiles) ----
  update public.vacancies set etapa_desde = private.bd_ago(7)  where id = v1;   -- Selección, objetivo 8 → amarillo
  update public.vacancies set etapa_desde = private.bd_ago(1)  where id = v2;   -- Atracción, objetivo 5 → verde
  update public.vacancies set etapa_desde = private.bd_ago(11) where id = v3;   -- Oferta,    objetivo 5 → rojo
  update public.vacancy_stage_history h set entered_at = v.etapa_desde
    from public.vacancies v where h.vacancy_id = v.id and h.exited_at is null and v.id in (v1, v2, v3);

  -- Las notificaciones históricas generadas al sembrar no deben aparecer como pendientes viejos:
  -- se dejan solo las de las acciones realmente abiertas (requisición por validar, feedback del HM, etc.)
  update public.notifications set leida_at = now()
   where vacancy_id in (v1, v2)
     and tipo in ('etapa_cambio', 'validar_requisicion', 'alinear_requisicion', 'requisicion_validada', 'pool_listo', 'entrevista_agendada', 'candidato_finalista');
  -- v3 ya tiene finalista y va en Oferta: solo queda abierta la acción del BP (solicitar carta oferta)
  update public.notifications set leida_at = now()
   where vacancy_id = v3 and tipo <> 'solicitar_oferta';

  -- Aviso para el HRBP: queda registrado que se restauró la base (aparece en su campana de notificaciones)
  perform private.notify(hrbp, 'general', 'Base restaurada al happy path',
    'La base se restauró con el atajo oculto a las ' || to_char(now() at time zone 'America/Mexico_City', 'HH24:MI') || '.',
    null, null, null, false, null);
end $fn$;

revoke all on function public.reset_demo() from public, anon, authenticated;
grant execute on function public.reset_demo() to service_role;
