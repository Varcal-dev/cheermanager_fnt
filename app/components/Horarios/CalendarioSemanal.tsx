"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Download, FilterX } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useUser } from "@/context/UserContext";
import { descargarIcs } from "@/app/lib/comunicados";
import { cn } from "@/lib/utils";

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

// getDay(): 0 = domingo. Día que se abre por defecto en la vista de teléfono.
const KEY_POR_GETDAY = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

// Franjas del día: un horario pertenece a la franja en la que EMPIEZA.
type Franja = "todas" | "manana" | "tarde" | "noche";
const FRANJAS: { valor: Franja; etiqueta: string; ayuda: string }[] = [
  { valor: "todas", etiqueta: "Todo el día", ayuda: "Todos los horarios" },
  { valor: "manana", etiqueta: "Mañana", ayuda: "Empiezan antes de las 12:00" },
  { valor: "tarde", etiqueta: "Tarde", ayuda: "Empiezan entre las 12:00 y las 18:00" },
  { valor: "noche", etiqueta: "Noche", ayuda: "Empiezan a las 18:00 o después" },
];
const TODOS = "todos";
const SIN_GRUPO = "sin-grupo";

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

const franjaDe = (h: HorarioResponseDTO): Exclude<Franja, "todas"> => {
  const inicio = toMinutos(h.horaInicio);
  if (inicio < 12 * 60) return "manana";
  if (inicio < 18 * 60) return "tarde";
  return "noche";
};

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
  const { permissions } = useUser();
  const puedeDescargar = permissions.includes("ver_comunicados");

  const [grupoFiltro, setGrupoFiltro] = useState<string>(TODOS);
  const [franja, setFranja] = useState<Franja>("todas");
  const [soloDiasConClases, setSoloDiasConClases] = useState(false);
  const [descargando, setDescargando] = useState(false);
  // Vista de teléfono: un día a la vez (la semana completa no cabe en 360 px).
  const [diaMovil, setDiaMovil] = useState<string>(() => KEY_POR_GETDAY[new Date().getDay()]);

  // Grupos y colores salen de TODOS los horarios: un grupo conserva su color al filtrar
  // y el selector siempre ofrece todas las opciones.
  const grupos = useMemo(() => {
    const map = new Map<number, string>();
    horarios.forEach((h) => h.grupos.forEach((g) => map.set(g.grupoId, g.nombreGrupo)));
    return Array.from(map.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [horarios]);

  const hayHorariosSinGrupo = useMemo(() => horarios.some((h) => h.grupos.length === 0), [horarios]);

  // Color estable por grupo según el orden en que aparece.
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

  // Si el grupo elegido ya no existe en los datos (p. ej. tras recargar), se vuelve a "todos".
  const grupoValido =
    grupoFiltro === TODOS ||
    (grupoFiltro === SIN_GRUPO ? hayHorariosSinGrupo : grupos.some((g) => String(g.id) === grupoFiltro));
  const grupoActivo = grupoValido ? grupoFiltro : TODOS;

  const visibles = useMemo(
    () =>
      horarios.filter((h) => {
        if (grupoActivo === SIN_GRUPO) {
          if (h.grupos.length > 0) return false;
        } else if (grupoActivo !== TODOS) {
          if (!h.grupos.some((g) => String(g.grupoId) === grupoActivo)) return false;
        }
        if (franja !== "todas" && franjaDe(h) !== franja) return false;
        return true;
      }),
    [horarios, grupoActivo, franja],
  );

  const hayFiltros = grupoActivo !== TODOS || franja !== "todas" || soloDiasConClases;
  const limpiarFiltros = () => {
    setGrupoFiltro(TODOS);
    setFranja("todas");
    setSoloDiasConClases(false);
  };

  // El rango de horas se ajusta a lo que se está viendo.
  const { startHour, endHour } = useMemo(() => {
    if (visibles.length === 0) return { startHour: 7, endHour: 21 };
    const minStart = Math.min(...visibles.map((h) => toMinutos(h.horaInicio)));
    const maxEnd = Math.max(...visibles.map((h) => toMinutos(h.horaFin)));
    const sH = Math.floor(minStart / 60);
    let eH = Math.ceil(maxEnd / 60);
    if (eH - sH < 6) eH = sH + 6;
    return { startHour: sH, endHour: eH };
  }, [visibles]);

  const horas = useMemo(
    () => Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i),
    [startHour, endHour],
  );

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, HorarioResponseDTO[]>();
    DIAS_SEMANA.forEach((d) => map.set(d.key, []));
    visibles.forEach((h) => {
      const key = normalizarDia(h.dia);
      if (map.has(key)) map.get(key)!.push(h);
    });
    return map;
  }, [visibles]);

  const dias = useMemo(
    () =>
      soloDiasConClases
        ? DIAS_SEMANA.filter((d) => (eventosPorDia.get(d.key) ?? []).length > 0)
        : DIAS_SEMANA,
    [soloDiasConClases, eventosPorDia],
  );

  const diaSel = dias.some((d) => d.key === diaMovil) ? diaMovil : dias[0]?.key;
  const agendaDia = useMemo(
    () =>
      [...(eventosPorDia.get(diaSel ?? "") ?? [])].sort(
        (a, b) => toMinutos(a.horaInicio) - toMinutos(b.horaInicio) || toMinutos(a.horaFin) - toMinutos(b.horaFin),
      ),
    [eventosPorDia, diaSel],
  );
  const hoyKey = KEY_POR_GETDAY[new Date().getDay()];

  // Pulsar un grupo en la leyenda equivale a elegirlo en el selector; volver a pulsarlo lo quita.
  const alternarGrupo = (grupoId: number) =>
    setGrupoFiltro((actual) => (actual === String(grupoId) ? TODOS : String(grupoId)));

  const grupoSeleccionado =
    grupoActivo !== TODOS && grupoActivo !== SIN_GRUPO
      ? grupos.find((g) => String(g.id) === grupoActivo)
      : undefined;

  async function descargarCalendarioDelGrupo() {
    if (!grupoSeleccionado) return;
    setDescargando(true);
    try {
      const nombreSeguro = grupoSeleccionado.nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
      await descargarIcs(
        `/api/comunicados/calendario/grupo/${grupoSeleccionado.id}`,
        `horario-${nombreSeguro || grupoSeleccionado.id}.ics`,
      );
    } catch {
      toast.error("No se pudo descargar el calendario del grupo.");
    } finally {
      setDescargando(false);
    }
  }

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
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="w-full space-y-1 sm:w-auto">
            <Label htmlFor="cal-grupo" className="text-xs text-muted-foreground">
              Grupo
            </Label>
            <Select value={grupoActivo} onValueChange={setGrupoFiltro}>
              <SelectTrigger id="cal-grupo" className="w-full sm:w-52">
                <SelectValue placeholder="Todos los grupos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos los grupos</SelectItem>
                {grupos.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.nombre}
                  </SelectItem>
                ))}
                {hayHorariosSinGrupo && <SelectItem value={SIN_GRUPO}>Sin grupo asignado</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1 sm:w-auto">
            <span className="text-xs text-muted-foreground">Franja del día</span>
            <ToggleGroup
              type="single"
              variant="outline"
              className="flex-wrap justify-start"
              value={franja}
              onValueChange={(v) => setFranja((v || "todas") as Franja)}
              aria-label="Filtrar por franja del día"
            >
              {FRANJAS.map((f) => (
                <ToggleGroupItem key={f.valor} value={f.valor} title={f.ayuda} className="text-xs">
                  {f.etiqueta}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              id="cal-solo-dias"
              checked={soloDiasConClases}
              onCheckedChange={(v) => setSoloDiasConClases(v === true)}
            />
            <Label htmlFor="cal-solo-dias" className="text-sm font-normal">
              Ocultar días sin entrenamiento
            </Label>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {grupoSeleccionado && puedeDescargar && (
              <Button
                variant="outline"
                size="sm"
                onClick={descargarCalendarioDelGrupo}
                disabled={descargando}
                title="Descarga un archivo .ics para Google Calendar, Outlook o el calendario del teléfono"
              >
                <Download className="mr-2 h-4 w-4" />
                {descargando ? "Descargando…" : "Añadir a mi calendario"}
              </Button>
            )}
            {hayFiltros && (
              <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                <FilterX className="mr-2 h-4 w-4" />
                Quitar filtros
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground" aria-live="polite">
          Mostrando {visibles.length} de {horarios.length} horarios
        </p>

        {visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed py-10 text-center text-muted-foreground">
            <CalendarDays className="h-6 w-6" />
            <p>Ningún horario coincide con estos filtros.</p>
            <Button variant="outline" size="sm" onClick={limpiarFiltros}>
              Quitar filtros
            </Button>
          </div>
        ) : (
        <>
        {/* Teléfono: agenda de un día, con selector de día arriba. */}
        <div className="space-y-3 md:hidden">
          <div role="tablist" aria-label="Día de la semana" className="grid gap-1" style={{ gridTemplateColumns: `repeat(${dias.length}, minmax(0, 1fr))` }}>
            {dias.map((d) => {
              const n = (eventosPorDia.get(d.key) ?? []).length;
              const sel = d.key === diaSel;
              return (
                <button
                  key={d.key}
                  type="button"
                  role="tab"
                  aria-selected={sel}
                  aria-label={`${d.label}: ${n} ${n === 1 ? "entrenamiento" : "entrenamientos"}`}
                  onClick={() => setDiaMovil(d.key)}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center rounded-lg border text-xs font-medium transition-colors",
                    sel ? "border-primary bg-primary text-primary-foreground" : "bg-background",
                    !sel && d.key === hoyKey && "border-primary text-primary",
                  )}
                >
                  <span>{d.corto}</span>
                  <span className={cn("mt-1 h-1.5 w-1.5 rounded-full", n > 0 ? (sel ? "bg-primary-foreground" : "bg-primary") : "bg-transparent")} />
                </button>
              );
            })}
          </div>
          {agendaDia.length === 0 ? (
            <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
              Sin entrenamientos este día.
            </p>
          ) : (
            <ul className="space-y-2">
              {agendaDia.map((h) => {
                const nombres = h.grupos.map((g) => g.nombreGrupo);
                const color =
                  h.grupos.length > 0
                    ? colorPorGrupoId.get(h.grupos[0].grupoId)
                    : "bg-muted text-muted-foreground border-dashed";
                return (
                  <li key={h.id} className={cn("rounded-lg border px-3 py-2.5", color)}>
                    <div className="text-base font-semibold">
                      {formatHora(h.horaInicio)} – {formatHora(h.horaFin)}
                    </div>
                    <div className="text-sm">{nombres.length > 0 ? nombres.join(", ") : "Sin grupo"}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Tablet y escritorio: semana completa. */}
        <div className="hidden overflow-x-auto md:block">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `56px repeat(${dias.length}, minmax(130px, 1fr))`,
              minWidth: `${56 + dias.length * 130}px`,
            }}
          >
            {/* Encabezado de días */}
            <div />
            {dias.map((d) => (
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
            {dias.map((d) => {
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
        </>
        )}

        {/* Leyenda de grupos: pulsar uno filtra por ese grupo */}
        {grupos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
            <span className="text-xs text-muted-foreground">Pulsa un grupo para filtrar:</span>
            {grupos.map((g) => {
              const seleccionado = grupoActivo === String(g.id);
              const atenuado = grupoActivo !== TODOS && !seleccionado;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => alternarGrupo(g.id)}
                  aria-pressed={seleccionado}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      colorPorGrupoId.get(g.id),
                      "cursor-pointer transition-opacity",
                      seleccionado && "ring-2 ring-current",
                      atenuado && "opacity-40",
                    )}
                  >
                    {g.nombre}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}