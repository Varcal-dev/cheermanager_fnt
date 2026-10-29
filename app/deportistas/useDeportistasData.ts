"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import { obtenerPlanesPago, type PlanPago } from "@/lib/deportistas-historiales";
import type { Deportista, Estado, Genero, Nivel } from "./types";

/**
 * Datos que necesita la pantalla de Deportistas: la lista, los catálogos (niveles, géneros,
 * estados, planes de pago) y el conjunto de deportistas que aún no tienen inscripción.
 */
export function useDeportistasData() {
  const [deportistas, setDeportistas] = useState<Deportista[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [planesPago, setPlanesPago] = useState<PlanPago[]>([]);
  const [noInscritos, setNoInscritos] = useState<Set<number>>(new Set());

  const recargar = useCallback(async () => {
    try {
      const response = await api.get("/api/deportistas", { withCredentials: true });
      setDeportistas(response.data);
    } catch (error) {
      console.error("Error al obtener los deportistas:", error);
      toast.error(getErrorMessage(error, "No se pudo cargar la lista de deportistas."));
    }
  }, []);

  const recargarNoInscritos = useCallback(() => {
    api
      .get("/api/inscripciones/no-inscritos")
      .then((res) => {
        setNoInscritos(new Set(res.data.map((d: { deportistaId: number }) => d.deportistaId)));
      })
      .catch(() => {
        // Silencioso: si falla, el botón "Matricular" simplemente no aparece
        // (no es crítico para el resto de la página).
      });
  }, []);

  useEffect(() => {
    recargar();
    recargarNoInscritos();
  }, [recargar, recargarNoInscritos]);

  // Catálogos: se piden una sola vez y en paralelo.
  useEffect(() => {
    Promise.all([
      api.get("/api/niveles"),
      api.get("/api/usuario/genero/listar"),
      api.get("/api/personas/estados"),
      obtenerPlanesPago(),
    ])
      .then(([n, g, e, p]) => {
        setNiveles(n.data);
        setGeneros(g.data);
        setEstados(e.data);
        setPlanesPago(p);
      })
      .catch((error) => {
        console.error("Error al cargar catálogos", error);
        toast.error(getErrorMessage(error, "No se pudieron cargar niveles, géneros o estados."));
      });
  }, []);

  return { deportistas, niveles, generos, estados, planesPago, noInscritos, recargar, recargarNoInscritos };
}
