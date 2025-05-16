"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

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
    // Obtener los datos del usuario y permisos al cargar la aplicación
    const fetchUserData = async () => {
      try {
        const userResponse = await axios.get(
          "http://localhost:8080/api/usuario/me",
          { withCredentials: true }
        );
        const permissionsResponse = await axios.get(
          "http://localhost:8080/api/usuario/permisos",
          { withCredentials: true }
        );

        setUser(userResponse.data);
        setPermissions(permissionsResponse.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            // Usuario no autenticado: es normal si no ha iniciado sesión
            console.warn("Usuario no autenticado.");
            toast.warning("Usuario no autenticado.");
          } else {
            console.error(
              "Error al obtener datos del usuario:",
              error.response?.status,
              error.message,
              toast.error("Error al obtener datos del usuario.")
            );
          }
        } else {
          console.error("Error desconocido:", error);
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
