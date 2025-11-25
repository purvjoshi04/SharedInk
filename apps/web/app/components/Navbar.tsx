import { MousePointer2, Square } from "lucide-react"
import { ReactNode } from "react"

export default function Navbar() {
    return (
        <div>
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 
                            bg-[#232323] rounded-xl shadow-xl 
                            px-3 py-2 flex items-center gap-2">
                <ToolButton icon={<MousePointer2 size={18} />} label="Select" />
                <Divider />
                <ToolButton icon={<Square size={18} />} label="Rectangle" />

            </div>
        </div>
    )
}

function ToolButton({ icon, label, onClick }: { icon: ReactNode, label: string, onClick?: () => void }) {
    return (
        <button
            className="p-2.5 rounded-lg hover:bg-primary-hover/20 text-gray-300 hover:text-white 
                    transition-all relative group cursor-pointer"
            title={label}
            onClick={onClick}
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