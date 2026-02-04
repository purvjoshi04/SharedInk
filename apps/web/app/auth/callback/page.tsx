'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        const createRoomAndRedirect = async () => {
            if (status === 'authenticated' && session?.user) {
                try {
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/room`,
                        {
                            userId: session.user.id,
                        }
                    );

                    const { roomId } = response.data;

                    toast.success('Welcome!', {
                        description: 'Setting up your canvas...',
                    });

                    router.push(`/canvas/${roomId}`);
                } catch (error) {
                    console.error('Room creation error:', error);
                    toast.error('Error', {
                        description: 'Failed to create canvas. Please try again.',
                    });
                    router.push('/signin');
                }
            } else if (status === 'unauthenticated') {
                router.push('/signin');
            }
        };

        createRoomAndRedirect();
    }, [session, status, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="mt-4 text-white">Setting up your workspace...</p>
            </div>
        </div>
    );
}