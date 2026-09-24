# Google en la demo, sin iniciar sesión en la app

Tres piezas que funcionan en el **modo demo** (sin login de la plataforma ni dominio de Liverpool):

| Pieza | Qué hace en la demo | Necesita |
|---|---|---|
| **Link de Meet fijo** | Al agendar, la app muestra un link de Meet real (*Abrir Meet*, *Copiar enlace*). | Crear **una** reunión de antemano y pegar su link. |
| **Invitación `.ics`** | Botón *Agregar a mi calendario (.ics)*: descarga el evento (título, hora, link de Meet, alarma de 15 min) y se abre en Google Calendar, Outlook o Apple Calendar. | Nada. Se genera en el navegador. |
| **Avisos a Google Chat** | Mensajes en vivo en un espacio de Chat cuando pasan cosas clave (ver abajo). | Un espacio de Chat y su **webhook**. |

## 1. Link de Meet (2 min)

1. En [meet.google.com](https://meet.google.com) → **Nueva reunión → Crear una reunión para más tarde**.
2. Copia el link (`https://meet.google.com/abc-defg-hij`) y pégalo en `.env.local`:
   ```
   NEXT_PUBLIC_MEET_LINK=meet.google.com/abc-defg-hij
   ```
   Sin configurar se usa `meet.google.com/new`, que abre una reunión instantánea con la sesión de Google del navegador.
3. Reinicia el servidor (`Ctrl+C` y `npm run dev`): las variables `NEXT_PUBLIC_*` se leen al arrancar.

## 2. Google Chat (10 min)

> **¿Tu administrador restringe los webhooks?** No hace falta nada más: la app trae un **espacio de Chat simulado** (botón redondo abajo a la derecha, con un globo cuando llega un aviso). Muestra los mismos cuatro mensajes, con el mismo texto, en el momento en que ocurren. Es una vista dentro de la app, no Google Chat: dilo así si preguntan. Si algún día consigues el webhook, el mensaje llega a los dos lados.

Los webhooks de Chat requieren una cuenta de **Google Workspace** (no sirve Gmail personal; verifícalo antes del pitch).

1. En Google Chat crea un **espacio** (por ejemplo, "Liver Companion — Demo") y añade a quien quiera ver los avisos.
2. En el espacio: **nombre del espacio → Aplicaciones e integraciones → Webhooks → Agregar webhook**. Ponle nombre, copia la URL.
3. Pégala en `.env.local` (**no la compartas ni la pegues en el chat**: quien la tenga puede escribir en tu espacio):
   ```
   GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/...
   ```
4. Reinicia el servidor y prueba: en `HRBP` aprueba una requisición; debe llegar `✅ Requisición validada …` al espacio.

**Cuándo se envía un mensaje:**
| Acción en la demo | Mensaje |
|---|---|
| BP aprueba una requisición | ✅ Requisición validada — asignada a *reclutador* |
| Reclutamiento agenda una entrevista | 📅 Entrevista agendada — *candidato*, fecha y link de Meet |
| Hiring Manager aprueba a un finalista | 🎯 Nuevo finalista — *candidato*, feedback 2 de 2 recomiendan |
| BP pulsa **Avisar en Google Chat** en una vacante en rojo | 🔴 Fuera de tiempo — *vacante*, etapa y responsable |

Sin webhook configurado la app funciona igual y simplemente no envía nada (el botón *Avisar en Google Chat* publica el aviso en el espacio de Chat de la app y explica que falta el webhook para enviarlo a Google Chat).

## Seguridad del endpoint

`/api/notify/chat` no requiere sesión, por eso **no acepta texto libre**: solo cuatro plantillas fijas con campos cortos y limpios
(sin `*`, `_`, `<`, saltos de línea; el link de Meet solo si es de `meet.google.com`), y limita a 20 avisos por minuto por IP.
Aun así, si publicas la demo en internet, cualquiera podría disparar esos cuatro mensajes: para el pitch local no importa;
si la despliegas, quita el webhook de las variables al terminar.

## Qué probé

Con un webhook simulado: los cuatro mensajes llegan con el formato esperado (incluida la fecha y el link de Meet elegidos),
un evento inválido responde 400, un intento de inyección (`<script>`, asteriscos, un link ajeno) sale limpio, el límite de
frecuencia corta a partir del aviso 21, y el `.ics` lo lee sin errores un parser de calendario (11:00 CDMX = 17:00 UTC).
**No** lo he probado contra un espacio de Chat real: hazlo con el paso 4.
