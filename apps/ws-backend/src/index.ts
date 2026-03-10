import { prisma } from '@repo/db';
import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getJwtSecret } from '@repo/common/config';

const wss = new WebSocketServer({ port: 3002 });

interface DecodedToken extends JwtPayload {
    userId: string;
}

interface User {
    ws: WebSocket,
    userId: string,
    rooms: string[]
}

const users: User[] = [];

function checkUser(token: string): string | null {
    try {
        const decoded = jwt.verify(token, getJwtSecret()) as DecodedToken;

        if (typeof decoded === "string") {
            return null;
        }

        if (decoded && typeof decoded === "object" && "userId" in decoded && typeof decoded.userId === "string") {
            return decoded.userId;
        }

        return null;
    } catch (error) {
        return null;
    }
}

wss.on('connection', (ws: WebSocket, req) => {
    const url = req.url;
    if (!url) {
        ws.close(1008, 'Missing URL');
        return;
    }

    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token');

    if (!token) {
        ws.close(1008, 'Missing token');
        return;
    }

    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
        ws.close(1011, 'Server configuration error');
        return;
    }

    const userId = checkUser(token);

    if (!userId) {
        ws.close(1008, 'Invalid token');
        return;
    }

    ws.send(JSON.stringify({ type: 'connected', userId }));

    users.push({
        userId,
        rooms: [],
        ws
    });

    ws.on('message', async (message) => {
        const parsedData = JSON.parse(message.toString());
        console.log(`[WS] Received: ${parsedData.type} from userId: ${userId}, total users: ${users.length}`);
        console.log(`[WS] Users in room:`, users.filter(u => u.rooms.includes(parsedData.roomId)).length);

        try {
            const parsedData = JSON.parse(message.toString());
            if (parsedData.type === "join_room") {
                const { roomId } = parsedData;
                const room = await prisma.room.findUnique({
                    where: { id: roomId }
                });

                if (!room) {
                    ws.send(JSON.stringify({ type: "error", error: "Room not found" }));
                    return;
                }

                const user = users.find(x => x.ws === ws);
                if (user && !user.rooms.includes(roomId)) {
                    user.rooms.push(roomId);
                    ws.send(JSON.stringify({ type: "room_joined", roomId }));

                    users.forEach(u => {
                        if (u.ws !== ws && u.rooms.includes(roomId)) {
                            u.ws.send(JSON.stringify({ type: "user_joined", roomId, userId }));
                        }
                    });
                }
            }

            if (parsedData.type === "leave_room") {
                const { roomId } = parsedData;
                const user = users.find(x => x.ws === ws);
                if (!user) return;

                user.rooms = user.rooms.filter(x => x !== roomId);

                users.forEach(u => {
                    if (u.ws !== ws && u.rooms.includes(roomId)) {
                        u.ws.send(JSON.stringify({ type: "user_left", roomId, userId }));
                    }
                });
            }

            if (parsedData.type === "chat") {
                const { roomId, message: rawMessage } = parsedData;
                const message = rawMessage?.trim();

                if (!roomId || !message) {
                    ws.send(JSON.stringify({ type: "error", error: "Invalid message" }));
                    return;
                }

                const room = await prisma.room.findUnique({ where: { id: roomId } });

                if (!room) {
                    ws.send(JSON.stringify({ type: "error", error: "Room not found" }));
                    return;
                }

                const chat = await prisma.chat.create({
                    data: { roomId: room.id, message, userId }
                });
                users.forEach(user => {
                    if (user.ws !== ws && user.rooms.includes(roomId)) {
                        user.ws.send(JSON.stringify({
                            type: "chat",
                            chatId: chat.id.toString(),
                            roomId: roomId,
                            message: chat.message,
                            userId: chat.userId,
                            createdAt: chat.createdAt.toISOString()
                        }));
                    }
                });
            }

            if (parsedData.type === "canvas_update") {
                const { roomId, canvasData } = parsedData;

                if (!roomId || !canvasData) {
                    ws.send(JSON.stringify({ type: "error", error: "Invalid canvas data" }));
                    return;
                }

                const room = await prisma.room.findUnique({ where: { id: roomId } });

                if (!room) {
                    ws.send(JSON.stringify({ type: "error", error: "Room not found" }));
                    return;
                }

                users.forEach(user => {
                    if (user.ws !== ws && user.rooms.includes(roomId)) {
                        user.ws.send(JSON.stringify({ type: "canvas_update", roomId, canvasData, userId }));
                    }
                });
            }

            if (parsedData.type === "request_canvas_state") {
                const { roomId } = parsedData;
                const otherUsers = users.filter(u => u.ws !== ws && u.rooms.includes(roomId));

                if (otherUsers.length > 0) {
                    otherUsers[0]!.ws.send(JSON.stringify({
                        type: "send_canvas_state",
                        roomId,
                        requesterId: userId
                    }));
                }
            }

            if (parsedData.type === "canvas_state") {
                const { roomId, canvasData, requesterId } = parsedData;
                const requester = users.find(u => u.userId === requesterId && u.ws !== ws);
                if (requester && requester.ws.readyState === WebSocket.OPEN) {
                    requester.ws.send(JSON.stringify({ type: "canvas_state", roomId, canvasData }));
                }
            }

            if (parsedData.type === "delete_shape") {
                const { roomId, shape } = parsedData;
                const chats = await prisma.chat.findMany({ where: { roomId } });
                for (const chat of chats) {
                    try {
                        const parsed = JSON.parse(chat.message);
                        const shapeData = parsed.shape || parsed;
                        if (JSON.stringify(shapeData) === JSON.stringify(shape)) {
                            await prisma.chat.delete({ where: { id: chat.id } });
                            break;
                        }
                    } catch { continue; }
                }

                users.forEach(user => {
                    if (user.ws !== ws && user.rooms.includes(roomId)) {
                        user.ws.send(JSON.stringify({ type: "delete_shape", roomId, shape }));
                    }
                });
            }

            if (parsedData.type === "move_shape") {
                const { roomId, oldShape, newShape } = parsedData;
                const chats = await prisma.chat.findMany({ where: { roomId } });
                for (const chat of chats) {
                    try {
                        const parsed = JSON.parse(chat.message);
                        const shapeData = parsed.shape || parsed;
                        if (JSON.stringify(shapeData) === JSON.stringify(oldShape)) {
                            await prisma.chat.update({
                                where: { id: chat.id },
                                data: { message: JSON.stringify(newShape) }
                            });
                            break;
                        }
                    } catch { continue; }
                }

                users.forEach(user => {
                    if (user.ws !== ws && user.rooms.includes(roomId)) {
                        user.ws.send(JSON.stringify({ type: "move_shape", roomId, oldShape, newShape }));
                    }
                });
            }

        } catch (error) {
            ws.send(JSON.stringify({ type: "error", error: "Failed to process message" }));
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        const index = users.findIndex(u => u.ws === ws);
        if (index !== -1) {
            const user = users[index];

            user!.rooms.forEach(roomId => {
                users.forEach(u => {
                    if (u.ws !== ws && u.rooms.includes(roomId)) {
                        u.ws.send(JSON.stringify({ type: "user_left", roomId, userId }));
                    }
                });
            });

            users.splice(index, 1);
        }
    });
});

console.log('WebSocket server running on port 3002');