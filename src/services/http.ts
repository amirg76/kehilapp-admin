import Axios, { AxiosError, AxiosRequestConfig } from "axios";

/**
 * The admin's HTTP layer.
 *
 * Deliberately the same shape as the resident app's `httpService` — one session
 * model across both clients, so a reviewer reads the defence once. Two rules:
 *
 *   1. `withCredentials` sends the httpOnly auth cookie. The JWT is never read
 *      by JS and never touches localStorage, so an XSS cannot lift the session.
 *   2. Every mutating request echoes the readable `csrfToken` cookie back in the
 *      `X-CSRF-Token` header (double-submit). The backend rejects a mismatch.
 */

const api = Axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001",
  withCredentials: true,
});

/**
 * Reads a non-httpOnly cookie by name. Returns null when absent.
 *
 * Split rather than a built regex: a cookie name interpolated into a pattern has
 * to be escaped correctly or it is both wrong and a small injection surface.
 * Splitting has neither problem and is easier to read.
 */
export const readCookie = (name: string): string | null => {
  const entry = document.cookie
    .split("; ")
    .find((pair) => pair.slice(0, pair.indexOf("=")) === name);
  if (!entry) return null;
  return decodeURIComponent(entry.slice(entry.indexOf("=") + 1));
};

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

api.interceptors.request.use((config) => {
  if (MUTATING.has((config.method ?? "").toUpperCase())) {
    const csrf = readCookie("csrfToken");
    if (csrf) {
      config.headers.set("X-CSRF-Token", csrf);
    }
  }
  return config;
});

/**
 * A 401 means the cookie is gone or expired. Notify the app once so it can drop
 * to the login screen, instead of every caller inventing its own handling.
 *
 * Note it does NOT redirect from here: a hard `location.assign` inside an
 * interceptor fights React Router and loses the current route. The auth context
 * subscribes and decides.
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  onUnauthorized = handler;
};

/** Endpoints where a 401 is an expected answer, not a dead session. */
const EXPECTS_401 = ["/api/auth/login", "/api/auth/me"];

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const url = error.config?.url ?? "";
    const isExpected = EXPECTS_401.some((path) => url.includes(path));
    if (error.response?.status === 401 && !isExpected) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

/** Pulls a human-readable message out of the API's error envelope. */
export const errorMessage = (error: unknown, fallback: string): string => {
  const err = error as AxiosError<{ message?: string; error?: string }>;
  return err?.response?.data?.message ?? err?.response?.data?.error ?? fallback;
};

export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.patch<T>(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) => api.delete<T>(url, config),
};

export default api;
