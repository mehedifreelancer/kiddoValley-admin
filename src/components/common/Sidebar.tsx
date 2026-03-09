import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  CheckSquare
} from 'lucide-react';

// Define types for our menu items
interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const Sidebar: React.FC = () => {
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Determine if sidebar should be expanded
  const isExpanded = isPinned || isHovered;

  // Menu data structure with 3 levels using Lucide icons
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      children: [
        {
          id: 'analytics',
          label: 'Analytics',
          icon: <BarChart3 className="w-5 h-5" />,
          children: [
            { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
            { id: 'statistics', label: 'Statistics', icon: <Layout className="w-5 h-5" /> }
          ]
        },
        {
          id: 'projects',
          label: 'Projects',
          icon: <Database className="w-5 h-5" />,
          children: [
            { id: 'active', label: 'Active', icon: <Star className="w-5 h-5" /> },
            { id: 'archived', label: 'Archived', icon: <Lock className="w-5 h-5" /> }
          ]
        }
      ]
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <Users className="w-5 h-5" />,
      children: [
        {
          id: 'user-list',
          label: 'Users',
          icon: <UserCircle className="w-5 h-5" />,
          children: [
            { id: 'active-users', label: 'Active', icon: <Circle className="w-5 h-5" /> },
            { id: 'pending-users', label: 'Pending', icon: <Circle className="w-5 h-5" /> },
            { id: 'blocked-users', label: 'Blocked', icon: <Circle className="w-5 h-5" /> }
          ]
        },
        {
          id: 'roles',
          label: 'Roles & Permissions',
          icon: <Shield className="w-5 h-5" />,
          children: [
            { id: 'admin', label: 'Admin', icon: <Circle className="w-5 h-5" /> },
            { id: 'editor', label: 'Editor', icon: <Edit3 className="w-5 h-5" /> },
            { id: 'viewer', label: 'Viewer', icon: <Eye className="w-5 h-5" /> }
          ]
        }
      ]
    },
    {
      id: 'content',
      label: 'Content',
      icon: <FileText className="w-5 h-5" />,
      children: [
        {
          id: 'posts',
          label: 'Posts',
          icon: <FileText className="w-5 h-5" />,
          children: [
            { id: 'all-posts', label: 'All Posts', icon: <Circle className="w-5 h-5" /> },
            { id: 'categories', label: 'Categories', icon: <Tag className="w-5 h-5" /> },
            { id: 'tags', label: 'Tags', icon: <Tag className="w-5 h-5" /> }
          ]
        },
        {
          id: 'media',
          label: 'Media',
          icon: <Image className="w-5 h-5" />,
          children: [
            { id: 'images', label: 'Images', icon: <Image className="w-5 h-5" /> },
            { id: 'videos', label: 'Videos', icon: <Video className="w-5 h-5" /> },
            { id: 'files', label: 'Files', icon: <Folder className="w-5 h-5" /> }
          ]
        }
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: <Mail className="w-5 h-5" />,
      children: [
        {
          id: 'messages',
          label: 'Messages',
          icon: <MessageSquare className="w-5 h-5" />,
          children: [
            { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-5 h-5" /> },
            { id: 'sent', label: 'Sent', icon: <Mail className="w-5 h-5" /> },
            { id: 'drafts', label: 'Drafts', icon: <FileText className="w-5 h-5" /> }
          ]
        },
        {
          id: 'calendar',
          label: 'Calendar',
          icon: <Calendar className="w-5 h-5" />,
          children: [
            { id: 'events', label: 'Events', icon: <Star className="w-5 h-5" /> },
            { id: 'meetings', label: 'Meetings', icon: <Users className="w-5 h-5" /> },
            { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> }
          ]
        }
      ]
    }
  ];

  const toggleExpand = (itemId: string) => {
    if (!isExpanded) return; // Don't expand when collapsed
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const paddingLeft = isExpanded ? level * 24 + (level === 0 ? 16 : 32) : 16;

    // Don't render children if sidebar is collapsed and not hovered
    if (!isExpanded && level > 0) return null;

    return (
      <div key={item.id} className="w-full">
        <motion.div
          className={`flex items-center w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-lg transition-colors duration-200 ${!isExpanded && level === 0 ? 'justify-center' : ''}`}
          style={{ paddingLeft: isExpanded ? `${paddingLeft}px` : '16px' }}
          onClick={() => hasChildren && toggleExpand(item.id)}
          whileHover={{ x: isExpanded ? 4 : 0 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-gray-600 dark:text-gray-300">
            {item.icon}
          </span>
          
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.span
                key={`label-${item.id}`}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {hasChildren && isExpanded && (
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-auto text-gray-400"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          )}
        </motion.div>

        <AnimatePresence initial={false}>
          {hasChildren && expandedItems.includes(item.id) && isExpanded && (
            <motion.div
              key={`children-${item.id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ width: isExpanded ? 280 : 80 }}
      animate={{ width: isExpanded ? 280 : 80 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      onMouseEnter={() => !isPinned && setIsHovered(true)}
      onMouseLeave={() => !isPinned && setIsHovered(false)}
      className="h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg relative overflow-hidden"
    >
      {/* Header with Pin Button */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.h2
              key="sidebar-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-semibold text-gray-800 dark:text-white"
            >
              Navigation
            </motion.h2>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setIsPinned(!isPinned);
            setIsHovered(false); // Reset hover state when pinning/unpinning
          }}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${!isExpanded ? 'mx-auto' : ''}`}
          title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
        >
          <Pin 
            className={`w-5 h-5 transition-transform ${
              isPinned ? 'text-blue-500 rotate-45' : 'text-gray-400 rotate-0'
            }`} 
          />
        </motion.button>
      </div>

      {/* Menu Items */}
      <div className="py-4 overflow-y-auto h-[calc(100vh-73px)]">
        {menuItems.map(item => renderMenuItem(item))}
      </div>

      {/* Footer with Settings */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <motion.div
          className={`flex items-center ${!isExpanded ? 'justify-center' : 'space-x-3'}`}
          whileHover={{ x: isExpanded ? 4 : 0 }}
        >
          <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.span
                key="settings-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Sidebar;