"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  FileText,
  CreditCard,
  Loader2,
  Ban,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import React from "react";
import RegistrarPagoModal from "@/app/components/Forms/RegistrarPagoModal";
import NuevaFacturaModal from "@/app/components/Forms/NuevaFacturaModal";
import AnularDialog from "@/app/components/Forms/AnularDialog";
import { useUser } from "@/context/UserContext";
import {
  FacturaConSaldo,
  ResumenCartera,
  anularFactura,
  calcularUnaFacturaConSaldo,
  etiquetaTipoFactura,
  formatCOP,
  formatFecha,
  mensajeError,
  obtenerFacturasPagina,
  obtenerResumenCartera,
  variantEstadoCuenta,
} from "@/app/lib/facturas-pagos";

const TAMANO_PAGINA = 20;

// Etiqueta que se muestra -> código que entiende el servidor.
const ESTADOS: { etiqueta: string; codigo: string }[] = [
  { etiqueta: "Todos", codigo: "TODOS" },
  { etiqueta: "Pagado", codigo: "PAGADA" },
  { etiqueta: "Abono parcial", codigo: "ABONO_PARCIAL" },
  { etiqueta: "Sin pagos", codigo: "PENDIENTE" },
  { etiqueta: "En mora", codigo: "EN_MORA" },
  { etiqueta: "Anuladas", codigo: "ANULADA" },
];

const CONCEPTOS: { etiqueta: string; codigo: string }[] = [
  { etiqueta: "Todos los conceptos", codigo: "TODOS" },
  { etiqueta: "Inscripción", codigo: "INSCRIPCION" },
  { etiqueta: "Mensualidad", codigo: "MENSUALIDAD" },
  { etiqueta: "Uniforme", codigo: "UNIFORME" },
  { etiqueta: "Competencia", codigo: "COMPETENCIA" },
  { etiqueta: "Evento", codigo: "EVENTO" },
  { etiqueta: "Tienda", codigo: "TIENDA" },
  { etiqueta: "Otro", codigo: "OTRO" },
];

