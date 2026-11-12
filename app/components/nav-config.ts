import type { LucideIcon } from "lucide-react";
import {
  Home,
  QrCode,
  Users,
  Calendar,
  Award,
  BarChart3,
  DollarSign,
  Shield,
  Settings,
  UserPlus,
  MapPin,
  Package,
  Plane,
  ClipboardList,
  Trophy,
  Target,
  FileText,
  ShoppingCart,
  CreditCard,
  Lock,
  Building2,
  CalendarRange,
  ShieldCheck,
  UserCircle,
  FileSpreadsheet,
  Wallet,
  ListChecks,
  HeartPulse,
  Shirt,
  Megaphone,
  Percent,
  Tags,
} from "lucide-react";

// -----------------------------------------------------------------------------
// Fuente única de verdad para la navegación del sistema.
// El sidebar, la paleta de comandos (Cmd+K) y los breadcrumbs se generan a
// partir de esta config: agregar/quitar/mover una página es un cambio en UN
// solo lugar.
//
// Criterio de orden (de arriba hacia abajo):
//   1. Lo que se usa todos los días (personas, entrenamiento, cobros).
//   2. Lo que se usa por temporada o por evento.
//   3. La configuración del club, al final.
// Dentro de cada sección: primero lo diario, después lo ocasional.
//
// `status: "soon"` = la página aún no existe en el frontend. Se muestra en el
// sidebar como no-clickeable con badge "Pronto" en vez de generar un 404.
// -----------------------------------------------------------------------------

/** Contadores que el menú puede mostrar junto a una entrada (ver nav-badges.ts). */
export type BadgeKey =
  | "interesados"
  | "solicitudesInscripcion"
  | "vencimientos"
  | "lesiones"
  | "solicitudesTitular"
  | "mora";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  status?: "ready" | "soon";
  /** Función del plan que la habilita (V39). Si el plan del club no la trae, la entrada se oculta del menú. */
  funcion?: string;
  /**
   * Permiso que habilita la entrada. Si falta, se usa el de la sección.
   * Hoy cada entrada conserva el `ver_dash_*` de la sección donde vivía antes
   * de la reorganización, así que nadie gana ni pierde acceso al menú.
   * Cuando los permisos finos estén asignados a todos los roles, se pueden
   * cambiar aquí (p. ej. `ver_lesiones`) sin tocar nada más.
   */
  permission?: string;
  /** Subtítulo dentro de la sección. Las entradas consecutivas con el mismo `grupo` se agrupan bajo él. */
  grupo?: string;
  /** Contador opcional (pendientes, vencidos, en mora…). */
  badge?: BadgeKey;
  /** Palabras extra para que la paleta de comandos (Cmd+K) encuentre la página ("talla", "mora", "lesión"…). */
  keywords?: string;
}

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Permiso por defecto de las entradas que no declaran el suyo. La sección se ve si al menos una de sus entradas es visible. */
  permission?: string;
  items: NavItem[];
  /** "plataforma": solo para el superadmin (menú de plataforma). Las demás son del club y el superadmin no las ve. */
  ambito?: "club" | "plataforma";
}

export const HOME_ITEM: NavItem = {
  href: "/",
  label: "Inicio",
  icon: Home,
};

/** Portal de solo lectura (deportista / acudiente): se muestra si el usuario tiene el permiso acceder_portal. */
export const PORTAL_ITEM: NavItem = {
  href: "/mi",
  label: "Mi portal",
  icon: UserCircle,
};

const P_PERSONAS = "ver_dash_personas";
const P_ORG = "ver_dash_organizacion";
const P_HORARIOS = "ver_dash_horarios";
const P_EVENTOS = "ver_dash_eventos";
const P_EVAL = "ver_dash_evaluacion";
const P_TIENDA = "ver_dash_tienda";
const P_FINANZAS = "ver_dash_finanzas";
const P_ADMIN = "ver_dash_administracion";

