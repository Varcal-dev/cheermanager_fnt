"use client";

import { useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, clearAuthToken, datosSoporte, setAuthToken } from "@/lib/api";

/** Clave (en sessionStorage, por pestaña) donde se guarda el token del superadmin mientras está en modo soporte. */
export const TOKEN_PLATAFORMA_KEY = "cheer_manager_token_plataforma";

/** Cambia a la sesión de soporte de un club: guarda el token actual del superadmin y activa el de soporte. */
export function entrarComoSoporte(tokenSoporte: string, tokenActual: string | null) {
  try {
    if (tokenActual) sessionStorage.setItem(TOKEN_PLATAFORMA_KEY, tokenActual);
  } catch {
    /* sin sessionStorage: al volver se pedirá iniciar sesión */
  }
  setAuthToken(tokenSoporte);
  window.location.href = "/";
}

/** Franja visible mientras el superadmin trabaja dentro de un club como su administrador. */
export default function SoporteBanner() {
  const [info, setInfo] = useState<{ club: string; por: string } | null>(null);

  useEffect(() => {
    setInfo(datosSoporte());
  }, []);

  if (!info) return null;

  const volver = async () => {
    try {
      await api.post("/api/logout", {}); // revoca el token de soporte y deja registro
    } catch {
      /* se vuelve igual */
    }
    let guardado: string | null = null;
    try {
      guardado = sessionStorage.getItem(TOKEN_PLATAFORMA_KEY);
      sessionStorage.removeItem(TOKEN_PLATAFORMA_KEY);
    } catch {
      guardado = null;
    }
    if (guardado) {
      setAuthToken(guardado);
      window.location.href = "/clubes";
    } else {
      clearAuthToken();
      window.location.href = "/login";
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <span className="flex items-center gap-2">
        <LifeBuoy className="h-4 w-4" />
        Modo soporte en <strong>{info.club}</strong> como administrador. Cada acción cuenta como del club; la sesión dura 1 hora.
      </span>
      <Button size="sm" variant="outline" onClick={volver}>
        Volver a Plataforma
      </Button>
    </div>
  );
}
