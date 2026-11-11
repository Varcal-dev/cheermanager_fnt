"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAuthToken } from "@/lib/api";
import { listarInteresados } from "@/app/lib/interesados";
import { listarSolicitudes as listarSolicitudesInscripcion } from "@/app/lib/portal";
import { listarAlertas } from "@/app/lib/vencimientos";
import { listarLesiones } from "@/app/lib/lesiones";
import { listarSolicitudes as listarSolicitudesTitular } from "@/app/lib/solicitudes-titular";
import { obtenerResumenCartera } from "@/app/lib/facturas-pagos";
import type { BadgeKey } from "./nav-config";

// Contadores del menú: convierten el sidebar en una bandeja de trabajo ("3 solicitudes por aprobar",
// "5 facturas en mora"). Cada contador reutiliza un endpoint que la pantalla correspondiente ya consume,
// así que no hay endpoints nuevos ni migraciones.
//
// Reglas:
//  - Solo se consultan los contadores de entradas que el usuario ve (la lista llega desde el sidebar).
//  - Un contador que falla (sin permiso fino, función bloqueada, red) simplemente no se muestra.
//  - Se actualizan al abrir el menú, al cambiar de pantalla (máx. 1 vez cada 20 s), al volver a la pestaña
//    del navegador (máx. 1 vez por minuto) y cada 5 minutos.

export type TonoBadge = "peligro" | "aviso" | "info";
export interface ValorBadge {
  n: number;
  tono: TonoBadge;
}
export type Badges = Partial<Record<BadgeKey, ValorBadge>>;

const CARGADORES: Record<BadgeKey, () => Promise<ValorBadge>> = {
  // Prospectos que escribieron y nadie ha contactado.
  interesados: async () => {
    const r = await listarInteresados();
    return { n: r.porEstado?.NUEVO ?? 0, tono: "aviso" };
  },
  // Renovaciones pedidas desde el portal que esperan aprobación.
  solicitudesInscripcion: async () => {
    const lista = await listarSolicitudesInscripcion("PENDIENTE");
    return { n: lista.length, tono: "aviso" };
  },
  // Documentos vencidos (rojo) o por vencer en 30 días (aviso).
  vencimientos: async () => {
    const a = await listarAlertas(30, false);
    if ((a.vencidos ?? 0) > 0) return { n: a.vencidos, tono: "peligro" };
    return { n: a.porVencer ?? 0, tono: "aviso" };
  },
  // Retornos al juego con la fecha estimada ya vencida.
  lesiones: async () => {
    const r = await listarLesiones(true);
    return { n: r.retornosAtrasados ?? 0, tono: "peligro" };
  },
  // Consultas y reclamos de titulares aún sin respuesta; rojo si alguno ya pasó su plazo legal.
  solicitudesTitular: async () => {
    const abiertas = (await listarSolicitudesTitular()).filter((s) => s.estado !== "RESPONDIDA");
    const tono: TonoBadge = abiertas.some((s) => s.vencida)
      ? "peligro"
      : abiertas.some((s) => s.diasHabilesRestantes <= 3)
        ? "aviso"
        : "info";
    return { n: abiertas.length, tono };
  },
  // Facturas en mora.
  mora: async () => {
    const r = await obtenerResumenCartera();
    return { n: r.facturasEnMora ?? 0, tono: "peligro" };
  },
};

const MIN_ENTRE_CARGAS_RUTA_MS = 20_000;
const MIN_ENTRE_CARGAS_FOCO_MS = 60_000;
const INTERVALO_MS = 5 * 60_000;

/**
 * @param keys     contadores que hace falta mostrar (los de las entradas visibles)
 * @param ruta     ruta actual; al cambiar se refresca (con límite de frecuencia)
 */
export function useNavBadges(keys: BadgeKey[], ruta: string): Badges {
  const [badges, setBadges] = useState<Badges>({});
  const ultimaCarga = useRef(0);
  const clave = Array.from(new Set(keys)).sort().join(",");

  const cargar = useCallback(async () => {
    if (!clave || !getAuthToken()) return;
    const lista = clave.split(",") as BadgeKey[];
    ultimaCarga.current = Date.now();
    const resultados = await Promise.allSettled(lista.map((k) => CARGADORES[k]()));
    setBadges((prev) => {
      const sig: Badges = {};
      lista.forEach((k, i) => {
        const r = resultados[i];
        if (r.status === "fulfilled") {
          if (r.value.n > 0) sig[k] = r.value;
        } else if (prev[k]) {
          sig[k] = prev[k]; // falla transitoria: se conserva el último valor conocido
        }
      });
      return sig;
    });
  }, [clave]);

  // Carga inicial y cada vez que cambia el conjunto de contadores visibles.
  useEffect(() => {
    cargar();
  }, [cargar]);

  // Al cambiar de pantalla: lo que acabas de resolver debe bajar el número.
  useEffect(() => {
    if (Date.now() - ultimaCarga.current > MIN_ENTRE_CARGAS_RUTA_MS) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta]);

  // Reloj de respaldo y regreso a la pestaña.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") cargar();
    }, INTERVALO_MS);
    const alVolver = () => {
      if (document.visibilityState === "visible" && Date.now() - ultimaCarga.current > MIN_ENTRE_CARGAS_FOCO_MS) {
        cargar();
      }
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargar]);

  return badges;
}
