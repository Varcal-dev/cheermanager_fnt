"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFecha } from "@/app/lib/facturas-pagos";
import { saludClub, saludPortal, type DatosSalud, type RestriccionSalud } from "@/app/lib/perfil-deportista";

const ESTADO: Record<RestriccionSalud, { texto: string; variante: "success" | "secondary" | "destructive" }> = {
  SIN_RESTRICCION: { texto: "Sin restricción", variante: "success" },
  MODIFICADO: { texto: "Entrenamiento modificado", variante: "secondary" },
  SIN_ENTRENAR: { texto: "No entrena", variante: "destructive" },
};

const ZONA: Record<string, string> = {
  CABEZA_CUELLO: "Cabeza y cuello",
  HOMBRO: "Hombro",
  CODO_MUNECA_MANO: "Codo, muñeca o mano",
  ESPALDA: "Espalda",
  CADERA: "Cadera",
  RODILLA: "Rodilla",
  TOBILLO_PIE: "Tobillo o pie",
  MUSCULAR: "Muscular",
  OTRA: "Otra",
};
const GRAVEDAD: Record<string, string> = { LEVE: "Leve", MODERADA: "Moderada", GRAVE: "Grave" };
const FASE: Record<string, string> = { ACTIVA: "Activa", EN_RETORNO: "En retorno", ALTA: "Alta" };

/**
 * Salud del perfil. La familia (portal) ve el estado y el diagnóstico de la lesión abierta; el personal con
 * ver_lesiones ve además los seguimientos y las lesiones ya dadas de alta (el back decide qué llega).
 */
export default function SeccionSalud({ deportistaId, modo }: { deportistaId: number; modo: "club" | "portal" }) {
  const [datos, setDatos] = useState<DatosSalud | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    setDatos(null);
    setError(false);
    (modo === "club" ? saludClub : saludPortal)(deportistaId)
      .then((d) => vigente && setDatos(d))
      .catch(() => vigente && setError(true));
    return () => {
      vigente = false;
    };
  }, [deportistaId, modo]);

  const estado = datos ? ESTADO[datos.restriccion] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Salud
          {estado && <Badge variant={estado.variante}>{estado.texto}</Badge>}
        </CardTitle>
        <CardDescription>
          {modo === "portal" ? "Estado y diagnóstico. El seguimiento lo lleva el club." : "Lesiones, restricción y seguimiento."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error ? (
          <p className="text-muted-foreground">No se pudo cargar la salud.</p>
        ) : !datos ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : datos.vigentes.length === 0 ? (
          <p className="text-muted-foreground">Sin lesiones vigentes.</p>
        ) : (
          datos.vigentes.map((l) => (
            <div key={l.id} className="space-y-1 rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {ZONA[l.zona] ?? l.zona} · {GRAVEDAD[l.gravedad] ?? l.gravedad}
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant="outline">{FASE[l.estado] ?? l.estado}</Badge>
                  <Badge variant={ESTADO[l.restriccion].variante}>{ESTADO[l.restriccion].texto}</Badge>
                </span>
              </div>
              <p>{l.descripcion}</p>
              <p className="text-muted-foreground">
                Desde {formatFecha(l.fechaLesion)}
                {l.fechaEstimadaRetorno ? ` · retorno estimado ${formatFecha(l.fechaEstimadaRetorno)}` : ""}
                {l.retornoAtrasado ? " (atrasado)" : ""}
              </p>
              {l.seguimientos && l.seguimientos.length > 0 && (
                <ul className="space-y-1 border-t pt-2">
                  {l.seguimientos.map((n, i) => (
                    <li key={i}>
                      <span className="text-muted-foreground">{formatFecha(n.fecha)}: </span>
                      {n.nota}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}

        {datos?.historial && datos.historial.length > 0 && (
          <div className="space-y-1">
            <p className="font-medium">Lesiones anteriores</p>
            {datos.historial.map((h) => (
              <p key={h.id} className="text-muted-foreground">
                {formatFecha(h.fechaLesion)} · {ZONA[h.zona] ?? h.zona} ({GRAVEDAD[h.gravedad] ?? h.gravedad}) · {h.descripcion} ·{" "}
                {h.dias} días{h.fechaAlta ? `, alta ${formatFecha(h.fechaAlta)}` : ""}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
