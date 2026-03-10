import React, { useState } from "react";
import { motion } from "framer-motion";

export type InputType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "search"
  | "date";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  helperText,
  isRequired = false,
  type = "text",
  id,
  disabled = false,
  value,
  defaultValue,
  placeholder,
  onChange,
  onBlur,
  onFocus,
  className = "",
  containerClassName = "",
  labelClassName = "",
  inputClassName = "",
  errorClassName = "",
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value || !!defaultValue);

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    onChange?.(e);
  };

  return (
    <div className={`w-full ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
            disabled
              ? "text-gray-400 dark:text-gray-600"
              : error
                ? "text-red-600 dark:text-red-400"
                : "text-gray-700 dark:text-gray-300"
          } ${labelClassName}`}
        >
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        <input
          id={inputId}
          type={type}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            w-full bg-transparent border-0 border-b-1 px-0 py-2 text-base
            focus:outline-none focus:ring-0 transition-all duration-200
            ${
              disabled
                ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : error
                  ? "border-red-300 dark:border-red-800 text-gray-900 dark:text-white hover:border-red-400 dark:hover:border-red-700"
                  : "border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-600"
            }
            ${
              isFocused && !error && !disabled
                ? "border-blue-500 dark:border-blue-400"
                : ""
            }
            ${inputClassName}
          `}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...props}
        />

        {/* Bottom border animation */}
        {!disabled && !error && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isFocused ? 1 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400 origin-left"
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          id={`${inputId}-error`}
          className={`mt-1 text-sm text-red-600 dark:text-red-400 ${errorClassName}`}
        >
          {error}
        </motion.p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p
          id={`${inputId}-helper`}
          className={`mt-1 text-sm text-gray-500 dark:text-gray-400 ${errorClassName}`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default InputField;
