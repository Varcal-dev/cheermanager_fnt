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
import { Search, DollarSign, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import CrearDescuentoForm from "../components/Forms/CrearDescuentoForm";
import ModalEditarDescuento from "../components/Forms/ModalEditarDescuento";
import ModalEliminarDescuento from "../components/Forms/ModalEliminarDescuento";

// Nota: esta página antes también traía un tab "Convenios" con datos
// 100% de ejemplo, que ni siquiera se llegaba a mostrar (no había
// TabsList para cambiar de tab). Se quitó — los convenios ya se
// gestionan en su propia página, app/convenios/page.tsx, que sí está
// conectada al backend real.

export interface Descuento {
  id: number;
  nombre: string;
  descripcion: string;
  porcentaje: number;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
}

export default function DescuentosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);

  const refetchDescuentos = () => {
    setCargando(true);
    api
      .get("/api/descuentos")
      .then((res) => setDescuentos(res.data))
      .catch(() => toast.error("No se pudieron cargar los descuentos"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    refetchDescuentos();
  }, []);

  const filteredDescuentos = descuentos.filter((descuento) => {
    const matchesSearch =
      descuento.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (descuento.descripcion ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!mostrarInactivos) {
      return matchesSearch && descuento.activo;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Descuentos</h1>
          <p className="text-muted-foreground">
            Gestiona los descuentos para las Inscripciones
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <Input
            placeholder="Buscar descuentos..."
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
          <CrearDescuentoForm onCreated={refetchDescuentos} />
        </div>
      </div>

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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDescuentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay descuentos para mostrar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDescuentos.map((descuento) => (
                    <TableRow key={descuento.id}>
                      <TableCell className="font-medium">
                        {descuento.nombre}
                      </TableCell>
                      <TableCell>{descuento.descripcion}</TableCell>
                      <TableCell>{descuento.porcentaje}%</TableCell>
                      <TableCell>
                        {new Date(descuento.fechaInicio).toLocaleDateString()}
                        {descuento.fechaFin
                          ? ` - ${new Date(descuento.fechaFin).toLocaleDateString()}`
                          : " - Sin fecha de fin"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={descuento.activo ? "default" : "secondary"}
                        >
                          {descuento.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <ModalEditarDescuento
                            {...({
                              descuento,
                              onUpdated: refetchDescuentos,
                            } as any)}
                          />
                          <ModalEliminarDescuento
                            {...({
                              descuentoId: descuento.id,
                              onDeleted: refetchDescuentos,
                            } as any)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total de Descuentos</CardTitle>
            <CardDescription>Descuentos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{descuentos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {descuentos.filter((d) => d.activo).length} activos,{" "}
              {descuentos.filter((d) => !d.activo).length} inactivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Descuentos Vigentes</CardTitle>
            <CardDescription>Activos y dentro de su fecha de vigencia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {
                descuentos.filter((d) => {
                  if (!d.activo) return false;
                  const hoy = new Date();
                  const fin = d.fechaFin ? new Date(d.fechaFin) : null;
                  return !fin || fin >= hoy;
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <DollarSign className="inline h-3 w-3" /> vigentes hoy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}