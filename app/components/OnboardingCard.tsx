"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Lista de puesta en marcha del club (GET /api/onboarding, permiso ver_onboarding).
// Se calcula en el back con datos reales del club; desaparece cuando todo está completo.
// Es desplegable: al plegarla queda un aviso con lo que falta, para que no se pierda de vista.

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
  niveles: "/estructura-deportiva?tab=niveles",
  divisiones: "/estructura-deportiva?tab=divisiones",
  tiposPlan: "/tipos-planes-pago",
  planes: "/planes-mensualidad",
  temporada: "/temporadas",
  entrenadores: "/entrenadores",
  grupos: "/grupos",
  deportistas: "/deportistas",
  acudientes: "/deportistas",
  consentimientos: "/consentimientos",
};

const CLAVE_PLEGADO = "onboarding-plegado";

export default function OnboardingCard() {
  const { permissions, esPlataforma } = useUser();
  const [estado, setEstado] = useState<Estado | null>(null);
  const [plegado, setPlegado] = useState(false);
  const permitido = permissions.includes("ver_onboarding") && !esPlataforma;

  // Recuerda si el usuario la dejó plegada (solo comodidad: si el almacenamiento falla, queda abierta).
  useEffect(() => {
    try {
      setPlegado(localStorage.getItem(CLAVE_PLEGADO) === "1");
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const alternar = () =>
    setPlegado((actual) => {
      const nuevo = !actual;
      try {
        localStorage.setItem(CLAVE_PLEGADO, nuevo ? "1" : "0");
      } catch {
        /* sin almacenamiento */
      }
      return nuevo;
    });

  useEffect(() => {
    if (!permitido) return;
    api
      .get("/api/onboarding")
      .then((res) => setEstado(res.data))
      .catch(() => setEstado(null)); // es informativo: si falla no se muestra
  }, [permitido]);

  if (!permitido || !estado || estado.completados >= estado.total) return null;

  const pct = Math.round((estado.completados / estado.total) * 100);
  const pendientes = estado.pasos.filter((p) => !p.completo);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Puesta en marcha del club</CardTitle>
            <CardDescription>
              {estado.completados} de {estado.total} pasos completos
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={alternar}
            aria-expanded={!plegado}
            aria-label={plegado ? "Desplegar puesta en marcha" : "Plegar puesta en marcha"}
            className="max-sm:min-h-11"
          >
            {plegado ? (
              <>
                Ver pasos <ChevronDown className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                Ocultar <ChevronUp className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        {plegado && (
          <div
            role="status"
            className="mt-2 flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 p-2 text-sm"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Faltan {pendientes.length} {pendientes.length === 1 ? "paso" : "pasos"}:{" "}
              {pendientes.map((p) => p.titulo).join(", ")}.
            </p>
          </div>
        )}
      </CardHeader>
      {!plegado && (
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
      )}
    </Card>
  );
}
