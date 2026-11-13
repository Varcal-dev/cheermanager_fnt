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
import { TablaResponsiva } from "@/app/components/TablaResponsiva";
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
import AnularDialog from "@/app/components/Forms/AnularDialog";
import RecordatoriosMoraCard from "@/app/components/pagos/RecordatoriosMoraCard";
import { useUser } from "@/context/UserContext";
import {
  Factura,
  FacturaConSaldo,
  Pago,
  ResumenGeneracionCobros,
  calcularFacturasConSaldo,
  anularPago,
  cambiarEstadoPago,
  formatCOP,
  generarCobrosMensualidad,
  mensajeError,
  obtenerFacturas,
  obtenerPagos,
} from "@/app/lib/facturas-pagos";

export default function PagosPage() {
  const { permissions } = useUser();
  const puedeRecordar = permissions.includes("gestionar_recordatorios_mora");
  const puedeAnularPago = permissions.includes("anular_pago");
  const [pagoAAnular, setPagoAAnular] = useState<Pago | null>(null);
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

  // Los pagos no se borran: se anulan con motivo (queda fecha y usuario).
  const confirmarAnulacionPago = async (motivo: string) => {
    if (!pagoAAnular) return;
    try {
      await anularPago(pagoAAnular.id, motivo);
      toast.success(`Pago de la factura ${pagoAAnular.numeroFactura} anulado`);
      cargarDatos();
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo anular el pago"));
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight sm:text-3xl">Pagos</h1>
          <p className="text-muted-foreground">
            Registra pagos y consulta el saldo pendiente de cada factura
          </p>
        </div>
        <Button onClick={abrirModalGeneral} className="max-sm:w-full max-sm:min-h-11">
          <Plus className="mr-2 h-4 w-4" /> Registrar pago
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="lane-accent text-success">
          <CardHeader className="pb-2 pl-5">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recaudado (pagos en estado Pagado)
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-5">
            <p className="text-2xl font-display font-bold font-figures text-foreground">
              {formatCOP(totalRecaudado)}
            </p>
          </CardContent>
        </Card>
        <Card className="lane-accent text-destructive">
          <CardHeader className="pb-2 pl-5">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cartera pendiente ({facturasPendientes.length} facturas)
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-5">
            <p className="text-2xl font-display font-bold font-figures text-foreground">
              {formatCOP(totalPendiente)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display flex items-center gap-2">
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
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Período</label>
              <Input
                type="month"
                value={periodoAFacturar}
                onChange={(e) => setPeriodoAFacturar(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <Button onClick={handleGenerarCobros} disabled={generandoCobros} className="max-sm:w-full max-sm:min-h-11">
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

      {puedeRecordar && <RecordatoriosMoraCard />}

      <div className="relative flex w-full max-w-sm items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número de factura o deportista…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 pl-9 md:h-9"
        />
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
              <CardTitle className="font-display">Facturas con saldo pendiente</CardTitle>
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
                <TablaResponsiva
                  className="p-3 md:p-0"
                  filas={facturasPendientesFiltradas}
                  getKey={(f) => f.id}
                  columnas={[
                    { clave: "num", titulo: "Factura", movil: "titulo", celda: (f) => <span className="font-medium">{f.numeroFactura}</span> },
                    { clave: "per", titulo: "Deportista / Persona", movil: "titulo", celda: (f) => `${f.persona.nombre} ${f.persona.apellidos}` },
                    { clave: "tot", titulo: "Total", celda: (f) => <span className="font-figures">{formatCOP(f.total)}</span> },
                    { clave: "pag", titulo: "Pagado", celda: (f) => <span className="font-figures text-success">{formatCOP(f.totalPagado)}</span> },
                    {
                      clave: "sal",
                      titulo: "Saldo",
                      movil: "destacado",
                      celda: (f) => <span className="font-semibold font-figures text-destructive">{formatCOP(f.saldoPendiente)}</span>,
                    },
                    {
                      clave: "est",
                      titulo: "Estado",
                      movil: "destacado",
                      celda: (f) => (
                        <Badge variant={f.estadoCuenta === "Abono parcial" ? "outline" : "destructive"}>{f.estadoCuenta}</Badge>
                      ),
                    },
                    {
                      clave: "acc",
                      titulo: "Acciones",
                      movil: "acciones",
                      celda: (f) => (
                        <Button size="sm" onClick={() => abrirModalParaFactura(f)} className="max-md:flex-1">
                          <CreditCard className="h-4 w-4 mr-1" /> Registrar pago
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Historial de pagos</CardTitle>
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
                <TablaResponsiva
                  className="p-3 md:p-0"
                  filas={pagosFiltrados}
                  getKey={(p) => p.id}
                  columnas={[
                    { clave: "fac", titulo: "Factura", movil: "titulo", celda: (p) => <span className="font-medium">{p.numeroFactura}</span> },
                    { clave: "fec", titulo: "Fecha", movil: "titulo", celda: (p) => new Date(p.fecha).toLocaleDateString() },
                    { clave: "mon", titulo: "Monto", movil: "destacado", celda: (p) => <span className="font-figures">{formatCOP(p.monto)}</span> },
                    { clave: "tip", titulo: "Tipo", celda: (p) => p.tipoPago },
                    { clave: "met", titulo: "Método", celda: (p) => p.metodoPago },
                    {
                      clave: "est",
                      titulo: "Estado",
                      movil: "destacado",
                      celda: (p) => (
                        <Badge variant={p.estado === "Pagado" ? "success" : p.estado === "Pendiente" ? "outline" : "destructive"}>
                          {p.estado}
                        </Badge>
                      ),
                    },
                    {
                      clave: "sal",
                      titulo: "Saldo restante",
                      celda: (p) => <span className="font-figures">{formatCOP(p.saldoPendienteFactura)}</span>,
                    },
                    {
                      clave: "acc",
                      titulo: "Acciones",
                      movil: "acciones",
                      celda: (p) => (
                        <div className="flex flex-wrap gap-2 max-md:contents">
                          {p.estado !== "Pagado" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="max-md:flex-1"
                              disabled={actualizandoId === p.id}
                              onClick={() => marcarComoPagado(p)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar pagado
                            </Button>
                          )}
                          {puedeAnularPago && p.estado !== "Anulado" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="max-md:flex-1"
                              title="Anular pago"
                              disabled={actualizandoId === p.id}
                              onClick={() => setPagoAAnular(p)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Anular
                            </Button>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AnularDialog
        open={pagoAAnular !== null}
        onOpenChange={(abierto) => !abierto && setPagoAAnular(null)}
        titulo={`Anular pago de ${pagoAAnular?.numeroFactura ?? ""}`}
        descripcion="El pago no se borra: queda anulado con su motivo, fecha y usuario, y su valor vuelve al saldo de la factura."
        onConfirmar={confirmarAnulacionPago}
      />

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