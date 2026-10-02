// Contenido de referencia tomado literal de "Rúbrica de Puntaje All Star
// Élite N1-N4 2026 (United Scoring System)" — FEDECOLCHEER. Todo lo que SÍ
// vive en la base de datos (escalones de puntaje, rangos) se consulta en
// vivo vía /api/rubrica-config/*; esto de acá es únicamente lo que la
// rúbrica describe en prosa y no tiene una tabla propia en el modelo
// (qué observa cada driver, qué significa cada nivel de deducción).

export interface GuiaDriver {
  nombre: string;
  descripcion: string;
}

// Drivers de deducción de EJECUCIÓN, agrupados por sub-sección. La rúbrica
// aclara que la lista de ejemplos "no se limita a" estos puntos — son guía,
// no una checklist exhaustiva.
export const DRIVERS_EJECUCION_ELEVACIONES_PIRAMIDES: GuiaDriver[] = [
  { nombre: "Flyer", descripcion: "Control del cuerpo, flexibilidad uniforme, piernas extendidas/bloqueadas y pies en punta" },
  { nombre: "Bases/Spotters", descripcion: "Estabilidad de la elevación, postura sólida, pies estacionarios" },
  { nombre: "Transiciones", descripcion: "Subidas, desmontes, control desde una habilidad hacia otra" },
  {
    nombre: "Sincronizacion",
    descripcion:
      "Timing/Precisión, incluyendo inconsistencias en canon. Si el equipo NO realiza al menos 1 habilidad/transición apropiada del nivel con 2+ grupos, se descuenta automáticamente 0.3",
  },
];

export const DRIVERS_EJECUCION_LANZAMIENTOS: GuiaDriver[] = [
  { nombre: "Flyer", descripcion: "Control del cuerpo, ejecución consistente de habilidades/trucos, posición de brazos, piernas extendidas/bloqueadas y pies en punta" },
  { nombre: "Bases/Spotters", descripcion: "Uso de brazos/piernas para lanzar (timing), postura sólida, control, cuna" },
  {
    nombre: "Altura",
    descripcion:
      "Distancia entre los pies de la Flyer y las manos de las Bases. No puede descontarse más de 0.1 (tope especial). Equipos que SOLO realicen 1 lanzamiento pierden automáticamente 0.3 por cada driver con problemas",
  },
];

export const DRIVERS_EJECUCION_GIMNASIA: GuiaDriver[] = [
  { nombre: "Aproximacion", descripcion: "Posición de los brazos hacia la habilidad/pase, braceo/preparación, posición del pecho" },
  { nombre: "Control del Cuerpo", descripcion: "Posición de cabeza, hombros/brazos, caderas, piernas; control entre habilidades; pies en punta" },
  { nombre: "Aterrizajes", descripcion: "Controlados, posición del pecho, pases/habilidades terminadas, giros incompletos" },
  {
    nombre: "Sincronizacion",
    descripcion:
      "Timing/Precisión. Si el equipo NO realiza al menos 1 habilidad/pase sincronizado en grupo (2+ atletas), se descuenta automáticamente 0.3",
  },
];

export const DRIVERS_EJECUCION_SALTOS: GuiaDriver[] = [
  { nombre: "Posicion de los Brazos", descripcion: "Aproximación, movimiento consistente en la entrada/inicio, braceo/preparación" },
  { nombre: "Posicion de las Piernas", descripcion: "Piernas extendidas, pies en punta, rotación de caderas, altura, aterrizajes" },
  {
    nombre: "Sincronizacion",
    descripcion: "Timing/Precisión. No puede descontarse más de 0.1 (tope especial, exclusivo de Saltos)",
  },
];

// Elige el set de drivers sugeridos según el nombre del sub-criterio de
// Ejecución. Heurística por palabras clave porque el backend no tiene un
// catálogo formal para esto (ver nota en CalculadoraValorInicialMenosDrivers).
export function driversSugeridos(nombreSubCriterio: string): GuiaDriver[] {
  const n = nombreSubCriterio.toLowerCase();
  if (n.includes("salto")) return DRIVERS_EJECUCION_SALTOS;
  if (n.includes("lanzamiento")) return DRIVERS_EJECUCION_LANZAMIENTOS;
  if (n.includes("gimnasia")) return DRIVERS_EJECUCION_GIMNASIA;
  return DRIVERS_EJECUCION_ELEVACIONES_PIRAMIDES; // Elevaciones / Pirámides
}

export const NIVELES_DEDUCCION: { valor: 0 | 1 | 2 | 3; etiqueta: string; descripcion: string }[] = [
  { valor: 0, etiqueta: "Sin problema", descripcion: "No hay deducción" },
  { valor: 1, etiqueta: "Menores (−0.1)", descripcion: "Problemas técnicos menores, no solo de 1 atleta" },
  { valor: 2, etiqueta: "Múltiples (−0.2)", descripcion: "El equipo presenta múltiples problemas técnicos" },
  { valor: 3, etiqueta: "Generalizados (−0.3)", descripcion: "El equipo presenta problemas técnicos generalizados" },
];

// Guía de la sección General (todos RANGO_DIRECTO_JUEZ) — el rango real
// [mínimo, máximo] se valida contra TopeSeccionNivel en el backend; esto es
// solo el texto descriptivo de qué observa el juez.
export interface GuiaRango {
  rango: string;
  texto: string;
}

export function guiaGeneral(nombreSubCriterio: string): GuiaRango | null {
  const n = nombreSubCriterio.toLowerCase();
  if (n.includes("formacion")) {
    return {
      rango: "1.0 – 2.0",
      texto:
        "Habilidad del equipo para demostrar con precisión la espacialidad, formaciones y transiciones. Valor inicial 2.0, se reduce 0.1 por cada vez que la espacialidad carezca de precisión.",
    };
  }
  if (n.includes("creatividad")) {
    return {
      rango: "1.5 – 2.0",
      texto:
        "Promedio de 3 jueces (Construcción, Gimnasia, General). Incorporación de ideas innovadoras, visuales e intrincadas durante la rutina.",
    };
  }
  if (n.includes("dance") && n.includes("dificultad")) {
    return {
      rango: "0.5 – 1.0",
      texto: "Elementos visuales, variedad de niveles, cambios de formación, trabajo de pies/suelo/parejas, velocidad/cadencia.",
    };
  }
  if (n.includes("dance") && n.includes("ejecuci")) {
    return {
      rango: "0.5 – 1.0",
      texto: "Técnica, perfección, fuerza/precisión de los movimientos, sincronización.",
    };
  }
  if (n.includes("showmanship")) {
    return {
      rango: "1.0 – 2.0",
      texto:
        "Promedio de 3 jueces. Energía del equipo, entusiasmo genuino, atención del espectador, contacto visual y expresión facial durante toda la rutina. No se basa en habilidades.",
    };
  }
  return null;
}