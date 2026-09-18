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
  // Approval tier: a human admission decision, separate from email verification.
  // Exactly one of the approved/revoked pairs is ever set — the server clears
  // the other, so these say which decision was last (see userModel.js).
  approved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  revokedAt?: string;
  revokedBy?: string;
};

/**
 * Mirrors the server's `urgency` enum on the message document. The server
 * defaults it to "routine", so an older message written before the field
 * existed still reads as routine rather than as an absent value the UI has to
 * invent a meaning for.
 */
export type Urgency = "routine" | "important" | "urgent";

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
  // Optional here for the same reason `visibility` is: this type describes what
  // the server may send, and a document stored before the field shipped has no
  // urgency on it. Readers must fall back to "routine", the server's default.
  urgency?: Urgency;
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
  approved?: boolean;
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
  // Required on the way out even though the server defaults it: the compose
  // form always holds a concrete choice, and making it optional here would let
  // a caller silently drop the admin's pick and get "routine" back instead.
  urgency: Urgency;
};

/**
 * The 200 body of POST /api/messages/classify. `categoryId` is a suggestion
 * only — it is not guaranteed to be one of the categories this client has
 * loaded, so callers must check before assigning it to a <select>.
 * `reason` is one short Hebrew sentence, meant to be shown verbatim.
 */
export type MessageClassification = {
  categoryId: string;
  categoryTitle: string;
  urgency: Urgency;
  reason: string;
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

  /**
   * Asks the server to suggest a category and an urgency for a draft. A POST,
   * so it picks up the `X-CSRF-Token` interceptor in services/http.ts like
   * every other mutating call — even though it writes nothing, because the
   * call costs the community real money per invocation and must not be
   * triggerable cross-site.
   *
   * Callers must handle these by STATUS, not by the message text:
   *   503 — the feature has no API key on this server. The normal "off" state.
   *   429 — the per-caller rate limiter that guards that cost.
   */
  classify: (input: { title: string; text?: string }) =>
    http
      .post<MessageClassification>("/api/messages/classify", input)
      .then((r) => r.data),
};

export const categoriesApi = {
  list: () => http.get<Category[]>("/api/categories").then((r) => r.data),
};

export const usersApi = {
  /** Admin-only: the one endpoint that returns every account at once. */
  list: () => http.get<User[]>("/api/users").then((r) => r.data),
  byId: (id: string) => http.get<User>(`/api/users/${id}`).then((r) => r.data),

  /**
   * Admits an account to the community. Server refuses (400) revoking an
   * admin's own approval too, but approve carries no such refusal.
   * Response shape confirmed at usersController.js's toSafeUser (approveUser).
   */
  approve: (id: string) => http.patch<User>(`/api/users/${id}/approve`).then((r) => r.data),

  /**
   * Withdraws approval. Server refuses (400) revoking your own approval, and
   * refuses (400) revoking an admin's approval — it would take nothing away.
   * Response shape confirmed at usersController.js's toSafeUser (revokeUser).
   */
  revoke: (id: string) => http.patch<User>(`/api/users/${id}/revoke`).then((r) => r.data),

  /**
   * Promotes or demotes. Server refuses (400) changing your own role, and
   * refuses (400) demoting the last remaining admin.
   * Response shape confirmed at usersController.js's toSafeUser (changeUserRole).
   */
  setRole: (id: string, role: Role) =>
    http.patch<User>(`/api/users/${id}/role`, { role }).then((r) => r.data),
};
