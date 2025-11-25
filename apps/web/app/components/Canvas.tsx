import initDraw from "@/draw";
import { useEffect, useRef } from "react";
import Navbar from "./Navbar";

export default function Canvas({ 
    roomId, 
    socket 
}: { 
    roomId: string;
    socket: WebSocket | null;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        let cleanup: (() => void) | undefined;
        
        const setup = async () => {
            if (canvasRef.current && socket) {
                cleanup = await initDraw(canvasRef.current, roomId, socket);
            }
        };
        
        setup();
        
        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [roomId, socket]);
    
    return (
        <div>
            <Navbar />
            <canvas ref={canvasRef} className="block"></canvas>
        </div>
    );
}