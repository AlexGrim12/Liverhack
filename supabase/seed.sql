-- Catálogos base (idempotente). Se ejecuta después de la migración: `supabase db reset` lo corre solo,
-- o pégalo en el SQL Editor. NO incluye datos de demostración (ver supabase/demo_data.sql).

insert into public.competencies (nombre) values
  ('Liderazgo'), ('Trabajo en equipo'), ('Comunicación efectiva'), ('Orientación a resultados')
on conflict (nombre) do nothing;

insert into public.vacancy_templates (categoria, area, stack_opciones, cert_ejemplo, exp_minima_default, campos) values
  ('TI-Sistemas', 'TI y Sistemas',
   array['Node.js','Python','Java','AWS','GCP','Docker','React'],
   'AWS Certified Solutions Architect', 3,
   '[{"key":"github","label":"GitHub","tipo":"url","requerido":false,"filtrable":false},
     {"key":"anios_backend","label":"Años en backend","tipo":"number","requerido":true,"filtrable":true},
     {"key":"nivel_ingles","label":"Nivel de inglés técnico","tipo":"select","opciones":["B1","B2","C1","C2"],"requerido":false,"filtrable":true}]'),
  ('RH', 'Recursos Humanos',
   array['Reclutamiento IT','Compensaciones','Nómina','SAP SuccessFactors'],
   'Certificación SHRM', 2,
   '[{"key":"vacantes_cerradas_anio","label":"Vacantes cerradas por año","tipo":"number","requerido":false,"filtrable":true},
     {"key":"experiencia_nomina","label":"Experiencia en nómina","tipo":"boolean","requerido":false,"filtrable":true}]'),
  ('Mercadotecnia', 'Mercadotecnia',
   array['SEO/SEM','Google Ads','Meta Ads','Analytics','Branding'],
   'Google Ads Certified', 2,
   '[{"key":"portafolio","label":"Portafolio","tipo":"url","requerido":false,"filtrable":false},
     {"key":"presupuesto_administrado","label":"Presupuesto administrado (MXN/mes)","tipo":"number","requerido":false,"filtrable":true}]'),
  ('Logística', 'Logística',
   array['SAP WM','Comercio Exterior','Rutas y Distribución','WMS'],
   'Certificación en Comercio Exterior', 3,
   '[{"key":"personas_a_cargo","label":"Personas a cargo","tipo":"number","requerido":false,"filtrable":true},
     {"key":"wms","label":"WMS utilizados","tipo":"multiselect","opciones":["SAP WM","Manhattan","Oracle WMS","Blue Yonder"],"requerido":false,"filtrable":true}]'),
  ('Finanzas', 'Finanzas',
   array['SAP FI','Excel avanzado','Forecasting','NIIF'],
   'Certificación CFA nivel I', 3,
   '[{"key":"cierre_contable","label":"Experiencia en cierre contable","tipo":"boolean","requerido":false,"filtrable":true}]')
on conflict (categoria) do nothing;

-- Días inhábiles oficiales 2026 (México). Se excluyen del SLA en días hábiles.
insert into public.holidays (fecha, nombre) values
  ('2026-01-01', 'Año Nuevo'),
  ('2026-02-02', 'Día de la Constitución'),
  ('2026-03-16', 'Natalicio de Benito Juárez'),
  ('2026-05-01', 'Día del Trabajo'),
  ('2026-09-16', 'Día de la Independencia'),
  ('2026-11-16', 'Revolución Mexicana'),
  ('2026-12-25', 'Navidad')
on conflict (fecha) do nothing;
