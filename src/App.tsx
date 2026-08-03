import { motion } from "framer-motion";
import { useEffect } from "react";
import { Outlet } from "react-router";
import Header from "./components/common/Header";
import Sidebar from "./components/common/Sidebar";
import ToasterProvider from "./components/ui/ToasterProvider";
import { GlobalProvider, useGlobal } from "./context/GlobalContext";
import { useTheme } from "./hooks/useTheme"; // Import useTheme

// Create a separate component that uses the context
function AppContent() {
  const { isSidebarPinned } = useGlobal();
  const { theme } = useTheme(); // Use the hook directly

  // Apply theme to html element whenever it changes
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
    <GlobalProvider>
      <AppContent />
    </GlobalProvider>
  );
}

export default App;
