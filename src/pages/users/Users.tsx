import { useState } from "react";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    default:
      // Exhaustiveness guard — TypeScript should never let this branch run.
      return { title: "", body: "", confirmLabel: "" };
  }
};

const Users = () => {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  // Which row currently has an in-flight mutation, so only that row's buttons
  // disable — a double click on a different row must still work.
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  const users = useQuery({ queryKey: ["users"], queryFn: () => usersApi.list() });

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
    // Surfaces the server's 400 refusals verbatim: self-revoke and
    // admin-revoke both explain themselves in the message (usersController.js).
    onError: (err) => setActionError(errorMessage(err, "ביטול האישור נכשל.")),
    onSettled: () => {
      setPendingAction(null);
      setBusyRowId(null);
    },
  });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => usersApi.setRole(id, role),
    onSuccess: invalidateAndClear,
    // Surfaces the server's 400 refusals: self-role-change and
    // last-admin-demotion both explain themselves in the message.
    onError: (err) => setActionError(errorMessage(err, "שינוי התפקיד נכשל.")),
    onSettled: () => {
      setPendingAction(null);
      setBusyRowId(null);
    },
  });

  const isMutating = approve.isLoading || revoke.isLoading || setRole.isLoading;

  const runPending = () => {
    if (!pendingAction) return;
    setBusyRowId(pendingAction.user._id);
    if (pendingAction.kind === "approve") approve.mutate(pendingAction.user._id);
    else if (pendingAction.kind === "revoke") revoke.mutate(pendingAction.user._id);
    else setRole.mutate({ id: pendingAction.user._id, role: pendingAction.role });
  };

  const columns: GridColDef[] = [
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
        } else {
          if (row.approved) {
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
          } else {
            buttons.push({
              key: "approve",
              label: "אשר",
              ariaLabel: `אשר את ${row.name}`,
              action: { kind: "approve", user: row },
            });
          }
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
                onClick={() => setPendingAction(b.action)}
              >
                {b.label}
              </button>
            ))}
          </div>
        );
      },
    },
  ];

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
          <div className="confirmBox">
            <h2 id="confirmTitle">{dialogCopy(pendingAction).title}</h2>
            <p className="target">{pendingAction.user.name}</p>
            <p className="warn">{dialogCopy(pendingAction).body}</p>
            <div className="actions">
              <button type="button" onClick={() => setPendingAction(null)} disabled={isMutating}>
                ביטול
              </button>
              <button
                type="button"
                className="danger"
                disabled={isMutating}
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
