"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, getAuthToken, clearAuthToken } from "@/lib/api";

// El backend expone el usuario autenticado vía GET /api/usuario/me, que devuelve
// un UsuarioDTO (ver com.varcal.cheermanager.DTO.Ath.UsuarioDTO). Ojo: ese DTO NO
// trae un campo "rol" sino "rolNombre" (string) y "rolId" (número), y trae los
// datos de la persona asociada aplanados (nombre, apellidos, etc.), no anidados
// bajo "persona". Mapeamos aquí a la forma que usa el resto del front.
interface User {
  id: number;
  username: string;
  email: string;
  rol: string;
  rolId: number | null;
  requiereCambioPassword: boolean;
}

interface UserContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  /** true para el superadmin de la plataforma (club 1): tiene el permiso gestionar_clubes. */
  esPlataforma: boolean;
  /** true si este usuario puede aceptar términos del club y el club aún tiene documentos legales pendientes. */
  legalPendiente: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  permissions: [],
  loading: true,
  esPlataforma: false,
  legalPendiente: false,
  setUser: () => {},
  refreshUser: async () => {},
});

const mapUsuarioDTO = (data: any): User => ({
  id: data.id,
  username: data.username,
  email: data.email,
  rol: data.rolNombre ?? "",
  rolId: data.rolId ?? null,
  requiereCambioPassword: Boolean(data.requiereCambioPassword),
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [legalPendiente, setLegalPendiente] = useState(false);

  const fetchUserData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const [userResponse, permissionsResponse] = await Promise.all([
        api.get("/api/usuario/me"),
        api.get("/api/usuario/permisos"),
      ]);

      setUser(mapUsuarioDTO(userResponse.data));
      const permisos: string[] = permissionsResponse.data ?? [];
      setPermissions(permisos);

      // Bloque legal (L1): solo quien puede aceptar (Administrador del club) es llevado a la pantalla de
      // términos. Los demás siguen navegando; el backend rechaza sus escrituras (428) hasta que se acepte.
      let pendiente = false;
      if (permisos.includes("aceptar_terminos")) {
        try {
          const legal = await api.get("/api/legal/estado");
          pendiente = legal.data?.alDia === false;
        } catch {
          pendiente = false;
        }
      }
      setLegalPendiente(pendiente);
    } catch (error) {
      // Token inválido/expirado o el backend no respondió: cerramos sesión local.
      clearAuthToken();

      if (error instanceof Error) {
        console.error("Error al obtener datos del usuario:", error);
      }

      setUser(null);
      setPermissions([]);
      setLegalPendiente(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <UserContext.Provider
      value={{
        user,
        permissions,
        loading,
        esPlataforma: permissions.includes("gestionar_clubes"),
        legalPendiente,
        setUser,
        refreshUser: fetchUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);