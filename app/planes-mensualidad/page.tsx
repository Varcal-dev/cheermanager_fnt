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
import { Download, Search, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { PlanPagoModal, type PlanPago } from "../components/Forms/PlanPagoModal";
import { EliminarPlanPagoModal } from "../components/Forms/EliminarPlanPagoModal";

export default function PlanesMensualidadPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [planes, setPlanes] = useState<PlanPago[]>([]);

  const fetchPlanes = async () => {
    try {
      // Antes: /api/planes-mensualidad, que no existe en el backend (el
      // controller está en /api/planes-pago). Por eso esta tabla siempre
      // aparecía vacía.
      const response = await api.get(`/api/planes-pago`, {
        params: { categoria: "mensualidad" },
      });
      setPlanes(response.data);
    } catch (error) {
      console.error("Error al obtener planes:", error);
    }
  };

  useEffect(() => {
    fetchPlanes();
  }, []);

  const filteredPlanes = planes.filter((plan) => {
    const matchesSearch =
      (plan.nombre?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (plan.descripcion?.toLowerCase() ?? "").includes(searchTerm.toLowerCase());

    if (!mostrarInactivos) {
      return matchesSearch && plan.activo;
    }
    return matchesSearch;
  });

  const totalInscritos = planes.reduce(
    (total, plan: any) => total + (plan.deportistasInscritos ?? 0),
    0,
  );
  const ingresoMensual = planes.reduce(
    (total, plan: any) =>
      total + plan.valorMensual * (plan.deportistasInscritos ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planes de Mensualidades</h1>
          <p className="text-muted-foreground">
            Gestiona los planes de mensualidades disponibles para los deportistas
          </p>
        </div>
        <PlanPagoModal categoria="mensualidad" onGuardado={fetchPlanes} />
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
                <TableHead>Valor Mensual</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Deportistas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlanes.map((plan: any) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.nombre}</TableCell>
                  <TableCell>{plan.descripcion}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(plan.valorMensual)}
                  </TableCell>
                  <TableCell>
                    {new Date(plan.fechaVigenciaInicio).toLocaleDateString()}
                    {plan.fechaVigenciaFin
                      ? ` - ${new Date(plan.fechaVigenciaFin).toLocaleDateString()}`
                      : " - Indefinida"}
                  </TableCell>
                  <TableCell>{plan.deportistasInscritos ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={plan.activo ? "default" : "secondary"}>
                      {plan.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <PlanPagoModal
                        categoria="mensualidad"
                        plan={plan}
                        onGuardado={fetchPlanes}
                      />
                      <EliminarPlanPagoModal
                        planId={plan.id}
                        onEliminado={fetchPlanes}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total de Planes</CardTitle>
            <CardDescription>Planes de mensualidades registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{planes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {planes.filter((p) => p.activo).length} activos,{" "}
              {planes.filter((p) => !p.activo).length} inactivos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Deportistas Inscritos</CardTitle>
            <CardDescription>Total de inscripciones activas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalInscritos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En todos los planes activos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ingreso Mensual Estimado</CardTitle>
            <CardDescription>Basado en inscripciones actuales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(ingresoMensual)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <DollarSign className="inline h-3 w-3" /> Sin considerar
              descuentos aplicados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}