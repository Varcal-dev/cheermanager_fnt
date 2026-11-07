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

// El tipo de pago sale del motivo por el que se generó la factura (concepto). Los nombres de
// tipos_pago son un catálogo ("Mensualidad", "Inscripción", "Uniforme", "Evento/Competencia",
// "Producto de tienda"), así que se busca por palabra clave sin tildes ni mayúsculas.
const sinTildes = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const PALABRAS_POR_CONCEPTO: Record<string, string[]> = {
  INSCRIPCION: ["inscripcion"],
  MENSUALIDAD: ["mensualidad"],
  TIENDA: ["tienda"],
  UNIFORME: ["uniforme"],
  COMPETENCIA: ["competencia", "evento"],
  EVENTO: ["evento", "competencia"],
};

/** Tipo de pago que corresponde al motivo de la factura, o null si no hay equivalente (p. ej. "Otro cobro"). */
function tipoPagoDeFactura(factura: FacturaConSaldo | null, tipos: TipoPago[]): TipoPago | null {
  if (!factura || tipos.length === 0) return null;
  // Igual que etiquetaTipoFactura: con periodo es mensualidad; sin concepto es la inscripción.
  const concepto = factura.periodo ? "MENSUALIDAD" : (factura.concepto ?? "INSCRIPCION");
  const palabras = PALABRAS_POR_CONCEPTO[concepto];
  if (!palabras) return null;
  for (const palabra of palabras) {
    const tipo = tipos.find((t) => sinTildes(t.tipo).includes(palabra));
    if (tipo) return tipo;
  }
  return null;
}

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

  // Tipo de pago fijado por el motivo de la factura (null = no hay equivalente y se elige a mano).
  const tipoPagoDeLaFactura = useMemo(
    () => tipoPagoDeFactura(facturaSeleccionada, tiposPago),
    [facturaSeleccionada, tiposPago],
  );

  useEffect(() => {
    if (tipoPagoDeLaFactura) setTipoPagoId(String(tipoPagoDeLaFactura.id));
    else if (facturaSeleccionada) setTipoPagoId("");
  }, [tipoPagoDeLaFactura, facturaSeleccionada]);

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
    // Se reinicia solo al abrir o al cambiar de factura (por id): si el padre pasa un objeto nuevo de
    // la misma factura no se pisa el valor que el usuario está escribiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facturaPreseleccionada?.id]);

  const saldo = facturaSeleccionada?.saldoPendiente ?? 0;
  const montoNum = Number(monto);
  const montoValido = Number.isFinite(montoNum) && montoNum > 0;
  const excedeSaldo = !!facturaSeleccionada && montoValido && montoNum > saldo;
  const esAbono = !!facturaSeleccionada && montoValido && montoNum < saldo;

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

    if (!montoValido) {
      toast.error("El monto debe ser mayor a cero");
      return;
    }
    if (excedeSaldo) {
      toast.error(
        `El monto no puede superar el saldo pendiente de la factura (${formatCOP(saldo)})`,
      );
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
              <Select
                value={tipoPagoId}
                onValueChange={setTipoPagoId}
                disabled={!!tipoPagoDeLaFactura}
              >
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
              {tipoPagoDeLaFactura && (
                <p className="text-xs text-muted-foreground">
                  Según el motivo de la factura.
                </p>
              )}
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
                inputMode="decimal"
                min={0}
                max={facturaSeleccionada ? saldo : undefined}
                step="any"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                aria-invalid={excedeSaldo}
              />
            </div>
          </div>

          {facturaSeleccionada && (
            <div className="-mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              {excedeSaldo ? (
                <span className="text-destructive">
                  El monto supera el saldo pendiente ({formatCOP(saldo)}).
                </span>
              ) : esAbono ? (
                <span className="text-muted-foreground">
                  Pago parcial: quedará un saldo de {formatCOP(saldo - montoNum)}.
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Puedes escribir un valor menor para registrar un pago parcial.
                </span>
              )}
              {montoNum !== saldo && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setMonto(String(saldo))}
                >
                  Pagar saldo completo
                </Button>
              )}
            </div>
          )}

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
          <Button onClick={handleSubmit} disabled={guardando || excedeSaldo}>
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