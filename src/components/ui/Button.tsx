import React from "react";
import { motion } from "framer-motion";
import "../../assets/css/button.css";
import { Loader } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "outline"
  | "ghost";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = "left",
  className = "",
  disabled,
  ...props
}) => {
  const buttonClasses = [
    "btn",
    `btn-${size}`,
    `btn-${variant}`,
    fullWidth ? "btn-full" : "",
    loading ? "btn-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const getLoaderColor = (): string => {
    switch (variant) {
      case "outline":
      case "ghost":
        return "gray";
      case "warning":
        return "warning";
      case "success":
        return "success";
      case "danger":
        return "danger";
      case "secondary":
        return "secondary";
      case "info":
        return "info";
      default:
        return "white";
    }
  };

  const getLoaderSize = (): string => {
    switch (size) {
      case "xs":
        return "xs";
      case "sm":
        return "xs";
      case "md":
        return "sm";
      case "lg":
        return "sm";
      default:
        return "sm";
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader
            size={getLoaderSize() as any}
            color={getLoaderColor() as any}
          />
        </span>
      )}

      <span
        className={`flex items-center justify-center gap-2 ${loading ? "opacity-0" : "opacity-100"}`}
      >
        {icon && iconPosition === "left" && (
          <span className="icon-left">{icon}</span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className="icon-right">{icon}</span>
        )}
      </span>
    </motion.button>
  );
};

export default Button;
