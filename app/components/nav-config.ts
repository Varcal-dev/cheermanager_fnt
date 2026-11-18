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
  FileSignature,
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
  /** Función del plan que la habilita (V39). Si el plan del club no la trae, la entrada se muestra con un candado y la etiqueta del plan que la incluye. */
  funcion?: string;
  /**
   * Permiso que habilita la entrada. DEBE ser el mismo que exige la página (@RequiresPermission del back y
   * ProtectedRoute): así el menú nunca muestra algo que al abrirse rebota, ni esconde algo que sí se puede usar.
   * Si falta, se usa el de la sección (solo el menú de plataforma).
   */
  permission?: string;
  /** Subtítulo dentro de la sección. Las entradas consecutivas con el mismo `grupo` se agrupan bajo él. */
  grupo?: string;
  /** Contador opcional (pendientes, vencidos, en mora…). */
  badge?: BadgeKey;
  /** Palabras extra para que la paleta de comandos (Cmd+K) encuentre la página ("talla", "mora", "lesión"…). */
  keywords?: string;
  /**
   * Prioridad en la barra inferior del teléfono (menor = antes). La barra muestra Inicio + las 3 entradas
   * visibles con menor número + "Más", así que cada rol ve sus accesos propios sin configurar nada:
   * quien no tiene permiso de una entrada simplemente pasa a la siguiente. Sin `movil` = solo aparece en "Más".
   */
  movil?: number;
  /** Etiqueta abreviada para la barra inferior del teléfono (cabe en ~70 px). */
  corto?: string;
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


