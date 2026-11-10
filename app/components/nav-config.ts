import type { LucideIcon } from "lucide-react";
import {
  Home,
  QrCode,
  Users,
  Calendar,
  Award,
  BarChart3,
  ShoppingBag,
  DollarSign,
  Shield,
  Settings,
  UserPlus,
  MapPin,
  Layers,
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
  Inbox,
  FileSpreadsheet,
  Wallet,
  ListChecks,
  HeartPulse,
} from "lucide-react";

// -----------------------------------------------------------------------------
// Fuente única de verdad para la navegación del sistema.
// El sidebar y los breadcrumbs se generan a partir de esta config, así que
// agregar/quitar/mover una página es un cambio en UN solo lugar.
//
// `status: "soon"` = la página aún no existe en el frontend (el controller de
// backend ya existe, pero falta construir la vista). Se muestra en el sidebar
// como no-clickeable con badge "Pronto" en vez de generar un 404.
// Cuando construyas la página, solo cambia el status a "ready" (o bórralo).
// -----------------------------------------------------------------------------

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  status?: "ready" | "soon";
}

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  permission: string;
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

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "personas",
    label: "Personas",
    icon: Users,
    permission: "ver_dash_personas",
    items: [
      { href: "/deportistas", label: "Deportistas", icon: UserPlus },
      { href: "/entrenadores", label: "Entrenadores", icon: Users },
      { href: "/gestion-entrenadores", label: "Certificaciones y horas", icon: ClipboardList },
      { href: "/carnet", label: "Carnet", icon: QrCode },
      { href: "/vencimientos", label: "Vencimientos", icon: ClipboardList },
      { href: "/interesados", label: "Pre-inscripciones", icon: UserPlus },
      { href: "/lesiones", label: "Lesiones y retorno", icon: HeartPulse },
      {
        href: "/historial-medico",
        label: "Historial Médico",
        icon: ClipboardList,
      },
      // Deportistas sin consentimiento vigente (Ley 1581). El permiso lo valida la propia página.
      { href: "/consentimientos", label: "Consentimientos", icon: ShieldCheck },
      { href: "/comunicados", label: "Comunicados y calendario", icon: Inbox },
      { href: "/solicitudes-titular", label: "Consultas y reclamos", icon: ShieldCheck },
      // Importación masiva de deportistas y exportes en CSV (la página valida importar_deportistas / exportar_listados).
      { href: "/importar-exportar", label: "Importar y exportar", icon: FileSpreadsheet },
    ],
  },
  {
    id: "organizacion",
    label: "Organización",
    icon: Layers,
    permission: "ver_dash_organizacion",
    items: [
      { href: "/temporadas", label: "Temporadas", icon: CalendarRange },
      { href: "/inscripciones", label: "Inscripciones", icon: FileText },
      { href: "/solicitudes-inscripcion", label: "Solicitudes", icon: Inbox },
      { href: "/niveles", label: "Niveles", icon: BarChart3 },
      { href: "/divisiones", label: "Divisiones", icon: Layers },
      {
        href: "/categorias-nivel",
        label: "Categorías por Nivel",
        icon: Layers
      },
      
      { href: "/grupos", label: "Grupos/Equipos", icon: Users },
      
      
    ],
  },
  {
    id: "horarios",
    label: "Horarios",
    icon: Calendar,
    permission: "ver_dash_horarios",
    items: [
      { href: "/horarios", label: "Gestión de Horarios", icon: Calendar },
      {
        href: "/asistencias",
        label: "Asistencias",
        icon: ClipboardList
      },
      { href: "/sedes", label: "Sedes y espacios", icon: MapPin },
    ],
  },
  {
    id: "eventos",
    label: "Eventos",
    icon: Trophy,
    permission: "ver_dash_eventos",
    items: [
      {
        href: "/eventos",
        label: "Eventos y Competencias",
        icon: Award,
      },
      {
        href: "/ranking",
        label: "Ranking e historial",
        icon: Trophy,
      },
      { href: "/rosters", label: "Rosters de competencia", icon: ListChecks },
    ],
  },
  {
    id: "evaluacion",
    label: "Evaluación",
    icon: BarChart3,
    permission: "ver_dash_evaluacion",
    items: [
      {
        href: "/criterios-evaluacion",
        label: "Criterios",
        icon: ClipboardList,
      },
      { href: "/evaluaciones", label: "Evaluaciones", icon: BarChart3 },
      { href: "/objetivos", label: "Objetivos", icon: Target},
      { href: "/evaluacion-rutina", label: "Rutinas", icon: BarChart3 },
      { href: "/habilidades", label: "Habilidades", icon: Award },
      // Rúbrica global de rutinas: la ven todos los clubes; solo la plataforma (configurar_rubrica) la edita.
      { href: "/rubrica", label: "Rúbrica", icon: ListChecks },
    ],
  },
  {
    id: "tienda",
    label: "Tienda",
    icon: ShoppingBag,
    permission: "ver_dash_tienda",
    items: [  
      { href: "/inventario", label: "Inventario", icon: ClipboardList },
      { href: "/ventas", label: "Ventas", icon: ShoppingCart },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    icon: DollarSign,
    permission: "ver_dash_finanzas",
    items: [
      // Orden de trabajo: 1) tipos de plan, 2) planes de inscripción / mensualidad (exigen elegir un tipo).
      {
        href: "/tipos-planes-pago",
        label: "1. Tipos de plan de pago",
        icon: FileText,
      },
      {
        href: "/planes-inscripcion",
        label: "2. Inscripciones y Membresías",
        icon: FileText,
      },
      {
        href: "/planes-mensualidad",
        label: "2. Mensualidades y Cuotas",
        icon: FileText,
      },
      { href: "/descuentos", label: "Descuentos", icon: DollarSign },
      { href: "/uniformes", label: "Uniformes", icon: ShoppingBag },
      { href: "/convenios", label: "Convenios", icon: FileText },
      { href: "/facturas", label: "Facturas", icon: FileText },
      { href: "/pagos", label: "Pagos", icon: CreditCard },
      // Cierre de caja diario y conciliación con el extracto del banco (la página valida ver_caja / conciliar_pagos).
      { href: "/caja", label: "Caja", icon: Wallet },
      { href: "/conciliacion", label: "Conciliación", icon: ListChecks },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    icon: Settings,
    permission: "ver_dash_administracion",
    items: [
      { href: "/usuarios", label: "Usuarios", icon: Users },
      { href: "/roles", label: "Roles y Permisos", icon: Lock },
      { href: "/auditoria", label: "Auditoría", icon: Shield },
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
      { href: "/rubrica", label: "Rúbrica global", icon: ListChecks },
      { href: "/usuarios", label: "Equipo de plataforma", icon: Users },
    ],
  },
];

/** Todas las entradas de navegación, planas, incluyendo Inicio. Útil para breadcrumbs. */
export const ALL_NAV_ITEMS: NavItem[] = [
  HOME_ITEM,
  PORTAL_ITEM,
  ...NAV_SECTIONS.flatMap((s) => s.items),
];

/** Encuentra la sección que contiene una ruta dada (o undefined si es de nivel raíz). */
export function findSectionForPath(pathname: string): NavSection | undefined {
  return NAV_SECTIONS.find((section) =>
    section.items.some((item) => pathname.startsWith(item.href))
  );
}

/** Encuentra el NavItem exacto (o el prefijo más largo que matchea) para una ruta. */
export function findNavItemForPath(pathname: string): NavItem | undefined {
  const candidates = ALL_NAV_ITEMS.filter(
    (item) => item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  // El match más específico (href más largo) gana, ej. evita que "/eventos"
  // le gane a un futuro "/eventos/[id]".
  return candidates.sort((a, b) => b.href.length - a.href.length)[0];
}