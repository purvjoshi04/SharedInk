"use client";

import React, { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import Canvas from "./Canvas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RoomCanvas({ roomId }: { roomId: string }) {
    const router = useRouter();
    const [hasMounted, setHasMounted] = useState(false);
    const [token] = useState<string | null>(() => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem("token");
    });

    const { socket, isConnected, error } = useWebSocket(
        token ? `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}` : null,
        roomId
    );

    React.useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (hasMounted && !token) {
            toast.error("You must be logged in to access this room.");
            router.push("/signin");
        }
    }, [hasMounted, token, router]);

    if (!token) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div>Authentication required</div>
                    <div className="text-sm text-gray-500">Redirecting to login...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <div className="text-red-500 text-center">
                    Error connecting to server. Please refresh.
                </div>
            </div>
        );
    }

    if (!isConnected || !socket) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <div>Connecting to server...</div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-background">
            <Canvas roomId={roomId} socket={socket} />
        </div>
    );
}