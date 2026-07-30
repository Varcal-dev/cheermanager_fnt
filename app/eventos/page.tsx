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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import EventoFormModal, { Evento } from "../components/eventos/EventoFormModal";
import GruposEventoPanel from "../components/eventos/GruposEventoPanel";
import ResultadosEventoPanel from "../components/eventos/ResultadosEventoPanel";
import PremiosEventoPanel from "../components/eventos/PremiosEventoPanel";
import React from "react";

type Vista = "proximos" | "historial" | "todos";

export default function EventosPage() {
  const [vista, setVista] = useState<Vista>("proximos");
  const [cargando, setCargando] = useState(true);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [expandidos, setExpandidos] = useState<number[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [eventoEnEdicion, setEventoEnEdicion] = useState<Evento | null>(null);

  const cargar = (v: Vista = vista) => {
    setCargando(true);
    const endpoint =
      v === "proximos"
        ? "/api/eventos/proximos"
        : v === "historial"
          ? "/api/eventos/historial"
          : "/api/eventos";
    api
      .get(endpoint)
      .then((res) => setEventos(res.data))
      .catch(() => toast.error("No se pudieron cargar los eventos"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar(vista);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista]);

  const toggleExpand = (id: number) => {
    setExpandidos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const abrirNuevo = () => {
    setEventoEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (evento: Evento) => {
    setEventoEnEdicion(evento);
    setModalAbierto(true);
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este evento? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/api/eventos/${id}`);
      toast.success("Evento eliminado");
      cargar();
    } catch (error: any) {
      // El backend responde 409 si el evento ya tiene resultados cargados
      // — se lo mostramos tal cual en vez de un error genérico.
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo eliminar el evento",
      );
    }
  };

  return (
    <ProtectedRoute requiredPermission="ver_evento">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
            <p className="text-muted-foreground">
              Competencias, resultados y premios
            </p>
          </div>
          <Button onClick={abrirNuevo}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Evento
          </Button>
        </div>

        <Tabs value={vista} onValueChange={(v) => setVista(v as Vista)}>
          <TabsList>
            <TabsTrigger value="proximos">Próximos</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            {cargando ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Grupos</TableHead>
                    <TableHead>Premios</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay eventos para mostrar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    eventos.map((evento) => {
                      const estaExpandido = expandidos.includes(evento.id);
                      return (
                        <React.Fragment key={evento.id}>
                          <TableRow>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(evento.id)}
                              >
                                {estaExpandido ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">{evento.nombre}</TableCell>
                            <TableCell>
                              {new Date(evento.fecha).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{evento.tipoEvento}</Badge>
                            </TableCell>
                            <TableCell>{evento.ubicacion}</TableCell>
                            <TableCell>{evento.cantidadGruposInscritos}</TableCell>
                            <TableCell>{evento.cantidadPremios}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirEdicion(evento)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" /> Editar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => eliminar(evento.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {estaExpandido && (
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={8} className="p-0">
                                <div className="p-4">
                                  <Tabs defaultValue="grupos" className="w-full">
                                    <TabsList>
                                      <TabsTrigger value="grupos">Grupos</TabsTrigger>
                                      <TabsTrigger value="resultados">Resultados</TabsTrigger>
                                      <TabsTrigger value="premios">Premios</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="grupos" className="mt-4">
                                      <GruposEventoPanel eventoId={evento.id} />
                                    </TabsContent>
                                    <TabsContent value="resultados" className="mt-4">
                                      <ResultadosEventoPanel eventoId={evento.id} />
                                    </TabsContent>
                                    <TabsContent value="premios" className="mt-4">
                                      <PremiosEventoPanel eventoId={evento.id} />
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
            )}
          </CardContent>
        </Card>
      </div>

      <EventoFormModal
        open={modalAbierto}
        onOpenChange={setModalAbierto}
        evento={eventoEnEdicion}
        onGuardado={() => cargar()}
      />
    </ProtectedRoute>
  );
}