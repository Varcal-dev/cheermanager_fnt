"use client";

import { api } from "@/lib/api";

export type TipoAutorizacion = "TRATAMIENTO_DATOS" | "DATOS_SALUD" | "IMAGEN";

export interface AutorizacionItem {
  deportistaId: number;
  nombre: string;
  menor: boolean;
  puedeFirmar: boolean;
  motivoNoPuede: string | null;
  version: string;
  tipos: { tipo: TipoAutorizacion; vigente: boolean }[];
}

export async function portalAutorizaciones(): Promise<AutorizacionItem[]> {
  const { data } = await api.get("/api/portal/autorizaciones");
  return data ?? [];
}

export async function portalFirmarAutorizaciones(
  deportistaId: number,
  firma: { tratamiento: boolean; salud: boolean; imagen: boolean },
): Promise<AutorizacionItem> {
  const { data } = await api.post(`/api/portal/deportistas/${deportistaId}/autorizaciones`, firma);
  return data;
}
