# Puesta en marcha de Supabase

Sin variables de entorno la app corre en **modo demo** (datos en memoria). Estos pasos conectan una base real.
Todo el SQL de abajo ya está probado contra un Postgres con las reglas del flujo.

## 1. Crear el proyecto y aplicar el esquema

1. En [supabase.com](https://supabase.com) crea un proyecto (guarda la contraseña de la BD).
2. Aplica la migración, con **una** de estas opciones:
   - **SQL Editor:** pega el contenido de `supabase/migrations/20260923000000_initial_schema.sql` y ejecútalo.
   - **CLI:** `supabase init` (no toca la migración) → `supabase login` → `supabase link --project-ref <ref>` → `supabase db push`.
3. Ejecuta `supabase/seed.sql` (plantillas por categoría, competencias y festivos 2026).
4. Revisa **Advisors** en el dashboard (Security/Performance): no deberían aparecer tablas sin RLS.

## 2. Autenticación

- **Auth → Providers → Google:** activa e ingresa Client ID/Secret de Google Cloud
  (URI de redirección autorizada: `https://<ref>.supabase.co/auth/v1/callback`).
- **Auth → Providers → Email:** déjalo activo (lo usan los usuarios demo).
- **Auth → URL Configuration:** Site URL `http://localhost:3000` y Redirect URL `http://localhost:3000/auth/callback`
  (agrega la URL de Vercel cuando despliegues).
- Todo usuario nuevo entra con rol `user`; el rol real lo asigna un administrador con SQL o `service_role`
  (`update public.profiles set role = 'hm' where email = '…'`).

## 3. Variables de entorno

```bash
cp .env.example .env.local
```

Llena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Settings → API Keys).
`SUPABASE_SERVICE_ROLE_KEY` es **solo** para scripts en tu máquina: nunca la pongas en una variable `NEXT_PUBLIC_*`
ni la subas al repositorio (`.env*.local` ya está en `.gitignore`).

## 4. Datos de demostración (opcional, recomendado para el pitch)

```bash
DEMO_PASSWORD='elige-una-contraseña' node --env-file=.env.local scripts/create-demo-users.mjs
```

Después ejecuta `supabase/demo_data.sql` en el SQL Editor. Crea 4 vacantes coherentes con el flujo
(Selección amarillo, Atracción verde, Oferta roja y una requisición esperando la validación del BP), 6 candidatos,
entrevistas con feedback y pendientes reales. Es de una sola ejecución.

Usuarios demo (`…@demo.liverpool.test`, misma contraseña): `patricia.vega` (BP), `sofia.martinez` / `andrea.lopez` /
`jorge.salinas` (AT), `luis.herrera` / `valeria.campos` / `ricardo.mena` (HM), `diego.ramirez` / `karla.ibarra`
(entrevistadores), `carlos.nunez` / `renata.cifuentes` / `pablo.estrada` (solicitantes).

## 5. Verificación rápida (SQL Editor)

```sql
select titulo, etapa, sla, candidatos_activos, pendiente_bp from public.vacancy_overview order by folio;
```

Debes ver: Selección/amarillo, Atracción/verde, Oferta/rojo y Requisición con `pendiente_bp = true`.

## Qué usa ya la base

Con las variables de entorno puestas la app pide **login** (Google o usuario demo), toma el **rol de `profiles`** y usa la base para:
login y rol, inicio de cada rol, requisición y validación del BP, candidatos y comparativa, entrevistas
(agenda, resumen, feedback del panel y decisión del HM), calendario, pendientes, seguimiento del solicitante y el asistente IA.

Las integraciones con Google (Calendar/Meet, Drive, Gmail, Sheets, Gemini, Chat) están en **[GOOGLE_SETUP.md](GOOGLE_SETUP.md)**.
Sin variables de entorno todo sigue funcionando en modo demo (datos en memoria y selector de rol).

## Reiniciar la base al happy path

La lógica vive en la función `public.reset_demo()` (migración `20260924000100_reset_demo.sql`). Es **idempotente**: borra lo transaccional (vacantes, candidatos, entrevistas, notificaciones, chat de IA), reinicia los folios y lo recrea como arranca la demo. Conserva usuarios, catálogos y credenciales de Google. Solo `service_role` puede ejecutarla.

**Una sola vez** en el SQL Editor: migraciones `20260924000000_hm_no_cancela.sql` y `20260924000100_reset_demo.sql`.

**Desde la app (botón oculto):** con `ALLOW_DEMO_RESET=true` en `.env.local` (y reiniciar el servidor), entra como **HRBP** y usa **Control + Option + R** (Mac) o **triple clic en el logo de Liverpool**. Aparece "Restaurando la base…" y al terminar "Base restaurada al happy path". La ruta `/api/admin/reset-demo` exige ese interruptor, sesión activa y rol HRBP; sin la variable responde 403.

**A mano:** en Mac `pbcopy < supabase/demo_data.sql`, pega en el SQL Editor y Run (solo ejecuta `select public.reset_demo();`).

Queda: 4 vacantes (Pagos en Selección/amarillo, Marketing en Atracción/verde, Logística en Oferta/rojo, Ventas Digital por validar), Mariana con screening de RH (Sofía) + entrevista técnica (Diego y Karla) recomendadas, Emiliano con entrevista agendada y Rodrigo finalista en Oferta.
No borra los CVs ya subidos al bucket `cvs` (Storage). Las ofertas y el portal del candidato solo existen en modo demo: la base aún no tiene tabla de ofertas.
