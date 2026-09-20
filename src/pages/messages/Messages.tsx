import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, Message, messagesApi } from "../../api/kehilapp";
import { errorMessage } from "../../services/http";
// The Hebrew labels for the server's urgency enum, and the reader that treats an
// absent value as "routine". Lifted out of this file and NewMessage.tsx once the
// edit form needed the same three levels — see the comment there for why a third
// hand-written copy is a drift waiting to happen.
import { urgencyLabel, urgencyOf } from "./urgencyOptions";
import "./messages.scss";

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("he-IL", { dateStyle: "medium" }) : "—";

const Messages = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);

  // Arrives after a successful publish from NewMessage.tsx. React Router
  // restores history.state.usr on a refresh or Back navigation, so this DOES
  // survive a reload — it is cleared below after the first render so a stale
  // "published" notice cannot resurface on F5 or Back.
  // `savedTitle` is the same mechanism from EditMessage.tsx. Two keys rather
  // than one shared one because the two sentences are not interchangeable:
  // "published" says a message now exists that did not before, which is exactly
  // what an admin who only edited one must not be told.
  const routeState = location.state as { publishedTitle?: string; savedTitle?: string } | null;
  const publishedTitle = routeState?.publishedTitle;
  const savedTitle = routeState?.savedTitle;

  // The banner is rendered from COMPONENT state, not from the route state.
  //
  // It used to be rendered straight from `location.state`, and the effect below
  // cleared that state on the first render — so the notice was destroyed in the
  // same tick it appeared and no admin ever read it, on either the publish flow
  // or the edit flow. Copying it here first keeps both things: the sentence
  // survives the clearing, and the route state is still emptied, so a refresh or
  // a Back navigation cannot re-announce a publish from minutes ago (React
  // Router restores history.state.usr, which is what made that possible).
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!publishedTitle && !savedTitle) return;
    // Two sentences, not one shared one: "פורסמה" says a message now exists
    // that did not before, which an admin who only edited one must not be told.
    setNotice(
      publishedTitle
        ? `ההודעה "${publishedTitle}" פורסמה`
        : `השינויים בהודעה "${savedTitle}" נשמרו`
    );
    navigate(location.pathname, { replace: true, state: null });
  }, [publishedTitle, savedTitle, location.pathname, navigate]);

  // Auto-dismissal, as a backstop to the explicit close button below — a banner
  // that never leaves on its own is still on screen next time the admin looks at
  // the grid and stops meaning anything. Ten seconds because the notice is a
  // full Hebrew sentence carrying a message title, and a two- or three-second
  // toast is a sentence the reader is still in the middle of. Cleared on unmount
  // so a timer cannot fire setState on a page that has already been left.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 10000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // The board is small (tens of messages), so one page of 200 is both the whole
  // dataset and cheaper than paging. Revisit if the community ever outgrows it.
  const messages = useQuery({
    queryKey: ["messages"],
    queryFn: () => messagesApi.list({ limit: 200 }),
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  // id → title, so the grid shows "בריאות" instead of a raw ObjectId.
  const categoryTitles = useMemo(() => {
    const map = new Map<string, string>();
    (categories.data ?? []).forEach((c) => map.set(c._id, c.title));
    return map;
  }, [categories.data]);

  const remove = useMutation({
    mutationFn: (id: string) => messagesApi.remove(id),
    onSuccess: () => {
      setActionError(null);
      // Refetch rather than splice locally: the server is the authority on what
      // survived, and a failed-but-optimistic row is worse than a short spinner.
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (err) =>
      setActionError(
        errorMessage(err, "מחיקת ההודעה נכשלה. ייתכן שההרשאה פגה — נסה להתחבר מחדש.")
      ),
    onSettled: () => setPendingDelete(null),
  });

  // Sizing: `flex` on the three columns whose content is elastic (title,
  // category, body text) and a `minWidth` floor on every column, instead of the
  // fixed `width` each used to carry. The fixed set summed to 1240px of columns
  // inside a ~962px content area at a 1280px window, so the grid scrolled
  // sideways and "נוצר" was clipped to a ~22px sliver at the edge — an admin had
  // to scroll a table to read a date. The floors sum to 920px against a 962px
  // content area, which is what keeps that from coming back at 1280 while still
  // letting the grid (not the page) scroll on a phone.
  //
  // "פעולות" keeps a plain `width`, deliberately: it holds two real buttons
  // whose Hebrew labels do not reflow, so it must not be squeezed by a flex
  // share that a narrow window computes.
  const columns: GridColDef[] = [
    { field: "title", headerName: "כותרת", flex: 1.4, minWidth: 150 },
    {
      field: "categoryId",
      headerName: "קטגוריה",
      flex: 0.8,
      minWidth: 100,
      valueGetter: (params) => categoryTitles.get(params.row.categoryId) ?? "—",
    },
    {
      field: "visibility",
      headerName: "נראוּת",
      width: 110,
      minWidth: 110,
      renderCell: (params) => (
        <span className={`tier ${params.row.visibility === "members" ? "members" : "public"}`}>
          {params.row.visibility === "members" ? "חברים בלבד" : "ציבורי"}
        </span>
      ),
    },
    {
      field: "urgency",
      headerName: "דחיפות",
      width: 100,
      minWidth: 100,
      // valueGetter returns the Hebrew label, not the raw enum, so sorting and
      // the toolbar's quick filter operate on what the admin can actually see.
      // renderCell then receives that label as params.value and only adds the
      // badge around it.
      valueGetter: (params) => urgencyLabel(urgencyOf(params.row.urgency)),
      renderCell: (params) => (
        <span className={`urgencyTag ${urgencyOf(params.row.urgency)}`}>{params.value}</span>
      ),
    },
    {
      field: "text",
      headerName: "תוכן",
      flex: 1.8,
      minWidth: 180,
      // Plain text into a cell, never dangerouslySetInnerHTML: this content is
      // user-submitted, and the board already had an XSS through an attachment.
      valueGetter: (params) => (params.row.text ?? "").replace(/\s+/g, " ").trim(),
    },
    {
      field: "createdAt",
      headerName: "נוצר",
      // 130 and not less: the DataGrid's own cell padding leaves content width
      // 20px under the column, and at a 110px column "20 בספט׳ 2026" came back
      // ellipsised on two-digit days. This column's content has a fixed maximum
      // length, so it gets a width that fits it rather than a flex share.
      width: 130,
      minWidth: 130,
      valueGetter: (params) => formatDate(params.row.createdAt),
    },
    {
      field: "action",
      headerName: "פעולות",
      width: 150,
      minWidth: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="rowActions">
          {/* A Link, not a button with navigate(): the edit form has a real URL,
              so this has to be something the admin can open in a new tab and
              something a screen reader announces as a link to a place. */}
          <Link
            className="editBtn"
            to={`/messages/${params.row._id}/edit`}
            // Both controls carry the message title, because "ערוך"/"מחק" alone
            // is what an admin tabbing through the grid hears twenty-five times
            // with no idea which row they are on.
            aria-label={`ערוך את ההודעה ${params.row.title}`}
          >
            ערוך
          </Link>
          <button
            className="deleteBtn"
            type="button"
            onClick={() => setPendingDelete(params.row as Message)}
            // A real label, not an icon alone — the icon-only button in the
            // template announced nothing at all to a screen reader.
            aria-label={`מחק את ההודעה ${params.row.title}`}
          >
            מחק
          </button>
        </div>
      ),
    },
  ];

  if (messages.isError) {
    return (
      <div className="messages">
        <div className="error" role="alert">
          {errorMessage(messages.error, "טעינת ההודעות נכשלה.")}
        </div>
      </div>
    );
  }

  return (
    <div className="messages">
      <div className="info">
        <h1>הודעות</h1>
        <span className="count">
          {messages.isLoading ? "טוען…" : `${messages.data?.total ?? 0} הודעות`}
        </span>
        <Link className="newMessageBtn" to="/messages/new">
          הודעה חדשה
        </Link>
      </div>

      {/* The live region itself is always mounted — see messages.scss — because
          a screen reader announces text that LANDS in a region already in the
          accessibility tree, not a region that appears together with its text.
          role="status" (polite) and not role="alert" like the error below: this
          is a confirmation, and it must not interrupt whatever is being read. */}
      <div className="status" role="status">
        {notice && (
          <>
            <span>{notice}</span>
            <button
              type="button"
              className="statusClose"
              onClick={() => setNotice(null)}
              // A real label: the visible glyph is "×", which a screen reader
              // reads as a multiplication sign or skips entirely.
              aria-label="סגור את ההודעה"
            >
              ×
            </button>
          </>
        )}
      </div>

      {actionError && (
        <div className="error" role="alert">
          {actionError}
        </div>
      )}

      <div className="dataTable">
        <DataGrid
          className="dataGrid"
          loading={messages.isLoading}
          rows={messages.data?.items ?? []}
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

      {/* Deletion is irreversible and admin-only. Confirming is the cheap half of
          that; the server enforcing the role is the half that matters. */}
      {pendingDelete && (
        <div className="confirmBackdrop" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
          <div className="confirmBox">
            <h2 id="confirmTitle">למחוק את ההודעה?</h2>
            <p className="target">{pendingDelete.title}</p>
            <p className="warn">הפעולה אינה הפיכה.</p>
            <div className="actions">
              <button type="button" onClick={() => setPendingDelete(null)}>
                ביטול
              </button>
              <button
                type="button"
                className="danger"
                disabled={remove.isLoading}
                onClick={() => remove.mutate(pendingDelete._id)}
              >
                {remove.isLoading ? "מוחק…" : "מחק"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
