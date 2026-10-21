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
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  permissions: [],
  loading: true,
  esPlataforma: false,
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
      setPermissions(permissionsResponse.data ?? []);
    } catch (error) {
      // Token inválido/expirado o el backend no respondió: cerramos sesión local.
      clearAuthToken();

      if (error instanceof Error) {
        console.error("Error al obtener datos del usuario:", error);
      }

      setUser(null);
      setPermissions([]);
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
        setUser,
        refreshUser: fetchUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);