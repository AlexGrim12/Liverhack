"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, MessageSquare, Search, Send } from "lucide-react";
import HiloComentarios from "@/components/HiloComentarios";
import EnviarEvaluacionModal, { type ConfigEvaluacion } from "@/components/EnviarEvaluacionModal";
import { TIPOS_EVALUACION, etiquetaEvaluacion, type Comentario, type Evaluacion, type RolComentario } from "@/lib/demo/postulaciones";

export type FilaPost = { id: string; vacanteId: string; vacante: string; nombre: string; iniciales: string; compat: number; estatus: string };

type CatEval = "sin" | "pendiente" | "entregada" | "calificada" | "vencida";
const catEval = (e?: Evaluacion): CatEval => (!e ? "sin" : e.estado === "enviada" ? "pendiente" : e.estado);
const CAT_LABEL: Record<CatEval, string> = { sin: "Sin enviar", pendiente: "Pendiente", entregada: "Por calificar", calificada: "Calificada", vencida: "Vencida" };

const csv = (v: unknown) => {
  let t = String(v ?? "");
  if (/^[=+\-@]/.test(t)) t = `'${t}`; // evita fórmulas al abrir el CSV en Excel
  return `"${t.replace(/"/g, '""')}"`;
};

// Vista masiva de todas las postulaciones: filtros, evaluación previa, comentarios del equipo y acciones en bloque.
export default function AtPostulaciones({
  filas,
  vacantes,
  evaluaciones,
  comentarios,
  rol,
  onEnviarEvaluacion,
  onCalificar,
  onComentar,
  onVerPerfil,
}: {
  filas: FilaPost[];
  vacantes: { id: string; titulo: string }[];
  evaluaciones: Record<string, Evaluacion>;
  comentarios: Comentario[];
  rol: RolComentario;
  onEnviarEvaluacion: (ids: string[], cfg: ConfigEvaluacion) => { enviadas: number; omitidas: number };
  onCalificar: (id: string, score: number) => void;
  onComentar: (ids: string[], texto: string) => void;
  onVerPerfil?: (f: FilaPost) => void;
}) {
  const [vac, setVac] = useState("");
  const [est, setEst] = useState("");
  const [ev, setEv] = useState<"" | CatEval>("");
  const [q, setQ] = useState("");
  const [soloCom, setSoloCom] = useState(false);
  const [orden, setOrden] = useState<"compat" | "eval" | "comentarios">("compat");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [abierto, setAbierto] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [masivo, setMasivo] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [nota, setNota] = useState<Record<string, string>>({});
  const esAt = rol === "at";

  const porCand = useMemo(() => {
    const m = new Map<string, Comentario[]>();
    comentarios.forEach((c) => m.set(c.candidatoId, [...(m.get(c.candidatoId) ?? []), c]));
    return m;
  }, [comentarios]);
  const estatuses = Array.from(new Set(filas.map((f) => f.estatus)));

  const visibles = filas
    .filter(
      (f) =>
        (!vac || f.vacanteId === vac) &&
        (!est || f.estatus === est) &&
        (!ev || catEval(evaluaciones[f.id]) === ev) &&
        (!soloCom || (porCand.get(f.id)?.length ?? 0) > 0) &&
        (!q || f.nombre.toLowerCase().includes(q.toLowerCase()) || f.vacante.toLowerCase().includes(q.toLowerCase()))
    )
    .sort((a, b) => {
      if (orden === "comentarios") return (porCand.get(b.id)?.length ?? 0) - (porCand.get(a.id)?.length ?? 0);
      if (orden === "eval") return (evaluaciones[b.id]?.score ?? -1) - (evaluaciones[a.id]?.score ?? -1);
      return b.compat - a.compat;
    });

  const cuenta = (c: CatEval) => filas.filter((f) => catEval(evaluaciones[f.id]) === c).length;
  const califs = filas.map((f) => evaluaciones[f.id]?.score).filter((x): x is number => typeof x === "number");
  const promedio = califs.length ? Math.round(califs.reduce((a, b) => a + b, 0) / califs.length) : 0;
  const todosSel = visibles.length > 0 && visibles.every((f) => sel.has(f.id));
  const selVisibles = visibles.filter((f) => sel.has(f.id));

  function exportar() {
    const base = selVisibles.length ? selVisibles : visibles;
    const filasCsv = [["Vacante", "Candidato", "Compatibilidad", "Estatus", "Evaluación", "Estado de la evaluación", "Puntaje", "Comentarios", "Último comentario"]].concat(
      base.map((f) => {
        const e = evaluaciones[f.id];
        const cs = porCand.get(f.id) ?? [];
        return [f.vacante, f.nombre, `${f.compat}%`, f.estatus, e ? TIPOS_EVALUACION[e.tipo].label : "", CAT_LABEL[catEval(e)], e?.score != null ? String(e.score) : "", String(cs.length), cs.length ? `${cs[cs.length - 1].autor}: ${cs[cs.length - 1].texto}` : ""];
      })
    );
    const blob = new Blob(["﻿" + filasCsv.map((r) => r.map(csv).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "postulaciones.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    setAviso(`Exportadas ${base.length} postulaciones a CSV.`);
  }

  const tile = (t: string, v: string | number, sub?: string) => (
    <div className="bg-white border border-ink-border rounded-2xl px-3 py-3 shadow-xs">
      <div className="text-[11px] font-bold text-ink-muted">{t}</div>
      <div className="text-2xl font-black text-ink-title leading-none mt-1">{v}</div>
      {sub && <div className="text-[10px] text-ink-muted mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-24">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-ink-title">Postulaciones</h1>
        <p className="text-xs text-ink-muted">Todas las postulaciones en un solo lugar: evaluación previa, comentarios del equipo y acciones en bloque.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {tile("Postulaciones", filas.length, `${vacantes.length} vacantes`)}
        {tile("Sin evaluación", cuenta("sin"), "por enviar")}
        {tile("Por calificar / pendientes", cuenta("entregada") + cuenta("pendiente"), `${cuenta("entregada")} entregadas`)}
        {tile("Promedio calificado", promedio ? `${promedio}/100` : "—", `${cuenta("calificada")} calificadas`)}
      </div>

      {aviso && (
        <div role="status" className="text-xs font-semibold rounded-xl px-3 py-2 border text-emerald-700 bg-emerald-50 border-emerald-200">
          {aviso}
        </div>
      )}

      <div className="bg-white border border-ink-border rounded-2xl p-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar candidato o vacante…" className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-ink-border focus:outline-none focus:border-primary" />
          </div>
          <select value={vac} onChange={(e) => setVac(e.target.value)} aria-label="Vacante" className="text-xs px-2.5 py-2 rounded-lg border border-ink-border">
            <option value="">Todas las vacantes</option>
            {vacantes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.titulo}
              </option>
            ))}
          </select>
          <select value={est} onChange={(e) => setEst(e.target.value)} aria-label="Estatus" className="text-xs px-2.5 py-2 rounded-lg border border-ink-border">
            <option value="">Todos los estatus</option>
            {estatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={ev} onChange={(e) => setEv(e.target.value as "" | CatEval)} aria-label="Evaluación" className="text-xs px-2.5 py-2 rounded-lg border border-ink-border">
            <option value="">Toda evaluación</option>
            {(Object.keys(CAT_LABEL) as CatEval[]).map((c) => (
              <option key={c} value={c}>
                {CAT_LABEL[c]}
              </option>
            ))}
          </select>
          <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} aria-label="Ordenar por" className="text-xs px-2.5 py-2 rounded-lg border border-ink-border">
            <option value="compat">Orden: compatibilidad</option>
            <option value="eval">Orden: puntaje</option>
            <option value="comentarios">Orden: comentarios</option>
          </select>
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-body">
            <input type="checkbox" checked={soloCom} onChange={(e) => setSoloCom(e.target.checked)} /> Con comentarios
          </label>
          <button type="button" onClick={exportar} className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-ink-border hover:border-primary">
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>

        {selVisibles.length > 0 && (
          <div className="rounded-xl bg-accent/5 border border-accent/30 p-3 space-y-2" role="region" aria-label="Acciones en bloque">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-ink-title">{selVisibles.length} seleccionadas</span>
              {esAt && (
                <button type="button" onClick={() => setModal(true)} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-accent text-white active:scale-95">
                  <Send className="w-3.5 h-3.5" /> Enviar evaluación previa
                </button>
              )}
              <button type="button" onClick={() => setSel(new Set())} className="text-xs font-semibold text-ink-muted">
                Quitar selección
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const t = masivo.trim();
                if (!t) return;
                onComentar(
                  selVisibles.map((f) => f.id),
                  t
                );
                setAviso(`Comentario publicado en ${selVisibles.length} postulaciones.`);
                setMasivo("");
              }}
              className="flex items-center gap-2"
            >
              <input value={masivo} onChange={(e) => setMasivo(e.target.value)} maxLength={400} placeholder="Comentar en todas las seleccionadas…" className="flex-1 text-xs px-3 py-2 rounded-lg border border-ink-border bg-white" />
              <button type="submit" disabled={!masivo.trim()} className="text-xs font-bold px-3 py-2 rounded-lg bg-primary text-white disabled:opacity-40">
                Comentar
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="bg-white border border-ink-border rounded-2xl shadow-xs overflow-x-auto">
        <table className="w-full text-xs min-w-[820px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-ink-muted border-b border-ink-border">
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todas"
                  checked={todosSel}
                  onChange={() => setSel(todosSel ? new Set() : new Set(visibles.map((f) => f.id)))}
                />
              </th>
              <th className="p-3">Candidato</th>
              <th className="p-3">Vacante</th>
              <th className="p-3">Compat.</th>
              <th className="p-3">Estatus</th>
              <th className="p-3">Evaluación previa</th>
              <th className="p-3">Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-ink-muted">
                  No hay postulaciones con estos filtros.
                </td>
              </tr>
            )}
            {visibles.map((f) => {
              const e = evaluaciones[f.id];
              const et = etiquetaEvaluacion(e);
              const cs = porCand.get(f.id) ?? [];
              const abre = abierto === f.id;
              return (
                <Fragment key={f.id}>
                  <tr className={`border-b border-ink-border/60 ${abre ? "bg-surface-canvas" : "hover:bg-surface-canvas/60"}`}>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${f.nombre}`}
                        checked={sel.has(f.id)}
                        onChange={() =>
                          setSel((s) => {
                            const n = new Set(s);
                            if (n.has(f.id)) n.delete(f.id);
                            else n.add(f.id);
                            return n;
                          })
                        }
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary-tint text-primary font-black text-[10px] flex items-center justify-center shrink-0">{f.iniciales}</span>
                        {onVerPerfil ? (
                          <button type="button" onClick={() => onVerPerfil(f)} className="font-bold text-ink-title hover:text-primary text-left">
                            {f.nombre}
                          </button>
                        ) : (
                          <span className="font-bold text-ink-title">{f.nombre}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-ink-muted max-w-[200px] truncate" title={f.vacante}>
                      {f.vacante}
                    </td>
                    <td className="p-3 font-bold">{f.compat}%</td>
                    <td className="p-3">{f.estatus}</td>
                    <td className="p-3">
                      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${et.cls}`}>{et.texto}</span>
                      {e && <div className="text-[10px] text-ink-muted mt-0.5">{TIPOS_EVALUACION[e.tipo].label}</div>}
                    </td>
                    <td className="p-3">
                      <button type="button" onClick={() => setAbierto(abre ? null : f.id)} aria-expanded={abre} className="inline-flex items-center gap-1.5 font-bold text-ink-title hover:text-primary">
                        {abre ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <MessageSquare className="w-3.5 h-3.5" /> {cs.length}
                      </button>
                      {cs.length > 0 && !abre && <div className="text-[10px] text-ink-muted mt-0.5 max-w-[220px] truncate">{cs[cs.length - 1].autor.split(" ")[0]}: {cs[cs.length - 1].texto}</div>}
                    </td>
                  </tr>
                  {abre && (
                    <tr className="border-b border-ink-border/60 bg-surface-canvas">
                      <td />
                      <td colSpan={6} className="p-3">
                        <div className="grid md:grid-cols-[1fr_260px] gap-4">
                          <div>
                            <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Comentarios del equipo</h3>
                            <HiloComentarios comentarios={cs} puedeComentar onComentar={(t) => onComentar([f.id], t)} compacto />
                          </div>
                          <div>
                            <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Evaluación previa</h3>
                            {!e && <p className="text-xs text-ink-muted">Aún no se envía.{esAt ? " Selecciónala y usa “Enviar evaluación previa”." : ""}</p>}
                            {e && (
                              <div className="text-xs space-y-1">
                                <p>
                                  <b>{TIPOS_EVALUACION[e.tipo].label}</b> · enviada {e.enviada}, vence {e.vence}
                                </p>
                                {esAt && e.estado === "entregada" && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={nota[f.id] ?? ""}
                                      onChange={(ev2) => setNota((n) => ({ ...n, [f.id]: ev2.target.value }))}
                                      placeholder="0–100"
                                      className="w-20 px-2 py-1.5 rounded-lg border border-ink-border"
                                    />
                                    <button
                                      type="button"
                                      disabled={nota[f.id] === undefined || nota[f.id] === "" || Number(nota[f.id]) < 0 || Number(nota[f.id]) > 100}
                                      onClick={() => {
                                        onCalificar(f.id, Math.round(Number(nota[f.id])));
                                        setAviso(`Evaluación de ${f.nombre} calificada.`);
                                      }}
                                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-white disabled:opacity-40"
                                    >
                                      Calificar
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <EnviarEvaluacionModal
          destinatarios={selVisibles.map((f) => f.nombre)}
          onCerrar={() => setModal(false)}
          onEnviar={(cfg) => {
            const r = onEnviarEvaluacion(
              selVisibles.map((f) => f.id),
              cfg
            );
            setModal(false);
            setSel(new Set());
            setAviso(`Evaluación enviada a ${r.enviadas} ${r.enviadas === 1 ? "postulación" : "postulaciones"}${r.omitidas ? `; ${r.omitidas} ya ${r.omitidas === 1 ? "tenía" : "tenían"} una evaluación y se ${r.omitidas === 1 ? "omitió" : "omitieron"}` : ""}.`);
          }}
        />
      )}
    </div>
  );
}
