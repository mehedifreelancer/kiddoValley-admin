import React from "react";
import { Toaster } from "react-hot-toast";
import { useGlobal } from "../../context/GlobalContext";

const ToasterProvider: React.FC = () => {
  const { theme } = useGlobal(); // Use your global context
  const isDark = theme === "dark";

  // Watery color palette
  const colors = {
    success: {
      light: "rgba(16, 185, 129, 0.1)", // watery green
      dark: "rgba(16, 185, 129, 0.2)",
      border: "rgba(16, 185, 129, 0.3)",
      text: { light: "#047857", dark: "#10b981" },
    },
    error: {
      light: "rgba(239, 68, 68, 0.1)", // watery red
      dark: "rgba(239, 68, 68, 0.2)",
      border: "rgba(239, 68, 68, 0.3)",
      text: { light: "#b91c1c", dark: "#ef4444" },
    },
    warning: {
      light: "rgba(245, 158, 11, 0.1)", // watery yellow/orange
      dark: "rgba(245, 158, 11, 0.2)",
      border: "rgba(245, 158, 11, 0.3)",
      text: { light: "#b45309", dark: "#f59e0b" },
    },
    info: {
      light: "rgba(59, 130, 246, 0.1)", // watery blue
      dark: "rgba(59, 130, 246, 0.2)",
      border: "rgba(59, 130, 246, 0.3)",
      text: { light: "#1d4ed8", dark: "#3b82f6" },
    },
    default: {
      light: "#ffffff",
      dark: "#1f2937",
      text: { light: "#1f2937", dark: "#f3f4f6" },
    },
  };

  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 3000,
        // Default toast style
        style: {
          background: isDark ? colors.default.dark : colors.default.light,
          color: isDark ? colors.default.text.dark : colors.default.text.light,
          borderRadius: "0.75rem",
          padding: "1rem 1.25rem",
          fontSize: "0.875rem",
          fontWeight: "500",
          boxShadow: isDark
            ? "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)"
            : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          backdropFilter: "blur(8px)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid rgba(0, 0, 0, 0.05)",
        },

        // Success toast
        success: {
          duration: 3000,
          style: {
            background: isDark ? colors.success.dark : colors.success.light,
            color: isDark
              ? colors.success.text.dark
              : colors.success.text.light,
            border: `1px solid ${isDark ? colors.success.border : colors.success.light}`,
          },
          iconTheme: {
            primary: colors.success.text.dark,
            secondary: isDark ? colors.default.dark : colors.default.light,
          },
        },

        // Error toast
        error: {
          duration: 4000,
          style: {
            background: isDark ? colors.error.dark : colors.error.light,
            color: isDark ? colors.error.text.dark : colors.error.text.light,
            border: `1px solid ${isDark ? colors.error.border : colors.error.light}`,
          },
          iconTheme: {
            primary: colors.error.text.dark,
            secondary: isDark ? colors.default.dark : colors.default.light,
          },
        },

        // Loading toast (styled as info)
        loading: {
          duration: Infinity,
          style: {
            background: isDark ? colors.info.dark : colors.info.light,
            color: isDark ? colors.info.text.dark : colors.info.text.light,
            border: `1px solid ${isDark ? colors.info.border : colors.info.light}`,
          },
          iconTheme: {
            primary: colors.info.text.dark,
            secondary: isDark ? colors.default.dark : colors.default.light,
          },
        },

        // Custom empty toast
        blank: {
          style: {
            background: isDark ? colors.default.dark : colors.default.light,
            color: isDark
              ? colors.default.text.dark
              : colors.default.text.light,
          },
        },
      }}
    />
  );
};

export default ToasterProvider;
