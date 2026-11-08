"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { TIPOS_DOCUMENTO, type Genero, type Nivel } from "@/app/deportistas/types";
import { FICHA_VACIA, catalogoFicha, guardarFicha, type FichaForm } from "@/app/lib/ficha-deportiva";
import type { Habilidad } from "@/app/lib/habilidades";
import FichaDeportivaForm from "./FichaDeportivaForm";

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
  nivelActualId: 0, // opcional: el nivel del club se asigna tras evaluar (ids de nivel son por club)
  fechaRegistro: "",
  contactoEmergencia: "",
  convenioId: null as number | null,
};

/** Lo que se le entrega a quien usa el formulario después de guardar. */
export interface DeportistaPreinscrito {
  /** id del deportista creado (null si el servidor no lo devolvió). */
  id: number | null;
  nombreCompleto: string;
  nivelNombre: string;
  /** false si el deportista quedó guardado pero la ficha (experiencia/tallas) no se pudo guardar. */
  fichaGuardada: boolean;
}

interface Props {
  niveles: Nivel[];
  generos: Genero[];
  /** Se llama después de guardar con éxito. */
  onGuardado: (deportista: DeportistaPreinscrito) => void;
  textoBoton?: string;
}

/**
 * Formulario de registro (pre-inscripción) de un deportista. Lo usan la página /pre-inscribir y el
 * diálogo "Nuevo Deportista" de /deportistas, así los dos siempre piden lo mismo.
 */
export default function PreinscripcionForm({ niveles, generos, onGuardado, textoBoton = "Guardar" }: Props) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [ficha, setFicha] = useState<FichaForm>(FICHA_VACIA);
  const [catalogo, setCatalogo] = useState<Habilidad[]>([]);

  useEffect(() => {
    catalogoFicha().then(setCatalogo).catch(() => toast.error("No se pudo cargar el glosario de habilidades."));
  }, []);

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
      !form.generoId
    ) {
      toast.error("Completa nombre, apellidos, tipo y número de documento, fecha de nacimiento y género.");
      return;
    }
    if (ficha.tieneExperiencia === null) {
      toast.error("Indica si el deportista tiene experiencia en cheerleading.");
      return;
    }
    if (ficha.tieneExperiencia && !ficha.nivelDeclarado) {
      toast.error("Indica el nivel que el deportista cree tener.");
      return;
    }
    if (documentoDisponible === false) {
      toast.error("Ese número de documento ya está registrado.");
      return;
    }
    setGuardando(true);
    try {
      const res = await api.post(
        "/api/deportistas",
        {
          ...form,
          altura: Number(form.altura),
          peso: Number(form.peso),
          fechaRegistro: String(form.fechaRegistro),
          generoId: Number(form.generoId),
          estadoId: Number(form.estadoId),
          nivelActualId: form.nivelActualId ? Number(form.nivelActualId) : null,
          convenioId: form.convenioId ? Number(form.convenioId) : null,
        },
        { withCredentials: true },
      );
      const nuevoId: number | null = typeof res.data?.id === "number" ? res.data.id : null;
      let fichaGuardada = false;
      if (nuevoId !== null) {
        try {
          await guardarFicha(nuevoId, ficha);
          fichaGuardada = true;
        } catch {
          toast.warn("El deportista se guardó, pero no se pudo guardar su ficha (experiencia y tallas). Complétala en su detalle.");
        }
      }
      toast.success("Deportista guardado exitosamente");
      const resumen: DeportistaPreinscrito = {
        fichaGuardada,
        id: nuevoId,
        nombreCompleto: `${form.nombre.trim()} ${form.apellidos.trim()}`,
        nivelNombre: niveles.find((n) => n.id === Number(form.nivelActualId))?.nombre ?? "",
      };
      setForm(FORM_INICIAL);
      setFicha(FICHA_VACIA);
      setDocumentoDisponible(null);
      onGuardado(resumen);
    } catch (error: any) {
      console.error("Error al guardar deportista", error);
      toast.error(error?.response?.data?.message || error?.response?.data || "No se pudo guardar el deportista.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="nivel-select">Nivel en el club (opcional)</Label>
          <Select
            value={form.nivelActualId ? form.nivelActualId.toString() : ""}
            onValueChange={(value) => setForm({ ...form, nivelActualId: Number(value) })}
          >
            <SelectTrigger id="nivel-select" className="w-full">
              <SelectValue placeholder="Se define tras evaluar" />
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
      <div className="rounded-md border p-4 space-y-3">
        <h3 className="font-semibold">Experiencia y tallas</h3>
        <FichaDeportivaForm value={ficha} onChange={setFicha} catalogo={catalogo} />
      </div>
      <div className="flex justify-end">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : textoBoton}
        </Button>
      </div>
    </div>
  );
}