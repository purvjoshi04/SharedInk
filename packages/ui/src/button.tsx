"use client";

import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary: "bg-white text-zinc-950 hover:bg-zinc-200 focus-visible:ring-white shadow-[0_0_20px_rgba(255,255,255,0.1)]",
    secondary: "bg-zinc-800 text-white hover:bg-zinc-700 focus-visible:ring-zinc-700",
    outline: "border border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-300 hover:text-white focus-visible:ring-zinc-700",
    ghost: "bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white"
  };

  const sizes = "h-11 px-8 py-2";
  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes} ${width} ${className}`} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
};