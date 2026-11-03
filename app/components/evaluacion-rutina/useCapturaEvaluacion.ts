"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/api";
import {
  guardarEvaluacion,
  listarNiveles,
  listarSubCriterios,
  listarTopesSeccionPorNivel,
  previsualizarEvaluacion,
  SECCIONES,
  type DeduccionRutinaInput,
  type EvaluacionRutinaInput,
  type EvaluacionRutinaResultado,
  type NivelCompetencia,
  type RegistroSubCriterioInput,
  type SubCriterioRubrica,
  type TopeSeccionNivel,
} from "@/app/lib/evaluacion-rutina";
import { hoyLocal, registroVacio, valorInicialDelNivel } from "./comunes";

const contextoInicial = () => ({
  grupoId: "",
  nivelId: "",
  fecha: hoyLocal(),
  evento: "",
  cantidadAtletas: "",
  observaciones: "",
});

// Una captura en blanco solo para los sub-criterios que el nivel elegido realmente puntúa
// (Prep no tiene lanzamientos, Novice no tiene hojas de dificultad, Tiny solo puntúa saltos…).
const registrosParaNivel = (sc: SubCriterioRubrica[], topes: TopeSeccionNivel[]) => {
  const r: Record<number, RegistroSubCriterioInput> = {};
  sc.forEach((s) => (r[s.id] = registroVacio(s, valorInicialDelNivel(s, topes))));
  return r;
};

