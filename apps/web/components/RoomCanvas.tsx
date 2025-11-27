"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import Canvas from "./Canvas";

export default function RoomCanvas({ roomId }: { roomId: string }) {
    const { socket, isConnected, error } = useWebSocket(
        `${process.env.NEXT_PUBLIC_WS_URL}?token=${process.env.NEXT_PUBLIC_TOKEN}`,
        roomId
    );

    if (error) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                Error connecting to server. Please refresh.
            </div>
        );
    }

    if (!isConnected || !socket) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                Connecting to server....
            </div>
        );
    }

    return (
        <div className="h-screen w-screen">
            <Canvas roomId={roomId} socket={socket} />
        </div>
    );
}