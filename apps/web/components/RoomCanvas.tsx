"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import Canvas from "./Canvas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "token";

function subscribe(callback: () => void) {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
    return localStorage.getItem(TOKEN_KEY);
}

function getServerSnapshot() {
    return null;
}

export default function RoomCanvas({ roomId }: { roomId: string }) {
    const router = useRouter();
    const token = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const hasMounted = typeof window !== "undefined";

    const { socket, isConnected, error } = useWebSocket(
        hasMounted && token ? `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}` : null,
        roomId
    );

    useEffect(() => {
        if (hasMounted && !token) {
            toast.error("You must be logged in to access this room.");
            router.push(`/signin?redirect=${encodeURIComponent(`/canvas/${roomId}`)}`);
        }
    }, [hasMounted, token, router, roomId]);

    if (!hasMounted) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <div>Loading...</div>
            </div>
        );
    }

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