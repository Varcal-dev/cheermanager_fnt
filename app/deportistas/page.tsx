"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import { api, getErrorMessage } from "@/lib/api";
import ClaveTemporalDialog, { generarClaveTemporal } from "@/app/components/Forms/ClaveTemporalDialog";
import DeportistaFila from "@/app/components/deportistas/DeportistaFila";
import EditarDeportistaDialog from "@/app/components/deportistas/EditarDeportistaDialog";
import FiltroEstadosDropdown from "@/app/components/deportistas/FiltroEstadosDropdown";
import DeportistaTarjeta from "@/app/components/deportistas/DeportistaTarjeta";
import NuevoDeportistaDialog from "@/app/components/deportistas/NuevoDeportistaDialog";
import ReactivarDeportistaDialog from "@/app/components/deportistas/ReactivarDeportistaDialog";
import RetirarDeportistaDialog from "@/app/components/deportistas/RetirarDeportistaDialog";
import type { Deportista } from "./types";
import { useDeportistasData } from "./useDeportistasData";

const ENCABEZADOS = ["Nombre", "Edad", "Género", "Nivel", "Grupos", "Estado", "Acciones"];

export default function DeportistasPage() {
  const { permissions } = useUser();
  const router = useRouter();
  const { deportistas, niveles, generos, estados, planesPago, noInscritos, recargar, recargarNoInscritos } =
    useDeportistasData();

  // Búsqueda (también llega por ?search= desde el buscador global) y filtro de estados.
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstados, setSelectedEstados] = useState<number[]>([]);
  const [soloSinMatricular, setSoloSinMatricular] = useState(false);
  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearchTerm(q);
  }, [searchParams]);

  // Fila expandida y diálogos abiertos.
  const [expandidos, setExpandidos] = useState<number[]>([]);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [editando, setEditando] = useState<Deportista | null>(null);
  const [editarAbierto, setEditarAbierto] = useState(false);
  const [aRetirar, setARetirar] = useState<number | null>(null);
  const [aReactivar, setAReactivar] = useState<{ id: number; nombre: string } | null>(null);

  // Los usuarios de deportistas nacen con una clave aleatoria que nadie conoce. El admin genera una
  // clave temporal y se la entrega a la familia; se muestra una sola vez.
  const [claveDeportista, setClaveDeportista] = useState<{ clave: string; username: string } | null>(null);
  const claveTemporalDeDeportista = async (deportistaId: number) => {
    try {
      const u = await api.get(`/api/deportistas/${deportistaId}/usuario`);
      const clave = await generarClaveTemporal(u.data.id);
      if (clave) setClaveDeportista({ clave, username: u.data.username });
    } catch (error) {
      toast.error(getErrorMessage(error, "Este deportista no tiene un usuario asociado"));
    }
  };

  const toggleExpandido = (id: number) =>
    setExpandidos((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const toggleEstado = (estadoId: number) =>
    setSelectedEstados((prev) => (prev.includes(estadoId) ? prev.filter((id) => id !== estadoId) : [...prev, estadoId]));

  // Sin matricular = registrado, no retirado y sin inscripción.
  const sinMatricular = deportistas.filter((d) => noInscritos.has(d.deportistaId) && d.estadoNombre !== "Retirado");

  const termino = searchTerm.toLowerCase();
  const filtrados = deportistas.filter((d) => {
    const coincide =
      d.nombre.toLowerCase().includes(termino) ||
      (d.nivelNombre ?? "").toLowerCase().includes(termino) ||
      d.grupos.some((g) => g.toLowerCase().includes(termino));
    const porEstado = selectedEstados.length > 0 ? coincide && selectedEstados.includes(d.estadoId) : coincide;
    return soloSinMatricular ? porEstado && noInscritos.has(d.deportistaId) && d.estadoNombre !== "Retirado" : porEstado;
  });

  return (
    <ProtectedRoute requiredPermission="ver_deportista">
      <ClaveTemporalDialog
        clave={claveDeportista?.clave ?? null}
        username={claveDeportista?.username}
        onClose={() => setClaveDeportista(null)}
      />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight sm:text-3xl">Deportistas</h1>
            <p className="text-muted-foreground">Gestiona la información de los deportistas registrados</p>
          </div>
          {permissions.includes("crear_deportista") && (
            <Button onClick={() => setNuevoAbierto(true)} className="max-sm:min-h-11 max-sm:w-full">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Deportista
            </Button>
          )}
        </div>

        {sinMatricular.length > 0 && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning/50 bg-warning/10 p-3 text-sm"
          >
            <p>
              <strong>{sinMatricular.length}</strong>{" "}
              {sinMatricular.length === 1 ? "deportista registrado no está matriculado" : "deportistas registrados no están matriculados"}
              : sin inscripción no se les factura ni entran a un grupo.
            </p>
            <div className="flex flex-wrap gap-2 [&_button]:max-sm:min-h-11">
              <Button size="sm" variant={soloSinMatricular ? "default" : "outline"} onClick={() => setSoloSinMatricular((v) => !v)}>
                {soloSinMatricular ? "Ver todos" : "Ver solo sin matricular"}
              </Button>
              {permissions.includes("gestionar_inscripciones") && (
                <Button size="sm" onClick={() => router.push("/inscripciones")}>
                  Ir a Inscripciones
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex w-full items-center sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar deportistas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-9 md:h-9"
            />
          </div>
          <div className="flex space-x-2 items-center">
            <FiltroEstadosDropdown
              estados={estados}
              seleccionados={selectedEstados}
              onToggle={toggleEstado}
              onLimpiar={() => setSelectedEstados([])}
            />
          </div>
        </div>

        {/* Teléfono: tarjetas. Tablet y escritorio: tabla. */}
        <ul className="space-y-2 md:hidden">
          {filtrados.length === 0 ? (
            <li className="rounded-lg border bg-card py-10 text-center text-sm text-muted-foreground">
              {deportistas.length === 0
                ? "No hay deportistas inscritos aún."
                : "Ningún deportista coincide con la búsqueda o los filtros."}
            </li>
          ) : (
            filtrados.map((d) => (
              <DeportistaTarjeta
                key={d.deportistaId}
                deportista={d}
                expandido={expandidos.includes(d.deportistaId)}
                sinInscripcion={noInscritos.has(d.deportistaId)}
                niveles={niveles}
                planesPago={planesPago}
                onToggle={() => toggleExpandido(d.deportistaId)}
                onEditar={() => {
                  setEditando(d);
                  setEditarAbierto(true);
                }}
                onClave={() => claveTemporalDeDeportista(d.deportistaId)}
                onRetirar={() => setARetirar(d.deportistaId)}
                onReactivar={() => setAReactivar({ id: d.deportistaId, nombre: `${d.nombre} ${d.apellidos}` })}
                onNivelCambiado={recargar}
              />
            ))
          )}
        </ul>

        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px]"></TableHead>
                  {ENCABEZADOS.map((titulo) => (
                    <TableHead
                      key={titulo}
                      className="font-display text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      {titulo}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                        <p className="text-lg font-display font-semibold text-foreground">
                          {deportistas.length === 0
                            ? "No hay deportistas inscritos aún."
                            : "Ningún deportista coincide con la búsqueda o los filtros."}
                        </p>
                        {deportistas.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Puedes agregar uno usando el botón "Nuevo Deportista".
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((d) => (
                    <DeportistaFila
                      key={d.deportistaId}
                      deportista={d}
                      expandido={expandidos.includes(d.deportistaId)}
                      sinInscripcion={noInscritos.has(d.deportistaId)}
                      niveles={niveles}
                      planesPago={planesPago}
                      onToggle={() => toggleExpandido(d.deportistaId)}
                      onEditar={() => {
                        setEditando(d);
                        setEditarAbierto(true);
                      }}
                      onClave={() => claveTemporalDeDeportista(d.deportistaId)}
                      onRetirar={() => setARetirar(d.deportistaId)}
                      onReactivar={() => setAReactivar({ id: d.deportistaId, nombre: `${d.nombre} ${d.apellidos}` })}
                      onNivelCambiado={recargar}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <NuevoDeportistaDialog
          open={nuevoAbierto}
          onOpenChange={setNuevoAbierto}
          niveles={niveles}
          generos={generos}
          onGuardado={() => {
            recargar();
            recargarNoInscritos();
          }}
        />
        <EditarDeportistaDialog
          open={editarAbierto}
          onOpenChange={setEditarAbierto}
          deportista={editando}
          niveles={niveles}
          generos={generos}
          estados={estados}
          onGuardado={recargar}
        />
        <RetirarDeportistaDialog
          deportistaId={aRetirar}
          onClose={() => setARetirar(null)}
          onRetirado={() => {
            recargar();
            recargarNoInscritos();
          }}
        />
        <ReactivarDeportistaDialog
          deportista={aReactivar}
          onClose={() => setAReactivar(null)}
          onReactivado={() => {
            recargar();
            recargarNoInscritos();
          }}
        />
      </div>
    </ProtectedRoute>
  );
}