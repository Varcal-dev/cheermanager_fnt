"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RegistroSubCriterioInput } from "@/app/lib/evaluacion-rutina";
import { driversSugeridos, NIVELES_DEDUCCION } from "@/app/lib/rubrica-guia";
import { GuiaDeduccion } from "./GuiasRubrica";

interface Props {
  nombreSubCriterio: string;
  valor: RegistroSubCriterioInput;
  onChange: (patch: Partial<RegistroSubCriterioInput>) => void;
}

// Ejecución: valor inicial (4.0 o 2.0, editable) menos las deducciones por driver.
export default function ValorInicialMenosDriversForm({ nombreSubCriterio, valor, onChange }: Props) {
  const deducciones = valor.deducciones ?? [];
  const sugeridos = driversSugeridos(nombreSubCriterio);
  const nombresYaAgregados = new Set(deducciones.map((d) => d.nombreDriver));
  const sugeridosPendientes = sugeridos.filter((s) => !nombresYaAgregados.has(s.nombre));

  const actualizarDeduccion = (i: number, patch: Partial<(typeof deducciones)[number]>) => {
    const copia = [...deducciones];
    copia[i] = { ...copia[i], ...patch };
    onChange({ deducciones: copia });
  };
  const agregar = (nombreDriver = "") => onChange({ deducciones: [...deducciones, { nombreDriver, nivelDeduccion: 1 }] });
  const quitar = (i: number) => onChange({ deducciones: deducciones.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <div className="max-w-xs space-y-1.5">
        <Label className="text-xs">Valor inicial</Label>
        <Input
          type="number"
          step="0.1"
          value={valor.puntajeFinalManual ?? ""}
          onChange={(e) => onChange({ puntajeFinalManual: e.target.value === "" ? undefined : Number(e.target.value) })}
        />
      </div>

      <GuiaDeduccion />

      <div className="space-y-2">
        <Label className="text-xs">Deducciones por driver</Label>

        {sugeridosPendientes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sugeridosPendientes.map((s) => (
              <button
                key={s.nombre}
                type="button"
                title={s.descripcion}
                onClick={() => agregar(s.nombre)}
                className="text-xs rounded-full border px-2.5 py-1 hover:bg-muted transition-colors"
              >
                + {s.nombre}
              </button>
            ))}
          </div>
        )}

        {deducciones.map((d, i) => {
          const guiaDriver = sugeridos.find((s) => s.nombre === d.nombreDriver);
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nombre del driver…"
                  value={d.nombreDriver}
                  onChange={(e) => actualizarDeduccion(i, { nombreDriver: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value={String(d.nivelDeduccion)}
                  onValueChange={(v) => actualizarDeduccion(i, { nivelDeduccion: Number(v) as 0 | 1 | 2 | 3 })}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVELES_DEDUCCION.map((n) => (
                      <SelectItem key={n.valor} value={String(n.valor)}>
                        {n.valor} — {n.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => quitar(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {guiaDriver && <p className="text-xs text-muted-foreground pl-1">{guiaDriver.descripcion}</p>}
            </div>
          );
        })}
        <Button variant="outline" size="sm" onClick={() => agregar()}>
          <Plus className="h-4 w-4 mr-1" /> Agregar otro driver
        </Button>
      </div>
    </div>
  );
}
