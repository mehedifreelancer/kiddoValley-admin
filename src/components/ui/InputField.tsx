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
  isRequired?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  fullBorder?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
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
  fullBorder = false,
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

  // Determine border classes based on fullBorder prop
  const getBorderClasses = () => {
    if (fullBorder) {
      return `
        border rounded-lg px-3 py-2
        ${disabled 
          ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50" 
          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }
        transition-colors duration-200
      `;
    } else {
      // Bottom border only
      return `
        border-0 border-b px-0 py-2
        ${disabled
          ? "border-gray-200 dark:border-gray-700"
          : isFocused
            ? "border-blue-500 dark:border-blue-400"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
        }
      `;
    }
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
            w-full bg-transparent text-base
            focus:outline-none focus:ring-0 transition-all duration-200
            ${disabled ? "text-gray-400 dark:text-gray-600 cursor-not-allowed" : "text-gray-900 dark:text-white"}
            ${getBorderClasses()}
            ${inputClassName}
          `}
          style={fullBorder ? {} : { borderBottomWidth: '1px' }}
          {...props}
        />

        {/* Bottom border animation - only show for non-fullBorder and not disabled */}
        {!fullBorder && !disabled && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isFocused ? 1 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 right-0 h-px bg-blue-500 dark:bg-blue-400 origin-left"
          />
        )}
      </div>
    </div>
  );
};

export default InputField;