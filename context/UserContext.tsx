"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api, getAuthToken, clearAuthToken } from "@/lib/api";

// Definir el tipo de usuario y permisos si lo deseas (opcional, recomendado con TypeScript)
interface User {
  id: number;
  username: string;
  email: string;
  rol: string;
  // ...otros campos
}

interface UserContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  permissions: [],
  loading: true,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
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

        setUser(userResponse.data);
        setPermissions(permissionsResponse.data);
      } catch (error) {
        clearAuthToken();

        if (error instanceof Error) {
          console.error("Error al obtener datos del usuario:", error);
        }

        setUser(null);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <UserContext.Provider value={{ user, permissions, loading, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
