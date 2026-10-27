"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/api";
import {
  portalMarcarAvisoVisto,
  portalMarcarAvisosVistos,
  portalNotificaciones,
  type ListaAvisos,
} from "@/app/lib/portal";

/** Avisos del club para este usuario (p. ej. recordatorios de pago). No se muestra si no hay ninguno. */
export default function AvisosPortal() {
  const [datos, setDatos] = useState<ListaAvisos | null>(null);
  const [verTodos, setVerTodos] = useState(false);

  const cargar = useCallback(() => {
    portalNotificaciones()
      .then(setDatos)
      .catch(() => setDatos(null)); // los avisos son accesorios: si fallan, el portal sigue
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!datos || datos.items.length === 0) return null;

  const visibles = verTodos ? datos.items : datos.items.filter((n) => !n.vista).slice(0, 5);
  if (visibles.length === 0 && !verTodos) {
    return (
      <div className="print:hidden">
        <Button variant="ghost" size="sm" onClick={() => setVerTodos(true)}>
          <Bell className="h-4 w-4 mr-1" /> Ver avisos anteriores
        </Button>
      </div>
    );
  }

  const marcar = async (id: number) => {
    try {
      await portalMarcarAvisoVisto(id);
      cargar();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudo marcar el aviso"));
    }
  };

  const marcarTodos = async () => {
    try {
      await portalMarcarAvisosVistos();
      cargar();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudieron marcar los avisos"));
    }
  };

  return (
    <Card className="print:hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" /> Avisos del club
          {datos.noVistas > 0 && <Badge variant="destructive">{datos.noVistas}</Badge>}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setVerTodos((v) => !v)}>
            {verTodos ? "Solo nuevos" : "Ver todos"}
          </Button>
          {datos.noVistas > 0 && (
            <Button variant="ghost" size="sm" onClick={marcarTodos}>
              <Check className="h-4 w-4 mr-1" /> Marcar todos como leídos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibles.map((n) => (
          <div key={n.id} className={`rounded-md border p-3 text-sm ${n.vista ? "opacity-60" : "bg-muted/30"}`}>
            <p className="whitespace-pre-line">{n.mensaje}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{new Date(n.fecha).toLocaleString("es-CO")}</span>
              {!n.vista && (
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => marcar(n.id)}>
                  Marcar como leído
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
