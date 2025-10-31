import ws, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3002 });

wss.on('connection', (ws) => {
    ws.send('hello from wss')
});