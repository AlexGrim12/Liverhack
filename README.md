# Talento 360 — El Puerto de Liverpool

Prototipo funcional (Next.js 14 + TypeScript + Tailwind CSS) de la plataforma de reclutamiento
unificada para El Puerto de Liverpool. **Modo demo (por defecto para el pitch): sin autenticación**, un selector de rol en la pantalla de
inicio permite a los jueces del hackathon explorar las 4 perspectivas al instante.

Este proyecto es un puerto 1:1, fiel al prototipo aprobado en Claude Design (mismos textos,
colores, datos de ejemplo y lógica de interacción).

## Modos de ejecución

| Modo | Cómo se activa | Qué es |
|---|---|---|
| **Demo** (el del pitch) | `NEXT_PUBLIC_DEMO_MODE=true` en `.env.local` (o sin variables de Supabase) | Sin login, 4 perfiles a escoger, datos en memoria. Recargar la página = estado limpio. |
| Conectado | `NEXT_PUBLIC_DEMO_MODE=false` + claves de Supabase | Login real, base de datos y, opcionalmente, Google Workspace. Ver `SUPABASE_SETUP.md` y `GOOGLE_SETUP.md`. |

Guion del pitch de 3 minutos: `pitch/guion-3min.md`.

## Arquitectura

La app es una **single-page state machine** del lado del cliente — no usa rutas de archivo de
Next.js para navegar entre pantallas. Todo vive en un único componente raíz:

- `src/components/App.tsx` — mantiene todo el estado (rol activo, pantalla actual, filtros,
  selecciones, modales) con `useState`, calcula los valores derivados (candidatos filtrados,
  comparativas, mensajes de chat, etc.) y renderiza condicionalmente el componente de pantalla
  correspondiente.
- `src/app/page.tsx` — solo monta `<App />`.
- `src/lib/data.ts` — fuente única de datos mock (vacantes, candidatos, categorías de puesto) y
  funciones auxiliares (colores por compatibilidad/estatus, iniciales).
- `src/components/screens/*.tsx` — un componente por pantalla:
  - `Landing` — selector de rol (HRBP / Reclutamiento / Hiring Manager / Usuario)
  - `Dashboard` — tablero de vacantes (compartido por HRBP, AT y HM)
  - `HrbpNueva` — creación de requisición con campos sincronizados por categoría
  - `AtCandidatos` — lista de candidatos con filtros y selección para comparar
  - `AtComparar` — tabla comparativa de candidatos seleccionados
  - `AtPerfil` — perfil de candidato + modal de agendar entrevista (genera link falso de Meet)
  - `HmEntrevista` — resumen de entrevista con IA + decisión (finalista/descartado)
  - `HmChat` — asistente de IA con recomendación de candidato
  - `UserDashboard` / `UserDetalle` — vista de solo lectura para el solicitante
- `src/components/TopNav.tsx` — barra de navegación superior con tabs por rol.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Build de producción / Vercel

```bash
npm run build
npm start
```

El proyecto está listo para desplegarse directamente en Vercel (framework Next.js detectado
automáticamente, sin variables de entorno necesarias).

## Flujo de demo (5 minutos)

1. **Landing** → elegir rol.
2. **HRBP**: "Nueva requisición" → seleccionar categoría (los campos se sincronizan
   automáticamente) → publicar.
3. **Reclutamiento (AT)**: entrar a una vacante → filtrar candidatos → comparar 2+ candidatos →
   ver perfil → agendar entrevista (genera link de Meet).
4. **Hiring Manager**: ver entrevista con resumen generado por IA → marcar finalista o descartar
   → usar el Asistente de IA para pedir una recomendación.
5. **Usuario (seguimiento)**: vista de solo lectura del avance de sus vacantes solicitadas.
