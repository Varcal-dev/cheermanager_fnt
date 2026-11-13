"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import {
  HOME_ITEM,
  PORTAL_ITEM,
  findNavItemForPath,
  groupItems,
  type NavItem,
  type NavSection,
} from "./nav-config";
import { sumarBadges, useNav } from "./nav-context";
import type { TonoBadge, ValorBadge } from "./nav-badges";

const COLLAPSE_STORAGE_KEY = "ratels-sidebar-collapsed";
const OPEN_STORAGE_KEY = "cheermanager-sidebar-open";

// Tablet (768–1023 px): el menú es un riel de íconos de 64 px y, al tocar el botón de abajo, se expande
// ENCIMA del contenido (no lo empuja: en una tablet vertical no sobra ancho). En escritorio (≥ 1024 px)
// se comporta como siempre. En teléfono (< 768 px) no se dibuja: ahí navega la barra inferior.
const TABLET_QUERY = "(min-width: 768px) and (max-width: 1023px)";

function suscribirTablet(cb: () => void) {
  const mq = window.matchMedia(TABLET_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function useEsTablet() {
  return useSyncExternalStore(
    suscribirTablet,
    () => window.matchMedia(TABLET_QUERY).matches,
    () => false,
  );
}

// Botón de navegación propio del sidebar: usa los tokens sidebar-* (panel
// oscuro) en vez del Button genérico con variant="secondary"/"ghost", que
// está pensado para superficies claras. Mantiene exactamente el mismo
// comportamiento e interacción, solo cambia la piel visual.
function NavButton({
  active,
  icon: Icon,
  children,
  className,
  onClick,
  ...props
}: {
  active?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
} & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors max-lg:py-3",
        active
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        className
      )}
      {...props}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-sidebar-primary" />
      )}
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </button>
  );
}

const CLASES_TONO: Record<TonoBadge, string> = {
  peligro: "bg-destructive text-white",
  aviso: "bg-sidebar-primary/25 text-sidebar-primary",
  info: "bg-sidebar-accent text-sidebar-foreground/80",
};

function Pill({ valor }: { valor: ValorBadge }) {
  return (
    <span
      aria-label={`${valor.n} pendientes`}
      className={cn(
        "ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-5",
        CLASES_TONO[valor.tono]
      )}
    >
      {valor.n > 99 ? "99+" : valor.n}
    </span>
  );
}

function Subtitulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
      {children}
    </p>
  );
}

