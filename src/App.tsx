import { motion } from "framer-motion";
import { useEffect } from "react";
import { Outlet } from "react-router";
import Header from "./components/common/Header";
import Sidebar from "./components/common/Sidebar";
import ToasterProvider from "./components/ui/ToasterProvider";
import { AuthProvider } from "./context/AuthContext";
import { GlobalProvider, useGlobal } from "./context/GlobalContext";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"; // 👈 add
import { useTheme } from "./hooks/useTheme";
import { APP_SHORTCUTS } from "./modules/shortcuts";

function AppContent() {
  const { isSidebarPinned } = useGlobal();
  const { theme } = useTheme();

  useKeyboardShortcuts(APP_SHORTCUTS); // 👈 add

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        animate={{ paddingLeft: isSidebarPinned ? 6 : 76 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-hide dark:bg-gray-900">
          <Outlet />
        </main>
      </motion.div>
      <ToasterProvider />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <GlobalProvider>
        <AppContent />
      </GlobalProvider>
    </AuthProvider>
  );
}

export default App;
