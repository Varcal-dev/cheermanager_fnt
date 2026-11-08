import { api } from "@/lib/api";

export interface Carnet {
  deportistaId: number;
  codigo: string;
  nombre: string;
  club: string;
  estado: string;
  vigente: boolean;
  grupos: string[];
  foto: string | null;
}

export const obtenerCarnet = (deportistaId: number) =>
  api.get<Carnet>(`/api/carnet/deportista/${deportistaId}`).then((r) => r.data);
export const verificarCarnet = (codigo: string) =>
  api.get<Carnet>("/api/carnet/verificar", { params: { codigo } }).then((r) => r.data);
