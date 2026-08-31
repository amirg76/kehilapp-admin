import { useMemo, useState } from "react";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, Message, messagesApi } from "../../api/kehilapp";
import { errorMessage } from "../../services/http";
import "./messages.scss";

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("he-IL", { dateStyle: "medium" }) : "—";

const Messages = () => {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);

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

  const columns: GridColDef[] = [
    { field: "title", headerName: "כותרת", width: 240 },
    {
      field: "categoryId",
      headerName: "קטגוריה",
      width: 150,
      valueGetter: (params) => categoryTitles.get(params.row.categoryId) ?? "—",
    },
    {
      field: "visibility",
      headerName: "נראוּת",
      width: 120,
      renderCell: (params) => (
        <span className={`tier ${params.row.visibility === "members" ? "members" : "public"}`}>
          {params.row.visibility === "members" ? "חברים בלבד" : "ציבורי"}
        </span>
      ),
    },
    {
      field: "text",
      headerName: "תוכן",
      width: 320,
      // Plain text into a cell, never dangerouslySetInnerHTML: this content is
      // user-submitted, and the board already had an XSS through an attachment.
      valueGetter: (params) => (params.row.text ?? "").replace(/\s+/g, " ").trim(),
    },
    {
      field: "createdAt",
      headerName: "נוצר",
      width: 130,
      valueGetter: (params) => formatDate(params.row.createdAt),
    },
    {
      field: "action",
      headerName: "פעולות",
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
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
