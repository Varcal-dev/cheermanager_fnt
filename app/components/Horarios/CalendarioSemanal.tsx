"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GrupoAsociado {
  horarioEntrenamientoId: number;
  grupoId: number;
  nombreGrupo: string;
}

interface HorarioResponseDTO {
  id: number;
  diaId: number;
  dia: string;
  horaInicio: string; // "HH:mm:ss"
  horaFin: string;
  grupos: GrupoAsociado[];
}

const DIAS_SEMANA = [
  { key: "lunes", label: "Lunes", corto: "Lun" },
  { key: "martes", label: "Martes", corto: "Mar" },
  { key: "miercoles", label: "Miércoles", corto: "Mié" },
  { key: "jueves", label: "Jueves", corto: "Jue" },
  { key: "viernes", label: "Viernes", corto: "Vie" },
  { key: "sabado", label: "Sábado", corto: "Sáb" },
  { key: "domingo", label: "Domingo", corto: "Dom" },
];

// Paleta cíclica para distinguir grupos a simple vista dentro del calendario
// — derivada de los tokens de marca (--chart-1..5), no colores sueltos.
const PALETA = [
  "bg-chart-1/15 text-chart-1 border-chart-1/40",
  "bg-chart-2/15 text-chart-2 border-chart-2/40",
  "bg-chart-3/15 text-chart-3 border-chart-3/40",
  "bg-chart-4/15 text-chart-4 border-chart-4/40",
  "bg-chart-5/15 text-chart-5 border-chart-5/40",
];

const HOUR_HEIGHT = 56; // px por hora

const normalizarDia = (dia: string) =>
  dia
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const toMinutos = (hhmmss: string) => {
  const [h, m] = hhmmss.split(":").map(Number);
  return h * 60 + (m || 0);
};

const formatHora = (hora: string) => hora?.slice(0, 5) ?? "";

interface EventoLayout {
  horario: HorarioResponseDTO;
  startMin: number;
  endMin: number;
  col: number;
  totalCols: number;
}

