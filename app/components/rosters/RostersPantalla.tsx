"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import {
  agregarIntegrante, cambiarIntegrante, confirmarRoster, fijarCupo, opcionesRoster, quitarIntegrante, reabrirRoster, vistaRoster,
  type OpcionRoster, type Problema, type RolRoster, type VistaRoster,
} from "@/app/lib/rosters";

function Problemas({ ps }: { ps: Problema[] }) {
  if (ps.length === 0) return <Badge variant="secondary">Apto</Badge>;
  return (
    <div className="flex flex-wrap gap-1">
      {ps.map((p, i) => <Badge key={i} variant={p.bloquea ? "destructive" : "outline"} title={p.detalle}>{p.detalle}</Badge>)}
    </div>
  );
}

const ETIQUETA = { SIN_ROSTER: "Sin roster", BORRADOR: "Borrador", CONFIRMADO: "Confirmado" } as const;

export default function RostersPantalla() {
  const { permissions } = useUser();
  const puedeEditar = permissions.includes("asignar_grupo_evento");
  const [opciones, setOpciones] = useState<OpcionRoster[] | null>(null);
  const [v, setV] = useState<VistaRoster | null>(null);
  const [cupo, setCupo] = useState("");
  const [posiciones, setPosiciones] = useState<Record<number, string>>({});
  const [ocupado, setOcupado] = useState(false);

  const cargarOpciones = () => opcionesRoster().then(setOpciones).catch((e) => toast.error(getErrorMessage(e, "No se pudieron cargar los eventos")));
  useEffect(() => { cargarOpciones(); }, []);

  const abrir = async (o: { eventoId: number; grupoId: number }) => {
    try {
      const vista = await vistaRoster(o.eventoId, o.grupoId);
      setV(vista); setCupo(vista.cupoMaximo ? String(vista.cupoMaximo) : "");
    } catch (e) { toast.error(getErrorMessage(e, "No se pudo abrir el roster")); }
  };

  const accion = async (fn: () => Promise<VistaRoster>, ok?: string) => {
    setOcupado(true);
    try {
      const vista = await fn();
      setV(vista); setCupo(vista.cupoMaximo ? String(vista.cupoMaximo) : "");
      if (ok) toast.success(ok);
      cargarOpciones();
    } catch (e) { toast.error(getErrorMessage(e, "No se pudo completar la acción")); }
    finally { setOcupado(false); }
  };

  if (!v) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roster de competencia</h1>
          <p className="text-muted-foreground">Elige el evento y el grupo para armar quién compite. Primero inscribe el grupo en el evento (Eventos y competencias).</p>
        </div>
        <div className="overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="p-2">Evento</th><th className="p-2">Fecha</th><th className="p-2">Grupo</th><th className="p-2">Roster</th><th className="p-2">Titulares / suplentes</th><th className="p-2" /></tr></thead>
            <tbody>
              {(opciones ?? []).map((o) => (
                <tr key={`${o.eventoId}-${o.grupoId}`} className="border-t">
                  <td className="p-2">{o.evento}</td><td className="p-2">{o.fecha ?? "—"}</td><td className="p-2">{o.grupo}</td>
                  <td className="p-2"><Badge variant={o.estado === "CONFIRMADO" ? "secondary" : "outline"}>{ETIQUETA[o.estado]}</Badge></td>
                  <td className="p-2">{o.titulares} / {o.suplentes}</td>
                  <td className="p-2 text-right"><Button size="sm" variant="outline" onClick={() => abrir(o)}>Abrir</Button></td>
                </tr>
              ))}
              {opciones && opciones.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={6}>Ningún grupo está inscrito en un evento todavía.</td></tr>}
              {!opciones && <tr><td className="p-6 text-center text-muted-foreground" colSpan={6}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const editable = puedeEditar && v.estado !== "CONFIRMADO";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => { setV(null); cargarOpciones(); }}>← Volver</Button>
          <h1 className="text-3xl font-bold tracking-tight">{v.grupo} · {v.evento}</h1>
          <p className="text-muted-foreground">
            {v.fecha ?? "Sin fecha"} · {ETIQUETA[v.estado]} · {v.titulares} titular(es){v.cupoMaximo ? ` de ${v.cupoMaximo}` : ""} · {v.suplentes} suplente(s).
            La aptitud se evalúa a la fecha del evento.
          </p>
        </div>
        {puedeEditar && (v.estado === "CONFIRMADO"
          ? <Button variant="outline" disabled={ocupado} onClick={() => accion(() => reabrirRoster(v.eventoId, v.grupoId), "Roster reabierto")}>Reabrir para editar</Button>
          : <Button disabled={ocupado || !v.confirmable} onClick={() => accion(() => confirmarRoster(v.eventoId, v.grupoId), "Roster confirmado")}>Confirmar roster</Button>)}
      </div>

      {v.titularesBloqueados > 0 && (
        <p className="rounded-md border border-destructive p-3 text-sm">
          {v.titularesBloqueados} titular(es) con bloqueo (lesión, documento vencido o ya no están en el grupo). {v.estado === "CONFIRMADO" ? "Reabre el roster y pásalos a suplente." : "Pásalos a suplente para poder confirmar."}
        </p>
      )}

      {editable && (
        <div className="flex items-end gap-2">
          <div><Label>Cupo máximo de titulares</Label><Input className="w-32" type="number" min={1} max={100} value={cupo} onChange={(e) => setCupo(e.target.value)} placeholder="Sin tope" /></div>
          <Button variant="outline" disabled={ocupado} onClick={() => accion(() => fijarCupo(v.eventoId, v.grupoId, cupo ? Number(cupo) : null), "Cupo guardado")}>Guardar cupo</Button>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold">En el roster</h2>
        <div className="divide-y rounded-md border">
          {v.integrantes.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div className="space-y-1">
                <div className="font-medium">{i.nombre} <Badge variant={i.rol === "TITULAR" ? "default" : "outline"}>{i.rol === "TITULAR" ? "Titular" : "Suplente"}</Badge>{i.posicion ? <span className="ml-2 text-muted-foreground">{i.posicion}</span> : null}</div>
                <Problemas ps={i.problemas} />
              </div>
              {editable && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={ocupado} onClick={() => accion(() => cambiarIntegrante(i.id, { rol: (i.rol === "TITULAR" ? "SUPLENTE" : "TITULAR") as RolRoster }))}>
                    Pasar a {i.rol === "TITULAR" ? "suplente" : "titular"}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => accion(() => quitarIntegrante(i.id))}>Quitar</Button>
                </div>
              )}
            </div>
          ))}
          {v.integrantes.length === 0 && <p className="p-6 text-center text-muted-foreground">Aún no hay nadie en el roster.</p>}
        </div>
      </div>

      {editable && (
        <div className="space-y-2">
          <h2 className="font-semibold">Deportistas del grupo disponibles</h2>
          <div className="divide-y rounded-md border">
            {v.candidatos.map((c) => (
              <div key={c.deportistaId} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <div className="space-y-1"><div className="font-medium">{c.nombre}</div><Problemas ps={c.problemas} /></div>
                <div className="flex items-center gap-2">
                  <Input className="w-36" maxLength={40} placeholder="Posición (opcional)" value={posiciones[c.deportistaId] ?? ""} onChange={(e) => setPosiciones({ ...posiciones, [c.deportistaId]: e.target.value })} />
                  <Button size="sm" disabled={ocupado} onClick={() => accion(() => agregarIntegrante(v.eventoId, v.grupoId, c.deportistaId, "TITULAR", posiciones[c.deportistaId]))}>Titular</Button>
                  <Button size="sm" variant="outline" disabled={ocupado} onClick={() => accion(() => agregarIntegrante(v.eventoId, v.grupoId, c.deportistaId, "SUPLENTE", posiciones[c.deportistaId]))}>Suplente</Button>
                </div>
              </div>
            ))}
            {v.candidatos.length === 0 && <p className="p-6 text-center text-muted-foreground">Todos los deportistas del grupo ya están en el roster.</p>}
          </div>
          <p className="text-xs text-muted-foreground">Solo se muestra si hay un bloqueo, no el detalle de salud. Los bloqueos impiden ser titular; como suplente sí se permite.</p>
        </div>
      )}
    </div>
  );
}
