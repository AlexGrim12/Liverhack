import { handle, requireUser, HttpError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

// Restaura la base al happy path de la demo (función public.reset_demo, solo service_role).
// Es destructivo, así que exige TRES cosas: interruptor en el servidor (ALLOW_DEMO_RESET=true), sesión activa y rol HRBP.
// En producción con datos reales debe quedar sin la variable: la ruta responde 403.
export const POST = handle(async () => {
  if (process.env.ALLOW_DEMO_RESET !== "true") throw new HttpError(403, "La restauración de la demo está desactivada en este servidor (falta ALLOW_DEMO_RESET=true).");
  const { admin } = await requireUser(["hrbp"]);
  const { error } = await admin.rpc("reset_demo");
  if (error) throw new HttpError(500, `No se pudo restaurar la base: ${error.message}`);
  return { ok: true };
});
