'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button'
import { AuthLayout } from '@/components/AuthLayout';

export default function SigninPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push('/dashboard');
        }, 1500);
    };

    if (!mounted) {
        return null;
    }

    return (
        <AuthLayout
            title="Welcome Back!"
            subtitle="Sign in to your whiteboard workspace."
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                />

                <div className="flex flex-col gap-1.5">
                    <Input
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        error={errors.password}
                    />
                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-sm font-hand text-primary hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <Button type="submit" isLoading={loading} className="mt-2" icon={<ArrowRight className="w-5 h-5" />}>
                    Sign In
                </Button>

                <div className="flex items-center">
                    <div className="flex-1 border-t border-gray-700"></div>
                    <span className="px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Or continue with
                    </span>
                    <div className="flex-1 border-t border-gray-700"></div>
                </div>

                <Button
                    type="button"
                    onClick={() => console.log('Google login')}
                    icon={
                        <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    }
                >
                    Google
                </Button>

                <p className="text-center font-sans text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="font-hand font-bold text-primary hover:underline text-lg">
                        Sign up
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}