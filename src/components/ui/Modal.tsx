import React from "react";
import { Dialog } from "primereact/dialog";
import Button from "./Button";
import { X } from "lucide-react";

export type ModalSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
  hideFooter?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = "",
  hideFooter = false,
}) => {
  // Size mappings
  const sizeClasses = {
    xs: "w-full max-w-sm", // 384px
    sm: "w-full max-w-md", // 448px
    md: "w-full max-w-lg", // 512px
    lg: "w-full max-w-2xl", // 672px
    xl: "w-full max-w-4xl", // 896px
    full: "w-full max-w-6xl", // 1152px
  };

  // Custom header with close button
  const headerTemplate = (
    <div className="flex items-center justify-between w-full px-2 py-1">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        {title}
      </h3>
      {showCloseButton && (
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      )}
    </div>
  );

  return (
    <Dialog
      header={headerTemplate}
      visible={isOpen}
      onHide={onClose}
      className={`
        ${sizeClasses[size]} 
        ${className}
        [&_.p-dialog-header]:bg-white 
        [&_.p-dialog-header]:dark:bg-gray-900 
        [&_.p-dialog-header]:border-b 
        [&_.p-dialog-header]:border-gray-200 
        [&_.p-dialog-header]:dark:border-gray-800
        [&_.p-dialog-content]:bg-white 
        [&_.p-dialog-content]:dark:bg-gray-900 
        [&_.p-dialog-content]:text-gray-700 
        [&_.p-dialog-content]:dark:text-gray-300
        [&_.p-dialog-header]:p-0
        [&_.p-dialog-content]:p-0
        [&_.p-dialog-header]:rounded-t-lg
        [&_.p-dialog-content]:rounded-b-lg
      `}
      closable={false}
      dismissableMask={closeOnOverlayClick}
      draggable={false}
      resizable={false}
      modal
      blockScroll
    >
      <div className="py-4 px-6 bg-white dark:bg-gray-900">
        {children}
      </div>
    </Dialog>
  );
};

export default Modal;