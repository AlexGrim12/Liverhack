import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Refresca la sesión de Supabase en cada request. En modo demo (sin variables de entorno) no hace nada.
export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims() valida la firma del JWT en cada llamada (getSession() no lo hace).
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
