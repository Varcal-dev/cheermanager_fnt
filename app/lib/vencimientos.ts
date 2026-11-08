import { api } from "@/lib/api";

export type TipoDocumento = "CERTIFICADO_MEDICO" | "EPS" | "SEGURO" | "LICENCIA";
export type EstadoDocumento = "VENCIDO" | "POR_VENCER" | "SIN_REGISTRO" | "VIGENTE";

export interface AlertaDocumento {
  deportistaId: number;
  personaId: number;
  nombre: string;
  tipo: TipoDocumento;
  estado: EstadoDocumento;
  fechaVencimiento: string | null;
  diasRestantes: number | null;
  entidad: string | null;
}

export interface AlertasDocumentos {
  vencidos: number;
  porVencer: number;
  sinRegistro: number;
  items: AlertaDocumento[];
}

export const TIPOS_DOCUMENTO: { valor: TipoDocumento; etiqueta: string; venceSiempre: boolean }[] = [
  { valor: "CERTIFICADO_MEDICO", etiqueta: "Certificado médico", venceSiempre: true },
  { valor: "EPS", etiqueta: "EPS", venceSiempre: false },
  { valor: "SEGURO", etiqueta: "Seguro", venceSiempre: false },
  { valor: "LICENCIA", etiqueta: "Licencia de federación", venceSiempre: true },
];

export const etiquetaDocumento = (t: TipoDocumento) => TIPOS_DOCUMENTO.find((x) => x.valor === t)?.etiqueta ?? t;

export const listarAlertas = (dias: number, todos: boolean) =>
  api.get<AlertasDocumentos>("/api/documentos-deportista/alertas", { params: { dias, todos } }).then((r) => r.data);

export const registrarDocumento = (
  deportistaId: number,
  body: {
    tipo: TipoDocumento;
    entidad?: string;
    numero?: string;
    fechaEmision?: string;
    fechaVencimiento?: string;
    observaciones?: string;
  },
) => api.post(`/api/documentos-deportista/deportista/${deportistaId}`, body).then((r) => r.data);
