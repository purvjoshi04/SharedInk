"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AuthPage } from '../components/AuthPage';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { MailIcon, LockIcon, GithubIcon, GoogleIcon, ArrowRightIcon } from '@repo/ui/icons';

export default function SignIn() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/signin`,
                {
                    username: formData.email,
                    password: formData.password
                }
            );

            const { token, userId, username, email } = response.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify({
                id: userId,
                username,
                email
            }));

            router.push("/");
        } catch (err: any) {
            setError(err.response?.data?.error || "Sign in failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthPage
            title="Welcome back"
            subtitle="Enter your credentials to access your workspace"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full" isLoading={isLoading}>
                        <GoogleIcon className="mr-2 h-4 w-4" />
                        Google
                    </Button>
                    <Button variant="outline" className="w-full" isLoading={isLoading}>
                        <GithubIcon className="mr-2 h-4 w-4" />
                        GitHub
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-900/50 text-red-200 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="name@example.com"
                        icon={<MailIcon className="h-4 w-4" />}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />

                    <div className="space-y-1">
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            icon={<LockIcon className="h-4 w-4" />}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <div className="flex justify-end">
                            <Link
                                href="#"
                                className="text-xs font-medium text-zinc-400 hover:text-white hover:underline transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <Button type="submit" fullWidth isLoading={isLoading} className="group" variant={'primary'}>
                        Sign In
                        <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <span className="text-zinc-400">Don&apos;t have an account? </span>
                    <Link
                        href="/signup"
                        className="font-bold text-white hover:underline underline-offset-4 decoration-zinc-600 hover:decoration-white transition-all"
                    >
                        Create an account
                    </Link>
                </div>
            </div>
        </AuthPage>
    );
}