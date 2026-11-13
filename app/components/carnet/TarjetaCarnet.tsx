"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { obtenerFotoDeportista, type Carnet } from "@/app/lib/carnet";

// Tarjeta del carnet, compartida por la pantalla del club (Personas › Carnet) y el portal del deportista.
// `cargarFoto` cambia de dónde sale la foto: el club usa /api/deportistas/{id}/foto y el portal /api/portal/...

const iniciales = (nombre: string) =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

/**
 * Foto del carnet. El endpoint exige sesión, así que se descarga como imagen y se muestra desde un blob local
 * (se libera al cambiar de carnet o desmontar). Sin foto, o sin permiso para verla, queda un círculo con iniciales.
 * `version` fuerza la recarga después de subir una foto nueva.
 */
export function FotoCarnet({ c, version = 0, cargarFoto = obtenerFotoDeportista }: { c: Carnet; version?: number; cargarFoto?: (deportistaId: number) => Promise<Blob> }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!c.foto) { setUrl(null); return; }
    let activo = true;
    let objeto: string | null = null;
    cargarFoto(c.deportistaId)
      .then((blob) => {
        if (!activo) return;
        objeto = URL.createObjectURL(blob);
        setUrl(objeto);
      })
      .catch(() => activo && setUrl(null));
    return () => {
      activo = false;
      if (objeto) URL.revokeObjectURL(objeto);
    };
  }, [c.deportistaId, c.foto, version]);

  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={`Foto de ${c.nombre}`} className="h-28 w-28 rounded-full border-2 object-cover" />
  ) : (
    <div
      aria-label="Sin foto"
      className="flex h-28 w-28 items-center justify-center rounded-full border-2 bg-muted text-3xl font-bold text-muted-foreground"
    >
      {iniciales(c.nombre) || "?"}
    </div>
  );
}

export function TarjetaCarnet({ c, version, cargarFoto }: { c: Carnet; version?: number; cargarFoto?: (deportistaId: number) => Promise<Blob> }) {
  return (
    <div id="carnet-imprimible" className="w-80 rounded-xl border-2 p-4 space-y-3 bg-card">
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.club}</div>
        <div className="text-lg font-bold">{c.nombre}</div>
      </div>
      <div className="flex justify-center">
        <FotoCarnet c={c} version={version} cargarFoto={cargarFoto} />
      </div>
      <div className="flex justify-center">
        <QRCodeSVG value={c.codigo} size={180} level="M" marginSize={2} bgColor="#ffffff" fgColor="#000000" />
      </div>
      <div className="text-center text-sm">{c.grupos.length ? c.grupos.join(" · ") : "Sin grupo"}</div>
      <div className="flex justify-center">
        <Badge className={c.vigente ? "bg-green-600 text-white" : "bg-red-600 text-white"}>{c.estado}</Badge>
      </div>
    </div>
  );
}

