"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@repo/ui/button";
import { AuthShell, Field } from "@/app/auth/auth-shell";
import axios from "axios";
import { toast } from "sonner";
import { handleAuthError } from "@/lib/auth-errors";
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordForm />
        </Suspense>
    );
}
function ResetPasswordForm() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ password: "", confirm: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 8) newErrors.password = "Must be at least 8 characters";
        if (formData.confirm !== formData.password) newErrors.confirm = "Passwords don't match";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError("");

        if (!token) {
            setApiError("This reset link is invalid or has expired.");
            return;
        }
        if (!validate()) return;

        setLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/reset-password`, {
                token,
                password: formData.password,
            });
            toast.success("Password reset!", { description: "You can now sign in with your new password.", duration: 2000 });
            setTimeout(() => router.push("/signin"), 1500);
        } catch (error) {
            setLoading(false);
            handleAuthError(error, setErrors, setApiError, {
                400: {
                    message: "This reset link is invalid or has expired.",
                    toastTitle: "Link expired",
                    toastDescription: "Please request a new password reset link.",
                },
            });
        }
    };

    if (!token) {
        return (
            <AuthShell
                eyebrow="Reset your password"
                title={<>Invalid<br /><span className="text-white/50">reset link</span></>}
                subtitle="This link is missing or malformed. Request a new one to continue."
                footer={
                    <Link href="/forgot-password" className="text-white hover:underline underline-offset-4">
                        Request a new link
                    </Link>
                }
            >
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                    <p className="text-sm text-red-400">No reset token was found in the URL.</p>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            eyebrow="Almost there"
            title={<>Set a new<br /><span className="text-white/50">password</span></>}
            subtitle="Choose a strong password you haven't used before."
            footer={
                <>
                    Changed your mind?{" "}
                    <Link href="/signin" className="text-white hover:underline underline-offset-4">
                        Back to sign in
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
                    id="password"
                    label="New password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    icon={Lock}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: "" });
                        if (apiError) setApiError("");
                    }}
                    error={errors.password}
                    disabled={loading}
                    rightElement={
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                            tabIndex={-1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    }
                />

                <Field
                    id="confirm"
                    label="Confirm password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    icon={Lock}
                    autoComplete="new-password"
                    value={formData.confirm}
                    onChange={(e) => {
                        setFormData({ ...formData, confirm: e.target.value });
                        if (errors.confirm) setErrors({ ...errors, confirm: "" });
                        if (apiError) setApiError("");
                    }}
                    error={errors.confirm}
                    disabled={loading}
                />

                <Button type="submit" className="group w-full whitespace-nowrap" size="lg" isLoading={loading} disabled={loading}>
                    {loading ? "Resetting..." : "Reset password"}
                    {!loading && <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
                </Button>
            </form>
        </AuthShell>
    );
}