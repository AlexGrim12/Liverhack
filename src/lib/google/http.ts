export class GoogleApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export class GoogleNotConnectedError extends Error {
  constructor() {
    super("Tu cuenta de Google no está conectada. Cierra sesión y vuelve a entrar con Google para dar los permisos.");
  }
}

export async function gfetch<T = unknown>(url: string, token: string | null, init: RequestInit & { raw?: boolean } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error?.message ?? JSON.stringify(j);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new GoogleApiError(res.status, `Google respondió ${res.status}: ${detail}`.slice(0, 400));
  }
  if (init.raw) return (await res.text()) as T;
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
