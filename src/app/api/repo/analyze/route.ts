import { NextResponse } from "next/server";
import type { RepoInfo } from "@/lib/ai/types";
import { parseRepo } from "@/lib/ai/repo-url";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Gemini puede tardar ~13 s con contexto; el límite por defecto de Vercel Hobby es menor

// Trae un repositorio PÚBLICO de GitHub (sin login del usuario): metadatos, lenguajes, topics, README y archivos de
// dependencias. Con GITHUB_TOKEN (opcional) sube el límite de consultas de 60 a 5,000 por hora.
const hits = new Map<string, number[]>();
const limitado = (ip: string) => {
  const now = Date.now();
  const r = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  r.push(now);
  hits.set(ip, r);
  return r.length > 20;
};

const ARCHIVOS = ["package.json", "requirements.txt", "pyproject.toml", "go.mod", "Cargo.toml", "pom.xml", "build.gradle", "Dockerfile"];

async function gh(url: string, accept: string, ms = 7000): Promise<Response> {
  const headers: Record<string, string> = { accept, "user-agent": "liver-companion-demo", "x-github-api-version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return fetch(url, { headers, signal: AbortSignal.timeout(ms) });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limitado(ip)) return NextResponse.json({ error: "Demasiadas consultas: espera un minuto." }, { status: 429 });
  const b = (await req.json().catch(() => null)) as { url?: string } | null;
  const ref = b?.url ? parseRepo(b.url) : null;
  if (!ref) return NextResponse.json({ error: "Escribe un repositorio de GitHub válido (https://github.com/usuario/repo)." }, { status: 400 });

  try {
    const base = `https://api.github.com/repos/${ref.owner}/${ref.repo}`;
    const r = await gh(base, "application/vnd.github+json");
    if (r.status === 404) return NextResponse.json({ error: "No encontramos ese repositorio (¿es público y está bien escrito?)." }, { status: 404 });
    if (r.status === 403 || r.status === 429)
      return NextResponse.json({ error: "GitHub agotó el límite de consultas sin token (60 por hora). Usa uno de los proyectos guardados o configura GITHUB_TOKEN." }, { status: 429 });
    if (!r.ok) return NextResponse.json({ error: `GitHub respondió ${r.status}.` }, { status: 502 });
    const meta = await r.json();

    const [lang, readme, ...archivos] = await Promise.all([
      gh(`${base}/languages`, "application/vnd.github+json").then((x) => (x.ok ? x.json() : {})).catch(() => ({})),
      gh(`${base}/readme`, "application/vnd.github.raw").then((x) => (x.ok ? x.text() : "")).catch(() => ""),
      ...ARCHIVOS.map((f) =>
        fetch(`https://raw.githubusercontent.com/${meta.full_name}/${meta.default_branch}/${f}`, { signal: AbortSignal.timeout(5000) })
          .then((x) => (x.ok ? x.text() : ""))
          .catch(() => "")
      ),
    ]);
    const files: Record<string, string> = {};
    ARCHIVOS.forEach((f, i) => {
      if (archivos[i]) files[f] = archivos[i].slice(0, 30_000);
    });
    const info: RepoInfo = {
      fullName: meta.full_name,
      url: meta.html_url,
      descripcion: String(meta.description ?? "").slice(0, 300),
      lenguajePrincipal: meta.language ?? null,
      lenguajes: lang as Record<string, number>,
      topics: Array.isArray(meta.topics) ? meta.topics : [],
      stars: meta.stargazers_count ?? 0,
      readme: String(readme).slice(0, 20_000),
      archivos: files,
      fuente: "github",
    };
    return NextResponse.json(info);
  } catch (e) {
    const timeout = e instanceof Error && /timeout|abort/i.test(e.message);
    return NextResponse.json({ error: timeout ? "GitHub tardó demasiado en responder." : "No se pudo consultar GitHub (¿hay internet?)." }, { status: 502 });
  }
}