export const NAV_SECTIONS: NavSection[] = [
  // ── 1. Las personas del club ────────────────────────────────────────────────
  {
    id: "personas",
    label: "Personas",
    icon: Users,
    items: [
      { href: "/deportistas", permission: "ver_deportista", label: "Deportistas", icon: UserPlus, keywords: "atletas ficha tallas foto acudientes", movil: 3 },
      { href: "/entrenadores", permission: "ver_entrenador", label: "Entrenadores", icon: Users, keywords: "coaches staff" },
      {
        href: "/gestion-entrenadores", permission: "ver_entrenador",
        label: "Certificaciones y horas",
        icon: ClipboardList,
        funcion: "GESTION_ENTRENADORES",
        keywords: "entrenadores primeros auxilios seguridad horas dictadas",
      },
      { href: "/carnet", permission: "ver_deportista", label: "Carnet", icon: QrCode, keywords: "qr credencial verificar", movil: 8 },
      { href: "/comunicados", permission: "ver_comunicados", label: "Comunicados", icon: Megaphone, keywords: "avisos correo calendario ics mensajes familias" },
    ],
  },

  // ── 2. De interesado a deportista matriculado (en el orden del embudo) ──────
  {
    id: "ingreso",
    label: "Ingreso",
    icon: UserPlus,
    items: [
      {
        href: "/interesados", permission: "ver_interesados",
        label: "Interesados",
        icon: UserPlus,
        badge: "interesados",
        keywords: "pre-inscripciones clase de prueba lista de espera prospectos",
      },
      {
        href: "/inscripciones", permission: "gestionar_inscripciones",
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
    items: [
      { href: "/asistencias", permission: "registrar_asistencia", label: "Asistencias", icon: ClipboardList, grupo: "Día a día", keywords: "pasar lista", movil: 10 },
      { href: "/asistencias/escaneo", permission: "registrar_asistencia", label: "Asistencia con carnet", corto: "Asistencia", icon: QrCode, grupo: "Día a día", keywords: "escanear qr carnet lector cámara pasar lista", movil: 1 },
      { href: "/asistencia-personal", permission: "registrar_asistencia", label: "Asistencia del personal", icon: QrCode, grupo: "Día a día", keywords: "entrenadores entrada salida horas carnet staff" },
      { href: "/horarios", permission: "ver_horario", label: "Horarios", icon: Calendar, grupo: "Día a día", keywords: "entrenamientos semana", movil: 6 },
      { href: "/grupos", permission: "ver_grupo", label: "Grupos y equipos", corto: "Grupos", icon: Users, grupo: "Día a día", keywords: "equipos integrantes", movil: 9 },
      { href: "/evaluaciones", permission: "ver_evaluacion", label: "Evaluaciones", icon: BarChart3, grupo: "Progreso", keywords: "puntajes progresión", movil: 4 },
      { href: "/habilidades", permission: "ver_evaluaciones", label: "Habilidades", icon: Award, grupo: "Progreso", keywords: "glosario niveles N1 N2 N3 N4 elevaciones gimnasia" },
      { href: "/objetivos", permission: "ver_objetivo", label: "Objetivos", icon: Target, grupo: "Progreso", keywords: "metas" },
      {
        href: "/evaluacion-rutina", permission: "ver_evaluacion",
        label: "Rutinas",
        icon: BarChart3,
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
    items: [
      { href: "/eventos", permission: "ver_evento", label: "Eventos", icon: Award, keywords: "competencias premios resultados cobro" },
      { href: "/rosters", permission: "ver_evento", label: "Rosters", icon: ListChecks, funcion: "ROSTER", keywords: "titulares suplentes posiciones" },
      { href: "/viajes", permission: "ver_viajes", label: "Viajes", icon: Plane, funcion: "VIAJES", keywords: "delegación autorización de viaje abonos" },
      { href: "/ranking", permission: "ver_evento", label: "Ranking e historial", icon: Trophy, funcion: "RANKING", keywords: "resultados temporada" },
    ],
  },

  // ── 5. Seguridad de los atletas y cumplimiento legal ────────────────────────
  {
    id: "salud",
    label: "Salud y cumplimiento",
    icon: HeartPulse,
    items: [
      { href: "/lesiones", permission: "ver_lesiones", label: "Lesiones y retorno", icon: HeartPulse, grupo: "Seguridad", badge: "lesiones", keywords: "lesión retorno al juego alta médica" },
      { href: "/vencimientos", permission: "ver_deportista", label: "Vencimientos", icon: ClipboardList, grupo: "Seguridad", badge: "vencimientos", keywords: "certificado médico eps seguro licencia" },
      { href: "/historial-medico", permission: "ver_historial_medico", label: "Historial médico", icon: ClipboardList, grupo: "Seguridad", keywords: "salud alergias" },
      { href: "/consentimientos", permission: "ver_consentimientos", label: "Consentimientos", icon: ShieldCheck, grupo: "Datos personales (Ley 1581)", keywords: "autorización datos imagen salud firma" },
      {
        href: "/solicitudes-titular", permission: "ver_consentimientos",
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
    items: [
      { href: "/facturas", permission: "ver_factura", label: "Facturas", icon: FileText, grupo: "Cobros", badge: "mora", keywords: "cartera mora cobros mensualidades", movil: 5 },
      { href: "/pagos", permission: "ver_pago", label: "Pagos", icon: CreditCard, grupo: "Cobros", keywords: "abonos recordatorios de mora", movil: 2 },
      // Cierre de caja diario y conciliación con el extracto del banco (la página valida ver_caja / conciliar_pagos).
      { href: "/caja", permission: "ver_caja", label: "Caja", icon: Wallet, grupo: "Cobros", keywords: "cierre de caja efectivo", movil: 7 },
      { href: "/conciliacion", permission: "conciliar_pagos", label: "Conciliación", icon: ListChecks, funcion: "CONCILIACION_BANCARIA", grupo: "Cobros", keywords: "extracto banco" },
      { href: "/reportes", permission: "generar_reporte_financiero", label: "Reportes", icon: BarChart3, grupo: "Cobros", keywords: "informe exportar csv excel ingresos cartera mora facturado cobrado" },
      { href: "/ventas", permission: "ver_venta", label: "Ventas", icon: ShoppingCart, funcion: "TIENDA", grupo: "Tienda y uniformes" },
      { href: "/inventario", permission: "ver_producto", label: "Inventario", icon: Package, funcion: "TIENDA", grupo: "Tienda y uniformes", keywords: "stock productos" },
      { href: "/uniformes", permission: "ver_deportista", label: "Uniformes", icon: Shirt, grupo: "Tienda y uniformes", keywords: "tallas pedido cuotas" },
    ],
  },

  // ── 7. Configuración del club: se toca poco, va al final ────────────────────
  {
    id: "configuracion",
    label: "Configuración",
    icon: Settings,
    items: [
      { href: "/analisis", permission: "ver_dash_organizacion", label: "Análisis histórico", icon: BarChart3, grupo: "Estructura deportiva", keywords: "tendencias retención asistencia evolución histórico métricas" },
      { href: "/temporadas", permission: "ver_temporadas", label: "Temporadas", icon: CalendarRange, grupo: "Estructura deportiva" },
      { href: "/estructura-deportiva", permission: "ver_dash_organizacion", label: "Niveles y categorías", icon: BarChart3, grupo: "Estructura deportiva", keywords: "niveles divisiones categorías por nivel fedecolcheer" },
      { href: "/sedes", permission: "ver_sedes", label: "Sedes y espacios", icon: MapPin, funcion: "MULTISEDE", grupo: "Estructura deportiva", keywords: "salones ubicación" },
      { href: "/criterios-evaluacion", permission: "ver_evaluacion", label: "Criterios de evaluación", icon: ClipboardList, grupo: "Estructura deportiva" },
      // Rúbrica global de rutinas: la ven todos los clubes; solo la plataforma (configurar_rubrica) la edita.
      { href: "/rubrica", permission: "ver_evaluacion", label: "Rúbrica", icon: ListChecks, grupo: "Estructura deportiva" },

      // Orden de trabajo: primero el tipo de plan, después los planes que lo usan.
      { href: "/tipos-planes-pago", permission: "ver_plan_pago", label: "Tipos de plan de pago", icon: Tags, grupo: "Precios y planes (en este orden)" },
      { href: "/planes-inscripcion", permission: "ver_plan_pago", label: "Planes de inscripción", icon: FileText, grupo: "Precios y planes (en este orden)", keywords: "membresías" },
      { href: "/planes-mensualidad", permission: "ver_plan_pago", label: "Planes de mensualidad", icon: FileText, grupo: "Precios y planes (en este orden)", keywords: "cuotas" },
      { href: "/descuentos", permission: "ver_descuento", label: "Descuentos", icon: Percent, grupo: "Precios y planes (en este orden)" },
      { href: "/convenios", permission: "ver_convenio", label: "Convenios", icon: FileText, funcion: "CONVENIOS", grupo: "Precios y planes (en este orden)" },

      { href: "/usuarios", permission: "ver_usuarios", label: "Usuarios", icon: Users, grupo: "Club y datos" },
      { href: "/roles", permission: "ver_roles", funcion: "ROLES_PERSONALIZADOS", label: "Roles y permisos", icon: Lock, grupo: "Club y datos" },
      { href: "/auditoria", permission: "ver_dash_administracion", label: "Auditoría", icon: Shield, funcion: "AUDITORIA", grupo: "Club y datos", keywords: "registro de cambios" },
      { href: "/facturacion-electronica", permission: "gestionar_facturacion_electronica", label: "Facturación electrónica", icon: FileText, grupo: "Club y datos", keywords: "dian factura electrónica nit resolución factus" },
      { href: "/plan-y-datos", permission: "ver_dash_administracion", label: "Plan y mis datos", icon: CreditCard, grupo: "Club y datos", keywords: "suscripción cupo paquetes descargar" },
      // Importación masiva de deportistas y exportes en CSV (la página valida importar_deportistas / exportar_listados).
      { href: "/importar-exportar", permission: "ver_dash_personas", label: "Importar y exportar", icon: FileSpreadsheet, grupo: "Club y datos", keywords: "csv excel cargar deportistas" },
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

/** Permiso que exige una entrada: el propio o el de su sección. */
export function permisoDeItem(item: NavItem, section: NavSection): string | undefined {
  return item.permission ?? section.permission;
}

/**
 * ¿Debe verse esta entrada? Solo depende del permiso. El plan NO oculta nada: una función que el plan no trae
 * se dibuja con candado (ver useNav().plan) y la pantalla explica qué plan la habilita.
 */
export function itemVisible(item: NavItem, section: NavSection, permissions: string[]): boolean {
  const permiso = permisoDeItem(item, section);
  return !permiso || permissions.includes(permiso);
}

/** Entradas visibles de una sección. Una sección sin entradas visibles no se dibuja. */
export function visibleItems(section: NavSection, permissions: string[]): NavItem[] {
  return section.items.filter((i) => itemVisible(i, section, permissions));
}

export interface RutaResuelta {
  item: NavItem;
  section: NavSection;
  permiso?: string;
  funcion?: string;
}

/**
 * Qué permiso y qué función de plan exige una ruta, según el menú. Es la base de la puerta central
 * (RouteGuard): cualquier pantalla que figure en el menú queda protegida aunque no tenga ProtectedRoute propio.
 * Es consciente del ámbito: "/usuarios" y "/rubrica" existen en el menú del club y en el de la plataforma con
 * permisos distintos. Rutas fuera del menú (p. ej. "/mi", "/perfil") devuelven undefined.
 */
export function resolverRuta(pathname: string, esPlataforma: boolean): RutaResuelta | undefined {
  let mejor: RutaResuelta | undefined;
  for (const section of NAV_SECTIONS) {
    if ((section.ambito === "plataforma") !== esPlataforma) continue;
    for (const item of section.items) {
      const coincide = pathname === item.href || pathname.startsWith(item.href + "/");
      if (!coincide) continue;
      if (!mejor || item.href.length > mejor.item.href.length) {
        mejor = { item, section, permiso: permisoDeItem(item, section), funcion: item.funcion };
      }
    }
  }
  return mejor;
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

// ── Barra inferior del teléfono ───────────────────────────────────────────────

/**
 * Accesos de la barra para quien SOLO usa el portal (acudiente / deportista). El portal (/mi) organiza su
 * contenido en pestañas enlazables por `?tab=`, así que la barra lleva directo a lo que más se abre desde el
 * teléfono: el estado de cuenta, los horarios y el carnet que se muestra al llegar a entrenar.
 */
export const PORTAL_BARRA_ITEMS: NavItem[] = [
  { href: "/mi", label: "Inicio", icon: Home },
  { href: "/mi?tab=facturas", label: "Facturas", icon: FileText },
  { href: "/mi?tab=horarios", label: "Horarios", icon: Calendar },
  { href: "/mi?tab=carnet", label: "Carnet", icon: QrCode },
];

/** Aparece en "Más" para quien tiene portal (el aviso de la pantalla también lleva allí). */
export const PORTAL_AUTORIZACIONES_ITEM: NavItem = {
  href: "/mi/autorizaciones",
  label: "Autorizaciones",
  icon: FileSignature,
};

/** Cuántas entradas dinámicas lleva la barra además de Inicio y "Más". */
export const MAX_BARRA_MOVIL = 3;

/**
 * Entradas de la barra inferior: las `MAX_BARRA_MOVIL` entradas visibles con menor `movil`.
 * `visibles` ya viene filtrado por permiso, función del plan y ámbito (club / plataforma).
 */
export function itemsBarraMovil(visibles: NavItem[]): NavItem[] {
  const vistos = new Set<string>();
  return visibles
    .filter((i) => i.movil !== undefined && i.status !== "soon")
    .sort((a, b) => (a.movil as number) - (b.movil as number))
    .filter((i) => (vistos.has(i.href) ? false : (vistos.add(i.href), true)))
    .slice(0, MAX_BARRA_MOVIL);
}