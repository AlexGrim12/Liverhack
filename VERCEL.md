# Desplegar la demo en Vercel

La demo corre **sin login y sin Supabase** (datos en memoria). Solo necesita Node 18+ y unas variables de entorno.

## Variables (Project → Settings → Environment Variables, entorno *Production*)

| Variable | Valor | Nota |
|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | `true` | **Obligatoria y antes del build**: las `NEXT_PUBLIC_*` se incrustan al compilar. Si la cambias, haz *Redeploy*. |
| `GEMINI_API_KEY` | tu clave de aistudio.google.com/apikey | Sin ella la demo funciona con el motor local. **Usa una clave nueva**, no la que se pegó en el chat. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Opcional. |
| `GITHUB_TOKEN` | token sin permisos | Opcional: sube el límite de GitHub de 60 a 5,000 consultas/hora (en un sitio público 60 se agotan rápido). |
| `NEXT_PUBLIC_MEET_LINK` | `meet.google.com/xxx-xxxx-xxx` | Opcional. |
| `GOOGLE_CHAT_WEBHOOK_URL` | webhook del espacio | Opcional (servidor). |

**No** definas las de Supabase, `SUPABASE_SERVICE_ROLE_KEY` ni `ALLOW_DEMO_RESET` en este despliegue.

## Opción A: desde GitHub (recomendada)
1. Sube los cambios a `main` (`git push`).
2. vercel.com → **Add New → Project** → importa el repositorio. Si es de la organización `Servicios-Liverpool-Infraestructura`, alguien con permisos debe instalar la app de Vercel en esa organización; si no, importa una copia en tu cuenta.
3. Framework: Next.js (se detecta solo). Agrega las variables de arriba → **Deploy**.

## Opción B: desde la terminal
```bash
npx vercel login          # una vez, abre el navegador
npx vercel                # primer despliegue (vista previa); responde las preguntas
npx vercel env add NEXT_PUBLIC_DEMO_MODE production   # escribe: true
npx vercel env add GEMINI_API_KEY production
npx vercel --prod
```

## Después de desplegar
- Abre la URL y prueba: portada → Reclutamiento → *Analizar compatibilidad con IA* (usa Gemini en el servidor) y el chatbot de la portada.
- Reinicio de la demo: Control + Option + R (recarga la página).
- Los CVs (PDF) y el logo van en `public/`, así que se despliegan con el proyecto.
- `vercel.connected.json` guarda los cron jobs del modo conectado (recordatorios y notas de Meet). El despliegue de demo no los usa; si algún día pasas a modo conectado, cámbiale el nombre a `vercel.json` y define `CRON_SECRET`.
