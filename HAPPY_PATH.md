# Happy path de la demo (solo el recorrido)

Historia: **Mariana Coronado Reyes** pasa por dos rondas de entrevista y termina aceptando una oferta.
Modo demo, sin login. Perfiles: HRBP (BP), Reclutamiento (AT), Hiring Manager y Candidato/a; se eligen en la portada o en el selector de arriba a la derecha. El HM captura y decide, pero no cancela vacantes (solo el BP).

## Antes de empezar
- `npm run dev` corriendo, `NEXT_PUBLIC_DEMO_MODE=true` y internet (Gemini y GitHub).
- Estado inicial: **Ctrl + Alt + R** (en Mac: Control + Option + R; o tres toques en el ícono de Liverpool del pie de página (sirve en celular) o triple clic en el texto "Liver Companion" de la barra superior) reinicia todo.
- Vacante protagonista: **Backend Developer Sr — Equipo Pagos**, etapa Selección, 10 candidatos con CV.
- Mariana empieza **sin oferta**. Quien sí tiene una desde el inicio es Rodrigo (Logística).

## 1 · Alinear: el HM captura, el BP solo valida
1. **Hiring Manager** → *Nueva requisición*.
2. Título "Arquitecto de Datos — Equipo Pagos", categoría *TI-Sistemas*, elige al BP.
3. *Enviar al BP*.
4. Cambia a **HRBP** → *Por validar* → elige a Sofía Martínez como reclutadora → *Aprobar*.
5. Se ve la animación "Requisición validada" y llega el aviso al espacio de Chat de la app (botón redondo abajo a la derecha; a Google Chat solo si hay webhook).

## 2 · Ver: cada etapa tiene dueño y semáforo
1. **HRBP** → *Inicio*: la vacante de Logística está en **rojo**.
2. Abre una vacante que no esté por validar: detalle de solo lectura.
3. Cambia a **Candidato/a** → cualquiera de las personas: ve las mismas etapas y el mismo semáforo que el equipo.

## 3 · Decidir con IA: 10 CVs, un proyecto y contexto libre
1. **Reclutamiento** → *Backend Developer Sr* → *Analizar compatibilidad con IA*.
2. Proyecto de referencia: **medusajs/medusa** (real, de GitHub), con la requisición validada marcada.
3. Añade con los botones dos ideas de contexto (*fintech o pagos*, *open source o charlas*).
4. *Analizar CVs con IA* (~13 s, con el loader): **Mariana queda primera** (~90 %).
5. Abre su detalle: stack, dominio, experiencia, colaboración y contexto, cada uno con su porcentaje.
6. Cambia el proyecto a **juspay/hyperswitch** y quita la requisición: **Regina sube**.
7. (Opcional) En el perfil de Mariana: *Ver CV (PDF)*.

## 4 · Decidir con evidencia: dos rondas, una decisión
1. **Reclutamiento** (opcional): en el perfil de Mariana se ven sus rondas; el screening lo hizo Sofía.
2. **Hiring Manager** → banner *Evaluar entrevista*.
3. **Rondas de entrevista:** 1. Screening de RH (Sofía) y 2. Entrevista técnica (Diego y Karla). "3 de 3 evaluaciones lo recomiendan".
4. Elige una ronda y se ve su transcripción → análisis: competencias con evidencia textual, dudas y qué preguntar.
5. Escribe una justificación → *Aprobar como finalista* ("Finalista confirmada").
6. (Opcional) *Asistente IA* → "¿Quién es la mejor candidata?": responde Gemini con los datos del análisis.

## 5 · Oferta: el cierre de Mariana
1. **Hiring Manager** → *Volver a vacantes* → en la vacante de Pagos, *Pasar a Oferta* ("Oferta lista para Mariana").
2. Cambia a **Candidato/a**: se abre en **Mariana** con la tarjeta rosa "¡Mariana, tienes una oferta!" ($66,000 MXN, inicio 19 oct 2026).
3. Debajo se lee el recuento: "2 rondas, 3 de 3 evaluaciones a favor y una decisión con contexto".
4. (Remate) *Aceptar oferta*: "¡Mariana aceptó la oferta!" y la página pasa a verde.
5. (Opcional) **Reclutamiento** → vacante de Pagos: su estatus es **Oferta aceptada**.

## Cierre
Con la página de Mariana en pantalla, di tu frase:
"Por eso creamos Liver Companion, para acompañar a nuestros colaboradores en ______."
(Opciones para completarla en `pitch/guion-3min.md`).

## Datos que salen en pantalla
| Dato | Valor |
|---|---|
| Vacante | Backend Developer Sr — Equipo Pagos (TI y Sistemas), HM Luis Herrera, AT Sofía Martínez |
| Requisición validada | Node.js, AWS, Docker · microservicios en sistemas de pagos |
| Mariana | Backend Engineer Sr, 8 años, CDMX. Pretensión $68,000 |
| Oferta de Mariana | $66,000 MXN, inicio 19 oct 2026, vigencia hasta el 30 sep |
| Rondas | 12 sep Screening RH (Sofía) · 18 sep Técnica (Diego y Karla) |
| Otros candidatos | Emiliano (entrevista 26 sep 11:00) · Daniela (screening) · Rodrigo (oferta $40,000) · Paulina (no seleccionada) |

## Si algo falla
- **Sin internet o Gemini caído:** el análisis, el asistente y el chatbot siguen con el motor local; la insignia dice "Motor: local".
- **GitHub sin cuota:** el proyecto se carga de la copia guardada.
- **Algo se rompió a media demo:** Ctrl + Alt + R y arranca de nuevo.
- **Tiempo:** el recorrido completo con oferta rebasa los 2:00 planeados; ensaya con cronómetro y recorta el paso 1 o 2 si hace falta.
