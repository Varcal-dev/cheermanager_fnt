"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api";
import { moneda } from "@/app/lib/paquetes";
import { pagosWompiApi, type EstadoPagoEnLinea } from "@/app/lib/pagos-wompi";

const MESES = [1, 3, 6, 12];
const INTENTOS_MAX = 20; // el webhook de Wompi suele tardar segundos; se consulta cada 3 s hasta 1 minuto

/**
 * Pagar la suscripción del club con Wompi. El pago real lo confirma el webhook en el servidor: al volver del
 * checkout (?pago=referencia) esta tarjeta solo consulta el estado y avisa.
 */
export default function PagarSuscripcion({ onPagado }: { onPagado: () => void }) {
  const [estado, setEstado] = useState<EstadoPagoEnLinea | null>(null);
  const [meses, setMeses] = useState("1");
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const aviso = useRef(onPagado);
  aviso.current = onPagado;

  useEffect(() => {
    pagosWompiApi.estado().then(setEstado).catch(() => setEstado(null));
  }, []);

  // Regreso del checkout: /plan-y-datos?pago=CM2-xxxx
  useEffect(() => {
    let ref: string | null = null;
    try {
      ref = new URLSearchParams(window.location.search).get("pago");
    } catch {
      ref = null;
    }
    if (!ref) return;
    let intentos = 0;
    let vivo = true;
    setMensaje("Confirmando tu pago…");
    const consultar = async () => {
      intentos += 1;
      try {
        const t = await pagosWompiApi.consultar(ref!);
        if (!vivo) return;
        if (t.estado === "APROBADA") {
          setMensaje(null);
          toast.success("¡Pago recibido! Tu suscripción fue renovada.");
          aviso.current();
          window.history.replaceState(null, "", window.location.pathname);
          return;
        }
        if (t.estado !== "CREADA") {
          setMensaje(null);
          toast.error(t.estado === "RECHAZADA" ? "El pago fue rechazado. Puedes intentarlo de nuevo." : "El pago no se completó.");
          window.history.replaceState(null, "", window.location.pathname);
          return;
        }
      } catch {
        // se reintenta
      }
      if (intentos >= INTENTOS_MAX) {
        setMensaje("Aún no recibimos la confirmación del pago. Si ya pagaste, se reflejará en unos minutos; recarga la página más tarde.");
        return;
      }
      setTimeout(consultar, 3000);
    };
    consultar();
    return () => {
      vivo = false;
    };
  }, []);

  if (!estado) return null;

  const total = estado.totalMensual * Number(meses);

  const pagar = async () => {
    setOcupado(true);
    try {
      const c = await pagosWompiApi.iniciar(Number(meses));
      window.location.href = c.url;
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo iniciar el pago"));
      setOcupado(false);
    }
  };

  return (
    <section className="space-y-3 rounded-md border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">Pagar mi suscripción</h2>
        {estado.sandbox && <Badge variant="secondary">Modo de pruebas</Badge>}
      </div>
      {mensaje && <p className="text-sm">{mensaje}</p>}
      {!estado.habilitado ? (
        <p className="text-sm text-muted-foreground">El pago en línea todavía no está disponible para tu club. Contacta a CheerManager.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Tu plan cuesta {moneda(estado.precioMensual)}/mes
            {estado.costoPaquetes > 0 ? ` + ${moneda(estado.costoPaquetes)}/mes en paquetes de cupo` : ""}. Pagas con tarjeta, PSE o Nequi en la página segura de Wompi.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <Select value={meses} onValueChange={setMeses}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m} value={String(m)}>{m} {m === 1 ? "mes" : "meses"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-lg font-bold">{moneda(total)}</div>
            <Button onClick={pagar} disabled={ocupado}>{ocupado ? "Abriendo Wompi…" : "Pagar con Wompi"}</Button>
          </div>
        </>
      )}
    </section>
  );
}
