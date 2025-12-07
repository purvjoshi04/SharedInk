'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button'
import { AuthLayout } from '@/components/AuthLayout';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

interface ApiError {
    message?: string;
    errors?: Record<string, string[]>;
}

export default function SigninPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);

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
        setApiError('');

        if (!validate()) return;

        setLoading(true);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/signin`,
                {
                    email: formData.email,
                    password: formData.password
                }
            );

            const { token, roomId } = response.data;
            localStorage.setItem('token', token);

            toast.success('Login successful!', {
                description: 'Redirecting to your dashboard...',
                duration: 1500,
            });

            setTimeout(() => {
                router.push(`/canvas/${roomId}`);
            }, 1500);

        } catch (error) {
            setLoading(false);

            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<ApiError>;

                if (axiosError.response) {
                    const status = axiosError.response.status;
                    const data = axiosError.response.data;

                    switch (status) {
                        case 400:
                            if (data?.errors) {
                                const newErrors: Record<string, string> = {};
                                Object.entries(data.errors).forEach(([key, messages]) => {
                                    newErrors[key] = messages[0];
                                });
                                setErrors(newErrors);
                                toast.error('Validation failed', {
                                    description: 'Please check your input.'
                                });
                            } else {
                                setApiError(data?.message || 'Invalid request. Please check your input.');
                                toast.error('Invalid request', {
                                    description: 'Please check your input and try again.'
                                });
                            }
                            break;

                        case 401:
                            setApiError('Invalid email or password. Please try again.');
                            toast.error('Login failed', {
                                description: 'Invalid email or password.'
                            });
                            break;

                        case 404:
                            setApiError('Account not found. Please sign up first.');
                            toast.error('Account not found', {
                                description: 'Please sign up first.'
                            });
                            break;

                        case 429:
                            setApiError('Too many login attempts. Please try again later.');
                            toast.error('Too many attempts', {
                                description: 'Please try again later.'
                            });
                            break;

                        case 500:
                        case 502:
                        case 503:
                            setApiError('Server error. Please try again later.');
                            toast.error('Server error', {
                                description: 'Please try again later.'
                            });
                            break;

                        default:
                            setApiError(data?.message || 'An error occurred. Please try again.');
                            toast.error('Error', {
                                description: data?.message || 'An error occurred.'
                            });
                    }
                } else if (axiosError.request) {
                    setApiError('Unable to connect to server. Please check your internet connection.');
                    toast.error('Connection error', {
                        description: 'Please check your internet connection.'
                    });
                } else {
                    setApiError('An unexpected error occurred. Please try again.');
                    toast.error('Unexpected error', {
                        description: 'Please try again.'
                    });
                }
            } else {
                setApiError('An unexpected error occurred. Please try again.');
                toast.error('Unexpected error', {
                    description: 'Please try again.'
                });
                console.error('Signin error:', error);
            }
        }
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
                {apiError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
                    </div>
                )}

                <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                        if (apiError) setApiError('');
                    }}
                    error={errors.email}
                />

                <div className="flex flex-col gap-1.5">
                    <div className="relative">
                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => {
                                setFormData({ ...formData, password: e.target.value });
                                if (errors.password) setErrors({ ...errors, password: '' });
                                if (apiError) setApiError('');
                            }}
                            error={errors.password}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-12 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <EyeOff className="w-6 h-6" />
                            ) : (
                                <Eye className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-sm font-hand text-primary hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <Button
                    type="submit"
                    isLoading={loading}
                    className="mt-2"
                    icon={<ArrowRight className="w-5 h-5" />}
                    disabled={loading}
                >
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
                    disabled={loading}
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