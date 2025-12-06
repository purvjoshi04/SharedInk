    "use client";

    import { useState, useEffect } from "react";
    import { useWebSocket } from "@/hooks/useWebSocket";
    import Canvas from "./Canvas";
    import { toast } from "sonner";
    import { useRouter } from "next/navigation";

    export default function RoomCanvas({ roomId }: { roomId: string }) {
        const router = useRouter();
        const [token] = useState<string | null>(() => {
            if (typeof window !== 'undefined') {
                return localStorage.getItem('token');
            }
            return null;
        });

        const { socket, isConnected, error } = useWebSocket(
            token ? `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}` : null,
            roomId
        );

        useEffect(() => {
            if (!token) {
                toast.error("You must be logged in to access this room.");
                router.push("/signin");
            }
        }, [token, router]);

        if (!token) {
            return (
                <div className="h-screen w-screen flex items-center justify-center">
                    <div>Authentication required</div>
                    <div className="text-sm text-gray-500">Redirecting to login...</div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="h-screen w-screen flex items-center justify-center">
                    <div className="text-red-500">
                        Error connecting to server. Please refresh.
                    </div>
                </div>
            );
        }

        if (!isConnected || !socket) {
            return (
                <div className="h-screen w-screen flex items-center justify-center">
                    <div>Connecting to server...</div>
                </div>
            );
        }

        return (
            <div className="h-screen w-screen">
                <Canvas roomId={roomId} socket={socket} />
            </div>
        );
    }