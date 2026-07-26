"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "react-toastify";
import {
  EstadoPago,
  FacturaConSaldo,
  MetodoPago,
  TipoPago,
  formatCOP,
  mensajeError,
  obtenerMetodosPago,
  obtenerTiposPago,
  registrarPago,
} from "@/app/lib/facturas-pagos";

export default function RegistrarPagoModal({
  open,
  onOpenChange,
  facturas,
  facturaPreseleccionada,
  onPagoRegistrado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facturas: FacturaConSaldo[]; // solo facturas con saldo pendiente > 0
  facturaPreseleccionada?: FacturaConSaldo | null;
  onPagoRegistrado: () => void;
}) {
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [tiposPago, setTiposPago] = useState<TipoPago[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);

  const [facturaId, setFacturaId] = useState<string>("");
  const [tipoPagoId, setTipoPagoId] = useState<string>("");
  const [metodoPagoId, setMetodoPagoId] = useState<string>("");
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [monto, setMonto] = useState<string>("");
  const [estado, setEstado] = useState<EstadoPago>("Pagado");

  const facturaSeleccionada = useMemo(
    () => facturas.find((f) => String(f.id) === facturaId) ?? null,
    [facturas, facturaId],
  );

  useEffect(() => {
    if (!open) return;

    setCargandoCatalogos(true);
    setTipoPagoId("");
    setMetodoPagoId("");
    setFecha(new Date().toISOString().slice(0, 10));
    setEstado("Pagado");

    if (facturaPreseleccionada) {
      setFacturaId(String(facturaPreseleccionada.id));
      setMonto(String(facturaPreseleccionada.saldoPendiente));
    } else {
      setFacturaId("");
      setMonto("");
    }

    Promise.allSettled([obtenerTiposPago(), obtenerMetodosPago()]).then(
      ([resTipos, resMetodos]) => {
        if (resTipos.status === "fulfilled") {
          setTiposPago(resTipos.value);
          if (resTipos.value.length === 0) {
            toast.error(
              "No hay tipos de pago configurados. Agrega registros a la tabla tipos_pago (ej. Inscripción, Mensualidad).",
            );
          }
        } else {
          toast.error("No se pudieron cargar los tipos de pago");
        }

        if (resMetodos.status === "fulfilled") {
          setMetodosPago(resMetodos.value);
          if (resMetodos.value.length === 0) {
            toast.error(
              "No hay métodos de pago configurados. Agrega registros a la tabla metodos_pago (ej. Efectivo, Transferencia).",
            );
          }
        } else {
          toast.error("No se pudieron cargar los métodos de pago");
        }

        setCargandoCatalogos(false);
      },
    );
  }, [open, facturaPreseleccionada]);

  const handleFacturaChange = (value: string) => {
    setFacturaId(value);
    const factura = facturas.find((f) => String(f.id) === value);
    if (factura) setMonto(String(factura.saldoPendiente));
  };

  const handleSubmit = async () => {
    if (!facturaId || !tipoPagoId || !metodoPagoId || !monto) {
      toast.error("Completa todos los campos antes de guardar");
      return;
    }

    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      toast.error("El monto debe ser mayor a cero");
      return;
    }

    setGuardando(true);
    try {
      await registrarPago({
        facturaId: Number(facturaId),
        tipoPagoId: Number(tipoPagoId),
        metodoPagoId: Number(metodoPagoId),
        fecha,
        estado,
        monto: montoNum,
      });
      toast.success("Pago registrado correctamente");
      onPagoRegistrado();
      onOpenChange(false);
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo registrar el pago"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Registrar pago
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Factura</Label>
            <Select
              value={facturaId}
              onValueChange={handleFacturaChange}
              disabled={!!facturaPreseleccionada}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una factura" />
              </SelectTrigger>
              <SelectContent>
                {facturas.length === 0 ? (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No hay facturas con saldo pendiente
                  </p>
                ) : (
                  facturas.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.numeroFactura} — {f.persona.nombre}{" "}
                      {f.persona.apellidos} ({formatCOP(f.saldoPendiente)}{" "}
                      pendiente)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {facturaSeleccionada && (
            <p className="text-xs text-muted-foreground">
              Saldo pendiente de esta factura:{" "}
              {formatCOP(facturaSeleccionada.saldoPendiente)}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Tipo de pago</Label>
              <Select value={tipoPagoId} onValueChange={setTipoPagoId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={cargandoCatalogos ? "Cargando…" : "Selecciona"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {tiposPago.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Método de pago</Label>
              <Select value={metodoPagoId} onValueChange={setMetodoPagoId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={cargandoCatalogos ? "Cargando…" : "Selecciona"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {metodosPago.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.metodo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Monto</Label>
              <Input
                type="number"
                min={0}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Estado</Label>
            <Select
              value={estado}
              onValueChange={(v) => setEstado(v as EstadoPago)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pagado">Pagado</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={guardando}>
            {guardando ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar pago"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}