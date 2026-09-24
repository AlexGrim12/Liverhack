"use client";

import FooterMarca from "@/components/FooterMarca";
import AsistenteFlotante from "@/components/AsistenteFlotante";
import { UserRound, Users, UserCheck, CheckCircle2, Eye, ArrowRight } from "lucide-react";

type Props = {
  onSetRoleHrbp: () => void;
  onSetRoleAt: () => void;
  onSetRoleHm: () => void;
  onSetRoleCandidato: () => void;
  onReiniciar?: () => void; // gesto oculto: tres toques en el ícono del pie
};

export default function Landing({
  onSetRoleHrbp,
  onSetRoleAt,
  onSetRoleHm,
  onSetRoleCandidato,
  onReiniciar,
}: Props) {
  const roles = [
    {
      id: "hrbp",
      title: "HRBP",
      subtitle: "Business Partner",
      description: "Valida lo que necesita el Hiring Manager (viabilidad y banda salarial) y asigna al reclutador.",
      icon: Users,
      action: onSetRoleHrbp,
    },
    {
      id: "at",
      title: "Reclutamiento",
      subtitle: "Atracción de Talento",
      description: "Filtra candidatos, compara perfiles por compatibilidad y agenda entrevistas en Google Meet.",
      icon: UserCheck,
      action: onSetRoleAt,
    },
    {
      id: "hm",
      title: "Hiring Manager",
      subtitle: "Líder solicitante",
      description: "Captura la requisición con lo que necesita, revisa entrevistas con IA y decide finalistas.",
      icon: CheckCircle2,
      action: onSetRoleHm,
    },
    {
      id: "candidato",
      title: "Candidato/a",
      subtitle: "Mi proceso",
      description: "Ve en qué etapa vas, quién tiene tu proceso y, si llega, responde tu oferta. Lo mismo que ve el equipo, sin llamar a nadie.",
      icon: UserRound,
      action: onSetRoleCandidato,
    },
  ];

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col justify-between p-4 sm:p-8">
      {/* Brand Header */}
      <div className="max-w-2xl mx-auto w-full text-center pt-6 sm:pt-12">
        <div className="flex flex-col items-center gap-2 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/liverpool.png" alt="Liverpool" className="h-12 sm:h-14 w-auto" />
          <div className="text-xs font-bold text-accent">Liver Companion</div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-ink-title tracking-tight mt-4">
          Portal de Atracción y Selección
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto mt-1">
          Selecciona tu perfil de acceso para continuar:
        </p>
      </div>

      {/* Roles Grid */}
      <div className="max-w-2xl mx-auto w-full my-6 sm:my-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                type="button"
                key={role.id}
                onClick={role.action}
                className={`w-full text-left bg-white border border-ink-border hover:border-primary-border rounded-2xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-card flex flex-col justify-between group active:scale-98 focus:outline-none focus:border-primary`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-tint text-primary group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-ink-muted">
                      {role.subtitle}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-ink-title group-hover:text-primary transition-colors">
                    {role.title}
                  </h2>
                  <p className="text-xs text-ink-muted leading-relaxed mt-1 mb-4">
                    {role.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-ink-border/60 text-xs font-bold text-primary group-hover:text-primary-dark">
                  <span>Ingresar</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <FooterMarca onReiniciar={onReiniciar} />
      <AsistenteFlotante />
    </div>
  );
}
