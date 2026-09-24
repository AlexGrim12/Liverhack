"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Home, Calendar, ListChecks, Plus, ShieldCheck, Sparkles } from "lucide-react";
import {
  ETAPAS,
  VACANTES_RAW,
  CANDIDATOS_RAW,
  CAMPOS_CATEGORIA,
  ESCOLARIDADES,
  ESTATUSES,
  COMPETENCIAS,
  NIVELES,
  ESTUDIOS,
  SOLICITANTES,
  BPS,
  ATS,
  HM_PERSONA,
  CATEGORIA_AREA,
  ROLE_LABELS,
  DEFAULT_SCREEN,
  CALENDAR_EVENTS,
  CALENDAR_MONTH,
  PENDIENTES,
  initials,
  compatColors,
  estatusColors,
  Role,
  VacanteRaw,
  CandidatoRaw,
  PendienteItem,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import * as repo from "@/lib/supabase/repo";
import { apiPost } from "@/lib/api";
import { avisarChat } from "@/lib/chat";
import { analyzeCv } from "@/lib/ai/cv";
import { analyzeRepo } from "@/lib/ai/repo";
import type { RepoInfo, TranscriptSummary } from "@/lib/ai/types";
import { summarizeTranscript } from "@/lib/ai/transcript";
import { TRANSCRIPCION_MARIANA, TRANSCRIPCION_SCREENING_MARIANA } from "@/lib/demo/transcripcion";
import { parseCriterios, evaluarCriterios } from "@/lib/ai/criteria";
import { scoreCompat } from "@/lib/ai/compat";
import { BASELINE, CVS, REPO_POR_DEFECTO, REQUISICION_V1, VACANTE_CON_CVS, compatBase, correrAnalisis } from "@/lib/demo/candidatos";
import { REPOS_DEMO } from "@/lib/demo/repos";
import { GOOGLE_SCOPES } from "@/lib/google/scopes";
import Landing from "@/components/screens/Landing";
import Login from "@/components/screens/Login";
import TopBar from "@/components/TopBar";
import Sidebar, { SidebarItem } from "@/components/Sidebar";
import Dashboard, { BuiltVacante } from "@/components/screens/Dashboard";
import HmNueva, { RequisicionForm } from "@/components/screens/HmNueva";
import HrbpValidar, { RequisicionPorValidar } from "@/components/screens/HrbpValidar";
import AtCandidatos from "@/components/screens/AtCandidatos";
import AtComparar from "@/components/screens/AtComparar";
import AtPerfil from "@/components/screens/AtPerfil";
import NuevoCandidatoModal from "@/components/screens/NuevoCandidatoModal";
import AtCompat, { CompatUI } from "@/components/screens/AtCompat";
import CerrarVacanteModal, { MotivoCierre } from "@/components/screens/CerrarVacanteModal";
import HmEntrevista, { EntrevistaVM } from "@/components/screens/HmEntrevista";
import type { GoogleActions } from "@/components/screens/GoogleActions";
import { LiverExito, LiverSplash, LiverTransicion } from "@/components/LiverLoader";
import CandidatoPortal, { type PersonaPortal } from "@/components/screens/CandidatoPortal";
import HmChat from "@/components/screens/HmChat";
import UserDashboard from "@/components/screens/UserDashboard";
import UserDetalle from "@/components/screens/UserDetalle";
import Calendario from "@/components/screens/Calendario";
import Pendientes from "@/components/screens/Pendientes";

type ChatMessage = { role: "user" | "assistant"; text: string };

const INITIAL_CHAT: ChatMessage[] = [];

// Respuesta simulada del asistente (modo demo): coherente con los datos de la vacante de Mariana.
const DEMO_RESUMEN_TRANSCRIPCION = summarizeTranscript(TRANSCRIPCION_MARIANA, "Mariana Coronado Reyes");

const RESUMEN_SCREENING = summarizeTranscript(TRANSCRIPCION_SCREENING_MARIANA, "Mariana Coronado Reyes");

const demoChatReply = () => {
  const pct = (id: string) => BASELINE.filas.find((f) => f.cv.id === id)?.compat.total ?? 0;
  const primero = BASELINE.filas[0];
  return (
    `Con base en la entrevista técnica, los ${BASELINE.filas.length} CVs analizados y el proyecto de referencia, recomiendo a ${primero.cv.nombre}:\n\n` +
    `• Compatibilidad: ${primero.compat.total}%, la más alta del grupo (Emiliano ${pct("c2")}%, Daniela ${pct("c3")}%)\n` +
    `• 3 de 3 evaluaciones la recomiendan: screening de RH (Sofía Martínez) y entrevista técnica (Diego Ramírez y Karla Ibarra)\n` +
    `• Coincide en ${primero.compat.coincidencias.filter((c) => c.tipo === "exacta").slice(0, 4).map((c) => c.label).join(", ")}, y cumple con la requisición validada por el BP\n\n` +
    `Emiliano tiene su entrevista pendiente y Daniela sigue en screening, así que aún no hay evidencia para compararlos. La decisión final es tuya.`
  );
};


const USER_EXTRA: Record<string, { proximaEntrevista: { fecha: string; candidato: string; entrevistadores: string } | null; historial: { fecha: string; candidato: string; estatus: string }[] }> = {
  v1: {
    proximaEntrevista: { fecha: "26 sep 2026 · 11:00 am", candidato: "Emiliano Vázquez Tello", entrevistadores: "Diego Ramírez, Karla Ibarra" },
    historial: [
      { fecha: "12 sep 2026", candidato: "Mariana Coronado Reyes · Screening de RH", estatus: "Completada" },
      { fecha: "18 sep 2026", candidato: "Mariana Coronado Reyes · Entrevista técnica", estatus: "Completada" },
    ],
  },
  v2: { proximaEntrevista: null, historial: [] },
  v3: { proximaEntrevista: null, historial: [] },
};

const EMPTY_FORM: RequisicionForm = {
  titulo: "",
  categoria: "",
  nivel: "medio",
  stack: [],
  competencias: [],
  expMinima: 2,
  cert: "",
  estudios: "Licenciatura terminada",
  habilidades: "",
  salarioMin: "",
  salarioMax: "",
  solicitante: "",
  bp: BPS[0] ?? "",
};

// Con Supabase configurado la app usa la base real (login + RLS); sin él corre en modo demo en memoria.
const SUPA = isSupabaseConfigured;
// Link de Meet que se muestra al agendar en modo demo: una reunión creada de antemano (NEXT_PUBLIC_MEET_LINK).
// Sin configurar, "meet.google.com/new" abre una reunión instantánea con la sesión de Google del navegador.
const MEET_LINK = (process.env.NEXT_PUBLIC_MEET_LINK || "meet.google.com/new").replace(/^https?:\/\//, "");
const fmtCuando = (d: Date) =>
  d.toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Mexico_City" });

const EMPTY_TRACKING: repo.Tracking = { proximaEntrevista: null, historial: [] };

const mxn = (n: number | null) => (n == null ? "—" : "$" + n.toLocaleString("es-MX"));

export default function App() {
  const [role, setRoleState] = useState<Role | null>(null);
  const [screen, setScreen] = useState<string>("landing");
  const [activeVacanteId, setActiveVacanteId] = useState<string>(SUPA ? "" : "v1");
  const [activeCandidatoId, setActiveCandidatoId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Vacantes vivas: el HM crea/edita requisiciones y el BP las valida (misma regla que el esquema de BD).
  const [vacantesData, setVacantesData] = useState<VacanteRaw[]>(SUPA ? [] : VACANTES_RAW);

  // Supabase: sesión, catálogo y datos cargados (RLS decide qué ve cada rol)
  const db = useMemo(() => (SUPA ? createClient() : null), []);
  const [authLoading, setAuthLoading] = useState(SUPA);
  const [me, setMe] = useState<repo.Session | null>(null);
  const meRef = useRef<repo.Session | null>(null);
  const [catalogo, setCatalogo] = useState<repo.Catalogo | null>(null);
  const [supaError, setSupaError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [supaPendientes, setSupaPendientes] = useState<PendienteItem[]>([]);
  const [candidatosByVac, setCandidatosByVac] = useState<Record<string, CandidatoRaw[]>>({});
  const [tracking, setTracking] = useState<repo.Tracking>(EMPTY_TRACKING);

  const [form, setForm] = useState<RequisicionForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [validarResultado, setValidarResultado] = useState<string | null>(null);
  const [validarError, setValidarError] = useState<string | null>(null);

  const [filtroEscolaridad, setFiltroEscolaridad] = useState<string[]>([]);
  const [filtroEstatus, setFiltroEstatus] = useState<string[]>([]);
  const [compatMin, setCompatMin] = useState(0);

  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [agendaConfirmed, setAgendaConfirmed] = useState(false);
  const [agendaInfo, setAgendaInfo] = useState<{ inicio: string; duracionMin: number } | null>(null);
  const [meetLink, setMeetLink] = useState("");

  const [hmDecision, setHmDecision] = useState<string | null>(null);
  const [personaId, setPersonaId] = useState("mariana");
  const [ofertaResp, setOfertaResp] = useState<Record<string, "aceptada" | "rechazada">>({});

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(SUPA ? [] : INITIAL_CHAT);
  const [chatVacanteId, setChatVacanteId] = useState("");
  const [chatConvId, setChatConvId] = useState<string | null>(null);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [hmMensaje, setHmMensaje] = useState<string | null>(null);
  const [accionMsg, setAccionMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [accionBusy, setAccionBusy] = useState(false);
  const [cierre, setCierre] = useState<{ v: VacanteRaw; finalistas: { id: string; nombre: string }[] } | null>(null);
  const [cierreError, setCierreError] = useState<string | null>(null);
  const [altaOpen, setAltaOpen] = useState(false);
  const [altaMsg, setAltaMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // Compatibilidad con IA (demo): CVs cargados vs. un repositorio de GitHub + contexto libre
  const [repos, setRepos] = useState<RepoInfo[]>(REPOS_DEMO);
  const [compatUI, setCompatUI] = useState<CompatUI>({
    repo: REPO_POR_DEFECTO,
    perfil: BASELINE.perfil,
    contexto: "",
    conRequisicion: true,
    analizado: false,
    filas: BASELINE.filas,
    progreso: null,
    cargandoRepo: false,
    error: null,
    motor: "local",
    explicaciones: {},
  });
  const [geminiOk, setGeminiOk] = useState(false);
  const [demoCands, setDemoCands] = useState<Record<string, CandidatoRaw[]>>({});
  const [entrevistasEval, setEntrevistasEval] = useState<repo.EntrevistaEval[]>([]);
  const [calEventos, setCalEventos] = useState<repo.EventoEntrevista[]>([]);

  const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Ocurrió un error inesperado.");

  // Sesión: al entrar (o al volver del login con Google) se carga el perfil y el rol viene de la base.
  useEffect(() => {
    if (!db) return;
    let active = true;
    const load = async () => {
      try {
        const sesion = await repo.getSession(db);
        if (!active) return;
        const previo = meRef.current;
        meRef.current = sesion;
        setMe(sesion);
        if (!sesion) {
          setRoleState(null);
          setScreen("landing");
        } else if (!previo || previo.id !== sesion.id) {
          setRoleState(sesion.role);
          setScreen(DEFAULT_SCREEN[sesion.role]);
        }
      } catch (e) {
        if (active) setLoginError(errMsg(e));
      } finally {
        if (active) setAuthLoading(false);
      }
    };
    void load();
    const { data } = db.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void load();
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [db]);

  // Catálogo (plantillas, competencias, personas): una vez por sesión
  useEffect(() => {
    if (!db || !me) return;
    repo.getCatalogo(db).then(setCatalogo).catch((e) => setSupaError(errMsg(e)));
  }, [db, me]);

  const refresh = useCallback(async () => {
    if (!db || !me) return;
    try {
      const [vs, pend, ents] = await Promise.all([
        repo.listVacantes(db),
        repo.listPendientes(db, me.role),
        me.role === "hm" ? repo.listEntrevistasPorEvaluar(db, me.id) : Promise.resolve([]),
      ]);
      setVacantesData(vs);
      setSupaPendientes(pend);
      setEntrevistasEval(ents);
      setSupaError(null);
    } catch (e) {
      setSupaError(errMsg(e));
    }
  }, [db, me]);

  // Los datos se releen al cambiar de pantalla (pocos registros; evita datos viejos entre roles/acciones)
  useEffect(() => {
    void refresh();
  }, [refresh, screen]);

  // Candidatos de la vacante activa
  useEffect(() => {
    if (!db || !me || !activeVacanteId) return;
    if (!["at-candidatos", "at-comparar", "at-perfil"].includes(screen)) return;
    repo
      .listCandidatos(db, activeVacanteId)
      .then((c) => setCandidatosByVac((prev) => ({ ...prev, [activeVacanteId]: c })))
      .catch((e) => setSupaError(errMsg(e)));
  }, [db, me, screen, activeVacanteId]);

  // Seguimiento del solicitante (próxima entrevista e historial)
  useEffect(() => {
    if (!db || !me || screen !== "user-detalle" || !activeVacanteId) return;
    setTracking(EMPTY_TRACKING);
    repo.getTracking(db, activeVacanteId).then(setTracking).catch((e) => setSupaError(errMsg(e)));
  }, [db, me, screen, activeVacanteId]);

  useEffect(() => {
    if (!db || !me || screen !== `${me.role}-calendario`) return;
    const hoy = new Date();
    repo.listCalendario(db, hoy.getFullYear(), hoy.getMonth()).then(setCalEventos).catch((e) => setSupaError(errMsg(e)));
  }, [db, me, screen]);

  async function signInGoogle() {
    if (!db) return;
    setLoginError(null);
    const { error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Calendar/Drive/Gmail a nombre del usuario: permisos extra + refresh token (access_type=offline)
        scopes: GOOGLE_SCOPES.filter((sc) => sc.startsWith("https://")).join(" "),
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) setLoginError(error.message);
  }
  async function signInPassword(email: string, password: string) {
    if (!db) return;
    setLoginError(null);
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) setLoginError(error.message);
  }

  // Animaciones cortas con el ícono: transición de perfil y momento de éxito
  const [transKey, setTransKey] = useState(0);
  const [exito, setExito] = useState<{ k: number; texto: string }>({ k: 0, texto: "" });
  const celebrar = (texto: string) => setExito((e) => ({ k: e.k + 1, texto }));
  useEffect(() => {
    if (!exito.k) return;
    const t = setTimeout(() => setExito((e) => ({ ...e, k: 0 })), 1400);
    return () => clearTimeout(t);
  }, [exito.k]);
  useEffect(() => {
    if (!transKey) return;
    const t = setTimeout(() => setTransKey(0), 800);
    return () => clearTimeout(t);
  }, [transKey]);

  // Reinicio al happy path. Modo demo: todo el estado vive en memoria, así que es recargar la app (sin repetir la pantalla de carga).
  // Modo conectado: pide al servidor restaurar la base (solo HRBP y solo si el servidor lo permite) y vuelve a leer los datos.
  const [restaurando, setRestaurando] = useState(false);
  async function reiniciarDemo() {
    if (SUPA) {
      if (role !== "hrbp") return setAccionMsg({ ok: false, text: "Solo el HRBP puede restaurar la base." });
      if (restaurando) return;
      setRestaurando(true);
      try {
        await apiPost("/api/admin/reset-demo");
        await refresh();
        setScreen(DEFAULT_SCREEN.hrbp);
        celebrar("Base restaurada al happy path");
      } catch (e) {
        setAccionMsg({ ok: false, text: errMsg(e) });
      } finally {
        setRestaurando(false);
      }
      return;
    }
    try {
      sessionStorage.setItem("liver-sin-splash", "1");
    } catch {
      /* sin almacenamiento: solo se verá la pantalla de carga */
    }
    window.location.assign("/");
  }
  const reiniciarRef = useRef(reiniciarDemo);
  reiniciarRef.current = reiniciarDemo;

  // Atajo oculto para reiniciar la demo: Ctrl+Alt+R (también triple clic en el logo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.code === "KeyR") void reiniciarRef.current(); // e.code: en Mac Option+R produce "®" en e.key
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function setRole(r: Role) {
    setRoleState(r);
    setScreen(DEFAULT_SCREEN[r]);
    setTransKey((k) => k + 1);
  }
  function resetRole() {
    if (db) void db.auth.signOut(); // el listener de sesión regresa al login
    setRoleState(null);
    setScreen("landing");
    setForm(EMPTY_FORM);
    setEditingId(null);
    setEnviado(null);
    setFormError(null);
    setValidarResultado(null);
    setValidarError(null);
    setShowAgendarModal(false);
    setAgendaConfirmed(false);
    setAgendaInfo(null);
    setHmDecision(null);
    setCompareIds([]);
  }
  function nav(s: string) {
    if (s !== "hrbp-validar") setValidarResultado(null);
    if (s !== "hm-entrevista") setHmMensaje(null);
    setAccionMsg(null);
    if (s !== "at-candidatos") setAltaMsg(null);
    setScreen(s);
  }
  function goTo(s: string, vacanteId?: string) {
    if (vacanteId) setActiveVacanteId(vacanteId);
    setScreen(s);
  }

  function startNueva() {
    setForm({ ...EMPTY_FORM, bp: bpsOpciones[0] ?? "" });
    setEditingId(null);
    setEnviado(null);
    setFormError(null);
    setScreen("hm-nueva");
  }

  function startEditar(v: VacanteRaw) {
    setForm({
      titulo: v.titulo,
      categoria: v.categoria,
      nivel: v.nivel,
      stack: v.requisitos.stack,
      competencias: v.requisitos.competencias,
      expMinima: v.requisitos.expMinima,
      cert: v.requisitos.cert,
      estudios: v.requisitos.estudios,
      habilidades: v.requisitos.habilidades,
      salarioMin: v.requisitos.salarioMin?.toString() ?? "",
      salarioMax: v.requisitos.salarioMax?.toString() ?? "",
      solicitante: v.solicitante,
      bp: v.hrbp,
    });
    setEditingId(v.id);
    setEnviado(null);
    setFormError(null);
    setScreen("hm-nueva");
  }

  // ---- Cambios de etapa: Iniciar búsqueda, Pasar a Atracción, Enviar pool al HM, Pasar a Oferta, Cerrar/Cancelar ----
  const ETAPA_KEYS = ["requisicion", "alineacion", "busqueda", "atraccion", "seleccion", "oferta"] as const;
  const MOTIVO_LABEL: Record<MotivoCierre, string> = {
    contratado: "contratación realizada",
    cancelada: "posición cancelada",
    sin_candidatos: "sin candidatos adecuados",
    presupuesto: "falta de presupuesto",
  };

  async function avanzarEtapa(v: VacanteRaw, destino: repo.EtapaDestino) {
    setAccionMsg(null);
    const nombre = ETAPAS[ETAPA_KEYS.indexOf(destino)];
    if (SUPA) {
      if (!db) return;
      setAccionBusy(true);
      try {
        await repo.cambiarEtapa(db, v.id, destino); // las reglas del flujo las valida la base y devuelve el mensaje
        setAccionMsg({ ok: true, text: `«${v.titulo}» pasó a ${nombre}.` });
        await refresh();
      } catch (e) {
        setAccionMsg({ ok: false, text: errMsg(e) });
      } finally {
        setAccionBusy(false);
      }
      return;
    }
    // Modo demo: mismas reglas básicas que la base
    if ((destino === "atraccion" || destino === "seleccion") && v.candidatosCount === 0)
      return setAccionMsg({ ok: false, text: "Agrega al menos un candidato antes de continuar." });
    if (destino === "oferta" && hmDecision !== "finalista" && !(CANDIDATOS_RAW[v.id] || []).some((c) => c.estatus === "Finalista"))
      return setAccionMsg({ ok: false, text: "Marca al menos un finalista antes de pasar a Oferta." });
    setVacantesData((prev) => prev.map((x) => (x.id === v.id ? { ...x, etapaIndex: ETAPA_KEYS.indexOf(destino) } : x)));
    setAccionMsg({ ok: true, text: `«${v.titulo}» pasó a ${nombre}.` });
    celebrar(v.id === "v1" && destino === "oferta" ? "Oferta lista para Mariana" : `Pasó a ${nombre}`);
  }

  async function abrirCierre(v: VacanteRaw) {
    setCierreError(null);
    setAccionMsg(null);
    let finalistas: { id: string; nombre: string }[] = [];
    if (v.etapaIndex === 5 && role === "hrbp") {
      if (SUPA && db) {
        try {
          finalistas = await repo.listFinalistas(db, v.id);
        } catch (e) {
          return setAccionMsg({ ok: false, text: errMsg(e) });
        }
      } else {
        finalistas = (CANDIDATOS_RAW[v.id] || []).filter((c) => c.estatus !== "Descartado").map((c) => ({ id: c.id, nombre: c.nombre }));
      }
    }
    setCierre({ v, finalistas });
  }

  async function confirmarCierre(motivo: MotivoCierre, applicationId?: string) {
    if (!cierre) return;
    const v = cierre.v;
    if (SUPA) {
      if (!db) return;
      try {
        await repo.cerrarVacante(db, v.id, motivo, applicationId);
      } catch (e) {
        setCierreError(errMsg(e));
        return;
      }
    } else {
      setVacantesData((prev) => prev.filter((x) => x.id !== v.id));
    }
    setCierre(null);
    setAccionMsg({ ok: true, text: `«${v.titulo}» se cerró (${MOTIVO_LABEL[motivo]}).` });
    if (SUPA) await refresh();
  }

  // ---- Alta de candidato (+ CV + análisis con Gemini) ----
  async function altaCandidato(input: repo.NuevoCandidatoInput, cv: File | null) {
    setAltaMsg(null);
    if (SUPA) {
      if (!db || !me) return;
      const r = await repo.createCandidato(db, me.id, activeVacanteId, input, cv);
      let extra = "";
      if (r.cvPath && r.cvPath.toLowerCase().endsWith(".pdf")) {
        try {
          const x = await apiPost<{ atributosNuevos: number; idiomas: number }>(`/api/candidates/${r.candidateId}/extract`);
          extra = ` Gemini detectó ${x.atributosNuevos} atributo(s) en el CV.`;
        } catch (e) {
          extra = ` (No se pudo analizar el CV con Gemini: ${errMsg(e)})`;
        }
      }
      setAltaMsg({ ok: true, text: `${input.nombre.trim()} se agregó a la vacante.${extra}` });
      const [c] = await Promise.all([repo.listCandidatos(db, activeVacanteId), refresh()]);
      setCandidatosByVac((prev) => ({ ...prev, [activeVacanteId]: c }));
      return;
    }
    // Modo demo: se agrega en memoria
    if (!input.nombre.trim()) throw new Error("Escribe el nombre del candidato.");
    if (!input.avisoPrivacidad) throw new Error("Confirma que la persona candidata aceptó el aviso de privacidad.");
    const nuevo: CandidatoRaw = {
      id: `demo-${Date.now()}`,
      nombre: input.nombre.trim(),
      escolaridad: [input.institucion.trim(), input.carrera.trim()].filter(Boolean).join(" — ") || "—",
      compat: Number(input.compat) || 0,
      estatus: "Screening",
      idiomas: input.idiomas.filter((l) => l.idioma.trim()).map((l) => `${l.idioma.trim()} ${l.nivel}`).join(", ") || "—",
      compActual: input.compActual ? `${mxn(Number(input.compActual))} MXN` : "—",
      compDeseada: input.compDeseada ? `${mxn(Number(input.compDeseada))} MXN` : "—",
      atributosIA: [],
    };
    setDemoCands((prev) => ({ ...prev, [activeVacanteId]: [...(prev[activeVacanteId] ?? []), nuevo] }));
    setVacantesData((prev) => prev.map((x) => (x.id === activeVacanteId ? { ...x, candidatosCount: x.candidatosCount + 1 } : x)));
    setAltaMsg({ ok: true, text: `${nuevo.nombre} se agregó a la vacante.` });
  }

  // ---- Compatibilidad con IA: repositorio de GitHub + contexto libre ----
  useEffect(() => {
    if (SUPA) return;
    fetch("/api/ai/gemini").then((r) => r.json()).then((j) => setGeminiOk(!!j.disponible)).catch(() => setGeminiOk(false));
  }, []);

  const perfilPara = (repo: RepoInfo, conReq: boolean) => analyzeRepo(repo, conReq ? REQUISICION_V1 : undefined);

  function seleccionarRepo(fullName: string) {
    const repo = repos.find((r) => r.fullName === fullName);
    if (!repo) return;
    setCompatUI((u) => ({ ...u, repo, perfil: perfilPara(repo, u.conRequisicion), error: null }));
  }

  async function traerRepo(url: string) {
    setCompatUI((u) => ({ ...u, cargandoRepo: true, error: null }));
    try {
      const res = await fetch("/api/repo/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "No se pudo traer el repositorio.");
      const repo = j as RepoInfo;
      setRepos((prev) => (prev.some((r) => r.fullName === repo.fullName && r.fuente === "github") ? prev.map((r) => (r.fullName === repo.fullName ? repo : r)) : [repo, ...prev.filter((r) => r.fullName !== repo.fullName)]));
      setCompatUI((u) => ({ ...u, repo, perfil: perfilPara(repo, u.conRequisicion), cargandoRepo: false }));
    } catch (e) {
      // sin internet o sin cuota: si el repositorio está guardado, se usa la copia
      const guardado = repos.find((r) => url.toLowerCase().includes(r.fullName.toLowerCase()));
      if (guardado) setCompatUI((u) => ({ ...u, repo: guardado, perfil: perfilPara(guardado, u.conRequisicion), cargandoRepo: false, error: `${errMsg(e)} Se usó la copia guardada de ${guardado.fullName}.` }));
      else setCompatUI((u) => ({ ...u, cargandoRepo: false, error: errMsg(e) }));
    }
  }

  async function analizarCompat() {
    const pasos = ["Leyendo los 10 CVs cargados…", "Extrayendo habilidades, años y liderazgo de cada CV…", "Analizando el repositorio de GitHub…", "Comparando contra la requisición validada…", "Aplicando tu contexto…"];
    setCompatUI((u) => ({ ...u, error: null, explicaciones: {}, motor: "local" }));
    for (const p of pasos) {
      setCompatUI((u) => ({ ...u, progreso: p }));
      await new Promise((r) => setTimeout(r, 380));
    }
    const { repo, contexto, conRequisicion } = compatUI;
    const r = correrAnalisis(repo, contexto, conRequisicion);
    setCompatUI((u) => ({ ...u, perfil: r.perfil, filas: r.filas, analizado: true, progreso: geminiOk ? "Gemini está redactando el análisis…" : null }));
    if (geminiOk) {
      // Gemini real: (1) evalúa el contexto libre contra cada CV y (2) redacta la explicación de los mejores candidatos
      let filas = r.filas;
      let motor: "local" | "gemini" = "local";
      const criterios = parseCriterios(contexto);
      if (criterios.length) {
        setCompatUI((u) => ({ ...u, progreso: "Gemini está evaluando tu contexto contra cada CV…" }));
        try {
          const res = await fetch("/api/ai/gemini", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              tarea: "criterios",
              datos: {
                criterios,
                candidatos: r.filas.map((f) => ({ id: f.cv.id, nombre: f.cv.nombre, titular: f.cv.titular, ubicacion: f.cv.ubicacion, resumen: f.cv.resumen, experiencia: f.cv.experiencia, educacion: f.cv.educacion, certificaciones: f.cv.certificaciones, idiomas: f.cv.idiomas, intereses: f.cv.intereses, skills: f.cv.skills })),
              },
            }),
          });
          const j = res.ok ? await res.json() : null;
          const porId = new Map<string, { texto: string; cumple: "si" | "parcial" | "no"; evidencia: string; sensible: boolean }[]>((j?.resultados ?? []).map((x: { id: string; criterios: never[] }) => [x.id, x.criterios]));
          if (porId.size) {
            filas = r.filas
              .map((f) => {
                const g = porId.get(f.cv.id) ?? [];
                const locales = evaluarCriterios(criterios, f.cv);
                const mezclados = locales.map((l, i) => {
                  if (l.ignorado) return l; // el filtro de datos sensibles local siempre manda
                  const x = g[i];
                  if (!x) return l;
                  if (x.sensible) return { ...l, cumple: "no" as const, evidencia: "Criterio con dato personal sensible: se ignora", ignorado: true };
                  return { texto: l.texto, cumple: x.cumple, evidencia: x.evidencia };
                });
                return { ...f, compat: scoreCompat(f.cv.id, f.analisis, r.perfil, mezclados) };
              })
              .sort((a, b) => b.compat.total - a.compat.total);
            motor = "gemini";
            setCompatUI((u) => ({ ...u, filas, motor: "gemini" }));
          }
        } catch {
          /* se conserva el análisis local */
        }
      }
      const top = filas.slice(0, 4);
      const resultados = await Promise.all(
        top.map((f) =>
          fetch("/api/ai/gemini", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tarea: "compat", datos: { proyecto: repo.fullName, candidato: f.cv.nombre, titular: f.cv.titular, compatibilidad: f.compat.total, coincidencias: f.compat.coincidencias, brechas: f.compat.brechas, criterios: f.compat.criterios } }),
          })
            .then((x) => (x.ok ? x.json() : null))
            .catch(() => null)
        )
      );
      const explicaciones: Record<string, string> = {};
      resultados.forEach((x, i) => {
        if (x?.explicacion) explicaciones[top[i].cv.id] = x.explicacion;
      });
      if (Object.keys(explicaciones).length) motor = "gemini";
      setCompatUI((u) => ({ ...u, explicaciones, motor, progreso: null }));
    }
  }

  function accionesDe(v: VacanteRaw): NonNullable<BuiltVacante["acciones"]> {
    const idx = v.etapaIndex;
    const a: NonNullable<BuiltVacante["acciones"]> = [];
    if ((role === "at" || role === "hm") && idx === 1) a.push({ key: "busqueda", label: "Iniciar búsqueda", tone: "primary", onClick: () => avanzarEtapa(v, "busqueda") });
    if (role === "at" && idx === 2) a.push({ key: "atraccion", label: "Pasar a Atracción", tone: "primary", onClick: () => avanzarEtapa(v, "atraccion") });
    if (role === "at" && idx === 3) a.push({ key: "seleccion", label: "Enviar pool al HM", tone: "primary", onClick: () => avanzarEtapa(v, "seleccion") });
    if ((role === "hm" || role === "hrbp") && idx === 4) a.push({ key: "oferta", label: "Pasar a Oferta", tone: "primary", onClick: () => avanzarEtapa(v, "oferta") });
    if (role === "hrbp" && idx === 5) a.push({ key: "cerrar", label: "Cerrar vacante", tone: "primary", onClick: () => abrirCierre(v) });
    if (role === "hrbp" && v.sla === "#D93025" && idx < 6)
      a.push({
        key: "chat",
        label: "Avisar en Google Chat",
        tone: "neutral",
        onClick: async () => {
          const r = await avisarChat("retraso", { vacante: v.titulo, etapa: ETAPAS[idx], responsable: v.responsable });
          setAccionMsg(
            r === "enviado"
              ? { ok: true, text: `Aviso enviado a Google Chat: «${v.titulo}» está fuera de tiempo.` }
              : r === "no_configurado"
              ? { ok: false, text: "Google Chat no está configurado (falta GOOGLE_CHAT_WEBHOOK_URL en .env.local)." }
              : { ok: false, text: "No se pudo enviar el aviso a Google Chat." }
          );
        },
      });
    if (role === "hrbp" && idx <= 4) a.push({ key: "cancelar", label: "Cancelar vacante", tone: "danger", onClick: () => abrirCierre(v) });
    return a;
  }

  function buildVacante(v: VacanteRaw): BuiltVacante {
    const enRevision = v.bpEstado !== "validada";
    return {
      id: v.id,
      titulo: v.titulo,
      area: v.area,
      responsable: v.responsable,
      responsableIniciales: v.responsableIniciales,
      etapaLabel: ETAPAS[v.etapaIndex],
      slaColor: v.sla,
      candidatosLabel:
        v.etapaIndex === 0
          ? "Sin candidatos aún"
          : v.candidatosCount + (v.candidatosCount === 1 ? " candidato en proceso" : " candidatos en proceso"),
      etapas: ETAPAS.map((label, i) => ({ label, color: i <= v.etapaIndex ? "#E10098" : "#E4DEE2" })),
      bpBadge: enRevision
        ? v.bpEstado === "devuelta"
          ? { label: "Devuelta por el BP", tone: "rose" }
          : v.etapaIndex === 0
          ? { label: "Por validar por el BP", tone: "amber" }
          : { label: "Requiere revalidación", tone: "accent" }
        : undefined,
      bpComentarios: v.bpEstado === "devuelta" ? v.bpComentarios : undefined,
      acciones: accionesDe(v),
      onClick: () => {
        if (role === "at") {
          setActiveVacanteId(v.id);
          setScreen("at-candidatos");
        } else if (role === "user") {
          setActiveVacanteId(v.id);
          setScreen("user-detalle");
        } else if (role === "hm") {
          if (v.etapaIndex <= 1) {
            // El HM puede ajustar lo que capturó mientras la vacante no pasa de Alineación
            startEditar(v);
          } else {
            setActiveVacanteId(v.id);
            setScreen("user-detalle"); // detalle de solo lectura: etapas, semáforo y entrevistas
          }
        } else if (role === "hrbp") {
          // por validar → pantalla de validación; en cualquier otra etapa, el detalle de solo lectura
          if (v.bpEstado === "por_validar") setScreen("hrbp-validar");
          else {
            setActiveVacanteId(v.id);
            setScreen("user-detalle");
          }
        }
      },
    };
  }

  // Todas las vacantes (vista del solicitante) y las que ve cada rol en su inicio:
  // el AT solo ve vacantes que ya pasaron la validación del BP (tienen reclutador asignado).
  const vacantesBuilt = vacantesData.map((v) => buildVacante(v));
  const vacantes = vacantesData.filter((v) => role !== "at" || v.etapaIndex >= 1).map((v) => buildVacante(v));

  // Catálogo efectivo: de la base en modo Supabase, de las constantes en modo demo
  const camposCategoria: Record<string, { stack: string[]; cert: string; exp: number }> = catalogo
    ? Object.fromEntries(Object.entries(catalogo.plantillas).map(([k, t]) => [k, { stack: t.stack, cert: t.cert, exp: t.exp }]))
    : SUPA
    ? {}
    : CAMPOS_CATEGORIA;
  const competenciasOpciones = catalogo ? catalogo.competencias : SUPA ? [] : COMPETENCIAS;
  const bpsOpciones = catalogo ? catalogo.bps.map((p) => p.nombre) : SUPA ? [] : BPS;
  const atsOpciones = catalogo ? catalogo.ats.map((p) => p.nombre) : SUPA ? [] : ATS;
  const solicitantesOpciones = catalogo ? catalogo.solicitantes.map((p) => p.nombre) : SUPA ? [] : SOLICITANTES;

  // ---- Requisición: HM captura -> BP valida ----
  function onFormChange(patch: Partial<RequisicionForm>) {
    setEnviado(null);
    setFormError(null);
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.categoria !== undefined && patch.categoria !== prev.categoria) {
        next.stack = [];
        next.cert = "";
        next.expMinima = camposCategoria[patch.categoria]?.exp ?? 2;
      }
      return next;
    });
  }

  function onEnviarRequisicion() {
    const min = form.salarioMin === "" ? null : Number(form.salarioMin);
    const max = form.salarioMax === "" ? null : Number(form.salarioMax);
    if (!form.titulo.trim()) return setFormError("Escribe el título de la posición.");
    if (!form.categoria) return setFormError("Selecciona la categoría del puesto.");
    if (!form.bp) return setFormError("Elige al BP que validará la requisición.");
    if (SUPA && !form.solicitante) return setFormError("Elige al solicitante que dará seguimiento.");
    if (min != null && max != null && max < min) return setFormError("La banda salarial es inválida: el máximo es menor al mínimo.");

    const requisitos = {
      stack: form.stack,
      competencias: form.competencias,
      expMinima: form.expMinima,
      cert: form.cert.trim(),
      estudios: form.estudios,
      habilidades: form.habilidades.trim(),
      salarioMin: min,
      salarioMax: max,
    };
    if (SUPA) {
      if (!db || !catalogo || !me) return setFormError("Todavía se está cargando el catálogo. Intenta de nuevo.");
      const input: repo.RequisicionInput = {
        titulo: form.titulo.trim(),
        categoria: form.categoria,
        nivel: form.nivel as VacanteRaw["nivel"],
        requisitos,
        solicitante: form.solicitante,
        bp: form.bp,
      };
      const accion = editingId
        ? repo.updateRequisicion(db, catalogo, editingId, input).then(() => editingId)
        : repo.createRequisicion(db, catalogo, me.id, input);
      accion
        .then(async (id) => {
          setEditingId(id);
          setEnviado(editingId ? "Enviada de nuevo al BP para validación." : "Requisición enviada al BP para validación.");
          setFormError(null);
          await refresh();
        })
        .catch((e) => setFormError(errMsg(e)));
      return;
    }

    const base = {
      titulo: form.titulo.trim(),
      area: (CATEGORIA_AREA[form.categoria] ?? form.categoria),
      categoria: form.categoria,
      solicitante: form.solicitante,
      hrbp: form.bp,
      nivel: form.nivel as VacanteRaw["nivel"],
      requisitos,
      bpEstado: "por_validar" as const,
      bpComentarios: undefined,
    };

    if (editingId) {
      setVacantesData((prev) => prev.map((v) => (v.id === editingId ? { ...v, ...base } : v)));
      setEnviado("Enviada de nuevo al BP para validación.");
    } else {
      const id = "v" + (vacantesData.length + 1);
      setVacantesData((prev) => [
        ...prev,
        {
          ...base,
          id,
          responsable: "Por asignar",
          responsableIniciales: "—",
          etapaIndex: 0,
          sla: "#1E8E3E",
          candidatosCount: 0,
          hm: HM_PERSONA,
        },
      ]);
      setEditingId(id);
      setEnviado("Requisición enviada al BP para validación.");
    }
    setFormError(null);
  }

  function onAprobar(id: string, at: string) {
    const v = vacantesData.find((x) => x.id === id);
    if (!v) return;
    if (SUPA) {
      if (!db || !catalogo) return;
      const avanza = v.etapaIndex === 0;
      setValidarError(null);
      repo
        .aprobarRequisicion(db, catalogo, id, at, avanza)
        .then(async () => {
          setValidarResultado(
            avanza ? `«${v.titulo}» validada: pasa a Alineación y se notificó a ${at} y a ${v.hm}.` : `«${v.titulo}» revalidada. Se notificó a ${v.hm}.`
          );
          void avisarChat("requisicion_validada", { vacante: v.titulo, responsable: at });
          await refresh();
        })
        .catch((e) => setValidarError(errMsg(e)));
      return;
    }
    const inic = initials(at);
    const avanza = v.etapaIndex === 0;
    celebrar(avanza ? "Requisición validada" : "Requisición revalidada");
    setVacantesData((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, bpEstado: "validada", bpComentarios: undefined, responsable: at, responsableIniciales: inic, etapaIndex: avanza ? 1 : x.etapaIndex }
          : x
      )
    );
    setValidarResultado(
      avanza
        ? `«${v.titulo}» validada: pasa a Alineación y se notificó a ${at} y a ${v.hm}.`
        : `«${v.titulo}» revalidada. Se notificó a ${v.hm}.`
    );
    void avisarChat("requisicion_validada", { vacante: v.titulo, responsable: at });
  }

  function onDevolver(id: string, comentarios: string) {
    const v = vacantesData.find((x) => x.id === id);
    if (!v) return;
    if (SUPA) {
      if (!db) return;
      setValidarError(null);
      repo
        .devolverRequisicion(db, id, comentarios)
        .then(async () => {
          setValidarResultado(`«${v.titulo}» devuelta a ${v.hm} con tus comentarios.`);
          await refresh();
        })
        .catch((e) => setValidarError(errMsg(e)));
      return;
    }
    setVacantesData((prev) => prev.map((x) => (x.id === id ? { ...x, bpEstado: "devuelta", bpComentarios: comentarios } : x)));
    setValidarResultado(`«${v.titulo}» devuelta a ${v.hm} con tus comentarios.`);
  }

  function toggleFiltroEscolaridad(e: string) {
    setFiltroEscolaridad((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }
  function toggleFiltroEstatus(e: string) {
    setFiltroEstatus((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }
  function toggleCompare(id: string) {
    setCompareIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function onComparar() {
    if (compareIds.length >= 2) setScreen("at-comparar");
  }

  function onConfirmarAgenda(d: { fecha: string; hora: string; entrevistadores: string }) {
    const inicio = new Date(`${d.fecha}T${d.hora}:00-06:00`); // CDMX (UTC-6)
    const valido = !Number.isNaN(inicio.getTime());
    setShowAgendarModal(false);
    setAgendaConfirmed(true);
    celebrar("Entrevista agendada");
    setMeetLink(MEET_LINK);
    if (valido) setAgendaInfo({ inicio: inicio.toISOString(), duracionMin: 60 });
    void avisarChat("entrevista_agendada", {
      candidato: activeCandidato?.nombre ?? "",
      vacante: activeVacanteRaw?.titulo ?? "",
      cuando: valido ? fmtCuando(inicio) : "",
      meet: `https://${MEET_LINK}`,
    });
  }

  function onEnviarChat(texto?: string) {
    const input = (texto ?? chatInput).trim();
    if (!input) return;
    if (SUPA) {
      const vacancyId = chatVacanteId || chatVacantes[0]?.id;
      if (!vacancyId) return setChatError("No hay vacantes con candidatos para consultar.");
      setChatMessages((prev) => [...prev, { role: "user", text: input }]);
      setChatInput("");
      setChatSending(true);
      setChatError(null);
      apiPost<{ answer: string; conversationId: string }>("/api/ai/ask", { vacancyId, question: input, conversationId: chatConvId ?? undefined })
        .then((r) => {
          setChatConvId(r.conversationId);
          setChatMessages((prev) => [...prev, { role: "assistant", text: r.answer }]);
        })
        .catch((e) => setChatError(errMsg(e)))
        .finally(() => setChatSending(false));
      return;
    }
    setChatInput("");
    if (!geminiOk) {
      setChatMessages((prev) => [...prev, { role: "user", text: input }, { role: "assistant", text: demoChatReply() }]);
      return;
    }
    const historial = chatMessages.map((m) => ({ role: m.role, text: m.text }));
    setChatMessages((prev) => [...prev, { role: "user", text: input }]);
    setChatSending(true);
    setChatError(null);
    fetch("/api/ai/gemini", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tarea: "chat", datos: { pregunta: input, historial, contexto: contextoChatDemo() } }) })
      .then(async (res) => {
        const j = await res.json().catch(() => null);
        // si Gemini falla se responde con el motor local para no dejar la demo sin respuesta
        setChatMessages((prev) => [...prev, { role: "assistant", text: res.ok && j?.respuesta ? j.respuesta : demoChatReply() }]);
      })
      .catch(() => setChatMessages((prev) => [...prev, { role: "assistant", text: demoChatReply() }]))
      .finally(() => setChatSending(false));
  }

  function contextoChatDemo() {
    return {
      vacante: { titulo: "Ingeniero/a de Software Sr. — Pagos", requisicion: REQUISICION_V1, proyectoReferencia: REPO_POR_DEFECTO.fullName },
      candidatos: BASELINE.filas.map((f) => ({
        nombre: f.cv.nombre,
        titular: f.cv.titular,
        compatibilidad: f.compat.total,
        coincidencias: f.compat.coincidencias.map((c) => c.label),
        brechas: f.compat.brechas,
        anios: f.analisis.anios,
        seniority: f.analisis.seniority,
      })),
      entrevistas: {
        "Mariana Coronado Reyes": { estado: "2 rondas completadas", screeningRH: { entrevista: "Sofía Martínez (Reclutamiento)", veredicto: "Recomendado", resumen: RESUMEN_SCREENING.resumen }, feedbackTecnico: "2 de 2 entrevistadores (Diego Ramírez, Karla Ibarra): Recomendado", resumen: DEMO_RESUMEN_TRANSCRIPCION.resumen, competencias: DEMO_RESUMEN_TRANSCRIPCION.competencias, dudas: DEMO_RESUMEN_TRANSCRIPCION.dudas },
        "Emiliano Vázquez Tello": { estado: "Entrevista agendada, aún sin evidencia" },
        "Daniela Ríos Landa": { estado: "En screening" },
      },
    };
  }

  // ---- Derived view-model values ----

  const isDashboardScreen = ["hrbp-dashboard", "at-dashboard", "hm-dashboard"].includes(screen);
  let dashboardTitle = "";
  let dashboardSubtitle = "";
  if (screen === "hrbp-dashboard") {
    dashboardTitle = "Mis vacantes";
    dashboardSubtitle = "Da seguimiento a tus posiciones y valida lo que necesitan tus Hiring Managers.";
  }
  if (screen === "at-dashboard") {
    dashboardTitle = "Mis vacantes en reclutamiento";
    dashboardSubtitle = "Da seguimiento a los candidatos de cada posición.";
  }
  if (screen === "hm-dashboard") {
    dashboardTitle = "Mis vacantes";
    dashboardSubtitle = "Captura requisiciones, revisa entrevistas y decide sobre tus candidatos.";
  }

  // ---- Sidebar (Classroom-style persistent nav) ----

  const activeSectionByScreen: Record<string, string> = {
    "hrbp-dashboard": "dashboard",
    "hrbp-validar": "validar",
    "hm-nueva": "nueva",
    "at-dashboard": "dashboard",
    "at-candidatos": "dashboard",
    "at-comparar": "dashboard",
    "at-perfil": "dashboard",
    "at-compat": "dashboard",
    "hm-dashboard": "dashboard",
    "hm-entrevista": "dashboard",
    "hm-chat": "chat",
    "user-dashboard": "dashboard",
    "user-detalle": "dashboard",
    "candidato-portal": "portal",
    "hrbp-calendario": "calendario",
    "at-calendario": "calendario",
    "hm-calendario": "calendario",
    "user-calendario": "calendario",
    "hrbp-pendientes": "pendientes",
    "at-pendientes": "pendientes",
    "hm-pendientes": "pendientes",
    "user-pendientes": "pendientes",
  };
  const activeSection = activeSectionByScreen[screen] || "dashboard";
  const porValidar = vacantesData.filter((v) => v.bpEstado === "por_validar");
  const devueltas = vacantesData.filter((v) => v.bpEstado === "devuelta");
  const dynamicPendientes: PendienteItem[] =
    role === "hrbp"
      ? porValidar.map((v) => ({
          id: `pv-${v.id}`,
          title: v.etapaIndex === 0 ? "Requisición por validar" : "Revalidar requisición",
          subtitle: `${v.titulo} — solicitada por ${v.hm}.`,
          due: "Hoy",
          urgent: true,
          screen: "hrbp-validar",
          vacanteId: v.id,
        }))
      : role === "hm"
      ? devueltas.map((v) => ({
          id: `dv-${v.id}`,
          title: "Requisición devuelta por el BP",
          subtitle: `${v.titulo} — ${v.bpComentarios ?? ""}`,
          due: "Hoy",
          urgent: true,
          screen: "hm-nueva",
          vacanteId: v.id,
        }))
      : role === "at"
      ? vacantesData
          .filter((v) => v.etapaIndex === 1 && v.bpEstado === "validada" && v.responsable !== "Por asignar")
          .map((v) => ({
            id: `al-${v.id}`,
            title: "Alinear requisición con el HM",
            subtitle: `${v.titulo} — ${v.hm}.`,
            due: "Hoy",
            urgent: true,
            screen: "at-dashboard",
            vacanteId: v.id,
          }))
      : [];
  const allPendientes = SUPA ? supaPendientes : role ? [...dynamicPendientes, ...PENDIENTES[role]] : [];
  const pendienteCount = allPendientes.length;

  const sidebarItemsByRole: Record<Role, SidebarItem[]> = {
    hrbp: [
      { key: "dashboard", label: "Inicio", icon: Home, onClick: () => nav("hrbp-dashboard"), isActive: activeSection === "dashboard" },
      { key: "calendario", label: "Calendario", icon: Calendar, onClick: () => nav("hrbp-calendario"), isActive: activeSection === "calendario" },
      { key: "validar", label: "Por validar", icon: ShieldCheck, onClick: () => nav("hrbp-validar"), isActive: activeSection === "validar", badge: porValidar.length },
      { key: "pendientes", label: "Pendientes", icon: ListChecks, onClick: () => nav("hrbp-pendientes"), isActive: activeSection === "pendientes", badge: pendienteCount },
    ],
    at: [
      { key: "dashboard", label: "Inicio", icon: Home, onClick: () => nav("at-dashboard"), isActive: activeSection === "dashboard" },
      { key: "calendario", label: "Calendario", icon: Calendar, onClick: () => nav("at-calendario"), isActive: activeSection === "calendario" },
      { key: "pendientes", label: "Pendientes", icon: ListChecks, onClick: () => nav("at-pendientes"), isActive: activeSection === "pendientes", badge: pendienteCount },
    ],
    hm: [
      { key: "dashboard", label: "Inicio", icon: Home, onClick: () => nav("hm-dashboard"), isActive: activeSection === "dashboard" },
      { key: "calendario", label: "Calendario", icon: Calendar, onClick: () => nav("hm-calendario"), isActive: activeSection === "calendario" },
      { key: "nueva", label: "Nueva requisición", icon: Plus, onClick: () => startNueva(), isActive: activeSection === "nueva" },
      { key: "pendientes", label: "Pendientes", icon: ListChecks, onClick: () => nav("hm-pendientes"), isActive: activeSection === "pendientes", badge: pendienteCount },
      { key: "chat", label: "Asistente IA", icon: Sparkles, onClick: () => nav("hm-chat"), isActive: activeSection === "chat" },
    ],
    user: [
      { key: "dashboard", label: "Inicio", icon: Home, onClick: () => nav("user-dashboard"), isActive: activeSection === "dashboard" },
      { key: "calendario", label: "Calendario", icon: Calendar, onClick: () => nav("user-calendario"), isActive: activeSection === "calendario" },
      { key: "pendientes", label: "Pendientes", icon: ListChecks, onClick: () => nav("user-pendientes"), isActive: activeSection === "pendientes", badge: pendienteCount },
    ],
    candidato: [{ key: "portal", label: "Mi proceso", icon: Home, onClick: () => nav("candidato-portal"), isActive: true }],
  };
  const sidebarItems = role ? sidebarItemsByRole[role] : [];

  // Portal de la persona candidata: lo que ve depende del estado real de su proceso (mismas etapas y semáforo que el equipo)
  const etapaV1 = vacantesData.find((v) => v.id === "v1")?.etapaIndex ?? 4;
  const etapaV3 = vacantesData.find((v) => v.id === "v3")?.etapaIndex ?? 5;
  const paso = (label: string, estado: "hecho" | "actual" | "pendiente", detalle?: string) => ({ label, estado, detalle });
  const personasPortal: PersonaPortal[] = (() => {
    const cierreOferta = (id: string) => ofertaResp[id];
    // Mariana avanza según lo que decida el HM en la demo
    const mariana: PersonaPortal = (() => {
      const base = { id: "mariana", nombre: "Mariana Coronado Reyes", vacante: "Backend Developer Sr — Equipo Pagos", area: "TI y Sistemas", semaforo: "#F9A825" };
      const previos = [paso("Postulación", "hecho", "Tu CV fue analizado y quedó en el pool"), paso("Screening de RH", "hecho", "12 sep · con Sofía Martínez"), paso("Entrevista técnica", "hecho", "18 sep · con Diego Ramírez y Karla Ibarra")];
      const oferta = { sueldo: "$66,000 MXN", inicio: "19 oct 2026", vigencia: "hasta el 30 sep", prestaciones: ["Seguro de gastos médicos mayores", "Bono anual por desempeño", "Vales de despensa y fondo de ahorro", "Esquema híbrido en CDMX (3 días en oficina)"] };
      if (hmDecision === "descartado") return { ...base, estado: "cerrado", pasos: [...previos, paso("Decisión", "hecho", "El equipo continuará con otro perfil")], responsable: "Luis Herrera (Hiring Manager)", plazo: "Proceso cerrado", semaforo: "#9AA0A6" };
      if (etapaV1 >= 5)
        return { ...base, estado: cierreOferta("mariana") ?? "oferta", pasos: [...previos, paso("Decisión", "hecho", "Eres finalista"), paso("Oferta", cierreOferta("mariana") ? "hecho" : "actual", "Responde antes del 30 sep")], responsable: "Sofía Martínez (Reclutamiento)", plazo: "Responde en 5 días hábiles", semaforo: "#F9A825", oferta, nota: "Después de 2 rondas de entrevista (RH y técnica), 3 de 3 evaluaciones a favor y una decisión con contexto, el equipo te eligió." };
      if (hmDecision === "finalista") return { ...base, estado: "finalista", pasos: [...previos, paso("Decisión", "hecho", "Eres finalista"), paso("Oferta", "actual", "Recursos Humanos la prepara")], responsable: "Sofía Martínez (Reclutamiento)", plazo: "Oferta en 2 días hábiles", semaforo: "#1E8E3E" };
      return { ...base, estado: "decision", pasos: [...previos, paso("Decisión", "actual", "El Hiring Manager revisa el feedback de las 2 rondas"), paso("Oferta", "pendiente")], responsable: "Luis Herrera (Hiring Manager)", plazo: "Respuesta en 2 días hábiles", semaforo: "#F9A825" };
    })();
    return [
      mariana,
      { id: "emiliano", nombre: "Emiliano Vázquez Tello", vacante: "Backend Developer Sr — Equipo Pagos", area: "TI y Sistemas", estado: "entrevista", pasos: [paso("Postulación", "hecho"), paso("Screening de RH", "hecho", "Aprobado por Reclutamiento"), paso("Entrevista técnica", "actual", "26 sep · 11:00 am"), paso("Decisión", "pendiente"), paso("Oferta", "pendiente")], responsable: "Diego Ramírez y Karla Ibarra (panel técnico)", plazo: "Entrevista en 3 días hábiles", semaforo: "#1E8E3E", entrevista: { fecha: "26 sep 2026 · 11:00 am", meet: MEET_LINK } },
      { id: "daniela", nombre: "Daniela Ríos Landa", vacante: "Backend Developer Sr — Equipo Pagos", area: "TI y Sistemas", estado: "revision", pasos: [paso("Postulación", "hecho", "Recibimos tu CV"), paso("Screening de RH", "actual", "Sofía Martínez revisa tu perfil"), paso("Entrevista técnica", "pendiente"), paso("Decisión", "pendiente"), paso("Oferta", "pendiente")], responsable: "Sofía Martínez (Reclutamiento)", plazo: "Contacto en 2 días hábiles", semaforo: "#F9A825" },
      (() => {
        const r = cierreOferta("rodrigo");
        return { id: "rodrigo", nombre: "Rodrigo Beltrán Ochoa", vacante: "Coordinador de Logística CDMX", area: "Logística", estado: etapaV3 >= 5 ? r ?? "oferta" : "decision", pasos: [paso("Postulación", "hecho"), paso("Screening de RH", "hecho"), paso("Entrevista con el equipo", "hecho", "24 sep"), paso("Decisión", "hecho", "Fuiste elegido"), paso("Oferta", r ? "hecho" : "actual", r === "aceptada" ? "Aceptada" : r === "rechazada" ? "Declinada" : "Responde en 3 días hábiles")], responsable: "Jorge Salinas (Reclutamiento)", plazo: r ? "Proceso completo" : "Responde en 3 días hábiles", semaforo: r ? "#1E8E3E" : "#D93025", oferta: { sueldo: "$40,000 MXN", inicio: "12 oct 2026", vigencia: "3 días hábiles", prestaciones: ["Seguro de gastos médicos mayores", "Vales de despensa", "Fondo de ahorro", "Prestaciones superiores a la ley"] } } as PersonaPortal;
      })(),
      { id: "paulina", nombre: "Paulina Estrada Cano", vacante: "Coordinador de Logística CDMX", area: "Logística", estado: "cerrado", pasos: [paso("Postulación", "hecho"), paso("Screening de RH", "hecho"), paso("Entrevista con el equipo", "hecho"), paso("Decisión", "hecho", "Se continuó con otro perfil")], responsable: "Jorge Salinas (Reclutamiento)", plazo: "Proceso cerrado", semaforo: "#9AA0A6" },
    ];
  })();
  function responderOferta(id: string, acepta: boolean) {
    setOfertaResp((prev) => ({ ...prev, [id]: acepta ? "aceptada" : "rechazada" }));
    if (acepta) celebrar(id === "mariana" ? "¡Mariana aceptó la oferta!" : "¡Oferta aceptada!");
  }

  const calendarScreenByRole: Record<Role, string> = { hrbp: "hrbp-dashboard", at: "at-candidatos", hm: "hm-entrevista", user: "user-detalle", candidato: "candidato-portal" };
  const calendarEventsVM = (role ? (SUPA ? calEventos.map((e) => ({ ...e, screen: calendarScreenByRole[role] })) : CALENDAR_EVENTS[role]) : []).map((e) => ({
    ...e,
    onClick: () => goTo(e.screen, e.vacanteId),
  }));
  const ahora = new Date();
  const calMes = SUPA
    ? {
        year: ahora.getFullYear(),
        month: ahora.getMonth(),
        label: ahora.toLocaleDateString("es-MX", { month: "long", year: "numeric" }).replace(/^./, (c) => c.toUpperCase()),
        today: ahora.getDate(),
      }
    : { year: CALENDAR_MONTH.year, month: CALENDAR_MONTH.month, label: CALENDAR_MONTH.label, today: 23 };

  const pendientesVM = allPendientes.map((p) => ({
    ...p,
    onClick: () => {
      if (db) void repo.markPendienteLeido(db, p.id).then(refresh).catch(() => undefined);
      const v = vacantesData.find((x) => x.id === p.vacanteId);
      if (p.screen === "hm-nueva" && v) startEditar(v);
      else goTo(p.screen, p.vacanteId);
    },
  }));

  const rawBase = SUPA
    ? candidatosByVac[activeVacanteId] || []
    : [...(CANDIDATOS_RAW[activeVacanteId] || []), ...(demoCands[activeVacanteId] || [])].map((c) => {
        const r = c.id === "c5" ? ofertaResp.rodrigo : c.id === "cv-c1" ? ofertaResp.mariana : undefined;
        return r ? { ...c, estatus: r === "aceptada" ? "Oferta aceptada" : "Oferta declinada" } : c;
      });
  // Con el análisis de IA hecho, la compatibilidad y los atributos de cada candidato salen de ese análisis
  const rawCands = rawBase
    .map((c) => {
      const f = c.cvId && compatUI.analizado ? compatUI.filas.find((x) => x.cv.id === c.cvId) : null;
      return f ? { ...c, compat: f.compat.total, atributosIA: f.analisis.destacados.slice(0, 3) } : c;
    })
    .sort((a, b) => (a.cvId && b.cvId ? b.compat - a.compat : 0));
  const filteredCandidatos = rawCands
    .filter(
      (c) =>
        (filtroEscolaridad.length === 0 || filtroEscolaridad.some((e) => c.escolaridad.includes(e))) &&
        (filtroEstatus.length === 0 || filtroEstatus.includes(c.estatus)) &&
        c.compat >= compatMin
    )
    .map((c) => {
      const cc = compatColors(c.compat);
      const ec = estatusColors(c.estatus);
      return {
        ...c,
        iniciales: initials(c.nombre),
        compatBg: cc.bg,
        compatColor: cc.color,
        estatusBg: ec.bg,
        estatusColor: ec.color,
        checkedBg: compareIds.includes(c.id) ? "#E10098" : "transparent",
        onToggle: () => toggleCompare(c.id),
        onVerPerfil: () => {
          setActiveCandidatoId(c.id);
          setScreen("at-perfil");
        },
      };
    });

  const institucionesVac = Array.from(new Set(rawCands.map((c) => c.escolaridad.split(" — ")[0]).filter((x) => x && x !== "—")));
  const escolaridadFiltro = institucionesVac.map((e) => ({
    label: e,
    checkedBg: filtroEscolaridad.includes(e) ? "#E10098" : "transparent",
    onClick: () => toggleFiltroEscolaridad(e),
  }));
  const estatusFiltro = ESTATUSES.map((e) => ({
    label: e,
    checkedBg: filtroEstatus.includes(e) ? "#E10098" : "transparent",
    onClick: () => toggleFiltroEstatus(e),
  }));

  const compareCandidatos = rawCands
    .filter((c) => compareIds.includes(c.id))
    .map((c) => {
      const cc = compatColors(c.compat);
      return { ...c, iniciales: initials(c.nombre), compatBg: cc.bg, compatColor: cc.color };
    });
  const compareRows = [
    { label: "Escolaridad", values: compareCandidatos.map((c) => c.escolaridad) },
    { label: "Compatibilidad", values: compareCandidatos.map((c) => c.compat + "%") },
    { label: "Estatus", values: compareCandidatos.map((c) => c.estatus) },
    { label: "Idiomas", values: compareCandidatos.map((c) => c.idiomas) },
    { label: "Compensación deseada", values: compareCandidatos.map((c) => c.compDeseada) },
    { label: "Atributos IA", values: compareCandidatos.map((c) => c.atributosIA.join(", ")) },
  ];

  const rawActiveCand = rawCands.find((c) => c.id === activeCandidatoId) || rawCands[0];
  const ccp = compatColors(rawActiveCand?.compat || 0);
  const activeCvId = rawActiveCand?.cvId ?? (rawActiveCand?.id ? rawActiveCand.id.replace(/^cv-/, "") : undefined);
  const cvActivo = activeCvId ? CVS.find((c) => c.id === activeCvId) : undefined;
  const analisisCvActivo = cvActivo
    ? (() => {
        const a = analyzeCv(cvActivo);
        return { titular: cvActivo.titular, anios: a.anios, seniority: a.seniority, ubicacion: cvActivo.ubicacion, skills: a.skills.slice(0, 10).map((s) => s.label), destacados: a.destacados };
      })()
    : undefined;
  const activeCandidato = rawActiveCand
    ? { ...rawActiveCand, iniciales: initials(rawActiveCand.nombre), compatBg: ccp.bg, compatColor: ccp.color }
    : null;

  const campos = camposCategoria[form.categoria] || { stack: [], cert: "", exp: 2 };

  const DEMO_ENTREVISTA: EntrevistaVM = {
    interviewId: "demo",
    applicationId: "demo",
    vacante: "Backend Developer Sr — Equipo Pagos",
    candidato: "Mariana Coronado Reyes",
    compat: compatBase("c1"),
    fecha: "18 sep 2026",
    resumen: DEMO_RESUMEN_TRANSCRIPCION.resumen,
    puntos: DEMO_RESUMEN_TRANSCRIPCION.competencias.filter((c) => c.nivel === "fuerte").slice(0, 3).map((c) => c.nombre),
    transcripcion: TRANSCRIPCION_MARIANA,
    rondas: [
      {
        id: "r1",
        tipo: "screening",
        titulo: "Screening de RH",
        fecha: "12 sep 2026",
        entrevistadores: [{ profileId: "s", nombre: "Sofía Martínez", cargo: "Reclutamiento", veredicto: "recomendado", notas: "Disponibilidad en 30 días, pretensión de $68,000 dentro de la banda, inglés avanzado y esquema híbrido en CDMX sin problema." }],
        resumen: RESUMEN_SCREENING.resumen,
        puntos: ["Disponible en 30 días", "Pretensión dentro de la banda", "Inglés avanzado"],
        transcripcion: TRANSCRIPCION_SCREENING_MARIANA,
      },
      {
        id: "r2",
        tipo: "tecnica",
        titulo: "Entrevista técnica",
        fecha: "18 sep 2026",
        entrevistadores: [
          { profileId: "d", nombre: "Diego Ramírez", cargo: "Tech Lead", veredicto: "recomendado", notas: "Fuerte en fundamentos de sistemas distribuidos y mentoría. Muy recomendable para el equipo de pagos." },
          { profileId: "k", nombre: "Karla Ibarra", cargo: "Product Lead", veredicto: "recomendado", notas: "Excelente comunicación con negocio. Entiende las métricas de conversión de liverpool.com.mx." },
        ],
        resumen: DEMO_RESUMEN_TRANSCRIPCION.resumen,
        puntos: DEMO_RESUMEN_TRANSCRIPCION.competencias.filter((c) => c.nivel === "fuerte").slice(0, 3).map((c) => c.nombre),
        transcripcion: TRANSCRIPCION_MARIANA,
      },
    ],
    feedback: [
      { profileId: "d", nombre: "Diego Ramírez", cargo: "Tech Lead", veredicto: "recomendado", notas: "Fuerte en fundamentos de sistemas distribuidos y mentoría. Muy recomendable para el equipo de pagos." },
      { profileId: "k", nombre: "Karla Ibarra", cargo: "Product Lead", veredicto: "recomendado", notas: "Excelente comunicación con negocio. Entiende las métricas de conversión de liverpool.com.mx." },
    ],
    decidido: hmDecision === "finalista" || hmDecision === "descartado" ? hmDecision : null,
    miFeedbackPendiente: false,
    puedeDecidir: true,
  };
  const toVM = (e: repo.EntrevistaEval): EntrevistaVM => ({
    ...e,
    decidido: e.decidido ? (e.estatus === "Finalista" ? "finalista" : "descartado") : null,
  });
  const entrevistaVM: EntrevistaVM | null = SUPA ? (entrevistasEval[0] ? toVM(entrevistasEval[0]) : null) : DEMO_ENTREVISTA;
  const entrevistaPendiente = SUPA
    ? entrevistasEval[0] && (entrevistasEval[0].puedeDecidir || entrevistasEval[0].miFeedbackPendiente)
      ? {
          candidato: entrevistasEval[0].candidato,
          compat: entrevistasEval[0].compat,
          detalle: `${entrevistasEval[0].vacante} · Entrevista completada`,
          etiqueta: entrevistasEval[0].puedeDecidir ? "Evaluar entrevista" : "Dar mi feedback",
        }
      : null
    : { candidato: "Mariana Coronado Reyes", compat: compatBase("c1"), detalle: "Backend Developer Sr · Entrevista técnica completada", etiqueta: "Evaluar entrevista" };

  async function resumirTranscripcion(texto: string, candidato: string): Promise<TranscriptSummary> {
    const local = summarizeTranscript(texto, candidato, BASELINE.perfil.skills.filter((s) => s.cat !== "dominio" && s.cat !== "blanda").slice(0, 6).map((s) => s.label));
    if (!geminiOk) return local;
    try {
      const res = await fetch("/api/ai/gemini", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tarea: "transcripcion", texto }) });
      if (!res.ok) return local;
      const j = await res.json();
      return { ...local, ...j, metricas: local.metricas, motor: "gemini" };
    } catch {
      return local;
    }
  }

  async function onDecidir(estatus: "finalista" | "descartado", justificacion: string) {
    if (!SUPA) {
      setHmDecision(estatus);
      celebrar(estatus === "finalista" ? "Finalista confirmada" : "Decisión registrada");
      if (estatus === "finalista") void avisarChat("finalista", { candidato: DEMO_ENTREVISTA.candidato, vacante: DEMO_ENTREVISTA.vacante, feedback: "3 de 3 evaluaciones (RH y técnica) la recomiendan" });
      return;
    }
    const e = entrevistasEval[0];
    if (!db || !e) return;
    await repo.decidirCandidato(db, e.applicationId, estatus, justificacion);
    if (estatus === "finalista") {
      const rec = e.feedback.filter((f) => f.veredicto === "recomendado").length;
      void avisarChat("finalista", { candidato: e.candidato, vacante: e.vacante, feedback: `${rec} de ${e.feedback.length} recomiendan` });
    }
    setHmMensaje(estatus === "finalista" ? `✓ ${e.candidato} quedó como finalista.` : `✕ ${e.candidato} fue descartado.`);
    await refresh();
  }
  async function onFeedback(v: repo.Veredicto, notas: string) {
    const e = entrevistasEval[0];
    if (!db || !me || !e) return;
    await repo.enviarFeedback(db, e.interviewId, me.id, v, notas);
    setHmMensaje("✓ Tu feedback quedó registrado.");
    await refresh();
  }

  // Vacantes sobre las que se puede consultar al asistente (con candidatos)
  const chatVacantes = vacantesData.filter((v) => v.etapaIndex >= 2).map((v) => ({ id: v.id, titulo: v.titulo }));

  // Acciones reales con Google Workspace (Calendar/Meet, Free/Busy, Drive+Gemini, Gmail, Sheets)
  const googleActions: GoogleActions | undefined =
    SUPA && catalogo && activeCandidato
      ? {
          panelistas: catalogo.panelistas.map((p) => ({ id: p.id, nombre: p.nombre, cargo: p.cargo ?? "" })),
          onAgendar: async (i) => {
            const r = await apiPost<{ meetLink: string | null }>("/api/interviews/schedule", { applicationId: activeCandidato.id, ...i });
            setAgendaConfirmed(true);
            setAgendaInfo({ inicio: i.inicio, duracionMin: i.duracionMin });
            setMeetLink(r.meetLink ? r.meetLink.replace(/^https?:\/\//, "") : "");
            await refresh();
          },
          checkBusy: async (ids, inicio, fin) => (await apiPost<{ ocupados: Record<string, boolean | null> }>("/api/calendar/freebusy", { ids, inicio, fin })).ocupados,
          onSync: async () => {
            const r = await apiPost<{ resultados: { status: string; detail?: string }[] }>("/api/interviews/sync");
            const ok = r.resultados.filter((x) => x.status === "sincronizada").length;
            const sin = r.resultados.filter((x) => x.status === "sin_notas").length;
            const err = r.resultados.find((x) => x.status === "error" || x.status === "sin_google");
            if (err) throw new Error(err.detail ?? "No se pudo sincronizar.");
            await refresh();
            return ok ? `${ok} entrevista(s) sincronizada(s) con su resumen.` : sin ? `Aún no hay notas de Gemini para ${sin} entrevista(s). Activa "Tomar notas" en Meet.` : "No hay entrevistas pendientes de sincronizar.";
          },
          onNotify: async (plantilla) => {
            const r = await apiPost<{ para: string }>("/api/candidates/notify", { applicationId: activeCandidato.id, plantilla });
            return `Correo enviado a ${r.para}.`;
          },
        }
      : undefined;

  const chatMessagesVM = chatMessages.map((m) => ({
    align: (m.role === "user" ? "flex-end" : "flex-start") as "flex-end" | "flex-start",
    bg: m.role === "user" ? "#E10098" : "#fff",
    color: m.role === "user" ? "#fff" : "#000000",
    border: m.role === "user" ? "none" : "1px solid #ECE7EA",
    text: m.text,
  }));

  const userVacantes = SUPA ? vacantesBuilt : [vacantesBuilt[0], vacantesBuilt[1]];
  const activeVacanteRaw = vacantesData.find((v) => v.id === activeVacanteId) || vacantesData[0];
  const activeVacanteBase = activeVacanteRaw ? buildVacante(activeVacanteRaw) : null;
  const extra = SUPA ? tracking : USER_EXTRA[activeVacanteId] || { proximaEntrevista: null, historial: [] };
  const activeVacante = activeVacanteBase ? { ...activeVacanteBase, ...extra } : null;

  const porValidarVM: RequisicionPorValidar[] = porValidar.map((v) => ({
    id: v.id,
    titulo: v.titulo,
    area: v.area,
    categoria: v.categoria,
    hm: v.hm,
    solicitante: v.solicitante,
    nivelLabel: NIVELES.find((n) => n.value === v.nivel)?.label ?? v.nivel,
    stack: v.requisitos.stack,
    competencias: v.requisitos.competencias,
    expMinima: v.requisitos.expMinima,
    cert: v.requisitos.cert,
    estudios: v.requisitos.estudios,
    habilidades: v.requisitos.habilidades,
    banda: `${mxn(v.requisitos.salarioMin)} – ${mxn(v.requisitos.salarioMax)} MXN`,
    revalidacion: v.etapaIndex > 0,
    atActual: v.responsable !== "Por asignar" ? v.responsable : null,
  }));

  const compareCanCompare = compareIds.length >= 2;

  // ---- Render ----

  if (SUPA && authLoading) {
    return <div className="min-h-screen bg-surface-canvas flex items-center justify-center text-sm text-ink-muted">Cargando…</div>;
  }

  if (SUPA && (!me || !role)) {
    return <Login onGoogle={signInGoogle} onPassword={signInPassword} error={loginError} />;
  }

  if (screen === "landing" || !role) {
    return (
      <Landing
        onSetRoleHrbp={() => setRole("hrbp")}
        onSetRoleAt={() => setRole("at")}
        onSetRoleHm={() => setRole("hm")}
        onSetRoleCandidato={() => setRole("candidato")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-canvas text-ink-title antialiased flex flex-col">
      <LiverTransicion clave={transKey} />
      {restaurando && <LiverSplash label="Restaurando la base…" />}
      <LiverExito clave={exito.k} texto={exito.texto} />
      <TopBar
        roleLabel={ROLE_LABELS[role]}
        resetRole={resetRole}
        currentRole={role}
        onSelectRole={SUPA ? undefined : setRole}
        onOpenSidebar={() => setSidebarOpen(true)}
        notifications={pendientesVM}
        onVerTodosPendientes={() => nav(`${role}-pendientes`)}
        onReiniciar={() => void reiniciarDemo()}
      />
      <div className="flex flex-1">
        <Sidebar items={sidebarItems} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-10">
        {supaError && (
          <div role="alert" className="max-w-4xl mx-auto mb-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {supaError}
          </div>
        )}
        {isDashboardScreen && (
          <Dashboard
            title={dashboardTitle}
            subtitle={dashboardSubtitle}
            isHrbp={role === "hrbp"}
            isHm={role === "hm"}
            urgencia
            entrevistaPendiente={entrevistaPendiente}
            mensaje={accionMsg}
            accionesBloqueadas={accionBusy}
            vacantes={vacantes}
            porValidarCount={porValidar.length}
            onNavNueva={startNueva}
            onNavValidar={() => nav("hrbp-validar")}
            onNavHmEntrevista={() => nav("hm-entrevista")}
          />
        )}

        {screen === "hm-nueva" && (
          <HmNueva
            form={form}
            onChange={onFormChange}
            categorias={Object.keys(camposCategoria)}
            stackOpciones={campos.stack}
            certPlaceholder={campos.cert}
            competenciasOpciones={competenciasOpciones}
            niveles={NIVELES}
            estudios={ESTUDIOS}
            solicitantes={solicitantesOpciones}
            pedirSolicitante={SUPA}
            bps={bpsOpciones}
            editing={editingId !== null}
            revalidacion={
              editingId !== null && vacantesData.find((v) => v.id === editingId)?.bpEstado === "validada"
            }
            comentariosBp={editingId ? vacantesData.find((v) => v.id === editingId)?.bpComentarios : undefined}
            enviado={enviado}
            error={formError}
            onEnviar={onEnviarRequisicion}
          />
        )}

        {screen === "hrbp-validar" && (
          <HrbpValidar
            items={porValidarVM}
            ats={atsOpciones}
            error={validarError}
            resultado={validarResultado}
            onAprobar={onAprobar}
            onDevolver={onDevolver}
          />
        )}

        {screen === "at-candidatos" && activeVacanteRaw && (
          <AtCandidatos
            vacanteTitulo={activeVacanteRaw.titulo}
            vacanteArea={activeVacanteRaw.area}
            candidatos={filteredCandidatos}
            escolaridadFiltro={escolaridadFiltro}
            estatusFiltro={estatusFiltro}
            compatMin={compatMin}
            onCompatMinChange={(e) => setCompatMin(Number(e.target.value))}
            compareCount={compareIds.length}
            compareCursor={compareCanCompare ? "pointer" : "not-allowed"}
            compareBg={compareCanCompare ? "#E10098" : "#EDEBEC"}
            compareColor={compareCanCompare ? "#fff" : "#B0A6AB"}
            onComparar={onComparar}
            onNavAtDashboard={() => nav("at-dashboard")}
            onNuevoCandidato={role === "at" && activeVacanteRaw.etapaIndex >= 2 ? () => setAltaOpen(true) : undefined}
            onCompatIA={!SUPA && role === "at" && activeVacanteRaw.id === VACANTE_CON_CVS ? () => nav("at-compat") : undefined}
            mensaje={altaMsg}
          />
        )}

        {screen === "at-compat" && activeVacanteRaw && (
          <AtCompat
            vacanteTitulo={activeVacanteRaw.titulo}
            requisicion={REQUISICION_V1}
            repos={repos}
            ui={compatUI}
            onVolver={() => nav("at-candidatos")}
            onSeleccionarRepo={seleccionarRepo}
            onTraerRepo={traerRepo}
            onContexto={(contexto) => setCompatUI((u) => ({ ...u, contexto }))}
            onAgregarContexto={(linea) => setCompatUI((u) => (u.contexto.includes(linea) ? u : { ...u, contexto: `${u.contexto}${u.contexto && !u.contexto.endsWith("\n") ? "\n" : ""}${linea}` }))}
            onToggleRequisicion={(conRequisicion) => setCompatUI((u) => ({ ...u, conRequisicion, perfil: perfilPara(u.repo, conRequisicion) }))}
            onAnalizar={analizarCompat}
            onVerPerfil={(cvId) => {
              setActiveCandidatoId(`cv-${cvId}`);
              setScreen("at-perfil");
            }}
          />
        )}

        {screen === "at-comparar" && (
          <AtComparar
            candidatos={compareCandidatos}
            rows={compareRows}
            onNavAtCandidatos={() => nav("at-candidatos")}
            onExportSheets={
              SUPA
                ? async () => {
                    const r = await apiPost<{ url: string; filas: number }>("/api/export/sheets", { vacancyId: activeVacanteId, applicationIds: compareIds });
                    window.open(r.url, "_blank", "noopener");
                    return `Hoja creada con ${r.filas} candidatos.`;
                  }
                : undefined
            }
          />
        )}

        {screen === "at-perfil" && activeCandidato && (
          <AtPerfil
            candidato={activeCandidato}
            agendaConfirmed={agendaConfirmed}
            meetLink={meetLink}
            showAgendarModal={showAgendarModal}
            onShowAgendar={() => setShowAgendarModal(true)}
            onHideAgendar={() => setShowAgendarModal(false)}
            onConfirmarAgenda={onConfirmarAgenda}
            onNavAtCandidatos={() => nav("at-candidatos")}
            google={googleActions}
            vacanteTitulo={activeVacanteRaw?.titulo}
            agendaInfo={agendaInfo}
            cvUrl={activeCvId ? `/cvs/${activeCvId}.pdf` : (cvActivo ? `/cvs/${cvActivo.id}.pdf` : undefined)}
            analisisCv={analisisCvActivo}
            rondas={!SUPA && (activeCvId ?? cvActivo?.id) === "c1" ? DEMO_ENTREVISTA.rondas : undefined}
          />
        )}

        {screen === "hm-entrevista" && (
          <HmEntrevista
            entrevista={entrevistaVM}
            requeridas={BASELINE.perfil.skills.filter((s) => s.cat !== "dominio" && s.cat !== "blanda").slice(0, 6).map((s) => s.label)}
            resumir={resumirTranscripcion}
            mensaje={hmMensaje}
            onDecidir={onDecidir}
            onFeedback={onFeedback}
            onNavHmDashboard={() => nav("hm-dashboard")}
          />
        )}

        {screen === "hm-chat" && (
          <HmChat
            chatMessages={chatMessagesVM}
            chatInput={chatInput}
            onChatInputChange={(e) => setChatInput(e.target.value)}
            onEnviarChat={onEnviarChat}
            vacantes={SUPA ? chatVacantes : undefined}
            vacanteId={chatVacanteId || chatVacantes[0]?.id || ""}
            onVacante={(id) => {
              setChatVacanteId(id);
              setChatConvId(null);
              setChatMessages([]);
              setChatError(null);
            }}
            enviando={chatSending}
            error={chatError}
            suggested={SUPA ? ["¿Quién es el mejor candidato y por qué?", "Compara a los finalistas", "¿Qué dijo el feedback de las entrevistas?"] : undefined}
          />
        )}

        {screen === "user-dashboard" && <UserDashboard vacantes={userVacantes} />}

        {screen === "candidato-portal" && <CandidatoPortal personas={personasPortal} activaId={personaId} onElegir={setPersonaId} onResponder={responderOferta} />}

        {screen === "user-detalle" && activeVacante && (
          <UserDetalle
            titulo={activeVacante.titulo}
            area={activeVacante.area}
            etapas={activeVacante.etapas}
            etapaLabel={activeVacante.etapaLabel}
            slaColor={activeVacante.slaColor}
            proximaEntrevista={activeVacante.proximaEntrevista}
            historial={activeVacante.historial}
            onNavUserDashboard={() => nav(role ? `${role}-dashboard` : "landing")}
          />
        )}

        {screen === `${role}-calendario` && (
          <Calendario
            year={calMes.year}
            month={calMes.month}
            monthLabel={calMes.label}
            todayDay={calMes.today}
            events={calendarEventsVM}
          />
        )}

        {screen === `${role}-pendientes` && <Pendientes items={pendientesVM} />}
        {altaOpen && activeVacanteRaw && (
          <NuevoCandidatoModal vacante={activeVacanteRaw.titulo} soportaCv={SUPA} onSubmit={altaCandidato} onClose={() => setAltaOpen(false)} />
        )}
        {cierre && (
          <CerrarVacanteModal
            titulo={cierre.v.titulo}
            permiteContratado={role === "hrbp" && cierre.v.etapaIndex === 5}
            finalistas={cierre.finalistas}
            error={cierreError}
            onConfirm={confirmarCierre}
            onClose={() => setCierre(null)}
          />
        )}
        </main>
      </div>
    </div>
  );
}
