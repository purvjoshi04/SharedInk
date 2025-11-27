import { Circle, MousePointer2, MoveRight, PencilIcon, Square } from "lucide-react"
import { ReactNode } from "react"

export enum ShapeTool {
    Pointer = "pointer",
    Rectangle = "rect",
    Circle = "circle",
    Arrow = "arrow",
    Pencile = "pencile"
}

interface NavbarProps {
    selectedTool: ShapeTool;
    onToolChange: (tool: ShapeTool) => void;
}

export default function Navbar({ selectedTool, onToolChange }: NavbarProps) {
    const tools = [
        { icon: <MousePointer2 size={18} />, label: "Select", tool: ShapeTool.Pointer },
        { icon: <Square size={18} />, label: "Rectangle", tool: ShapeTool.Rectangle },
        { icon: <Circle size={18} />, label: "Circle", tool: ShapeTool.Circle },
        { icon: <MoveRight size={18} />, label: "Arrow", tool: ShapeTool.Arrow },
        {icon: <PencilIcon size={18}/>, label: "Pencile", tool: ShapeTool.Pencile}
    ]

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

            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                            px-3 py-1.5 bg-dark-card text-white text-xs rounded-lg 
                            border border-dark-border
                            opacity-0 group-hover:opacity-100 
                            transition-opacity whitespace-nowrap pointer-events-none
                            shadow-lg">
                {label}
            </span>
        </button>
    )
}

function Divider() {
    return <div className="w-px h-8 bg-gray-300 mx-2" />
}