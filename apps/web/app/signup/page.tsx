"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@repo/ui/button";
import { AuthShell, Field, Divider } from "@/app/auth/auth-shell";
import axios from "axios";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { handleAuthError } from "@/lib/auth-errors";

function GoogleIcon() {
    return (
        <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

function SignUpPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const isAnyLoading = loading || googleLoading;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
        if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGoogleSignUp = async () => {
        try {
            setGoogleLoading(true);
            setApiError("");
            const redirectTarget = searchParams.get("redirect");
            const callbackUrl = redirectTarget
                ? `/auth/callback?redirect=${encodeURIComponent(redirectTarget)}`
                : "/auth/callback";
            await signIn("google", { callbackUrl });
        } catch (error) {
            console.error("Google sign-up error:", error);
            toast.error("Authentication error", { description: "Unable to sign up with Google." });
            setApiError("Unable to sign up with Google. Please try again.");
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError("");
        if (!validate()) return;
        setLoading(true);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/signup`, {
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            const { token, roomId } = response.data;
            localStorage.setItem("token", token);

            const redirectTarget = searchParams.get("redirect");

            toast.success("Signup successful!", { description: "Redirecting to your canvas...", duration: 1500 });
            setTimeout(() => router.push(redirectTarget || `/canvas/${roomId}`), 1500);
        } catch (error) {
            setLoading(false);
            handleAuthError(error, setErrors, setApiError, {
                409: {
                    message: "An account with this email already exists.",
                    toastTitle: "Account exists",
                    toastDescription: "Please sign in instead.",
                },
            });
        }
    };

    return (
        <AuthShell
            eyebrow="Get started"
            title={<>Create your<br /><span className="text-white/50">SharedInk account</span></>}
            subtitle="Free to start. No credit card. Invite your team the moment you're in."
            footer={
                <>
                    Already have an account?{" "}
                    <Link
                        href={searchParams.get("redirect") ? `/signin?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : "/signin"}
                        className="text-white hover:underline underline-offset-4"
                    >
                        Sign in
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {apiError && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                        <p className="text-sm text-red-400">{apiError}</p>
                    </div>
                )}

                <Field
                    id="name"
                    label="Full name"
                    type="text"
                    placeholder="Ada Lovelace"
                    icon={User}
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: "" });
                        if (apiError) setApiError("");
                    }}
                    error={errors.name}
                    disabled={isAnyLoading}
                />

                <Field
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="you@team.com"
                    icon={Mail}
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: "" });
                        if (apiError) setApiError("");
                    }}
                    error={errors.email}
                    disabled={isAnyLoading}
                />

                <Field
                    id="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    icon={Lock}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: "" });
                        if (apiError) setApiError("");
                    }}
                    error={errors.password}
                    disabled={isAnyLoading}
                    rightElement={
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isAnyLoading}
                            tabIndex={-1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    }
                />

                <Field
                    id="confirmPassword"
                    label="Confirm password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    icon={Lock}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                        if (apiError) setApiError("");
                    }}
                    error={errors.confirmPassword}
                    disabled={isAnyLoading}
                    rightElement={
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isAnyLoading}
                            tabIndex={-1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    }
                />

                <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        id="terms"
                        required
                        disabled={isAnyLoading}
                        className="mt-1 h-4 w-4 rounded border-white/30 bg-black text-white focus:ring-white/40 disabled:opacity-50"
                    />
                    <label htmlFor="terms" className="text-xs text-white/50 leading-relaxed">
                        I agree to the{" "}
                        <a href="#" className="text-white/70 hover:text-white transition-colors">Terms of Service</a>{" "}
                        and{" "}
                        <a href="#" className="text-white/70 hover:text-white transition-colors">Privacy Policy</a>.
                    </label>
                </div>

                <Button type="submit" size="lg" className="group w-full whitespace-nowrap" isLoading={loading} disabled={isAnyLoading}>
                    {loading ? "Creating account..." : "Create account"}
                    {!loading && <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
                </Button>

                <Divider />

                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full border-white/20 bg-transparent text-white hover:bg-white/5 hover:text-white"
                    onClick={handleGoogleSignUp}
                    isLoading={googleLoading}
                    disabled={isAnyLoading}
                >
                    {!googleLoading && <GoogleIcon />}
                    {googleLoading ? "Signing up..." : "Sign up with Google"}
                </Button>
            </form>
        </AuthShell>
    );
}

export default function SignUpPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-neutral-950" />}>
            <SignUpPageInner />
        </Suspense>
    );
}