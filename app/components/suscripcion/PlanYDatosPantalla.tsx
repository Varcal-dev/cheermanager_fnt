"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import { funcionesApi, type FuncionPerdida } from "@/app/lib/funciones";
import { paquetesApi, moneda, type VistaPaquetes } from "@/app/lib/paquetes";
import { ETIQUETA_VIGENCIA, fechaCorta, suscripcionApi, type ResumenSuscripcion } from "@/app/lib/suscripcion";

export default function PlanYDatosPantalla() {
  const { permissions } = useUser();
  const puedeExportar = permissions.includes("exportar_listados");
  const [resumen, setResumen] = useState<ResumenSuscripcion | null>(null);
  const [perdidas, setPerdidas] = useState<FuncionPerdida[] | null>(null);
  const [paquetes, setPaquetes] = useState<VistaPaquetes | null>(null);
  const [bajando, setBajando] = useState<string | null>(null);

  useEffect(() => {
    suscripcionApi.propia().then(setResumen).catch(() => {});
    funcionesApi.propias().then((f) => setPerdidas(f.perdidas ?? [])).catch((e) => toast.error(getErrorMessage(e, "No se pudo cargar el plan")));
    paquetesApi.propios().then(setPaquetes).catch(() => {});
  }, []);

  const descargar = async (codigo: string) => {
    setBajando(codigo);
    try {
      await funcionesApi.exportar(codigo);
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo descargar"));
    } finally {
      setBajando(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plan y mis datos</h1>
        <p className="text-muted-foreground">Tu plan, tu cupo y la descarga de tus datos. Tus datos son tuyos: nunca se borran por cambiar de plan.</p>
      </div>

      {resumen && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3"><div className="text-xl font-bold">{resumen.planNombre ?? "Sin plan"}</div><div className="text-sm text-muted-foreground">{ETIQUETA_VIGENCIA[resumen.vigencia]}{resumen.vigenteHasta ? ` · hasta ${fechaCorta(resumen.vigenteHasta)}` : ""}</div></div>
          <div className="rounded-md border p-3"><div className="text-xl font-bold">{resumen.deportistasActivos} / {resumen.limiteEfectivo ?? "∞"}</div><div className="text-sm text-muted-foreground">Deportistas activos / cupo{resumen.cupoExtraPaquetes ? ` (incluye +${resumen.cupoExtraPaquetes} por paquetes)` : ""}</div></div>
          {paquetes && paquetes.ofrecidos.length > 0 && (
            <div className="rounded-md border p-3">
              <div className="text-sm font-medium">¿Necesitas más cupo?</div>
              <div className="text-sm text-muted-foreground">Paquetes de tu plan: {paquetes.ofrecidos.map((p) => `+${p.deportistasExtra} por ${moneda(p.precioMensual)}/mes`).join(", ")}. Pídelo a CheerManager.</div>
            </div>
          )}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Funciones que ya no están en tu plan</h2>
        {perdidas === null && <p className="text-muted-foreground">Cargando…</p>}
        {perdidas !== null && perdidas.length === 0 && <p className="text-muted-foreground">Tu plan incluye todo lo que has usado. No hay nada pendiente.</p>}
        {(perdidas ?? []).map((p) => (
          <div key={p.funcion} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
            <div>
              <div className="font-medium">{p.nombre}</div>
              <div className="text-sm text-muted-foreground">
                {p.estado === "SOLO_LECTURA"
                  ? `Solo lectura hasta el ${fechaCorta(p.soloLecturaHasta)}: puedes consultarla, no crear ni editar.`
                  : `Bloqueada desde el ${fechaCorta(p.soloLecturaHasta)}. Tus datos siguen guardados; para volver a usarla, sube de plan.`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={p.estado === "SOLO_LECTURA" ? "outline" : "secondary"}>{p.estado === "SOLO_LECTURA" ? "Solo lectura" : "Bloqueada"}</Badge>
              {puedeExportar && <Button size="sm" variant="outline" disabled={bajando === p.funcion} onClick={() => descargar(p.funcion)}>Descargar mis datos</Button>}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
