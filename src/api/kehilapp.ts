import { http } from "../services/http";

/** Mirrors the backend's documents. Only the fields the admin actually uses. */
export type Role = "admin" | "member";

export type User = {
  _id: string;
  name: string;
  email?: string;
  role?: Role;
  emailVerified?: boolean;
  createdAt?: string;
};

export type Category = {
  _id: string;
  title: string;
  icon?: string;
  categoryColor?: string;
  managedBy?: string;
};

export type Message = {
  _id: string;
  title: string;
  text: string;
  categoryId?: string;
  senderId?: string;
  // Content tier, not a UI flag: 'members' messages are withheld from anonymous
  // callers entirely. Pinning is deliberately NOT here — it is a per-browser
  // preference in the resident app (localStorage), never a server field.
  visibility?: "public" | "members";
  createdAt?: string;
  updatedAt?: string;
  attachmentName?: string;
  /** Added by the controller at read time: a short-lived signed S3 URL. */
  attachmentUrl?: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/**
 * Messages come back as a plain array; pagination rides in headers so existing
 * clients kept working when it was added. `X-Total-Count` is the collection
 * size, which is what the dashboard counts — not the length of this page.
 */
export type Paged<T> = { items: T[]; total: number };

const numericHeader = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const authApi = {
  login: (email: string, password: string) =>
    http
      .post<{ user: SessionUser; csrfToken: string }>("/api/auth/login", { email, password })
      .then((r) => r.data.user),

  /** Resolves the identity inside the httpOnly cookie; 401 when there is none. */
  me: () => http.get<{ user: SessionUser }>("/api/auth/me").then((r) => r.data.user),

  logout: () => http.post("/api/auth/logout").then(() => undefined),
};

/**
 * Mirrors the backend's Joi schema in
 * src/config/validationConstants.js (messageConstants) — keep these numbers in
 * step with that file, not the other way around.
 */
export const MESSAGE_LIMITS = { titleMin: 2, titleMax: 25, textMax: 1500 } as const;

export type MessageInput = {
  categoryId: string;
  title: string;
  text: string;
  visibility: "public" | "members";
};

export const messagesApi = {
  list: (params: { page?: number; limit?: number; searchTerm?: string; categoryId?: string } = {}) =>
    http.get<Message[]>("/api/messages", { params }).then(
      (r): Paged<Message> => ({
        items: r.data,
        total: numericHeader(r.headers["x-total-count"], r.data.length),
      })
    ),

  byId: (id: string) => http.get<Message>(`/api/messages/${id}`).then((r) => r.data),

  /** JSON body — no multipart needed here, unlike the attachment-bearing update path. */
  create: (input: MessageInput) => http.post<Message>("/api/messages", input).then((r) => r.data),

  /** Admin-only on the server; the UI hides it for members, the API enforces it. */
  remove: (id: string) => http.delete(`/api/messages/${id}`).then(() => id),
};

export const categoriesApi = {
  list: () => http.get<Category[]>("/api/categories").then((r) => r.data),
};

export const usersApi = {
  /** Admin-only: the one endpoint that returns every account at once. */
  list: () => http.get<User[]>("/api/users").then((r) => r.data),
  byId: (id: string) => http.get<User>(`/api/users/${id}`).then((r) => r.data),
};
