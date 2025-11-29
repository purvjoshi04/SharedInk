"use client"

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'custom';
  isLoading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  isLoading,
  icon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = "rounded-lg p-2 relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-hand text-lg transition-all duration-200 disabled:opacity-70 cursor-pointer active:translate-y-[2px] active:shadow-none";

  const variants = {
    primary: "bg-primary text-white border-2 border-black dark:border-gray-600 shadow-hand dark:shadow-hand-dark hover:bg-primary-hover hover:shadow-hand-hover dark:hover:shadow-hand-hover-dark",
    outline: "bg-white dark:bg-transparent text-gray-900 dark:text-white border-2 border-black dark:border-gray-600 shadow-hand dark:shadow-hand-dark hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-hand-hover dark:hover:shadow-hand-hover-dark",
    ghost: "bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
    custom: ""
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading}
      {!isLoading && icon}
      <span>{children}</span>
    </button>
  );
}