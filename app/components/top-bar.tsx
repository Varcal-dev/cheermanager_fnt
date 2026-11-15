"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";
import { useUser } from "@/context/UserContext";
import { CommandPaletteTrigger } from "./CommandPalette";
import { useLogout } from "./use-logout";
import { Logo } from "./brand/Logo";

// Teléfono (< md): marca + buscador. La navegación vive en la barra inferior y
// el perfil, el tema y cerrar sesión, en su hoja "Más".
// Tablet y escritorio (≥ md): igual que antes.
export function TopBar() {
  const { clubNombre } = useUser();
  const handleLogout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3 print:hidden sm:px-4 md:h-16 md:gap-4 md:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="CheerManager, ir al inicio">
        {/* Teléfono: solo el isotipo (CM). Tablet y escritorio: logo horizontal + nombre del club. */}
        <Logo variante="isotipo" alto={28} prioridad className="md:hidden" />
        <Logo variante="horizontal" alto={26} prioridad className="hidden md:inline-flex" />
        {clubNombre && (
          <span
            className="hidden max-w-[14rem] truncate border-l border-border pl-3 text-xs text-muted-foreground md:block"
            title={clubNombre}
          >
            {clubNombre}
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 justify-center">
        <CommandPaletteTrigger />
      </div>

      {/* Solo tablet y escritorio: en teléfono estas acciones están en "Más". */}
      <div className="hidden items-center gap-1 md:flex">
        <Link href="/perfil" passHref>
          <Button variant="ghost" size="icon" className="rounded-full" title="Mi Perfil">
            <User className="h-5 w-5" />
            <span className="sr-only">Mi perfil</span>
          </Button>
        </Link>
        <ModeToggle />
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
}
