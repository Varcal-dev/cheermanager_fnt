"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFecha } from "@/app/lib/facturas-pagos";
import { competenciaClub, competenciaPortal, type DatosCompetencia } from "@/app/lib/perfil-deportista";

const medalla = (pos: number | null) => (pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos ? `${pos}º` : "—");

/** Competencia del perfil: próximo evento con su aptitud (C2), eventos disputados y resultados del grupo. */
export default function SeccionCompetencia({ deportistaId, modo }: { deportistaId: number; modo: "club" | "portal" }) {
  const [datos, setDatos] = useState<DatosCompetencia | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    setDatos(null);
    setError(false);
    (modo === "club" ? competenciaClub : competenciaPortal)(deportistaId)
      .then((d) => vigente && setDatos(d))
      .catch(() => vigente && setError(true));
    return () => {
      vigente = false;
    };
  }, [deportistaId, modo]);

  const p = datos?.proximo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Competencia</CardTitle>
        <CardDescription>
          {datos
            ? `${datos.eventos} ${datos.eventos === 1 ? "evento disputado" : "eventos disputados"} como titular · ${datos.podios} ${datos.podios === 1 ? "podio" : "podios"} del grupo`
            : "Rosters y resultados del grupo."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-muted-foreground">No se pudo cargar la competencia.</p>
        ) : !datos ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {p ? (
              <div className="space-y-2 rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    Próximo evento: {p.evento}
                    {p.fecha ? ` · ${formatFecha(p.fecha)}` : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">{p.rol === "TITULAR" ? "Titular" : "Suplente"}</Badge>
                    {p.rosterEstado === "BORRADOR" && <Badge variant="secondary">Roster sin confirmar</Badge>}
                    <Badge variant={p.apto ? "success" : "destructive"}>{p.apto ? "Apto" : "No apto"}</Badge>
                  </span>
                </div>
                {p.problemas.length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                    {p.problemas.map((x, i) => (
                      <li key={i} className={x.bloquea ? "text-destructive" : ""}>
                        {x.detalle}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No figura en el roster de ningún evento próximo.</p>
            )}

            {datos.participaciones.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Eventos anteriores</p>
                {datos.participaciones.map((x) => (
                  <div key={`${x.eventoId}-${x.grupoId}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                    <span>
                      <span className="font-medium">{x.evento}</span>
                      <span className="text-muted-foreground">
                        {x.fecha ? ` · ${formatFecha(x.fecha)}` : ""}
                        {x.grupo ? ` · ${x.grupo}` : ""}
                        {x.posicion ? ` · ${x.posicion}` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline">{x.rol === "TITULAR" ? "Titular" : "Suplente"}</Badge>
                      {x.posicionGrupo !== null ? (
                        <span className="font-medium">
                          {medalla(x.posicionGrupo)}
                          {x.puntaje !== null ? ` · ${x.puntaje}` : ""}
                          {x.premio ? ` · ${x.premio}` : ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sin resultado</span>
                      )}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">El resultado es del grupo en ese evento.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
