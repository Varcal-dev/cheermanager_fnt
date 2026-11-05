"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { suscripcionApi, ETIQUETA_VIGENCIA, fechaCorta, type ResumenSuscripcion } from "@/app/lib/suscripcion";

/** Inicio del superadmin: estado de los clubes y de sus suscripciones. */
export default function HomePlataforma() {
  const [clubes, setClubes] = useState<ResumenSuscripcion[] | null>(null);

  useEffect(() => {
    suscripcionApi
      .todas()
      .then((r) => setClubes(r.filter((c) => c.clubId !== 1)))
      .catch(() => setClubes([]));
  }, []);

  const lista = clubes ?? [];
  const activos = lista.filter((c) => c.clubActivo).length;
  const porVencer = lista.filter((c) => c.diasRestantes !== null && c.diasRestantes >= 0 && c.diasRestantes <= 7);
  const soloLectura = lista.filter((c) => c.vigencia === "SOLO_LECTURA");
  const deportistas = lista.reduce((a, c) => a + c.deportistasActivos, 0);

  const kpi = (titulo: string, valor: number, Icono: typeof Building2) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        <Icono className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{clubes === null ? "…" : valor}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plataforma</h1>
          <p className="text-muted-foreground">Estado de los clubes en CheerManager</p>
        </div>
        <Button asChild>
          <Link href="/clubes">Administrar clubes</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {kpi("Clubes activos", activos, Building2)}
        {kpi("Deportistas activos (total)", deportistas, Users)}
        {kpi("Vencen en 7 días", porVencer.length, AlertTriangle)}
        {kpi("En solo lectura", soloLectura.length, CheckCircle)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clubes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {lista.length === 0 && <p className="text-sm text-muted-foreground">{clubes === null ? "Cargando…" : "Aún no hay clubes."}</p>}
          {lista.map((c) => (
            <Link key={c.clubId} href={`/clubes/${c.clubId}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted">
              <div>
                <div className="font-medium">{c.clubNombre}</div>
                <div className="text-xs text-muted-foreground">
                  {c.planNombre ?? "Sin plan"} · {c.deportistasActivos} deportistas
                  {c.vigenteHasta ? ` · hasta ${fechaCorta(c.vigenteHasta)}` : ""}
                </div>
              </div>
              <Badge variant={c.clubActivo ? "default" : "secondary"}>{c.clubActivo ? ETIQUETA_VIGENCIA[c.vigencia] : "Suspendido"}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
