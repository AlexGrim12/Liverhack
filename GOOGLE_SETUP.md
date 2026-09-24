# Conexión con Google Workspace

Con Supabase configurado, Talento 360 usa estos servicios de Google **a nombre de quien hace la acción**
(el evento sale del calendario de la reclutadora, el correo de su cuenta de Gmail…):

| Servicio | Para qué | Dónde se usa | Permiso (scope) |
|---|---|---|---|
| **Google Login** | Entrar con la cuenta corporativa | Pantalla de inicio | `openid email profile` |
| **Calendar + Meet** | Crear la entrevista con link de Meet e invitar al panel y a la persona candidata | Perfil del candidato → *Agendar en Google Calendar + Meet* | `calendar.events` |
| **Calendar Free/Busy** | Mostrar si cada entrevistador está libre en el horario elegido | Mismo modal | `calendar.events` |
| **Drive + Meet (notas de Gemini)** | Leer las notas que Gemini deja en Drive tras la reunión | *Sincronizar notas de Meet* y cron | `drive.readonly` |
| **Gemini API** | Resumir la entrevista, extraer atributos, analizar CVs (PDF) y responder en el asistente | Resumen de entrevista, chat del HM, `/api/candidates/[id]/extract` | (clave `GEMINI_API_KEY`) |
| **Gmail** | Correos al candidato (postulación recibida, avanza, entrevista, cierre) con bitácora | Perfil → *Enviar por Gmail* | `gmail.send` |
| **Sheets** | Exportar la comparativa de candidatos | Comparativa → *Exportar a Google Sheets* | `drive.file` |
| **Google Chat** | Recordatorios y escalamiento (SLA en riesgo, feedback pendiente) | Cron diario | webhook entrante |

## 1. Proyecto de Google Cloud

1. Crea (o usa) un proyecto en [console.cloud.google.com](https://console.cloud.google.com).
2. **APIs y servicios → Biblioteca**: habilita *Google Calendar API*, *Google Drive API*, *Gmail API* y *Google Sheets API*.
3. **Pantalla de consentimiento de OAuth**: tipo **Interno** (solo cuentas del dominio de Liverpool; evita la verificación de
   Google para scopes sensibles). Agrega los scopes de la tabla.
4. **Credenciales → ID de cliente OAuth → Aplicación web**. URI de redirección autorizado:
   `https://<project-ref>.supabase.co/auth/v1/callback`. Guarda el *Client ID* y el *Client Secret*.

## 2. Supabase

- **Auth → Providers → Google**: activa y pega Client ID / Secret.
- Las mismas credenciales van en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` (el servidor las usa para renovar el acceso).
- **Auth → URL Configuration**: agrega `http://localhost:3000/auth/callback` (y la URL de Vercel).

La app pide los permisos extra y `access_type=offline` al iniciar sesión; el callback guarda el *refresh token* **cifrado**
(AES-256-GCM con `GOOGLE_TOKEN_ENC_KEY`) en `google_credentials`, una tabla sin acceso para el navegador.
> Los usuarios demo (correo/contraseña) no tienen cuenta de Google: las funciones de Google les responden
> "Tu cuenta de Google no está conectada". Para probarlas entra con Google.

## 3. Gemini y Chat

- **Gemini**: crea una API key en [Google AI Studio](https://aistudio.google.com/apikey) → `GEMINI_API_KEY`.
  Revisa el modelo vigente en [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) → `GEMINI_MODEL`.
- **Chat**: en el espacio → *Aplicaciones e integraciones → Webhooks* → copia la URL → `GOOGLE_CHAT_WEBHOOK_URL` (opcional).

## 4. Notas de Gemini en Meet (lo más delicado)

- Requiere que el dominio tenga **Gemini en Meet** habilitado (admin de Workspace) y que quien organiza active
  *"Tomar notas por mí"* durante la reunión. La nota queda como Google Doc en el **Drive de quien organizó**.
- La plataforma pone una marca en el título del evento (`[T360-xxxxxxxx]`); el Doc hereda ese título, y así se encuentra.
- Se sincroniza con el botón *Sincronizar notas de Meet* (las entrevistas que tú agendaste) o con el cron.
- Vercel **Hobby** solo permite crons diarios (por eso `vercel.json` corre una vez al día). Para sincronizar más seguido:
  plan Pro, o `pg_cron` + `pg_net` en Supabase llamando a `/api/cron/sync-meet-notes` con `Authorization: Bearer <CRON_SECRET>`.

## 5. Seguridad y privacidad

- `SUPABASE_SERVICE_ROLE_KEY` y los tokens de Google **solo** viven en el servidor (rutas `/api`); RLS y los triggers siguen
  decidiendo qué puede hacer cada rol (las rutas leen y escriben con la sesión del usuario).
- Los CV y notas de entrevista se envían a Gemini: revisa con Legal/TI los términos de tratamiento de datos de tu cuenta de
  Google (LFPDPPP) y el aviso de privacidad al candidato. Las instrucciones del asistente le prohíben usar o inferir edad,
  género, salud, religión u otros datos sensibles, y siempre aclaran que la decisión es del Hiring Manager.
- El evento de Calendar invita a la persona candidata: verá los nombres del panel. La consulta Free/Busy solo funciona si la
  organización comparte disponibilidad; si no, esa persona aparece como "Sin datos".

## 6. Qué se probó y qué no

Todo el código de estas integraciones se probó contra **servidores de Google simulados** (mismos endpoints y formatos de
petición): 39 comprobaciones de las rutas `/api` (agenda con Meet, rollback del evento si la base falla, Free/Busy,
Gmail con asunto UTF-8 y bitácora, Sheets, Gemini con salida JSON, sincronización de notas con deduplicación de
atributos, recordatorios sin duplicar y Chat) y un recorrido en el navegador de la interfaz. **No** se ha ejecutado contra los
servicios reales de Google: en la primera corrida real verifica el consentimiento de OAuth, los permisos de tu dominio y el
modelo de Gemini. El análisis de CV con Gemini solo acepta PDF (se dispara al dar de alta al candidato con su CV; los DOC/DOCX se guardan pero no se analizan).
