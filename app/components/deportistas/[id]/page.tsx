"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import PerfilDeportista from "@/app/components/perfil/PerfilDeportista";
import { perfilClub, type PerfilDeportista as Perfil } from "@/app/lib/perfil-deportista";

/** Perfil 360 del deportista para el personal del club. Cada sección depende de los permisos del rol (lo decide el back). */
export default function PerfilDeportistaPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setCargando(false);
      return;
    }
    let vigente = true;
    setCargando(true);
    perfilClub(id)
      .then((p) => vigente && setPerfil(p))
      .catch((e) => {
        if (vigente) {
          setPerfil(null);
          toast.error(getErrorMessage(e, "No se pudo cargar el perfil del deportista"));
        }
      })
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [id]);

  return (
    <ProtectedRoute requiredPermission="ver_deportista">
      <div className="max-w-5xl space-y-4">
        <Button asChild variant="ghost" size="sm" className="print:hidden">
          <Link href="/deportistas">
            <ArrowLeft className="mr-1 h-4 w-4" /> Deportistas
          </Link>
        </Button>
        {cargando ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : perfil ? (
          <PerfilDeportista perfil={perfil} modo="club" />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No se encontró el deportista.</p>
        )}
      </div>
    </ProtectedRoute>
  );
}
