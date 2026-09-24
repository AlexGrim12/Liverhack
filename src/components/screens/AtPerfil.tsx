"use client";

import { useState } from "react";
import type { RondaVM } from "./HmEntrevista";
import { AgendarGoogleModal, GoogleAcciones, type GoogleActions } from "./GoogleActions";
import { buildIcs, descargarIcs } from "@/lib/ics";
import PdfViewerModal from "@/components/PdfViewerModal";
import {
  ArrowLeft,
  Calendar,
  Video,
  CheckCircle,
  Copy,
  ExternalLink,
  CalendarPlus,
  FileText,
  X,
  Maximize2,
  Download,
  Eye,
} from "lucide-react";

type ActiveCandidato = {
  id?: string;
  cvId?: string;
  nombre: string;
  iniciales: string;
  escolaridad: string;
  idiomas: string;
  compActual: string;
  compDeseada: string;
  compat: number;
  compatBg: string;
  compatColor: string;
  atributosIA: string[];
};

export default function AtPerfil({
  candidato,
  agendaConfirmed,
  meetLink,
  showAgendarModal,
  onShowAgendar,
  onHideAgendar,
  onConfirmarAgenda,
  onNavAtCandidatos,
  google,
  vacanteTitulo,
  agendaInfo,
  cvUrl,
  analisisCv,
  rondas,
}: {
  candidato: ActiveCandidato;
  agendaConfirmed: boolean;
  meetLink: string;
  showAgendarModal: boolean;
  onShowAgendar: () => void;
  onHideAgendar: () => void;
  onConfirmarAgenda: (d: { fecha: string; hora: string; entrevistadores: string }) => void;
  onNavAtCandidatos: () => void;
  google?: GoogleActions; // con Supabase: agenda real en Google Calendar/Meet
  vacanteTitulo?: string;
  agendaInfo?: { inicio: string; duracionMin: number } | null; // para la invitación .ics
  cvUrl?: string; // CV cargado (PDF)
  rondas?: RondaVM[]; // entrevistas ya realizadas (screening de RH y técnica)
  analisisCv?: { titular: string; anios: number; seniority: string; skills: string[]; destacados: string[]; ubicacion: string };
}) {
  const [copied, setCopied] = useState(false);
  const [fecha, setFecha] = useState("2026-09-26");
  const [hora, setHora] = useState("11:00");
  const [entrevistadores, setEntrevistadores] = useState("Diego Ramírez, Karla Ibarra");
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Resolver ruta efectiva del PDF
  const fallbackCvId = candidato.cvId || (candidato.id ? candidato.id.replace(/^cv-/, "") : undefined);
  const effectiveCvUrl = cvUrl || (fallbackCvId ? `/cvs/${fallbackCvId}.pdf` : undefined);

  // Invitación de calendario (.ics): abre en Google Calendar, Outlook o Apple Calendar, sin cuenta ni servidor
  function descargarInvitacion() {
    if (!agendaInfo) return;
    const ubicacion = meetLink ? `https://${meetLink}` : "";
    const titulo = `Entrevista — ${candidato.nombre}${vacanteTitulo ? ` — ${vacanteTitulo}` : ""}`;
    descargarIcs(
      `entrevista-${candidato.nombre.split(" ")[0]}.ics`,
      buildIcs({
        uid: `${Date.parse(agendaInfo.inicio)}-${candidato.nombre.replace(/\W+/g, "")}`,
        titulo,
        descripcion: `Entrevista de ${candidato.nombre}${vacanteTitulo ? ` para "${vacanteTitulo}"` : ""}.${ubicacion ? `\nGoogle Meet: ${ubicacion}` : ""}`,
        ubicacion,
        inicio: new Date(agendaInfo.inicio),
        duracionMin: agendaInfo.duracionMin,
        alarmaMin: 15,
      })
    );
  }

  function copyMeetLink() {
    if (meetLink) {
      navigator.clipboard.writeText(`https://${meetLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onNavAtCandidatos}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary-dark transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a candidatos</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary-tint text-primary font-black text-base flex items-center justify-center shrink-0">
              {candidato.iniciales}
            </div>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-ink-title truncate">
                {candidato.nombre}
              </h1>
              <p className="text-xs text-ink-muted truncate">
                {candidato.escolaridad}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {effectiveCvUrl && (
              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark bg-primary-tint/80 hover:bg-primary-tint px-3 py-1.5 rounded-xl border border-primary-border/60 transition-colors shadow-2xs"
                title="Abrir visor de CV en pantalla completa"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ver CV (PDF)</span>
              </button>
            )}

            <div
              className="px-3 py-1.5 rounded-xl font-black text-center shadow-2xs"
              style={{ background: candidato.compatBg, color: candidato.compatColor }}
            >
              <div className="text-sm">{candidato.compat}%</div>
              <div className="text-[8px] uppercase font-bold opacity-80 leading-none">
                Match
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmed Interview Card */}
      {agendaConfirmed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Entrevista agendada en Google Meet</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={copyMeetLink}
              className="inline-flex items-center gap-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "¡Copiado!" : "Copiar enlace"}</span>
            </button>
            <a
              href={`https://${meetLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Abrir Meet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {agendaInfo && (
              <button
                type="button"
                onClick={descargarInvitacion}
                className="inline-flex items-center gap-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Agregar a mi calendario (.ics)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Candidate Details */}
      <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-extrabold text-ink-muted uppercase tracking-wider">
          Información Clave
        </h2>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-surface-canvas p-3 rounded-xl">
            <div className="text-[10px] font-bold text-ink-muted uppercase">Compensación Actual</div>
            <div className="text-sm font-bold text-ink-title mt-0.5">{candidato.compActual}</div>
          </div>
          <div className="bg-surface-canvas p-3 rounded-xl">
            <div className="text-[10px] font-bold text-ink-muted uppercase">Pretensión Salarial</div>
            <div className="text-sm font-bold text-primary mt-0.5">{candidato.compDeseada}</div>
          </div>
        </div>

        <div className="text-xs space-y-2 pt-2 border-t border-ink-border">
          <div>
            <span className="text-ink-muted">Idiomas: </span>
            <span className="font-semibold text-ink-title">{candidato.idiomas}</span>
          </div>
          <div>
            <span className="text-ink-muted">Estudios: </span>
            <span className="font-semibold text-ink-title">{candidato.escolaridad}</span>
          </div>
        </div>

        {/* Skills */}
        <div className="pt-2 border-t border-ink-border">
          <div className="text-[11px] font-bold text-ink-muted uppercase mb-2">
            Habilidades y Certificaciones
          </div>
          <div className="flex flex-wrap gap-1.5">
            {candidato.atributosIA.map((attr) => (
              <span
                key={attr}
                className="text-xs font-bold bg-primary-tint text-primary-dark px-2.5 py-1 rounded-lg"
              >
                {attr}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Análisis del CV con IA */}
      {analisisCv && (
        <div className="bg-white border border-ink-border rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold text-ink-muted uppercase tracking-wider">Análisis del CV (IA)</h2>
            {effectiveCvUrl && (
              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark hover:underline"
              >
                <FileText className="w-3.5 h-3.5" /> Ver en visor PDF
              </button>
            )}
          </div>
          <p className="text-xs text-ink-body">
            <b className="text-ink-title">{analisisCv.titular}</b> · {analisisCv.ubicacion} · {analisisCv.anios} años · nivel {analisisCv.seniority}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analisisCv.skills.map((h) => (
              <span key={h} className="text-[11px] font-semibold bg-surface-canvas border border-ink-border text-ink-title px-2 py-0.5 rounded-md">{h}</span>
            ))}
          </div>
          {analisisCv.destacados.length > 0 && (
            <ul className="text-xs text-ink-body list-disc pl-4 space-y-0.5">
              {analisisCv.destacados.map((d) => <li key={d}>{d}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Visualizador de CV (PDF) Embebido */}
      {effectiveCvUrl && (
        <div className="bg-white border border-ink-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-tint text-primary flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-ink-title">
                  Curriculum Vitae — {candidato.nombre}
                </h2>
                <p className="text-[10px] text-ink-muted">Documento PDF oficial</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-tint hover:bg-primary-tint/80 px-2.5 py-1.5 rounded-lg border border-primary-border/60 transition-colors"
                title="Abrir en pantalla completa"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pantalla completa</span>
              </button>

              <a
                href={effectiveCvUrl}
                download={`CV_${candidato.nombre.replace(/\s+/g, "_")}.pdf`}
                className="p-1.5 text-ink-muted hover:text-primary rounded-lg border border-ink-border hover:bg-surface-canvas transition-colors"
                title="Descargar copia del PDF"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Iframe visor PDF */}
          <div className="w-full h-[520px] rounded-xl overflow-hidden border border-ink-border bg-surface-subtle shadow-inner">
            <iframe
              src={`${effectiveCvUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
              title={`CV de ${candidato.nombre}`}
            />
          </div>
        </div>
      )}

      {rondas && rondas.length > 0 && (
        <div className="bg-white border border-ink-border rounded-2xl p-4 shadow-xs space-y-2">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Rondas de entrevista</h2>
          <ol className="space-y-1.5">
            {rondas.map((r, i) => (
              <li key={r.id} className="flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-ink-title">{i + 1}. {r.titulo}</span>
                  <span className="text-ink-muted"> · {r.entrevistadores.map((f) => f.nombre).join(", ")}</span>
                  {r.tipo === "screening" && <span className="ml-1.5 text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">La hiciste tú</span>}
                </div>
                <span className="text-ink-muted shrink-0">{r.fecha} · {r.entrevistadores.every((f) => f.veredicto === "recomendado") ? "✓ Recomendada" : "Con reservas"}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action Button */}
      <div>
        <button
          type="button"
          onClick={onShowAgendar}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm py-3 rounded-xl shadow-xs transition-all active:scale-98"
        >
          <Calendar className="w-4 h-4 text-white" />
          <span>{google ? "Agendar en Google Calendar + Meet" : rondas?.length ? "Agendar siguiente ronda en Google Meet" : "Agendar entrevista en Google Meet"}</span>
        </button>
      </div>

      {google && <GoogleAcciones google={google} />}

      {/* Simple Scheduler Modal */}
      {showAgendarModal && google && <AgendarGoogleModal google={google} onClose={onHideAgendar} />}

      {showAgendarModal && !google && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-ink-border space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-ink-border">
              <h3 className="text-sm font-bold text-ink-title">
                Agendar Entrevista
              </h3>
              <button
                type="button"
                onClick={onHideAgendar}
                className="text-ink-muted hover:text-ink-title"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-ink-title mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-lg border border-ink-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-title mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-lg border border-ink-border focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-title mb-1">
                  Entrevistadores
                </label>
                <input
                  type="text"
                  value={entrevistadores}
                  onChange={(e) => setEntrevistadores(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-lg border border-ink-border focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-border">
              <button
                type="button"
                onClick={onHideAgendar}
                className="px-3 py-2 text-xs font-semibold text-ink-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onConfirmarAgenda({ fecha, hora, entrevistadores })}
                className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizador PDF en Pantalla Completa */}
      {effectiveCvUrl && (
        <PdfViewerModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          pdfUrl={effectiveCvUrl}
          candidateName={candidato.nombre}
        />
      )}
    </div>
  );
}
