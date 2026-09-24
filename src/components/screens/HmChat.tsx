"use client";

import { LiverMark } from "@/components/LiverLoader";
import { Send, Bot, User } from "lucide-react";

export type ChatMessageVM = {
  align: "flex-end" | "flex-start";
  bg: string;
  color: string;
  border: string;
  text: string;
};

export default function HmChat({
  chatMessages,
  chatInput,
  onChatInputChange,
  onEnviarChat,
  vacantes,
  vacanteId,
  onVacante,
  enviando,
  error,
  suggested: suggestedProp,
}: {
  chatMessages: ChatMessageVM[];
  chatInput: string;
  onChatInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnviarChat: (texto?: string) => void;
  vacantes?: { id: string; titulo: string }[]; // con Supabase: el bot responde sobre UNA vacante
  vacanteId?: string;
  onVacante?: (id: string) => void;
  enviando?: boolean;
  error?: string | null;
  suggested?: string[];
}) {
  const suggested = suggestedProp ?? [
    "¿Quién es la mejor candidata?",
    "Comparar Mariana vs Emiliano",
    "¿Qué dice el feedback técnico?",
  ];

  function handleSuggestedClick(prompt: string) {
    if (!enviando) onEnviarChat(prompt); // responde al instante: en vivo no hay que teclear ni dar Enter
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-8">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-ink-border shadow-xs">
        <h1 className="text-base sm:text-xl font-black text-ink-title">
          Asistente de Selección
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Haz preguntas sobre el perfil, entrevistas o pretensiones de los candidatos
        </p>
      </div>

      {vacantes && (
        <div>
          <label htmlFor="chat-vacante" className="block text-xs font-bold text-ink-title mb-1">Vacante</label>
          <select
            id="chat-vacante"
            value={vacanteId}
            onChange={(e) => onVacante?.(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-ink-border focus:outline-none focus:border-primary"
          >
            {vacantes.map((v) => (
              <option key={v.id} value={v.id}>{v.titulo}</option>
            ))}
          </select>
        </div>
      )}

      {/* Suggested prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {suggested.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => handleSuggestedClick(s)}
            className="bg-white hover:bg-primary-tint border border-ink-border text-ink-title hover:text-primary-dark text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors shadow-2xs shrink-0 active:scale-95"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat container */}
      <div className="bg-white border border-ink-border rounded-2xl flex flex-col h-[400px] sm:h-[460px] shadow-xs overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((m, i) => {
            const isUser = m.align === "flex-end";
            return (
              <div
                key={i}
                className={`flex gap-2 max-w-[85%] ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                    isUser
                      ? "bg-primary text-white"
                      : "bg-primary-tint text-primary font-bold"
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <LiverMark variant="glyph" size={16} once />}
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-primary text-white rounded-tr-xs"
                      : "bg-surface-canvas text-ink-title border border-ink-border rounded-tl-xs"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        {(enviando || error) && (
          <div className={`px-4 py-2 text-xs font-semibold border-t border-ink-border ${error ? "text-rose-700 bg-rose-50" : "text-ink-muted bg-surface-canvas"}`} role={error ? "alert" : "status"}>
            {error ?? (
              <span className="inline-flex items-center gap-2">
                <LiverMark size={24} /> Gemini está analizando a los candidatos…
              </span>
            )}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-surface-canvas border-t border-ink-border flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe tu consulta…"
            value={chatInput}
            onChange={onChatInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !enviando) onEnviarChat();
            }}
            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-ink-border focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => onEnviarChat()}
            className="bg-accent hover:bg-accent-hover text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