/** Estado del formulario de captura: contexto, catálogos de la rúbrica, registros, revisión y guardado. */
export function useCapturaEvaluacion(onGuardada: (grupoId: number) => void) {
  const [niveles, setNiveles] = useState<NivelCompetencia[]>([]);
  const [subCriterios, setSubCriterios] = useState<SubCriterioRubrica[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);

  const [contexto, setContexto] = useState(contextoInicial);
  // Escalones del nivel elegido: definen qué sub-criterios aplican. null = todavía no hay nivel cargado.
  const [topesNivel, setTopesNivel] = useState<TopeSeccionNivel[] | null>(null);
  const [cargandoNivel, setCargandoNivel] = useState(false);
  const [registros, setRegistros] = useState<Record<number, RegistroSubCriterioInput>>({});
  // Caídas, seguridad y tiempo: se restan sobre 100. Novice no las maneja (se clasifica por banda).
  const [deducciones, setDeducciones] = useState<DeduccionRutinaInput[]>([]);
  const [previsualizando, setPrevisualizando] = useState(false);
  const [preview, setPreview] = useState<EvaluacionRutinaResultado | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiarContexto = (patch: Partial<ReturnType<typeof contextoInicial>>) => setContexto((prev) => ({ ...prev, ...patch }));

  /** Limpia el formulario (contexto y puntajes) para empezar una evaluación en blanco. */
  const reiniciar = () => {
    setContexto(contextoInicial());
    setPreview(null);
    setTopesNivel(null);
    setRegistros({});
    setDeducciones([]);
  };

  /** Al abrir la captura: carga la rúbrica la primera vez y siempre parte de puntajes en blanco. */
  const iniciar = () => {
    reiniciar();
    if (subCriterios.length > 0) return;
    setCargandoCatalogos(true);
    Promise.all([listarNiveles(), listarSubCriterios()])
      .then(([n, sc]) => {
        setNiveles(n);
        setSubCriterios(sc);
      })
      .catch(() => toast.error("No se pudo cargar la configuración de la rúbrica"))
      .finally(() => setCargandoCatalogos(false));
  };

  // Al elegir (o cambiar) el nivel se trae su rúbrica y se arma una captura en blanco con lo que aplica.
  // Cambiar de nivel descarta lo digitado: las reglas, los topes y los sub-criterios son otros.
  useEffect(() => {
    setDeducciones([]);
    if (!contexto.nivelId || subCriterios.length === 0) {
      setTopesNivel(null);
      setRegistros({});
      return;
    }
    let cancelado = false;
    setCargandoNivel(true);
    listarTopesSeccionPorNivel(Number(contexto.nivelId))
      .then((topes) => {
        if (cancelado) return;
        const aplican = new Set(topes.map((t) => t.subCriterio.id));
        setTopesNivel(topes);
        setRegistros(registrosParaNivel(subCriterios.filter((s) => aplican.has(s.id)), topes));
      })
      .catch(() => {
        if (cancelado) return;
        setTopesNivel(null);
        setRegistros({});
        toast.error("No se pudo cargar la rúbrica de este nivel");
      })
      .finally(() => {
        if (!cancelado) setCargandoNivel(false);
      });
    return () => {
      cancelado = true;
    };
  }, [contexto.nivelId, subCriterios]);

  const actualizarRegistro = (subCriterioId: number, patch: Partial<RegistroSubCriterioInput>) =>
    setRegistros((prev) => ({ ...prev, [subCriterioId]: { ...prev[subCriterioId], ...patch } }));

  const subCriteriosAplicables = useMemo(() => {
    if (!topesNivel) return [];
    const aplican = new Set(topesNivel.map((t) => t.subCriterio.id));
    return subCriterios.filter((s) => aplican.has(s.id));
  }, [subCriterios, topesNivel]);

  const subCriteriosPorSeccion = useMemo(() => {
    const mapa: Record<string, SubCriterioRubrica[]> = {};
    SECCIONES.forEach((s) => (mapa[s] = []));
    subCriteriosAplicables.forEach((sc) => {
      if (!mapa[sc.seccion]) mapa[sc.seccion] = [];
      mapa[sc.seccion].push(sc);
    });
    return mapa;
  }, [subCriteriosAplicables]);

  const nivelElegido = niveles.find((n) => String(n.id) === contexto.nivelId);
  /** Los niveles con banda (Novice) no tienen deducciones: se clasifican por % del máximo. */
  const admiteDeducciones = nivelElegido != null && nivelElegido.umbralSuperior == null;

  const contextoCompleto = Boolean(
    contexto.grupoId && contexto.nivelId && contexto.cantidadAtletas && contexto.evento.trim() && contexto.fecha,
  );

  const construirDTO = (): EvaluacionRutinaInput => ({
    grupoId: Number(contexto.grupoId),
    nivelId: Number(contexto.nivelId),
    fecha: contexto.fecha,
    evento: contexto.evento.trim(),
    cantidadAtletas: Number(contexto.cantidadAtletas),
    observaciones: contexto.observaciones || undefined,
    registros: subCriteriosAplicables.map((s) => registros[s.id]).filter(Boolean),
    deducciones: admiteDeducciones ? deducciones.filter((d) => d.puntosUnitarios > 0) : undefined,
  });

  const revisar = () => {
    const atletas = Number(contexto.cantidadAtletas);
    if (!Number.isInteger(atletas) || atletas < 1) {
      toast.error("La cantidad de atletas debe ser un número entero de 1 en adelante");
      return;
    }
    setPrevisualizando(true);
    previsualizarEvaluacion(construirDTO())
      .then(setPreview)
      .catch((err) => toast.error(getErrorMessage(err, "No se pudo calcular la evaluación. Revisa los datos ingresados.")))
      .finally(() => setPrevisualizando(false));
  };

  const confirmarGuardado = () => {
    const dto = construirDTO();
    setGuardando(true);
    guardarEvaluacion(dto)
      .then(() => {
        toast.success("Evaluación guardada");
        reiniciar();
        onGuardada(dto.grupoId);
      })
      .catch((err) => toast.error(getErrorMessage(err, "No se pudo guardar la evaluación.")))
      .finally(() => setGuardando(false));
  };

  return {
    niveles,
    cargandoCatalogos,
    cargandoNivel,
    topesNivel,
    contexto,
    cambiarContexto,
    registros,
    actualizarRegistro,
    subCriteriosPorSeccion,
    deducciones,
    setDeducciones,
    admiteDeducciones,
    contextoCompleto,
    previsualizando,
    preview,
    cerrarPreview: () => setPreview(null),
    guardando,
    iniciar,
    reiniciar,
    revisar,
    confirmarGuardado,
  };
}

export type CapturaEvaluacion = ReturnType<typeof useCapturaEvaluacion>;
