import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteGuard from "@/app/components/RouteGuard";
import type { InfoFuncion } from "@/app/lib/funciones";

const h = vi.hoisted(() => ({
  sesion: {} as Record<string, unknown>,
  pathname: "/pagos",
  funcion: undefined as unknown,
}));
vi.mock("@/context/UserContext", () => ({ useUser: () => h.sesion }));
vi.mock("next/navigation", () => ({ usePathname: () => h.pathname, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/lib/funciones", () => ({ useFunciones: () => ({ info: () => h.funcion }) }));

const funcion = (extra: Partial<InfoFuncion> = {}): InfoFuncion => ({
  funcion: "TIENDA", estado: "BLOQUEADA", nombre: "Tienda", descripcion: "Vende productos del club",
  planMinimo: "Pro", soloEscritura: false, ...extra,
});

function montar() {
  return render(
    <RouteGuard>
      <p>PANTALLA</p>
    </RouteGuard>,
  );
}

beforeEach(() => {
  h.pathname = "/pagos";
  h.funcion = undefined;
  h.sesion = {
    user: { id: 1, requiereCambioPassword: false }, permissions: ["ver_pago"], loading: false,
    esPlataforma: false, legalPendiente: false,
  };
});

describe("RouteGuard: permiso del rol", () => {
  it("con el permiso muestra la pantalla", () => {
    montar();
    expect(screen.getByText("PANTALLA")).toBeInTheDocument();
  });

  it("sin el permiso muestra 'Sin acceso' y NO monta la pantalla", () => {
    h.sesion = { ...h.sesion, permissions: ["ver_factura"] };
    montar();
    expect(screen.getByRole("heading", { name: "No tienes acceso a Pagos" })).toBeInTheDocument();
    expect(screen.queryByText("PANTALLA")).not.toBeInTheDocument();
  });

  it("las subrutas también exigen el permiso", () => {
    h.pathname = "/pagos/55";
    h.sesion = { ...h.sesion, permissions: [] };
    montar();
    expect(screen.getByRole("heading", { name: /No tienes acceso/ })).toBeInTheDocument();
  });

  it("no decide nada mientras carga, sin sesión, con clave por cambiar o términos pendientes (lo resuelve ProtectedRoute)", () => {
    for (const extra of [
      { loading: true },
      { user: null },
      { user: { id: 1, requiereCambioPassword: true } },
      { legalPendiente: true },
    ]) {
      h.sesion = { ...h.sesion, permissions: [], ...extra };
      const { unmount } = montar();
      expect(screen.getByText("PANTALLA")).toBeInTheDocument();
      unmount();
    }
  });

  it("una ruta que no está en el menú no se bloquea aquí", () => {
    h.pathname = "/no-existe";
    h.sesion = { ...h.sesion, permissions: [] };
    montar();
    expect(screen.getByText("PANTALLA")).toBeInTheDocument();
  });

  it("el menú de la plataforma no se mezcla con el del club", () => {
    h.sesion = { ...h.sesion, esPlataforma: true, permissions: [] };
    montar();
    expect(screen.getByText("PANTALLA")).toBeInTheDocument();
  });
});

describe("RouteGuard: funciones del plan", () => {
  beforeEach(() => {
    h.pathname = "/ventas";
    h.sesion = { ...h.sesion, permissions: ["ver_venta"] };
  });

  it("función bloqueada: muestra el candado y el plan mínimo; no monta la pantalla", () => {
    h.funcion = funcion();
    montar();
    expect(screen.getByRole("heading", { name: "Tienda" })).toBeInTheDocument();
    expect(screen.getByText("Disponible desde el plan Pro.")).toBeInTheDocument();
    expect(screen.queryByText("PANTALLA")).not.toBeInTheDocument();
  });

  it("ofrece 'Ver mi plan' solo a quien puede administrar el plan", () => {
    h.funcion = funcion();
    montar();
    expect(screen.queryByRole("link", { name: "Ver mi plan" })).not.toBeInTheDocument();
    expect(screen.getByText(/Pídele a un administrador/)).toBeInTheDocument();
  });

  it("quien administra el club ve el enlace al plan", () => {
    h.sesion = { ...h.sesion, permissions: ["ver_venta", "ver_dash_administracion"] };
    h.funcion = funcion();
    montar();
    expect(screen.getByRole("link", { name: "Ver mi plan" })).toHaveAttribute("href", "/plan-y-datos");
  });

  it("bloqueada pero solo de escritura: la pantalla se muestra con un aviso", () => {
    h.funcion = funcion({ soloEscritura: true });
    montar();
    expect(screen.getByText("PANTALLA")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("crear o editar requiere ese plan");
  });

  it("solo lectura: la pantalla se muestra con aviso y la fecha límite", () => {
    h.funcion = funcion({ estado: "SOLO_LECTURA", soloLecturaHasta: "2026-12-31" });
    montar();
    expect(screen.getByText("PANTALLA")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("solo lectura hasta el 2026-12-31");
    expect(screen.getByRole("status")).toHaveTextContent("no crear ni editar");
  });

  it("función plena: sin avisos", () => {
    h.funcion = funcion({ estado: "PLENA" });
    montar();
    expect(screen.getByText("PANTALLA")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("si aún no se conoce el plan no se bloquea nada (decide el servidor)", () => {
    h.funcion = undefined;
    montar();
    expect(screen.getByText("PANTALLA")).toBeInTheDocument();
  });
});
