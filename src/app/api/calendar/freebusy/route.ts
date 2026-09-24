import { handle, HttpError, readJson, requireUser } from "@/lib/server/http";
import { getAccessToken } from "@/lib/google/tokens";
import { freeBusy } from "@/lib/google/calendar";

export const dynamic = "force-dynamic";

// ¿Están libres los entrevistadores en ese horario? Solo se consultan correos de usuarios de la plataforma.
export const POST = handle(async (req) => {
  const { db, admin, user } = await requireUser(["at", "hm", "hrbp"]);
  const b = await readJson<{ ids?: string[]; inicio?: string; fin?: string }>(req);
  const ini = new Date(b.inicio ?? ""), fin = new Date(b.fin ?? "");
  if (Number.isNaN(ini.getTime()) || Number.isNaN(fin.getTime()) || fin <= ini) throw new HttpError(400, "El rango de fechas es inválido.");
  const ids = [...new Set(b.ids ?? [])].slice(0, 10);
  if (!ids.length) return { ocupados: {} };
  const { data: perfiles } = await db.from("profiles").select("id, email").in("id", ids);
  const token = await getAccessToken(admin, user.id);
  const busy = await freeBusy(token, (perfiles ?? []).map((p) => p.email), ini.toISOString(), fin.toISOString());
  // por id de perfil: true = ocupado, false = libre, null = no se pudo consultar
  return {
    ocupados: Object.fromEntries((perfiles ?? []).map((p) => [p.id, busy[p.email] === null ? null : (busy[p.email] ?? []).length > 0])),
  };
});
