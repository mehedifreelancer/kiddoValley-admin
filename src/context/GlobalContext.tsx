import React, { createContext, useState, useContext, useEffect } from "react";

// Types
export type Theme = "light" | "dark";

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface GlobalContextType {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "time" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // User
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => void;

  // App State
  isSidebarPinned: boolean;
  setSidebarPinned: (pinned: boolean) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Sample data
const sampleNotifications: Notification[] = [
  {
    id: "1",
    title: "Welcome!",
    message: "Welcome to your new dashboard",
    time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    type: "info",
  },
  {
    id: "2",
    title: "Update Available",
    message: "A new version is available",
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    type: "warning",
  },
  {
    id: "3",
    title: "Task Completed",
    message: "Your task has been completed successfully",
    time: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: true,
    type: "success",
  },
];

const sampleUser: User = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar:
    "https://ui-avatars.com/api/?name=John+Doe&background=6366f1&color=fff",
  role: "Administrator",
};

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Theme state with localStorage
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Notifications state with localStorage
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : sampleNotifications;
  });

  // User state with localStorage
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : sampleUser;
  });

  // Sidebar state with localStorage
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    const saved = localStorage.getItem("sidebarPinned");
    return saved ? JSON.parse(saved) : true;
  });

  // Effects to save to localStorage
  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("sidebarPinned", JSON.stringify(isSidebarPinned));
  }, [isSidebarPinned]);

  // Theme functions
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Notification functions
  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (
    notification: Omit<Notification, "id" | "time" | "read">,
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // User functions
  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <GlobalContext.Provider
      value={{
        // Theme
        theme,
        setTheme,
        toggleTheme,

        // Notifications
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,

        // User
        user,
        setUser,
        isAuthenticated,
        logout,

        // App State
        isSidebarPinned,
        setSidebarPinned: setIsSidebarPinned,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
};
