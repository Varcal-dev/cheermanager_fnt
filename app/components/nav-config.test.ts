import { describe, expect, it } from "vitest";
import { resolverRuta } from "@/app/components/nav-config";

describe("resolverRuta: de la URL al permiso que exige la pantalla", () => {
  it("una pantalla del club exige su permiso", () => {
    expect(resolverRuta("/pagos", false)?.permiso).toBe("ver_pago");
    expect(resolverRuta("/facturas", false)?.permiso).toBe("ver_factura");
    expect(resolverRuta("/deportistas", false)?.permiso).toBe("ver_deportista");
    expect(resolverRuta("/roles", false)?.permiso).toBe("ver_roles");
  });

  it("las subrutas heredan el permiso de la pantalla", () => {
    expect(resolverRuta("/pagos/123", false)?.permiso).toBe("ver_pago");
    expect(resolverRuta("/deportistas/45/perfil", false)?.permiso).toBe("ver_deportista");
  });

  it("gana la coincidencia más específica", () => {
    // /gestion-entrenadores NO debe resolverse como /entrenadores (ambos exigen ver_entrenador, pero son entradas distintas)
    expect(resolverRuta("/gestion-entrenadores", false)?.item.href).toBe("/gestion-entrenadores");
    expect(resolverRuta("/entrenadores", false)?.item.href).toBe("/entrenadores");
  });

  it("un prefijo parecido no cuenta como coincidencia (/pagosextra no es /pagos)", () => {
    expect(resolverRuta("/pagosextra", false)).toBeUndefined();
  });

  it("una ruta desconocida no se bloquea desde aquí", () => {
    expect(resolverRuta("/no-existe", false)).toBeUndefined();
  });

  it("el menú del club y el de la plataforma no se mezclan", () => {
    expect(resolverRuta("/pagos", true)).toBeUndefined();
  });

  it("expone la función de plan que exige la pantalla", () => {
    expect(resolverRuta("/roles", false)?.funcion).toBe("ROLES_PERSONALIZADOS");
    expect(resolverRuta("/inventario", false)?.funcion).toBe("TIENDA");
  });
});
