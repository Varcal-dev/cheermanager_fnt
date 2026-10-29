"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, getErrorMessage } from "@/lib/api";
import type { GeneroCatalogo, PersonaResumen, Rol } from "@/app/usuarios/types";

type TipoAsociacion = "ninguna" | "nueva" | "existente";

const FORM_INICIAL = {
  username: "",
  email: "",
  rolId: 0,
  nombre: "",
  apellidos: "",
  direccion: "",
  telefono: "",
  fechaNacimiento: "",
  generoId: 0,
};

// Clave aleatoria que nadie ve: la persona entra con la clave temporal que se genera justo después.
function claveAleatoria(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

interface Props {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  roles: Rol[];
  /** Personas que se pueden asociar (vacío si el usuario no tiene ver_persona). */
  personas: PersonaResumen[];
  /** Se llama con el usuario recién creado, para que la pantalla genere su clave temporal. */
  onCreado: (usuario: { id: number; username: string } | null) => void;
}

export default function NuevoUsuarioDialog({ open, onOpenChange, roles, personas, onCreado }: Props) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [tipoAsociacion, setTipoAsociacion] = useState<TipoAsociacion>("ninguna");
  const [busquedaPersona, setBusquedaPersona] = useState("");
  const [personaId, setPersonaId] = useState<number | null>(null);
  const [generos, setGeneros] = useState<GeneroCatalogo[]>([]);
  const [guardando, setGuardando] = useState(false);

  // El catálogo de géneros solo se necesita al crear una persona nueva: se pide al abrir.
  useEffect(() => {
    if (!open) return;
    api
      .get("/api/usuario/genero/listar")
      .then((res) => res.data && setGeneros(res.data))
      .catch((error) => console.error("Error fetching genders:", error));
  }, [open]);

  const cambiarTexto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const personasFiltradas = personas.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(busquedaPersona.toLowerCase()) ||
      p.apellidos?.toLowerCase().includes(busquedaPersona.toLowerCase()),
  );

  const guardar = async () => {
    if (!form.username.trim()) {
      toast.error("El nombre de usuario es obligatorio");
      return;
    }
    if (!form.rolId) {
      toast.error("Selecciona un rol");
      return;
    }
    if (tipoAsociacion === "existente" && !personaId) {
      toast.error("Selecciona la persona a asociar, o elige \"Sin persona\".");
      return;
    }
    if (tipoAsociacion === "nueva" && (!form.nombre.trim() || !form.apellidos.trim())) {
      toast.error("Escribe el nombre y los apellidos de la persona nueva.");
      return;
    }

    setGuardando(true);
    try {
      // El username y el email son únicos en TODA la plataforma (no solo en tu club).
      // Si no se escribe un correo real se usa uno ficticio: sirve para iniciar sesión,
      // pero la recuperación de clave por correo no funcionará con él.
      const username = form.username.trim();
      const base = {
        username,
        password: claveAleatoria(),
        email: form.email.trim() || `${username}@cheermanager.com`,
        rolId: form.rolId,
      };

      let datos: Record<string, unknown>;
      if (tipoAsociacion === "nueva") {
        datos = {
          ...base,
          personaId: null,
          nombre: form.nombre,
          apellidos: form.apellidos,
          direccion: form.direccion,
          telefono: form.telefono,
          fechaNacimiento: form.fechaNacimiento,
          generoId: form.generoId || null,
        };
      } else if (tipoAsociacion === "existente") {
        datos = { ...base, personaId };
      } else {
        datos = { ...base, personaId: null };
      }

      const response = await api.post("/api/usuario/registrar", datos);
      if (response.status === 200) {
        toast.success("Usuario agregado exitosamente");
        onOpenChange(false);
        setForm(FORM_INICIAL);
        setTipoAsociacion("ninguna");
        setPersonaId(null);
        setBusquedaPersona("");
        onCreado(response.data?.id ? { id: response.data.id, username: response.data.username } : null);
      }
    } catch (error) {
      console.error("Error al agregar usuario:", error);
      toast.error(getErrorMessage(error, "Error al registrar usuario"));
    } finally {
      setGuardando(false);
    }
  };

  const fila = "grid grid-cols-4 items-center gap-4";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
          <DialogDescription>Ingresa los datos del nuevo usuario. Haz clic en guardar cuando termines.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className={fila}>
            <Label htmlFor="username" className="text-right">
              Nombre de Usuario
            </Label>
            <Input id="username" value={form.username} onChange={cambiarTexto} className="col-span-3" />
          </div>
          <div className={fila}>
            <Label htmlFor="email" className="text-right">
              Correo
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={cambiarTexto}
              placeholder="Opcional (si no, se usa uno ficticio)"
              className="col-span-3"
            />
          </div>
          <div className={fila}>
            <Label className="text-right">Rol</Label>
            <Select
              value={form.rolId ? form.rolId.toString() : ""}
              onValueChange={(value) => setForm({ ...form, rolId: parseInt(value) })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((rol) => (
                  <SelectItem key={rol.id} value={rol.id.toString()}>
                    {rol.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="font-semibold">Asociación de Persona</Label>
            <div className="flex gap-4">
              {(
                [
                  ["ninguna", "Sin persona"],
                  ["nueva", "Nueva persona"],
                  ["existente", "Persona existente"],
                ] as [TipoAsociacion, string][]
              ).map(([valor, etiqueta]) => (
                <label key={valor} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="asociacion"
                    value={valor}
                    checked={tipoAsociacion === valor}
                    onChange={() => {
                      setTipoAsociacion(valor);
                      setPersonaId(null);
                    }}
                  />
                  {etiqueta}
                </label>
              ))}
            </div>
          </div>

          {tipoAsociacion === "existente" && (
            <div className={fila}>
              <Label htmlFor="searchPersona" className="text-right col-span-1">
                Buscar Persona
              </Label>
              <Input
                id="searchPersona"
                type="text"
                value={busquedaPersona}
                onChange={(e) => setBusquedaPersona(e.target.value)}
                className="col-span-3"
                placeholder="Escribe nombre o apellido"
              />
              {personasFiltradas.length > 0 && (
                <>
                  <Label className="text-right col-span-1">Seleccionar</Label>
                  <Select
                    value={personaId ? String(personaId) : ""}
                    onValueChange={(v) => setPersonaId(v ? parseInt(v) : null)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccione una persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {personasFiltradas.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre} {p.apellidos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          )}

          {tipoAsociacion === "nueva" && (
            <>
              <div className={fila}>
                <Label htmlFor="nombre" className="text-right">
                  Nombre Persona
                </Label>
                <Input id="nombre" value={form.nombre} onChange={cambiarTexto} className="col-span-3" />
              </div>
              <div className={fila}>
                <Label htmlFor="apellidos" className="text-right">
                  Apellidos Persona
                </Label>
                <Input id="apellidos" value={form.apellidos} onChange={cambiarTexto} className="col-span-3" />
              </div>
              <div className={fila}>
                <Label htmlFor="direccion" className="text-right">
                  Dirección
                </Label>
                <Input id="direccion" value={form.direccion} onChange={cambiarTexto} className="col-span-3" />
              </div>
              <div className={fila}>
                <Label htmlFor="telefono" className="text-right">
                  Teléfono
                </Label>
                <Input id="telefono" value={form.telefono} onChange={cambiarTexto} className="col-span-3" />
              </div>
              <div className={fila}>
                <Label htmlFor="fechaNacimiento" className="text-right">
                  Fecha de Nacimiento
                </Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={cambiarTexto}
                  className="col-span-3"
                />
              </div>
              <div className={fila}>
                <Label className="text-right">Género</Label>
                <Select
                  value={form.generoId ? form.generoId.toString() : ""}
                  onValueChange={(value) => setForm({ ...form, generoId: parseInt(value) })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un género" />
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
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar Usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
