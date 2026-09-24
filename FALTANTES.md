# Talento 360 / Liver Companion — Qué falta

**Alcance decidido:** demo **sin login** (selector de 4 perfiles) para un pitch de 3 minutos. Todo lo que implique
login, dominio de Liverpool o servicios reales queda **fuera de alcance** (ver el final). El guion está en
[`pitch/guion-3min.md`](pitch/guion-3min.md).

## Listo para presentar
- Flujo completo con los 4 perfiles: requisición del HM → validación del BP → búsqueda → candidatos, comparativa y
  agenda → resumen de entrevista y feedback → decisión → asistente → oferta → cierre.
- Semáforo de tiempos, pendientes, seguimiento del solicitante, botones de cambio de etapa, alta de candidato.
- Reglas del flujo implementadas y **probadas en una base de datos real** (esquema en `supabase/`).
- Modo demo coherente con la historia de Mariana (datos, entrevistadores y asistente alineados).

## Antes del pitch (lo único que importa)
- [ ] Ensayar el recorrido de 2:00 con cronómetro (mínimo 3 veces).
- [ ] Grabar el video de respaldo con los mismos cuatro pasos.
- [ ] Revisar que las diapositivas 4, 6, 8 y 10 digan lo mismo que la demo (BP solo valida, "Alinear · Ver · Decidir").
- [ ] Confirmar las metas de la diapositiva 8 con el equipo (son metas del piloto, no resultados).
- [ ] Repartir roles: quién habla y quién maneja el mouse.

## IA en la demo (ya construida)
- 10 CVs (PDF), compatibilidad contra un repositorio de GitHub, contexto libre y análisis de transcripciones: ver [`DEMO_IA.md`](DEMO_IA.md).
- [x] Gemini real conectado (contexto libre, explicaciones, transcripción y asistente). **Rotar la clave** (se pegó en el chat) y confirmar que haya internet en el escenario; sin red entra el motor local.
- [ ] Ensayar el momento 3 (IA) con cronómetro: es el de más pasos (50 s).

## Google en la demo (ya construido, falta configurarlo)
- [ ] Crear la reunión de Meet y pegar su link en `NEXT_PUBLIC_MEET_LINK` (2 min).
- [ ] Crear el espacio de Chat y su webhook → `GOOGLE_CHAT_WEBHOOK_URL` (10 min, requiere Workspace). Ver [`DEMO_GOOGLE.md`](DEMO_GOOGLE.md).
- [ ] Probar los cuatro avisos contra tu espacio real y reiniciar el servidor tras editar `.env.local`.

## Mejoras opcionales (solo si sobra tiempo, en este orden)
1. **Vista previa del correo al candidato** cuando el HM decide (cierra el arco emocional de "Mariana esperando").
2. **Campos dinámicos por plantilla** en la comparativa y los filtros (refuerza "vacantes genéricas").
3. Inicializar `git` y mover las pruebas al repositorio.
4. Configurar `npm run lint` y auditar el diseño en móvil.

## Fuera de alcance (estacionado, el código ya existe pero no se usa)
- Login (Supabase Auth, Google OAuth) y restricción al dominio de Liverpool.
- Modo conectado a Supabase y las integraciones con Google Workspace (Calendar/Meet, Drive, Gmail, Sheets, Chat, Gemini):
  están implementadas y probadas contra servicios simulados, y se activan con `NEXT_PUBLIC_DEMO_MODE=false`
  (ver `SUPABASE_SETUP.md` y `GOOGLE_SETUP.md`). Si se retoman: rotar la secret key de Supabase que se pegó en el chat.
- Administración de usuarios/roles, despliegue con datos reales, aviso de privacidad y política de retención.
