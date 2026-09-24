"use client";

import { useEffect } from "react";
import { X, FileText, Download, ExternalLink, Eye } from "lucide-react";

export default function PdfViewerModal({
  isOpen,
  onClose,
  pdfUrl,
  candidateName,
}: {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  candidateName: string;
}) {
  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pdfUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-ink-border w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-ink-border flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary-tint text-primary flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="pdf-modal-title" className="text-sm font-bold text-ink-title truncate">
                Curriculum Vitae — {candidateName}
              </h3>
              <p className="text-[11px] text-ink-muted hidden sm:block">
                Visualizador de documento PDF oficial
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink-body hover:text-primary bg-surface-canvas hover:bg-primary-tint px-2.5 py-1.5 rounded-lg border border-ink-border transition-colors"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pestaña nueva</span>
            </a>

            <a
              href={pdfUrl}
              download={`CV_${candidateName.replace(/\s+/g, "_")}.pdf`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink-body hover:text-primary bg-surface-canvas hover:bg-primary-tint px-2.5 py-1.5 rounded-lg border border-ink-border transition-colors"
              title="Descargar copia del PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-ink-muted hover:text-ink-title hover:bg-surface-canvas rounded-lg transition-colors ml-1"
              aria-label="Cerrar visualizador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: PDF Viewer Iframe */}
        <div className="flex-1 w-full bg-surface-subtle relative">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title={`CV de ${candidateName}`}
          />

          {/* Fallback if iframe fails to display */}
          <noscript>
            <div className="p-8 text-center text-sm text-ink-body">
              <p>Tu navegador requiere JavaScript para visualizar este documento.</p>
              <a href={pdfUrl} className="text-primary font-bold underline mt-2 inline-block">
                Abrir archivo PDF
              </a>
            </div>
          </noscript>
        </div>
      </div>
    </div>
  );
}
