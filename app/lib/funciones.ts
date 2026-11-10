"use client";

import { useEffect, useState } from "react";
import { api, getAuthToken } from "@/lib/api";

// Funciones (módulos) que trae el plan del club (V39) y las que está perdiendo tras bajar de plan (V41).
// El menú oculta las que no trae el plan y deja las que están en solo lectura; el back las bloquea igual
// (403 con code FUNCION_NO_INCLUIDA o FUNCION_SOLO_LECTURA), así que ocultar es solo cortesía de la interfaz.

export interface FuncionPerdida {
  funcion: string;
  nombre: string;
  estado: "SOLO_LECTURA" | "BLOQUEADA";
  soloLecturaHasta: string; // yyyy-MM-dd
}

export interface FuncionesDelPlan {
  todas: boolean;
  funciones: string[];
  perdidas: FuncionPerdida[];
}

let pendiente: Promise<FuncionesDelPlan> | null = null;

export const funcionesApi = {
  propias: () => api.get<FuncionesDelPlan>("/api/suscripcion/funciones").then((r) => r.data),
  /** Descarga el ZIP con los datos de una función (siempre disponible). */
  exportar: async (codigo: string) => {
    const r = await api.get<Blob>(`/api/suscripcion/funciones/${codigo}/exportar`, { responseType: "blob" });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cheermanager-${codigo.toLowerCase()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

/** Una sola consulta por carga de página, compartida por el menú y la paleta de comandos. */
function cargar(): Promise<FuncionesDelPlan> {
  if (!pendiente) {
    pendiente = funcionesApi.propias().catch((e) => {
      pendiente = null; // si falla, se reintenta la próxima vez
      throw e;
    });
  }
  return pendiente;
}

/** null = aún no se sabe (o falló): en ese caso no se oculta nada, y el back decide. */
export function useFunciones() {
  const [datos, setDatos] = useState<FuncionesDelPlan | null>(null);
  useEffect(() => {
    if (!getAuthToken()) return;
    let activo = true;
    cargar()
      .then((d) => activo && setDatos(d))
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);
  /** true si la entrada de menú con esa función (o sin función) debe mostrarse: incluida o aún en solo lectura. */
  const incluye = (funcion?: string) =>
    !funcion ||
    datos === null ||
    datos.todas ||
    datos.funciones.includes(funcion) ||
    (datos.perdidas ?? []).some((p) => p.funcion === funcion && p.estado === "SOLO_LECTURA");
  return { incluye, perdidas: datos?.perdidas ?? [] };
}
