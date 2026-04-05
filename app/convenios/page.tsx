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
  Search,
  DollarSign,
  Building,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ModalCrearConvenio } from "../components/Forms/CrearConvenio";
import { ModalEliminarConvenio } from "../components/Forms/EliminarConvenio";

// Datos de ejemplo para convenios
const convenios = [
  {
    id: 1,
    nombre_empresa: "Colegio San Patricio",
    descuento_id: 1,
    descuento_nombre: "Descuento Colegio San Patricio",
    porcentaje: 15.0,
    fecha_inicio: "2024-01-01",
    fecha_fin: "2024-12-31",
    deportistas_beneficiados: 8,
  },
  {
    id: 2,
    nombre_empresa: "Club Deportivo Municipal",
    descuento_id: 2,
    descuento_nombre: "Descuento Club Deportivo",
    porcentaje: 10.0,
    fecha_inicio: "2024-01-01",
    fecha_fin: "2024-12-31",
    deportistas_beneficiados: 5,
  },
  {
    id: 3,
    nombre_empresa: "Empresa XYZ",
    descuento_id: 3,
    descuento_nombre: "Descuento Corporativo",
    porcentaje: 12.0,
    fecha_inicio: "2024-01-01",
    fecha_fin: "2024-12-31",
    deportistas_beneficiados: 3,
  },
];
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/convenios`)
      .then((res) => res.json())
      .then((data) => setConvenios(data));
  };

  useEffect(() => {
    cargarConvenios();
  }, []);

  // Filtrar convenios por término de búsqueda
  const filteredConvenios = Array.isArray(convenios)
    ? convenios.filter((convenio) => {
        return (
          convenio.nombreEmpresa
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          // la segunda condición es redundante, podrías quitarla
          convenio.nombreEmpresa
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      })
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
              {/*
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Convenio
              </Button>*/}
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
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-1" /> Editar
                            </Button>
                            <ModalEliminarConvenio
                              convenioId={convenio.id}
                              nombreEmpresa={convenio.nombreEmpresa}
                              onEliminado={cargarConvenios}
                            />
                            {/*
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                            </Button>*/}
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
