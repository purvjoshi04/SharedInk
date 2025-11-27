'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { useTheme } from '../../components/ThemeProvider';

export default function Signup() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { isDark, toggleTheme } = useTheme();

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push('/signin');
        }, 1500);
    };

    return (
        <AuthLayout title="Create Account" subtitle="Start sketching your ideas today." onToggleTheme={toggleTheme} isDark={isDark}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                <Input
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={errors.name}
                />
                <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                />
                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                />

                <div className="flex items-start gap-2 mt-2">
                    <input type="checkbox" id="terms" className="mt-1 w-4 h-4 text-primary border-black dark:border-gray-500 rounded focus:ring-primary" required />
                    <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 font-sans">
                        I agree to the <a href="#" className="text-white hover:underline">Terms of Service</a> and <a href="#" className="text-white hover:underline">Privacy Policy</a>.
                    </label>
                </div>

                <Button type="submit" isLoading={loading} className="mt-2">
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
};