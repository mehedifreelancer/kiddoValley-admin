import Sidebar from "./components/common/Sidebar";
import Header from "./components/common/Header";
import { GlobalProvider, useGlobal } from "./context/GlobalContext";
import Components from "./components/ui/Components";
import { motion } from "framer-motion";

// Create a separate component that uses the context
function AppContent() {
  const { isSidebarPinned } = useGlobal();
  console.log("Sidebar pinned:", isSidebarPinned); // Should now log true/false

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        animate={{ paddingLeft: isSidebarPinned ? 0 : 56 }} // Fixed values: 240px for expanded, 56px for collapsed
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4">
          <Components />
        </main>
      </motion.div>
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