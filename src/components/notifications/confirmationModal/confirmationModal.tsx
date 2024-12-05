import { FC } from "react";
import "./confirmationModal.scss";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-modal">
        <h2 className="confirmation-title">{title}</h2>
        <p className="confirmation-message">{message}</p>
        <div className="confirmation-buttons">
          <button onClick={onClose} className="confirmation-button cancel">
            Cancel
          </button>
          <button onClick={onConfirm} className="confirmation-button confirm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
