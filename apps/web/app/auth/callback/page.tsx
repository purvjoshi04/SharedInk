'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const createRoomAndRedirect = async () => {
            if (isProcessing) return;

            if (status === 'authenticated' && session?.user) {
                setIsProcessing(true);
                try {
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`,
                        {
                            email: session.user.email,
                            name: session.user.name,
                            image: session.user.image,
                        }
                    );

                    const { token, roomId } = response.data;
                    localStorage.setItem('token', token);

                    toast.success('Welcome!', {
                        description: 'Setting up your canvas...',
                    });

                    router.push(`/canvas/${roomId}`);
                } catch (error) {
                    console.error('Room creation error:', error);
                    if (axios.isAxiosError(error) && error.response?.data) {
                        const { message, errorDetails } = error.response.data;
                        toast.error('Canvas setup failed', {
                            description: message || errorDetails || 'Server error',
                        });
                    }
                    router.push('/signin');
                }
            } else if (status === 'unauthenticated') {
                router.push('/signin');
            }
        };

        createRoomAndRedirect();
    }, [session, status, router, isProcessing]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="mt-4 text-white">Setting up your workspace...</p>
            </div>
        </div>
    );
}