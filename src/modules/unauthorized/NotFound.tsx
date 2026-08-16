import { motion } from "framer-motion";
import { ArrowLeft, FileSearch, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <FileSearch className="w-16 h-16 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          404
        </h1>

        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Page Not Found
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
