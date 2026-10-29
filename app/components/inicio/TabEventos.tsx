"use client";

import Link from "next/link";
import { Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumenEventos } from "@/app/lib/dashboard";
import { type CargaPerezosa, Cargando, SinDatos } from "./comunes";

/** Pestaña Eventos — /api/dashboard/eventos */
export default function TabEventos({ estado }: { estado: CargaPerezosa<ResumenEventos> }) {
  const { data, cargando } = estado;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
          <CardDescription>Con grupos ya inscritos</CardDescription>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <Cargando />
          ) : data && data.proximosEventos.length > 0 ? (
            <div className="space-y-3">
              {data.proximosEventos.map((e) => (
                <div key={e.eventoId} className="flex items-start space-x-3">
                  <div className="rounded-full p-2 bg-primary/10 text-primary">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">{e.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(e.fecha).toLocaleDateString()} · {e.gruposInscritos} grupos inscritos
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SinDatos>No hay eventos próximos agendados.</SinDatos>
          )}
          <Link href="/eventos" className="text-sm text-primary hover:underline block text-center mt-4">
            Ver todos los eventos
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Podios de la Temporada</CardTitle>
          <CardDescription>Premios ganados</CardDescription>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <Cargando />
          ) : data ? (
            <>
              <div className="text-2xl font-display font-bold mb-3">
                {data.podiosTemporada} podios esta temporada
              </div>
              {data.premiosGanados.length > 0 ? (
                <div className="space-y-2">
                  {data.premiosGanados.slice(0, 5).map((p, i) => (
                    <div key={i} className="text-sm border-b pb-2 last:border-0">
                      <span className="font-medium">#{p.posicion}</span> — {p.nombreGrupo} en {p.nombreEvento}
                      {p.descripcionPremio ? ` (${p.descripcionPremio})` : ""}
                    </div>
                  ))}
                </div>
              ) : (
                <SinDatos>Todavía no hay premios registrados esta temporada.</SinDatos>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
