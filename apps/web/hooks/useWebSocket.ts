import { useEffect, useState } from "react";

export function useWebSocket(url: string | null, roomId: string) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Event | null>(null);

    useEffect(() => {
        let ws: WebSocket;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            ws = new WebSocket(url as string);

            ws.onopen = () => {
                setSocket(ws);
                setIsConnected(true);
                setError(null);
                ws.send(JSON.stringify({ type: "join_room", roomId }));
            };

            ws.onerror = (e) => {
                setError(e);
            };

            ws.onclose = () => {
                setIsConnected(false);
                setSocket(null);
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            clearTimeout(reconnectTimeout);
        };
    }, [url, roomId]);

    return { socket, isConnected, error };
}