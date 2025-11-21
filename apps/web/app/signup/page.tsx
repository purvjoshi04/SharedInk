"use client"
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AuthPage } from '../components/AuthPage';
import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { MailIcon, LockIcon, UserIcon, ArrowRightIcon } from '@repo/ui/icons';

export default function SignUp() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Validate password strength
        if (strengthScore < 2) {
            setError("Please use a stronger password");
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/signup`,
                {
                    username: formData.name,
                    email: formData.email,
                    password: formData.password
                }
            );

            const { token, userId } = response.data;

            // Store token in localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify({
                id: userId,
                username: formData.name,
                email: formData.email
            }));

            // Redirect to rooms
            router.push("/");
        } catch (err: any) {
            setError(err.response?.data?.error || "Sign up failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Password strength logic
    const strengthScore = useMemo(() => {
        const pass = formData.password;
        let score = 0;
        if (!pass) return 0;
        if (pass.length > 7) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        return score;
    }, [formData.password]);

    const strengthLabels = ['Enter Password', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = [
        'bg-zinc-800',
        'bg-red-500',
        'bg-orange-500',
        'bg-yellow-500',
        'bg-emerald-500'
    ];

    return (
        <AuthPage
            title="Create an account"
            subtitle="Start sketching and collaborating in seconds"
        >
            <div className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-900/50 text-red-200 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        icon={<UserIcon className="h-4 w-4" />}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <Input
                        label="Email"
                        type="email"
                        placeholder="name@example.com"
                        icon={<MailIcon className="h-4 w-4" />}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />

                    <div className="space-y-2">
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            icon={<LockIcon className="h-4 w-4" />}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <div className="space-y-1.5">
                            <div className="flex gap-1.5 h-1.5 w-full">
                                {[1, 2, 3, 4].map((level) => (
                                    <div
                                        key={level}
                                        className={`h-full flex-1 rounded-full transition-colors duration-300 ${strengthScore >= level ? strengthColors[strengthScore] : 'bg-zinc-800'}`}
                                    />
                                ))}
                            </div>
                            <p className={`text-xs font-medium text-right transition-colors ${strengthScore > 0 ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                {strengthScore > 0 ? strengthLabels[strengthScore] : 'Password strength'}
                            </p>
                        </div>
                    </div>

                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="••••••••"
                        icon={<LockIcon className="h-4 w-4" />}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                    />

                    <div className="flex items-start gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="terms"
                            className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-white focus:ring-offset-zinc-950 accent-white"
                            required
                        />
                        <label htmlFor="terms" className="text-sm text-zinc-500">
                            I agree to the <a href="#" className="font-medium text-white hover:underline">Terms of Service</a> and <a href="#" className="font-medium text-white hover:underline">Privacy Policy</a>.
                        </label>
                    </div>

                    <Button type="submit" fullWidth isLoading={isLoading} className="group" variant={'primary'}>
                        Create Account
                        <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <span className="text-zinc-400">Already have an account? </span>
                    <Link
                        href="/signin"
                        className="font-bold text-white hover:underline underline-offset-4 decoration-zinc-600 hover:decoration-white transition-all"
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        </AuthPage>
    );
}