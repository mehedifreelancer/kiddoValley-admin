import React from "react";
import { Dialog } from "primereact/dialog";
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
  hideScrollbar?: boolean; // New prop to hide scrollbar
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "lg",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = "",
  hideFooter = false,
  hideScrollbar = true, // Default to true to hide scrollbar
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
    <div className="rounded-t-sm flex items-center justify-between w-full p-2 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
      <h3 className="text-md font-semibold text-gray-800 dark:text-white">
        {title}
      </h3>
      {showCloseButton && (
        <button
          onClick={onClose}
          className="cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 rounded-lg"
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
      className={`rounded-sm 
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
      <div className={`p-3 bg-white dark:bg-gray-800 scrollbar-hide`}>
        {children}
      </div>
    </Dialog>
  );
};

export default Modal;