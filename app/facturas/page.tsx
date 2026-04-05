"use client";

import { useEffect, useState } from "react";
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
  Pencil,
  Filter,
  Download,
  Search,
  FileText,
  CreditCard,
  Printer,
  Mail,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import React from "react";

interface Persona {
  id: number;
  nombre: string;
  apellidos: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  generoId: number;
}

interface Descuento {
  id: number;
  nombre: string;
  descripcion: string;
  porcentaje: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
}

export interface Factura {
  id: number;
  numeroFactura: string;
  fechaEmision: string;
  persona: Persona;
  descripcion: string;
  descuento: Descuento;
  total: number;
  estadoPago?: string;
}

export default function FacturasPage() {
  const [expandedFacturas, setExpandedFacturas] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("facturas");
  const [estadoFiltro, setEstadoFiltro] = useState<string | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/facturas`)
      .then((res) => {
        setFacturas(res.data);
      })
      .catch((err) => {
        console.error("Error al obtener facturas:", err);
      });
  }, []);

  const toggleFacturaExpand = (facturaId: number) => {
    setExpandedFacturas((prev) =>
      prev.includes(facturaId)
        ? prev.filter((id) => id !== facturaId)
        : [...prev, facturaId]
    );
  };

  // Calcular subtotal y descuento para una factura
  const calcularDetalles = (factura: Factura) => {
    const subTotal = factura.total / (1 - factura.descuento.porcentaje / 100);
    const valorDescuento = subTotal - factura.total;

    return {
      subTotal,
      valorDescuento,
    };
  };

  // Filtrar facturas por término de búsqueda y estado
  const filteredFacturas = facturas.filter((factura) => {
    const matchesSearch =
      factura.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.persona.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

    if (estadoFiltro) {
      return matchesSearch && factura.estadoPago === estadoFiltro;
    }
    return matchesSearch;
  });

  {
    /*
  // Filtrar pagos por término de búsqueda
  const filteredPagos = pagos.filter((pago) => {
    return (
      pago.factura_numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Obtener pago para una factura
  const getPagoFactura = (facturaId: number) => {
    return pagos.find((p) => p.factura_id === facturaId)
  }*/
  }

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
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nueva Factura
        </Button>
      </div>

      <Tabs
        defaultValue="facturas"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsContent value="facturas" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-center space-x-2 w-full max-w-sm">
              <Input
                placeholder="Buscar facturas..."
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
                    onClick={() => setEstadoFiltro("Pendiente")}
                  >
                    Pendiente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEstadoFiltro("Vencido")}>
                    Vencido
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

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
                  {filteredFacturas.map((factura) => (
                    <React.Fragment key={factura.id}>
                      <TableRow key={factura.id}>
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
                          {factura.persona.nombre +
                            " " +
                            factura.persona.apellidos}
                        </TableCell>
                        <TableCell>{factura.descripcion}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            minimumFractionDigits: 0,
                          }).format(factura.total)}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              factura.estadoPago === "Pagado"
                                ? "default"
                                : factura.estadoPago === "Pendiente"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {factura.estadoPago}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-1" /> Editar
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <FileText className="h-4 w-4 mr-1" /> Acciones
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Printer className="h-4 w-4 mr-2" /> Imprimir
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" /> Enviar por
                                  Email
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <CreditCard className="h-4 w-4 mr-2" />{" "}
                                  Registrar Pago
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
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Subtotal:
                                      </span>
                                      <span>
                                        {new Intl.NumberFormat("es-CO", {
                                          style: "currency",
                                          currency: "COP",
                                          minimumFractionDigits: 0,
                                        }).format(
                                          factura.total /
                                            (1 -
                                              factura.descuento.porcentaje /
                                                100)
                                        )}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Descuento:
                                      </span>
                                      <span>
                                        {new Intl.NumberFormat("es-CO", {
                                          style: "currency",
                                          currency: "COP",
                                          minimumFractionDigits: 0,
                                        }).format(
                                          factura.total /
                                            (1 -
                                              factura.descuento.porcentaje /
                                                100) -
                                            factura.total
                                        )}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Total:
                                      </span>
                                      <span className="font-bold">
                                        {new Intl.NumberFormat("es-CO", {
                                          style: "currency",
                                          currency: "COP",
                                          minimumFractionDigits: 0,
                                        }).format(factura.total)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Información de Pago
                                  </h4>
                                  {/*
                                  {factura.estadoPago === "Pagado" ? (
                                    <div className="space-y-2">
                                      {(() => {
                                        const pago = getPagoFactura(factura.id);
                                        if (pago) {
                                          return (
                                            <>
                                              <div className="grid grid-cols-2">
                                                <span className="text-muted-foreground">
                                                  Fecha de Pago:
                                                </span>
                                                <span>
                                                  {new Date(
                                                    pago.fecha
                                                  ).toLocaleDateString()}
                                                </span>
                                              </div>
                                              <div className="grid grid-cols-2">
                                                <span className="text-muted-foreground">
                                                  Método de Pago:
                                                </span>
                                                <span>{pago.metodo_pago}</span>
                                              </div>
                                              <div className="grid grid-cols-2">
                                                <span className="text-muted-foreground">
                                                  Tipo de Pago:
                                                </span>
                                                <span>{pago.tipo_pago}</span>
                                              </div>
                                            </>
                                          );
                                        } else {
                                          return (
                                            <span className="text-muted-foreground">
                                              Información de pago no disponible
                                            </span>
                                          );
                                        }
                                      })()}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col space-y-2">
                                      <span className="text-muted-foreground">
                                        Pago pendiente
                                      </span>
                                      <Button size="sm">
                                        <CreditCard className="h-4 w-4 mr-1" />{" "}
                                        Registrar Pago
                                      </Button>
                                    </div>
                                  )}*/}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
