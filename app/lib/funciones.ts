"use client";

import { useEffect, useState } from "react";
import { api, getAuthToken } from "@/lib/api";

// Funciones (módulos) que trae el plan del club (V39) y las que está perdiendo tras bajar de plan (V41).
// Lo que el plan no trae NO se oculta: el menú, la paleta y la propia pantalla lo muestran con un candado y la
// etiqueta del plan que lo incluye (Pro, Elite…), para que el club sepa que existe y qué plan lo habilita.
// El back las bloquea igual (403 con code FUNCION_NO_INCLUIDA o FUNCION_SOLO_LECTURA): esto es solo la cara visible.

export interface FuncionPerdida {
  funcion: string;
  nombre: string;
  estado: "SOLO_LECTURA" | "BLOQUEADA";
  soloLecturaHasta: string; // yyyy-MM-dd
}

/** Una función del catálogo, con el plan más barato que la trae. */
export interface EntradaCatalogo {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  /** Etiqueta corta del plan más barato que la incluye ("Pro", "Elite"); null si ningún plan la trae todavía. */
  planMinimo: string | null;
  planMinimoCodigo: string | null;
  /** true: sin el plan se puede consultar pero no crear ni editar. false: la pantalla entera se bloquea. */
  soloEscritura: boolean;
}

export interface FuncionesDelPlan {
  todas: boolean;
  funciones: string[];
  perdidas: FuncionPerdida[];
  catalogo?: EntradaCatalogo[];
}

/** PLENA: el plan la trae. SOLO_LECTURA: la perdió al bajar de plan y aún está en ventana. BLOQUEADA: el plan no la trae. */
export type EstadoFuncion = "PLENA" | "SOLO_LECTURA" | "BLOQUEADA";

export interface InfoFuncion {
  funcion: string;
  estado: EstadoFuncion;
  nombre: string;
  descripcion: string | null;
  planMinimo: string | null;
  soloEscritura: boolean;
  /** Solo en SOLO_LECTURA: último día (yyyy-MM-dd) en que se puede consultar. */
  soloLecturaHasta?: string;
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

/** Una sola consulta por carga de página, compartida por el menú, la paleta y la puerta de cada pantalla. */
function cargar(): Promise<FuncionesDelPlan> {
  if (!pendiente) {
    pendiente = funcionesApi.propias().catch((e) => {
      pendiente = null; // si falla, se reintenta la próxima vez
      throw e;
    });
  }
  return pendiente;
}

/** Para después de cambiar de plan o de excepciones: la próxima lectura vuelve a preguntar al servidor. */
export function olvidarFunciones() {
  pendiente = null;
}

/** Estado de una función según lo que dijo el servidor. Pura: se prueba sin React. */
export function estadoDeFuncion(datos: FuncionesDelPlan | null, funcion?: string): EstadoFuncion {
  if (!funcion || datos === null || datos.todas || datos.funciones.includes(funcion)) return "PLENA";
  const perdida = (datos.perdidas ?? []).find((p) => p.funcion === funcion);
  return perdida?.estado === "SOLO_LECTURA" ? "SOLO_LECTURA" : "BLOQUEADA";
}

/** Detalle de una función (nombre, plan que la trae…) o undefined si no tiene puerta de plan. Pura. */
export function infoDeFuncion(datos: FuncionesDelPlan | null, funcion?: string): InfoFuncion | undefined {
  if (!funcion) return undefined;
  const estado = estadoDeFuncion(datos, funcion);
  const cat = datos?.catalogo?.find((c) => c.codigo === funcion);
  const perdida = datos?.perdidas?.find((p) => p.funcion === funcion);
  return {
    funcion,
    estado,
    nombre: cat?.nombre ?? perdida?.nombre ?? funcion,
    descripcion: cat?.descripcion ?? null,
    planMinimo: cat?.planMinimo ?? null,
    soloEscritura: cat?.soloEscritura ?? false,
    soloLecturaHasta: estado === "SOLO_LECTURA" ? perdida?.soloLecturaHasta : undefined,
  };
}

/**
 * null = aún no se sabe (o falló): en ese caso no se marca nada y el back decide.
 * `estado(f)` y `info(f)` aceptan undefined (entrada sin función de plan) y devuelven PLENA / undefined.
 */
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
  const estado = (funcion?: string) => estadoDeFuncion(datos, funcion);
  const info = (funcion?: string) => infoDeFuncion(datos, funcion);
  /** true si la función se puede usar (completa o aún en solo lectura). Se conserva para quien solo necesita ese sí/no. */
  const incluye = (funcion?: string) => estado(funcion) !== "BLOQUEADA";
  return { incluye, estado, info, perdidas: datos?.perdidas ?? [], cargado: datos !== null };
}
