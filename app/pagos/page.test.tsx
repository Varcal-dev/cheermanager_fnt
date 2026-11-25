import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PagosPage from "@/app/pagos/page";

// La pantalla de Pagos pagina en el servidor (PERF-01): estas pruebas fijan lo que pide a la API y lo que muestra.
const h = vi.hoisted(() => ({
  permisos: [] as string[],
  conSaldo: vi.fn(),
  resumen: vi.fn(),
  pagosPagina: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/context/UserContext", () => ({ useUser: () => ({ permissions: h.permisos }) }));
vi.mock("react-toastify", () => ({ toast: { error: h.toastError, success: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock("@/app/components/Forms/RegistrarPagoModal", () => ({ default: () => null }));
vi.mock("@/app/components/Forms/AnularDialog", () => ({ default: () => null }));
vi.mock("@/app/components/pagos/RecordatoriosMoraCard", () => ({ default: () => <div>RECORDATORIOS</div> }));
vi.mock("@/app/lib/facturas-pagos", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("@/app/lib/facturas-pagos")>()),
  obtenerFacturasConSaldo: h.conSaldo,
  obtenerResumenPagos: h.resumen,
  obtenerPagosPagina: h.pagosPagina,
}));

const factura = (id: number, nombre: string, saldo = 50_000) => ({
  id, numeroFactura: `F-${id}`, total: 100_000, anulada: false, totalPagado: 100_000 - saldo, saldoPendiente: saldo,
  estadoCuenta: "ABONO_PARCIAL", persona: { id, nombre, apellidos: "Prueba" },
});
const pago = (id: number, numero: string) => ({
  id, facturaId: id, numeroFactura: numero, totalFactura: 100_000, tipoPagoId: 1, tipoPago: "Mensualidad",
  metodoPagoId: 1, metodoPago: "Efectivo", fecha: "2026-06-10", estado: "Pagado", monto: 40_000, saldoPendienteFactura: 0,
});
const pagina = (contenido: unknown[], total: number, paginas: number, pag = 0) =>
  ({ contenido, pagina: pag, tamano: 20, totalElementos: total, totalPaginas: paginas });

const plano = (t: string | null) => (t ?? "").replace(/\s/g, " ");
// TablaResponsiva dibuja la tabla (escritorio) y las tarjetas (movil) a la vez: cada texto aparece dos veces.
const aparece = async (texto: string) => (await screen.findAllByText(texto)).length > 0;
const hay = (texto: string) => screen.queryAllByText(texto).length > 0;

beforeEach(() => {
  h.permisos = [];
  h.toastError.mockReset();
  h.resumen.mockReset().mockResolvedValue({ totalRecaudado: 1_500_000, totalPendiente: 275_000 });
  h.conSaldo.mockReset().mockResolvedValue(pagina([factura(1, "Ana"), factura(2, "Luis")], 2, 1));
  h.pagosPagina.mockReset().mockResolvedValue(pagina([pago(1, "F-101"), pago(2, "F-102")], 45, 3));
});

describe("Pantalla de Pagos", () => {
  it("al abrir pide la primera página (20 por página) y los totales al servidor, no las listas completas", async () => {
    render(<PagosPage />);
    expect(await aparece("F-101")).toBe(true);

    expect(h.pagosPagina).toHaveBeenCalledWith({ q: "", pagina: 0, tamano: 20 });
    expect(h.resumen).toHaveBeenCalledTimes(1);
    expect(h.conSaldo).toHaveBeenCalledTimes(1);
  });

  it("las tarjetas salen del resumen del servidor", async () => {
    render(<PagosPage />);
    await aparece("F-101");
    const cuerpo = plano(document.body.textContent);
    expect(cuerpo).toContain("1.500.000");
    expect(cuerpo).toContain("275.000");
  });

  it("el título de la cartera usa el total real que informa el servidor", async () => {
    h.conSaldo.mockResolvedValue(pagina([factura(1, "Ana")], 37, 1));
    render(<PagosPage />);
    expect(await screen.findByText(/Cartera pendiente \(37 facturas\)/)).toBeInTheDocument();
  });

  it("avisa cuando la lista de facturas con saldo se truncó por el tope del servidor", async () => {
    h.conSaldo.mockResolvedValue(pagina([factura(1, "Ana")], 600, 1));
    render(<PagosPage />);
    expect(await screen.findByText(/Se muestran las 1 facturas con saldo más recientes de 600/)).toBeInTheDocument();
  });

  it("muestra el rango y la página actual", async () => {
    render(<PagosPage />);
    expect(await screen.findByText(/Mostrando 1–20 de 45 pagos/)).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });

  it("'Siguiente' pide la página siguiente; 'Anterior' vuelve y está desactivado en la primera", async () => {
    const usuario = userEvent.setup();
    render(<PagosPage />);
    await aparece("F-101");

    expect(screen.getByRole("button", { name: /Anterior/ })).toBeDisabled();
    h.pagosPagina.mockResolvedValue(pagina([pago(21, "F-121")], 45, 3, 1));
    await usuario.click(screen.getByRole("button", { name: /Siguiente/ }));

    expect(await aparece("F-121")).toBe(true);
    expect(h.pagosPagina).toHaveBeenLastCalledWith({ q: "", pagina: 1, tamano: 20 });
    expect(screen.getByText(/Mostrando 21–40 de 45 pagos/)).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: /Anterior/ }));
    await waitFor(() => expect(h.pagosPagina).toHaveBeenLastCalledWith({ q: "", pagina: 0, tamano: 20 }));
  });

  it("en la última página 'Siguiente' está desactivado", async () => {
    h.pagosPagina.mockResolvedValue(pagina([pago(1, "F-101")], 1, 1));
    render(<PagosPage />);
    await aparece("F-101");
    expect(screen.getByRole("button", { name: /Siguiente/ })).toBeDisabled();
  });

  it("buscar espera a que dejes de escribir y consulta UNA vez al servidor, volviendo a la página 1", async () => {
    const usuario = userEvent.setup();
    render(<PagosPage />);
    await aparece("F-101");
    h.pagosPagina.mockClear();

    await usuario.type(screen.getByPlaceholderText(/Buscar por número de factura/), "ana");

    await waitFor(() => expect(h.pagosPagina).toHaveBeenCalledWith({ q: "ana", pagina: 0, tamano: 20 }));
    const busquedas = h.pagosPagina.mock.calls.map((c) => c[0].q).filter((q: string) => q !== "");
    expect(busquedas).toEqual(["ana"]); // nada de "a" ni "an"
  });

  it("la búsqueda también filtra al instante las facturas con saldo (lista acotada, en el navegador)", async () => {
    const usuario = userEvent.setup();
    render(<PagosPage />);
    await aparece("Ana Prueba");
    expect(hay("Luis Prueba")).toBe(true);

    await usuario.type(screen.getByPlaceholderText(/Buscar por número de factura/), "luis");

    await waitFor(() => expect(hay("Ana Prueba")).toBe(false));
    expect(hay("Luis Prueba")).toBe(true);
  });

  it("sin pagos: mensaje distinto si hubo búsqueda o no", async () => {
    h.pagosPagina.mockResolvedValue(pagina([], 0, 0));
    const usuario = userEvent.setup();
    render(<PagosPage />);
    expect(await screen.findByText("No hay pagos registrados todavía")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Siguiente/ })).not.toBeInTheDocument();

    await usuario.type(screen.getByPlaceholderText(/Buscar por número de factura/), "zzz");
    expect(await screen.findByText("Ningún pago coincide con la búsqueda")).toBeInTheDocument();
  });

  it("si falla el resumen avisa y muestra $ 0 en las tarjetas, sin romper la pantalla", async () => {
    h.resumen.mockRejectedValue(new Error("falló"));
    render(<PagosPage />);
    await aparece("F-101");
    expect(h.toastError).toHaveBeenCalledWith("No se pudieron cargar los totales de pagos");
    expect(plano(document.body.textContent)).toMatch(/\$ ?0/);
  });

  it("si falla el historial avisa con el mensaje del servidor", async () => {
    h.pagosPagina.mockRejectedValue({ response: { data: { message: "Sin permiso para ver pagos" } } });
    render(<PagosPage />);
    await waitFor(() => expect(h.toastError).toHaveBeenCalledWith("Sin permiso para ver pagos"));
  });

  it("el acceso a recordatorios de mora depende del permiso", async () => {
    const { unmount } = render(<PagosPage />);
    await aparece("F-101");
    expect(screen.queryByText("RECORDATORIOS")).not.toBeInTheDocument();
    unmount();

    h.permisos = ["gestionar_recordatorios_mora"];
    render(<PagosPage />);
    expect(await screen.findByText("RECORDATORIOS")).toBeInTheDocument();
  });

  it("solo quien tiene 'anular_pago' ve el botón Anular en el historial", async () => {
    const { unmount } = render(<PagosPage />);
    await aparece("F-101");
    expect(screen.queryAllByRole("button", { name: /Anular/ })).toHaveLength(0);
    unmount();

    h.permisos = ["anular_pago"];
    render(<PagosPage />);
    await aparece("F-101");
    expect(screen.queryAllByRole("button", { name: /Anular/ }).length).toBeGreaterThan(0);
  });
});
