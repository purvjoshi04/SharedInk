import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export default function CanvasControls({ 
    scale, 
    onZoomIn, 
    onZoomOut, 
    onResetView 
}: {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
}) {
    return (
        <div className="fixed bottom-4 right-4 bg-[#232323] rounded-lg shadow-lg p-2 flex items-center gap-2">
            <button
                onClick={onZoomOut}
                className="p-2 hover:bg-white/10 rounded transition-colors"
                title="Zoom Out (Ctrl + -)"
            >
                <ZoomOut className="w-5 h-5 text-white" />
            </button>
            
            <div className="px-3 py-1 rounded text-white text-sm font-mono min-w-[60px] text-center">
                {Math.round(scale * 100)}%
            </div>
            
            <button
                onClick={onZoomIn}
                className="p-2 hover:bg-white/10 rounded transition-colors"
                title="Zoom In (Ctrl + +)"
            >
                <ZoomIn className="w-5 h-5 text-white" />
            </button>
            
            <div className="w-px h-6 bg-gray-600 mx-1" />
            
            <button
                onClick={onResetView}
                className="p-2 hover:bg-white/10 rounded transition-colors"
                title="Reset View (Ctrl + 0)"
            >
                <Maximize2 className="w-5 h-5 text-white" />
            </button>
        </div>
    );
}