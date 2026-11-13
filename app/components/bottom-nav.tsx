"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, LogOut, MoreHorizontal, Search, User } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { ModeToggle } from "./mode-toggle";
import { useLogout } from "./use-logout";
import { PORTAL_AUTORIZACIONES_ITEM, PORTAL_ITEM, groupItems, type NavItem } from "./nav-config";
import { sumarBadges, useNav } from "./nav-context";
import type { TonoBadge, ValorBadge } from "./nav-badges";

// -----------------------------------------------------------------------------
// Navegación del teléfono (< md): barra inferior fija con Inicio + 3 accesos del
// rol + "Más". "Más" abre una hoja desde abajo con TODO el menú por secciones,
// el buscador (paleta de comandos) y las acciones de la cuenta.
// Respeta el safe-area del iPhone (requiere viewport-fit=cover, ver app/layout.tsx).
// -----------------------------------------------------------------------------

const CLASES_TONO: Record<TonoBadge, string> = {
  peligro: "bg-destructive text-destructive-foreground",
  aviso: "bg-warning text-warning-foreground",
  info: "bg-muted text-muted-foreground",
};

function Pill({ valor, className }: { valor: ValorBadge; className?: string }) {
  return (
    <span
      aria-label={`${valor.n} pendientes`}
      className={cn(
        "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-5",
        CLASES_TONO[valor.tono],
        className,
      )}
    >
      {valor.n > 99 ? "99+" : valor.n}
    </span>
  );
}

/**
 * ¿La pantalla actual pertenece a este acceso? "/" solo coincide exacto. Si el acceso trae `?tab=`
 * (portal), además la pestaña activa debe ser esa.
 */
function coincide(pathname: string, tabActual: string | null, href: string) {
  const [ruta, query] = href.split("?");
  const tab = query ? new URLSearchParams(query).get("tab") : null;
  // "/" y "/mi" solo coinciden exactos: "/mi/autorizaciones" no enciende "Inicio" del portal, enciende "Más".
  const exacta = ruta === "/" || ruta === "/mi";
  const rutaOk = exacta ? pathname === ruta : pathname === ruta || pathname.startsWith(ruta + "/");
  return rutaOk && (tab === null || tab === tabActual);
}

