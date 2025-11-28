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
            } catch (e) {
                continue;
            }
        }

        return shapes;

    } catch (error: any) {
        if (error.response) {
            console.error("API Error:", error.response.status, error.response.data);
            if (error.response.status === 401) {
                console.error("Unauthorized! Check if you're logged in on backend");
            }
        } else {
            console.error("Network error:", error.message);
        }
        return [];
    }
}