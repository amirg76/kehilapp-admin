import { FC } from "react";
import { XCircle, CheckCircle } from "lucide-react";
import "./notification.scss";

export type NotificationType = "success" | "error";

export interface NotificationState {
  type: NotificationType;
  title: string;
  message: string;
  isVisible: boolean;
}

interface NotificationProps extends NotificationState {
  onClose?: () => void; // Make it optional since success doesn't need it
}

const Notification: FC<NotificationProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`notification ${
        type === "success" ? "notification-success" : "notification-error"
      }`}
    >
      <div className="notification-content">
        {type === "success" ? (
          <CheckCircle className="notification-icon" />
        ) : (
          <XCircle className="notification-icon" />
        )}
        <div className="notification-text">
          <h3 className="notification-title">{title}</h3>
          <p className="notification-message">{message}</p>
        </div>
        {type === "error" && (
          <button
            onClick={onClose}
            className="notification-close"
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;
