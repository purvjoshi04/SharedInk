"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Navbar, { ShapeTool } from "./Navbar";
import CanvasControls from "./CanvasControls";
import { Game, RemoteCursor, PresenceUser } from "@/app/api/draw/game";

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
    const [cursors, setCursors] = useState<RemoteCursor[]>([]);
    const [presence, setPresence] = useState<PresenceUser[]>([]);

    useEffect(() => {
        game?.setTool(selectedTool)
    }, [selectedTool, game])

    useEffect(() => {
        if (!canvasRef.current || !socket || !roomId) return;
        if (socket.readyState !== WebSocket.OPEN) return;

        const gameInstance = new Game(canvasRef.current, roomId, socket);
        gameInstance.setOnShapeCreated(() => {
            setSelectedTool(ShapeTool.Pointer);
        });
        gameInstance.setOnCursorsUpdate(setCursors);
        gameInstance.setOnPresenceUpdate(setPresence);
        setGame(gameInstance);

        const scaleInterval = setInterval(() => {
            setScale(gameInstance.getScale());
        }, 100);

        return () => {
            clearInterval(scaleInterval);
            gameInstance.cleanup();
            setCursors([]);
            setPresence([]);
        };
    }, [roomId, socket, socket?.url]);

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
            <Navbar selectedTool={selectedTool} onToolChange={setSelectedTool} roomId={roomId ?? ""} />
            <canvas ref={canvasRef} className="block w-full h-full"></canvas>
            <CanvasControls
                scale={scale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetView={handleResetView}
            />

            {presence.length > 0 && (
                <div className="absolute top-8 right-8 z-10 flex items-center -space-x-2">
                    {presence.map((u) => (
                        <div
                            key={u.userId}
                            title={u.name || "Anonymous"}
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#232323] text-xs font-semibold text-white shadow-md"
                            style={{ backgroundColor: u.color }}
                        >
                            {(u.name || "?").charAt(0).toUpperCase()}
                        </div>
                    ))}
                </div>
            )}

            {cursors.map((cursor) => (
                <div
                    key={cursor.userId}
                    className="pointer-events-none absolute left-0 top-0 z-50"
                    style={{ transform: `translate(${cursor.screenX}px, ${cursor.screenY}px)` }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={cursor.color} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}>
                        <path d="M4 2l14 8-6 2-2 6z" />
                    </svg>
                    <span
                        className="ml-4 -mt-1 inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs text-white"
                        style={{ backgroundColor: cursor.color }}
                    >
                        {cursor.name}
                    </span>
                </div>
            ))}

            <div className="fixed bottom-4 left-4 bg-[#232323] rounded-lg shadow-lg p-3 text-white text-sm max-w-xs">
                <div className="font-semibold mb-2">Controls:</div>
                <ul className="space-y-1 text-xs opacity-80">
                    <li>• Scroll to zoom</li>
                    <li>• Middle click or Shift+Drag to pan</li>
                    <li>• Shift + mouse right click to move shape</li>
                    <li>• Ctrl/Cmd + / - to zoom</li>
                    <li>• Ctrl/Cmd + 0 to reset view</li>
                </ul>
            </div>
        </div>
    );
}