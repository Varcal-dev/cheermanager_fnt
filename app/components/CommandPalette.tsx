"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";
import { HOME_ITEM, NAV_SECTIONS } from "./nav-config";

interface DeportistaResultado {
  deportistaId: number;
  nombre: string;
  apellidos: string;
  nivelNombre: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [deportistas, setDeportistas] = useState<DeportistaResultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const router = useRouter();
  const { permissions } = useUser();

  // Atajo global: Cmd+K en Mac, Ctrl+K en Windows/Linux. Funciona sin
  // importar en qué página esté parado el usuario.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Búsqueda de deportistas por nombre, con debounce — no dispara una
  // petición por cada tecla.
  useEffect(() => {
    if (query.trim().length < 2 || !permissions.includes("ver_deportista")) {
      setDeportistas([]);
      return;
    }
    setBuscando(true);
    const timeout = setTimeout(() => {
      api
        .get("/api/deportistas")
        .then((res) => {
          const q = query.trim().toLowerCase();
          const filtrados = (res.data as DeportistaResultado[]).filter((d) =>
            `${d.nombre} ${d.apellidos}`.toLowerCase().includes(q),
          );
          setDeportistas(filtrados.slice(0, 6));
        })
        .catch(() => setDeportistas([]))
        .finally(() => setBuscando(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, permissions]);

  const ir = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const paginasVisibles = NAV_SECTIONS.flatMap((section) =>
    permissions.includes(section.permission)
      ? section.items.filter((item) => item.status !== "soon")
      : [],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar una página o un deportista..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {buscando ? "Buscando…" : "Sin resultados."}
        </CommandEmpty>

        {deportistas.length > 0 && (
          <>
            <CommandGroup heading="Deportistas">
              {deportistas.map((d) => (
                <CommandItem
                  key={d.deportistaId}
                  value={`deportista-${d.deportistaId}-${d.nombre}-${d.apellidos}`}
                  onSelect={() =>
                    ir(`/deportistas?search=${encodeURIComponent(`${d.nombre} ${d.apellidos}`)}`)
                  }
                >
                  <User />
                  <span>
                    {d.nombre} {d.apellidos}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {d.nivelNombre}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Páginas">
          <CommandItem value={HOME_ITEM.label} onSelect={() => ir(HOME_ITEM.href)}>
            <HOME_ITEM.icon />
            <span>{HOME_ITEM.label}</span>
          </CommandItem>
          {paginasVisibles.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => ir(item.href)}
            >
              <item.icon />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Botón de disparo para el TopBar — un buscador siempre visible es más
// descubrible que depender de que alguien adivine el atajo de teclado.
export function CommandPaletteTrigger() {
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");

  return (
    <button
      type="button"
      onClick={() =>
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: isMac, ctrlKey: !isMac }),
        )
      }
      className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent transition-colors w-full max-w-xs"
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">Buscar...</span>
      <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
        {isMac ? "⌘" : "Ctrl"}K
      </kbd>
    </button>
  );
}