"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { TIPOS_DOCUMENTO, type Genero, type Nivel } from "@/app/deportistas/types";

const FORM_INICIAL = {
  nombre: "",
  apellidos: "",
  numeroDocumento: "",
  tipoDocumento: "",
  direccion: "",
  telefono: "",
  fechaNacimiento: "",
  generoId: 0,
  estadoId: 1, // el estado inicial lo fija el sistema; no se elige aquí
  altura: 0,
  peso: 0,
  nivelActualId: 0, // los ids de nivel son por club: se elige en el formulario
  fechaRegistro: "",
  contactoEmergencia: "",
  convenioId: null as number | null,
};

interface Props {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  niveles: Nivel[];
  generos: Genero[];
  /** Se llama después de guardar (para recargar la lista). */
  onGuardado: () => void;
}

export default function NuevoDeportistaDialog({ open, onOpenChange, niveles, generos, onGuardado }: Props) {
  const [form, setForm] = useState(FORM_INICIAL);

  // Validación de documento único en vivo (el back expone /api/deportistas/validar-documento).
  const [documentoDisponible, setDocumentoDisponible] = useState<boolean | null>(null);
  const [validandoDocumento, setValidandoDocumento] = useState(false);

  const validarDocumento = async (numeroDocumento: string) => {
    if (!numeroDocumento.trim()) {
      setDocumentoDisponible(null);
      return;
    }
    try {
      setValidandoDocumento(true);
      const res = await api.post("/api/deportistas/validar-documento", null, {
        params: { documento: numeroDocumento },
      });
      setDocumentoDisponible(res.data.disponible);
    } catch (error) {
      console.error("Error al validar documento", error);
      setDocumentoDisponible(null);
    } finally {
      setValidandoDocumento(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "numeroDocumento") setDocumentoDisponible(null);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardar = async () => {
    if (
      !form.nombre.trim() ||
      !form.apellidos.trim() ||
      !form.numeroDocumento.trim() ||
      !form.tipoDocumento ||
      !form.fechaNacimiento ||
      !form.generoId ||
      !form.nivelActualId
    ) {
      toast.error("Completa nombre, apellidos, tipo y número de documento, fecha de nacimiento, género y nivel.");
      return;
    }
    if (documentoDisponible === false) {
      toast.error("Ese número de documento ya está registrado.");
      return;
    }
    try {
      await api.post(
        "/api/deportistas",
        {
          ...form,
          altura: Number(form.altura),
          peso: Number(form.peso),
          fechaRegistro: String(form.fechaRegistro),
          generoId: Number(form.generoId),
          estadoId: Number(form.estadoId),
          nivelActualId: Number(form.nivelActualId),
          convenioId: form.convenioId ? Number(form.convenioId) : null,
        },
        { withCredentials: true },
      );
      toast.success("Deportista guardado exitosamente");
      onGuardado();
      onOpenChange(false);
      setForm(FORM_INICIAL);
      setDocumentoDisponible(null);
    } catch (error: any) {
      console.error("Error al guardar deportista", error);
      toast.error(error?.response?.data?.message || error?.response?.data || "No se pudo guardar el deportista.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Deportista</DialogTitle>
          <DialogDescription>Completa el formulario para agregar un nuevo deportista al sistema.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input name="nombre" value={form.nombre} onChange={handleInputChange} />
            </div>
            <div>
              <Label>Apellidos</Label>
              <Input name="apellidos" value={form.apellidos} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="tipo-documento-select">Tipo de documento</Label>
              <Select value={form.tipoDocumento} onValueChange={(value) => setForm({ ...form, tipoDocumento: value })}>
                <SelectTrigger id="tipo-documento-select" className="w-full">
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
            </div>
            <div>
              <Label>Número de documento</Label>
              <Input
                name="numeroDocumento"
                value={form.numeroDocumento}
                onChange={handleInputChange}
                onBlur={(e) => validarDocumento(e.target.value)}
              />
              {validandoDocumento && <p className="text-xs text-muted-foreground mt-1">Validando documento...</p>}
              {!validandoDocumento && documentoDisponible === false && (
                <p className="text-xs text-destructive mt-1">Este documento ya está registrado.</p>
              )}
              {!validandoDocumento && documentoDisponible === true && (
                <p className="text-xs text-success mt-1">Documento disponible.</p>
              )}
            </div>
            <div>
              <Label>Dirección</Label>
              <Input name="direccion" value={form.direccion} onChange={handleInputChange} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input name="telefono" value={form.telefono} onChange={handleInputChange} />
            </div>
            <div>
              <Label>Fecha Nacimiento</Label>
              <Input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleInputChange} />
            </div>
            <div>
              <Label>Altura (cm)</Label>
              <Input type="number" name="altura" value={form.altura} onChange={handleInputChange} />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input type="number" name="peso" value={form.peso} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="genero-select">Género</Label>
              <Select
                value={form.generoId ? form.generoId.toString() : ""}
                onValueChange={(value) => setForm({ ...form, generoId: Number(value) })}
              >
                <SelectTrigger id="genero-select" className="w-full">
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent>
                  {generos.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.genero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nivel-select">Nivel</Label>
              <Select
                value={form.nivelActualId ? form.nivelActualId.toString() : ""}
                onValueChange={(value) => setForm({ ...form, nivelActualId: Number(value) })}
              >
                <SelectTrigger id="nivel-select" className="w-full">
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
            </div>
            <div>
              <Label>Contacto Emergencia</Label>
              <Input name="contactoEmergencia" value={form.contactoEmergencia} onChange={handleInputChange} />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={guardar}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
