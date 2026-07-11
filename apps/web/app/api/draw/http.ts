import axios from "axios";
import { Shape } from "./types";

interface ShapeRecord {
    data?: unknown;
}

export async function getExistingShapes(roomId: string): Promise<Shape[]> {
    try {
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL!.replace(/\/$/, '')}/shapes/${roomId}`;
        const token = localStorage.getItem("token");

        const res = await axios.get(url, {
            withCredentials: true,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.data?.shapes?.length) {
            return [];
        }

        const validTypes: Shape['type'][] = ['rect', 'circle', 'pencil', 'arrow'];

        return res.data.shapes
            .map((record: ShapeRecord) => record?.data)
            .filter((s: unknown): s is Shape =>
                typeof s === 'object' &&
                s !== null &&
                'id' in s &&
                typeof (s as Record<string, unknown>).id === 'string' &&
                'type' in s &&
                validTypes.includes((s as Record<string, unknown>).type as Shape['type'])
            );

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error fetching shapes:", error.message);
        } else {
            console.error("Unexpected error:", error);
        }
        return [];
    }
}