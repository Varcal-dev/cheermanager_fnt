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
import { Search, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ModalCrearConvenio } from "../components/Forms/CrearConvenio";
import { ModalEditarConvenio } from "../components/Forms/EditarConvenio";
import { ModalEliminarConvenio } from "../components/Forms/EliminarConvenio";
import { api } from "@/lib/api";

interface Descuento {
  id: number;
  nombre: string;
  descripcion: string;
  porcentaje: number;
  fechaInicio: string; // o Date, pero si recibes string, mantén string
  fechaFin: string;
  activo: boolean;
}

interface Convenio {
  id: number;
  nombreEmpresa: string;
  descuento: Descuento;
  fechaInicio: string;
  fechaFin: string;
  deportistas_beneficiados?: number; // opcional si no lo tienes aún
}

interface ConvenioPost {
  id: number;
  nombreEmpresa: string;
  descuento: {
    id: number;
    nombre: string;
    porcentaje: number;
  };
  fechaInicio: string;
  fechaFin: string;
  deportistasBeneficiados?: number;
}

export default function DescuentosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [convenios, setConvenios] = useState<Convenio[]>([]);

  //const [convenios, setConvenios] = React.useState([]);
  //const [convenios, setConvenios] = React.useState<Convenio[]>([]);

  const cargarConvenios = () => {
    api.get(`/api/convenios`)
      .then((response) => setConvenios(response.data));
  };

  useEffect(() => {
    cargarConvenios();
  }, []);

  // Filtrar convenios por término de búsqueda
  const filteredConvenios = Array.isArray(convenios)
    ? convenios.filter((convenio) =>
        convenio.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  return (
    <ProtectedRoute requiredPermission="ver_convenio">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight"> Convenios</h1>
            <p className="text-muted-foreground">
              Gestiona los convenios con otras instituciones
            </p>
          </div>
        </div>

        <Tabs defaultValue="convenios" className="w-full">
          <TabsContent value="convenios" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 w-full max-w-sm">
                <Input
                  placeholder="Buscar convenios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9"
                />
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <ModalCrearConvenio onConvenioCreado={cargarConvenios} />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa/Institución</TableHead>
                      <TableHead>Descuento</TableHead>
                      <TableHead>Porcentaje</TableHead>
                      <TableHead>Vigencia</TableHead>
                      <TableHead>Beneficiados</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConvenios.map((convenio) => (
                      <TableRow key={convenio.id}>
                        <TableCell className="font-medium">
                          {convenio.nombreEmpresa}
                        </TableCell>
                        <TableCell>{convenio.descuento.nombre}</TableCell>
                        <TableCell>{convenio.descuento.porcentaje}%</TableCell>
                        <TableCell>
                          {new Date(convenio.fechaInicio).toLocaleDateString()}{" "}
                          - {new Date(convenio.fechaFin).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {convenio.deportistas_beneficiados ?? "-"}
                        </TableCell>
                        <TableCell>
                          {" "}
                          <div className="flex space-x-2">
                            <ModalEditarConvenio
                              convenio={convenio}
                              onConvenioActualizado={cargarConvenios}
                            />
                            <ModalEliminarConvenio
                              convenioId={convenio.id}
                              nombreEmpresa={convenio.nombreEmpresa}
                              onEliminado={cargarConvenios}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total de Convenios</CardTitle>
              <CardDescription>Convenios con instituciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{convenios.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <Building className="inline h-3 w-3" /> Con{" "}
                {Array.isArray(convenios)
                  ? convenios.reduce(
                      (total, convenio) =>
                        total + (convenio.deportistas_beneficiados ?? 0),
                      0
                    )
                  : 0}
                deportistas beneficiados
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}