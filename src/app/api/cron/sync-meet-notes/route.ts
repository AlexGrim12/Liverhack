import { handle, requireCron } from "@/lib/server/http";
import { createAdminClient } from "@/lib/server/admin";
import { syncMeetNotes } from "@/lib/server/meet-sync";

export const dynamic = "force-dynamic";

// Cron (Bearer CRON_SECRET): sincroniza las notas de Meet de TODAS las entrevistas pendientes.
const run = handle(async (req) => {
  requireCron(req);
  return { resultados: await syncMeetNotes(createAdminClient()) };
});
export const GET = run;
export const POST = run;
