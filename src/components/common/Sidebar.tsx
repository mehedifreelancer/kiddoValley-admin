// components/common/Sidebar.tsx
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Pin } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useGlobal } from "../../context/GlobalContext";
import { sidebarMenuData } from "../../data/SidebarMenuData";
import type { MenuItem } from "../../types/sidebar/sidebar.types";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarPinned, setSidebarPinned } = useGlobal();
  const { user, loading } = useAuth(); // ✅ ইউজার ও লোডিং স্টেট
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "web-settings",
  ]);

  // Fixed widths
  const EXPANDED_WIDTH = 220;
  const COLLAPSED_WIDTH = 72;

  useEffect(() => {
    console.log("Sidebar mounted");
    return () => console.log("Sidebar unmounted");
  }, []);

  // ✅ মেনু ফিল্টার করার ফাংশন (Recursive)
  const filterMenu = (items: MenuItem[]): MenuItem[] => {
    return items
      .map((item) => {
        // যদি item-এ roles না থাকে, সবাই দেখতে পাবে
        if (!item.roles) return item;

        // যদি ইউজার লগইন না থাকে বা রোল মেলে না, তাহলে বাদ
        if (!user || !item.roles.includes(user.role)) {
          // কিন্তু যদি item-এর children থাকে, সেগুলো চেক করি
          if (item.children) {
            const filteredChildren = filterMenu(item.children);
            if (filteredChildren.length > 0) {
              // যদি অন্তত একটা child থাকে, তাহলে parent-কে রাখি (কিন্তু নিজের roles ওভাররাইড করে)
              // তবে আমরা parent-কে শুধুমাত্র তখনই দেখাব যখন তার children visible থাকবে
              return { ...item, children: filteredChildren };
            }
          }
          return null; // বাদ
        }

        // যদি ইউজারের রোল মেলে, তাহলে children ফিল্টার করে দেখি
        if (item.children) {
          const filteredChildren = filterMenu(item.children);
          return { ...item, children: filteredChildren };
        }
        return item;
      })
      .filter((item) => item !== null) as MenuItem[];
  };

  // ✅ ফিল্টার করা মেনু
  const filteredMenu = loading ? [] : filterMenu(sidebarMenuData);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      toggleExpand(item.id);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const isActivePath = (item: MenuItem): boolean => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.children) {
      return item.children.some((child) => child.path === location.pathname);
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isSidebarExpanded = isSidebarPinned || isHovered;
    const isActive = isActivePath(item);

    const paddingLeft = level === 0 ? 16 : level * 12 + 16;

    return (
      <div key={item.id} className="w-full">
        <motion.div
          className={`flex items-center w-full py-3.5 cursor-pointer transition-colors duration-200 relative ${
            !isSidebarExpanded ? "justify-center" : ""
          } ${
            isActive
              ? "bg-sky-700/80 dark:bg-sky-700/70 text-white border-r-2 border-sky-500/50 dark:border-sky-500/50"
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
          <span className={isActive ? "text-white" : ""}>{item.icon}</span>

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

          {item.badge && isSidebarExpanded && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">
              {item.badge}
            </span>
          )}

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
    <>
      {!isSidebarPinned && isHovered && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsHovered(false)}
        />
      )}

      <motion.aside
        animate={{
          width: isSidebarExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        onMouseEnter={() => !isSidebarPinned && setIsHovered(true)}
        onMouseLeave={() => !isSidebarPinned && setIsHovered(false)}
        className={`h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg z-50 flex flex-col ${
          !isSidebarPinned ? "fixed left-0 top-0" : "relative"
        } scrollbar-hide`}
        style={{
          width: isSidebarExpanded
            ? `${EXPANDED_WIDTH}px`
            : `${COLLAPSED_WIDTH}px`,
        }}
      >
        <div className="flex-shrink-0 px-4 py-[1px] border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {isSidebarExpanded ? (
                <motion.div
                  key="logo-expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => navigate("/")}
                >
                  <img
                    height="10px"
                    width="100%"
                    src="/logo/logo.jpg"
                    alt="Logo"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="logo-collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex justify-center cursor-pointer"
                  onClick={() => navigate("/")}
                ></motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSidebarPinned(!isSidebarPinned);
                setIsHovered(false);
              }}
              className={`p-5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                !isSidebarExpanded ? "mx-auto" : ""
              }`}
              title={isSidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              <Pin
                className={`w-4 h-4 transition-transform ${
                  isSidebarPinned
                    ? "text-sky-700/80 dark:text-sky-700/70 rotate-45"
                    : "text-gray-400 rotate-0"
                }`}
              />
            </motion.button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-700" />
            </div>
          ) : filteredMenu.length > 0 ? (
            filteredMenu.map((item) => renderMenuItem(item))
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">
              No menu items available
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
