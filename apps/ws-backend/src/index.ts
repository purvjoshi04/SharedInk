import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getJwtSecret } from '@repo/common/config';

const wss = new WebSocketServer({ port: 3002 });

interface DecodedToken extends JwtPayload {
    userId: string;
}

wss.on('connection', (ws, req) => {
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

    try {
        const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

        if (!decoded.userId) {
            ws.close(1008, 'Invalid token payload');
            return;
        }
        ws.on('message', (message) => {
            console.log(`Received from user ${decoded.userId}:`, message);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for user ${decoded.userId}:`, error);
        });
        ws.send(JSON.stringify({ type: 'connected', userId: decoded.userId }));

    } catch (error) {
        console.error('JWT verification failed:', error);
        ws.close(1008, 'Invalid token');
        return;
    }
});