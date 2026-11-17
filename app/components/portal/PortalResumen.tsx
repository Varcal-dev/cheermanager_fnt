"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import PerfilDeportista from "@/app/components/perfil/PerfilDeportista";
import { perfilPortal, type PerfilDeportista as Perfil } from "@/app/lib/perfil-deportista";

/** Pestaña "Resumen" del portal: el perfil 360 del deportista (sin comparaciones con otros atletas). */
export default function PortalResumen({ deportistaId }: { deportistaId: number }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    setPerfil(null);
    setError(false);
    perfilPortal(deportistaId)
      .then((p) => vigente && setPerfil(p))
      .catch(() => vigente && setError(true));
    return () => {
      vigente = false;
    };
  }, [deportistaId]);

  if (error) return <p className="py-6 text-center text-sm text-muted-foreground">No se pudo cargar el resumen.</p>;
  if (!perfil) return <Loader2 className="h-5 w-5 animate-spin" />;
  return <PerfilDeportista perfil={perfil} modo="portal" />;
}
