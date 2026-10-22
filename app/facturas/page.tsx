"use client";

import { useEffect, useMemo, useState } from "react";
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
  Factura,
  FacturaConSaldo,
  Pago,
  anularFactura,
  calcularFacturasConSaldo,
  etiquetaTipoFactura,
  formatCOP,
  formatFecha,
  mensajeError,
  obtenerFacturas,
  obtenerPagos,
  variantEstadoCuenta,
} from "@/app/lib/facturas-pagos";

export default function FacturasPage() {
  const [expandedFacturas, setExpandedFacturas] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [facturaParaPago, setFacturaParaPago] =
    useState<FacturaConSaldo | null>(null);

  const { permissions } = useUser();
  const puedeCrear = permissions.includes("crear_factura");
  const puedeAnular = permissions.includes("anular_factura");
  const [modalNueva, setModalNueva] = useState(false);
  const [facturaAAnular, setFacturaAAnular] = useState<FacturaConSaldo | null>(null);

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
        }
        setCargando(false);
      },
    );
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Facturas con su estado de cuenta real (calculado contra los pagos, ya
  // que Factura no guarda su propio estado de pago).
  const facturasConSaldo = useMemo<FacturaConSaldo[]>(
    () => calcularFacturasConSaldo(facturas, pagos),
    [facturas, pagos],
  );

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

  // Filtrar facturas por término de búsqueda y estado de cuenta
  const filteredFacturas = facturasConSaldo.filter((factura) => {
    const matchesSearch =
      factura.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.persona.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

    if (estadoFiltro) {
      return matchesSearch && factura.estadoCuenta === estadoFiltro;
    }
    return matchesSearch;
  });

  const facturasPendientes = facturasConSaldo.filter(
    (f) => f.saldoPendiente > 0,
  );

  // Cartera en mora: vencidas (10 días después de emitidas) con saldo pendiente.
  const facturasEnMora = facturasConSaldo.filter((f) => f.estadoCuenta === "En mora");
  const totalEnMora = facturasEnMora.reduce((acc, f) => acc + f.saldoPendiente, 0);

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

      {facturasEnMora.length > 0 && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">
                  {facturasEnMora.length} {facturasEnMora.length === 1 ? "factura en mora" : "facturas en mora"} ·{" "}
                  <span className="font-figures">{formatCOP(totalEnMora)}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Vencidas con saldo pendiente (se emiten el primer día hábil y vencen a los 10 días).
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEstadoFiltro("En mora")}>
              Ver solo en mora
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex justify-between mb-4">
          <div className="relative flex items-center w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar facturas…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  {estadoFiltro || "Filtrar por Estado"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEstadoFiltro(null)}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEstadoFiltro("Pagado")}>
                  Pagado
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setEstadoFiltro("Abono parcial")}
                >
                  Abono parcial
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEstadoFiltro("Sin pagos")}>
                  Sin pagos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEstadoFiltro("En mora")}>
                  En mora
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEstadoFiltro("Anulada")}>
                  Anuladas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                  {filteredFacturas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        No se encontraron facturas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFacturas.map((factura) => (
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