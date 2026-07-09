"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { PenLine } from "lucide-react";

export function AuthShell({
    eyebrow,
    title,
    subtitle,
    children,
    footer,
}: {
    eyebrow: string;
    title: React.ReactNode;
    subtitle: string;
    children: React.ReactNode;
    footer: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen text-white overflow-x-hidden">
            <div
                aria-hidden
                className="fixed inset-0 -z-10"
                style={{
                    backgroundColor: "#000000",
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
                    backgroundSize: "26px 26px",
                }}
            />
            <div
                aria-hidden
                className="fixed inset-0 -z-10 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)",
                }}
            />

            <header className="fixed top-0 inset-x-0 z-50">
                <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white">
                        <span className="grid place-items-center h-8 w-8 rounded-md border border-white/30">
                            <PenLine className="h-4 w-4" />
                        </span>
                        <span className="font-semibold tracking-tight">SharedInk</span>
                    </Link>
                    <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
                        Back to home
                    </Link>
                </nav>
            </header>

            <main className="pt-28 pb-20 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mx-auto w-full max-w-md"
                >
                    <div className="text-xs uppercase tracking-[0.2em] text-white/40">{eyebrow}</div>
                    <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">{title}</h1>
                    <p className="mt-4 text-white/60 leading-relaxed">{subtitle}</p>

                    <div className="mt-10 rounded-2xl border border-white/15 bg-black p-8">{children}</div>

                    <p className="mt-8 text-center text-sm text-white/50">{footer}</p>
                </motion.div>
            </main>
        </div>
    );
}

export function Field({
    id,
    label,
    type,
    placeholder,
    icon: Icon,
    autoComplete,
    hint,
    value,
    onChange,
    error,
    disabled,
    rightElement,
}: {
    id: string;
    label: string;
    type: string;
    placeholder: string;
    icon: React.ComponentType<{ className?: string }>;
    autoComplete?: string;
    hint?: React.ReactNode;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    disabled?: boolean;
    rightElement?: React.ReactNode;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label htmlFor={id} className="text-sm text-white/80">{label}</label>
                {hint}
            </div>
            <div className="relative">
                <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full rounded-md border ${error ? "border-red-500/60" : "border-white/15"
                        } bg-black pl-10 ${rightElement ? "pr-10" : "pr-3"} py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/50 disabled:opacity-50`}
                />
                {rightElement}
            </div>
            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        </div>
    );
}

export function Divider() {
    return (
        <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
                <span className="bg-black px-3 text-xs uppercase tracking-[0.2em] text-white/40">or</span>
            </div>
        </div>
    );
}