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
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import {
  TipoPlanPagoModal,
  type TipoPlanPago,
} from "@/app/components/Forms/TipoPlanPagoModal";

export default function TiposPlanesPagoPage() {
  const [tipos, setTipos] = useState<TipoPlanPago[]>([]);

  const fetchTipos = async () => {
    try {
      const response = await api.get(`/api/tipos-planes-pago`);
      setTipos(response.data);
    } catch (error) {
      console.error("Error al obtener tipos de plan:", error);
      toast.error("Error al cargar los tipos de plan");
    }
  };

  useEffect(() => {
    fetchTipos();
  }, []);

  const handleEliminar = async (id: number) => {
    try {
      await api.delete(`/api/tipos-planes-pago/${id}`);
      toast.success("Tipo de plan eliminado correctamente");
      fetchTipos();
    } catch (error: any) {
      console.error("Error al eliminar tipo de plan:", error);
      // 409 = tiene planes asociados, el backend ya trae el mensaje claro
      toast.error(error.response?.data ?? "Error al eliminar el tipo de plan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tipos de Plan de Pago</h1>
          <p className="text-muted-foreground">
            Administra las categorías y duraciones disponibles para crear
            planes de inscripción o mensualidad
          </p>
        </div>
        <TipoPlanPagoModal onGuardado={fetchTipos} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Planes asociados</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell className="font-medium">{tipo.nombre}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        tipo.categoria === "inscripcion"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }
                    >
                      {tipo.categoria === "inscripcion"
                        ? "Inscripción"
                        : "Mensualidad"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tipo.duracionMeses}{" "}
                    {tipo.duracionMeses === 1 ? "mes" : "meses"}
                  </TableCell>
                  <TableCell>{tipo.descripcion}</TableCell>
                  <TableCell>{tipo.planesAsociados}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <TipoPlanPagoModal tipo={tipo} onGuardado={fetchTipos} />
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={tipo.planesAsociados > 0}
                        title={
                          tipo.planesAsociados > 0
                            ? "No se puede eliminar: tiene planes asociados"
                            : undefined
                        }
                        onClick={() => handleEliminar(tipo.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}