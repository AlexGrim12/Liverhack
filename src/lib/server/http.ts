import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "./admin";
import { GoogleApiError, GoogleNotConnectedError } from "@/lib/google/http";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export type Ctx = { db: SupabaseClient; admin: SupabaseClient; user: User; role: string };

// Usuario autenticado de la sesión (cookies). `db` actúa COMO ese usuario: RLS y triggers siguen decidiendo.
// `admin` (service_role) solo se usa para lo que el usuario no puede hacer por sí mismo (tokens de Google, cron).
export async function requireUser(roles?: string[]): Promise<Ctx> {
  const db = createClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new HttpError(401, "Inicia sesión para continuar.");
  const { data: profile } = await db.from("profiles").select("role, activo").eq("id", data.user.id).single();
  if (!profile || !profile.activo) throw new HttpError(403, "Tu usuario no está activo.");
  if (roles && !roles.includes(profile.role)) throw new HttpError(403, "Tu rol no puede realizar esta acción.");
  return { db, admin: createAdminClient(), user: data.user, role: profile.role };
}

export function requireCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) throw new HttpError(401, "No autorizado.");
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "El cuerpo de la petición no es JSON válido.");
  }
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function assertUuid(v: unknown, name: string): string {
  if (typeof v !== "string" || !UUID.test(v)) throw new HttpError(400, `${name} inválido.`);
  return v;
}

export function handle(fn: (req: Request, params: Record<string, string>) => Promise<unknown>) {
  return async (req: Request, { params }: { params?: Record<string, string> } = {}) => {
    try {
      return NextResponse.json(await fn(req, params ?? {}));
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
      if (e instanceof GoogleNotConnectedError) return NextResponse.json({ error: e.message, code: "google_not_connected" }, { status: 409 });
      if (e instanceof GoogleApiError) return NextResponse.json({ error: e.message, code: "google_error" }, { status: 502 });
      console.error(e);
      return NextResponse.json({ error: e instanceof Error ? e.message : "Error inesperado." }, { status: 500 });
    }
  };
}
