import { handle, requireUser } from "@/lib/server/http";
import { isGoogleConnected } from "@/lib/google/tokens";

export const dynamic = "force-dynamic";

// ¿Esta cuenta ya dio los permisos de Google (Calendar/Drive/Gmail)?
export const GET = handle(async () => {
  const { admin, user } = await requireUser();
  return { connected: await isGoogleConnected(admin, user.id) };
});
