"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2, Printer } from "lucide-react";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { abrirImpresionCopia, descargarCsv, type CopiaDatos } from "@/app/lib/copia-datos";

/**
 * L6: derecho de acceso. Descarga (Excel/CSV) o imprime (PDF) la copia de TODOS los datos de la persona,
 * incluidos los de salud. Solo para quien atiende la solicitud del titular (permiso exportar_datos_titular).
 */
export default function CopiaDatosButtons({ personaId }: { personaId: number }) {
  const [cargando, setCargando] = useState<"csv" | "pdf" | null>(null);

  const generar = async (modo: "csv" | "pdf") => {
    setCargando(modo);
    try {
      const copia: CopiaDatos = (await api.get(`/api/personas/${personaId}/copia-datos`)).data;
      if (modo === "csv") {
        descargarCsv(copia);
      } else if (!abrirImpresionCopia(copia)) {
        toast.error("El navegador bloqueó la ventana. Permite las ventanas emergentes e inténtalo de nuevo.");
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudo generar la copia de datos"));
    } finally {
      setCargando(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Copia de todos los datos (derecho de acceso):</span>
      <Button variant="outline" size="sm" onClick={() => generar("csv")} disabled={cargando !== null}>
        {cargando === "csv" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
        Excel (CSV)
      </Button>
      <Button variant="outline" size="sm" onClick={() => generar("pdf")} disabled={cargando !== null}>
        {cargando === "pdf" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
        PDF
      </Button>
    </div>
  );
}
