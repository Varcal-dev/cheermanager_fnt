import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedRoute from "@/components/ProtectedRoute";

const h = vi.hoisted(() => ({
  sesion: {} as Record<string, unknown>,
  pathname: "/pagos",
  push: vi.fn(),
}));
vi.mock("@/context/UserContext", () => ({ useUser: () => h.sesion }));
vi.mock("next/navigation", () => ({
  usePathname: () => h.pathname,
  useRouter: () => ({ push: h.push }),
}));

const usuario = (extra: Record<string, unknown> = {}) => ({ id: 1, username: "ana", requiereCambioPassword: false, ...extra });

function montar() {
  return render(
    <ProtectedRoute requiredPermission="ver_pago">
      <p>CONTENIDO PRIVADO</p>
    </ProtectedRoute>,
  );
}

beforeEach(() => {
  h.push.mockReset();
  h.pathname = "/pagos";
  h.sesion = { user: usuario(), permissions: ["ver_pago"], loading: false, legalPendiente: false };
});

describe("ProtectedRoute", () => {
  it("con sesión y el permiso muestra el contenido y no redirige", () => {
    montar();
    expect(screen.getByText("CONTENIDO PRIVADO")).toBeInTheDocument();
    expect(h.push).not.toHaveBeenCalled();
  });

  it("mientras carga la sesión NO muestra el contenido ni redirige todavía", () => {
    h.sesion = { ...h.sesion, loading: true, user: null };
    montar();
    expect(screen.queryByText("CONTENIDO PRIVADO")).not.toBeInTheDocument();
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
    expect(h.push).not.toHaveBeenCalled();
  });

  it("sin sesión redirige a /login y nunca muestra el contenido", () => {
    h.sesion = { ...h.sesion, user: null, permissions: [] };
    montar();
    expect(screen.queryByText("CONTENIDO PRIVADO")).not.toBeInTheDocument();
    expect(h.push).toHaveBeenCalledWith("/login");
  });

  it("sin el permiso redirige a /error-permisos y no muestra el contenido", () => {
    h.sesion = { ...h.sesion, permissions: ["ver_factura"] };
    montar();
    expect(screen.queryByText("CONTENIDO PRIVADO")).not.toBeInTheDocument();
    expect(h.push).toHaveBeenCalledWith("/error-permisos");
  });

  it("con la clave por defecto obliga a cambiarla antes que cualquier otra cosa", () => {
    h.sesion = { ...h.sesion, user: usuario({ requiereCambioPassword: true }), legalPendiente: true };
    montar();
    expect(screen.queryByText("CONTENIDO PRIVADO")).not.toBeInTheDocument();
    expect(h.push).toHaveBeenCalledWith("/cambiar-password");
    expect(h.push).not.toHaveBeenCalledWith("/terminos");
  });

  it("estando ya en /cambiar-password no lo vuelve a mandar ahí", () => {
    h.pathname = "/cambiar-password";
    h.sesion = { ...h.sesion, user: usuario({ requiereCambioPassword: true }) };
    montar();
    expect(h.push).not.toHaveBeenCalledWith("/cambiar-password");
  });

  it("con términos legales pendientes lo manda a /terminos", () => {
    h.sesion = { ...h.sesion, legalPendiente: true };
    montar();
    expect(screen.queryByText("CONTENIDO PRIVADO")).not.toBeInTheDocument();
    expect(h.push).toHaveBeenCalledWith("/terminos");
  });
});
