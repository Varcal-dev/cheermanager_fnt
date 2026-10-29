"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import type { CargaPerezosa } from "./comunes";

/**
 * Para pestañas del dashboard que se cargan la primera vez que se abren: `cargar()` consulta una
 * sola vez (las siguientes llamadas no hacen nada) y avisa con un toast si falla.
 */
export function useResumenPerezoso<T>(fetcher: () => Promise<T>, errorMsg: string) {
  const [data, setData] = useState<T | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargado, setCargado] = useState(false);

  const cargar = () => {
    if (cargado) return;
    setCargado(true);
    setCargando(true);
    fetcher()
      .then(setData)
      .catch(() => toast.error(errorMsg))
      .finally(() => setCargando(false));
  };

  const estado: CargaPerezosa<T> = { data, cargando };
  return { ...estado, estado, cargar };
}
