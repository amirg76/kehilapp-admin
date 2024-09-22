import { useState } from "react";

// ModalComponent.js
import { Dialog } from "@headlessui/react";

const ModalDialog = ({ isOpen, onClose, children }) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50 "
    >
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div
        className="fixed inset-0 bg-black/70 "
        aria-hidden="true"
      />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* The actual dialog panel  */}
          <Dialog.Panel className=" ">
          <Dialog.Title className=" ">{children}</Dialog.Title>
          {/* ... */}
        </Dialog.Panel>
      </div>
      {/* Modal content goes here */}
    </Dialog>
  );
};

export default ModalDialog;
