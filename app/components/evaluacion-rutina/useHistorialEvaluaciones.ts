"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/api";
import {
  eliminarEvaluacion,
  listarEvaluacionesPorGrupo,
  listarGrupos,
  type EvaluacionRutinaResultado,
  type GrupoOpcion,
} from "@/app/lib/evaluacion-rutina";

/** Histórico de evaluaciones por grupo: grupos, lista del grupo elegido y borrado. */
export function useHistorialEvaluaciones() {
  const [grupos, setGrupos] = useState<GrupoOpcion[]>([]);
  const [grupoId, setGrupoId] = useState("");
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionRutinaResultado[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    listarGrupos()
      .then(setGrupos)
      .catch(() => toast.error("No se pudieron cargar los grupos"));
  }, []);

  const cargar = useCallback((id: string) => {
    if (!id) {
      setEvaluaciones([]);
      return;
    }
    setCargando(true);
    listarEvaluacionesPorGrupo(Number(id))
      .then(setEvaluaciones)
      .catch(() => toast.error("No se pudieron cargar las evaluaciones de este grupo"))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar(grupoId);
  }, [grupoId, cargar]);

  /** Muestra el histórico de un grupo; si ya era el elegido, lo vuelve a pedir (el efecto no se dispararía solo). */
  const mostrarGrupo = (id: string) => (id === grupoId ? cargar(id) : setGrupoId(id));

  const borrar = (id: number) => {
    if (!confirm("¿Eliminar esta evaluación? Esta acción no se puede deshacer.")) return;
    eliminarEvaluacion(id)
      .then(() => {
        toast.success("Evaluación eliminada");
        cargar(grupoId);
      })
      .catch((err) => toast.error(getErrorMessage(err, "No se pudo eliminar la evaluación")));
  };

  return { grupos, grupoId, setGrupoId, mostrarGrupo, evaluaciones, cargando, borrar };
}

export type HistorialEvaluaciones = ReturnType<typeof useHistorialEvaluaciones>;