export default function BottomNav() {
  const pathname = usePathname();
  const tabActual = useSearchParams().get("tab");
  const { user, clubNombre } = useUser();
  const logout = useLogout();
  const { secciones, badges, barra, soloPortal, tienePortal } = useNav();
  // La barra depende de la sesión y de la URL (cliente): se dibuja solo tras montar, para que el primer
  // render del cliente coincida con el HTML del servidor (que no la trae) y no falle la hidratación.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const [abierto, setAbierto] = useState(false);
  const [seccionAbierta, setSeccionAbierta] = useState<string | null>(null);

  // La entrada activa de la barra es la de href más específico ("/mi/autorizaciones" le gana a "/mi").
  const activaBarra = barra
    .filter((i) => coincide(pathname, tabActual, i.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  // "Más" se ilumina cuando la pantalla actual no es ninguno de los accesos de la barra.
  const masActivo = !activaBarra;

  // Al cambiar de pantalla la hoja se cierra, y al abrirla queda desplegada la sección donde estás.
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!abierto) return;
    const actual = secciones.find((s) => s.items.some((i) => coincide(pathname, tabActual, i.href)));
    setSeccionAbierta(actual?.section.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  // Sin sesión (o aún cargando) no hay barra: evita que parpadee con solo "Más".
  if (!montado || !user) return null;

  const abrirBuscador = () => {
    setAbierto(false);
    // Espera a que la hoja libere el foco antes de abrir la paleta (dos diálogos a la vez se pelean el foco).
    setTimeout(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    }, 250);
  };

  const columnas = barra.length + 1;

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden print:hidden"
      >
        <ul
          className="grid h-16"
          style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}
        >
          {barra.map((item) => {
            const activo = activaBarra?.href === item.href;
            const valor = item.badge ? badges[item.badge] : undefined;
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={activo ? "page" : undefined}
                  className={cn(
                    "relative flex h-full min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors",
                    activo ? "text-primary" : "text-muted-foreground active:text-foreground",
                  )}
                >
                  {activo && (
                    <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-primary" aria-hidden />
                  )}
                  <span className="relative">
                    <item.icon className="h-5 w-5" />
                    {valor && (
                      <span
                        aria-label={`${valor.n} pendientes`}
                        className={cn(
                          "absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full ring-2 ring-card",
                          valor.tono === "peligro" ? "bg-destructive" : "bg-warning",
                        )}
                      />
                    )}
                  </span>
                  <span className="w-full truncate text-center">{item.corto ?? item.label}</span>
                </Link>
              </li>
            );
          })}

          <li className="min-w-0">
            <button
              type="button"
              onClick={() => setAbierto(true)}
              aria-haspopup="dialog"
              aria-expanded={abierto}
              className={cn(
                "relative flex h-full min-h-11 w-full flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors",
                masActivo || abierto ? "text-primary" : "text-muted-foreground active:text-foreground",
              )}
            >
              {masActivo && !abierto && (
                <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-primary" aria-hidden />
              )}
              <MoreHorizontal className="h-5 w-5" />
              <span>Más</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent
          side="bottom"
          className="flex max-h-[88dvh] flex-col gap-0 rounded-t-2xl p-0 md:hidden"
        >
          <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" />

          <div className="shrink-0 px-4 pb-2 pt-2 pr-12">
            <SheetTitle className="font-display">Menú</SheetTitle>
            <SheetDescription className={clubNombre ? "truncate" : "sr-only"}>
              {clubNombre ?? "Todas las secciones de CheerManager"}
            </SheetDescription>
          </div>

          <div className="shrink-0 px-3 pb-2">
            <button
              type="button"
              onClick={abrirBuscador}
              className="flex h-11 w-full items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground"
            >
              <Search className="h-4 w-4" />
              Buscar una página o un deportista…
            </button>
          </div>

          <nav
            aria-label="Todas las secciones"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2"
          >
            {/* Quien tiene el portal además de secciones de club (p. ej. entrenador con hijos en el club). */}
            {tienePortal && !soloPortal && (
              <FilaLink item={PORTAL_ITEM} activo={coincide(pathname, tabActual, PORTAL_ITEM.href)} />
            )}
            {tienePortal && (
              <FilaLink
                item={PORTAL_AUTORIZACIONES_ITEM}
                activo={coincide(pathname, tabActual, PORTAL_AUTORIZACIONES_ITEM.href)}
              />
            )}

            {secciones.map(({ section, items }) => {
              const lista = items.filter((i) => i.status !== "soon");
              if (lista.length === 0) return null;
              const abiertaSec = seccionAbierta === section.id;
              const activaSec = lista.some((i) => coincide(pathname, tabActual, i.href));
              const total = !abiertaSec ? sumarBadges(lista, badges) : null;
              return (
                <Collapsible
                  key={section.id}
                  open={abiertaSec}
                  onOpenChange={(v) => setSeccionAbierta(v ? section.id : null)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] font-medium",
                        activaSec ? "text-primary" : "text-foreground",
                      )}
                    >
                      <section.icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 truncate">{section.label}</span>
                      {total && <Pill valor={total} />}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          abiertaSec && "rotate-180",
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mb-1 ml-5 border-l border-border pl-2">
                    {groupItems(lista).map((grupo, i) => (
                      <div key={`${grupo.label ?? "sin-grupo"}-${i}`}>
                        {grupo.label && (
                          <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {grupo.label}
                          </p>
                        )}
                        {grupo.items.map((item) => (
                          <FilaLink
                            key={item.href}
                            item={item}
                            activo={coincide(pathname, tabActual, item.href)}
                            valor={item.badge ? badges[item.badge] : undefined}
                          />
                        ))}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>

          {/* Cuenta: en teléfono la barra superior no tiene espacio para estas acciones. */}
          <div className="flex shrink-0 items-center gap-2 border-t border-border bg-card px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <Button asChild variant="outline" className="h-11 min-w-0 flex-1 justify-start gap-2">
              <Link href="/perfil" onClick={() => setAbierto(false)}>
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">{user.username || "Mi perfil"}</span>
              </Link>
            </Button>
            <ModeToggle />
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={logout}
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilaLink({ item, activo, valor }: { item: NavItem; activo: boolean; valor?: ValorBadge }) {
  return (
    <Link
      href={item.href}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
        activo ? "bg-accent font-medium text-accent-foreground" : "text-foreground active:bg-muted",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{item.label}</span>
      {valor && <Pill valor={valor} />}
    </Link>
  );
}