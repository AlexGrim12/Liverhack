import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/server/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { saveRefreshToken } from "@/lib/google/tokens";
import { GOOGLE_SCOPES } from "@/lib/google/scopes";

// Destino del login con Google: intercambia el código por una sesión y, si Google entregó un refresh token
// (login con access_type=offline), lo guarda CIFRADO para que el servidor pueda usar Calendar/Drive/Gmail a nombre del usuario.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (isSupabaseConfigured && code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`);
    const refresh = data.session?.provider_refresh_token;
    if (refresh && data.session?.user) {
      try {
        await saveRefreshToken(createAdminClient(), data.session.user.id, refresh, GOOGLE_SCOPES.join(" "));
      } catch (e) {
        console.error("No se pudo guardar el token de Google:", e); // el login sigue; las funciones de Google pedirán reconectar
      }
    }
  }
  return NextResponse.redirect(`${origin}/`);
}
