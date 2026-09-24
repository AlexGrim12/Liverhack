import { GOOGLE } from "./config";
import { gfetch } from "./http";

export type CreatedEvent = { eventId: string; meetLink: string | null; htmlLink: string | null };

// Crea el evento en el calendario de quien agenda, con link de Google Meet, e invita a panel y candidato.
export async function createInterviewEvent(
  token: string,
  p: {
    interviewId: string;
    summary: string;
    description: string;
    startISO: string;
    endISO: string;
    attendees: string[];
    vacancyId: string;
    applicationId: string;
  }
): Promise<CreatedEvent> {
  const url = `${GOOGLE.calendarBase}/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`;
  const ev = await gfetch<{ id: string; hangoutLink?: string; htmlLink?: string; conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] } }>(
    url,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        summary: p.summary,
        description: p.description,
        start: { dateTime: p.startISO, timeZone: GOOGLE.timeZone },
        end: { dateTime: p.endISO, timeZone: GOOGLE.timeZone },
        attendees: p.attendees.map((email) => ({ email })),
        guestsCanModify: false,
        conferenceData: { createRequest: { requestId: p.interviewId, conferenceSolutionKey: { type: "hangoutsMeet" } } },
        extendedProperties: { private: { t360Interview: p.interviewId, t360Vacancy: p.vacancyId, t360Application: p.applicationId } },
      }),
    }
  );
  const video = ev.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri;
  return { eventId: ev.id, meetLink: ev.hangoutLink ?? video ?? null, htmlLink: ev.htmlLink ?? null };
}

export async function deleteEvent(token: string, eventId: string): Promise<void> {
  await gfetch(`${GOOGLE.calendarBase}/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`, token, { method: "DELETE" });
}

export type Busy = { start: string; end: string };

// Disponibilidad de los invitados (Free/Busy). Devuelve, por correo, los bloques ocupados; si Google no
// puede leer un calendario (sin permiso de la organización) ese correo queda como `null`.
export async function freeBusy(token: string, emails: string[], startISO: string, endISO: string): Promise<Record<string, Busy[] | null>> {
  const r = await gfetch<{ calendars: Record<string, { busy?: Busy[]; errors?: unknown[] }> }>(`${GOOGLE.calendarBase}/freeBusy`, token, {
    method: "POST",
    body: JSON.stringify({ timeMin: startISO, timeMax: endISO, timeZone: GOOGLE.timeZone, items: emails.map((id) => ({ id })) }),
  });
  return Object.fromEntries(emails.map((e) => [e, r.calendars?.[e]?.errors?.length ? null : r.calendars?.[e]?.busy ?? []]));
}
