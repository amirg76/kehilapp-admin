import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridRowModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { debounce } from "lodash";
import "./dataTable.scss";
import { Link } from "react-router-dom";
import { deleteItemFromTable } from "@/features/authentication/helpers/deleteItemFromTable";

import { useCallback, useMemo, useState } from "react";
import { updateUsersInDb } from "@/helpers/UserHelpers/updateUsersInDb";

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

const DataTable = (props: Props) => {
  const { handleDeleteItem } = deleteItemFromTable();
  const { handleUpdateUsers } = updateUsersInDb();
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdates>({});

  const saveChanges = async (userId: string) => {
    try {
      const update = pendingUpdates[userId];

      console.log("Saved one row change:", userId, update);
      console.log("Saved changes:", userId, pendingUpdates);
      handleUpdateUsers({ id: userId, updateData: update });
      // setPendingUpdates({});
    } catch (error) {
      console.error("Failed to save changes:", error);
      // Handle error (e.g., show error message to user)
    }
  };
  const debouncedUpdate = useCallback(
    debounce((userId: string, field: string, value: any) => {
      setPendingUpdates((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], [field]: value },
      }));
    }, 300),
    []
  );
  const processRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
    const { _id, ...fields } = newRow;
    Object.entries(fields).forEach(([field, value]) => {
      if (value !== oldRow[field]) {
        console.log("Process row update:", _id, field, value);

        debouncedUpdate(_id as string, field, value);
      }
    });
    return newRow;
  };
  const renderSaveButton = (params: GridRenderCellParams) => {
    const hasChanges = !!pendingUpdates[params.row._id as string];

    if (!hasChanges) return null;

    return (
      <button onClick={() => saveChanges(params.row._id as string)}>
        Save Changes
      </button>
    );
  };

  const handleDelete = (id: string) => {
    //delete the item
    handleDeleteItem(id);
  };

  const actionColumn: GridColDef = useMemo(
    () => ({
      field: "action",
      headerName: "Action",
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        return (
          <div className="action">
            <Link to={`/${props.slug}/${params.row.id}`}>
              <img src="/view.svg" alt="" />
            </Link>
            <div
              className="delete"
              onClick={() => handleDelete(params.row._id)}
            >
              <img src="/delete.svg" alt="" />
            </div>
            {renderSaveButton(params)}
          </div>
        );
      },
    }),

    [pendingUpdates, handleDelete, renderSaveButton]
  );

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
