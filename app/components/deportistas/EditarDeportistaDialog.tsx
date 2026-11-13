"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { TIPOS_DOCUMENTO, type Deportista, type Estado, type Genero, type Nivel } from "@/app/deportistas/types";

interface FormEdicion {
  id: number | "";
  nombre: string;
  apellidos: string;
  numeroDocumento: string;
  tipoDocumento: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  generoId: number;
  estadoId: number;
  altura: number;
  peso: number;
  nivelActualId: number;
  fechaRegistro: string;
  contactoEmergencia: string;
  convenioId: number | "";
}

function desdeDeportista(d: Deportista | null): FormEdicion {
  return {
    id: d?.deportistaId || "",
    nombre: d?.nombre || "",
    apellidos: d?.apellidos || "",
    numeroDocumento: d?.numeroDocumento || "",
    tipoDocumento: d?.tipoDocumento || "",
    direccion: d?.direccion || "",
    telefono: d?.telefono || "",
    fechaNacimiento: d?.fechaNacimiento || "",
    generoId: d?.generoId || 1,
    estadoId: d?.estadoId || 1,
    altura: d?.altura || 0,
    peso: d?.peso || 0,
    nivelActualId: d?.nivelActualId || 0,
    fechaRegistro: d?.fechaRegistro || "",
    contactoEmergencia: d?.contactoEmergencia || "",
    convenioId: d?.convenioId ?? "",
  };
}

interface Props {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  deportista: Deportista | null;
  niveles: Nivel[];
  generos: Genero[];
  estados: Estado[];
  /** Se llama después de guardar (para recargar la lista). */
  onGuardado: () => void;
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-primary"></span>
        {titulo}
      </h3>
      {children}
    </div>
  );
}

function Campo({ etiqueta, className, children }: { etiqueta: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground">{etiqueta}</Label>
      {children}
    </div>
  );
}

export default function EditarDeportistaDialog({
  open,
  onOpenChange,
  deportista,
  niveles,
  generos,
  estados,
  onGuardado,
}: Props) {
  const [form, setForm] = useState<FormEdicion>(desdeDeportista(deportista));

  // Llena el formulario cada vez que se abre con un deportista.
  useEffect(() => {
    if (deportista) setForm(desdeDeportista(deportista));
  }, [deportista, open]);

  const cambiar = (campo: keyof FormEdicion, valor: string | number) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const guardar = () => {
    if (!form.nombre.trim() || !form.apellidos.trim() || !form.numeroDocumento.trim() || !form.tipoDocumento) {
      toast.error("Completa nombre, apellidos, tipo y número de documento.");
      return;
    }
    api
      .put(`/api/deportistas/${form.id}`, form, { withCredentials: true })
      .then(() => {
        onOpenChange(false);
        onGuardado();
        toast.success("Deportista actualizado correctamente");
      })
      .catch((error) => {
        console.error("Error al actualizar deportista", error);
        toast.error(error?.response?.data?.message || error?.response?.data || "No se pudo actualizar el deportista.");
      });
  };

  // Retirar y Reactivar tienen efectos (inscripción, grupo, usuario): se hacen con sus botones de la
  // tabla, no cambiando el estado a mano. El backend también lo exige.
  const idRetirado = estados.find((e) => e.estado === "Retirado")?.id;
  const yaRetirado = idRetirado !== undefined && deportista?.estadoId === idRetirado;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 max-sm:top-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none">
        <DialogHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pt-6 max-sm:pr-12">
          <DialogTitle>Editar Deportista</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex items-center gap-2 mb-3">
            <Label className="text-base font-display font-semibold text-foreground">Estado del Deportista</Label>
          </div>
          <Select
            value={form.estadoId?.toString()}
            disabled={yaRetirado}
            onValueChange={(value) => cambiar("estadoId", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              {estados.map((estado) => (
                <SelectItem
                  key={estado.id}
                  value={estado.id.toString()}
                  disabled={estado.id === idRetirado && !yaRetirado}
                >
                  {estado.estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {yaRetirado ? (
            <p className="text-xs text-muted-foreground -mt-4">
              Está retirado. Para volver a activarlo usa el botón <strong>Reactivar</strong> de la tabla.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground -mt-4">
              Para retirarlo usa el botón <strong>Retirar</strong> de la tabla.
            </p>
          )}

          <Seccion titulo="Información Personal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo etiqueta="Nombre">
                <Input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} className="mt-1" />
              </Campo>
              <Campo etiqueta="Apellidos">
                <Input value={form.apellidos} onChange={(e) => cambiar("apellidos", e.target.value)} className="mt-1" />
              </Campo>
              <Campo etiqueta="Tipo de documento">
                <Select value={form.tipoDocumento} onValueChange={(value) => cambiar("tipoDocumento", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo etiqueta="Número de documento">
                <Input
                  value={form.numeroDocumento}
                  onChange={(e) => cambiar("numeroDocumento", e.target.value)}
                  className="mt-1"
                />
              </Campo>
              <Campo etiqueta="Fecha de nacimiento">
                <Input
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => cambiar("fechaNacimiento", e.target.value)}
                  className="mt-1"
                />
              </Campo>
              <Campo etiqueta="Género">
                <Select value={form.generoId?.toString()} onValueChange={(value) => cambiar("generoId", parseInt(value))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    {generos.map((genero) => (
                      <SelectItem key={genero.id} value={genero.id.toString()}>
                        {genero.genero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
            </div>
          </Seccion>

          <Seccion titulo="Datos de Contacto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo etiqueta="Teléfono">
                <Input value={form.telefono} onChange={(e) => cambiar("telefono", e.target.value)} className="mt-1" />
              </Campo>
              <Campo etiqueta="Dirección">
                <Input value={form.direccion} onChange={(e) => cambiar("direccion", e.target.value)} className="mt-1" />
              </Campo>
              <Campo etiqueta="Contacto de emergencia" className="md:col-span-2">
                <Input
                  value={form.contactoEmergencia}
                  onChange={(e) => cambiar("contactoEmergencia", e.target.value)}
                  className="mt-1"
                />
              </Campo>
            </div>
          </Seccion>

          <Seccion titulo="Medidas Físicas">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Campo etiqueta="Altura (cm)">
                <Input
                  type="number"
                  value={form.altura}
                  onChange={(e) => cambiar("altura", parseInt(e.target.value))}
                  className="mt-1"
                />
              </Campo>
              <Campo etiqueta="Peso (kg)">
                <Input
                  type="number"
                  value={form.peso}
                  onChange={(e) => cambiar("peso", parseInt(e.target.value))}
                  className="mt-1"
                />
              </Campo>
              <Campo etiqueta="Nivel">
                <Select
                  value={form.nivelActualId?.toString()}
                  onValueChange={(value) => cambiar("nivelActualId", parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveles.map((nivel) => (
                      <SelectItem key={nivel.id} value={nivel.id.toString()}>
                        {nivel.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
            </div>
          </Seccion>

          <Seccion titulo="Fechas Importantes">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo etiqueta="Fecha de Registro">
                <Input
                  type="date"
                  value={form.fechaRegistro}
                  onChange={(e) => cambiar("fechaRegistro", e.target.value)}
                  className="mt-1"
                />
              </Campo>
            </div>
          </Seccion>
        </div>
        <DialogFooter className="gap-3 px-6 pb-6 pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}