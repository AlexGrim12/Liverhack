# IA en la demo: CVs, GitHub, contexto libre y transcripciones

Todo funciona en **modo demo** (sin login, sin claves). Con internet, el repositorio se trae en vivo de GitHub; sin internet se usa una copia guardada.

## Qué hay

| Pieza | Dónde | Qué hace |
|---|---|---|
| **10 CVs** con perfiles distintos | `src/lib/demo/cvs.json` y `public/cvs/c1.pdf … c10.pdf` | Backend Sr de pagos (Mariana), full-stack, Java/banca, Rust/pagos, DevOps, frontend, QA, data science, junior de bootcamp… |
| **Compatibilidad con IA** | Reclutamiento → *Backend Developer Sr* → **Analizar compatibilidad con IA** | Ranking de los 10 CVs contra un repositorio de GitHub y la requisición validada, con el desglose de cada porcentaje. |
| **Contexto libre** | Mismo tablero, cuadro "Contexto: cualquier cosa de la vida diaria" | Una idea por línea, en tus palabras ("vive en CDMX o puede trasladarse", "ha dado talleres"…). Pesa el 25 % del resultado. |
| **Otro proyecto** | Selector o URL de GitHub | Cambia el proyecto y cambia el ranking (con *hyperswitch* y sin requisición, sube Regina). |
| **Transcripción → análisis** | Hiring Manager → *Evaluar entrevista* | Resumen, frases clave, competencias **con evidencia textual**, dudas y qué profundizar. Se puede pegar **otra** transcripción. |

## Cómo calcula la compatibilidad (explicable)

`55 % stack técnico` (coincidencia exacta o emparentada: TypeScript≈JavaScript, PostgreSQL≈MySQL, AWS≈GCP…) · `15 % dominio` (pagos, fintech, e-commerce) ·
`20 % experiencia` · `10 % colaboración` (liderazgo, mentoría, open source, comunidad). Con contexto libre: 75 % lo anterior + 25 % criterios.
Del repositorio se toman los lenguajes (por proporción de bytes), *topics*, README y archivos de dependencias; a eso se suma la **requisición** que el BP validó.

## Guardarraíles

- Los criterios sobre **datos sensibles** (edad, género, hijos, estado civil, religión, salud, nacionalidad…) se **ignoran** y se muestra por qué.
- La IA **recomienda y explica**; la decisión es del hiring manager.
- Los CVs y la transcripción son **ficticios**.

## Opcional: IA generativa (Gemini) y más cuota de GitHub

En `.env.local` (y reinicia el servidor):

```
GEMINI_API_KEY=...        # clave de Google AI Studio (aistudio.google.com/apikey)
GEMINI_MODEL=gemini-2.5-flash   # confirma el modelo vigente en ai.google.dev/gemini-api/docs/models
GITHUB_TOKEN=...          # opcional: sube el límite de GitHub de 60 a 5,000 consultas por hora
```

Con clave, **Gemini hace cuatro cosas** (la insignia dice *Motor: Gemini*):
1. **Evalúa el contexto libre** contra cada CV (por ejemplo "vive cerca de Guadalajara" o "ha dado charlas"), con evidencia por criterio. Marca como sensible (y se ignora) lo que sea edad, hijos, salud, etc.
2. **Redacta la explicación** de compatibilidad de los cuatro mejores candidatos.
3. **Resume la transcripción** de la entrevista (competencias con evidencia, dudas, temas a profundizar).
4. **Responde el Asistente IA** del Hiring Manager con los datos del análisis, las entrevistas y la requisición.

Lo que sigue siendo del motor local (siempre, con o sin clave): el porcentaje base (stack, dominio, experiencia, colaboración), la lectura estructurada de los CVs y de GitHub, y el filtro de datos sensibles.
Sin clave, o si Gemini falla, todo sigue funcionando con el motor local (*Motor: local*). La clave vive solo en el servidor (`GEMINI_API_KEY`, nunca `NEXT_PUBLIC_`).

## Cómo probé

Motor: ranking esperado con los dos repositorios, criterios de contexto, guardarraíl sensible (mismo resultado con y sin criterio sensible) y transcripciones
(la de Mariana y una pegada con otro nombre). GitHub en vivo contra `expressjs/express` (trae `package.json`), repo inexistente (404) y URL no válida (400).
PDF: 1 página con acentos legibles. Gemini real (`gemini-2.5-flash`, sin "razonamiento" para responder en ~1 s): probadas las cuatro tareas contra la API y en la interfaz (con el contexto de ejemplo, Mariana queda en 94 %). El análisis completo con contexto tarda ~13 s.

## Regenerar los PDF de los CVs

```bash
pip install reportlab && python3 scripts/generate-cv-pdfs.py
```

## Proyecto de referencia preestablecido

Al abrir *Analizar compatibilidad con IA* el cuadro ya trae `https://github.com/AlexGrim12/jopi` y la app lo intenta traer sola, una vez. Si GitHub no puede darlo (hoy responde 404: es privado o el nombre no coincide), avisa y se queda con `medusajs/medusa` como respaldo.
- Para que funcione con un repositorio **público**: basta con que exista.
- Si es **privado**: pon `GITHUB_TOKEN` (con permiso de lectura) en `.env.local`. Cuidado: en un despliegue público, cualquiera con la URL vería el análisis de ese código.
- Cada traída gasta 3 de las 60 consultas por hora de GitHub sin token.
- Con otro repositorio de referencia cambian los porcentajes: la historia de Mariana #1 (92 %) se calculó con medusa.
- Para cambiar el preestablecido: constante `REPO_PREESTABLECIDO` en `src/components/App.tsx`.
