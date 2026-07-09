import { useEffect, useRef, useState } from "react";
import * as React from "react";

export function useWebSocket(url: string | null, roomId: string) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Event | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!url) return;

        let reconnectTimeout: NodeJS.Timeout;
        let cancelled = false;

        const connect = () => {
            if (cancelled) return;

            const ws = new WebSocket(url);
            socketRef.current = ws;

            ws.onopen = () => {
                if (cancelled) { ws.close(); return; }
                setSocket(ws);
                setIsConnected(true);
                setError(null);
                ws.send(JSON.stringify({ type: "join_room", roomId }));
            };

            ws.onerror = (e) => {
                if (!cancelled) setError(e);
            };

            ws.onclose = () => {
                if (cancelled) return;
                setIsConnected(false);
                setSocket(null);
                socketRef.current = null;
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            cancelled = true;
            clearTimeout(reconnectTimeout);
            if (socketRef.current) {
                socketRef.current.onclose = null;
                socketRef.current.close();
                socketRef.current = null;
            }
            setSocket(null);
            setIsConnected(false);
        };
    }, [url, roomId]);

    return { socket, isConnected, error };
}

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

    React.useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        mql.addEventListener("change", onChange);
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return !!isMobile;
}