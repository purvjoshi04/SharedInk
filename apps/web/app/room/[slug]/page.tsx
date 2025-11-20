import axios, { AxiosError } from "axios";
import { ChatRoomClient } from "../../components/ChatRoomClient";
import { notFound } from "next/navigation";

async function getRoomData(slug: string) {
    try {
        const response = await axios.get(`${process.env.BACKEND_URL}/room/${slug}`);
        console.log("Room data received:", response.data);

        if (!response.data || !response.data.id) {
            notFound();
        }

        return response.data;
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            console.error("Failed to get room data:", error.response?.data || error.message);
            notFound();
        }
    }
}

async function getMessages(roomId: number) {
    try {
        const response = await axios.get(`${process.env.BACKEND_URL}/chats/${roomId}`);
        return response.data.messages || [];
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            console.error("Failed to fetch messages:", error.response?.data || error.message);
        } else {
            return [];
        }
    }
}

export default async function ChatRoom({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const roomData = await getRoomData(slug);
    const messages = await getMessages(roomData.id);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Room: {slug}</h1>
            <ChatRoomClient id={roomData.id} messages={messages} />
        </div>
    );
}