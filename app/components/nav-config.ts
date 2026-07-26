import type { LucideIcon } from "lucide-react";
import {
  Home,
  Users,
  Calendar,
  Award,
  BarChart3,
  ShoppingBag,
  DollarSign,
  Shield,
  Settings,
  UserPlus,
  Layers,
  ClipboardList,
  Trophy,
  Target,
  FileText,
  ShoppingCart,
  CreditCard,
  Lock,
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
}

export const HOME_ITEM: NavItem = {
  href: "/",
  label: "Inicio",
  icon: Home,
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
      {
        href: "/historial-medico",
        label: "Historial Médico",
        icon: ClipboardList,
      },
    ],
  },
  {
    id: "organizacion",
    label: "Organización",
    icon: Layers,
    permission: "ver_dash_organizacion",
    items: [
      { href: "/niveles", label: "Niveles", icon: BarChart3 },
      { href: "/divisiones", label: "Divisiones", icon: Layers },
      {
        href: "/categorias-nivel",
        label: "Categorías por Nivel",
        icon: Layers
      },
      { href: "/grupos", label: "Grupos", icon: Users },
      { href: "/inscripciones", label: "Inscripciones", icon: FileText },
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
        label: "Competencias y Eventos",
        icon: Award,
      },
      { href: "/premios", label: "Premios", icon: Trophy, status: "soon" },
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
        status: "soon",
      },
      { href: "/evaluaciones", label: "Evaluaciones", icon: BarChart3 },
      { href: "/objetivos", label: "Objetivos", icon: Target, status: "soon" },
    ],
  },
  {
    id: "tienda",
    label: "Tienda",
    icon: ShoppingBag,
    permission: "ver_dash_tienda",
    items: [
      {
        href: "/productos",
        label: "Productos",
        icon: ShoppingBag,
        status: "soon",
      },
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
      {
        href: "/planes-inscripcion",
        label: "Planes de Inscripción",
        icon: FileText,
      },
      {
        href: "/planes-mensualidad",
        label: "Planes de Mensualidad",
        icon: FileText,
      },
      {
        href: "/tipos-planes-pago",
        label: "Tipos de Planes de Pago",
        icon: FileText,
      },
      { href: "/descuentos", label: "Descuentos", icon: DollarSign },
      { href: "/convenios", label: "Convenios", icon: FileText },
      { href: "/facturas", label: "Facturas", icon: FileText },
      { href: "/pagos", label: "Pagos", icon: CreditCard },
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
];

/** Todas las entradas de navegación, planas, incluyendo Inicio. Útil para breadcrumbs. */
export const ALL_NAV_ITEMS: NavItem[] = [
  HOME_ITEM,
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