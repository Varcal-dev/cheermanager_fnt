"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { listarTopesSeccion, obtenerTopeDriver, type TopeDriverNivel, type TopeSeccionNivel } from "@/app/lib/evaluacion-rutina";
import { NIVELES_DEDUCCION } from "@/app/lib/rubrica-guia";

// Muestra los escalones de puntaje configurados (TopeSeccionNivel) como referencia rápida mientras
// se digita: es la misma tabla que usa el backend para calcular, así que nunca se desincroniza.
export function GuiaEscalones({ nivelId, subCriterioId }: { nivelId: number; subCriterioId: number }) {
  const [escalones, setEscalones] = useState<TopeSeccionNivel[] | null>(null);

  useEffect(() => {
    listarTopesSeccion(nivelId, subCriterioId)
      .then((data) => setEscalones([...data].sort((a, b) => a.orden - b.orden)))
      .catch(() => setEscalones([]));
  }, [nivelId, subCriterioId]);

  if (!escalones || escalones.length === 0) return null;

  return (
    <details className="text-xs text-muted-foreground rounded-md border border-dashed p-2">
      <summary className="cursor-pointer flex items-center gap-1 font-medium select-none">
        <Info className="h-3 w-3" /> Ver escalones de puntaje de la rúbrica
      </summary>
      <ul className="mt-2 space-y-1">
        {escalones.map((e) => (
          <li key={e.id}>
            <span className="font-semibold text-foreground">{e.valorPuntaje}</span> {e.descripcionRubrica ?? "(sin descripción)"}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function GuiaDeduccion() {
  return (
    <details className="text-xs text-muted-foreground rounded-md border border-dashed p-2">
      <summary className="cursor-pointer flex items-center gap-1 font-medium select-none">
        <Info className="h-3 w-3" /> ¿Qué significa cada nivel de deducción?
      </summary>
      <ul className="mt-2 space-y-1">
        {NIVELES_DEDUCCION.map((n) => (
          <li key={n.valor}>
            <span className="font-semibold text-foreground">{n.valor}</span> — {n.etiqueta}: {n.descripcion}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function TopeDriverGuia({ driverId, nivelId }: { driverId: number; nivelId: number }) {
  const [tope, setTope] = useState<TopeDriverNivel | null | undefined>(undefined);

  useEffect(() => {
    obtenerTopeDriver(driverId, nivelId)
      .then(setTope)
      .catch(() => setTope(null));
  }, [driverId, nivelId]);

  if (!tope) return null;

  const hayHab2 = tope.valorBasicoHabilidad2 != null || tope.valorAltoHabilidad2 != null;
  return (
    <p className="text-xs text-muted-foreground rounded-md border border-dashed p-2">
      {hayHab2 ? "Hab. 1 — " : ""}Básico: <span className="font-semibold text-foreground">{tope.valorNivelBasico ?? "—"}</span> · Alto:{" "}
      <span className="font-semibold text-foreground">{tope.valorNivelAlto ?? "—"}</span>
      {hayHab2 && (
        <>
          {" "}· Hab. 2 — Básico: <span className="font-semibold text-foreground">{tope.valorBasicoHabilidad2 ?? "—"}</span> · Alto:{" "}
          <span className="font-semibold text-foreground">{tope.valorAltoHabilidad2 ?? "—"}</span>
        </>
      )}{" "}
      · Tope máximo: <span className="font-semibold text-foreground">{tope.topeMaximo}</span>
    </p>
  );
}
