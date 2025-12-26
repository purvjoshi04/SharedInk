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

interface ApiError {
    message?: string;
    errors?: Record<string, string[]>;
}

export default function Signup() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError('');
        if (!validate()) return;
        setLoading(true);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/signup`, {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            const { token, roomId } = response.data;
            localStorage.setItem('token', token);

            toast.success('Singup successful!', {
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
                            } else {
                                setApiError(data?.message || 'Invalid request. Please check your input.');
                            }
                            break;

                        case 409:
                            setApiError('An account with this email already exists.');
                            break;

                        case 500:
                        case 502:
                        case 503:
                            setApiError('Server error. Please try again later.');
                            break;

                        default:
                            setApiError(data?.message || 'An error occurred. Please try again.');
                    }
                } else if (axiosError.request) {
                    setApiError('Unable to connect to server. Please check your internet connection.');
                } else {
                    setApiError('An unexpected error occurred. Please try again.');
                }
            } else {
                setApiError('An unexpected error occurred. Please try again.');
                console.error('Signup error:', error);
            }
        }
    };

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
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-12 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="w-6 h-6" />
                        ) : (
                            <Eye className="w-6 h-6" />
                        )}
                    </button>
                </div>

                <div className="flex items-start gap-2 mt-2">
                    <input
                        type="checkbox"
                        id="terms"
                        className="mt-1 w-4 h-4 text-primary border-black dark:border-gray-500 rounded focus:ring-primary"
                        required
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 font-sans">
                        I agree to the{' '}
                        <Link href="/terms" className="text-white hover:underline">
                            Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-white hover:underline">
                            Privacy Policy
                        </Link>
                        .
                    </label>
                </div>

                <Button type="submit" isLoading={loading} disabled={loading} className="mt-2">
                    Create Account
                </Button>

                <p className="text-center font-sans text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Already have an account?{' '}
                    <Link href="/signin" className="font-hand font-bold text-primary hover:underline text-lg">
                        Sign in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}