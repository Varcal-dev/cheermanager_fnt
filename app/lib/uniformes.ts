import { api } from "@/lib/api";

export interface FilaTallas {
  deportistaId: number;
  personaId: number;
  nombre: string;
  uniforme: string | null;
  faldaShort: string | null;
  camiseta: string | null;
  buzo: string | null;
  calzado: string | null;
  completa: boolean;
}

export interface ResumenTallas {
  grupoId: number;
  grupo: string;
  filas: FilaTallas[];
  conteo: Record<string, Record<string, number>>;
  sinTallaUniforme: number;
}

export interface Pedido {
  id: number;
  nombre: string;
  grupoId: number;
  grupo: string;
  valorPorDeportista: number;
  numeroCuotas: number;
  primerVencimiento: string;
  fechaCreacion: string;
  deportistasFacturados: number;
}

export interface LineaFacturacion {
  personaId: number;
  nombre: string;
  facturas: string[];
  motivo: string | null;
}

export interface ResultadoFacturacion {
  simulacion: boolean;
  pedidoId: number;
  nombre: string;
  valorPorDeportista: number;
  cuotas: number;
  facturados: LineaFacturacion[];
  omitidos: LineaFacturacion[];
  totalFacturado: number;
  sinTallaUniforme: number;
}

export const PRENDAS: { clave: keyof Omit<FilaTallas, "deportistaId" | "personaId" | "nombre" | "completa">; etiqueta: string }[] = [
  { clave: "uniforme", etiqueta: "Uniforme (top)" },
  { clave: "faldaShort", etiqueta: "Falda / short" },
  { clave: "camiseta", etiqueta: "Camiseta" },
  { clave: "buzo", etiqueta: "Buzo / chaqueta" },
  { clave: "calzado", etiqueta: "Calzado" },
];

export const tallasDeGrupo = (grupoId: number) =>
  api.get<ResumenTallas>(`/api/uniformes/tallas-grupo/${grupoId}`).then((r) => r.data);
export const listarPedidos = () => api.get<Pedido[]>("/api/uniformes/pedidos").then((r) => r.data);
export const crearPedido = (body: {
  nombre: string;
  grupoId: number;
  valorPorDeportista: number;
  numeroCuotas: number;
  primerVencimiento?: string;
}) => api.post<Pedido>("/api/uniformes/pedidos", body).then((r) => r.data);
export const facturarPedido = (id: number, simular: boolean) =>
  api.post<ResultadoFacturacion>(`/api/uniformes/pedidos/${id}/facturar`, null, { params: { simular } }).then((r) => r.data);

/** CSV de tallas del grupo (separador ; y BOM para que Excel lo abra con tildes). */
export const tallasACsv = (r: ResumenTallas) => {
  const cab = ["Nombre", ...PRENDAS.map((p) => p.etiqueta)];
  const filas = r.filas.map((f) => [f.nombre, ...PRENDAS.map((p) => f[p.clave] ?? "")]);
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return "﻿" + [cab, ...filas].map((l) => l.map(esc).join(";")).join("\r\n");
};