export const NAV_SECTIONS: NavSection[] = [
  // ── 1. Las personas del club ────────────────────────────────────────────────
  {
    id: "personas",
    label: "Personas",
    icon: Users,
    permission: P_PERSONAS,
    items: [
      { href: "/deportistas", label: "Deportistas", icon: UserPlus, keywords: "atletas ficha tallas foto acudientes" },
      { href: "/entrenadores", label: "Entrenadores", icon: Users, keywords: "coaches staff" },
      {
        href: "/gestion-entrenadores",
        label: "Certificaciones y horas",
        icon: ClipboardList,
        funcion: "GESTION_ENTRENADORES",
        keywords: "entrenadores primeros auxilios seguridad horas dictadas",
      },
      { href: "/carnet", label: "Carnet", icon: QrCode, keywords: "qr credencial verificar" },
      { href: "/comunicados", label: "Comunicados", icon: Megaphone, keywords: "avisos correo calendario ics mensajes familias" },
    ],
  },

  // ── 2. De interesado a deportista matriculado (en el orden del embudo) ──────
  {
    id: "ingreso",
    label: "Ingreso",
    icon: UserPlus,
    permission: P_ORG,
    items: [
      {
        href: "/interesados",
        label: "Interesados",
        icon: UserPlus,
        permission: P_PERSONAS,
        badge: "interesados",
        keywords: "pre-inscripciones clase de prueba lista de espera prospectos",
      },
      {
        href: "/inscripciones",
        label: "Inscripciones y solicitudes",
        icon: FileText,
        badge: "solicitudesInscripcion",
        keywords: "matrícula matricular membresías renovaciones portal aprobar rechazar solicitudes",
      },
    ],
  },

  // ── 3. El día a día del entrenamiento ───────────────────────────────────────
  {
    id: "entrenamiento",
    label: "Entrenamiento",
    icon: Calendar,
    permission: P_HORARIOS,
    items: [
      { href: "/asistencias", label: "Asistencias", icon: ClipboardList, grupo: "Día a día", keywords: "pasar lista" },
      { href: "/asistencias/escaneo", label: "Asistencia con carnet", icon: QrCode, permission: "registrar_asistencia", grupo: "Día a día", keywords: "escanear qr carnet lector cámara pasar lista" },
      { href: "/horarios", label: "Horarios", icon: Calendar, grupo: "Día a día", keywords: "entrenamientos semana" },
      { href: "/grupos", label: "Grupos y equipos", icon: Users, permission: P_ORG, grupo: "Día a día", keywords: "equipos integrantes" },
      { href: "/evaluaciones", label: "Evaluaciones", icon: BarChart3, permission: P_EVAL, grupo: "Progreso", keywords: "puntajes progresión" },
      { href: "/habilidades", label: "Habilidades", icon: Award, permission: P_EVAL, grupo: "Progreso", keywords: "glosario niveles N1 N2 N3 N4 elevaciones gimnasia" },
      { href: "/objetivos", label: "Objetivos", icon: Target, permission: P_EVAL, grupo: "Progreso", keywords: "metas" },
      {
        href: "/evaluacion-rutina",
        label: "Rutinas",
        icon: BarChart3,
        permission: P_EVAL,
        funcion: "RUBRICA_RUTINAS",
        grupo: "Progreso",
        keywords: "rúbrica puntaje deducciones",
      },
    ],
  },

  // ── 4. Competencias ─────────────────────────────────────────────────────────
  {
    id: "competencias",
    label: "Competencias",
    icon: Trophy,
    permission: P_EVENTOS,
    items: [
      { href: "/eventos", label: "Eventos", icon: Award, keywords: "competencias premios resultados cobro" },
      { href: "/rosters", label: "Rosters", icon: ListChecks, funcion: "ROSTER", keywords: "titulares suplentes posiciones" },
      { href: "/viajes", label: "Viajes", icon: Plane, funcion: "VIAJES", keywords: "delegación autorización de viaje abonos" },
      { href: "/ranking", label: "Ranking e historial", icon: Trophy, funcion: "RANKING", keywords: "resultados temporada" },
    ],
  },

  // ── 5. Seguridad de los atletas y cumplimiento legal ────────────────────────
  {
    id: "salud",
    label: "Salud y cumplimiento",
    icon: HeartPulse,
    permission: P_PERSONAS,
    items: [
      { href: "/lesiones", label: "Lesiones y retorno", icon: HeartPulse, grupo: "Seguridad", badge: "lesiones", keywords: "lesión retorno al juego alta médica" },
      { href: "/vencimientos", label: "Vencimientos", icon: ClipboardList, grupo: "Seguridad", badge: "vencimientos", keywords: "certificado médico eps seguro licencia" },
      { href: "/historial-medico", label: "Historial médico", icon: ClipboardList, grupo: "Seguridad", keywords: "salud alergias" },
      { href: "/consentimientos", label: "Consentimientos", icon: ShieldCheck, grupo: "Datos personales (Ley 1581)", keywords: "autorización datos imagen salud firma" },
      {
        href: "/solicitudes-titular",
        label: "Consultas y reclamos",
        icon: ShieldCheck,
        grupo: "Datos personales (Ley 1581)",
        badge: "solicitudesTitular",
        keywords: "habeas data titular supresión plazos",
      },
    ],
  },

  // ── 6. Dinero: cobros del día a día, tienda y uniformes ─────────────────────
  {
    id: "finanzas",
    label: "Finanzas",
    icon: DollarSign,
    permission: P_FINANZAS,
    items: [
      { href: "/facturas", label: "Facturas", icon: FileText, grupo: "Cobros", badge: "mora", keywords: "cartera mora cobros mensualidades" },
      { href: "/pagos", label: "Pagos", icon: CreditCard, grupo: "Cobros", keywords: "abonos recordatorios de mora" },
      // Cierre de caja diario y conciliación con el extracto del banco (la página valida ver_caja / conciliar_pagos).
      { href: "/caja", label: "Caja", icon: Wallet, grupo: "Cobros", keywords: "cierre de caja efectivo" },
      { href: "/conciliacion", label: "Conciliación", icon: ListChecks, funcion: "CONCILIACION_BANCARIA", grupo: "Cobros", keywords: "extracto banco" },
      { href: "/reportes", label: "Reportes", icon: BarChart3, permission: "generar_reporte_financiero", grupo: "Cobros", keywords: "informe exportar csv excel ingresos cartera mora facturado cobrado" },
      { href: "/ventas", label: "Ventas", icon: ShoppingCart, permission: P_TIENDA, funcion: "TIENDA", grupo: "Tienda y uniformes" },
      { href: "/inventario", label: "Inventario", icon: Package, permission: P_TIENDA, funcion: "TIENDA", grupo: "Tienda y uniformes", keywords: "stock productos" },
      { href: "/uniformes", label: "Uniformes", icon: Shirt, grupo: "Tienda y uniformes", keywords: "tallas pedido cuotas" },
    ],
  },

  // ── 7. Configuración del club: se toca poco, va al final ────────────────────
  {
    id: "configuracion",
    label: "Configuración",
    icon: Settings,
    items: [
      { href: "/temporadas", label: "Temporadas", icon: CalendarRange, permission: P_ORG, grupo: "Estructura deportiva" },
      { href: "/estructura-deportiva", label: "Niveles y categorías", icon: BarChart3, permission: P_ORG, grupo: "Estructura deportiva", keywords: "niveles divisiones categorías por nivel fedecolcheer" },
      { href: "/sedes", label: "Sedes y espacios", icon: MapPin, permission: P_HORARIOS, funcion: "MULTISEDE", grupo: "Estructura deportiva", keywords: "salones ubicación" },
      { href: "/criterios-evaluacion", label: "Criterios de evaluación", icon: ClipboardList, permission: P_EVAL, grupo: "Estructura deportiva" },
      // Rúbrica global de rutinas: la ven todos los clubes; solo la plataforma (configurar_rubrica) la edita.
      { href: "/rubrica", label: "Rúbrica", icon: ListChecks, permission: P_EVAL, grupo: "Estructura deportiva" },

      // Orden de trabajo: primero el tipo de plan, después los planes que lo usan.
      { href: "/tipos-planes-pago", label: "Tipos de plan de pago", icon: Tags, permission: P_FINANZAS, grupo: "Precios y planes (en este orden)" },
      { href: "/planes-inscripcion", label: "Planes de inscripción", icon: FileText, permission: P_FINANZAS, grupo: "Precios y planes (en este orden)", keywords: "membresías" },
      { href: "/planes-mensualidad", label: "Planes de mensualidad", icon: FileText, permission: P_FINANZAS, grupo: "Precios y planes (en este orden)", keywords: "cuotas" },
      { href: "/descuentos", label: "Descuentos", icon: Percent, permission: P_FINANZAS, grupo: "Precios y planes (en este orden)" },
      { href: "/convenios", label: "Convenios", icon: FileText, permission: P_FINANZAS, funcion: "CONVENIOS", grupo: "Precios y planes (en este orden)" },

      { href: "/usuarios", label: "Usuarios", icon: Users, permission: P_ADMIN, grupo: "Club y datos" },
      { href: "/roles", label: "Roles y permisos", icon: Lock, permission: P_ADMIN, grupo: "Club y datos" },
      { href: "/auditoria", label: "Auditoría", icon: Shield, permission: P_ADMIN, funcion: "AUDITORIA", grupo: "Club y datos", keywords: "registro de cambios" },
      { href: "/plan-y-datos", label: "Plan y mis datos", icon: CreditCard, permission: P_ADMIN, grupo: "Club y datos", keywords: "suscripción cupo paquetes descargar" },
      // Importación masiva de deportistas y exportes en CSV (la página valida importar_deportistas / exportar_listados).
      { href: "/importar-exportar", label: "Importar y exportar", icon: FileSpreadsheet, permission: P_PERSONAS, grupo: "Club y datos", keywords: "csv excel cargar deportistas" },
    ],
  },

  // Solo el superadmin de la plataforma (permiso gestionar_clubes): es TODO lo que ve. Clubes, sus usuarios,
  // suscripciones y acceso de soporte; la rúbrica global; y el equipo de la propia plataforma.
  {
    id: "plataforma",
    label: "Plataforma",
    icon: Building2,
    permission: "gestionar_clubes",
    ambito: "plataforma",
    items: [
      { href: "/clubes", label: "Clubes", icon: Building2 },
      { href: "/clubes/paquetes", label: "Paquetes de cupo", icon: Package },
      { href: "/rubrica", label: "Rúbrica global", icon: ListChecks },
      { href: "/usuarios", label: "Equipo de plataforma", icon: Users },
    ],
  },
];

