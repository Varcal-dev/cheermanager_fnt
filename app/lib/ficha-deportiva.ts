import { api } from "@/lib/api";
import type { Habilidad } from "@/app/lib/habilidades";

export interface Tallas {
  uniforme: string;
  faldaShort: string;
  camiseta: string;
  buzo: string;
  calzado: string;
}

/** Estado editable de la ficha (lo que el formulario manda al guardar). */
export interface FichaForm {
  tieneExperiencia: boolean | null;
  aniosExperiencia: string;
  nivelDeclarado: string;
  habilidadIds: number[];
  tallas: Tallas;
}

export interface FichaVista {
  tieneExperiencia: boolean | null;
  aniosExperiencia: number | null;
  nivelDeclarado: string | null;
  habilidades: Habilidad[];
  nivelSugerido: string | null;
  tallas: Partial<Record<keyof Tallas, string | null>>;
}

export const FICHA_VACIA: FichaForm = {
  tieneExperiencia: null,
  aniosExperiencia: "",
  nivelDeclarado: "",
  habilidadIds: [],
  tallas: { uniforme: "", faldaShort: "", camiseta: "", buzo: "", calzado: "" },
};

export const TALLAS_ROPA = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];
export const TALLAS_NINOS = ["YXS", "YS", "YM", "YL"];

export const CAMPOS_TALLA: { clave: keyof Tallas; etiqueta: string; sugerencias: string[] }[] = [
  { clave: "uniforme", etiqueta: "Uniforme de competencia (top)", sugerencias: [...TALLAS_NINOS, ...TALLAS_ROPA] },
  { clave: "faldaShort", etiqueta: "Falda / short", sugerencias: [...TALLAS_NINOS, ...TALLAS_ROPA] },
  { clave: "camiseta", etiqueta: "Camiseta de entrenamiento", sugerencias: [...TALLAS_NINOS, ...TALLAS_ROPA] },
  { clave: "buzo", etiqueta: "Buzo / chaqueta", sugerencias: [...TALLAS_NINOS, ...TALLAS_ROPA] },
  { clave: "calzado", etiqueta: "Calzado (talla)", sugerencias: [] },
];

export const vistaAForm = (v: FichaVista): FichaForm => ({
  tieneExperiencia: v.tieneExperiencia,
  aniosExperiencia: v.aniosExperiencia === null ? "" : String(v.aniosExperiencia),
  nivelDeclarado: v.nivelDeclarado ?? "",
  habilidadIds: v.habilidades.map((h) => h.id),
  tallas: {
    uniforme: v.tallas.uniforme ?? "",
    faldaShort: v.tallas.faldaShort ?? "",
    camiseta: v.tallas.camiseta ?? "",
    buzo: v.tallas.buzo ?? "",
    calzado: v.tallas.calzado ?? "",
  },
});

const cuerpo = (f: FichaForm) => ({
  tieneExperiencia: f.tieneExperiencia,
  aniosExperiencia: f.tieneExperiencia && f.aniosExperiencia !== "" ? Number(f.aniosExperiencia) : null,
  nivelDeclarado: f.tieneExperiencia && f.nivelDeclarado ? f.nivelDeclarado : null,
  habilidadIds: f.tieneExperiencia ? f.habilidadIds : [],
  tallas: f.tallas,
});

export const catalogoFicha = () => api.get<Habilidad[]>("/api/deportistas/ficha/habilidades").then((r) => r.data);
export const obtenerFicha = (deportistaId: number) =>
  api.get<FichaVista>(`/api/deportistas/${deportistaId}/ficha`).then((r) => r.data);
export const guardarFicha = (deportistaId: number, f: FichaForm) =>
  api.put<FichaVista>(`/api/deportistas/${deportistaId}/ficha`, cuerpo(f)).then((r) => r.data);
