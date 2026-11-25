import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calcularFacturasConSaldo,
  calcularUnaFacturaConSaldo,
  formatCOP,
  mensajeError,
  type Factura,
  type Pago,
} from "@/app/lib/facturas-pagos";

// Solo los campos que usa el cálculo; el resto de la forma de Factura/Pago no importa aquí.
const factura = (extra: Partial<Factura> = {}): Factura =>
  ({ id: 1, total: 100_000, anulada: false, ...extra }) as unknown as Factura;
const pago = (extra: Partial<Pago> = {}): Pago =>
  ({ id: 1, facturaId: 1, monto: 40_000, estado: "Pagado", ...extra }) as unknown as Pago;

afterEach(() => vi.useRealTimers());

describe("calcularUnaFacturaConSaldo", () => {
  describe("con el cálculo del servidor", () => {
    it("usa tal cual totalPagado y saldoPendiente y traduce el estado", () => {
      const r = calcularUnaFacturaConSaldo(
        factura({ estadoCuenta: "ABONO_PARCIAL", totalPagado: 30_000, saldoPendiente: 70_000 } as Partial<Factura>),
        [pago({ monto: 999_999 })], // los pagos locales se ignoran cuando el servidor ya calculó
      );
      expect(r.estadoCuenta).toBe("Abono parcial");
      expect(r.totalPagado).toBe(30_000);
      expect(r.saldoPendiente).toBe(70_000);
    });

    it("traduce cada código de estado", () => {
      const casos: Record<string, string> = {
        PAGADA: "Pagado", ABONO_PARCIAL: "Abono parcial", PENDIENTE: "Sin pagos", EN_MORA: "En mora", ANULADA: "Anulada",
      };
      for (const [codigo, etiqueta] of Object.entries(casos)) {
        const r = calcularUnaFacturaConSaldo(
          factura({ estadoCuenta: codigo, totalPagado: 0, saldoPendiente: 0 } as Partial<Factura>), []);
        expect(r.estadoCuenta).toBe(etiqueta);
      }
    });
  });

  describe("respaldo local (sin datos del servidor)", () => {
    it("sin pagos: Sin pagos y saldo = total", () => {
      const r = calcularUnaFacturaConSaldo(factura(), []);
      expect(r).toMatchObject({ totalPagado: 0, saldoPendiente: 100_000, estadoCuenta: "Sin pagos" });
    });

    it("abono parcial: solo cuentan pagos PAGADOS de ESA factura", () => {
      const r = calcularUnaFacturaConSaldo(factura(), [
        pago({ id: 1, monto: 40_000 }),
        pago({ id: 2, monto: 25_000, estado: "Anulado" }),
        pago({ id: 3, monto: 10_000, estado: "Pendiente" }),
        pago({ id: 4, monto: 50_000, facturaId: 2 }),
      ]);
      expect(r).toMatchObject({ totalPagado: 40_000, saldoPendiente: 60_000, estadoCuenta: "Abono parcial" });
    });

    it("pagada completa: saldo 0", () => {
      const r = calcularUnaFacturaConSaldo(factura(), [pago({ monto: 100_000 })]);
      expect(r).toMatchObject({ saldoPendiente: 0, estadoCuenta: "Pagado" });
    });

    it("un sobrepago nunca deja saldo negativo", () => {
      const r = calcularUnaFacturaConSaldo(factura(), [pago({ monto: 150_000 })]);
      expect(r.saldoPendiente).toBe(0);
      expect(r.estadoCuenta).toBe("Pagado");
    });

    it("anulada: saldo 0 y estado Anulada, aunque no tenga pagos", () => {
      const r = calcularUnaFacturaConSaldo(factura({ anulada: true }), []);
      expect(r).toMatchObject({ saldoPendiente: 0, estadoCuenta: "Anulada" });
    });

    it("vencida y con saldo: En mora (incluso con abonos)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
      const vencida = factura({ fechaVencimiento: "2026-06-10" } as Partial<Factura>);
      expect(calcularUnaFacturaConSaldo(vencida, []).estadoCuenta).toBe("En mora");
      expect(calcularUnaFacturaConSaldo(vencida, [pago({ monto: 10_000 })]).estadoCuenta).toBe("En mora");
    });

    it("el mismo día del vencimiento todavía NO está en mora", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-10T12:00:00Z"));
      const r = calcularUnaFacturaConSaldo(factura({ fechaVencimiento: "2026-06-10" } as Partial<Factura>), []);
      expect(r.estadoCuenta).toBe("Sin pagos");
    });

    it("vencida pero ya pagada: Pagado, no En mora", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
      const r = calcularUnaFacturaConSaldo(
        factura({ fechaVencimiento: "2026-06-10" } as Partial<Factura>), [pago({ monto: 100_000 })]);
      expect(r.estadoCuenta).toBe("Pagado");
    });
  });
});

describe("calcularFacturasConSaldo", () => {
  it("calcula cada factura con SUS pagos", () => {
    const r = calcularFacturasConSaldo(
      [factura({ id: 1 }), factura({ id: 2, total: 50_000 })],
      [pago({ facturaId: 1, monto: 100_000 }), pago({ id: 2, facturaId: 2, monto: 20_000 })],
    );
    expect(r.map((f) => [f.saldoPendiente, f.estadoCuenta])).toEqual([[0, "Pagado"], [30_000, "Abono parcial"]]);
  });
});

describe("formatCOP / mensajeError", () => {
  const plano = (s: string) => s.replace(/\s/g, " ");

  it("formatea pesos colombianos sin decimales", () => {
    const t = plano(formatCOP(1_234_567));
    expect(t).toContain("1.234.567");
    expect(t).toContain("$");
    expect(t).not.toContain(",");
  });

  it("cero, NaN y undefined se muestran como $ 0", () => {
    for (const v of [0, NaN, undefined as unknown as number]) {
      expect(plano(formatCOP(v))).toMatch(/\$ ?0$/);
    }
  });

  it("mensajeError toma el message del servidor o el texto de respaldo", () => {
    expect(mensajeError({ response: { data: { message: "Caja cerrada" } } }, "Falló")).toBe("Caja cerrada");
    expect(mensajeError({}, "Falló")).toBe("Falló");
    expect(mensajeError(null, "Falló")).toBe("Falló");
  });
});
