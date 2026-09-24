"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

export default function Login({
  onGoogle,
  onPassword,
  error,
}: {
  onGoogle: () => void;
  onPassword: (email: string, password: string) => Promise<void>;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onPassword(email.trim(), password);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-ink-border rounded-2xl shadow-xs p-6 space-y-5">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm bg-accent" />
            </div>
            <div className="text-left leading-none">
              <div className="text-lg font-extrabold text-ink-title">Liverpool</div>
              <div className="text-xs font-semibold text-accent">Liver Companion</div>
            </div>
          </div>
          <p className="text-xs text-ink-muted">Inicia sesión para continuar</p>
        </div>

        <button
          type="button"
          onClick={onGoogle}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm py-2.5 rounded-xl transition-all active:scale-95"
        >
          <LogIn className="w-4 h-4" />
          <span>Continuar con Google</span>
        </button>

        <div className="flex items-center gap-3 text-[11px] text-ink-muted">
          <div className="flex-1 h-px bg-ink-border" />
          <span>o con usuario demo</span>
          <div className="flex-1 h-px bg-ink-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-ink-title mb-1">Correo</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patricia.vega@demo.liverpool.test"
              className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-xl border border-ink-border focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-ink-title mb-1">Contraseña</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-canvas rounded-xl border border-ink-border focus:outline-none focus:border-primary"
            />
          </div>
          {error && (
            <div role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl transition-all active:scale-95"
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
