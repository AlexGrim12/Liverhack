// Permisos que se piden al iniciar sesión con Google (ver GOOGLE_SETUP.md para el porqué de cada uno).
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events", // crear entrevistas con Meet
  "https://www.googleapis.com/auth/drive.readonly", // leer las notas que Gemini deja en Meet (Drive)
  "https://www.googleapis.com/auth/gmail.send", // avisos por correo al candidato
  "https://www.googleapis.com/auth/drive.file", // crear hojas de cálculo (Sheets) con la comparativa
];
