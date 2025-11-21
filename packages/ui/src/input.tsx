import React, { InputHTMLAttributes, useState, forwardRef } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, type = 'text', className = '', id, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
        
        const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

        return (
            <div className="w-full space-y-1">
                <label 
                    htmlFor={inputId}
                    className="text-sm font-medium text-zinc-300 ml-1"
                >
                    {label}
                </label>
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        type={inputType}
                        className={`
                            w-full rounded-xl border bg-zinc-900 px-3 py-2.5 text-sm transition-all 
                            text-zinc-100 placeholder:text-zinc-600
                            focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-0
                            disabled:cursor-not-allowed disabled:opacity-50
                            ${icon ? 'pl-10' : ''}
                            ${isPassword ? 'pr-10' : ''}
                            ${error
                                ? 'border-red-900/50 focus:border-red-500 focus:ring-red-900/30'
                                : 'border-zinc-800 hover:border-zinc-700 focus:border-white focus:ring-white/20'}
                            ${className}
                        `}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                    )}
                </div>
                {error && <p className="text-xs text-red-400 ml-1">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';