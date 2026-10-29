"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import type { Entrenador, EstadoPersona, Genero } from "./types";

/** Lista de entrenadores y los catálogos (géneros y estados) que usan sus formularios. */
export function useEntrenadoresData() {
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [estados, setEstados] = useState<EstadoPersona[]>([]);

  const recargar = useCallback(async () => {
    try {
      const response = await api.get<Entrenador[]>("/api/entrenadores", { withCredentials: true });
      setEntrenadores(response.data);
    } catch (error) {
      console.error("Error al cargar entrenadores:", error);
      toast.error(getErrorMessage(error, "No se pudo cargar la lista de entrenadores"));
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  useEffect(() => {
    Promise.all([api.get("/api/usuario/genero/listar"), api.get("/api/personas/estados")])
      .then(([g, e]) => {
        setGeneros(g.data);
        setEstados(e.data);
      })
      .catch((error) => {
        console.error("Error al cargar catálogos", error);
        toast.error(getErrorMessage(error, "No se pudieron cargar géneros y estados"));
      });
  }, []);

  return { entrenadores, generos, estados, recargar };
}
