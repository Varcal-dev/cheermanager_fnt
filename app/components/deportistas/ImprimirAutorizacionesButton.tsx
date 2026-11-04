"use client";

import { useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { abrirImpresionAutorizaciones, type DatosAutorizacion } from "@/app/lib/autorizacion-imprimible";
import type { Deportista } from "@/app/deportistas/types";

/**
 * L4: genera el formato imprimible de las tres autorizaciones con los datos del deportista y de su acudiente
 * principal ya llenos (lo que falte queda en línea para llenar a mano).
 */
export default function ImprimirAutorizacionesButton({ deportista }: { deportista: Deportista }) {
  const { permissions } = useUser();
  const [cargando, setCargando] = useState(false);

  const imprimir = async () => {
    setCargando(true);
    try {
      let club = "";
      try {
        club = (await api.get("/api/suscripcion")).data?.clubNombre ?? "";
      } catch {
        /* sin nombre del club: queda en blanco */
      }

      let acudiente: DatosAutorizacion["acudiente"] = null;
      if (permissions.includes("ver_acudientes")) {
        try {
          const vinculos: any[] = (await api.get(`/api/acudientes/deportista/${deportista.deportistaId}`)).data ?? [];
          const v = vinculos.find((x) => x.principal) ?? vinculos[0];
          if (v) {
            let tipoDocumento: string | null = null;
            let numeroDocumento: string | null = null;
            try {
              const a = (await api.get(`/api/acudientes/${v.acudienteId}`)).data;
              tipoDocumento = a?.tipoDocumento ?? null;
              numeroDocumento = a?.numeroDocumento ?? null;
            } catch {
              /* sin documento: queda en blanco */
            }
            acudiente = {
              nombre: `${v.nombre ?? ""} ${v.apellidos ?? ""}`.trim(),
              parentesco: v.parentesco ?? null,
              tipoDocumento,
              numeroDocumento,
            };
          }
        } catch {
          /* sin acudiente: queda en blanco */
        }
      }

      const ok = abrirImpresionAutorizaciones({
        club,
        deportista: {
          nombre: `${deportista.nombre} ${deportista.apellidos}`.trim(),
          tipoDocumento: deportista.tipoDocumento,
          numeroDocumento: deportista.numeroDocumento,
          fechaNacimiento: deportista.fechaNacimiento ? String(deportista.fechaNacimiento).slice(0, 10) : null,
        },
        acudiente,
      });
      if (!ok) toast.error("El navegador bloqueó la ventana. Permite las ventanas emergentes e inténtalo de nuevo.");
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudo generar el formato"));
    } finally {
      setCargando(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={imprimir} disabled={cargando}>
      {cargando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
      Imprimir autorizaciones
    </Button>
  );
}
