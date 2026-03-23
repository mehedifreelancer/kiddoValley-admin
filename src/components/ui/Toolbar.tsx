import React from "react";

interface ToolbarProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  actions?: React.ReactNode; // For right-aligned actions
}

const Toolbar: React.FC<ToolbarProps> = ({
  title,
  children,
  className = "",
  titleClassName = "",
  actions,
}) => {
  return (
    <div
      className={`my-1
        bg-white dark:bg-gray-800
        rounded-sm shadow-sm
        border border-gray-200 dark:border-gray-800
        p-2
        flex items-center justify-between
        ${className}
      `}
    >
      {/* Left section with title and main content */}

      <h3
        className={`
            text-md font-bold text-color
            whitespace-nowrap
            ${titleClassName}
          `}
      >
        {title}
      </h3>

      {/* Main toolbar content (date pickers, inputs, etc) */}
      {children}
    </div>
  );
};

export default Toolbar;
