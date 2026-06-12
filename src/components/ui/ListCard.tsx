import React from "react";
import { motion } from "framer-motion";
import { Package, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ProductListCardProps {
  image?: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  currency?: string;
  unit?: string;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const ListCard: React.FC<ProductListCardProps> = ({
  image,
  title,
  description,
  price,
  stock,
  currency = "$",
  unit = "pcs",
  className = "",
  onClick,
  hoverable = true,
}) => {
  // Determine stock status
  const stockStatus = stock <= 0 ? "out" : stock < 10 ? "low" : "in";

  const stockConfig = {
    in: {
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      icon: <CheckCircle className="w-4 h-4" />,
      text: "In Stock",
    },
    low: {
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      icon: <AlertCircle className="w-4 h-4" />,
      text: `${stock} left`,
    },
    out: {
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
      icon: <XCircle className="w-4 h-4" />,
      text: "Out of Stock",
    },
  };

  const currentStock = stockConfig[stockStatus];

  return (
    <motion.div
      className={`
        bg-white dark:bg-blue-200/10
        rounded-lg shadow-sm
        transition-all duration-200
        ${hoverable ? "cursor-pointer hover:shadow-md" : ""}
        ${onClick ? "cursor-pointer" : ""}
        overflow-hidden
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start p-2 gap-4">
        {/* Left side - Image */}
        <div className="flex-shrink-0">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-16 h-16 object-cover rounded-lg bg-gray-100 dark:bg-blue-900"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
          )}
        </div>

        {/* Middle - Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1">
            {title}
          </h3>

          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {description}
            </p>
          )}

          {/* Stock indicator - visible on mobile/tablet */}
          <div className="md:hidden mt-2">
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                ${currentStock.bg} ${currentStock.color}
              `}
            >
              {currentStock.icon}
              {currentStock.text}
            </span>
          </div>
        </div>

        {/* Right side - Price & Stock (desktop) */}
        <div className="hidden md:block text-right">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {currency}
            {price.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            per {unit}
          </div>

          {/* Stock indicator */}
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-2
              ${currentStock.bg} ${currentStock.color}
            `}
          >
            {currentStock.icon}
            {currentStock.text}
          </span>
        </div>

        {/* Mobile price */}
        <div className="md:hidden text-right">
          <div className="text-base font-bold text-gray-900 dark:text-white">
            {currency}
            {price.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            /{unit}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ListCard;