const Sidebar = () => {
  const pathname = usePathname();
  const { permissions } = useUser();
  const { secciones, badges } = useNav();
  const esTablet = useEsTablet();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [collapsedPref, setCollapsed] = useState(false);
  const [tabletAbierto, setTabletAbierto] = useState(false);
  const [hidratado, setHidratado] = useState(false);

  // En tablet manda el riel (se expande solo a pedido); en escritorio, la preferencia guardada del usuario.
  const collapsed = esTablet ? !tabletAbierto : collapsedPref;

  // Recuerda si el usuario prefiere el sidebar colapsado y qué secciones tenía abiertas, entre sesiones.
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true") setCollapsed(true);
      const abiertas = JSON.parse(localStorage.getItem(OPEN_STORAGE_KEY) ?? "[]");
      if (Array.isArray(abiertas)) setOpenSections(abiertas.filter((x) => typeof x === "string"));
    } catch {
      // almacenamiento no disponible: se usan los valores por defecto
    }
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsedPref));
      localStorage.setItem(OPEN_STORAGE_KEY, JSON.stringify(openSections));
    } catch {
      // ignorar
    }
  }, [collapsedPref, openSections, hidratado]);

  // El riel expandido de tablet se cierra al navegar, con Escape, o al salir de tablet.
  useEffect(() => {
    setTabletAbierto(false);
  }, [pathname, esTablet]);

  useEffect(() => {
    if (!tabletAbierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTabletAbierto(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [tabletAbierto]);

  // La entrada activa es la de href más específico: "/clubes/paquetes" no enciende también "/clubes".
  const activo = findNavItemForPath(pathname);
  const isActive = (href: string) => activo?.href === href;

  // Auto-expande la sección que contiene la ruta activa. No pisa las secciones
  // que el usuario haya abierto manualmente, solo garantiza que la activa esté
  // incluida — así si entras directo a /deportistas, "Personas" ya aparece
  // abierta y resaltada en vez de dejarte perdido en un menú colapsado.
  useEffect(() => {
    const seccionActiva = secciones.find((s) => s.items.some((i) => i.href === activo?.href));
    if (seccionActiva) {
      setOpenSections((prev) =>
        prev.includes(seccionActiva.section.id) ? prev : [...prev, seccionActiva.section.id]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, secciones.length]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const renderItem = (item: NavItem) => {
    if (item.status === "soon") {
      return (
        <div
          key={item.href}
          title="Próximamente disponible"
          className="flex w-full cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-sidebar-muted"
        >
          <span className="flex items-center gap-2.5">
            <item.icon className="h-4 w-4" />
            {item.label}
          </span>
          <Badge
            variant="outline"
            className="border-sidebar-border text-[10px] font-normal text-sidebar-muted"
          >
            Pronto
          </Badge>
        </div>
      );
    }

    const valor = item.badge ? badges[item.badge] : undefined;

    return (
      <Link key={item.href} href={item.href} passHref>
        <NavButton active={isActive(item.href)} icon={item.icon}>
          <span className="truncate">{item.label}</span>
          {valor && <Pill valor={valor} />}
        </NavButton>
      </Link>
    );
  };

  /** Entradas de una sección con subtítulos por grupo. */
  const renderItems = (items: NavItem[]) =>
    groupItems(items).map((grupo, i) => (
      <div key={`${grupo.label ?? "sin-grupo"}-${i}`} className="space-y-1">
        {grupo.label && <Subtitulo>{grupo.label}</Subtitulo>}
        {grupo.items.map(renderItem)}
      </div>
    ));

  const renderSeccionColapsada = ({ section, items }: { section: NavSection; items: NavItem[] }) => {
    const sectionActive = items.some((i) => isActive(i.href));
    const total = sumarBadges(items, badges);
    return (
      <Popover key={section.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <NavButton
                active={sectionActive}
                icon={section.icon}
                className="justify-center"
                aria-label={section.label}
              >
                {total && (
                  <span
                    className={cn(
                      "absolute right-2 top-1.5 h-2 w-2 rounded-full",
                      total.tono === "peligro" ? "bg-destructive" : "bg-sidebar-primary"
                    )}
                  />
                )}
              </NavButton>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">{section.label}</TooltipContent>
        </Tooltip>
        <PopoverContent
          side="right"
          align="start"
          className="w-60 max-h-[80vh] overflow-y-auto p-1 bg-sidebar border-sidebar-border"
        >
          <p className="px-2 py-1.5 text-xs font-medium text-sidebar-muted">{section.label}</p>
          <div className="space-y-1">{renderItems(items)}</div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      {/* Reserva 64 px en tablet; el aside se superpone al expandirse. */}
      <div className="relative hidden shrink-0 md:flex md:w-16 lg:w-auto print:hidden">
      {esTablet && tabletAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setTabletAbierto(false)}
          className="fixed inset-0 z-30 bg-black/40"
        />
      )}
      <aside
        className={cn(
          "flex flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:absolute md:inset-y-0 md:left-0 md:z-40 lg:static lg:z-auto",
          collapsed ? "w-16" : "w-64",
          esTablet && tabletAbierto && "shadow-2xl"
        )}
      >
        <nav className="px-3 py-4 flex-1" aria-label="Navegación principal">
          <div className="space-y-1">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={HOME_ITEM.href} passHref>
                    <NavButton
                      active={isActive(HOME_ITEM.href)}
                      icon={HOME_ITEM.icon}
                      className="justify-center"
                      aria-label={HOME_ITEM.label}
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{HOME_ITEM.label}</TooltipContent>
              </Tooltip>
            ) : (
              <Link href={HOME_ITEM.href} passHref>
                <NavButton active={isActive(HOME_ITEM.href)} icon={HOME_ITEM.icon}>
                  {HOME_ITEM.label}
                </NavButton>
              </Link>
            )}

            {permissions.includes("acceder_portal") && (
              <Link href={PORTAL_ITEM.href} passHref>
                <NavButton
                  active={isActive(PORTAL_ITEM.href)}
                  icon={PORTAL_ITEM.icon}
                  className={collapsed ? "justify-center" : undefined}
                  aria-label={PORTAL_ITEM.label}
                >
                  {!collapsed && PORTAL_ITEM.label}
                </NavButton>
              </Link>
            )}

            {secciones.map(({ section, items }) => {
              // Colapsado: cada sección es un ícono que abre un flyout con
              // sus páginas — no tiene sentido expandir inline sin espacio
              // para las etiquetas.
              if (collapsed) return renderSeccionColapsada({ section, items });

              const sectionActive = items.some((i) => isActive(i.href));
              const sectionOpen = openSections.includes(section.id);
              // Con la sección cerrada, el total de pendientes se ve en el encabezado.
              const total = !sectionOpen ? sumarBadges(items, badges) : null;

              return (
                <Collapsible
                  key={section.id}
                  open={sectionOpen}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <CollapsibleTrigger asChild>
                    <NavButton
                      active={sectionActive}
                      icon={section.icon}
                      className="justify-between pr-2.5"
                    >
                      <span className="flex-1 text-left">{section.label}</span>
                      {total && <Pill valor={total} />}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-sidebar-muted transition-transform",
                          sectionOpen && "rotate-180"
                        )}
                      />
                    </NavButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-5 mt-1 space-y-1 border-l border-sidebar-border/70 ml-4">
                    {renderItems(items)}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border">
          <NavButton
            icon={collapsed ? PanelLeftOpen : PanelLeftClose}
            onClick={() => (esTablet ? setTabletAbierto((v) => !v) : setCollapsed((v) => !v))}
            className={collapsed ? "justify-center" : ""}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {!collapsed && (esTablet ? "Cerrar menú" : "Colapsar menú")}
          </NavButton>
        </div>
      </aside>
      </div>
    </TooltipProvider>
  );
};

export default Sidebar;
