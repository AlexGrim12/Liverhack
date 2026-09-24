// Crea los 12 usuarios demo en Supabase Auth (el trigger de la BD genera sus profiles).
// Uso:  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DEMO_PASSWORD=... node scripts/create-demo-users.mjs
// Luego ejecuta supabase/seed.sql y supabase/demo_data.sql (asigna roles y crea el dataset).
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // solo servidor; nunca en el navegador
const password = process.env.DEMO_PASSWORD;
if (!url || !key || !password) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o DEMO_PASSWORD.");
  process.exit(1);
}

const users = [
  ["patricia.vega", "Patricia Vega"], ["sofia.martinez", "Sofía Martínez"], ["andrea.lopez", "Andrea López"],
  ["jorge.salinas", "Jorge Salinas"], ["luis.herrera", "Luis Herrera"], ["valeria.campos", "Valeria Campos"],
  ["ricardo.mena", "Ricardo Mena"], ["diego.ramirez", "Diego Ramírez"], ["karla.ibarra", "Karla Ibarra"],
  ["carlos.nunez", "Carlos Núñez Ibarra"], ["renata.cifuentes", "Renata Cifuentes"], ["pablo.estrada", "Pablo Estrada"],
];

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
for (const [handle, name] of users) {
  const email = `${handle}@demo.liverpool.test`;
  const { error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: name },
  });
  console.log(error ? `✗ ${email}: ${error.message}` : `✓ ${email}`);
}
