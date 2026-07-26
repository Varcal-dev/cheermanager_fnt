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
import {
  Factura,
  FacturaConSaldo,
  Pago,
  calcularFacturasConSaldo,
  formatCOP,
  obtenerFacturas,
  obtenerPagos,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Facturas y Pagos
          </h1>
          <p className="text-muted-foreground">
            Gestiona las facturas y pagos de los deportistas
          </p>
        </div>
        <Button disabled title="Las facturas se generan automáticamente al crear una inscripción">
          <Plus className="mr-2 h-4 w-4" /> Nueva Factura
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between mb-4">
          <div className="flex items-center space-x-2 w-full max-w-sm">
            <Input
              placeholder="Buscar facturas…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4" />
            </Button>
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
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
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
                            {new Date(factura.fechaEmision).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {factura.persona.nombre} {factura.persona.apellidos}
                          </TableCell>
                          <TableCell>{factura.descripcion}</TableCell>
                          <TableCell>{formatCOP(factura.total)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                factura.estadoCuenta === "Pagado"
                                  ? "default"
                                  : factura.estadoCuenta === "Abono parcial"
                                  ? "outline"
                                  : "destructive"
                              }
                            >
                              {factura.estadoCuenta}
                            </Badge>
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
                                    <h4 className="font-semibold mb-2">
                                      Detalles de la Factura
                                    </h4>
                                    <div className="space-y-2">
                                      {factura.descuento ? (
                                        <>
                                          <div className="grid grid-cols-2">
                                            <span className="text-muted-foreground">
                                              Descuento aplicado:
                                            </span>
                                            <span>
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
                                      <div className="grid grid-cols-2">
                                        <span className="text-muted-foreground">
                                          Total:
                                        </span>
                                        <span className="font-bold">
                                          {formatCOP(factura.total)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">
                                      Información de Pago
                                    </h4>
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-2">
                                        <span className="text-muted-foreground">
                                          Pagado:
                                        </span>
                                        <span>
                                          {formatCOP(factura.totalPagado)}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2">
                                        <span className="text-muted-foreground">
                                          Saldo pendiente:
                                        </span>
                                        <span className="font-bold">
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
    </div>
  );
} 