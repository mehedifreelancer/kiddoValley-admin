import Sidebar from "./components/common/Sidebar";


function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="p-8" style={{ marginLeft: 280 }}>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Main Content Area
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Sidebar is always fixed. Content has permanent 280px margin.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Card {item}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Content card {item}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
