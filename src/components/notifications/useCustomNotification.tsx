// hooks/useCustomNotification.ts
import { useState } from "react";
import { NotificationType, NotificationState } from "./NotificationComponent";

// export type NotificationType = "success" | "error";

// export interface NotificationState {
//   type: NotificationType;
//   title: string;
//   message: string;
//   isVisible: boolean;
// }
interface UseCustomNotificationProps {
  closeModalCallback?: () => void;
}

// hooks/useCustomNotification.ts
export const useCustomNotification = ({
  closeModalCallback,
}: UseCustomNotificationProps = {}) => {
  const [notification, setNotification] = useState<NotificationState>({
    type: "success",
    title: "",
    message: "",
    isVisible: false,
  });

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  const showNotification = (
    type: NotificationType,
    title: string,
    message: string
  ) => {
    const newNotification = {
      type,
      title,
      message,
      isVisible: true,
    };

    if (type === "success") {
      setTimeout(() => {
        closeNotification();
        closeModalCallback?.();
      }, 2000);
    } else {
      setTimeout(() => {
        closeNotification();
      }, 6000);
    }

    setNotification(newNotification);
    return newNotification;
  };

  const handleNotification = (response: any, successMessage: string) => {
    if (!response.success) {
      showNotification(
        "error",
        "אירעה שגיאה",
        response.error.message || "Operation failed"
      );

      return false;
    }

    showNotification("success", " ! הפעולה בוצעה בהצלחה", successMessage);
    return true;
  };

  return {
    notification,
    handleNotification,
    closeNotification,
    showNotification,
  };
};
