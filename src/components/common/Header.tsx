import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Lock,
  Settings,
  Moon,
  Sun,
  Check,
  X,
  Info,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useGlobal } from "../../context/GlobalContext";

const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    user,
    logout,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useGlobal();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="rounded-sm sticky top-0 z-40 bg-white dark:bg-gray-800 ">
      {" "}
      <div className="flex items-center justify-end px-2 py-[4px]">
        <div className="flex items-center space-x-4">
          {/* Theme Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {theme === "light" ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-5 h-5 text-yellow-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-5 h-5 text-blue-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      Notifications
                    </h3>
                    <div className="flex space-x-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto scrollbar-hide">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                            !notification.read
                              ? "bg-blue-50/50 dark:bg-blue-900/10"
                              : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                  {notification.title}
                                </p>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(notification.time)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {notification.message}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                removeNotification(notification.id)
                              }
                              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="mt-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Mark as read
                            </button>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-1 pr-2 rounded-sm  "
            >
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-8 h-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Handle profile
                      }}
                      className="cursor-pointer flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Handle change password
                      }}
                      className="cursor-pointer flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Change Password</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Handle settings
                      }}
                      className="cursor-pointer flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="cursor-pointer flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
