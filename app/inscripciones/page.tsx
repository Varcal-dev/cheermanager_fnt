"use client";

import { useState } from "react";
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
  Search,
  CheckCircle,
  XCircle,
  FileText,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import React, { useEffect } from "react";
import { api } from "@/lib/api";

import InscribirDeportistaModal from "../components/Forms/InscribirDeportistaModal";
import RegistrarPagoModal from "../components/Forms/RegistrarPagoModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import { toast } from "react-toastify";
import {
  FacturaConSaldo,
  calcularUnaFacturaConSaldo,
  etiquetaTipoFactura,
  formatCOP,
  obtenerFacturasDeInscripcion,
  obtenerPagosPorFactura,
} from "@/app/lib/facturas-pagos";

interface DeportistaDisponible {
  deportista_id: number;
  nombre_completo: string;
  nivel: string;
}
interface InscripcionDetalle {
  inscripcion_id: number;
  deportista_id: number;
  deportista: string;
  nivel: string;
  fecha_inscripcion: string;
  fecha_vencimiento: string;
  estado: string;
  plan_pago: string;
  grupo_asignado: string;
  documentos_completos: boolean;
}

// Estado de las facturas de una inscripción, cargado de forma perezosa
// (solo cuando se expande esa fila). Una inscripción puede tener varias:
// la de inscripción (cobro único) más una por cada mes de mensualidad ya
// facturado.
type EstadoFacturas =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "sin-factura" } // inscripción anterior a la automatización de facturas
  | { status: "error"; mensaje: string }
  | { status: "lista"; facturas: FacturaConSaldo[] };

