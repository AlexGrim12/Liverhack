import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";

// Cliente con service_role: se salta RLS. SOLO servidor (rutas /api y cron); la clave nunca lleva NEXT_PUBLIC_.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
