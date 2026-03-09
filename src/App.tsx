import Sidebar from "./components/common/Sidebar";

function App() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Main Content Area
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your content goes here. The sidebar is pinned by default. Click the pin icon to toggle between pinned and unpinned states.
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Card {item}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Sample content for card {item}. This demonstrates the layout with the sidebar.
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;