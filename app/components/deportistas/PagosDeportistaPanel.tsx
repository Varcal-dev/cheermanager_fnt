"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pago,
  formatCOP,
  formatFecha,
  mensajeError,
  obtenerPagosPorPersona,
} from "@/app/lib/facturas-pagos";

/** Pagos reales de la persona (antes esta pestaña mostraba datos de ejemplo). Solo lectura. */
export default function PagosDeportistaPanel({ personaId }: { personaId: number }) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    obtenerPagosPorPersona(personaId)
      .then((data) => vigente && setPagos(data))
      .catch((error) =>
        toast.error(mensajeError(error, "No se pudieron cargar los pagos del deportista")),
      )
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [personaId]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Pagos</h4>
        <Link href="/pagos" className="text-sm text-accent hover:underline">
          Ir a Pagos para registrar o anular
        </Link>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : pagos.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">No hay pagos registrados</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo / Método</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.map((pago) => (
              <TableRow key={pago.id}>
                <TableCell>{pago.numeroFactura}</TableCell>
                <TableCell>{formatFecha(pago.fecha)}</TableCell>
                <TableCell>
                  {pago.tipoPago} · {pago.metodoPago}
                </TableCell>
                <TableCell className="font-figures">{formatCOP(pago.monto)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      pago.estado === "Pagado"
                        ? "success"
                        : pago.estado === "Anulado"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {pago.estado}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
