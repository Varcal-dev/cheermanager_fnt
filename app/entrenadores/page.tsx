"use client";

import { useState } from "react";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import EditarEntrenadorDialog from "@/app/components/entrenadores/EditarEntrenadorDialog";
import EntrenadorFila from "@/app/components/entrenadores/EntrenadorFila";
import NuevoEntrenadorDialog from "@/app/components/entrenadores/NuevoEntrenadorDialog";
import RetirarEntrenadorDialog from "@/app/components/entrenadores/RetirarEntrenadorDialog";
import type { Entrenador } from "./types";
import { useEntrenadoresData } from "./useEntrenadoresData";

type FiltroEstado = "todos" | "activos" | "inactivos";

const ETIQUETA_FILTRO: Record<FiltroEstado, string> = {
  todos: "Todos",
  activos: "Activos",
  inactivos: "Inactivos",
};

export default function EntrenadoresPage() {
  const { permissions } = useUser();
  const { entrenadores, generos, estados, recargar } = useEntrenadoresData();

  const [searchTerm, setSearchTerm] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>("todos");

  const [expandidos, setExpandidos] = useState<number[]>([]);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [editando, setEditando] = useState<Entrenador | null>(null);
  const [editarAbierto, setEditarAbierto] = useState(false);
  const [aRetirar, setARetirar] = useState<number | null>(null);

  const toggleExpandido = (id: number) =>
    setExpandidos((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const termino = searchTerm.toLowerCase();
  const filtrados = entrenadores.filter((e) => {
    const coincide =
      (e.persona?.nombre?.toLowerCase() ?? "").includes(termino) ||
      (e.persona?.apellidos?.toLowerCase() ?? "").includes(termino) ||
      (e.especializacion?.toLowerCase() ?? "").includes(termino);

    const estadoNombre = e.estado?.estado ?? "";
    if (filtro === "activos") return coincide && estadoNombre === "Activo";
    if (filtro === "inactivos") return coincide && estadoNombre === "Inactivo";
    return coincide;
  });

  return (
    <ProtectedRoute requiredPermission="ver_entrenador">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Entrenadores</h1>
            <p className="text-muted-foreground">Gestiona la información de los entrenadores</p>
          </div>
          {permissions.includes("crear_entrenador") && (
            <Button onClick={() => setNuevoAbierto(true)}>Agregar Entrenador</Button>
          )}
        </div>

        <div className="flex justify-between mb-4">
          <div className="relative flex items-center w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar entrenadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {filtro === "todos" ? "Filtrar" : ETIQUETA_FILTRO[filtro]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(ETIQUETA_FILTRO) as FiltroEstado[]).map((f) => (
                <DropdownMenuItem key={f} onClick={() => setFiltro(f)}>
                  {ETIQUETA_FILTRO[f]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Especialización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      {entrenadores.length === 0
                        ? "No hay entrenadores registrados."
                        : "Ningún entrenador coincide con la búsqueda o el filtro."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((e) => (
                    <EntrenadorFila
                      key={e.id}
                      entrenador={e}
                      expandido={expandidos.includes(e.id)}
                      onToggle={() => toggleExpandido(e.id)}
                      onEditar={() => {
                        setEditando(e);
                        setEditarAbierto(true);
                      }}
                      onRetirar={() => setARetirar(e.id)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <NuevoEntrenadorDialog
          open={nuevoAbierto}
          onOpenChange={setNuevoAbierto}
          generos={generos}
          estados={estados}
          onGuardado={recargar}
        />
        <EditarEntrenadorDialog
          open={editarAbierto}
          onOpenChange={setEditarAbierto}
          entrenador={editando}
          generos={generos}
          onGuardado={recargar}
        />
        <RetirarEntrenadorDialog
          entrenadorId={aRetirar}
          estadoRetiradoId={estados.find((e) => e.estado === "Retirado")?.id}
          onClose={() => setARetirar(null)}
          onRetirado={recargar}
        />
      </div>
    </ProtectedRoute>
  );
}
