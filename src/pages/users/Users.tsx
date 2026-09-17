import { useEffect, useMemo, useRef, useState } from "react";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Role, User, usersApi } from "../../api/kehilapp";
import { errorMessage } from "../../services/http";
import { useAuth } from "../../auth/AuthContext";
import "./users.scss";

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("he-IL", { dateStyle: "medium" }) : "—";

/** What the confirm dialog is about to do — copy explains the real effect. */
type PendingAction =
  | { kind: "approve"; user: User }
  | { kind: "revoke"; user: User }
  | { kind: "role"; user: User; role: Role };

const dialogCopy = (action: PendingAction): { title: string; body: string; confirmLabel: string } => {
  switch (action.kind) {
    case "approve":
      return {
        title: "לאשר את המשתמש?",
        body: "המשתמש יראה תוכן לחברי הקהילה ויוכל לפרסם.",
        confirmLabel: "אשר",
      };
    case "revoke":
      return {
        title: "לבטל את האישור?",
        body: "המשתמש יחזור לראות תוכן ציבורי בלבד ולא יוכל לפרסם.",
        confirmLabel: "בטל אישור",
      };
    case "role":
      return action.role === "member"
        ? {
            title: "להפוך למנהל רגיל?",
            body: "הפעולה מסירה מהמשתמש את הרשאות הניהול — הוא לא יוכל עוד לנהל משתמשים, הודעות או קטגוריות.",
            confirmLabel: "הפוך לחבר",
          }
        : {
            title: "להפוך למנהל?",
            body: "המשתמש יקבל הרשאות ניהול מלאות: ניהול משתמשים, הודעות וקטגוריות.",
            confirmLabel: "הפוך למנהל",
          };
    // No default: PendingAction["kind"] is a closed union of exactly these
    // three, so removing the catch-all lets the type-checker refuse a new
    // fourth kind added here without matching copy — the old default quietly
    // rendered an empty-but-clickable dialog for that case instead of failing
    // the build.
  }
};

/**
 * Hebrew refusals for the server's admin-only business rules.
 *
 * `errorMessage` (services/http.ts) prefers the server's `data.error`, which
 * is English (an API's job, not this screen's) — Login.tsx maps by HTTP
 * status instead and never echoes it; these mappings follow the same
 * pattern rather than inventing a second one.
 *
 * Two of the server's routes answer 400 for two different reasons apiece, and
 * the JSON body is only ever `{ error: "<English sentence>" }` — no error
 * code. Matching on that sentence would silently break the day someone
 * rewords the English, so the discriminator here is what the CLIENT already
 * knows about the request it just made (the target's role and id, weighed in
 * the same order the backend does — usersController.js changeUserRole /
 * revokeUser), never the response text.
 */
const isLastAdmin = (target: User | undefined, allUsers: User[]): boolean =>
  target?.role === "admin" && allUsers.filter((u) => u.role === "admin").length <= 1;

/** PATCH /api/users/:id/role — mirrors changeUserRole's own check order: the
 * last-admin guard runs before the self guard, so a demotion that is both
 * "self" and "last admin" must read as the last-admin refusal too. */
const roleRefusalMessage = (targetId: string, target: User | undefined, allUsers: User[], meId?: string): string => {
  if (isLastAdmin(target, allUsers)) {
    return "לא ניתן להוריד בדרגה את המנהל האחרון שנותר — הלוח יישאר בלי אף אחד שיכול לנהל אותו. יש לקדם מנהל נוסף קודם.";
  }
  if (targetId === meId) {
    return "מנהל אינו יכול לשנות את התפקיד של עצמו. יש לבקש ממנהל אחר לבצע זאת.";
  }
  return "שינוי התפקיד נכשל.";
};

/**
 * PATCH /api/users/:id/revoke — revokeUser checks self before admin-target.
 *
 * The admin-target refusal is the one case where the CLIENT's own knowledge
 * of the row is not reliable enough on its own: the revoke button is only
 * ever offered for a row the client believes is a non-admin, so the only way
 * to reach this refusal for real is a stale row — the target was promoted to
 * admin in another tab or by another operator after this list was fetched,
 * and `allUsers` here is exactly that same stale snapshot. So the primary
 * signal is not prose but the one structural, non-prose thing the server's
 * message happens to carry: the literal route it points at
 * (`/api/users/:userId/role`, see usersController.js revokeUser) — a URL
 * template is not English copy a rewording would touch. The client's own
 * `target` is kept only as a fallback for a differently-worded server error
 * that still names an admin target.
 */
