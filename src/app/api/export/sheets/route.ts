import { handle, HttpError, readJson, requireUser, assertUuid } from "@/lib/server/http";
import { getAccessToken } from "@/lib/google/tokens";
import { createSheet } from "@/lib/google/sheets";

export const dynamic = "force-dynamic";

const money = (n: number | null, m: string) => (n == null ? "" : `$${Number(n).toLocaleString("es-MX")} ${m.trim()}`);

// Exporta la comparativa de candidatos de una vacante a una hoja de Google Sheets (en el Drive de quien exporta).
export const POST = handle(async (req) => {
  const { db, admin, user } = await requireUser(["at", "hm", "hrbp"]);
  const b = await readJson<{ vacancyId?: string; applicationIds?: string[] }>(req);
  const vacancyId = assertUuid(b.vacancyId, "La vacante");
  const { data: vac } = await db.from("vacancy_overview").select("titulo").eq("id", vacancyId).maybeSingle();
  if (!vac) throw new HttpError(404, "No encontramos esa vacante.");

  let q = db
    .from("applications")
    .select(
      `id, estatus, compat_pct, candidates(nombre, institucion, carrera, compensacion_actual, compensacion_deseada, moneda,
        candidate_languages(idioma, nivel), candidate_attributes(tag))`
    )
    .eq("vacancy_id", vacancyId)
    .order("compat_pct", { ascending: false, nullsFirst: false });
  if (b.applicationIds?.length) q = q.in("id", b.applicationIds.map((i) => assertUuid(i, "Postulación")));
  const { data: apps, error } = await q;
  if (error) throw new HttpError(422, error.message);
  if (!apps?.length) throw new HttpError(404, "No hay candidatos para exportar.");

  const rows: (string | number)[][] = [["Candidato", "Escolaridad", "Compatibilidad %", "Estatus", "Idiomas", "Compensación actual", "Pretensión", "Atributos"]];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const a of apps as any[]) {
    const c = a.candidates;
    rows.push([
      c.nombre,
      [c.institucion, c.carrera].filter(Boolean).join(" — "),
      Number(a.compat_pct ?? 0),
      a.estatus,
      c.candidate_languages.map((l: { idioma: string; nivel: string }) => `${l.idioma} ${l.nivel}`).join(", "),
      money(c.compensacion_actual, c.moneda),
      money(c.compensacion_deseada, c.moneda),
      c.candidate_attributes.map((t: { tag: string }) => t.tag).join(", "),
    ]);
  }
  const token = await getAccessToken(admin, user.id);
  const sheet = await createSheet(token, `Comparativa — ${vac.titulo} — ${new Date().toLocaleDateString("es-MX")}`, rows);
  return { url: sheet.url, filas: rows.length - 1 };
});
