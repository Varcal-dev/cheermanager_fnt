"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DeduccionRutinaInput, TipoDeduccion } from "@/app/lib/evaluacion-rutina";

interface Props {
  deducciones: DeduccionRutinaInput[];
  onChange: (nuevas: DeduccionRutinaInput[]) => void;
}

// Atajos con los valores de la planilla oficial (todos editables). Tiempo no tiene un valor
// fijo en lo que se cargó de la rúbrica, así que arranca en 0 para que lo escriba el juez.
const ATAJOS: { etiqueta: string; deduccion: DeduccionRutinaInput }[] = [
  { etiqueta: "Caída de atleta (−0.15)", deduccion: { tipo: "CAIDA", descripcion: "Caída de atleta", cantidad: 1, puntosUnitarios: 0.15 } },
  { etiqueta: "Acrobacia fuera de nivel (−0.05)", deduccion: { tipo: "SEGURIDAD", descripcion: "Acrobacia fuera de nivel", cantidad: 1, puntosUnitarios: 0.05 } },
  { etiqueta: "Construcción fuera de nivel (−0.10)", deduccion: { tipo: "SEGURIDAD", descripcion: "Construcción fuera de nivel", cantidad: 1, puntosUnitarios: 0.1 } },
  { etiqueta: "Tiempo de presentación", deduccion: { tipo: "TIEMPO", descripcion: "Tiempo de presentación", cantidad: 1, puntosUnitarios: 0 } },
];

const TIPOS: { valor: TipoDeduccion; etiqueta: string }[] = [
  { valor: "CAIDA", etiqueta: "Caída" },
  { valor: "SEGURIDAD", etiqueta: "Seguridad" },
  { valor: "TIEMPO", etiqueta: "Tiempo" },
  { valor: "OTRA", etiqueta: "Otra" },
];

// Deducciones de la presentación completa (no de un driver): se restan en puntos sobre la escala de 100.
export default function DeduccionesForm({ deducciones, onChange }: Props) {
  const actualizar = (i: number, patch: Partial<DeduccionRutinaInput>) =>
    onChange(deducciones.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {ATAJOS.map((a) => (
          <button
            key={a.etiqueta}
            type="button"
            onClick={() => onChange([...deducciones, { ...a.deduccion }])}
            className="text-xs rounded-full border px-2.5 py-1 hover:bg-muted transition-colors"
          >
            + {a.etiqueta}
          </button>
        ))}
      </div>

      {deducciones.length === 0 && <p className="text-xs text-muted-foreground">Sin deducciones.</p>}

      {deducciones.map((d, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[9rem_1fr_6rem_7rem_auto] items-end">
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={d.tipo} onValueChange={(v) => actualizar(i, { tipo: v as TipoDeduccion })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descripción</Label>
            <Input value={d.descripcion ?? ""} onChange={(e) => actualizar(i, { descripcion: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Veces</Label>
            <Input type="number" min={1} value={d.cantidad} onChange={(e) => actualizar(i, { cantidad: Math.max(1, Number(e.target.value) || 1) })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Puntos c/u</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={d.puntosUnitarios}
              onChange={(e) => actualizar(i, { puntosUnitarios: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => onChange(deducciones.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={() => onChange([...deducciones, { tipo: "OTRA", cantidad: 1, puntosUnitarios: 0 }])}>
        <Plus className="h-4 w-4 mr-1" /> Agregar deducción
      </Button>
    </div>
  );
}
