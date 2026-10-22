"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Lista de puesta en marcha del club (GET /api/onboarding, permiso ver_onboarding).
// Se calcula en el back con datos reales del club; desaparece cuando todo está completo.

interface Paso {
  clave: string;
  titulo: string;
  completo: boolean;
  detalle: string;
}
interface Estado {
  completados: number;
  total: number;
  pasos: Paso[];
}

// A dónde llevar al usuario para resolver cada paso.
const ENLACES: Record<string, string> = {
  niveles: "/niveles",
  divisiones: "/divisiones",
  planes: "/planes-mensualidad",
  temporada: "/temporadas",
  entrenadores: "/entrenadores",
  grupos: "/grupos",
  deportistas: "/deportistas",
  acudientes: "/deportistas",
  consentimientos: "/consentimientos",
};

export default function OnboardingCard() {
  const { permissions, esPlataforma } = useUser();
  const [estado, setEstado] = useState<Estado | null>(null);
  const permitido = permissions.includes("ver_onboarding") && !esPlataforma;

  useEffect(() => {
    if (!permitido) return;
    api
      .get("/api/onboarding")
      .then((res) => setEstado(res.data))
      .catch(() => setEstado(null)); // es informativo: si falla no se muestra
  }, [permitido]);

  if (!permitido || !estado || estado.completados >= estado.total) return null;

  const pct = Math.round((estado.completados / estado.total) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Puesta en marcha del club</CardTitle>
        <CardDescription>
          {estado.completados} de {estado.total} pasos completos
        </CardDescription>
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 md:grid-cols-2">
          {estado.pasos.map((p) => {
            const href = ENLACES[p.clave];
            const contenido = (
              <div className="flex items-start gap-2 text-sm">
                {p.completo ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span>
                  <span className={p.completo ? "text-muted-foreground line-through" : "font-medium"}>{p.titulo}</span>
                  <span className="block text-xs text-muted-foreground">{p.detalle}</span>
                </span>
              </div>
            );
            return (
              <li key={p.clave}>
                {!p.completo && href ? (
                  <Link href={href} className="block rounded-md p-1 hover:bg-muted">
                    {contenido}
                  </Link>
                ) : (
                  <div className="p-1">{contenido}</div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}