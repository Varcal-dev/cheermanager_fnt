"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { aUsuario, type PersonaResumen, type Rol, type Usuario } from "./types";

/** Lista de usuarios, roles y (si el usuario puede verlas) personas para asociar. */
export function useUsuariosData() {
  const { permissions } = useUser();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [personas, setPersonas] = useState<PersonaResumen[]>([]);

  const recargar = useCallback(async () => {
    try {
      const response = await api.get("/api/usuario/listar");
      setUsuarios(response.data.map(aUsuario));
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.error("No se pudieron cargar los usuarios");
    } finally {
      setCargandoInicial(false);
    }
  }, []);

  useEffect(() => {
    recargar();
    api
      .get("/api/usuario/rol/listar")
      .then((res) => res.data && setRoles(res.data))
      .catch((error) => console.error("Error fetching roles:", error));
  }, [recargar]);

  // /api/personas exige ver_persona: solo se pide si el usuario lo tiene.
  const puedeVerPersonas = permissions.includes("ver_persona");
  useEffect(() => {
    if (!puedeVerPersonas) return;
    // GET /api/personas (antes /api/personas/listar, que ya no existe en el back)
    api
      .get("/api/personas")
      .then((res) => setPersonas(res.data))
      .catch((error) => {
        console.error("Error al obtener personas:", error);
        toast.error("No se pudieron cargar las personas");
      });
  }, [puedeVerPersonas]);

  return { usuarios, cargandoInicial, roles, personas, recargar };
}
