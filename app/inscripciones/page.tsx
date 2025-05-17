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
  Trash2,
  Download,
  Search,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import axios from "axios";

import InscribirDeportistaModal from "../components/Forms/InscribirDeportistaModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";

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

export default function InscripcionesPage() {
  const [expandedInscripciones, setExpandedInscripciones] = useState<number[]>(
    []
  );

  //const [inscripciones, setInscripciones] = useState([]);
  //const [inscripciones, setInscripciones] = useState<InscripcionDetalle[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");

  const toggleInscripcionExpand = (inscripcionId: number) => {
    setExpandedInscripciones((prev) =>
      prev.includes(inscripcionId)
        ? prev.filter((id) => id !== inscripcionId)
        : [...prev, inscripcionId]
    );
  };

  const [inscripciones, setInscripciones] = useState<InscripcionDetalle[]>([]);

  const fetchInscripciones = () => {
    fetch("http://localhost:8080/api/inscripciones/detalle")
      .then((res) => res.json())
      .then((data) => {
        const transformado = data.map((fila: any[]) => ({
          inscripcion_id: fila[0],
          deportista_id: fila[1],
          deportista: fila[2],
          nivel: fila[3],
          fecha_inscripcion: fila[4],
          fecha_vencimiento: fila[5],
          estado: fila[6],
          plan_pago: fila[7],
          grupo_asignado: fila[8],
          documentos_completos: fila[9] === 1,
        }));
        setInscripciones(transformado);
      });
  };
  useEffect(() => {
    fetchInscripciones();
  }, []);

  // Filtrar inscripciones por término de búsqueda, estado y grupo
  const filteredInscripciones = inscripciones.filter((inscripcion) => {
    const matchesSearch = inscripcion.deportista
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesEstado =
      filtroEstado === "todos" || inscripcion.estado === filtroEstado;

    const matchesGrupo =
      filtroGrupo === "todos" || inscripcion.grupo_asignado === filtroGrupo;

    return matchesSearch && matchesEstado && matchesGrupo;
  });

  /*
  // Obtener documentos para una inscripción
  const getDocumentos = (inscripcionId: number) => {
    return documentos.filter((d) => d.inscripcion_id === inscripcionId);
  };

  // Obtener pagos para una inscripción
  const getPagos = (inscripcionId: number) => {
    return pagosInscripcion.filter((p) => p.inscripcion_id === inscripcionId);
  };

  // Verificar si todos los documentos están aprobados
  const todosDocumentosAprobados = (inscripcionId: number) => {
    const docs = getDocumentos(inscripcionId);
    return docs.length > 0 && docs.every((doc) => doc.estado === "Aprobado");
  };

  // Verificar si el pago está completado
  const pagoCompletado = (inscripcionId: number) => {
    const pagos = getPagos(inscripcionId);
    return (
      pagos.length > 0 && pagos.some((pago) => pago.estado === "Completado")
    );
  };*/

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
          {permissions.includes("editar_usuarios") && (
            <InscribirDeportistaModal
              onInscripcionExitosa={fetchInscripciones}
            />
          )}
          {/*
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nueva Inscripción
        </Button>*/}
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
          <div className="flex flex-wrap gap-2">
            {/*
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="Inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filtrar por grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los grupos</SelectItem>
              <SelectItem value="Mini Estrellas">Mini Estrellas</SelectItem>
              <SelectItem value="Junior Elite">Junior Elite</SelectItem>
              <SelectItem value="Senior Champions">Senior Champions</SelectItem>
            </SelectContent>
          </Select>
          */}
            {/*
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>*/}
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
                {filteredInscripciones.map((inscripcion) => (
                  <React.Fragment key={inscripcion.deportista_id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleInscripcionExpand(inscripcion.inscripcion_id)
                          }
                        >
                          {expandedInscripciones.includes(
                            inscripcion.inscripcion_id
                          ) ? (
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
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" /> Detalles
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedInscripciones.includes(
                      inscripcion.deportista_id
                    ) && (
                      <TableRow
                        key={`${inscripcion.deportista_id}-details`}
                        className="bg-muted/50"
                      >
                        <TableCell colSpan={9} className="p-0">
                          <div className="p-4">
                            <Tabs defaultValue="documentos" className="w-full">
                              <TabsList>
                                <TabsTrigger value="documentos">
                                  Documentos
                                </TabsTrigger>
                                <TabsTrigger value="pagos">Pagos</TabsTrigger>
                              </TabsList>

                              <TabsContent value="documentos" className="mt-4">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-semibold">
                                    Documentos Requeridos
                                  </h4>
                                  <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4 mr-1" /> Agregar
                                    Documento
                                  </Button>
                                </div>
                                {/*
                              {getDocumentos(inscripcion.deportista_id).length >
                              0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Documento</TableHead>
                                      <TableHead>Estado</TableHead>
                                      <TableHead>Fecha Entrega</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getDocumentos(
                                      inscripcion.deportista_id
                                    ).map((documento) => (
                                      <TableRow key={documento.id}>
                                        <TableCell>
                                          {documento.nombre}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              documento.estado === "Aprobado"
                                                ? "default"
                                                : "secondary"
                                            }
                                            className={
                                              documento.estado === "Aprobado"
                                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                            }
                                          >
                                            {documento.estado}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          {documento.fecha_entrega
                                            ? new Date(
                                                documento.fecha_entrega
                                              ).toLocaleDateString()
                                            : "Pendiente"}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex space-x-2">
                                            <Button variant="outline" size="sm">
                                              <Pencil className="h-4 w-4 mr-1" />{" "}
                                              Editar
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                            >
                                              <Trash2 className="h-4 w-4 mr-1" />{" "}
                                              Eliminar
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  No hay documentos registrados para esta
                                  inscripción
                                </div>
                              )}*/}
                              </TabsContent>

                              <TabsContent value="pagos" className="mt-4">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-semibold">
                                    Pagos de Inscripción
                                  </h4>
                                  <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4 mr-1" /> Registrar
                                    Pago
                                  </Button>
                                </div>
                                {/*
                              {getPagos(inscripcion.deportista_id).length >
                              0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Monto</TableHead>
                                      <TableHead>Fecha</TableHead>
                                      <TableHead>Método de Pago</TableHead>
                                      <TableHead>Estado</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getPagos(inscripcion.deportista_id).map(
                                      (pago) => (
                                        <TableRow key={pago.id}>
                                          <TableCell>
                                            ${pago.monto.toFixed(2)}
                                          </TableCell>
                                          <TableCell>
                                            {pago.fecha_pago
                                              ? new Date(
                                                  pago.fecha_pago
                                                ).toLocaleDateString()
                                              : "Pendiente"}
                                          </TableCell>
                                          <TableCell>
                                            {pago.metodo_pago}
                                          </TableCell>
                                          <TableCell>
                                            <Badge
                                              variant={
                                                pago.estado === "Completado"
                                                  ? "default"
                                                  : "secondary"
                                              }
                                              className={
                                                pago.estado === "Completado"
                                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                              }
                                            >
                                              {pago.estado}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex space-x-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                              >
                                                <Pencil className="h-4 w-4 mr-1" />{" "}
                                                Editar
                                              </Button>
                                              <Button
                                                variant="destructive"
                                                size="sm"
                                              >
                                                <Trash2 className="h-4 w-4 mr-1" />{" "}
                                                Eliminar
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    )}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  No hay pagos registrados para esta inscripción
                                </div>
                              )}*/}
                              </TabsContent>
                            </Tabs>
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
      </div>
    </ProtectedRoute>
  );
}
