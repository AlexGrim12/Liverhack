// Llamadas del navegador a las rutas /api (Google Workspace + Gemini). El servidor actúa con la sesión del usuario.
export async function apiPost<T = Record<string, unknown>>(path: string, body: unknown = {}): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
  return json as T;
}
