'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';

interface ApiError {
    message?: string;
    errors?: Record<string, string[]>;
}

export default function Signup() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGoogleSignUp = async () => {
        try {
            setGoogleLoading(true);
            setApiError('');
            await signIn('google', {
                callbackUrl: '/auth/callback',
            });
        } catch (error) {
            console.error('Google sign-up error:', error);
            toast.error('Authentication error', {
                description: 'Unable to sign up with Google.',
            });
            setApiError('Unable to sign up with Google. Please try again.');
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError('');
        if (!validate()) return;
        setLoading(true);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/signup`, {
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            const { token, roomId } = response.data;
            localStorage.setItem('token', token);

            toast.success('Signup successful!', {
                description: 'Redirecting to your canvas...',
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
                                    description: 'Please check your input.',
                                });
                            } else {
                                setApiError(data?.message || 'Invalid request. Please check your input.');
                                toast.error('Invalid request', {
                                    description: 'Please check your input and try again.',
                                });
                            }
                            break;

                        case 409:
                            setApiError('An account with this email already exists.');
                            toast.error('Account exists', {
                                description: 'Please sign in instead.',
                            });
                            break;

                        case 500:
                        case 502:
                        case 503:
                            setApiError('Server error. Please try again later.');
                            toast.error('Server error', {
                                description: 'Please try again later.',
                            });
                            break;

                        default:
                            setApiError(data?.message || 'An error occurred. Please try again.');
                            toast.error('Error', {
                                description: data?.message || 'An error occurred.',
                            });
                    }
                } else if (axiosError.request) {
                    setApiError('Unable to connect to server. Please check your internet connection.');
                    toast.error('Connection error', {
                        description: 'Please check your internet connection.',
                    });
                } else {
                    setApiError('An unexpected error occurred. Please try again.');
                    toast.error('Unexpected error', {
                        description: 'Please try again.',
                    });
                }
            } else {
                setApiError('An unexpected error occurred. Please try again.');
                toast.error('Unexpected error', {
                    description: 'Please try again.',
                });
                console.error('Signup error:', error);
            }
        }
    };

    const isAnyLoading = loading || googleLoading;

    return (
        <AuthLayout title="Create Account" subtitle="Start sketching your ideas today.">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                {apiError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
                    </div>
                )}

                <Input
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                        if (apiError) setApiError('');
                    }}
                    error={errors.name}
                    disabled={isAnyLoading}
                />

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
                    disabled={isAnyLoading}
                />

                <div className="relative">
                    <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            if (errors.password) setErrors({ ...errors, password: '' });
                            if (apiError) setApiError('');
                        }}
                        error={errors.password}
                        disabled={isAnyLoading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-12 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        disabled={isAnyLoading}
                    >
                        {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                </div>

                <div className="relative">
                    <Input
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                            setFormData({ ...formData, confirmPassword: e.target.value });
                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                            if (apiError) setApiError('');
                        }}
                        error={errors.confirmPassword}
                        disabled={isAnyLoading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-12 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        disabled={isAnyLoading}
                    >
                        {showConfirmPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                </div>

                <div className="flex items-start gap-2 mt-2">
                    <input
                        type="checkbox"
                        id="terms"
                        className="mt-1 w-4 h-4 text-primary border-black dark:border-gray-500 rounded focus:ring-primary disabled:opacity-50"
                        required
                        disabled={isAnyLoading}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 font-sans">
                        I agree to the{' '}
                        <Link
                            href="/terms"
                            className="text-white hover:underline"
                            tabIndex={isAnyLoading ? -1 : 0}
                        >
                            Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link
                            href="/privacy"
                            className="text-white hover:underline"
                            tabIndex={isAnyLoading ? -1 : 0}
                        >
                            Privacy Policy
                        </Link>
                        .
                    </label>
                </div>

                <Button type="submit" isLoading={loading} disabled={isAnyLoading} className="mt-2">
                    Create Account
                </Button>

                <div className="flex items-center my-2">
                    <div className="flex-1 border-t border-gray-700"></div>
                    <span className="px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Or continue with
                    </span>
                    <div className="flex-1 border-t border-gray-700"></div>
                </div>

                <Button
                    type="button"
                    onClick={handleGoogleSignUp}
                    isLoading={googleLoading}
                    icon={
                        !googleLoading && (
                            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                        )
                    }
                    disabled={isAnyLoading}
                >
                    {googleLoading ? 'Signing up...' : 'Google'}
                </Button>

                <p className="text-center font-sans text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Already have an account?{' '}
                    <Link
                        href="/signin"
                        className="font-hand font-bold text-primary hover:underline text-lg"
                        tabIndex={isAnyLoading ? -1 : 0}
                    >
                        Sign in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}