export default function InscripcionesPage() {
  const [expandedInscripciones, setExpandedInscripciones] = useState<number[]>(
    []
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");

  const [facturasPorInscripcion, setFacturasPorInscripcion] = useState<
    Record<number, EstadoFacturas>
  >({});

  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [facturaParaPago, setFacturaParaPago] = useState<FacturaConSaldo | null>(
    null,
  );
  const [inscripcionDelPago, setInscripcionDelPago] = useState<number | null>(
    null,
  );

  const cargarFacturaDeInscripcion = async (inscripcionId: number) => {
    setFacturasPorInscripcion((prev) => ({
      ...prev,
      [inscripcionId]: { status: "loading" },
    }));

    try {
      const facturas = await obtenerFacturasDeInscripcion(inscripcionId);

      const facturasConSaldo = await Promise.all(
        facturas.map(async (factura) => {
          const pagosDeFactura = await obtenerPagosPorFactura(factura.id);
          return calcularUnaFacturaConSaldo(factura, pagosDeFactura);
        }),
      );

      // La de inscripción primero, luego mensualidades en orden cronológico.
      facturasConSaldo.sort((a, b) => {
        if (!a.periodo && b.periodo) return -1;
        if (a.periodo && !b.periodo) return 1;
        return (a.periodo ?? "").localeCompare(b.periodo ?? "");
      });

      setFacturasPorInscripcion((prev) => ({
        ...prev,
        [inscripcionId]: { status: "lista", facturas: facturasConSaldo },
      }));
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setFacturasPorInscripcion((prev) => ({
          ...prev,
          [inscripcionId]: { status: "sin-factura" },
        }));
      } else {
        setFacturasPorInscripcion((prev) => ({
          ...prev,
          [inscripcionId]: {
            status: "error",
            mensaje:
              error?.response?.data?.message || "No se pudo cargar la factura",
          },
        }));
      }
    }
  };

  const toggleInscripcionExpand = (inscripcionId: number) => {
    const yaExpandida = expandedInscripciones.includes(inscripcionId);

    setExpandedInscripciones((prev) =>
      yaExpandida
        ? prev.filter((id) => id !== inscripcionId)
        : [...prev, inscripcionId]
    );

    // Cargar las facturas la primera vez que se expande esta fila (no cada vez).
    if (!yaExpandida && !facturasPorInscripcion[inscripcionId]) {
      cargarFacturaDeInscripcion(inscripcionId);
    }
  };

  const abrirModalPago = (inscripcionId: number, factura: FacturaConSaldo) => {
    setInscripcionDelPago(inscripcionId);
    setFacturaParaPago(factura);
    setModalPagoAbierto(true);
  };

  const alRegistrarPago = () => {
    if (inscripcionDelPago !== null) {
      cargarFacturaDeInscripcion(inscripcionDelPago);
    }
  };

  const [inscripciones, setInscripciones] = useState<InscripcionDetalle[]>([]);

  const fetchInscripciones = () => {
  api
    .get(`/api/inscripciones/detalle`)
    .then((res) => res.data)
    .then((data) => {
      const transformado = data.map((item: any) => ({
        inscripcion_id: item.inscripcionId,
        deportista_id: item.deportistaId,
        deportista: item.deportista,
        nivel: item.nivel,
        fecha_inscripcion: item.fechaInscripcion,
        fecha_vencimiento: item.fechaVencimiento,
        estado: item.estado,
        plan_pago: item.planPago,
        grupo_asignado: item.grupoAsignado,
        documentos_completos: item.documentosCompletos === true,
      }));
      setInscripciones(transformado);
    })
    .catch((err) => {
      console.error("Error cargando inscripciones:", err);
      toast.error("No se pudo cargar la lista de inscripciones");
    });
};
  useEffect(() => {
    fetchInscripciones();
  }, []);

  // Filtrar inscripciones por término de búsqueda, estado y grupo
  const filteredInscripciones = inscripciones.filter((inscripcion) => {
    const matchesSearch = (inscripcion.deportista ?? "")
      .toLowerCase()
      .includes((searchTerm ?? "").toLowerCase());

    const matchesEstado =
      filtroEstado === "todos" || inscripcion.estado === filtroEstado;

    const matchesGrupo =
      filtroGrupo === "todos" || inscripcion.grupo_asignado === filtroGrupo;

    return matchesSearch && matchesEstado && matchesGrupo;
  });

  const { permissions } = useUser();

  return (
    <ProtectedRoute requiredPermission="gestionar_inscripciones">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inscripciones</h1>
            <p className="text-muted-foreground">
              Gestiona el proceso de inscripción de deportistas
            </p>
          </div>
          
            <InscribirDeportistaModal
              onInscripcionExitosa={fetchInscripciones}
            />
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="flex items-center space-x-2 w-full max-w-sm">
            <Input
              placeholder="Buscar por deportista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Deportista</TableHead>
                  <TableHead>Fecha Inscripción</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Plan de Pago</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInscripciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                        <div className="mb-4">
                          <svg
                            className="w-10 h-10 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 9V5.25m0 0A2.25 2.25 0 0013.5 3H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21h10.5a2.25 2.25 0 002.25-2.25V11.25a2.25 2.25 0 00-2.25-2.25H9l-1.5-1.5H6.75"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-500">
                          No hay inscriciones aún.
                        </p>
                        <p className="text-sm text-gray-400">
                          Puedes agregar uno usando el botón “Nueva Inscripcion.”
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInscripciones.map((inscripcion) => {
                    const estaExpandida = expandedInscripciones.includes(
                      inscripcion.inscripcion_id,
                    );
                    const estadoFacturas =
                      facturasPorInscripcion[inscripcion.inscripcion_id];

                    return (
                    <React.Fragment key={inscripcion.inscripcion_id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleInscripcionExpand(
                                inscripcion.inscripcion_id
                              )
                            }
                          >
                            {estaExpandida ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {inscripcion.deportista}
                        </TableCell>
                        <TableCell>
                          {new Date(
                            inscripcion.fecha_inscripcion
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {inscripcion.grupo_asignado || "Sin grupo"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              inscripcion.nivel === "Avanzado"
                                ? "default"
                                : inscripcion.nivel === "Intermedio"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {inscripcion.nivel}
                          </Badge>
                        </TableCell>
                        <TableCell>{inscripcion.plan_pago}</TableCell>
                        <TableCell>
                          {inscripcion.documentos_completos ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />{" "}
                              Completos
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-700 border-yellow-200"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Sin
                              documentos
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              inscripcion.estado === "Activo"
                                ? "default"
                                : inscripcion.estado === "Pendiente"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {inscripcion.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-1" /> Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toggleInscripcionExpand(
                                  inscripcion.inscripcion_id,
                                )
                              }
                            >
                              <FileText className="h-4 w-4 mr-1" /> Detalles
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {estaExpandida && (
                        <TableRow
                          key={`${inscripcion.inscripcion_id}-details`}
                          className="bg-muted/50"
                        >
                          <TableCell colSpan={9} className="p-0">
                            <div className="p-4">
                              <Tabs
                                defaultValue="factura"
                                className="w-full"
                              >
                                <TabsList>
                                  <TabsTrigger value="factura">
                                    Facturas
                                  </TabsTrigger>
                                  <TabsTrigger value="documentos">
                                    Documentos
                                  </TabsTrigger>
                                </TabsList>

                                <TabsContent value="factura" className="mt-4">
                                  {!estadoFacturas ||
                                  estadoFacturas.status === "loading" ? (
                                    <div className="flex items-center text-muted-foreground py-4">
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                      Cargando facturas…
                                    </div>
                                  ) : estadoFacturas.status === "sin-factura" ? (
                                    <div className="text-center py-4 text-muted-foreground">
                                      Esta inscripción no tiene factura
                                      asociada (es anterior a la
                                      generación automática de facturas).
                                    </div>
                                  ) : estadoFacturas.status === "error" ? (
                                    <div className="text-center py-4 text-destructive">
                                      {estadoFacturas.mensaje}
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {estadoFacturas.facturas.map((factura) => (
                                        <div
                                          key={factura.id}
                                          className="grid grid-cols-[1fr_auto] gap-4 rounded-lg border p-3"
                                        >
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <p className="font-semibold">
                                                {factura.numeroFactura}
                                              </p>
                                              <p className="text-xs text-muted-foreground mb-1">
                                                {etiquetaTipoFactura(factura)}
                                              </p>
                                              <div className="grid grid-cols-2">
                                                <span className="text-muted-foreground">
                                                  Total:
                                                </span>
                                                <span className="font-medium">
                                                  {formatCOP(factura.total)}
                                                </span>
                                              </div>
                                            </div>
                                            <div>
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
                                                  Saldo:
                                                </span>
                                                <span className="font-medium">
                                                  {formatCOP(
                                                    factura.saldoPendiente,
                                                  )}
                                                </span>
                                              </div>
                                              <div className="mt-1">
                                                <Badge
                                                  variant={
                                                    factura.estadoCuenta ===
                                                    "Pagado"
                                                      ? "default"
                                                      : factura.estadoCuenta ===
                                                        "Abono parcial"
                                                      ? "outline"
                                                      : "destructive"
                                                  }
                                                >
                                                  {factura.estadoCuenta}
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center">
                                            {factura.saldoPendiente > 0 && (
                                              <Button
                                                size="sm"
                                                onClick={() =>
                                                  abrirModalPago(
                                                    inscripcion.inscripcion_id,
                                                    factura,
                                                  )
                                                }
                                              >
                                                <CreditCard className="h-4 w-4 mr-1" />{" "}
                                                Registrar pago
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </TabsContent>

                                <TabsContent
                                  value="documentos"
                                  className="mt-4"
                                >
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold">
                                      Documentos Requeridos
                                    </h4>
                                    <Button size="sm" variant="outline">
                                      <Plus className="h-4 w-4 mr-1" /> Agregar
                                      Documento
                                    </Button>
                                  </div>
                                  <div className="text-center py-4 text-muted-foreground">
                                    Gestión de documentos aún no implementada
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RegistrarPagoModal
        open={modalPagoAbierto}
        onOpenChange={setModalPagoAbierto}
        facturas={facturaParaPago ? [facturaParaPago] : []}
        facturaPreseleccionada={facturaParaPago}
        onPagoRegistrado={alRegistrarPago}
      />
    </ProtectedRoute>
  );
}