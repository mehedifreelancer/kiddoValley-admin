import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  ChevronDown,
  Settings,
  Users,
  FileText,
  Layout,
  Star,
  Calendar,
  Mail,
  MessageSquare,
  Database,
  Lock,
  BarChart3,
  Circle,
  UserCircle,
  Shield,
  Edit3,
  Eye,
  Image,
  Video,
  Folder,
  Inbox,
  Tag,
  Pin,
  CheckSquare,
} from "lucide-react";
import { useGlobal } from "../../context/GlobalContext"; // Add this import

// Define types for our menu items
interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const Sidebar: React.FC = () => {
  // Replace local isPinned with global state
  const { isSidebarPinned, setSidebarPinned } = useGlobal();
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<string>("dashboard");

  // Menu data structure with 3 levels using Lucide icons
  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <Home className="w-5 h-5" />,
      children: [
        {
          id: "analytics",
          label: "Analytics",
          icon: <BarChart3 className="w-5 h-5" />,
          children: [
            {
              id: "reports",
              label: "Reports",
              icon: <FileText className="w-5 h-5" />,
            },
            {
              id: "statistics",
              label: "Statistics",
              icon: <Layout className="w-5 h-5" />,
            },
          ],
        },
        {
          id: "projects",
          label: "Projects",
          icon: <Database className="w-5 h-5" />,
          children: [
            {
              id: "active",
              label: "Active",
              icon: <Star className="w-5 h-5" />,
            },
            {
              id: "archived",
              label: "Archived",
              icon: <Lock className="w-5 h-5" />,
            },
          ],
        },
      ],
    },
    {
      id: "users",
      label: "User Management",
      icon: <Users className="w-5 h-5" />,
      children: [
        {
          id: "user-list",
          label: "Users",
          icon: <UserCircle className="w-5 h-5" />,
          children: [
            {
              id: "active-users",
              label: "Active",
              icon: <Circle className="w-5 h-5" />,
            },
            {
              id: "pending-users",
              label: "Pending",
              icon: <Circle className="w-5 h-5" />,
            },
            {
              id: "blocked-users",
              label: "Blocked",
              icon: <Circle className="w-5 h-5" />,
            },
          ],
        },
        {
          id: "roles",
          label: "Roles & Permissions",
          icon: <Shield className="w-5 h-5" />,
          children: [
            {
              id: "admin",
              label: "Admin",
              icon: <Circle className="w-5 h-5" />,
            },
            {
              id: "editor",
              label: "Editor",
              icon: <Edit3 className="w-5 h-5" />,
            },
            {
              id: "viewer",
              label: "Viewer",
              icon: <Eye className="w-5 h-5" />,
            },
          ],
        },
      ],
    },
    {
      id: "content",
      label: "Content",
      icon: <FileText className="w-5 h-5" />,
      children: [
        {
          id: "posts",
          label: "Posts",
          icon: <FileText className="w-5 h-5" />,
          children: [
            {
              id: "all-posts",
              label: "All Posts",
              icon: <Circle className="w-5 h-5" />,
            },
            {
              id: "categories",
              label: "Categories",
              icon: <Tag className="w-5 h-5" />,
            },
            { id: "tags", label: "Tags", icon: <Tag className="w-5 h-5" /> },
          ],
        },
        {
          id: "media",
          label: "Media",
          icon: <Image className="w-5 h-5" />,
          children: [
            {
              id: "images",
              label: "Images",
              icon: <Image className="w-5 h-5" />,
            },
            {
              id: "videos",
              label: "Videos",
              icon: <Video className="w-5 h-5" />,
            },
            {
              id: "files",
              label: "Files",
              icon: <Folder className="w-5 h-5" />,
            },
          ],
        },
      ],
    },
    {
      id: "communication",
      label: "Communication",
      icon: <Mail className="w-5 h-5" />,
      children: [
        {
          id: "messages",
          label: "Messages",
          icon: <MessageSquare className="w-5 h-5" />,
          children: [
            {
              id: "inbox",
              label: "Inbox",
              icon: <Inbox className="w-5 h-5" />,
            },
            { id: "sent", label: "Sent", icon: <Mail className="w-5 h-5" /> },
            {
              id: "drafts",
              label: "Drafts",
              icon: <FileText className="w-5 h-5" />,
            },
          ],
        },
        {
          id: "calendar",
          label: "Calendar",
          icon: <Calendar className="w-5 h-5" />,
          children: [
            {
              id: "events",
              label: "Events",
              icon: <Star className="w-5 h-5" />,
            },
            {
              id: "meetings",
              label: "Meetings",
              icon: <Users className="w-5 h-5" />,
            },
            {
              id: "tasks",
              label: "Tasks",
              icon: <CheckSquare className="w-5 h-5" />,
            },
          ],
        },
      ],
    },
  ];

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleItemClick = (itemId: string, hasChildren: boolean) => {
    if (hasChildren) {
      toggleExpand(itemId);
    } else {
      setActiveItem(itemId);
      console.log("Navigating to:", itemId);
    }
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isSidebarExpanded = isSidebarPinned || isHovered;
    const isActive = activeItem === item.id;

    // Adjusted padding for better alignment
    const paddingLeft = level * 16 + (level === 0 ? 16 : 24);

    return (
      <div key={item.id} className="w-full">
        <motion.div
          className={`flex items-center w-full px-3 py-2.5 cursor-pointer transition-colors duration-200 ${
            !isSidebarExpanded ? "justify-center" : ""
          } ${
            isActive
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          style={{
            paddingLeft: isSidebarExpanded ? `${paddingLeft}px` : "12px",
            paddingRight: isSidebarExpanded ? "12px" : "12px",
          }}
          onClick={() => handleItemClick(item.id, hasChildren)}
          whileHover={{ x: isSidebarExpanded ? 4 : 0 }}
          whileTap={{ scale: 0.98 }}
        >
          <span
            className={
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-300"
            }
          >
            {item.icon}
          </span>

          <AnimatePresence mode="wait">
            {isSidebarExpanded && (
              <motion.span
                key={`label-${item.id}`}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className={`ml-3 text-sm font-medium whitespace-nowrap overflow-hidden ${
                  isActive
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {hasChildren && isSidebarExpanded && (
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className={`ml-auto ${
                isActive ? "text-blue-500" : "text-gray-400"
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          )}
        </motion.div>

        {hasChildren && (
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out`}
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
      {/* Overlay for unpinned state */}
      {!isSidebarPinned && isHovered && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsHovered(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        animate={{ width: isSidebarExpanded ? 240 : 56 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        onMouseEnter={() => !isSidebarPinned && setIsHovered(true)}
        onMouseLeave={() => !isSidebarPinned && setIsHovered(false)}
        className={`h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden ${
          !isSidebarPinned ? "fixed left-0 top-0 z-50" : ""
        } scrollbar-hide`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-200 dark:border-gray-800">
          <AnimatePresence mode="wait">
            {isSidebarExpanded && (
              <motion.h2
                key="sidebar-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-lg font-semibold text-gray-800 dark:text-white whitespace-nowrap"
              >
                Navigation
              </motion.h2>
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
              className={`w-5 h-5 transition-transform ${
                isSidebarPinned
                  ? "text-blue-500 rotate-45"
                  : "text-gray-400 rotate-0"
              }`}
            />
          </motion.button>
        </div>

        {/* Menu Items */}
        <div className="py-3 overflow-y-auto h-[calc(100vh-73px)] scrollbar-hide">
          {menuItems.map((item) => renderMenuItem(item))}
        </div>

        {/* Footer */}
    
      </motion.div>
    </div>
  );
};

export default Sidebar;
