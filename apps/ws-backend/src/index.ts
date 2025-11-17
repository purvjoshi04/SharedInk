import { prisma } from '@repo/db';
import { WebSocketServer } from "ws";
import type { WebSocket } from 'ws';
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
        console.error('JWT verification failed:', error);
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

        if (parsedData.type === "join_room") {
            const user = users.find(x => x.ws === ws);
            if (user && !user.rooms.includes(parsedData.roomId)) {
                user.rooms.push(parsedData.roomId);
            }
        }

        if (parsedData.type === "leave_room") {
            const user = users.find(x => x.ws === ws);
            if (!user) {
                return;
            }
            user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
        }

        if (parsedData.type === "chat") {
            const roomId = parsedData.roomId;
            const message = parsedData.message;

            // TODO: use queue over here for more async architecture
            await prisma.chat.create({
                data: {
                    roomId,
                    message,
                    userId
                }
            })

            users.forEach(user => {
                if (user.rooms.includes(roomId)) {
                    user.ws.send(JSON.stringify({
                        type: "chat",
                        message: message,
                        roomId,
                        userId
                    }));
                }
            });
        }
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
    });

    ws.on('close', () => {
        console.log(`User ${userId} disconnected`);
        const index = users.findIndex(u => u.ws === ws);
        if (index !== -1) {
            users.splice(index, 1);
        }
    });
});

console.log('WebSocket server running on port 3002');