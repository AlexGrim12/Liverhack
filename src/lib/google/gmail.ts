import { GOOGLE } from "./config";
import { gfetch } from "./http";

const b64url = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const mimeWord = (s: string) => `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;

// Envía un correo de texto desde la cuenta Gmail de quien hace la acción (scope gmail.send).
export async function sendEmail(token: string, p: { to: string; subject: string; text: string }): Promise<string> {
  const msg = [
    `To: ${p.to}`,
    `Subject: ${mimeWord(p.subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(p.text, "utf8").toString("base64"),
  ].join("\r\n");
  const r = await gfetch<{ id: string }>(`${GOOGLE.gmailBase}/users/me/messages/send`, token, {
    method: "POST",
    body: JSON.stringify({ raw: b64url(msg) }),
  });
  return r.id;
}
