import { Circle, EraserIcon, MousePointer2, MoveRight, PencilIcon, Square, Share2, Check } from "lucide-react"
import { ReactNode, useState } from "react"
import { toast } from "sonner";

export enum ShapeTool {
    Pointer = "pointer",
    Rectangle = "rect",
    Circle = "circle",
    Arrow = "arrow",
    Pencil = "pencil",
    Eraser = "eraser",
}

interface NavbarProps {
    selectedTool: ShapeTool;
    onToolChange: (tool: ShapeTool) => void;
    roomId: string;
}

export default function Navbar({ selectedTool, onToolChange, roomId }: NavbarProps) {
    const [copied, setCopied] = useState(false);

    const tools = [
        { icon: <MousePointer2 size={18} />, label: "Select", tool: ShapeTool.Pointer },
        { icon: <Square size={18} />, label: "Rectangle", tool: ShapeTool.Rectangle },
        { icon: <Circle size={18} />, label: "Circle", tool: ShapeTool.Circle },
        { icon: <MoveRight size={18} />, label: "Arrow", tool: ShapeTool.Arrow },
        { icon: <PencilIcon size={18} />, label: "Pencil", tool: ShapeTool.Pencil },
        { icon: <EraserIcon size={18} />, label: "Eraser", tool: ShapeTool.Eraser }
    ]

    const handleShare = async () => {
        const url = `${window.location.origin}/canvas/${roomId}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Link copied!", { description: "Share it with anyone to draw together." });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy link", { description: "Copy it manually from the address bar." });
        }
    };

    return (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 
                    bg-[#232323] rounded-xl shadow-xl 
                    px-3 py-2 flex items-center gap-2 border border-gray-800">
            {tools.map((tool, index) => (
                <div key={tool.tool} className="flex items-center">
                    {index === 1 && <Divider />}
                    <ToolButton
                        icon={tool.icon}
                        label={tool.label}
                        activated={selectedTool === tool.tool}
                        onClick={() => onToolChange(tool.tool)}
                    />
                </div>
            ))}
            <Divider />
            <ToolButton
                icon={copied ? <Check size={18} /> : <Share2 size={18} />}
                label="Copy share link"
                onClick={handleShare}
            />
        </div>
    )
}

function ToolButton({
    icon,
    label,
    onClick,
    activated = false
}: {
    icon: ReactNode
    label: string
    onClick?: () => void
    activated?: boolean
}) {
    return (
        <button
            className={`
        p-2.5 rounded-lg transition-all duration-200 relative group
        ${activated
                    ? "text-white bg-white/10 ring-2 ring-white/30"
                    : "text-white  hover:text-white hover:bg-white/5"
                }
        `}
            title={label}
            onClick={onClick}
            aria-label={label}
            aria-pressed={activated}
        >
            {icon}
        </button>
    )
}

function Divider() {
    return <div className="w-px h-8 bg-gray-300 mx-2" />
}