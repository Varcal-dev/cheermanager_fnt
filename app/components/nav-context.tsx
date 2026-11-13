"use client";

import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useFunciones } from "@/app/lib/funciones";
import {
  HOME_ITEM,
  NAV_SECTIONS,
  PORTAL_BARRA_ITEMS,
  itemsBarraMovil,
  visibleItems,
  type BadgeKey,
  type NavItem,
  type NavSection,
} from "./nav-config";
import { useNavBadges, type Badges, type TonoBadge, type ValorBadge } from "./nav-badges";

// -----------------------------------------------------------------------------
// Estado de navegación compartido por el menú lateral (escritorio y tablet) y la
// barra inferior + hoja "Más" (teléfono). Se calcula UNA vez: las secciones
// visibles según permiso / plan / ámbito, los contadores (que consultan al
// backend) y las entradas de la barra inferior. Así los dos menús no duplican
// peticiones y siempre muestran exactamente lo mismo.
// -----------------------------------------------------------------------------

export interface SeccionVisible {
  section: NavSection;
  items: NavItem[];
}

interface NavState {
  secciones: SeccionVisible[];
  badges: Badges;
  /** Entradas de la barra inferior (sin "Más"): Inicio + las 3 de mayor prioridad, o las del portal. */
  barra: NavItem[];
  /** true si el usuario solo tiene el portal (acudiente / deportista): sin secciones de club. */
  soloPortal: boolean;
  /** true si el usuario puede abrir el portal. */
  tienePortal: boolean;
}

const NavContext = createContext<NavState>({
  secciones: [],
  badges: {},
  barra: [],
  soloPortal: false,
  tienePortal: false,
});

export function NavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { permissions, esPlataforma } = useUser();
  const { incluye } = useFunciones();

  // El superadmin solo ve el menú de plataforma; los usuarios de club, solo el de su club.
  // Una sección se dibuja si al menos una de sus entradas es visible (permiso + función del plan).
  const secciones = NAV_SECTIONS.filter((s) => (s.ambito === "plataforma") === esPlataforma)
    .map((section) => ({ section, items: visibleItems(section, permissions, incluye) }))
    .filter((s) => s.items.length > 0);

  // Contadores: solo los de entradas visibles.
  const clavesBadge = secciones.flatMap((s) => s.items.map((i) => i.badge).filter(Boolean) as BadgeKey[]);
  const badges = useNavBadges(clavesBadge, pathname);

  const tienePortal = permissions.includes("acceder_portal");
  const soloPortal = tienePortal && secciones.length === 0;

  const clave = secciones.map((s) => s.items.map((i) => i.href).join("|")).join("#") + `/${soloPortal}`;
  const barra = useMemo(
    () => (soloPortal ? PORTAL_BARRA_ITEMS : [HOME_ITEM, ...itemsBarraMovil(secciones.flatMap((s) => s.items))]),
    // `secciones` se recrea en cada render; su contenido se resume en `clave`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clave],
  );

  return (
    <NavContext.Provider value={{ secciones, badges, barra, soloPortal, tienePortal }}>
      {children}
    </NavContext.Provider>
  );
}

export const useNav = () => useContext(NavContext);

const PRIORIDAD_TONO: Record<TonoBadge, number> = { info: 0, aviso: 1, peligro: 2 };

/** Suma los contadores de varias entradas; el tono es el más urgente. */
export function sumarBadges(items: NavItem[], badges: Badges): ValorBadge | null {
  let n = 0;
  let tono: TonoBadge = "info";
  for (const item of items) {
    const v = item.badge ? badges[item.badge] : undefined;
    if (!v) continue;
    n += v.n;
    if (PRIORIDAD_TONO[v.tono] > PRIORIDAD_TONO[tono]) tono = v.tono;
  }
  return n > 0 ? { n, tono } : null;
}
