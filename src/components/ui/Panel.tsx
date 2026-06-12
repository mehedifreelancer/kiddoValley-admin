import React from "react";
import { motion } from "framer-motion";

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
}

const Panel: React.FC<PanelProps> = ({
  title,
  children,
  className = "",
  titleClassName = "",
  contentClassName = "",
  defaultOpen = true,
  collapsible = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        rounded-lg shadow-sm 
        transition-all duration-200 
        hover:shadow-md
        ${className}
      `}
    >
      {/* Header with bottom border */}
      {title && (
        <div
          className={`
            flex items-center justify-between
            px-4 py-3
            border-b border-gray-200 dark:border-blue-900/50
            ${collapsible ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-blue-800/10" : ""}
            ${titleClassName}
          `}
          onClick={() => collapsible && setIsOpen(!isOpen)}
        >
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>

          {collapsible && (
            <motion.svg
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </motion.svg>
          )}
        </div>
      )}

      {/* Content with smooth animation */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className={`p-4 ${contentClassName}`}>{children}</div>
      </motion.div>
    </div>
  );
};

export default Panel;
