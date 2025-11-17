import { useEffect, useState } from "react";

export function useSocket() {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}?token=${token}` as string);
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        }
    }, []);

    return {
        socket,
        loading
    }
}