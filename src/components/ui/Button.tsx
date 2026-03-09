import React from "react";
import { motion } from "framer-motion";
import styles from "./Button.module.css";
import Loader from "./Loader";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg";

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
  // Combine classes
  const buttonClasses = [
    styles.btn,
    styles[`btn-${size}`],
    styles[`btn-${variant}`],
    fullWidth ? styles["btn-full"] : "",
    loading ? styles["btn-loading"] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Get loader color based on variant
  const getLoaderColor = () => {
    if (variant === "outline") return "gray";
    if (variant === "warning") return "warning";
    if (variant === "success") return "success";
    if (variant === "danger") return "danger";
    if (variant === "secondary") return "secondary";
    return "white"; // primary uses white loader
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
            size={size === "sm" ? "xs" : size === "lg" ? "sm" : "xs"}
            color={getLoaderColor()}
          />
        </span>
      )}

      <span
        className={`flex items-center justify-center ${loading ? "opacity-0" : "opacity-100"}`}
      >
        {icon && iconPosition === "left" && (
          <span className={styles["icon-left"]}>{icon}</span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className={styles["icon-right"]}>{icon}</span>
        )}
      </span>
    </motion.button>
  );
};

export default Button;
