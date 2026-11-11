"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { useFunciones } from "@/app/lib/funciones";
import {
  HOME_ITEM,
  PORTAL_ITEM,
  NAV_SECTIONS,
  findNavItemForPath,
  groupItems,
  visibleItems,
  type BadgeKey,
  type NavItem,
  type NavSection,
} from "./nav-config";
import { useNavBadges, type Badges, type TonoBadge, type ValorBadge } from "./nav-badges";

const COLLAPSE_STORAGE_KEY = "ratels-sidebar-collapsed";
const OPEN_STORAGE_KEY = "cheermanager-sidebar-open";

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
        "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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

const PRIORIDAD_TONO: Record<TonoBadge, number> = { info: 0, aviso: 1, peligro: 2 };

/** Suma los contadores de varias entradas; el tono es el más urgente. */
function sumarBadges(items: NavItem[], badges: Badges): ValorBadge | null {
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
  const { permissions, esPlataforma } = useUser();
  const { incluye } = useFunciones();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [hidratado, setHidratado] = useState(false);

  // El superadmin solo ve el menú de plataforma; los usuarios de club, solo el de su club.
  // Una sección se dibuja si al menos una de sus entradas es visible (permiso + función del plan).
  const secciones = useMemo(
    () =>
      NAV_SECTIONS.filter((s) => (s.ambito === "plataforma") === esPlataforma)
        .map((section) => ({ section, items: visibleItems(section, permissions, incluye) }))
        .filter((s) => s.items.length > 0),
    [permissions, esPlataforma, incluye]
  );

  // Contadores: solo los de entradas visibles.
  const clavesBadge = secciones.flatMap((s) => s.items.map((i) => i.badge).filter(Boolean) as BadgeKey[]);
  const badges = useNavBadges(clavesBadge, pathname);

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
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
      localStorage.setItem(OPEN_STORAGE_KEY, JSON.stringify(openSections));
    } catch {
      // ignorar
    }
  }, [collapsed, openSections, hidratado]);

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
  }, [pathname, esPlataforma, secciones.length]);

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
      <aside
        className={cn(
          "h-screen overflow-y-auto flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
          collapsed ? "w-16" : "w-64"
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
            onClick={() => setCollapsed((v) => !v)}
            className={collapsed ? "justify-center" : ""}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {!collapsed && "Colapsar menú"}
          </NavButton>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;