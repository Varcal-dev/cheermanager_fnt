"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  CreditCard,
  Trash2,
  CheckCircle2,
  Loader2,
  CalendarClock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import RegistrarPagoModal from "@/app/components/Forms/RegistrarPagoModal";
import {
  Factura,
  FacturaConSaldo,
  Pago,
  ResumenGeneracionCobros,
  calcularFacturasConSaldo,
  cambiarEstadoPago,
  eliminarPago,
  formatCOP,
  generarCobrosMensualidad,
  mensajeError,
  obtenerFacturas,
  obtenerPagos,
} from "@/app/lib/facturas-pagos";

export default function PagosPage() {
  const [cargando, setCargando] = useState(true);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [facturaParaPago, setFacturaParaPago] =
    useState<FacturaConSaldo | null>(null);

  const [actualizandoId, setActualizandoId] = useState<number | null>(null);

  // Generación de cobros de mensualidad del mes.
  const [periodoAFacturar, setPeriodoAFacturar] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [generandoCobros, setGenerandoCobros] = useState(false);
  const [resumenCobros, setResumenCobros] =
    useState<ResumenGeneracionCobros | null>(null);

  const handleGenerarCobros = async () => {
    setGenerandoCobros(true);
    setResumenCobros(null);
    try {
      const resumen = await generarCobrosMensualidad(periodoAFacturar);
      setResumenCobros(resumen);
      if (resumen.facturasGeneradas > 0) {
        toast.success(
          `Se generaron ${resumen.facturasGeneradas} facturas de mensualidad para ${resumen.periodo}`,
        );
        cargarDatos();
      } else {
        toast.info(
          `No había nada pendiente por facturar para ${resumen.periodo}`,
        );
      }
    } catch (error) {
      toast.error(
        mensajeError(error, "No se pudieron generar los cobros de mensualidad"),
      );
    } finally {
      setGenerandoCobros(false);
    }
  };

  const cargarDatos = () => {
    setCargando(true);
    Promise.allSettled([obtenerFacturas(), obtenerPagos()]).then(
      ([resFacturas, resPagos]) => {
        if (resFacturas.status === "fulfilled") {
          setFacturas(resFacturas.value);
        } else {
          toast.error("No se pudieron cargar las facturas");
        }

        if (resPagos.status === "fulfilled") {
          setPagos(resPagos.value);
        } else {
          toast.error("No se pudieron cargar los pagos");
        }

        setCargando(false);
      },
    );
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const facturasConSaldo = useMemo(
    () => calcularFacturasConSaldo(facturas, pagos),
    [facturas, pagos],
  );

  const facturasPendientes = useMemo(
    () => facturasConSaldo.filter((f) => f.saldoPendiente > 0),
    [facturasConSaldo],
  );

  const facturasPendientesFiltradas = facturasPendientes.filter((f) => {
    const texto =
      `${f.numeroFactura} ${f.persona.nombre} ${f.persona.apellidos}`.toLowerCase();
    return texto.includes(searchTerm.toLowerCase());
  });

  const pagosFiltrados = pagos
    .filter((p) => p.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  const totalRecaudado = pagos
    .filter((p) => p.estado === "Pagado")
    .reduce((acc, p) => acc + p.monto, 0);

  const totalPendiente = facturasPendientes.reduce(
    (acc, f) => acc + f.saldoPendiente,
    0,
  );

  const abrirModalParaFactura = (factura: FacturaConSaldo) => {
    setFacturaParaPago(factura);
    setModalAbierto(true);
  };

  const abrirModalGeneral = () => {
    setFacturaParaPago(null);
    setModalAbierto(true);
  };

  const marcarComoPagado = async (pago: Pago) => {
    setActualizandoId(pago.id);
    try {
      await cambiarEstadoPago(pago.id, "Pagado");
      toast.success(
        `Pago de la factura ${pago.numeroFactura} marcado como Pagado`,
      );
      cargarDatos();
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo actualizar el pago"));
    } finally {
      setActualizandoId(null);
    }
  };

  const borrarPago = async (pago: Pago) => {
    if (
      !confirm(
        `¿Eliminar el pago de ${formatCOP(pago.monto)} de la factura ${pago.numeroFactura}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setActualizandoId(pago.id);
    try {
      await eliminarPago(pago.id);
      toast.success("Pago eliminado");
      cargarDatos();
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo eliminar el pago"));
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
          <p className="text-muted-foreground">
            Registra pagos y consulta el saldo pendiente de cada factura
          </p>
        </div>
        <Button onClick={abrirModalGeneral}>
          <Plus className="mr-2 h-4 w-4" /> Registrar pago
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recaudado (pagos en estado Pagado)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCOP(totalRecaudado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cartera pendiente ({facturasPendientes.length} facturas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCOP(totalPendiente)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Generar cobros de mensualidad
          </CardTitle>
          <CardDescription>
            Crea la factura del mes indicado para todas las inscripciones
            activas con plan de mensualidad. Si una inscripción ya tiene
            factura para ese mes, se salta — no duplica cobros aunque lo
            corras varias veces.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Período</label>
              <Input
                type="month"
                value={periodoAFacturar}
                onChange={(e) => setPeriodoAFacturar(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <Button onClick={handleGenerarCobros} disabled={generandoCobros}>
              {generandoCobros ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando…
                </>
              ) : (
                "Generar cobros de este período"
              )}
            </Button>
          </div>

          {resumenCobros && (
            <div className="text-sm rounded-md border p-3 bg-muted/30">
              <p>
                Período <strong>{resumenCobros.periodo}</strong>:{" "}
                <strong>{resumenCobros.facturasGeneradas}</strong> facturas
                nuevas,{" "}
                <strong>{resumenCobros.yaFacturadas}</strong> ya existían.
              </p>
              {resumenCobros.errores.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-destructive">
                  {resumenCobros.errores.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center space-x-2 max-w-sm">
        <Input
          placeholder="Buscar por número de factura o deportista…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando datos
          financieros…
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Facturas con saldo pendiente</CardTitle>
              <CardDescription>
                Total de la factura menos los pagos ya registrados, calculado
                en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {facturasPendientesFiltradas.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No hay facturas con saldo pendiente
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factura</TableHead>
                      <TableHead>Deportista / Persona</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Pagado</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasPendientesFiltradas.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">
                          {f.numeroFactura}
                        </TableCell>
                        <TableCell>
                          {f.persona.nombre} {f.persona.apellidos}
                        </TableCell>
                        <TableCell>{formatCOP(f.total)}</TableCell>
                        <TableCell>{formatCOP(f.totalPagado)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCOP(f.saldoPendiente)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              f.estadoCuenta === "Abono parcial"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {f.estadoCuenta}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => abrirModalParaFactura(f)}>
                            <CreditCard className="h-4 w-4 mr-1" /> Registrar
                            pago
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de pagos</CardTitle>
              <CardDescription>
                Todos los pagos registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pagosFiltrados.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No hay pagos registrados todavía
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factura</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Saldo restante</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagosFiltrados.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.numeroFactura}
                        </TableCell>
                        <TableCell>
                          {new Date(p.fecha).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{formatCOP(p.monto)}</TableCell>
                        <TableCell>{p.tipoPago}</TableCell>
                        <TableCell>{p.metodoPago}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.estado === "Pagado"
                                ? "default"
                                : p.estado === "Pendiente"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {p.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCOP(p.saldoPendienteFactura)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {p.estado !== "Pagado" && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actualizandoId === p.id}
                                onClick={() => marcarComoPagado(p)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />{" "}
                                Marcar pagado
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actualizandoId === p.id}
                              onClick={() => borrarPago(p)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <RegistrarPagoModal
        open={modalAbierto}
        onOpenChange={setModalAbierto}
        facturas={facturasPendientes}
        facturaPreseleccionada={facturaParaPago}
        onPagoRegistrado={cargarDatos}
      />
    </div>
  );
}