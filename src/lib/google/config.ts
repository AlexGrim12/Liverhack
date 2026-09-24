// Configuración de Google Workspace. Las URLs base se pueden sobrescribir con variables de entorno
// (solo para pruebas locales con un servidor simulado); en producción se usan las reales de Google.
export const GOOGLE = {
  clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  tokenUrl: process.env.GOOGLE_TOKEN_URL ?? "https://oauth2.googleapis.com/token",
  calendarBase: process.env.GOOGLE_CALENDAR_BASE ?? "https://www.googleapis.com/calendar/v3",
  driveBase: process.env.GOOGLE_DRIVE_BASE ?? "https://www.googleapis.com/drive/v3",
  gmailBase: process.env.GOOGLE_GMAIL_BASE ?? "https://gmail.googleapis.com/gmail/v1",
  sheetsBase: process.env.GOOGLE_SHEETS_BASE ?? "https://sheets.googleapis.com/v4",
  geminiBase: process.env.GEMINI_BASE ?? "https://generativelanguage.googleapis.com/v1beta",
  geminiKey: process.env.GEMINI_API_KEY ?? "",
  // Consulta https://ai.google.dev/gemini-api/docs/models y ajusta GEMINI_MODEL al modelo vigente.
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  chatWebhook: process.env.GOOGLE_CHAT_WEBHOOK_URL ?? "",
  timeZone: "America/Mexico_City",
};

export { GOOGLE_SCOPES } from "./scopes";
