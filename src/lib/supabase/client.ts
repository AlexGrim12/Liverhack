import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

// Cliente para componentes del navegador. Solo usa la clave PUBLICABLE:
// la autorización real la hacen RLS y los triggers de la base de datos.
export const createClient = () => createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
