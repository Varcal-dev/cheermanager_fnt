"use client";

import { useEffect, useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portalCarnet, portalFoto } from "@/app/lib/portal";
import type { Carnet } from "@/app/lib/carnet";
import { TarjetaCarnet } from "@/app/components/carnet/TarjetaCarnet";

// Carnet del deportista dentro del portal: se muestra en el celular para que lo escaneen al llegar a entrenar,
// o se imprime. Es el MISMO código que genera el club (firmado: no sirve alterarlo ni usarlo en otro club).
export default function PortalCarnet({ deportistaId }: { deportistaId: number }) {
  const [carnet, setCarnet] = useState<Carnet | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    setCarnet(null);
    setError(false);
    portalCarnet(deportistaId)
      .then((c) => activo && setCarnet(c))
      .catch(() => activo && setError(true));
    return () => {
      activo = false;
    };
  }, [deportistaId]);

  if (error) return <p className="text-sm text-muted-foreground">No se pudo cargar el carnet. Intenta de nuevo más tarde.</p>;
  if (!carnet) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <TarjetaCarnet c={carnet} cargarFoto={portalFoto} />
      <div className="max-w-sm space-y-3 text-sm text-muted-foreground print:hidden">
        <p>Muestra este código al llegar al entrenamiento: el entrenador lo escanea y queda marcada tu asistencia.</p>
        {!carnet.vigente && (
          <p className="font-medium text-destructive">
            Tu carnet figura como «{carnet.estado}», por eso no marcará asistencia. Comunícate con el club.
          </p>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir carnet
        </Button>
        <p>La foto la actualiza el club. Si necesitas cambiarla, pídesela a tu entrenador.</p>
      </div>
      {/* Al imprimir solo sale el carnet. */}
      <style>{`@media print { body * { visibility: hidden } #carnet-imprimible, #carnet-imprimible * { visibility: visible } #carnet-imprimible { position: fixed; left: 20px; top: 20px } }`}</style>
    </div>
  );
}
