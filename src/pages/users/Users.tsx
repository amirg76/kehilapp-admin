import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../../api/kehilapp";
import { errorMessage } from "../../services/http";
import "./users.scss";

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("he-IL", { dateStyle: "medium" }) : "—";

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
];

const Users = () => {
  // GET /api/users is admin-only on the server — the whole member directory in
  // one response. A member reaching this page gets 403 and the error below.
  const users = useQuery({ queryKey: ["users"], queryFn: () => usersApi.list() });

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
    </div>
  );
};

export default Users;