// Algoritmo simple de layout tipo Google Calendar: agrupa eventos que se
// solapan en el tiempo y les reparte columnas para que no se encimen.
function layoutDia(horarios: HorarioResponseDTO[]): EventoLayout[] {
  const eventos = horarios
    .map((h) => ({
      horario: h,
      startMin: toMinutos(h.horaInicio),
      endMin: toMinutos(h.horaFin),
    }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const columnas: (typeof eventos)[] = [];
  const asignadas = eventos.map((ev) => {
    let colIndex = columnas.findIndex(
      (col) => col[col.length - 1].endMin <= ev.startMin,
    );
    if (colIndex === -1) {
      colIndex = columnas.length;
      columnas.push([]);
    }
    columnas[colIndex].push(ev);
    return { ...ev, col: colIndex };
  });

  const totalCols = Math.max(columnas.length, 1);
  return asignadas.map((ev) => ({ ...ev, totalCols }));
}

export default function CalendarioSemanal({
  horarios,
}: {
  horarios: HorarioResponseDTO[];
}) {
  const { startHour, endHour } = useMemo(() => {
    if (horarios.length === 0) return { startHour: 7, endHour: 21 };
    const minStart = Math.min(...horarios.map((h) => toMinutos(h.horaInicio)));
    const maxEnd = Math.max(...horarios.map((h) => toMinutos(h.horaFin)));
    let sH = Math.floor(minStart / 60);
    let eH = Math.ceil(maxEnd / 60);
    if (eH - sH < 6) eH = sH + 6; // rango mínimo para que no se vea vacío
    return { startHour: sH, endHour: eH };
  }, [horarios]);

  const horas = useMemo(
    () => Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i),
    [startHour, endHour],
  );

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, HorarioResponseDTO[]>();
    DIAS_SEMANA.forEach((d) => map.set(d.key, []));
    horarios.forEach((h) => {
      const key = normalizarDia(h.dia);
      if (map.has(key)) {
        map.get(key)!.push(h);
      }
    });
    return map;
  }, [horarios]);

  // Asigna un color estable a cada grupo según el orden en que aparece,
  // así el mismo grupo se ve igual en todos los días de la semana.
  const colorPorGrupoId = useMemo(() => {
    const map = new Map<number, string>();
    let idx = 0;
    horarios.forEach((h) =>
      h.grupos.forEach((g) => {
        if (!map.has(g.grupoId)) {
          map.set(g.grupoId, PALETA[idx % PALETA.length]);
          idx++;
        }
      }),
    );
    return map;
  }, [horarios]);

  const totalAltura = (endHour - startHour) * HOUR_HEIGHT;

  if (horarios.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No hay horarios registrados todavía. Crea un horario para verlo en
          el calendario.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `56px repeat(${DIAS_SEMANA.length}, minmax(130px, 1fr))`,
              minWidth: `${56 + DIAS_SEMANA.length * 130}px`,
            }}
          >
            {/* Encabezado de días */}
            <div />
            {DIAS_SEMANA.map((d) => (
              <div
                key={d.key}
                className="text-center text-sm font-display font-semibold py-2 border-b"
              >
                <span className="hidden sm:inline">{d.label}</span>
                <span className="sm:hidden">{d.corto}</span>
              </div>
            ))}

            {/* Columna de horas */}
            <div className="relative" style={{ height: totalAltura }}>
              {horas.slice(0, -1).map((h) => (
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground"
                  style={{ top: (h - startHour) * HOUR_HEIGHT }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Columnas de días con eventos */}
            {DIAS_SEMANA.map((d) => {
              const eventosDia = layoutDia(eventosPorDia.get(d.key) ?? []);
              return (
                <div
                  key={d.key}
                  className="relative border-l"
                  style={{ height: totalAltura }}
                >
                  {/* Líneas guía por hora */}
                  {horas.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-dashed border-muted"
                      style={{ top: (h - startHour) * HOUR_HEIGHT }}
                    />
                  ))}

                  {/* Bloques de horario */}
                  {eventosDia.map((ev) => {
                    const top = ((ev.startMin - startHour * 60) / 60) * HOUR_HEIGHT;
                    const height = Math.max(
                      ((ev.endMin - ev.startMin) / 60) * HOUR_HEIGHT - 2,
                      22,
                    );
                    const widthPct = 100 / ev.totalCols;
                    const leftPct = widthPct * ev.col;
                    const nombresGrupos = ev.horario.grupos.map(
                      (g) => g.nombreGrupo,
                    );
                    const color =
                      ev.horario.grupos.length > 0
                        ? colorPorGrupoId.get(ev.horario.grupos[0].grupoId)
                        : "bg-muted text-muted-foreground border-dashed";

                    return (
                      <div
                        key={ev.horario.id}
                        title={`${nombresGrupos.join(", ") || "Sin grupo asignado"} · ${formatHora(ev.horario.horaInicio)}-${formatHora(ev.horario.horaFin)}`}
                        className={`absolute rounded-md border px-1.5 py-1 text-[11px] leading-tight overflow-hidden ${color}`}
                        style={{
                          top,
                          height,
                          left: `${leftPct}%`,
                          width: `calc(${widthPct}% - 4px)`,
                        }}
                      >
                        <div className="font-semibold">
                          {formatHora(ev.horario.horaInicio)}-
                          {formatHora(ev.horario.horaFin)}
                        </div>
                        <div className="truncate">
                          {nombresGrupos.length > 0
                            ? nombresGrupos.join(", ")
                            : "Sin grupo"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leyenda de grupos */}
        {colorPorGrupoId.size > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {Array.from(colorPorGrupoId.entries()).map(([grupoId, color]) => {
              const nombre = horarios
                .flatMap((h) => h.grupos)
                .find((g) => g.grupoId === grupoId)?.nombreGrupo;
              return (
                <Badge key={grupoId} variant="outline" className={color}>
                  {nombre}
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}