import { describe, expect, it } from "vitest";
import { esc } from "@/app/lib/html";

describe("esc (HTML armado a mano: ventanas de impresión)", () => {
  it("escapa los cinco caracteres que permiten inyectar código", () => {
    expect(esc(`<script>alert("x")</script>`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(esc(`a & b`)).toBe("a &amp; b");
    expect(esc(`it's`)).toBe("it&#39;s");
  });

  it("no escapa dos veces lo ya escapado como entidad nueva del &", () => {
    expect(esc("&lt;")).toBe("&amp;lt;");
  });

  it("acepta cualquier valor: null y undefined salen vacíos, números y booleanos como texto", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
    expect(esc(1500)).toBe("1500");
    expect(esc(0)).toBe("0");
    expect(esc(false)).toBe("false");
  });

  it("un atributo entre comillas no se puede cerrar desde el valor", () => {
    const html = `<img alt="${esc('" onerror="robar()')}">`;
    expect(html).toBe(`<img alt="&quot; onerror=&quot;robar()">`);
    expect(html).not.toMatch(/ onerror="/);
  });
});
