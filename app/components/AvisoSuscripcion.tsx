"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { getAuthToken } from "@/lib/api";
import { fechaCorta, suscripcionApi, type ResumenSuscripcion } from "@/app/lib/suscripcion";

// Franja bajo la barra superior que avisa del estado de la suscripción del club:
// vencida (solo lectura), en gracia, por vencer (7 días o menos) o cerca del límite de deportistas.
// No muestra nada si todo está en orden. Si el aviso no se puede cargar, tampoco molesta.

function mensaje(s: ResumenSuscripcion): { texto: string; grave: boolean } | null {
  if (s.vigencia === "SOLO_LECTURA") {
    return {
      grave: true,
      texto:
        s.estadoSuscripcion === "CANCELADA"
          ? "La suscripción de tu club está cancelada: puedes consultar la información, pero no crear ni modificar datos."
          : `La suscripción de tu club venció el ${fechaCorta(s.vigenteHasta)}: puedes consultar la información, pero no crear ni modificar datos. Contacta a CheerManager para renovarla.`,
    };
  }
  if (s.vigencia === "EN_GRACIA") {
    return {
      grave: true,
      texto: `La suscripción de tu club venció el ${fechaCorta(s.vigenteHasta)}. Todo sigue funcionando por unos días más; renuévala para no quedar en solo lectura.`,
    };
  }
  if (s.vigencia === "VIGENTE" && s.diasRestantes !== null && s.diasRestantes <= 7) {
    const cuando = s.diasRestantes === 0 ? "hoy" : s.diasRestantes === 1 ? "mañana" : `en ${s.diasRestantes} días`;
    return {
      grave: false,
      texto:
        s.estadoSuscripcion === "PRUEBA"
          ? `La prueba de tu club termina ${cuando} (${fechaCorta(s.vigenteHasta)}).`
          : `La suscripción de tu club vence ${cuando} (${fechaCorta(s.vigenteHasta)}).`,
    };
  }
  if (s.limiteEfectivo !== null && s.limiteEfectivo > 0 && s.deportistasActivos >= Math.ceil(s.limiteEfectivo * 0.9)) {
    return {
      grave: s.deportistasActivos >= s.limiteEfectivo,
      texto: `Tu club usa ${s.deportistasActivos} de ${s.limiteEfectivo} deportistas activos que permite su plan.`,
    };
  }
  return null;
}

export default function AvisoSuscripcion() {
  const [resumen, setResumen] = useState<ResumenSuscripcion | null>(null);

  useEffect(() => {
    if (!getAuthToken()) return;
    let activo = true;
    suscripcionApi
      .propia()
      .then((r) => activo && setResumen(r))
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  const m = resumen ? mensaje(resumen) : null;
  if (!m) return null;

  const Icono = m.grave ? AlertTriangle : Info;
  return (
    <div
      role="status"
      className={
        "mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm " +
        (m.grave
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300")
      }
    >
      <Icono className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{m.texto}</span>
    </div>
  );
}
