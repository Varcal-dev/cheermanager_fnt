"use client";

import { Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InfoFuncion } from "@/app/lib/funciones";

/** Texto corto del estado de plan: "Pro", "Elite"… o "Solo lectura". */
export function textoPlan(info: InfoFuncion): string {
  if (info.estado === "SOLO_LECTURA") return "Solo lectura";
  return info.planMinimo ?? "Plan superior";
}

/** Descripción larga para tooltip / lector de pantalla. */
export function descripcionPlan(info: InfoFuncion): string {
  if (info.estado === "SOLO_LECTURA") {
    return `${info.nombre}: solo lectura${info.soloLecturaHasta ? ` hasta el ${info.soloLecturaHasta}` : ""}`;
  }
  return info.planMinimo
    ? `${info.nombre}: disponible desde el plan ${info.planMinimo}`
    : `${info.nombre}: no incluido en tu plan`;
}

/**
 * Candado con la etiqueta del plan que incluye la función. `variante="oscuro"` es para el menú lateral
 * (panel oscuro con tokens sidebar-*); `"claro"` para superficies normales (hoja del teléfono, paleta).
 */
export function EtiquetaPlan({
  info,
  variante = "claro",
  className,
}: {
  info: InfoFuncion;
  variante?: "claro" | "oscuro";
  className?: string;
}) {
  const Icono = info.estado === "SOLO_LECTURA" ? Eye : Lock;
  return (
    <span
      title={descripcionPlan(info)}
      aria-label={descripcionPlan(info)}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 text-[10px] font-medium leading-4",
        variante === "oscuro" ? "bg-sidebar-accent/70 text-sidebar-muted" : "bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icono className="h-3 w-3" aria-hidden />
      {textoPlan(info)}
    </span>
  );
}
