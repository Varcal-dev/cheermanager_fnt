"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, Lock, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { useFunciones, type InfoFuncion } from "@/app/lib/funciones";
import { resolverRuta } from "./nav-config";
import { descripcionPlan } from "./plan-lock";

// -----------------------------------------------------------------------------
// Puerta central de cada pantalla, montada en AppShell. Toma de nav-config qué permiso y qué función de plan
// exige la ruta, así que cubre TODAS las pantallas del menú aunque alguna no traiga su propio ProtectedRoute.
//   - Sin el permiso del rol  -> pantalla "Sin acceso" (el back igual responde 403: esto es la cara visible).
//   - Función que el plan no trae y que bloquea la pantalla entera -> pantalla con el candado y el plan que la habilita.
//   - Función solo de escritura (p. ej. roles personalizados) o en solo lectura tras bajar de plan -> la pantalla
//     se muestra, con un aviso arriba.
// Si aún no se sabe el plan (o falló la consulta) no se bloquea nada: decide el back.
// -----------------------------------------------------------------------------

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, permissions, loading, esPlataforma, legalPendiente } = useUser();
  const { info } = useFunciones();

  // Sin sesión, con cambio de clave o términos pendientes: lo resuelve el ProtectedRoute de cada página (redirige).
  if (loading || !user || user.requiereCambioPassword || legalPendiente) return <>{children}</>;

  const ruta = resolverRuta(pathname, esPlataforma);
  if (!ruta) return <>{children}</>;

  if (ruta.permiso && !permissions.includes(ruta.permiso)) {
    return <SinAcceso nombre={ruta.item.label} />;
  }

  const funcion = info(ruta.funcion);
  if (funcion && funcion.estado === "BLOQUEADA" && !funcion.soloEscritura) {
    return <FuncionNoIncluida info={funcion} puedeVerPlan={permissions.includes("ver_dash_administracion")} />;
  }

  return (
    <>
      {funcion && funcion.estado !== "PLENA" && <AvisoPlan info={funcion} />}
      {children}
    </>
  );
}

function SinAcceso({ nombre }: { nombre: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <ShieldOff className="h-6 w-6 text-muted-foreground" aria-hidden />
      </span>
      <h1 className="font-display text-xl font-semibold">No tienes acceso a {nombre}</h1>
      <p className="text-sm text-muted-foreground">
        Tu rol no incluye este permiso. Si lo necesitas para tu trabajo, pídeselo a un administrador del club.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}

export function FuncionNoIncluida({ info, puedeVerPlan }: { info: InfoFuncion; puedeVerPlan: boolean }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock className="h-6 w-6 text-muted-foreground" aria-hidden />
      </span>
      <h1 className="font-display text-xl font-semibold">{info.nombre}</h1>
      {info.descripcion && <p className="text-sm text-muted-foreground">{info.descripcion}</p>}
      <p className="text-sm font-medium">
        {info.planMinimo ? `Disponible desde el plan ${info.planMinimo}.` : "No está incluido en tu plan actual."}
      </p>
      <p className="text-xs text-muted-foreground">
        {puedeVerPlan
          ? "Puedes revisar tu plan y cambiarlo desde “Plan y mis datos”."
          : "Pídele a un administrador del club que revise el plan."}
      </p>
      <div className="flex gap-2">
        {puedeVerPlan && (
          <Button asChild>
            <Link href="/plan-y-datos">Ver mi plan</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}

function AvisoPlan({ info }: { info: InfoFuncion }) {
  const lectura = info.estado === "SOLO_LECTURA";
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
    >
      {lectura ? <Eye className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
      <p>
        {lectura
          ? `${descripcionPlan(info)}. Puedes consultar y exportar, pero no crear ni editar.`
          : `${descripcionPlan(info)}. Puedes consultar lo que ya existe; crear o editar requiere ese plan.`}
      </p>
    </div>
  );
}
