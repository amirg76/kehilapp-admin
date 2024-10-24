// rowUpdateHandler.ts
import { useCallback } from "react";
import { debounce } from "lodash";
import { GridRowModel } from "@mui/x-data-grid";

interface RowUpdateHandlerParams {
  setPendingUpdates: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, any>>>
  >;
  setRowIcons: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const useRowUpdateHandler = ({
  setPendingUpdates,
  setRowIcons,
}: RowUpdateHandlerParams) => {
  // Debounced update function to avoid rapid state changes
  const debouncedUpdate = useCallback(
    debounce((userId: string, field: string, value: any) => {
      setPendingUpdates((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], [field]: value },
      }));
      setRowIcons((prev) => ({ ...prev, [userId]: "/diskette-Save.svg" })); // Set save icon on edit
    }, 300),
    []
  );

  // Handle row update logic
  const processRowUpdate = (
    newRow: GridRowModel,
    oldRow: GridRowModel
  ): GridRowModel => {
    const { _id, ...fields } = newRow;

    Object.entries(fields).forEach(([field, value]) => {
      if (value !== oldRow[field]) {
        debouncedUpdate(_id as string, field, value);
      }
    });

    return newRow;
  };

  return { processRowUpdate };
};
