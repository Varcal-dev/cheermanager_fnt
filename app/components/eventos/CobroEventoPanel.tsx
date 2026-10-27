"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Receipt, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";

interface GrupoEvento {
  id: number;
  grupoEntrenamientoId: number;
  nombreGrupo: string;
}

interface Linea {
  personaId: number;
  nombre: string;
  grupo: string;
  numeroFactura: string | null;
  motivo: string | null;
}

interface Resultado {
  simulacion: boolean;
  eventoId: number;
  eventoNombre: string;
  montoPorDeportista: number;
  totalACobrar: number;
  valorTotal: number;
  yaCobrados: number;
  cobrados: Linea[];
  omitidos: Linea[];
}

const moneda = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

/**
 * Cobro del evento por lote: genera una factura concepto EVENTO a cada deportista de los
 * grupos inscritos. Primero se pide una vista previa (no crea nada) y luego se confirma.
 * Es seguro repetirlo: el back omite a quien ya tiene un cobro vigente de este evento.
 */
export default function CobroEventoPanel({ eventoId }: { eventoId: number }) {
  const [cargando, setCargando] = useState(true);
  const [grupos, setGrupos] = useState<GrupoEvento[]>([]);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [vista, setVista] = useState<Resultado | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    setCargando(true);
    api
      .get(`/api/grupos-evento/evento/${eventoId}`)
      .then((res) => {
        const data: GrupoEvento[] = res.data;
        setGrupos(data);
        setSeleccionados(data.map((g) => g.grupoEntrenamientoId));
      })
      .catch(() => toast.error("No se pudieron cargar los grupos del evento"))
      .finally(() => setCargando(false));
  }, [eventoId]);

  const alternar = (id: number, marcado: boolean) => {
    setSeleccionados((prev) => (marcado ? [...prev, id] : prev.filter((x) => x !== id)));
    setVista(null); // cambió el alcance: la vista previa ya no vale
  };

  const montoNumero = Number(monto);
  const formularioValido = montoNumero > 0 && seleccionados.length > 0;

  const llamar = async (simular: boolean) => {
    setTrabajando(true);
    try {
      const res = await api.post(`/api/eventos/${eventoId}/cobro-lote`, {
        monto: montoNumero,
        descripcion: descripcion.trim() || undefined,
        fechaVencimiento: vencimiento || undefined,
        grupoIds: seleccionados,
        simular,
      });
      if (simular) {
        setVista(res.data);
        setResultado(null);
      } else {
        setResultado(res.data);
        setVista(null);
        toast.success(`Se generaron ${res.data.totalACobrar} cobros`);
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudo procesar el cobro"));
    } finally {
      setTrabajando(false);
    }
  };

  const confirmar = () => {
    if (!vista) return;
    if (
      !confirm(
        `Se generarán ${vista.totalACobrar} facturas de ${moneda(vista.montoPorDeportista)} ` +
          `(total ${moneda(vista.valorTotal)}). ¿Continuar?`,
      )
    )
      return;
    llamar(false);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
      </div>
    );
  }

  if (grupos.length === 0) {
    return (
      <p className="text-center py-4 text-muted-foreground">
        Inscribe primero los grupos que participan (pestaña Grupos) para poder cobrar el evento.
      </p>
    );
  }

  const mostrado = resultado ?? vista;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Grupos a cobrar</Label>
        <div className="flex flex-wrap gap-4">
          {grupos.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={seleccionados.includes(g.grupoEntrenamientoId)}
                onCheckedChange={(v) => alternar(g.grupoEntrenamientoId, v === true)}
              />
              {g.nombreGrupo}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor={`monto-${eventoId}`}>Valor por deportista (COP)</Label>
          <Input
            id={`monto-${eventoId}`}
            type="number"
            min={0}
            value={monto}
            onChange={(e) => {
              setMonto(e.target.value);
              setVista(null);
            }}
            placeholder="Ej: 80000"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`venc-${eventoId}`}>Vence (opcional)</Label>
          <Input
            id={`venc-${eventoId}`}
            type="date"
            value={vencimiento}
            onChange={(e) => {
              setVencimiento(e.target.value);
              setVista(null);
            }}
          />
          <p className="text-xs text-muted-foreground">Por defecto, 10 días desde hoy.</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`desc-${eventoId}`}>Descripción (opcional)</Label>
          <Input
            id={`desc-${eventoId}`}
            value={descripcion}
            onChange={(e) => {
              setDescripcion(e.target.value);
              setVista(null);
            }}
            placeholder="Por defecto: Evento: <nombre>"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => llamar(true)} disabled={!formularioValido || trabajando}>
          {trabajando && !vista ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          Vista previa
        </Button>
        <Button size="sm" onClick={confirmar} disabled={!vista || vista.totalACobrar === 0 || trabajando}>
          {trabajando && vista ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Receipt className="h-4 w-4 mr-1" />}
          Cobrar{vista ? ` a ${vista.totalACobrar}` : ""}
        </Button>
      </div>

      {mostrado && (
        <div className="space-y-3">
          <p className="text-sm">
            {mostrado.simulacion ? "Vista previa: " : "Listo: "}
            <strong>{mostrado.totalACobrar}</strong> {mostrado.simulacion ? "deportistas a cobrar" : "cobros generados"} ·{" "}
            <strong>{moneda(mostrado.valorTotal)}</strong>
            {mostrado.yaCobrados > 0 && ` · ${mostrado.yaCobrados} ya tenían cobro de este evento`}
          </p>

          {mostrado.cobrados.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deportista</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>{mostrado.simulacion ? "Valor" : "Factura"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mostrado.cobrados.map((l) => (
                  <TableRow key={l.personaId}>
                    <TableCell>{l.nombre}</TableCell>
                    <TableCell>{l.grupo}</TableCell>
                    <TableCell>{mostrado.simulacion ? moneda(mostrado.montoPorDeportista) : l.numeroFactura}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {mostrado.omitidos.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">No se cobra a ({mostrado.omitidos.length})</p>
              <ul className="text-sm text-muted-foreground list-disc pl-5">
                {mostrado.omitidos.map((l) => (
                  <li key={l.personaId}>
                    {l.nombre} ({l.grupo}): {l.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}