export default function FacturasPage() {
  const [expandedFacturas, setExpandedFacturas] = useState<number[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState(""); // búsqueda ya "asentada" (con retraso al escribir)
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
  const [conceptoFiltro, setConceptoFiltro] = useState("TODOS");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(true);

  const [facturasConSaldo, setFacturasConSaldo] = useState<FacturaConSaldo[]>([]);
  const [totalElementos, setTotalElementos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [resumen, setResumen] = useState<ResumenCartera | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [facturaParaPago, setFacturaParaPago] =
    useState<FacturaConSaldo | null>(null);

  const { permissions } = useUser();
  const puedeCrear = permissions.includes("crear_factura");
  const puedeAnular = permissions.includes("anular_factura");
  const [modalNueva, setModalNueva] = useState(false);
  const [facturaAAnular, setFacturaAAnular] = useState<FacturaConSaldo | null>(null);

  // Espera 400 ms después de la última tecla antes de consultar al servidor.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(busqueda.trim());
      setPagina(0);
    }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const cargarDatos = useCallback(() => {
    setCargando(true);
    obtenerFacturasPagina({
      q,
      estado: estadoFiltro,
      concepto: conceptoFiltro,
      desde,
      hasta,
      pagina,
      tamano: TAMANO_PAGINA,
    })
      .then((res) => {
        setFacturasConSaldo(
          res.contenido.map((f) => calcularUnaFacturaConSaldo(f, [])),
        );
        setTotalElementos(res.totalElementos);
        setTotalPaginas(res.totalPaginas);
      })
      .catch((error) =>
        toast.error(mensajeError(error, "No se pudieron cargar las facturas")),
      )
      .finally(() => setCargando(false));

    // Totales de mora: no dependen de la página ni de los filtros.
    obtenerResumenCartera()
      .then(setResumen)
      .catch(() => setResumen(null));
  }, [q, estadoFiltro, conceptoFiltro, desde, hasta, pagina]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const cambiarFiltro = (fn: () => void) => {
    fn();
    setPagina(0);
  };

  const hayFiltros =
    busqueda !== "" ||
    estadoFiltro !== "TODOS" ||
    conceptoFiltro !== "TODOS" ||
    desde !== "" ||
    hasta !== "";

  const limpiarFiltros = () => {
    setBusqueda("");
    setQ("");
    setEstadoFiltro("TODOS");
    setConceptoFiltro("TODOS");
    setDesde("");
    setHasta("");
    setPagina(0);
  };

  const toggleFacturaExpand = (facturaId: number) => {
    setExpandedFacturas((prev) =>
      prev.includes(facturaId)
        ? prev.filter((id) => id !== facturaId)
        : [...prev, facturaId],
    );
  };

  const abrirModalParaFactura = (factura: FacturaConSaldo) => {
    setFacturaParaPago(factura);
    setModalAbierto(true);
  };

  // Facturas de esta página con saldo: son las que se pueden elegir en el modal de pago.
  const facturasPendientes = facturasConSaldo.filter((f) => f.saldoPendiente > 0);

  const confirmarAnulacion = async (motivo: string) => {
    if (!facturaAAnular) return;
    try {
      await anularFactura(facturaAAnular.id, motivo);
      toast.success(`Factura ${facturaAAnular.numeroFactura} anulada`);
      cargarDatos();
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo anular la factura"));
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Facturas y Pagos
          </h1>
          <p className="text-muted-foreground">
            Gestiona las facturas y pagos de los deportistas
          </p>
        </div>
        {puedeCrear && (
          <Button
            onClick={() => setModalNueva(true)}
            title="Cobros de uniforme, competencia, evento u otros. La inscripción y la mensualidad se facturan solas."
          >
            <Plus className="mr-2 h-4 w-4" /> Nuevo cobro
          </Button>
        )}
      </div>

      {resumen && resumen.facturasEnMora > 0 && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">
                  {resumen?.facturasEnMora} {resumen?.facturasEnMora === 1 ? "factura en mora" : "facturas en mora"} ·{" "}
                  <span className="font-figures">{formatCOP(resumen?.totalEnMora ?? 0)}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Vencidas con saldo pendiente (se emiten el primer día hábil y vencen a los 10 días).
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => cambiarFiltro(() => setEstadoFiltro("EN_MORA"))}>
              Ver solo en mora
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex items-center w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, nombre o descripción…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {ESTADOS.find((e) => e.codigo === estadoFiltro)?.etiqueta ?? "Estado"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ESTADOS.map((e) => (
                <DropdownMenuItem
                  key={e.codigo}
                  onClick={() => cambiarFiltro(() => setEstadoFiltro(e.codigo))}
                >
                  {e.etiqueta}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {CONCEPTOS.find((c) => c.codigo === conceptoFiltro)?.etiqueta ?? "Concepto"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {CONCEPTOS.map((c) => (
                <DropdownMenuItem
                  key={c.codigo}
                  onClick={() => cambiarFiltro(() => setConceptoFiltro(c.codigo))}
                >
                  {c.etiqueta}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Emitidas</span>
            <Input
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => cambiarFiltro(() => setDesde(e.target.value))}
              className="h-9 w-[9.5rem]"
              aria-label="Emitidas desde"
            />
            <span>a</span>
            <Input
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => cambiarFiltro(() => setHasta(e.target.value))}
              className="h-9 w-[9.5rem]"
              aria-label="Emitidas hasta"
            />
          </div>
          {hayFiltros && (
            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          )}
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando
            facturas…
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                      Número
                    </TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                      Emisión / Vence
                    </TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                      Cliente
                    </TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                      Descripción
                    </TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                      Total
                    </TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                      Estado
                    </TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasConSaldo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        No se encontraron facturas
                      </TableCell>
                    </TableRow>
                  ) : (
                    facturasConSaldo.map((factura) => (
                      <React.Fragment key={factura.id}>
                        <TableRow>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFacturaExpand(factura.id)}
                            >
                              {expandedFacturas.includes(factura.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {factura.numeroFactura}
                          </TableCell>
                          <TableCell>
                            <div>{formatFecha(factura.fechaEmision)}</div>
                            <div className="text-xs text-muted-foreground">
                              vence {formatFecha(factura.fechaVencimiento)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {factura.persona.nombre} {factura.persona.apellidos}
                          </TableCell>
                          <TableCell>
                            <div>{factura.descripcion}</div>
                            <div className="text-xs text-muted-foreground">
                              {etiquetaTipoFactura(factura)}
                            </div>
                          </TableCell>
                          <TableCell className="font-figures">{formatCOP(factura.total)}</TableCell>
                          <TableCell>
                            <Badge variant={variantEstadoCuenta(factura.estadoCuenta)}>
                              {factura.estadoCuenta}
                            </Badge>
                            {factura.estadoCuenta === "En mora" && factura.diasMora != null && (
                              <div className="mt-1 text-xs text-destructive">
                                {factura.diasMora} {factura.diasMora === 1 ? "día" : "días"} de mora
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {factura.saldoPendiente > 0 && (
                                <Button
                                  size="sm"
                                  onClick={() => abrirModalParaFactura(factura)}
                                >
                                  <CreditCard className="h-4 w-4 mr-1" /> Registrar
                                  Pago
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <FileText className="h-4 w-4 mr-1" /> Detalle
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => toggleFacturaExpand(factura.id)}
                                  >
                                    Ver desglose
                                  </DropdownMenuItem>
                                  {puedeAnular && factura.estadoCuenta !== "Anulada" && (
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => setFacturaAAnular(factura)}
                                    >
                                      <Ban className="mr-2 h-4 w-4" /> Anular factura
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedFacturas.includes(factura.id) && (
                          <TableRow
                            key={`${factura.id}-details`}
                            className="bg-muted/50"
                          >
                            <TableCell colSpan={8} className="p-0">
                              <div className="p-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-display font-semibold mb-2">
                                      Detalles de la Factura
                                    </h4>
                                    <div className="space-y-2">
                                      {factura.descuento ? (
                                        <>
                                          <div className="grid grid-cols-2">
                                            <span className="text-muted-foreground">
                                              Descuento aplicado:
                                            </span>
                                            <span className="font-figures">
                                              {factura.descuento.nombre} (
                                              {factura.descuento.porcentaje}%)
                                            </span>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="grid grid-cols-2">
                                          <span className="text-muted-foreground">
                                            Descuento de convenio:
                                          </span>
                                          <span className="text-muted-foreground">
                                            Ninguno registrado (si el plan
                                            tenía descuento, ya está aplicado
                                            en el total)
                                          </span>
                                        </div>
                                      )}
                                      {factura.estadoCuenta === "Anulada" && (
                                        <div className="grid grid-cols-2">
                                          <span className="text-muted-foreground">
                                            Motivo de anulación:
                                          </span>
                                          <span>{factura.motivoAnulacion ?? "—"}</span>
                                        </div>
                                      )}
                                      <div className="grid grid-cols-2">
                                        <span className="text-muted-foreground">
                                          Total:
                                        </span>
                                        <span className="font-bold font-figures">
                                          {formatCOP(factura.total)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-display font-semibold mb-2">
                                      Información de Pago
                                    </h4>
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-2">
                                        <span className="text-muted-foreground">
                                          Pagado:
                                        </span>
                                        <span className="font-figures text-success">
                                          {formatCOP(factura.totalPagado)}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2">
                                        <span className="text-muted-foreground">
                                          Saldo pendiente:
                                        </span>
                                        <span
                                          className={`font-bold font-figures ${
                                            factura.saldoPendiente > 0
                                              ? "text-destructive"
                                              : ""
                                          }`}
                                        >
                                          {formatCOP(factura.saldoPendiente)}
                                        </span>
                                      </div>
                                      {factura.saldoPendiente > 0 && (
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            abrirModalParaFactura(factura)
                                          }
                                        >
                                          <CreditCard className="h-4 w-4 mr-1" />{" "}
                                          Registrar Pago
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {totalElementos > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-sm text-muted-foreground">
            <span>
              Mostrando {pagina * TAMANO_PAGINA + 1}–
              {Math.min((pagina + 1) * TAMANO_PAGINA, totalElementos)} de {totalElementos}{" "}
              {totalElementos === 1 ? "factura" : "facturas"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagina === 0 || cargando}
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              <span>
                Página {pagina + 1} de {Math.max(totalPaginas, 1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagina + 1 >= totalPaginas || cargando}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <RegistrarPagoModal
        open={modalAbierto}
        onOpenChange={setModalAbierto}
        facturas={facturasPendientes}
        facturaPreseleccionada={facturaParaPago}
        onPagoRegistrado={cargarDatos}
      />

      <NuevaFacturaModal
        open={modalNueva}
        onOpenChange={setModalNueva}
        onCreada={cargarDatos}
      />

      <AnularDialog
        open={facturaAAnular !== null}
        onOpenChange={(abierto) => !abierto && setFacturaAAnular(null)}
        titulo={`Anular factura ${facturaAAnular?.numeroFactura ?? ""}`}
        descripcion="La factura no se borra: queda anulada con su motivo, fecha y usuario, y deja de contar en la cartera. Si tiene pagos confirmados, anula primero esos pagos."
        onConfirmar={confirmarAnulacion}
      />
    </div>
  );
}