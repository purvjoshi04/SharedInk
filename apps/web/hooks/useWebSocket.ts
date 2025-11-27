import { useEffect, useState } from "react";

export function useWebSocket(url: string, roomId: string) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Event | null>(null);

    useEffect(() => {
        let ws: WebSocket;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            ws = new WebSocket(url);

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
            if (ws) ws.close();
        };
    }, [url, roomId]);

    return { socket, isConnected, error };
}