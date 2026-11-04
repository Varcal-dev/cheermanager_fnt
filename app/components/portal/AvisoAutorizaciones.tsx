"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { portalAutorizaciones } from "@/app/lib/autorizaciones";

/** Aviso en el portal: hay deportistas sin la autorización de tratamiento de datos. No se muestra si no hay pendientes. */
export default function AvisoAutorizaciones() {
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    portalAutorizaciones()
      .then((items) =>
        setPendientes(
          items.filter(
            (i) => i.puedeFirmar && !i.tipos.some((t) => t.tipo === "TRATAMIENTO_DATOS" && t.vigente),
          ).length,
        ),
      )
      .catch(() => setPendientes(0)); // accesorio: si falla, el portal sigue
  }, []);

  if (pendientes === 0) return null;

  return (
    <Card className="print:hidden border-amber-300 bg-amber-50 dark:bg-amber-950/20">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-sm">
          <ShieldCheck className="h-5 w-5 mt-0.5 text-amber-600" />
          <p>
            Falta tu autorización para el tratamiento de datos personales
            {pendientes > 1 ? ` (${pendientes} deportistas)` : ""}. Léela y fírmala en un minuto.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/mi/autorizaciones">Revisar y firmar</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
