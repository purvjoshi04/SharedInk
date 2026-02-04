import axios from "axios";
import { Shape } from "./types";

export async function getExistingShapes(roomId: string): Promise<Shape[]> {
    try {
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL!.replace(/\/$/, '')}/chats/${roomId}`;

        const res = await axios.get(url, {
            withCredentials: true,
        });

        if (!res.data?.messages?.length) {
            return [];
        }

        const shapes: Shape[] = [];
        const validTypes: Shape['type'][] = ['rect', 'circle', 'pencil', 'arrow'];

        for (const msg of res.data.messages) {
            try {
                if (!msg.message || typeof msg.message !== 'string') continue;

                const parsed = JSON.parse(msg.message);
                const shapeData = parsed.shape || parsed;

                if (shapeData &&
                    typeof shapeData === 'object' &&
                    validTypes.includes(shapeData.type)) {
                    shapes.push(shapeData as Shape);
                }
            } catch {
                continue;
            }
        }

        return shapes;

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error fetching shapes:", error.message);
        } else {
            console.error("Unexpected error:", error);
        }
        return [];
    }
}