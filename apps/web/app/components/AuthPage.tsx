import React from 'react';
import { PencilIcon } from '@repo/ui/icons';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export const AuthPage: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Form */}
            <div className="flex w-full flex-col items-center justify-center bg-zinc-950 px-4 sm:px-12 lg:w-1/2 lg:px-16 xl:px-24">
                <div className="w-full max-w-[440px] space-y-8">
                    {/* Mobile Logo */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-950 shadow-lg shadow-white/10">
                            <PencilIcon className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold text-white">SketchFlow</span>
                    </div>

                    <div className="space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            {title}
                        </h1>
                        <p className="text-zinc-400">
                            {subtitle}
                        </p>
                    </div>

                    {children}

                    <div className="pt-6 text-center text-xs text-zinc-600">
                        <p>&copy; 2024 SketchFlow Inc. All rights reserved.</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Hero/Decorative */}
            <div className="relative hidden w-0 flex-1 lg:block">
                <div className="absolute inset-0 h-full w-full bg-zinc-900">
                    {/* Abstract background pattern */}
                    <div className="absolute inset-0 opacity-[0.15]" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>

                    <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 bg-linear-to-r from-zinc-950/50 to-transparent"></div>
                </div>

                <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-950 shadow-xl shadow-white/10">
                            <PencilIcon className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold tracking-wide text-zinc-100">SketchFlow</span>
                    </div>

                    <div className="space-y-6 max-w-md">
                        <blockquote className="space-y-2">
                            <p className="text-lg font-medium leading-relaxed text-zinc-200">
                                &quot;The best tool for quick diagrams and wireframes. It feels just like drawing on paper but with the power of infinite canvas.&quot;
                            </p>
                            <footer className="text-sm font-bold text-white">
                                — Sofia Davis, Product Designer
                            </footer>
                        </blockquote>

                        {/* Decorative visual element */}
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-md shadow-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center">
                                    <div className="h-4 w-4 rounded-full bg-zinc-950"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-24 rounded-full bg-zinc-700"></div>
                                    <div className="h-2 w-16 rounded-full bg-zinc-800"></div>
                                </div>
                            </div>
                            <div className="h-24 rounded-xl bg-zinc-950 border border-zinc-800 w-full flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-size-[250%_250%] animate-[shimmer_3s_infinite]"></div>
                                <span className="text-xs text-zinc-400 font-mono relative z-10">Collaborative Canvas Preview</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
