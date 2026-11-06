"use client";

import axios, { type AxiosRequestHeaders, type InternalAxiosRequestConfig } from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
export const TOKEN_KEY = "cheer_manager_token";

export const api = axios.create({
  baseURL: API_URL,
});

const getStoredToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
};

const setAuthorizationHeader = (token: string | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

setAuthorizationHeader(getStoredToken());

// --- Renovación silenciosa de la sesión ---------------------------------------------------------------------
// El token dura 8 h. Mientras el usuario sigue trabajando, cuando le quedan menos de 30 min se pide uno nuevo con
// POST /api/refresh-token (el back revalida al usuario, recalcula sus permisos y revoca el token anterior). Si
// falla (red, token ya revocado por otra pestaña) se sigue con el token actual: nunca se cierra la sesión por esto.
const RENOVAR_CUANDO_QUEDA_MENOS_DE_MS = 30 * 60 * 1000;
const RUTAS_SIN_RENOVAR = ["/api/login", "/api/logout", "/api/refresh-token", "/api/forgot-password", "/api/reset-password"];
let renovacionEnCurso: Promise<void> | null = null;

/** Expiración (ms desde 1970) leída del payload del JWT, o null si no se puede leer. */
export function expiracionDelToken(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const exp = JSON.parse(json).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Claims del JWT (sin verificar firma: solo para mostrar cosas en la UI), o null. */
export function leerClaimsToken(token: string | null): Record<string, any> | null {
  try {
    const payload = token?.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")))));
  } catch {
    return null;
  }
}

/** Si la sesión actual es de soporte (superadmin dentro de un club) devuelve el club y quién entró; si no, null. */
export function datosSoporte(): { club: string; por: string } | null {
  const c = leerClaimsToken(getStoredToken());
  return c?.soporte === true ? { club: String(c.soporteClub ?? ""), por: String(c.soportePor ?? "") } : null;
}

async function renovarSesionSiHaceFalta(): Promise<void> {
  const token = getStoredToken();
  if (!token) return;
  // La sesión de soporte dura 1 h y el back no la renueva.
  if (leerClaimsToken(token)?.soporte === true) return;
  const exp = expiracionDelToken(token);
  if (exp === null) return;
  const queda = exp - Date.now();
  if (queda <= 0 || queda > RENOVAR_CUANDO_QUEDA_MENOS_DE_MS) return;
  if (!renovacionEnCurso) {
    renovacionEnCurso = axios
      .post(`${API_URL}/api/refresh-token`, null, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 })
      .then((resp) => {
        const nuevo = resp.data?.token;
        // Otra pestaña pudo renovar antes: solo se guarda si el token guardado sigue siendo el que se renovó.
        if (typeof nuevo === "string" && getStoredToken() === token) {
          setAuthToken(nuevo);
        }
      })
      .catch(() => {
        // se sigue con el token actual
      })
      .finally(() => {
        renovacionEnCurso = null;
      });
  }
  await renovacionEnCurso;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const url = typeof config.url === "string" ? config.url : "";
  if (typeof window !== "undefined" && !RUTAS_SIN_RENOVAR.some((r) => url.includes(r))) {
    await renovarSesionSiHaceFalta();
  }
  if (typeof window !== "undefined") {
    const token = getStoredToken();
    if (token) {
      if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
      }
      if (typeof config.headers === "object") {
        (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
      }
    }
  }
  return config;
});

// 401 = token inválido/expirado/revocado -> limpiamos sesión y mandamos a login. Pero los endpoints de
// autenticación también devuelven 401 por motivos "normales" (clave incorrecta en login, "contraseña
// actual incorrecta" en change-password): ahí NO se debe cerrar la sesión.
//
// Ojo con los errores del back: unos controllers devuelven JSON { message } y otros TEXTO PLANO en el body.
// No se normaliza aquí (varias pantallas ya leen `data` como string); usa getErrorMessage() abajo.
const AUTH_URLS_SIN_LOGOUT = [
  "/api/login",
  "/api/change-password",
  "/api/forgot-password",
  "/api/reset-password",
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      const url: string = typeof error.config?.url === "string" ? error.config.url : "";
      const esEndpointAuth = AUTH_URLS_SIN_LOGOUT.some((u) => url.includes(u));

      if (!esEndpointAuth) {
        window.localStorage.removeItem(TOKEN_KEY);
        setAuthorizationHeader(null);
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

/** Mensaje legible a partir de un error de axios: sirve tanto para body JSON { message } como para texto plano. */
export const getErrorMessage = (error: any, fallback = "Ocurrió un error inesperado") => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim() !== "") return data;
  if (data?.message) return String(data.message);
  if (error?.response?.status === 403) return "No tienes permiso para realizar esta acción";
  if (error?.response && error.response.status >= 500) return "Error interno del servidor";
  if (!error?.response && error?.message) return "No se pudo conectar con el servidor";
  return fallback;
};

export const setAuthToken = (token: string | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }

  setAuthorizationHeader(token);
};

export const getAuthToken = () => getStoredToken();

export const clearAuthToken = () => setAuthToken(null);

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const url = typeof input === "string" && !input.startsWith("http")
    ? `${API_URL}${input.startsWith("/") ? "" : "/"}${input}`
    : input;

  const token = getAuthToken();
  const headers = new Headers(init.headers ?? {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...init, headers });
}