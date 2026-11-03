import type { EvaluacionRutinaResultado } from "@/app/lib/evaluacion-rutina";

const ETIQUETA_TIPO: Record<string, string> = {
  CAIDA: "Caída de atleta",
  SEGURIDAD: "Seguridad",
  TIEMPO: "Tiempo",
  OTRA: "Otra",
};

/** Cierre de la evaluación: suma bruta, % del máximo, deducciones y puntaje final (o banda en Novice). */
export default function ResumenCierre({ evaluacion }: { evaluacion: EvaluacionRutinaResultado }) {
  const { puntajeMaximo, porcentaje, deduccionesTotal, puntajeFinal, banda, deducciones } = evaluacion;
  // Evaluaciones guardadas antes del cierre (o niveles sin máximo cargado) no traen estos datos.
  if (puntajeMaximo == null || porcentaje == null || puntajeFinal == null) return null;

  const esBanda = banda != null;
  return (
    <div className="rounded-lg border p-4 space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total bruto</span>
        <span className="font-medium">
          {evaluacion.puntajeTotal.toFixed(2)} / {puntajeMaximo.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">% del máximo</span>
        <span className="font-medium">{porcentaje.toFixed(2)} %</span>
      </div>
      {!esBanda && (
        <>
          {(deducciones ?? []).map((d, i) => (
            <div key={i} className="flex justify-between text-xs text-muted-foreground">
              <span>
                {ETIQUETA_TIPO[d.tipo] ?? d.tipo}
                {d.descripcion ? ` — ${d.descripcion}` : ""} × {d.cantidad}
              </span>
              <span>−{d.total.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deducciones</span>
            <span className="font-medium">−{(deduccionesTotal ?? 0).toFixed(2)}</span>
          </div>
        </>
      )}
      <div className="flex justify-between border-t pt-2 text-base">
        <span className="font-semibold">{esBanda ? "Puntaje" : "Puntaje final / 100"}</span>
        <span className="font-bold">
          {puntajeFinal.toFixed(2)}
          {esBanda && ` — ${banda}`}
        </span>
      </div>
    </div>
  );
}
