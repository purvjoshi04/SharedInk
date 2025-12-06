import { prisma } from '@repo/db';
import { type WebSocket, WebSocketServer } from "ws";
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
        try {
            const parsedData = JSON.parse(message.toString());

            // JOIN ROOM
            if (parsedData.type === "join_room") {
                const { roomId } = parsedData;
                
                // Verify room exists
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
                    
                    // Send confirmation
                    ws.send(JSON.stringify({ 
                        type: "room_joined", 
                        roomId 
                    }));

                    // Notify other users in the room
                    users.forEach(u => {
                        if (u.userId !== userId && u.rooms.includes(roomId)) {
                            u.ws.send(JSON.stringify({
                                type: "user_joined",
                                roomId,
                                userId
                            }));
                        }
                    });
                }
            }

            // LEAVE ROOM
            if (parsedData.type === "leave_room") {
                const { roomId } = parsedData;
                const user = users.find(x => x.ws === ws);
                if (!user) {
                    return;
                }
                user.rooms = user.rooms.filter(x => x !== roomId);

                users.forEach(u => {
                    if (u.userId !== userId && u.rooms.includes(roomId)) {
                        u.ws.send(JSON.stringify({
                            type: "user_left",
                            roomId,
                            userId
                        }));
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

                const room = await prisma.room.findUnique({
                    where: { id: roomId }
                });

                if (!room) {
                    ws.send(JSON.stringify({
                        type: "error",
                        error: "Room not found"
                    }));
                    return;
                }

                const chat = await prisma.chat.create({
                    data: {
                        roomId: room.id,
                        message,
                        userId
                    }
                });

                users.forEach(user => {
                    if (user.rooms.includes(roomId)) {
                        user.ws.send(JSON.stringify({
                            type: "chat",
                            chatId: chat.id,
                            roomId: roomId,
                            message: chat.message,
                            userId: chat.userId,
                            createdAt: chat.createdAt
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

                const room = await prisma.room.findUnique({
                    where: { id: roomId }
                });

                if (!room) {
                    ws.send(JSON.stringify({ type: "error", error: "Room not found" }));
                    return;
                }

                users.forEach(user => {
                    if (user.userId !== userId && user.rooms.includes(roomId)) {
                        user.ws.send(JSON.stringify({
                            type: "canvas_update",
                            roomId,
                            canvasData,
                            userId
                        }));
                    }
                });
            }

            if (parsedData.type === "request_canvas_state") {
                const { roomId } = parsedData;
                const otherUser = users.find(u => 
                    u.userId !== userId && 
                    u.rooms.includes(roomId)
                );

                if (otherUser) {
                    otherUser.ws.send(JSON.stringify({
                        type: "send_canvas_state",
                        roomId,
                        requesterId: userId
                    }));
                }
            }
            if (parsedData.type === "canvas_state") {
                const { roomId, canvasData, requesterId } = parsedData;
                const requester = users.find(u => u.userId === requesterId);
                if (requester) {
                    requester.ws.send(JSON.stringify({
                        type: "canvas_state",
                        roomId,
                        canvasData
                    }));
                }
            }

        } catch (error) {
            ws.send(JSON.stringify({ 
                type: "error", 
                error: "Failed to process message" 
            }));
        }
    });

    ws.on('error', (error) => {

    });

    ws.on('close', () => {
        const index = users.findIndex(u => u.ws === ws);
        if (index !== -1) {
            const user = users[index];
            
            user!.rooms.forEach(roomId => {
                users.forEach(u => {
                    if (u.userId !== userId && u.rooms.includes(roomId)) {
                        u.ws.send(JSON.stringify({
                            type: "user_left",
                            roomId,
                            userId
                        }));
                    }
                });
            });
            
            users.splice(index, 1);
        }
    });
});

console.log('WebSocket server running on port 3002');