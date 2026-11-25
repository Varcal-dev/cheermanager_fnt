import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TOKEN_KEY,
  api,
  clearAuthToken,
  datosSoporte,
  expiracionDelToken,
  getAuthToken,
  getErrorMessage,
  leerClaimsToken,
  setAuthToken,
} from "@/lib/api";

// ---- utilidades: un JWT de mentira (la firma no se valida en el front)
function b64url(obj: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function jwt(claims: Record<string, unknown>): string {
  return `${b64url({ alg: "HS256" })}.${b64url(claims)}.firma`;
}
const enMinutos = (m: number) => Math.floor((Date.now() + m * 60_000) / 1000);

describe("expiracionDelToken / leerClaimsToken / datosSoporte", () => {
  it("lee la expiración en milisegundos", () => {
    const exp = enMinutos(45);
    expect(expiracionDelToken(jwt({ exp }))).toBe(exp * 1000);
  });

  it("devuelve null con tokens mal formados o sin exp", () => {
    expect(expiracionDelToken("")).toBeNull();
    expect(expiracionDelToken("solo-una-parte")).toBeNull();
    expect(expiracionDelToken("a.%%%.c")).toBeNull();
    expect(expiracionDelToken(jwt({ sub: "x" }))).toBeNull();
    expect(expiracionDelToken(jwt({ exp: "no-es-numero" }))).toBeNull();
  });

  it("lee claims con tildes y eñes", () => {
    expect(leerClaimsToken(jwt({ nombre: "Peña Gómez" }))?.nombre).toBe("Peña Gómez");
  });

  it("claims: null si no hay token o está dañado", () => {
    expect(leerClaimsToken(null)).toBeNull();
    expect(leerClaimsToken("xx")).toBeNull();
    expect(leerClaimsToken("a.%%%.c")).toBeNull();
  });

  it("datosSoporte solo existe en una sesión de soporte", () => {
    setAuthToken(jwt({ exp: enMinutos(30), role: "ADMIN" }));
    expect(datosSoporte()).toBeNull();
    setAuthToken(jwt({ exp: enMinutos(30), soporte: true, soporteClub: "Club Demo", soportePor: "root@x.co" }));
    expect(datosSoporte()).toEqual({ club: "Club Demo", por: "root@x.co" });
    clearAuthToken();
    expect(datosSoporte()).toBeNull();
  });
});

describe("setAuthToken / getAuthToken", () => {
  it("guarda y borra el token en localStorage y en el encabezado por defecto", () => {
    setAuthToken("abc");
    expect(getAuthToken()).toBe("abc");
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe("abc");
    expect(api.defaults.headers.common["Authorization"]).toBe("Bearer abc");
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
    expect(api.defaults.headers.common["Authorization"]).toBeUndefined();
  });
});

describe("getErrorMessage", () => {
  it("prefiere el texto plano del cuerpo y luego el { message } del JSON", () => {
    expect(getErrorMessage({ response: { data: "Texto plano" } })).toBe("Texto plano");
    expect(getErrorMessage({ response: { data: { message: "Dato inválido" } } })).toBe("Dato inválido");
  });

  it("traduce 403, 5xx y falta de conexión", () => {
    expect(getErrorMessage({ response: { status: 403, data: {} } })).toBe("No tienes permiso para realizar esta acción");
    expect(getErrorMessage({ response: { status: 503, data: {} } })).toBe("Error interno del servidor");
    expect(getErrorMessage({ message: "Network Error" })).toBe("No se pudo conectar con el servidor");
  });

  it("usa el texto de respaldo cuando no hay nada más", () => {
    expect(getErrorMessage({ response: { status: 400, data: {} } }, "Respaldo")).toBe("Respaldo");
    expect(getErrorMessage(undefined)).toBe("Ocurrió un error inesperado");
  });
});

describe("interceptores de la API", () => {
  let enviadas: InternalAxiosRequestConfig[];

  const respuestaOk = (config: InternalAxiosRequestConfig) => ({
    data: { ok: true }, status: 200, statusText: "OK", headers: {}, config,
  });
  const cabecera = (c: InternalAxiosRequestConfig) => String(c.headers["Authorization"]);

  beforeEach(() => {
    enviadas = [];
    clearAuthToken();
    api.defaults.adapter = async (config) => {
      enviadas.push(config);
      return respuestaOk(config);
    };
  });

  it("agrega el token guardado a cada petición", async () => {
    setAuthToken(jwt({ exp: enMinutos(50) }));
    await api.get("/api/algo");
    expect(cabecera(enviadas[0])).toBe(`Bearer ${getAuthToken()}`);
  });

  it("no manda Authorization si no hay sesión", async () => {
    await api.get("/api/algo");
    expect(enviadas[0].headers["Authorization"]).toBeUndefined();
  });

  it("con más de 30 min de vida NO pide un token nuevo", async () => {
    const post = vi.spyOn(axios, "post");
    setAuthToken(jwt({ exp: enMinutos(45) }));
    await api.get("/api/algo");
    expect(post).not.toHaveBeenCalled();
  });

  it("con menos de 30 min renueva UNA sola vez aunque haya peticiones en paralelo, y usa el token nuevo", async () => {
    const nuevo = jwt({ exp: enMinutos(60), version: 2 });
    const post = vi.spyOn(axios, "post").mockResolvedValue({ data: { token: nuevo } });
    const viejo = jwt({ exp: enMinutos(10) });
    setAuthToken(viejo);

    await Promise.all([api.get("/api/a"), api.get("/api/b")]);

    expect(post).toHaveBeenCalledTimes(1);
    expect(String(post.mock.calls[0][0])).toContain("/api/refresh-token");
    expect(getAuthToken()).toBe(nuevo);
    expect(enviadas.map(cabecera)).toEqual([`Bearer ${nuevo}`, `Bearer ${nuevo}`]);
  });

  it("si la renovación falla sigue con el token actual y NO cierra la sesión", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(new Error("sin red"));
    const viejo = jwt({ exp: enMinutos(10) });
    setAuthToken(viejo);

    await api.get("/api/a");

    expect(getAuthToken()).toBe(viejo);
    expect(cabecera(enviadas[0])).toBe(`Bearer ${viejo}`);
  });

  it("no renueva sesiones de soporte, tokens vencidos ni tokens ilegibles", async () => {
    const post = vi.spyOn(axios, "post");
    setAuthToken(jwt({ exp: enMinutos(10), soporte: true }));
    await api.get("/api/a");
    setAuthToken(jwt({ exp: enMinutos(-5) }));
    await api.get("/api/a");
    setAuthToken("ilegible");
    await api.get("/api/a");
    expect(post).not.toHaveBeenCalled();
  });

  it("no intenta renovar al llamar a los endpoints de autenticación", async () => {
    const post = vi.spyOn(axios, "post");
    setAuthToken(jwt({ exp: enMinutos(10) }));
    await api.post("/api/login", {});
    await api.post("/api/logout", {});
    expect(post).not.toHaveBeenCalled();
  });

  describe("respuesta 401", () => {
    const fallar401 = () => {
      api.defaults.adapter = async (config) => {
        throw new AxiosError("no autorizado", "ERR_BAD_REQUEST", config, null, {
          status: 401, data: {}, statusText: "Unauthorized", headers: {}, config,
        });
      };
    };

    // jsdom no navega: avisa con "Not implemented: navigation" al asignar window.location.href. Eso es justo lo que
    // indica que la aplicación mandó al usuario a /login.
    const navegaciones = () => {
      const espia = vi.spyOn(console, "error").mockImplementation(() => {});
      return () => espia.mock.calls.filter((c) => String(c[0]).includes("Not implemented: navigation")).length;
    };

    it("en un endpoint normal limpia la sesión y manda a /login", async () => {
      const contar = navegaciones();
      window.history.pushState({}, "", "/pagos");
      setAuthToken(jwt({ exp: enMinutos(50) }));
      fallar401();
      await expect(api.get("/api/deportistas")).rejects.toBeTruthy();
      expect(getAuthToken()).toBeNull();
      expect(api.defaults.headers.common["Authorization"]).toBeUndefined();
      expect(contar()).toBe(1);
    });

    it("si ya está en /login no vuelve a redirigir (evita bucles)", async () => {
      const contar = navegaciones();
      window.history.pushState({}, "", "/login");
      setAuthToken(jwt({ exp: enMinutos(50) }));
      fallar401();
      await expect(api.get("/api/deportistas")).rejects.toBeTruthy();
      expect(getAuthToken()).toBeNull();
      expect(contar()).toBe(0);
    });

    it("en login / change-password / forgot / reset NO cierra la sesión (son 401 normales)", async () => {
      const token = jwt({ exp: enMinutos(50) });
      for (const url of ["/api/login", "/api/change-password", "/api/forgot-password", "/api/reset-password"]) {
        setAuthToken(token);
        fallar401();
        await expect(api.post(url, {})).rejects.toBeTruthy();
        expect(getAuthToken()).toBe(token);
      }
    });
  });
});
