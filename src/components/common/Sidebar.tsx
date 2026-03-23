import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Pin, Store } from "lucide-react";
import { useGlobal } from "../../context/GlobalContext";
import type { MenuItem } from "../../types/sidebar/sidebar.types";
import { sidebarMenuData } from "../../data/SidebarMenuData";

const Sidebar: React.FC = () => {
  const { isSidebarPinned, setSidebarPinned } = useGlobal();
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "products",
    "sales",
  ]);
  const [activeItem, setActiveItem] = useState<string>("dashboard");

  // Fixed widths
  const EXPANDED_WIDTH = 220;
  const COLLAPSED_WIDTH = 72;

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      toggleExpand(item.id);
    } else {
      setActiveItem(item.id);
      if (item.path) {
        console.log("Navigating to:", item.path);
        // Add your navigation logic here (e.g., useNavigate)
      }
    }
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isSidebarExpanded = isSidebarPinned || isHovered;
    const isActive = activeItem === item.id;

    const paddingLeft = level === 0 ? 16 : level * 12 + 16;

    return (
      <div key={item.id} className="w-full">
        <motion.div
          className={`flex items-center w-full py-3.5 cursor-pointer transition-colors duration-200 relative ${
            !isSidebarExpanded ? "justify-center" : ""
          } ${
            isActive
              ? "bg-blue-50 dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500"
              : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
          }`}
          style={{
            paddingLeft: isSidebarExpanded ? `${paddingLeft}px` : "12px",
            paddingRight: isSidebarExpanded ? "12px" : "12px",
          }}
          onClick={() => handleItemClick(item)}
          whileHover={{ x: isSidebarExpanded ? 2 : 0 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Icon */}
          <span className={` ${isActive ? "text-blue-500" : ""}`}>{item.icon}</span>

          {/* Label */}
          <AnimatePresence mode="wait">
            {isSidebarExpanded && (
              <motion.span
                key={`label-${item.id}`}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden flex-1"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Badge */}
          {item.badge && isSidebarExpanded && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">
              {item.badge}
            </span>
          )}

          {/* Chevron for children */}
          {hasChildren && isSidebarExpanded && (
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-2"
            >
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.span>
          )}
        </motion.div>

        {/* Children Menu */}
        {hasChildren && (
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: isExpanded && isSidebarExpanded ? "1000px" : "0px",
              opacity: isExpanded && isSidebarExpanded ? 1 : 0,
            }}
          >
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const isSidebarExpanded = isSidebarPinned || isHovered;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Overlay for mobile/unpinned state */}
      {!isSidebarPinned && isHovered && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsHovered(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        onMouseEnter={() => !isSidebarPinned && setIsHovered(true)}
        onMouseLeave={() => !isSidebarPinned && setIsHovered(false)}
        className={`h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-800 shadow-lg z-50 flex flex-col ${
          !isSidebarPinned ? "fixed left-0 top-0" : "relative"
        } scrollbar-hide`}
        style={{
          width: isSidebarExpanded ? `${EXPANDED_WIDTH}px` : `${COLLAPSED_WIDTH}px`,
        }}
      >
        {/* Fixed Header - Logo section */}
        <div className="flex-shrink-0 px-4 py-[18px] border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {isSidebarExpanded ? (
                <motion.div
                  key="logo-expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Store className="w-6 h-6 text-blue-500" />
                  <span className="font-bold text-md text-gray-800 dark:text-white">
                    Kiddo Valley
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="logo-collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex justify-center"
                />
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSidebarPinned(!isSidebarPinned);
                setIsHovered(false);
              }}
              className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                !isSidebarExpanded ? "mx-auto" : ""
              }`}
              title={isSidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              <Pin
                className={`w-4 h-4 transition-transform ${
                  isSidebarPinned
                    ? "text-blue-500 rotate-45"
                    : "text-gray-400 rotate-0"
                }`}
              />
            </motion.button>
          </div>
        </div>

        {/* Scrollable Menu Area */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {sidebarMenuData.map((item) => renderMenuItem(item))}
        </div>
      </motion.aside>
    </div>
  );
};

export default Sidebar;