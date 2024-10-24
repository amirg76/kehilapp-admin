import { useEffect, useState } from "react";

interface UseSaveIconProps {
  loading: boolean;
  hasChanges: boolean;
}

export const useSaveIcon = ({ loading, hasChanges }: UseSaveIconProps) => {
  const [icon, setIcon] = useState("/diskette-Save.svg");
  const [opacity, setOpacity] = useState(1);
  const [isSaved, setIsSaved] = useState(false); // Track if row is saved

  useEffect(() => {
    if (loading) {
      setIcon("/reload.svg");
      setOpacity(1); // Full opacity during loading

      const loadingTimeout = setTimeout(() => {
        setIcon("/approved.svg");
        setIsSaved(true); // Mark row as saved
        setOpacity(1); // Keep full opacity after save
      }, 2000);

      return () => clearTimeout(loadingTimeout); // Cleanup on unmount
    } else if (hasChanges) {
      // Reset to save icon only if there are changes
      setIcon("/diskette-Save.svg");
      setOpacity(1); // Full opacity for active edits
      setIsSaved(false); // Reset saved state on new change
    } else if (isSaved) {
      // If saved, keep approved icon
      setIcon("/approved.svg");
      setOpacity(1);
    } else {
      // Default for rows with no changes
      setIcon("/diskette-Save.svg");
      setOpacity(0.1); // Reduced opacity for inactive rows
    }
  }, [loading, hasChanges, isSaved]);

  return { icon, opacity };
};
