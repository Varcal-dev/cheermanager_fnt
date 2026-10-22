"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
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
  NAV_SECTIONS,
  findSectionForPath,
  type NavItem,
} from "./nav-config";

const COLLAPSE_STORAGE_KEY = "ratels-sidebar-collapsed";

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

const Sidebar = () => {
  const pathname = usePathname();
  const { permissions } = useUser();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [hidratado, setHidratado] = useState(false);

  // Recuerda si el usuario prefiere el sidebar colapsado, entre sesiones.
  useEffect(() => {
    const guardado = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (guardado === "true") setCollapsed(true);
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (hidratado) localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
  }, [collapsed, hidratado]);

  // Auto-expande la sección que contiene la ruta activa. No pisa las secciones
  // que el usuario haya abierto manualmente, solo garantiza que la activa esté
  // incluida — así si entras directo a /deportistas, "Personas" ya aparece
  // abierta y resaltada en vez de dejarte perdido en un menú colapsado.
  useEffect(() => {
    const active = findSectionForPath(pathname);
    if (active) {
      setOpenSections((prev) =>
        prev.includes(active.id) ? prev : [...prev, active.id]
      );
    }
  }, [pathname]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

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

    return (
      <Link key={item.href} href={item.href} passHref>
        <NavButton active={isActive(item.href)} icon={item.icon}>
          {item.label}
        </NavButton>
      </Link>
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
        <nav className="px-3 py-4 flex-1">
          <div className="space-y-1">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={HOME_ITEM.href} passHref>
                    <NavButton
                      active={isActive(HOME_ITEM.href)}
                      icon={HOME_ITEM.icon}
                      className="justify-center"
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
                >
                  {!collapsed && PORTAL_ITEM.label}
                </NavButton>
              </Link>
            )}

            {NAV_SECTIONS.map((section) => {
              if (!permissions.includes(section.permission)) return null;

              const sectionActive = section.items.some((i) => isActive(i.href));

              // Colapsado: cada sección es un ícono que abre un flyout con
              // sus páginas — no tiene sentido expandir inline sin espacio
              // para las etiquetas.
              if (collapsed) {
                return (
                  <Popover key={section.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <NavButton
                            active={sectionActive}
                            icon={section.icon}
                            className="justify-center"
                          />
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">{section.label}</TooltipContent>
                    </Tooltip>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="w-56 p-1 bg-sidebar border-sidebar-border"
                    >
                      <p className="px-2 py-1.5 text-xs font-medium text-sidebar-muted">
                        {section.label}
                      </p>
                      <div className="space-y-1">{section.items.map(renderItem)}</div>
                    </PopoverContent>
                  </Popover>
                );
              }

              const sectionOpen = openSections.includes(section.id);

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
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-sidebar-muted transition-transform",
                          sectionOpen && "rotate-180"
                        )}
                      />
                    </NavButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-5 mt-1 space-y-1 border-l border-sidebar-border/70 ml-4">
                    {section.items.map(renderItem)}
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