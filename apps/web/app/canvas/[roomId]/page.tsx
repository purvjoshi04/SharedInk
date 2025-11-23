"use client";
import initDraw from "@/draw";
import { useEffect, useRef } from "react"

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            initDraw(canvasRef.current);
        }

    }, [canvasRef]);
    return (
        <div className="h-screen w-screen">
            <canvas ref={canvasRef} className="block"></canvas>
            
        </div>
    )
}