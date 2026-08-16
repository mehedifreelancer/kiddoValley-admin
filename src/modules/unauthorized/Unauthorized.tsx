import { motion } from "framer-motion";
import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <ShieldAlert className="w-16 h-16 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have permission to access this page. Please contact your
          administrator if you believe this is a mistake.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

          <Button
            onClick={() => navigate("/")}
            variant="primary"
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </div>

        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          If you think this is an error, please contact support.
        </p>
      </motion.div>
    </div>
  );
};

export default Unauthorized;
