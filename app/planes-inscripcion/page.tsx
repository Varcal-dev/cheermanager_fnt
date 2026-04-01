"use client";

import { useEffect, useState } from "react";
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
  Pencil,
  Trash2,
  Download,
  Search,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import axios from "axios";

interface PlanInscripcion {
  id: number;
  nombre: string;
  descripcion: string;
  valor: number;
  fechaVigenciaInicio: string;
  fechaVigenciaFin: string;
  activo: boolean;
}

interface PlanInscripcionFront {
  id: number;
  nombre: string;
  descripcion: string;
  valor: number;
  fecha_vigencia_inicio: string;
  fecha_vigencia_fin: string;
  activo: boolean;
  deportistas_inscritos: number;
}

export default function PlanesInscripcionPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [planes, setPlanes] = useState<PlanInscripcionFront[]>([]);

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/planes-inscripcion/listar`,
          {
            withCredentials: true,
          }
        );

        const mapped: PlanInscripcionFront[] = response.data.map((plan: any) => ({
          id: plan.id,
          nombre: plan.nombre,
          descripcion: plan.descripcion || "",
          valor: plan.valor,
          fecha_vigencia_inicio: plan.fechaVigenciaInicio,
          fecha_vigencia_fin: plan.fechaVigenciaFin,
          activo: plan.activo,
          deportistas_inscritos: 0,
        }));

        setPlanes(mapped);
      } catch (error) {
        console.error("Error al obtener planes de inscripción:", error);
      }
    };

    fetchPlanes();
  }, []);

  const fetchPlanes = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/planes-inscripcion`,
        {
          withCredentials: true,
        }
      );

      const mapped: PlanInscripcionFront[] = response.data.map((plan: any) => ({
        id: plan.id,
        nombre: plan.nombre,
        descripcion: plan.descripcion || "",
        valor: plan.valor,
        fecha_vigencia_inicio: plan.fechaVigenciaInicio,
        fecha_vigencia_fin: plan.fechaVigenciaFin,
        activo: plan.activo,
        deportistas_inscritos: 0,
      }));

      setPlanes(mapped);
    } catch (error) {
      console.error("Error al obtener planes de inscripción:", error);
    }
  };

  // Filtrar planes por término de búsqueda y estado activo/inactivo
  const filteredPlanes = planes.filter((plan: PlanInscripcionFront) => {
    const matchesSearch =
      (plan.nombre?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (plan.descripcion?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      );

    if (!mostrarInactivos) {
      return matchesSearch && plan.activo;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planes de Inscripción</h1>
          <p className="text-muted-foreground">
            Gestiona los planes de inscripción disponibles para los deportistas
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
        </Button>
      </div>

      <div className="flex justify-between mb-4">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <Input
            placeholder="Buscar planes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2">
            <Switch
              id="mostrar-inactivos"
              checked={mostrarInactivos}
              onCheckedChange={setMostrarInactivos}
            />
            <Label htmlFor="mostrar-inactivos">Mostrar inactivos</Label>
          </div>
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
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Deportistas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlanes.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.nombre}</TableCell>
                  <TableCell>{plan.descripcion}</TableCell>
                  <TableCell>
                    {" "}
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(plan.valor)}
                  </TableCell>
                  <TableCell>
                    {new Date(plan.fecha_vigencia_inicio).toLocaleDateString()}{" "}
                    - {new Date(plan.fecha_vigencia_fin).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{plan.deportistas_inscritos}</TableCell>
                  <TableCell>
                    <Badge variant={plan.activo ? "default" : "secondary"}>
                      {plan.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button variant="destructive" size="sm">
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

      {/* Tarjetas Resumen de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/*Total de Planes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total de Planes</CardTitle>
            <CardDescription>Planes de inscripción registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{planes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {planes.filter((p) => p.activo).length} activos,{" "}
              {planes.filter((p) => !p.activo).length} inactivos
            </p>
          </CardContent>
        </Card>
        {/*Deportistas inscritos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Deportistas Inscritos</CardTitle>
            <CardDescription>Total de inscripciones activas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {planes.reduce(
                (total, plan) => total + (plan.deportistas_inscritos ?? 0),
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En todos los planes activos
            </p>
          </CardContent>
        </Card>
        {/*Ingresos estimado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ingreso Total Estimado</CardTitle>
            <CardDescription>Basado en inscripciones actuales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(
                planes.reduce(
                  (total, plan) =>
                    total + plan.valor * (plan.deportistas_inscritos ?? 0),
                  0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <Users className="inline h-3 w-3" /> Sin considerar
              descuentos aplicados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
