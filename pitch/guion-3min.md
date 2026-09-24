# Liver Companion — Pitch de 3:00 (producto + demo + cierre)

**Supuesto:** la historia de Mariana y las cifras del problema (diapositivas 1–3) ya se dijeron; estos 3:00 son lo que sigue.
**Regla del recorrido:** cada momento de la demo responde **un problema con cifra**. Cero login, cero configuración: la app corre en modo demo (datos en memoria, selector de perfil arriba a la derecha).

## Qué diapositivas usar

| Usar | Saltar | Por qué |
|---|---|---|
| **4** revelación · **6** Alinear/Ver/Decidir · **7** demo · **8** métricas · **10** cierre | **5** y **9** | Las cifras de la 5 se dicen **dentro** de la demo, cuando se ven resueltas. El resumen de la 9 ya lo dijiste con la propia demo. |

## Reloj

| Tiempo | Pantalla | Qué decir |
|---|---|---|
| **0:00–0:10** | Diap. 4 | "Nosotros construimos lo que faltaba: **que alguien lo vea.** Se llama **Liver Companion**: que todos vean lo mismo." |
| **0:10–0:25** | Diap. 6 | "Tres ideas: **Alinear** —el hiring manager dice lo que necesita y el BP solo lo valida—, **Ver** —cada etapa tiene dueño y semáforo— y **Decidir** —con contexto. Se los mostramos con Mariana." |
| **0:25–2:25** | **DEMO** (abajo) | 4 momentos: Alinear · Ver · Decidir con IA · Decidir con evidencia |
| **2:25–2:45** | Diap. 8 | "Medimos tres cosas: ciclo hacia **4 semanas** (hoy 52 días), **ningún candidato más de 4 días sin respuesta** y **100 % de vacantes con requisición validada**." |
| **2:45–3:00** | Diap. 10 | **Tu frase de cierre** (está en la diapositiva): "Por eso creamos **Liver Companion**, para acompañar a nuestros colaboradores en todo lugar, todos los días, toda la vida." |

## Demo (2:00): primero la tesis, luego la IA

**Orden:** primero **Alinear** y **Ver** (la tesis: todos ven lo mismo) y al final **Decidir con IA** (el apoyo que lo hace poderoso). Así la IA se entiende como consecuencia de que la vacante ya está alineada, no como truco.

| Reloj | Momento | Qué se hace (perfil) | Qué se dice |
|---|---|---|---|
| **0:25–0:55** | **1 · ALINEAR** — "80 % de RH cree entender la vacante; 61 % de los HM dice que no." | **Hiring Manager** → *Nueva requisición*: título "Arquitecto de Datos — Equipo Pagos" · categoría *TI-Sistemas* · *Enviar al BP*. Cambia a **HRBP** → *Por validar* → reclutador (Sofía) → *Aprobar* (llega el aviso ✅ al Chat). | "Una sola versión de la vacante, **validada antes de buscar**." |
| **0:55–1:10** | **2 · VER** — "52 días y el retraso es invisible." | **HRBP** → *Inicio*: semáforo (Logística en **rojo**). Cambia a **Candidato/a** → misma etapa y mismo semáforo, visto por quien espera. | "Todos ven lo mismo: **el retraso deja de ser invisible**." |
| **1:10–2:00** | **3 · DECIDIR con IA** — "Las vacantes genéricas ocultan al candidato específico." | **Reclutamiento** → *Backend Developer Sr* (**10 CVs ya cargados**) → *Analizar compatibilidad con IA* → proyecto **medusajs/medusa** (real, de GitHub) → añade **2 ideas de la vida diaria** con los botones (*fintech o pagos*, *open source o charlas*) → *Analizar CVs con IA* → **Mariana #1**: abre su detalle (por qué 90 %: stack, dominio, experiencia, tu contexto). **Cambia el proyecto** a *juspay/hyperswitch* y quita la requisición: **Regina sube**. | "La IA lee **los CVs, el código del proyecto y lo que tú le cuentes**. Cualquier contexto de la vida diaria es un filtro más." |
| **2:00–2:25** | **4 · Decidir con evidencia** — "38 % abandona: nadie decide." | **Hiring Manager** → banner *Evaluar entrevista* → **Transcripción → análisis**: competencias **con evidencia textual**, dudas que ella misma reconoció y qué preguntar después → *Aprobar como finalista* (llega el 🎯 al Chat). | "La transcripción deja de ser 40 minutos de audio: es **evidencia, dudas y siguiente pregunta**. **Esta vez, alguien lo ve.**" |

**Si sobran 10 s:** *Asistente IA* → clic en "¿Quién es la mejor candidata?" (usa los mismos números del análisis).
**Si un juez pide otro proyecto:** pega su URL en el cuadro de GitHub → *Traer de GitHub* (con internet lo trae en vivo, es público).
**Si un juez pide otro filtro:** escríbelo en el cuadro de contexto (por ejemplo "disponible para viajar" o "ha dado talleres").

## Cierre (tu frase)

Última imagen: la página de **Candidato/a** con la oferta de Mariana (y, si hay tiempo, *Aceptar oferta* → "¡Mariana aceptó la oferta!"). Mientras se ve, di:

> "Por eso creamos Liver Companion, para acompañar a nuestros colaboradores en todo lugar, todos los días, toda la vida." *(es la que muestra la diapositiva 10; si prefieres otro final, edita ese texto en la diapositiva)*

