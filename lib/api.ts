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

// Si el backend responde 401 (token inválido/expirado/en blacklist tras logout),
// limpiamos el token local y mandamos al usuario a login. Evita que la app quede
// en un estado "colgado" mostrando spinners infinitos por un token muerto.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      const isAuthEndpoint =
        typeof error.config?.url === "string" && error.config.url.includes("/api/login");

      if (!isAuthEndpoint) {
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
