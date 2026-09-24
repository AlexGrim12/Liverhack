import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GOOGLE } from "./config";
import { GoogleApiError, GoogleNotConnectedError, gfetch } from "./http";

// Los refresh tokens se guardan cifrados (AES-256-GCM) con GOOGLE_TOKEN_ENC_KEY (32 bytes en base64).
function key(): Buffer {
  const raw = process.env.GOOGLE_TOKEN_ENC_KEY ?? "";
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("GOOGLE_TOKEN_ENC_KEY debe ser 32 bytes en base64 (openssl rand -base64 32).");
  return k;
}
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), enc.toString("base64url")].join(".");
}
export function decryptToken(blob: string): string {
  const [v, iv, tag, enc] = blob.split(".");
  if (v !== "v1") throw new Error("Formato de token desconocido.");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(enc, "base64url")), d.final()]).toString("utf8");
}

export async function saveRefreshToken(admin: SupabaseClient, userId: string, refreshToken: string, scopes?: string) {
  const { error } = await admin
    .from("google_credentials")
    .upsert({ user_id: userId, refresh_token_enc: encryptToken(refreshToken), scopes: scopes ?? null }, { onConflict: "user_id" });
  if (error) throw new Error(`No se pudo guardar la conexión con Google: ${error.message}`);
}

export async function isGoogleConnected(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await admin.from("google_credentials").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

const cache = new Map<string, { token: string; exp: number }>();

// Access token vigente del usuario (se renueva con su refresh token). Las llamadas a Google se hacen
// a nombre de quien realiza la acción: el evento sale de SU calendario, el correo de SU cuenta.
export async function getAccessToken(admin: SupabaseClient, userId: string): Promise<string> {
  const hit = cache.get(userId);
  if (hit && hit.exp > Date.now() + 60_000) return hit.token;
  const { data, error } = await admin.from("google_credentials").select("refresh_token_enc").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new GoogleNotConnectedError();
  const body = new URLSearchParams({
    client_id: GOOGLE.clientId,
    client_secret: GOOGLE.clientSecret,
    refresh_token: decryptToken(data.refresh_token_enc),
    grant_type: "refresh_token",
  });
  try {
    const r = await gfetch<{ access_token: string; expires_in: number }>(GOOGLE.tokenUrl, null, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    cache.set(userId, { token: r.access_token, exp: Date.now() + r.expires_in * 1000 });
    return r.access_token;
  } catch (e) {
    if (e instanceof GoogleApiError && (e.status === 400 || e.status === 401)) {
      cache.delete(userId);
      throw new GoogleNotConnectedError(); // token revocado o vencido
    }
    throw e;
  }
}
