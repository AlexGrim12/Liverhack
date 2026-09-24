import { GOOGLE } from "./config";
import { gfetch } from "./http";

export type DriveDoc = { id: string; name: string; createdTime: string };

// Gemini en Meet deja las notas como un Google Doc en el Drive de quien organizó la reunión, con el título
// del evento. Como el título del evento lleva la marca "T360-xxxxxxxx", se busca el documento por esa marca.
export async function findMeetNotes(token: string, marker: string): Promise<DriveDoc | null> {
  const q = `name contains '${marker.replace(/'/g, "")}' and mimeType = 'application/vnd.google-apps.document' and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: "files(id,name,createdTime)",
    orderBy: "createdTime desc",
    pageSize: "5",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const r = await gfetch<{ files?: DriveDoc[] }>(`${GOOGLE.driveBase}/files?${params}`, token);
  return r.files?.[0] ?? null;
}

// Exporta el Doc a texto plano (no requiere la API de Docs).
export async function exportDocText(token: string, fileId: string): Promise<string> {
  return gfetch<string>(`${GOOGLE.driveBase}/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`, token, { raw: true });
}
