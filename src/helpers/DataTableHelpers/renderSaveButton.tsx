// renderSaveButton.tsx
import { GridRenderCellParams } from "@mui/x-data-grid";

interface RenderSaveButtonProps {
  params: GridRenderCellParams;
  pendingUpdates: Record<string, any>;
  saveChanges: (id: string) => void;
  icon: string;
}

export const RenderSaveButton = ({
  params,
  pendingUpdates,
  saveChanges,
  icon,
}: RenderSaveButtonProps) => {
  const hasChanges = !!pendingUpdates[params.row._id as string];

  return (
    <img
      onClick={() => hasChanges && saveChanges(params.row._id as string)}
      src={icon}
      alt="save"
      title="Save"
      style={{
        opacity: hasChanges ? 1 : 0.1,
        cursor: hasChanges ? "pointer" : "default",
      }}
    />
  );
};