// ── Utilidades ────────────────────────────────────────────────────────────────

/** Todas las entradas de navegación, planas, incluyendo Inicio. Útil para breadcrumbs. */
export const ALL_NAV_ITEMS: NavItem[] = [
  HOME_ITEM,
  PORTAL_ITEM,
  ...NAV_SECTIONS.flatMap((s) => s.items),
];

/**
 * ¿Debe verse esta entrada? Permiso (el propio o el de la sección) y función del plan.
 * `incluye` viene de useFunciones(): mientras no se sepa el plan no se oculta nada (el back decide).
 */
export function itemVisible(
  item: NavItem,
  section: NavSection,
  permissions: string[],
  incluye?: (funcion?: string) => boolean,
): boolean {
  const permiso = item.permission ?? section.permission;
  if (permiso && !permissions.includes(permiso)) return false;
  if (incluye && !incluye(item.funcion)) return false;
  return true;
}

/** Entradas visibles de una sección. Una sección sin entradas visibles no se dibuja. */
export function visibleItems(
  section: NavSection,
  permissions: string[],
  incluye?: (funcion?: string) => boolean,
): NavItem[] {
  return section.items.filter((i) => itemVisible(i, section, permissions, incluye));
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/** Parte una lista de entradas en bloques consecutivos por `grupo` (para dibujar subtítulos). */
export function groupItems(items: NavItem[]): NavGroup[] {
  const grupos: NavGroup[] = [];
  for (const item of items) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.label === item.grupo) ultimo.items.push(item);
    else grupos.push({ label: item.grupo, items: [item] });
  }
  return grupos;
}

/** Encuentra el NavItem exacto (o el prefijo más largo que matchea) para una ruta. */
export function findNavItemForPath(pathname: string): NavItem | undefined {
  const candidates = ALL_NAV_ITEMS.filter((item) =>
    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  // El match más específico (href más largo) gana: "/clubes/paquetes" le gana a "/clubes".
  return candidates.sort((a, b) => b.href.length - a.href.length)[0];
}

/** Encuentra la sección que contiene una ruta dada (o undefined si es de nivel raíz). */
export function findSectionForPath(pathname: string): NavSection | undefined {
  const item = findNavItemForPath(pathname);
  if (!item) return undefined;
  return NAV_SECTIONS.find((section) => section.items.some((i) => i.href === item.href));
}
