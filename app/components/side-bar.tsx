"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import {
  HOME_ITEM,
  NAV_SECTIONS,
  findSectionForPath,
  type NavItem,
} from "./nav-config";

const Sidebar = () => {
  const pathname = usePathname();
  const { permissions } = useUser();
  const [openSections, setOpenSections] = useState<string[]>([]);

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
          className="flex w-full cursor-not-allowed items-center justify-between rounded-md px-4 py-2 text-sm text-muted-foreground/60"
        >
          <span className="flex items-center">
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </span>
          <Badge variant="outline" className="text-[10px] font-normal">
            Pronto
          </Badge>
        </div>
      );
    }

    return (
      <Link key={item.href} href={item.href} passHref>
        <Button
          variant={isActive(item.href) ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.label}
        </Button>
      </Link>
    );
  };

  return (
    <aside className="w-64 border-r bg-card h-screen overflow-y-auto">
      <nav className="px-3 py-2">
        <div className="space-y-1">
          <Link href={HOME_ITEM.href} passHref>
            <Button
              variant={isActive(HOME_ITEM.href) ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <HOME_ITEM.icon className="mr-2 h-4 w-4" />
              {HOME_ITEM.label}
            </Button>
          </Link>

          {NAV_SECTIONS.map((section) => {
            if (!permissions.includes(section.permission)) return null;

            const sectionActive = section.items.some((i) =>
              isActive(i.href)
            );

            return (
              <Collapsible
                key={section.id}
                open={openSections.includes(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant={sectionActive ? "secondary" : "ghost"}
                    className="w-full justify-between"
                  >
                    <div className="flex items-center">
                      <section.icon className="mr-2 h-4 w-4" />
                      <span>{section.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openSections.includes(section.id) && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-1">
                  {section.items.map(renderItem)}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;