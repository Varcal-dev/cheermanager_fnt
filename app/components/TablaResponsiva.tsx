"use client";

import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Tabla en pantallas ≥ md y lista de tarjetas en teléfono. Una sola definición de
// columnas sirve para las dos vistas; `movil` decide qué papel juega cada columna
// en la tarjeta:
//   "titulo"    → línea principal (arriba a la izquierda)
//   "destacado" → lo que se busca de un vistazo (arriba a la derecha, apilado)
//   "detalle"   → pares etiqueta/valor debajo (por defecto)
//   "acciones"  → botones, en una franja propia al pie de la tarjeta (áreas táctiles de 44 px)
//   "oculta"    → solo en la tabla
// Al imprimir siempre sale la tabla.
// -----------------------------------------------------------------------------

export interface ColumnaResponsiva<T> {
  clave: string;
  /** Encabezado de la tabla y etiqueta del dato en la tarjeta. */
  titulo: string;
  celda: (fila: T) => ReactNode;
  alinear?: "izquierda" | "derecha";
  movil?: "titulo" | "destacado" | "detalle" | "acciones" | "oculta";
}

interface Props<T> {
  columnas: ColumnaResponsiva<T>[];
  filas: T[];
  getKey: (fila: T, indice: number) => string | number;
  className?: string;
}

export function TablaResponsiva<T>({ columnas, filas, getKey, className }: Props<T>) {
  const rol = (c: ColumnaResponsiva<T>) => c.movil ?? "detalle";
  const titulos = columnas.filter((c) => rol(c) === "titulo");
  const destacadas = columnas.filter((c) => rol(c) === "destacado");
  const detalles = columnas.filter((c) => rol(c) === "detalle");
  const acciones = columnas.filter((c) => rol(c) === "acciones");

  return (
    <div className={className}>
      {/* Tabla: tablet, escritorio e impresión */}
      <div className="hidden md:block print:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columnas.map((c) => (
                <TableHead key={c.clave} className={cn(c.alinear === "derecha" && "text-right")}>
                  {c.titulo}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((fila, i) => (
              <TableRow key={getKey(fila, i)}>
                {columnas.map((c) => (
                  <TableCell key={c.clave} className={cn(c.alinear === "derecha" && "text-right")}>
                    {c.celda(fila)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Tarjetas: teléfono */}
      <ul className="space-y-2 md:hidden print:hidden">
        {filas.map((fila, i) => (
          <li key={getKey(fila, i)} className="rounded-lg border bg-card p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                {titulos.map((c, n) => (
                  <div key={c.clave} className={n === 0 ? "font-medium" : "text-xs text-muted-foreground"}>
                    {c.celda(fila)}
                  </div>
                ))}
              </div>
              {destacadas.length > 0 && (
                <div className="flex shrink-0 flex-col items-end gap-1 text-right font-medium">
                  {destacadas.map((c) => (
                    <div key={c.clave}>{c.celda(fila)}</div>
                  ))}
                </div>
              )}
            </div>
            {detalles.length > 0 && (
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t pt-2 text-xs">
                {detalles.map((c) => (
                  <div key={c.clave} className="min-w-0">
                    <dt className="text-muted-foreground">{c.titulo}</dt>
                    <dd className="break-words">{c.celda(fila)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {acciones.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 border-t pt-2 [&_button]:min-h-11">
                {acciones.map((c) => (
                  <div key={c.clave} className="contents">
                    {c.celda(fila)}
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}