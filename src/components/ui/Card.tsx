import React from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  className = "",
  titleClassName = "",
  contentClassName = "",
  hoverable = false,
  onClick,
}) => {
  return (
    <motion.div
      className={`
        bg-white dark:bg-gray-800
        rounded-lg shadow-sm
        transition-all duration-200
        ${hoverable ? "cursor-pointer hover:shadow-sm" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Optional header with icon and title */}
      {(title || icon) && (
        <div className="flex items-start gap-3 p-4 pb-2">
          {icon && (
            <div className="flex-shrink-0 text-blue-600 dark:text-blue-300">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h3
                className={`text-base font-semibold text-gray-800 dark:text-white ${titleClassName}`}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={`p-4 ${!title && !icon ? "p-4" : "pt-0"} ${contentClassName}`}
      >
        {children}
      </div>
    </motion.div>
  );
};

export default Card;
