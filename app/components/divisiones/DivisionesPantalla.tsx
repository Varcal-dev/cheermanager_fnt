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
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import {
  Division,
  ModalCrearDivision,
  ModalEditarDivision,
  ModalEliminarDivision,
} from "@/app/components/Forms/DivisionModals";

// Esta página antes traía, sin usarse, ~230 líneas de datos de ejemplo
// para "Niveles" y "Categorías de Nivel" (arrays enteros que ni
// siquiera se llegaban a renderizar — no había un TabsList que
// permitiera cambiar a esos tabs). Se quitó todo eso: Niveles y
// Categorías de Nivel ya tienen sus propias páginas conectadas
// (app/niveles/page.tsx y app/categorias-nivel/page.tsx).

export default function DivisionesPantalla({ embebido = false }: { embebido?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cargando, setCargando] = useState(true);
  const [divisiones, setDivisiones] = useState<Division[]>([]);

  const refetchDivisiones = () => {
    setCargando(true);
    api
      .get("/api/divisiones")
      .then((res) => setDivisiones(res.data))
      .catch(() => toast.error("No se pudieron cargar las divisiones"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    refetchDivisiones();
  }, []);

  const filteredDivisiones = divisiones.filter((division) =>
    division.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {!embebido && <h1 className="text-3xl font-bold tracking-tight">Divisiones</h1>}
          <p className="text-muted-foreground">
            Gestiona las diferentes divisiones que manejas en tu Gimnasio
          </p>
        </div>
        <ModalCrearDivision onCreated={refetchDivisiones} />
      </div>

      <div className="flex items-center space-x-2 w-full max-w-sm">
        <Input
          placeholder="Buscar divisiones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4" />
        </Button>
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
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDivisiones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      No hay divisiones para mostrar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDivisiones.map((division) => (
                    <TableRow key={division.id}>
                      <TableCell className="font-medium">{division.nombre}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <ModalEditarDivision
                            division={division}
                            onUpdated={refetchDivisiones}
                          />
                          <ModalEliminarDivision
                            divisionId={division.id}
                            nombre={division.nombre}
                            onDeleted={refetchDivisiones}
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
    </div>
  );
}