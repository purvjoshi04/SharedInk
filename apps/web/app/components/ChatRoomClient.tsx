"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

interface Message {
    id?: number;
    message: string;
    userId?: string;
    createdAt?: string;
}

export function ChatRoomClient({
    messages,
    id
}: {
    messages: Message[],
    id: string
}) {
    const [chats, setChats] = useState<Message[]>(messages);
    const { socket, loading } = useSocket();
    const [currentMessage, setCurrentMessage] = useState("");

    useEffect(() => {
        if (socket && !loading) {
            socket.send(JSON.stringify({
                type: "join_room",
                roomId: id
            }));

            const handleMessage = (event: MessageEvent) => {
                const parsedData = JSON.parse(event.data);
                if (parsedData.type === "chat" && parsedData.roomId === id) {
                    setChats(prevChats => [...prevChats, {
                        message: parsedData.message,
                        userId: parsedData.userId,
                        id: Date.now()
                    }]);
                }
            };

            socket.addEventListener('message', handleMessage);

            return () => {
                socket.removeEventListener('message', handleMessage);
                socket.send(JSON.stringify({
                    type: "leave_room",
                    roomId: id
                }));
            };
        }
    }, [socket, loading, id]);

    return (
        <div className="flex flex-col gap-2 p-4">
            {chats.map((m, index) => (
                <div key={m.id || index} className="p-2 bg-gray-100 rounded">
                    {m.userId && <span className="font-bold">{m.userId}: </span>}
                    {m.message}
                </div>
            ))}
            <input type="text" value={currentMessage} onChange={e => {
                setCurrentMessage(e.target.value);
            }}></input>
            <button onClick={() => {
                socket?.send(JSON.stringify({
                    type: "chat",
                    roomId: id,
                    message: currentMessage
                }))

                setCurrentMessage("");
            }}>Send message</button>
        </div>
    );
}