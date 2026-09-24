-- Reinicia la base al happy path de la demo. Idempotente: se puede correr cuantas veces quieras.
-- Requisitos (una sola vez): migraciones aplicadas (incluye 20260924000100_reset_demo.sql), seed.sql y los 12 usuarios demo
-- (`node scripts/create-demo-users.mjs`). Detalle de lo que borra y lo que conserva: ver el encabezado de esa migración.
select public.reset_demo();
