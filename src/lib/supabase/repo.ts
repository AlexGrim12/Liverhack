// Capa de datos sobre Supabase: traduce filas de la BD a los tipos que ya usa la interfaz
// (VacanteRaw, CandidatoRaw…) y ejecuta las acciones del flujo. La autorización NO vive aquí:
// la deciden RLS y los triggers de la base (este código solo pasa los datos y muestra sus errores).
import type { SupabaseClient } from "@supabase/supabase-js";
import { ETAPAS, initials } from "@/lib/data";
import type { CandidatoRaw, Nivel, PendienteItem, Requisitos, Role, VacanteRaw } from "@/lib/data";

export type Person = { id: string; nombre: string; role: Role; cargo?: string | null };
export type Session = Person;
export type Plantilla = { id: string; area: string; stack: string[]; cert: string; exp: number };
export type Catalogo = {
  plantillas: Record<string, Plantilla>; // por categoría
  competencias: string[];
  bps: Person[];
  ats: Person[];
  solicitantes: Person[];
  panelistas: Person[]; // pueden entrevistar: HM y AT
};
export type RequisicionInput = {
  titulo: string;
  categoria: string;
  nivel: Nivel;
  requisitos: Requisitos;
  solicitante: string; // nombre
  bp: string; // nombre
};
export type Tracking = {
  proximaEntrevista: { fecha: string; candidato: string; entrevistadores: string } | null;
  historial: { fecha: string; candidato: string; estatus: string }[];
};

const SLA_COLOR: Record<string, string> = { verde: "#1E8E3E", amarillo: "#F9A825", rojo: "#D93025" };
const ESTUDIOS_LABEL: Record<string, string> = {
  preparatoria: "Preparatoria",
  licenciatura_trunca: "Licenciatura trunca",
  licenciatura: "Licenciatura terminada",
  posgrado: "Posgrado",
};
const ESTUDIOS_ENUM = Object.fromEntries(Object.entries(ESTUDIOS_LABEL).map(([k, v]) => [v, k]));
const ESTATUS_LABEL: Record<string, string> = {
  screening: "Screening",
  entrevista_agendada: "Entrevista agendada",
  en_proceso: "En proceso",
  finalista: "Finalista",
  descartado: "Descartado",
  contratado: "Contratado",
};
const ENTREVISTA_ESTADO: Record<string, string> = { completada: "Completada", cancelada: "Cancelada", no_show: "No se presentó" };

const fmtFecha = (iso: string, conHora = true) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(conHora ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "America/Mexico_City",
  });
const money = (n: number | null | undefined, moneda = "MXN") =>
  n == null ? "—" : `$${Number(n).toLocaleString("es-MX")} ${moneda.trim()}`;

function fail(action: string, error: { message: string } | null): never {
  throw new Error(error?.message ?? `No se pudo ${action}.`);
}

// ---------------------------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------------------------

export async function getSession(db: SupabaseClient): Promise<Session | null> {
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await db.from("profiles").select("id, nombre, role").eq("id", auth.user.id).single();
  if (error || !data) fail("cargar tu perfil", error);
  return data as Session;
}

