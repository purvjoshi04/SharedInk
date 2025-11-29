'use client';

import { PenTool } from 'lucide-react';
import { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({
    children,
    title,
    subtitle,
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden transition-colors duration-300">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-primary p-3 rounded-xl border-2 border-black dark:border-gray-600 shadow-hand dark:shadow-hand-dark mb-4 transform -rotate-3 transition-all">
                        <PenTool className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="font-hand text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">{title}</h1>
                    <p className="font-sans text-gray-600 dark:text-gray-400 text-center transition-colors">{subtitle}</p>
                </div>
                <div className="bg-[#1b1b1b] p-10 rounded-2xl border border-[#3a3a3a] shadow-[0_0_30px_rgba(0,0,0,0.4)] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 pointer-events-none">
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            <path d="M10,10 Q50,50 90,10" className="stroke-black dark:stroke-white" fill="none" strokeWidth="2" />
                            <path d="M10,20 Q50,60 90,20" className="stroke-black dark:stroke-white" fill="none" strokeWidth="2" />
                            <path d="M10,30 Q50,70 90,30" className="stroke-black dark:stroke-white" fill="none" strokeWidth="2" />
                        </svg>
                    </div>
                    {children}
                </div>

                <div className="mt-4 text-center">
                    <p className="font-hand text-gray-500 text-sm">
                        © {new Date().getFullYear()} SharedInk.
                    </p>
                </div>
            </div>
        </div>
    );
}