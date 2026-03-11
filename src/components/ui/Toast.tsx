import toast, { type ToastOptions } from "react-hot-toast";

// Re-export for convenience
export { toast };

// Export type if needed
export type { ToastOptions };

// Optional: Create custom helpers with your app's styling
export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      style: {
        background: "#10b981",
        color: "#fff",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#10b981",
      },
      ...options,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      style: {
        background: "#ef4444",
        color: "#fff",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#ef4444",
      },
      ...options,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    toast(message, {
      icon: "ℹ️",
      style: {
        background: "#3b82f6",
        color: "#fff",
      },
      ...options,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    toast(message, {
      icon: "⚠️",
      style: {
        background: "#f59e0b",
        color: "#fff",
      },
      ...options,
    });
  },

  // Custom position helper
  at: (
    position:
      | "top-left"
      | "top-center"
      | "top-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right",
  ) => {
    return {
      success: (message: string, options?: ToastOptions) => {
        toast.success(message, { position, ...options });
      },
      error: (message: string, options?: ToastOptions) => {
        toast.error(message, { position, ...options });
      },
      info: (message: string, options?: ToastOptions) => {
        toast(message, { position, icon: "ℹ️", ...options });
      },
      warning: (message: string, options?: ToastOptions) => {
        toast(message, { position, icon: "⚠️", ...options });
      },
    };
  },

  // Promise support for async operations
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions,
  ) => {
    return toast.promise(promise, messages, options);
  },

  // Dismiss all toasts
  dismiss: () => {
    toast.dismiss();
  },

  // Remove specific toast
  remove: (toastId: string) => {
    toast.dismiss(toastId);
  },
};

export default toast;