const ADMIN_REVOKE_ROUTE_MARKER = "/api/users/:userId/role";
const revokeRefusalMessage = (
  targetId: string,
  target: User | undefined,
  meId: string | undefined,
  serverText: string
): string => {
  if (targetId === meId) {
    return "מנהל אינו יכול לבטל את האישור של עצמו.";
  }
  if (serverText.includes(ADMIN_REVOKE_ROUTE_MARKER) || target?.role === "admin") {
    return "לא ניתן לבטל אישור של מנהל — הפעולה לא הייתה מסירה ממנו דבר. כדי להסיר הרשאות ניהול יש להפוך אותו לחבר, ורק אז אפשר לבטל את האישור אם עדיין רוצים.";
  }
  return "ביטול האישור נכשל.";
};

const Users = () => {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  // Which row currently has an in-flight mutation, so only that row's buttons
  // disable — a double click on a different row must still work.
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  // Focus management for the confirm dialog: the element that opened it (so
  // focus can return there on close) and the dialog box itself (so Tab can be
  // trapped inside it).
  const openerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const users = useQuery({ queryKey: ["users"], queryFn: () => usersApi.list() });
  const allUsers = users.data ?? [];

  const invalidateAndClear = () => {
    setActionError(null);
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => usersApi.approve(id),
    onSuccess: invalidateAndClear,
    onError: (err) => setActionError(errorMessage(err, "אישור המשתמש נכשל.")),
    onSettled: () => {
      setPendingAction(null);
      setBusyRowId(null);
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) => usersApi.revoke(id),
    onSuccess: invalidateAndClear,
    // Mapped to fixed Hebrew by status + what the client already knows about
    // the request (see revokeRefusalMessage above) — never the server's
    // English prose, which errorMessage would otherwise prefer.
    onError: (err, id) => {
      const response = (err as AxiosError<{ error?: string }>)?.response;
      if (response?.status === 400) {
        const target = allUsers.find((u) => u._id === id);
        setActionError(revokeRefusalMessage(id, target, me?.id, response.data?.error ?? ""));
      } else {
        setActionError(errorMessage(err, "ביטול האישור נכשל."));
      }
    },
    onSettled: () => {
      setPendingAction(null);
      setBusyRowId(null);
    },
  });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => usersApi.setRole(id, role),
    onSuccess: invalidateAndClear,
    // Mapped to fixed Hebrew by status + what the client already knows about
    // the request (see roleRefusalMessage above) — never the server's
    // English prose, which errorMessage would otherwise prefer.
    onError: (err, variables) => {
      const status = (err as AxiosError)?.response?.status;
      if (status === 400) {
        const target = allUsers.find((u) => u._id === variables.id);
        setActionError(roleRefusalMessage(variables.id, target, allUsers, me?.id));
      } else {
        setActionError(errorMessage(err, "שינוי התפקיד נכשל."));
      }
    },
    onSettled: () => {
      setPendingAction(null);
      setBusyRowId(null);
    },
  });

  const isMutating = approve.isLoading || revoke.isLoading || setRole.isLoading;

  /** Opens the confirm dialog, remembering the button that triggered it so
   * focus can return there on close (SERIOUS 3). Also clears any error left
   * over from a previous action, so a fresh attempt starts on a clean alert
   * (SERIOUS 1) — otherwise an identical repeated failure never re-announces
   * itself to a screen reader, because the DOM text under role="alert" never
   * actually changes. */
  const openDialog = (action: PendingAction, opener: HTMLElement) => {
    openerRef.current = opener;
    setActionError(null);
    setPendingAction(action);
  };

  const closeDialog = () => {
    setPendingAction(null);
    const opener = openerRef.current;
    openerRef.current = null;
    // The opener may be gone (e.g. the row disappeared after invalidation);
    // focusing a detached element is a silent no-op, never an error.
    opener?.focus();
  };

  const runPending = () => {
    if (!pendingAction || isMutating) return;
    setActionError(null);
    setBusyRowId(pendingAction.user._id);
    if (pendingAction.kind === "approve") approve.mutate(pendingAction.user._id);
    else if (pendingAction.kind === "revoke") revoke.mutate(pendingAction.user._id);
    else setRole.mutate({ id: pendingAction.user._id, role: pendingAction.role });
  };

  // Move focus into the dialog when it opens (onto Cancel — the least
  // dangerous default — never the destructive action), trap Tab inside it,
  // and close on Escape.
  useEffect(() => {
    if (!pendingAction) return undefined;

    cancelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMutating) return;
        e.preventDefault();
        closeDialog();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pendingAction, isMutating]);

  // Memoised: an identity that changes only when what a row can show actually
  // changes, not on every render — a fresh array/object on every render was
  // handing the DataGrid a "new" column set each time, which reset any column
  // width the operator had dragged.
  const columns: GridColDef[] = useMemo(
    () => [
    { field: "name", headerName: "שם", width: 200 },
    { field: "email", headerName: "אימייל", width: 260 },
    {
      field: "role",
      headerName: "תפקיד",
      width: 120,
      renderCell: (params) => (
        <span className={`role ${params.row.role === "admin" ? "admin" : "member"}`}>
          {params.row.role === "admin" ? "מנהל" : "חבר"}
        </span>
      ),
    },
    {
      field: "approved",
      headerName: "סטטוס",
      width: 120,
      // Same badge treatment as the messages table's visibility tier
      // (.tier in messages.scss): colour reinforces the text, never replaces it.
      renderCell: (params) => (
        <span className={`tier ${params.row.approved ? "approved" : "pending"}`}>
          {params.row.approved ? "מאושר" : "ממתין"}
        </span>
      ),
    },
    {
      field: "emailVerified",
      headerName: "אימייל מאומת",
      width: 140,
      // Text, not a bare tick: "לא" is unambiguous where a missing icon is not.
      valueGetter: (params) => (params.row.emailVerified ? "כן" : "לא"),
    },
    {
      field: "createdAt",
      headerName: "נרשם",
      width: 140,
      valueGetter: (params) => formatDate(params.row.createdAt),
    },
    {
      field: "actions",
      headerName: "פעולות",
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const row = params.row as User;
        // Never render an action on the signed-in admin's own row: the server
        // refuses self-role-change (and self-revoke), and offering the button
        // would just be a lie the operator has to discover by clicking it.
        if (me && row._id === me.id) return null;

        const rowBusy = isMutating && busyRowId === row._id;
        const isAdmin = row.role === "admin";

        const buttons: { key: string; label: string; ariaLabel: string; action: PendingAction }[] = [];

        if (isAdmin) {
          // Revoking an admin is refused with 400 server-side — it would take
          // nothing away, so the button is never offered. Offer the role
          // change instead, which is the real way to remove admin powers.
          buttons.push({
            key: "demote",
            label: "הפוך לחבר",
            ariaLabel: `הפוך את ${row.name} לחבר`,
            action: { kind: "role", user: row, role: "member" },
          });
        } else if (row.approved) {
          buttons.push({
            key: "revoke",
            label: "בטל אישור",
            ariaLabel: `בטל אישור עבור ${row.name}`,
            action: { kind: "revoke", user: row },
          });
          buttons.push({
            key: "promote",
            label: "הפוך למנהל",
            ariaLabel: `הפוך את ${row.name} למנהל`,
            action: { kind: "role", user: row, role: "admin" },
          });
        } else if (row.emailVerified) {
          // "Pending" — the queue an admin actually admits people from — means
          // verified but not yet approved, the same definition Home.tsx's tile
          // counts by. An unverified account has not even proved the address is
          // real, so there is nothing to admit yet: the server now refuses
          // (400) an approve on an unverified account (usersController.js
          // approveUser), and the button is withheld here the same way the
          // revoke-an-admin button is withheld above.
          buttons.push({
            key: "approve",
            label: "אשר",
            ariaLabel: `אשר את ${row.name}`,
            action: { kind: "approve", user: row },
          });
        }

        return (
          <div className="rowActions">
            {buttons.map((b) => (
              <button
                key={b.key}
                type="button"
                className={`actionBtn ${b.key}`}
                disabled={rowBusy}
                aria-label={b.ariaLabel}
                onClick={(e) => openDialog(b.action, e.currentTarget)}
              >
                {b.label}
              </button>
            ))}
          </div>
        );
      },
    },
    ],
    [me, busyRowId, isMutating]
  );

  if (users.isError) {
    return (
      <div className="users">
        <div className="error" role="alert">
          {errorMessage(users.error, "טעינת המשתמשים נכשלה.")}
        </div>
      </div>
    );
  }

  return (
    <div className="users">
      <div className="info">
        <h1>משתמשים</h1>
        <span className="count">
          {users.isLoading ? "טוען…" : `${users.data?.length ?? 0} חשבונות`}
        </span>
      </div>

      {actionError && (
        <div className="error" role="alert">
          {actionError}
        </div>
      )}

      <div className="dataTable">
        <DataGrid
          className="dataGrid"
          loading={users.isLoading}
          rows={users.data ?? []}
          getRowId={(row) => row._id}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </div>

      {pendingAction && (
        <div className="confirmBackdrop" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
          <div className="confirmBox" ref={dialogRef}>
            <h2 id="confirmTitle">{dialogCopy(pendingAction).title}</h2>
            <p className="target">{pendingAction.user.name}</p>
            <p className="warn">{dialogCopy(pendingAction).body}</p>
            <div className="actions">
              <button type="button" ref={cancelRef} onClick={closeDialog} disabled={isMutating}>
                ביטול
              </button>
              <button
                type="button"
                className="danger"
                aria-disabled={isMutating}
                // Never the native `disabled` attribute here: this is the
                // button the operator just clicked and it holds focus. The
                // native attribute would drop focus to <body> the instant the
                // mutation starts (SERIOUS 3) — aria-disabled keeps it
                // focusable and announced as unavailable, and runPending
                // itself is the real re-entrancy guard.
                onClick={runPending}
              >
                {isMutating ? "מבצע…" : dialogCopy(pendingAction).confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
