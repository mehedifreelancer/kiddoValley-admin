import { Outlet } from "react-router";
import Sidebar from "./components/common/Sidebar";
import Header from "./components/common/Header";
import { GlobalProvider, useGlobal } from "./context/GlobalContext";
import { motion } from "framer-motion";
import ToasterProvider from "./components/ui/ToasterProvider";

// Create a separate component that uses the context
function AppContent() {
  const { isSidebarPinned } = useGlobal();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        animate={{ paddingLeft: isSidebarPinned ? 4 : 75 }}
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