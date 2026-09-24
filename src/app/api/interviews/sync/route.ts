import { handle, requireUser } from "@/lib/server/http";
import { syncMeetNotes } from "@/lib/server/meet-sync";

export const dynamic = "force-dynamic";

// Botón "Sincronizar notas de Meet": trae y resume las notas de las entrevistas que YO agendé.
export const POST = handle(async () => {
  const { admin, user } = await requireUser(["at"]);
  return { resultados: await syncMeetNotes(admin, { agendadaPor: user.id }) };
});
