"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CalendarioSemanal from "@/app/components/Horarios/CalendarioSemanal";
import { portalHorarios, type HorarioItem } from "@/app/lib/portal";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
// getDay(): 0 = domingo
const NUM_DIA: Record<string, number> = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
const hhmm = (h: string | null) => (h ?? "").slice(0, 5);

/** Próxima sesión a partir de ahora (la de hoy cuenta mientras no haya terminado). */
function proxima(horarios: HorarioItem[]): { h: HorarioItem; cuando: string } | null {
  const ahora = new Date();
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  let mejor: { h: HorarioItem; dias: number; clave: number } | null = null;
  for (const h of horarios) {
    const dia = h.dia ? NUM_DIA[norm(h.dia)] : undefined;
    if (dia === undefined || !h.horaFin || !h.horaInicio) continue;
    const [ih, im] = h.horaInicio.split(":").map(Number);
    const [fh, fm] = h.horaFin.split(":").map(Number);
    let dias = (dia - ahora.getDay() + 7) % 7;
    if (dias === 0 && fh * 60 + fm <= minAhora) dias = 7; // la de hoy ya terminó
    const clave = dias * 1440 + ih * 60 + im; // minutos desde las 00:00 de hoy
    if (!mejor || clave < mejor.clave) mejor = { h, dias, clave };
  }
  if (!mejor) return null;
  return { h: mejor.h, cuando: mejor.dias === 0 ? "Hoy" : mejor.dias === 1 ? "Mañana" : (mejor.h.dia ?? "") };
}

export default function PortalHorarios({ deportistaId }: { deportistaId: number }) {
  const [horarios, setHorarios] = useState<HorarioItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    setHorarios(null);
    setError(false);
    portalHorarios(deportistaId)
      .then((h) => activo && setHorarios(h))
      .catch(() => activo && setError(true));
    return () => {
      activo = false;
    };
  }, [deportistaId]);

  // El calendario del club recibe horarios con sus grupos; aquí cada franja pertenece a un solo grupo del deportista.
  const paraCalendario = useMemo(
    () =>
      (horarios ?? []).map((h, i) => ({
        id: i + 1,
        diaId: NUM_DIA[norm(h.dia ?? "")] ?? 0,
        dia: h.dia ?? "",
        horaInicio: h.horaInicio ?? "00:00",
        horaFin: h.horaFin ?? "00:00",
        grupos: [{ horarioEntrenamientoId: i + 1, grupoId: h.grupoId, nombreGrupo: h.grupo }],
      })),
    [horarios],
  );
  const sig = useMemo(() => proxima(horarios ?? []), [horarios]);

  if (error) return <p className="text-sm text-muted-foreground">No se pudieron cargar los horarios.</p>;
  if (!horarios) return <Loader2 className="h-5 w-5 animate-spin" />;
  if (horarios.length === 0)
    return <p className="text-sm text-muted-foreground">Aún no tienes horarios: no perteneces a ningún grupo con horario asignado.</p>;

  return (
    <div className="space-y-4">
      {sig && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CalendarClock className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Tu próximo entrenamiento</div>
              <div className="font-semibold">
                {sig.cuando} · {hhmm(sig.h.horaInicio)} a {hhmm(sig.h.horaFin)} · {sig.h.grupo}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <CalendarioSemanal horarios={paraCalendario} />
    </div>
  );
}
