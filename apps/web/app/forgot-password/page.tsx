"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { AuthShell, Field } from "@/app/auth/auth-shell";
import axios from "axios";
import { handleAuthError } from "@/lib/auth-errors";

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState("");

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError("");
        if (!validate()) return;
        setLoading(true);

        try {
            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/forgot-password`, { email });
            setSent(true);
        } catch (error) {
            handleAuthError(error, setErrors, setApiError, {
                429: {
                    message: "Too many reset requests. Please try again later.",
                    toastTitle: "Too many attempts",
                    toastDescription: "Please wait before requesting another reset link.",
                },
            });
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <AuthShell
                eyebrow="Check your inbox"
                title={<>Reset link<br /><span className="text-white/50">sent</span></>}
                subtitle="If an account exists for that email, we've sent a link to reset your password."
                footer={
                    <>
                        Remembered it after all?{" "}
                        <Link href="/signin" className="text-white hover:underline underline-offset-4">
                            Back to sign in
                        </Link>
                    </>
                }
            >
                <div className="flex items-start gap-3 rounded-lg border border-white/15 bg-white/5 p-4">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-white/70 mt-0.5" />
                    <p className="text-sm text-white/70">
                        Sent to <span className="text-white">{email}</span>. The link expires in 1 hour.
                    </p>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            eyebrow="Reset your password"
            title={<>Forgot your<br /><span className="text-white/50">password?</span></>}
            subtitle="Enter the email associated with your account and we'll send you a reset link."
            footer={
                <>
                    Remembered it after all?{" "}
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
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="you@team.com"
                    icon={Mail}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: "" });
                        if (apiError) setApiError("");
                    }}
                    error={errors.email}
                    disabled={loading}
                />

                <Button type="submit" className="group w-full whitespace-nowrap" size="lg" isLoading={loading} disabled={loading}>
                    {loading ? "Sending..." : "Send reset link"}
                    {!loading && <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
                </Button>
            </form>
        </AuthShell>
    );
}