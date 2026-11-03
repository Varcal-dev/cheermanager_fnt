"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ETIQUETA_GRUPO_MINIMO,
  type GrupoMinimo,
  type RegistroSubCriterioInput,
  type SubCriterioRubrica,
  type TopeSeccionNivel,
} from "@/app/lib/evaluacion-rutina";
import { guiaGeneral } from "@/app/lib/rubrica-guia";
import { esPromedioDeJueces, JUECES_PROMEDIO, rangoDelNivel } from "./comunes";
import DriversConstruccionForm from "./DriversConstruccionForm";
import { GuiaEscalones } from "./GuiasRubrica";
import ValorInicialMenosDriversForm from "./ValorInicialMenosDriversForm";

type Cambio = (patch: Partial<RegistroSubCriterioInput>) => void;

interface Props {
  subCriterio: SubCriterioRubrica;
  nivelId: number;
  /** Escalones del nivel elegido: de ahí salen el rango válido de los sub-criterios de rango directo. */
  topesNivel: TopeSeccionNivel[];
  valor: RegistroSubCriterioInput | undefined;
  onChange: Cambio;
}

// Una fila de captura por sub-criterio: el input que se muestra cambia según subCriterio.tipoCalculo,
// siguiendo lo que cada CalculadoraSubCriterio del backend realmente lee.
export default function SubCriterioFormRow({ subCriterio, nivelId, topesNivel, valor, onChange }: Props) {
  if (!valor) return null;
  const tipo = subCriterio.tipoCalculo;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="font-medium text-sm">{subCriterio.nombre}</p>

      {tipo === "RANGO_DIRECTO_JUEZ" && (
        <RangoDirectoJuez subCriterio={subCriterio} nivelId={nivelId} topesNivel={topesNivel} valor={valor} onChange={onChange} />
      )}

      {tipo === "VALOR_INICIAL_MENOS_DRIVERS" && (
        <ValorInicialMenosDriversForm nombreSubCriterio={subCriterio.nombre} valor={valor} onChange={onChange} />
      )}

      {tipo === "ESCALON_CANTIDAD_SIMPLE" && (
        <div className="space-y-3">
          <GuiaEscalones nivelId={nivelId} subCriterioId={subCriterio.id} />
          <HabilidadesYSincronia valor={valor} onChange={onChange} />
        </div>
      )}

      {tipo === "ESCALON_GIMNASIA" && (
        <div className="space-y-3">
          <GuiaEscalones nivelId={nivelId} subCriterioId={subCriterio.id} />
          <div className="max-w-xs">
            <GrupoMinimoSelect valor={valor} onChange={onChange} />
          </div>
          <DriversConstruccionForm subCriterioId={subCriterio.id} nivelId={nivelId} valor={valor} onChange={onChange} />
        </div>
      )}

      {tipo === "ESCALON_HABILIDADES_GRUPOS" && (
        <div className="space-y-3">
          <GuiaEscalones nivelId={nivelId} subCriterioId={subCriterio.id} />
          <HabilidadesYSincronia valor={valor} onChange={onChange} />
          <DriversConstruccionForm subCriterioId={subCriterio.id} nivelId={nivelId} valor={valor} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

const formatearRango = (r: { min: number; max: number }) => `${r.min.toFixed(1)} – ${r.max.toFixed(1)}`;

function RangoDirectoJuez({ subCriterio, nivelId, topesNivel, valor, onChange }: Props & { valor: RegistroSubCriterioInput }) {
  const guia = guiaGeneral(subCriterio.nombre);
  // El rango real sale de la rúbrica del nivel (Prep y Élite no comparten el máximo de pirámides, por ejemplo).
  const rango = rangoDelNivel(subCriterio, topesNivel);
  return (
    <div className="space-y-2">
      {guia ? (
        <p className="text-xs text-muted-foreground rounded-md border border-dashed p-2">
          <span className="font-semibold text-foreground">Rango válido: {rango ? formatearRango(rango) : guia.rango}.</span>{" "}
          {guia.texto}
        </p>
      ) : (
        <GuiaEscalones nivelId={nivelId} subCriterioId={subCriterio.id} />
      )}
      {esPromedioDeJueces(subCriterio.nombre) ? (
        <PuntajesPorJuez valor={valor} onChange={onChange} rango={rango} />
      ) : (
        <div className="max-w-xs space-y-1.5">
          <Label className="text-xs">Puntaje asignado por el juez</Label>
          <Input
            type="number"
            step="0.1"
            min={rango?.min}
            max={rango?.max}
            value={valor.puntajeFinalManual ?? ""}
            onChange={(e) => onChange({ puntajeFinalManual: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </div>
      )}
    </div>
  );
}

// Creatividad y Showmanship: cada juez (Construcción, Gimnasia, General) da su puntaje y el sistema promedia.
// Se puede dejar algún juez vacío (el promedio es entre los que pusieron puntaje).
function PuntajesPorJuez({
  valor,
  onChange,
  rango,
}: {
  valor: RegistroSubCriterioInput;
  onChange: Cambio;
  rango: { min: number; max: number } | null;
}) {
  const [textos, setTextos] = useState<string[]>(() => JUECES_PROMEDIO.map((_, i) => String(valor.puntajesJueces?.[i] ?? "")));

  const cambiar = (i: number, texto: string) => {
    const nuevos = textos.map((t, idx) => (idx === i ? texto : t));
    setTextos(nuevos);
    onChange({
      puntajesJueces: nuevos.filter((t) => t.trim() !== "").map(Number),
      puntajeFinalManual: undefined,
    });
  };

  const numeros = textos.filter((t) => t.trim() !== "").map(Number);
  const promedio = numeros.length ? Math.round((numeros.reduce((a, b) => a + b, 0) / numeros.length) * 100) / 100 : null;

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-3 max-w-xl">
        {JUECES_PROMEDIO.map((juez, i) => (
          <div key={juez} className="space-y-1.5">
            <Label className="text-xs">{juez}</Label>
            <Input
              type="number"
              step="0.1"
              min={rango?.min}
              max={rango?.max}
              value={textos[i]}
              onChange={(e) => cambiar(i, e.target.value)}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Promedio de {numeros.length || "los"} juez(ces):{" "}
        <span className="font-semibold text-foreground">{promedio !== null ? promedio.toFixed(2) : "—"}</span>
      </p>
    </div>
  );
}

function HabilidadesYSincronia({ valor, onChange }: { valor: RegistroSubCriterioInput; onChange: Cambio }) {
  const numero = (v: string) => (v === "" ? undefined : Number(v));
  return (
    <div className="grid gap-3 sm:grid-cols-3 max-w-2xl">
      <div className="space-y-1.5">
        <Label className="text-xs">Habilidades diferentes</Label>
        <Input
          type="number"
          min={0}
          value={valor.habilidadesDiferentes ?? ""}
          onChange={(e) => onChange({ habilidadesDiferentes: numero(e.target.value) })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">De ellas, sincronizadas / en canon</Label>
        <Input
          type="number"
          min={0}
          value={valor.habilidadesSincronizadas ?? ""}
          onChange={(e) => onChange({ habilidadesSincronizadas: numero(e.target.value) })}
        />
      </div>
      <GrupoMinimoSelect valor={valor} onChange={onChange} />
    </div>
  );
}

function GrupoMinimoSelect({ valor, onChange }: { valor: RegistroSubCriterioInput; onChange: Cambio }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Cuántos del equipo lo hacen</Label>
      <Select value={valor.grupoMinimoAlcanzado ?? ""} onValueChange={(v) => onChange({ grupoMinimoAlcanzado: v as GrupoMinimo })}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona…" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ETIQUETA_GRUPO_MINIMO) as GrupoMinimo[]).map((g) => (
            <SelectItem key={g} value={g}>
              {ETIQUETA_GRUPO_MINIMO[g]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
