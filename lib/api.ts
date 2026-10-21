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

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
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