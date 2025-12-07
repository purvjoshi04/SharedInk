"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Navbar, { ShapeTool } from "./Navbar";
import CanvasControls from "./CanvasControls";
import { Game } from "@/draw/game";

export default function Canvas({ 
    roomId, 
    socket 
}: { 
    roomId?: string;
    socket?: WebSocket | null;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<ShapeTool>(ShapeTool.Pointer);
    const [scale, setScale] = useState(1);
    
    useEffect(() => {
        game?.setTool(selectedTool)
    }, [selectedTool, game])

    useEffect(() => {
        if (canvasRef.current && socket && roomId) {
            const gameInstance = new Game(canvasRef.current, roomId, socket);
            setGame(gameInstance);

            const scaleInterval = setInterval(() => {
                setScale(gameInstance.getScale());
            }, 100);
            
            return () => {
                clearInterval(scaleInterval);
                gameInstance.cleanup();
            };
        }
    }, [roomId, socket]);
    
    const handleZoomIn = useCallback(() => {
        game?.zoom(0.2);
    }, [game]);
    
    const handleZoomOut = useCallback(() => {
        game?.zoom(-0.2);
    }, [game]);
    
    const handleResetView = useCallback(() => {
        game?.resetView();
    }, [game]);
    
    useEffect(() => {
        const handleKeyboard = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    handleZoomIn();
                } else if (e.key === '-') {
                    e.preventDefault();
                    handleZoomOut();
                } else if (e.key === '0') {
                    e.preventDefault();
                    handleResetView();
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyboard);
        return () => window.removeEventListener('keydown', handleKeyboard);
    }, [handleZoomIn, handleZoomOut, handleResetView]);
    
    return (
        <div className="relative h-screen w-screen">
            <Navbar selectedTool={selectedTool} onToolChange={setSelectedTool} />
            <canvas ref={canvasRef} className="block w-full h-full"></canvas>
            <CanvasControls 
                scale={scale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetView={handleResetView}
            />
            
            <div className="fixed bottom-4 left-4 bg-[#232323] rounded-lg shadow-lg p-3 text-white text-sm max-w-xs">
                <div className="font-semibold mb-2">Controls:</div>
                <ul className="space-y-1 text-xs opacity-80">
                    <li>• Scroll to zoom</li>
                    <li>• Middle click or Shift+Drag to pan</li>
                    <li>• Ctrl/Cmd + / - to zoom</li>
                    <li>• Ctrl/Cmd + 0 to reset view</li>
                </ul>
            </div>
        </div>
    );
}