export async function getCatalogo(db: SupabaseClient): Promise<Catalogo> {
  const [plantillas, competencias, personas] = await Promise.all([
    db.from("vacancy_templates").select("id, categoria, area, stack_opciones, cert_ejemplo, exp_minima_default").eq("activo", true),
    db.from("competencies").select("nombre").eq("activo", true).order("nombre"),
    db.from("profiles").select("id, nombre, role, cargo").eq("activo", true).in("role", ["hrbp", "at", "hm", "user"]).order("nombre"),
  ]);
  if (plantillas.error) fail("cargar plantillas", plantillas.error);
  if (competencias.error) fail("cargar competencias", competencias.error);
  if (personas.error) fail("cargar personas", personas.error);
  const byRole = (r: Role) => (personas.data as Person[]).filter((p) => p.role === r);
  return {
    plantillas: Object.fromEntries(
      plantillas.data.map((t) => [
        t.categoria,
        { id: t.id, area: t.area, stack: t.stack_opciones ?? [], cert: t.cert_ejemplo ?? "", exp: t.exp_minima_default },
      ])
    ),
    competencias: competencias.data.map((c) => c.nombre),
    bps: byRole("hrbp"),
    ats: byRole("at"),
    solicitantes: byRole("user"),
    panelistas: [...byRole("hm"), ...byRole("at")],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVacante(r: any): VacanteRaw {
  return {
    id: r.id,
    titulo: r.titulo,
    area: r.area,
    categoria: r.categoria,
    responsable: r.at_nombre ?? "Por asignar",
    responsableIniciales: r.at_nombre ? initials(r.at_nombre) : "—",
    etapaIndex: Math.min(r.etapa_indice, ETAPAS.length - 1),
    sla: SLA_COLOR[r.sla] ?? SLA_COLOR.verde,
    candidatosCount: r.candidatos_activos ?? 0,
    solicitante: r.solicitante_nombre ?? "—",
    hm: r.hm_nombre ?? "—",
    hrbp: r.hrbp_nombre ?? "—",
    nivel: r.nivel,
    bpEstado: r.bp_estado,
    bpComentarios: r.bp_estado === "devuelta" ? r.bp_comentarios ?? undefined : undefined,
    requisitos: {
      stack: r.stack_requerido ?? [],
      competencias: r.competencias ?? [],
      expMinima: r.exp_minima ?? 0,
      cert: r.certificacion_deseable ?? "",
      estudios: ESTUDIOS_LABEL[r.estudios_minimos] ?? r.estudios_minimos,
      habilidades: r.habilidades_clave ?? "",
      salarioMin: r.salario_min == null ? null : Number(r.salario_min),
      salarioMax: r.salario_max == null ? null : Number(r.salario_max),
    },
  };
}

export async function listVacantes(db: SupabaseClient): Promise<VacanteRaw[]> {
  const { data, error } = await db.from("vacancy_overview").select("*").neq("etapa", "cerrada").order("folio");
  if (error) fail("cargar las vacantes", error);
  return data.map(mapVacante);
}

export async function listCandidatos(db: SupabaseClient, vacancyId: string): Promise<CandidatoRaw[]> {
  const { data, error } = await db
    .from("applications")
    .select(
      `id, estatus, compat_pct,
       candidates ( nombre, institucion, carrera, compensacion_actual, compensacion_deseada, moneda,
                    candidate_languages ( idioma, nivel ), candidate_attributes ( tag ) )`
    )
    .eq("vacancy_id", vacancyId)
    .order("compat_pct", { ascending: false, nullsFirst: false });
  if (error) fail("cargar los candidatos", error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((a: any) => {
    const c = a.candidates;
    return {
      id: a.id, // id de la postulación: único por candidato y vacante
      nombre: c.nombre,
      escolaridad: [c.institucion, c.carrera].filter(Boolean).join(" — ") || "—",
      compat: Number(a.compat_pct ?? 0),
      estatus: ESTATUS_LABEL[a.estatus] ?? a.estatus,
      idiomas: c.candidate_languages.map((l: { idioma: string; nivel: string }) => `${l.idioma} ${l.nivel}`).join(", ") || "—",
      compActual: money(c.compensacion_actual, c.moneda),
      compDeseada: money(c.compensacion_deseada, c.moneda),
      atributosIA: c.candidate_attributes.map((t: { tag: string }) => t.tag),
    };
  });
}

// Pendientes = notificaciones sin leer; el destino depende del tipo y del rol.
export async function listPendientes(db: SupabaseClient, role: Role): Promise<PendienteItem[]> {
  const { data, error } = await db
    .from("notifications")
    .select("id, tipo, titulo, detalle, vacancy_id, urgente, due_at, created_at")
    .is("leida_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) fail("cargar tus pendientes", error);
  const screenFor = (tipo: string): string => {
    switch (tipo) {
      case "validar_requisicion":
      case "requisitos_actualizados":
        return "hrbp-validar";
      case "requisicion_devuelta":
        return "hm-nueva";
      case "feedback_pendiente":
        return role === "hm" ? "hm-entrevista" : `${role}-dashboard`;
      case "etapa_cambio":
      case "requisicion_validada":
      case "entrevista_agendada":
        return role === "user" ? "user-detalle" : `${role}-dashboard`;
      default:
        return `${role}-dashboard`;
    }
  };
  const hoy = new Date().toDateString();
  return data.map((n) => {
    const fecha = new Date(n.due_at ?? n.created_at);
    return {
      id: n.id,
      title: n.titulo,
      subtitle: n.detalle ?? "",
      due: fecha.toDateString() === hoy ? "Hoy" : fmtFecha(fecha.toISOString(), false),
      urgent: n.urgente,
      screen: screenFor(n.tipo),
      vacanteId: n.vacancy_id ?? undefined,
    };
  });
}

export async function markPendienteLeido(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("notifications").update({ leida_at: new Date().toISOString() }).eq("id", id);
  if (error) fail("marcar el pendiente", error);
}

// Seguimiento del solicitante: próxima entrevista e historial, sin feedback ni compensación.
export async function getTracking(db: SupabaseClient, vacancyId: string): Promise<Tracking> {
  const { data, error } = await db.rpc("vacancy_tracking", { p_vacancy_id: vacancyId });
  if (error) fail("cargar el seguimiento", error);
  const t = data as {
    proxima_entrevista: { inicio: string; candidato: string; entrevistadores: string[] } | null;
    historial: { fecha: string; candidato: string; estado: string }[];
  } | null;
  return {
    proximaEntrevista: t?.proxima_entrevista
      ? {
          fecha: fmtFecha(t.proxima_entrevista.inicio),
          candidato: t.proxima_entrevista.candidato,
          entrevistadores: t.proxima_entrevista.entrevistadores.join(", "),
        }
      : null,
    historial: (t?.historial ?? []).map((h) => ({
      fecha: fmtFecha(h.fecha, false),
      candidato: h.candidato,
      estatus: ENTREVISTA_ESTADO[h.estado] ?? h.estado,
    })),
  };
}

// ---------------------------------------------------------------------------------------------
// Escritura (los triggers de la base validan reglas del flujo y devuelven mensajes en español)
// ---------------------------------------------------------------------------------------------

function requisicionRow(input: RequisicionInput, cat: Catalogo) {
  const plantilla = cat.plantillas[input.categoria];
  const bp = cat.bps.find((p) => p.nombre === input.bp);
  const sol = cat.solicitantes.find((p) => p.nombre === input.solicitante);
  if (!plantilla) throw new Error("La categoría seleccionada no existe.");
  if (!bp) throw new Error("El BP seleccionado no existe.");
  if (!sol) throw new Error("El solicitante seleccionado no existe.");
  const r = input.requisitos;
  return {
    titulo: input.titulo,
    area: plantilla.area,
    template_id: plantilla.id,
    nivel: input.nivel,
    stack_requerido: r.stack,
    certificacion_deseable: r.cert || null,
    exp_minima: r.expMinima,
    estudios_minimos: ESTUDIOS_ENUM[r.estudios] ?? "licenciatura",
    habilidades_clave: r.habilidades || null,
    competencias: r.competencias,
    salario_min: r.salarioMin,
    salario_max: r.salarioMax,
    hrbp_id: bp.id,
    solicitante_id: sol.id,
  };
}

export async function createRequisicion(db: SupabaseClient, cat: Catalogo, hmId: string, input: RequisicionInput): Promise<string> {
  const { data, error } = await db.from("vacancies").insert({ ...requisicionRow(input, cat), hm_id: hmId }).select("id").single();
  if (error) fail("crear la requisición", error);
  return data.id;
}

export async function updateRequisicion(db: SupabaseClient, cat: Catalogo, id: string, input: RequisicionInput): Promise<void> {
  const { data, error } = await db.from("vacancies").update(requisicionRow(input, cat)).eq("id", id).select("id");
  if (error) fail("guardar la requisición", error);
  if (!data.length) throw new Error("No tienes permiso para modificar esta requisición.");
}

// BP: aprueba, asigna AT y (si aún estaba en Requisición) la pasa a Alineación, todo en un solo UPDATE.
export async function aprobarRequisicion(db: SupabaseClient, cat: Catalogo, id: string, atNombre: string, pasaAAlineacion: boolean): Promise<void> {
  const at = cat.ats.find((p) => p.nombre === atNombre);
  if (!at) throw new Error("El reclutador seleccionado no existe.");
  const { data, error } = await db
    .from("vacancies")
    .update({ bp_validado_at: new Date().toISOString(), at_id: at.id, ...(pasaAAlineacion ? { etapa: "alineacion" } : {}) })
    .eq("id", id)
    .select("id");
  if (error) fail("aprobar la requisición", error);
  if (!data.length) throw new Error("No tienes permiso para validar esta requisición.");
}

export async function devolverRequisicion(db: SupabaseClient, id: string, comentarios: string): Promise<void> {
  const { data, error } = await db
    .from("vacancies")
    .update({ bp_devuelta_at: new Date().toISOString(), bp_comentarios: comentarios })
    .eq("id", id)
    .select("id");
  if (error) fail("devolver la requisición", error);
  if (!data.length) throw new Error("No tienes permiso para devolver esta requisición.");
}

// ---------------------------------------------------------------------------------------------
// Entrevistas: resumen (Gemini), feedback del panel y decisión del HM
// ---------------------------------------------------------------------------------------------

export type Veredicto = "recomendado" | "con_reservas" | "no_recomendado";
export type EntrevistaEval = {
  interviewId: string;
  applicationId: string;
  vacante: string;
  candidato: string;
  compat: number;
  fecha: string;
  resumen: string;
  puntos: string[];
  estatus: string; // etiqueta del estatus del candidato
  decidido: boolean;
  feedback: { profileId: string; nombre: string; cargo: string; veredicto: Veredicto | null; notas: string }[];
  miFeedbackPendiente: boolean; // soy entrevistador y aún no doy mi feedback
  puedeDecidir: boolean; // soy el HM de la vacante
};

export async function listEntrevistasPorEvaluar(db: SupabaseClient, myId: string): Promise<EntrevistaEval[]> {
  const { data, error } = await db
    .from("interviews")
    .select(
      `id, inicio, resumen_ia, resumen_puntos, application_id,
       applications ( id, estatus, compat_pct, candidates ( nombre ), vacancies ( titulo, hm_id ) ),
       interview_panel ( profile_id, veredicto, notas, profiles ( nombre, cargo ) )`
    )
    .eq("estado", "completada")
    .order("inicio", { ascending: false })
    .limit(30);
  if (error) fail("cargar las entrevistas", error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .map((i) => {
      const a = i.applications;
      const decidido = ["finalista", "descartado", "contratado"].includes(a.estatus);
      const miFila = i.interview_panel.find((f: { profile_id: string }) => f.profile_id === myId);
      return {
        interviewId: i.id,
        applicationId: a.id,
        vacante: a.vacancies.titulo,
        candidato: a.candidates.nombre,
        compat: Number(a.compat_pct ?? 0),
        fecha: fmtFecha(i.inicio, false),
        resumen: i.resumen_ia ?? "",
        puntos: i.resumen_puntos ?? [],
        estatus: ESTATUS_LABEL[a.estatus] ?? a.estatus,
        decidido,
        feedback: i.interview_panel.map((f: { profile_id: string; veredicto: Veredicto | null; notas: string | null; profiles: { nombre: string; cargo: string | null } }) => ({
          profileId: f.profile_id,
          nombre: f.profiles.nombre,
          cargo: f.profiles.cargo ?? "",
          veredicto: f.veredicto,
          notas: f.notas ?? "",
        })),
        miFeedbackPendiente: !!miFila && miFila.veredicto === null,
        puedeDecidir: a.vacancies.hm_id === myId && !decidido,
      } satisfies EntrevistaEval;
    })
    .filter((e) => !e.decidido || e.miFeedbackPendiente);
}

export async function enviarFeedback(db: SupabaseClient, interviewId: string, profileId: string, veredicto: Veredicto, notas: string): Promise<void> {
  const { data, error } = await db
    .from("interview_panel")
    .update({ veredicto, notas: notas.trim() || null })
    .eq("interview_id", interviewId)
    .eq("profile_id", profileId)
    .select("interview_id");
  if (error) fail("guardar tu feedback", error);
  if (!data.length) throw new Error("No estás en el panel de esta entrevista.");
}

export async function decidirCandidato(db: SupabaseClient, applicationId: string, estatus: "finalista" | "descartado", justificacion: string): Promise<void> {
  const { data, error } = await db
    .from("applications")
    .update({ estatus, decision_justificacion: justificacion.trim() || null })
    .eq("id", applicationId)
    .select("id");
  if (error) fail("registrar la decisión", error);
  if (!data.length) throw new Error("No tienes permiso para decidir sobre este candidato.");
}

// Entrevistas del mes (RLS: solo las de tus vacantes) para el calendario.
export type EventoEntrevista = { id: string; day: number; time: string; title: string; subtitle: string; vacanteId: string };
export async function listCalendario(db: SupabaseClient, year: number, month: number): Promise<EventoEntrevista[]> {
  const desde = new Date(Date.UTC(year, month, 1, 6)).toISOString(); // 00:00 CDMX (UTC-6)
  const hasta = new Date(Date.UTC(year, month + 1, 1, 6)).toISOString();
  const { data, error } = await db
    .from("interviews")
    .select("id, tipo, estado, inicio, vacancy_id, applications ( candidates ( nombre ), vacancies ( titulo ) )")
    .gte("inicio", desde)
    .lt("inicio", hasta)
    .neq("estado", "cancelada")
    .order("inicio");
  if (error) fail("cargar el calendario", error);
  const TIPO: Record<string, string> = { screening: "Screening", tecnica: "Entrevista técnica", cultural: "Entrevista cultural", final: "Entrevista final" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((i) => {
    const d = new Date(new Date(i.inicio).toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
    return {
      id: i.id,
      day: d.getDate(),
      time: d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true }),
      title: `${TIPO[i.tipo] ?? "Entrevista"}${i.estado === "completada" ? " completada" : ""}`,
      subtitle: `${i.applications.candidates.nombre} · ${i.applications.vacancies.titulo}`,
      vacanteId: i.vacancy_id,
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Cambio de etapa de la vacante (las reglas y permisos por rol los aplica el trigger de la base)
// ---------------------------------------------------------------------------------------------

export type EtapaDestino = "busqueda" | "atraccion" | "seleccion" | "oferta";
export type MotivoCierre = "contratado" | "cancelada" | "sin_candidatos" | "presupuesto";

export async function cambiarEtapa(db: SupabaseClient, vacancyId: string, etapa: EtapaDestino): Promise<void> {
  const { data, error } = await db.from("vacancies").update({ etapa }).eq("id", vacancyId).select("id");
  if (error) fail("cambiar la etapa", error);
  if (!data.length) throw new Error("No tienes permiso para mover esta vacante.");
}

export async function listFinalistas(db: SupabaseClient, vacancyId: string): Promise<{ id: string; nombre: string }[]> {
  const { data, error } = await db.from("applications").select("id, candidates ( nombre )").eq("vacancy_id", vacancyId).eq("estatus", "finalista");
  if (error) fail("cargar los finalistas", error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((a) => ({ id: a.id, nombre: a.candidates.nombre }));
}

// Cierra la vacante. Si se contrató a alguien, primero se marca su postulación (una vacante cerrada ya no admite cambios).
export async function cerrarVacante(db: SupabaseClient, vacancyId: string, motivo: MotivoCierre, contratadaApplicationId?: string): Promise<void> {
  if (motivo === "contratado") {
    if (!contratadaApplicationId) throw new Error("Elige a la persona contratada.");
    const { data, error } = await db.from("applications").update({ estatus: "contratado" }).eq("id", contratadaApplicationId).select("id");
    if (error) fail("registrar la contratación", error);
    if (!data.length) throw new Error("No tienes permiso para registrar la contratación.");
  }
  const { data, error } = await db.from("vacancies").update({ etapa: "cerrada", cierre_motivo: motivo }).eq("id", vacancyId).select("id");
  if (error) fail("cerrar la vacante", error);
  if (!data.length) throw new Error("No tienes permiso para cerrar esta vacante.");
}

// ---------------------------------------------------------------------------------------------
// Alta de candidato: datos + idiomas + CV (bucket "cvs") + postulación a la vacante
// ---------------------------------------------------------------------------------------------

export type NuevoCandidatoInput = {
  nombre: string;
  email: string;
  telefono: string;
  nivelEstudios: "" | "preparatoria" | "licenciatura_trunca" | "licenciatura" | "posgrado";
  institucion: string;
  carrera: string;
  compActual: string;
  compDeseada: string;
  fuente: string;
  compat: string; // opcional (0–100); vacío = sin calcular
  idiomas: { idioma: string; nivel: "basico" | "intermedio" | "avanzado" | "nativo" }[];
  avisoPrivacidad: boolean;
};

export const CV_MAX_BYTES = 10 * 1024 * 1024; // límite del bucket "cvs"
export const CV_TIPOS: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const num = (v: string) => (v.trim() === "" ? null : Number(v));

export async function createCandidato(
  db: SupabaseClient,
  myId: string,
  vacancyId: string,
  input: NuevoCandidatoInput,
  cv: File | null
): Promise<{ candidateId: string; applicationId: string; cvPath: string | null }> {
  if (!input.nombre.trim()) throw new Error("Escribe el nombre del candidato.");
  if (!input.avisoPrivacidad) throw new Error("Confirma que la persona candidata aceptó el aviso de privacidad.");
  const compat = num(input.compat);
  if (compat !== null && !(compat >= 0 && compat <= 100)) throw new Error("La compatibilidad debe estar entre 0 y 100.");
  if (input.email.trim() && !/^\S+@\S+\.\S+$/.test(input.email.trim())) throw new Error("El correo no es válido.");
  let ext = "";
  if (cv) {
    ext = (cv.name.split(".").pop() ?? "").toLowerCase();
    if (!CV_TIPOS[ext]) throw new Error("El CV debe ser PDF, DOC o DOCX.");
    if (cv.size > CV_MAX_BYTES) throw new Error("El CV no debe pesar más de 10 MB.");
  }

  const { data: cand, error: e1 } = await db
    .from("candidates")
    .insert({
      nombre: input.nombre.trim(),
      email: input.email.trim() || null,
      telefono: input.telefono.trim() || null,
      nivel_estudios: input.nivelEstudios || null,
      institucion: input.institucion.trim() || null,
      carrera: input.carrera.trim() || null,
      compensacion_actual: num(input.compActual),
      compensacion_deseada: num(input.compDeseada),
      fuente: input.fuente.trim() || null,
      aviso_privacidad_at: new Date().toISOString(),
      created_by: myId,
    })
    .select("id")
    .single();
  if (e1) {
    if (e1.code === "23505") throw new Error("Ya existe un candidato con ese correo. Pide al reclutador que lo registró que lo vincule a esta vacante.");
    fail("registrar al candidato", e1);
  }
  const candidateId: string = cand.id;

  if (input.idiomas.length) {
    const { error } = await db.from("candidate_languages").insert(input.idiomas.filter((l) => l.idioma.trim()).map((l) => ({ candidate_id: candidateId, idioma: l.idioma.trim(), nivel: l.nivel })));
    if (error) fail("guardar los idiomas", error);
  }

  let cvPath: string | null = null;
  if (cv) {
    const safe = cv.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
    cvPath = `${candidateId}/${safe}`;
    const { error: up } = await db.storage.from("cvs").upload(cvPath, cv, { contentType: CV_TIPOS[ext], upsert: false });
    if (up) fail("subir el CV", up);
    const { error: upd } = await db.from("candidates").update({ cv_path: cvPath }).eq("id", candidateId);
    if (upd) fail("guardar la ruta del CV", upd);
  }

  const { data: app, error: e3 } = await db
    .from("applications")
    .insert({ vacancy_id: vacancyId, candidate_id: candidateId, created_by: myId, ...(compat !== null ? { compat_pct: compat, compat_fuente: "manual" } : {}) })
    .select("id")
    .single();
  if (e3) fail("postular al candidato a la vacante", e3); // p. ej. la vacante aún no está en Búsqueda
  return { candidateId, applicationId: app.id, cvPath };
}
