import {
  Users,
  Building2,
  CalendarClock,
  Trophy,
  ClipboardCheck,
  ShoppingBag,
  Wallet,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  url: string
}

export type NavGroup = {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Personas",
    icon: Users,
    items: [
      { title: "Atletas", url: "/atletas" },
      { title: "Entrenadores", url: "/entrenadores" },
      { title: "Acudientes", url: "/acudientes" },
    ],
  },
  {
    label: "Organización",
    icon: Building2,
    items: [
      { title: "Equipos", url: "/equipos" },
      { title: "Niveles", url: "/niveles" },
      { title: "Divisiones", url: "/divisiones" },
      { title: "Categorías por Nivel", url: "/categorias-nivel" },
    ],
  },
  {
    label: "Horarios",
    icon: CalendarClock,
    items: [
      { title: "Entrenamientos", url: "/entrenamientos" },
      { title: "Asistencias", url: "/asistencias" },
    ],
  },
  {
    label: "Eventos",
    icon: Trophy,
    items: [
      { title: "Competencias", url: "/competencias" },
      { title: "Inscripciones", url: "/inscripciones" },
    ],
  },
  {
    label: "Evaluación",
    icon: ClipboardCheck,
    items: [
      { title: "Skills", url: "/skills" },
      { title: "Progreso", url: "/progreso" },
      { title: "Rutinas", url: "/evaluacion-rutina" },
    ],
  },
  {
    label: "Tienda",
    icon: ShoppingBag,
    items: [
      { title: "Productos", url: "/productos" },
      { title: "Pedidos", url: "/pedidos" },
    ],
  },
  {
    label: "Finanzas",
    icon: Wallet,
    items: [
      { title: "Mensualidades", url: "/mensualidades" },
      { title: "Pagos", url: "/pagos" },
    ],
  },
  {
    label: "Administración",
    icon: Settings,
    items: [
      { title: "Usuarios", url: "/usuarios" },
      { title: "Configuración", url: "/configuracion" },
    ],
  },
]

// Mapa de rutas a etiquetas para breadcrumbs
export function breadcrumbFor(pathname: string): { group: string; page: string } | null {
  for (const group of NAV_GROUPS) {
    const match = group.items.find((i) => i.url === pathname)
    if (match) return { group: group.label, page: match.title }
  }
  return null
}
