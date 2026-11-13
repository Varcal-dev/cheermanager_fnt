"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { api, clearAuthToken } from "@/lib/api";
import { useUser } from "@/context/UserContext";

/** Cierre de sesión compartido por la barra superior (escritorio/tablet) y la hoja "Más" (teléfono). */
export function useLogout() {
  const router = useRouter();
  const { setUser } = useUser();

  return async () => {
    try {
      const response = await api.post("/api/logout", {});

      if (response.status === 200) {
        clearAuthToken();
        setUser(null);
        router.push("/login");
      } else {
        console.error("Error al cerrar sesión:", response.statusText);
        toast.error("Error al cerrar sesión. Por favor, inténtalo de nuevo.");
      }
    } catch (error: unknown) {
      console.error("Error en la petición de cierre de sesión:", error);
      toast.error("Error al cerrar sesión. Por favor, inténtalo de nuevo.");
    }
  };
}
