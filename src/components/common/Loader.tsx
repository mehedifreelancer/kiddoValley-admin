import React from 'react';

export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg';
export type LoaderColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'white' | 'gray';

interface LoaderProps {
  size?: LoaderSize;
  color?: LoaderColor;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  // Size mappings
  const sizeClasses = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-2'
  };

  // Color mappings
  const colorClasses = {
    primary: 'border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500',
    secondary: 'border-gray-200 border-t-gray-600 dark:border-gray-700 dark:border-t-gray-400',
    success: 'border-green-200 border-t-green-600 dark:border-green-900 dark:border-t-green-500',
    danger: 'border-red-200 border-t-red-600 dark:border-red-900 dark:border-t-red-500',
    warning: 'border-yellow-200 border-t-yellow-600 dark:border-yellow-900 dark:border-t-yellow-500',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300'
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full animate-spin ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="loading"
    />
  );
};

export default Loader;