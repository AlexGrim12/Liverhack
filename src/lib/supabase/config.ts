// Sin URL/clave en el entorno (o con NEXT_PUBLIC_DEMO_MODE=true) la app corre en "modo demo":
// datos en memoria y selector de rol, sin login.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const isSupabaseConfigured = !isDemoMode && SUPABASE_URL !== "" && SUPABASE_PUBLISHABLE_KEY !== "";
