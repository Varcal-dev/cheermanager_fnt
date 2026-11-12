"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listarSolicitudes } from "@/app/lib/portal";
import InscripcionesPantalla from "@/app/components/inscripciones/InscripcionesPantalla";
import SolicitudesInscripcionPantalla from "@/app/components/solicitudes/SolicitudesInscripcionPantalla";

// Inscripciones y solicitudes de renovación (las que piden deportistas y acudientes desde el portal) en una sola
// pantalla. La pestaña activa vive en la URL (?tab=solicitudes) para poder enlazarla; /solicitudes-inscripcion redirige aquí.
function Contenido() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") === "solicitudes" ? "solicitudes" : "inscripciones";
  const [pendientes, setPendientes] = useState<number | null>(null);

  const contarPendientes = useCallback(() => {
    listarSolicitudes("PENDIENTE")
      .then((l) => setPendientes(l.length))
      .catch(() => setPendientes(null));
  }, []);
  useEffect(contarPendientes, [contarPendientes]);

  const cambiar = (v: string) => router.replace(v === "solicitudes" ? "/inscripciones?tab=solicitudes" : "/inscripciones", { scroll: false });

  return (
    <ProtectedRoute requiredPermission="gestionar_inscripciones">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Inscripciones</h1>
        </div>
        <Tabs value={tab} onValueChange={cambiar}>
          <TabsList>
            <TabsTrigger value="inscripciones">Inscripciones</TabsTrigger>
            <TabsTrigger value="solicitudes" className="gap-2">
              Solicitudes
              {pendientes ? <Badge variant="destructive">{pendientes}</Badge> : null}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="inscripciones" className="pt-4">
            <InscripcionesPantalla embebido />
          </TabsContent>
          <TabsContent value="solicitudes" className="pt-4">
            <SolicitudesInscripcionPantalla embebido alCambiar={contarPendientes} />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

export default function InscripcionesPage() {
  // useSearchParams exige Suspense en el build de Next.
  return (
    <Suspense fallback={null}>
      <Contenido />
    </Suspense>
  );
}