Opciones alternativas para completar la frase (solo si prefieres cambiar el final; edítalo también en la diapositiva 10):
1. **"…en cada paso, desde el día en que alguien pide una vacante hasta el día en que una persona se vuelve colaboradora."** (la más completa, cierra el arco de Mariana)
2. **"…para que todos veamos lo mismo y nadie se quede esperando."** (repite la tesis)
3. **"…para que cada decisión se tome con contexto y cada persona sepa en qué va."** (la más corta, 6 s)

## Antes de subir al escenario (checklist)

- [ ] Google (opcional, ver `DEMO_GOOGLE.md`): link de Meet en `NEXT_PUBLIC_MEET_LINK`, webhook de Chat en `GOOGLE_CHAT_WEBHOOK_URL`, espacio de Chat abierto **en otra ventana o en el teléfono** para que se vea llegar el mensaje.
- [ ] `.env.local` con `NEXT_PUBLIC_DEMO_MODE=true` y `npm run dev` corriendo (así no dependes de internet ni de Google).
- [ ] Recarga `http://localhost:3000` justo antes: **los datos son en memoria, recargar = estado limpio**.
- [ ] Navegador en pantalla completa, zoom 110 %, una sola pestaña, notificaciones del sistema apagadas.
- [ ] Ensaya **3 veces con cronómetro**; el momento que más tiempo se come es el de la requisición (título + categoría + solicitante): teclea rápido o acórtalo a "título + categoría".
- [ ] Video de respaldo grabado con **estos mismos cuatro pasos** (si falla la pantalla o el proyector).
- [ ] Uno habla, otro maneja el mouse: los cambios de perfil son el selector de arriba a la derecha.

## Qué es real y qué es simulado (dilo si preguntan)

| Sí es real | Es simulado / ficticio |
|---|---|
| El flujo y sus reglas (validación del BP, sin Oferta sin finalista, semáforo en días hábiles), **probados en una base de datos real**. | Los **10 CVs** (ficticios; hay PDF de cada uno) y la **transcripción** de Mariana. |
| **El repositorio de GitHub**: con internet se trae en vivo (lenguajes, temas, README, dependencias); sin internet, una copia guardada de datos reales. | El link de **Meet** (una reunión creada de antemano) y las respuestas del **asistente** (guionadas con los mismos números del análisis). |
| **El análisis** de CVs, de repositorio y de transcripciones corre de verdad con un motor propio y **explicable**: cada porcentaje se desglosa (stack, dominio, experiencia, colaboración, contexto). El contexto libre, las explicaciones, el resumen de la transcripción y el asistente los resuelve **Gemini** (API real); si falla, entra el motor local. | Las metas de la diapositiva 8 (son metas del piloto, no resultados). |

## Preguntas probables (respuestas de 10 segundos)

| Pregunta | Respuesta |
|---|---|
| ¿Es real o es maqueta? | "Prototipo funcional: el flujo y sus reglas son reales y están probados en base de datos; el resumen de entrevista y el asistente los simulamos y son el siguiente paso." |
| ¿Cómo se integra con Liverpool? | "Está pensado sobre Google Workspace —Calendar y Meet— porque es lo que ya usan. La integración es la ruta inmediata." |
| ¿Y la privacidad? | "Cada perfil ve solo lo suyo por diseño; la persona candidata no ve compensación ni feedback de otros. Falta el aviso de privacidad formal." |
| ¿Cómo miden el impacto? | "Tiempo por etapa, días sin respuesta al candidato y % de vacantes con requisición validada; todo sale del propio flujo." |
| ¿Por qué el BP solo valida? | "Porque hoy el BP redacta lo que el hiring manager necesita y ahí se pierde información. Que el que necesita lo diga, y el BP lo valide." |
| ¿Y si el hiring manager cambia algo después? | "La validación se invalida y el BP recibe aviso: nadie busca sobre una versión vieja." |
| ¿Es IA de verdad? | "El análisis de CVs, del código y de la transcripción es real y explicable: cada porcentaje se desglosa y se puede auditar. El contexto libre, las explicaciones, el resumen de la entrevista y el asistente los hace Gemini; el porcentaje base y el filtro de datos sensibles son reglas nuestras, por eso se pueden auditar." |
| ¿No discrimina el "contexto de la vida diaria"? | "Por diseño ignora criterios sobre datos sensibles —edad, género, religión, salud, estado civil— y lo dice en pantalla. La IA recomienda y explica; **la decisión es del hiring manager**." |
| ¿Cómo sabe qué tan compatible es con un repo? | "Extrae del repositorio los lenguajes, temas, README y dependencias, los pesa, y los cruza con las habilidades de cada CV: coincidencia exacta o emparentada, dominio, experiencia y colaboración. Además suma la requisición que el BP validó." |


## Vocabulario Liverpool (dilo así en el pitch)
- A quien trabaja en la empresa se le llama **colaborador o colaboradora** (no "empleado"): Mariana, al aceptar, se vuelve colaboradora.
- A quien solicita la vacante dentro de Liverpool se le llama **cliente interno**. El Hiring Manager es cliente interno. En la app no hay un perfil aparte para el cliente interno: solo HRBP, Reclutamiento, Hiring Manager y Candidato/a.
