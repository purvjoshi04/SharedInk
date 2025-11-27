import { useEffect, useRef, useState } from "react";
import Navbar, { ShapeTool } from "./Navbar";
import { Game } from "@/draw/game";

export default function Canvas({ 
    roomId, 
    socket 
}: { 
    roomId: string;
    socket: WebSocket | null;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);
    const [selectedTool, setSelectedTool] = useState<ShapeTool>(ShapeTool.Pointer);
    
    useEffect(() => {
        if (canvasRef.current && socket) {
            const game = new Game(canvasRef.current, roomId, socket);
            gameRef.current = game;
            
            return () => {
                game.cleanup();
            };
        }
    }, [roomId, socket]);
    
    const handleToolChange = (tool: ShapeTool) => {
        setSelectedTool(tool);
        if (gameRef.current) {
            gameRef.current.setTool(tool);
        }
    };
    
    return (
        <div className="relative h-screen w-screen">
            <Navbar selectedTool={selectedTool} onToolChange={handleToolChange} />
            <canvas ref={canvasRef} className="block w-full h-full"></canvas>
        </div>
    );
}