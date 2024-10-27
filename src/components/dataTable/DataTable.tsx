import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import "./dataTable.scss";
import { useDeleteUser } from "@/helpers/UserHelpers/deleteItemFromTable";
import { useState } from "react";
import { useUpdateUser } from "@/helpers/UserHelpers/updateUsersInDb";
import { createActionColumn } from "@/helpers/DataTableHelpers/actionColumn";
import { useRowUpdateHandler } from "@/helpers/DataTableHelpers/rowUpdateHandler";

// Define a type for your user object
interface User {
  id: number;
  [key: string]: any; // For other fields
}

type Props = {
  columns: GridColDef[];
  rows: object[];
  slug: string;
};
// Define a type for pending updates
interface PendingUpdates {
  [userId: string]: Partial<User>;
}

// Track the current icon state per row
interface RowIconsState {
  [userId: string]: string;
}
const DataTable = (props: Props) => {
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdates>({});
  const [rowIcons, setRowIcons] = useState<RowIconsState>({}); // Store icons per row
  const { processRowUpdate } = useRowUpdateHandler({
    setPendingUpdates,
    setRowIcons,
  });

  const saveChanges = async (userId: string) => {
    try {
      setRowIcons((prev) => ({ ...prev, [userId]: "/reload.svg" })); // Set reload icon

      const update = pendingUpdates[userId];

      // Wait for the backend response
      updateUser.mutate({
        id: userId,
        updateData: update,
      });

      setTimeout(() => {
        setRowIcons((prev) => ({ ...prev, [userId]: "/approved.svg" })); // Set approved icon
      }, 2000);
    } catch (error) {
      console.error("Failed to save changes:", error);
      // Optionally, set an error icon or revert to the save icon
      setRowIcons((prev) => ({ ...prev, [userId]: "/error.svg" }));
      // Handle error (e.g., show error message to user)
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteUser.mutate({ id });
    }
  };
  const actionColumn = createActionColumn({
    slug: props.slug,
    pendingUpdates,
    handleDelete,
    saveChanges,
    rowIcons,
  });
  return (
    <div className="dataTable">
      <DataGrid
        className="dataGrid"
        rows={props.rows}
        columns={[
          ...props.columns.map((column) => ({ ...column, editable: true })),
          actionColumn,
        ]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        disableRowSelectionOnClick
        disableColumnFilter
        disableDensitySelector
        disableColumnSelector
        editMode="row"
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={(error) => {
          // Handle any errors here
          console.error("Error while saving:", error);
        }}
      />
    </div>
  );
};
export default DataTable;
