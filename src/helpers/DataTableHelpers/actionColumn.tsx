import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { RenderSaveButton } from "./renderSaveButton";

interface ActionColumnProps {
  slug: string;
  pendingUpdates: Record<string, any>;
  handleDelete: (id: string) => void;
  saveChanges: (id: string) => void;
  rowIcons: Record<string, string>;
}

export const createActionColumn = ({
  slug,
  pendingUpdates,
  handleDelete,
  saveChanges,
  rowIcons,
}: ActionColumnProps): GridColDef => {
  return useMemo(
    () => ({
      field: "action",
      headerName: "Action",
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <div className="action">
          <Link to={`/${slug}/${params.row.id}`}>
            <img src="/view.svg" alt="view" title="view" />
          </Link>
          <div className="delete" onClick={() => handleDelete(params.row._id)}>
            <img src="/delete.svg" alt="delete" title="delete" />
          </div>
          <RenderSaveButton
            params={params}
            pendingUpdates={pendingUpdates}
            saveChanges={saveChanges}
            icon={rowIcons[params.row._id] || "/diskette-Save.svg"}
          />
        </div>
      ),
    }),
    [slug, pendingUpdates, handleDelete, saveChanges, rowIcons]
  );
};
