import { ShapeTool } from "@/components/Navbar";
import { getExistingShapes } from "./http";
import { Shape } from "./types";

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[];
    private roomId: string;
    private clicked: boolean;
    private socket: WebSocket;
    private startX = 0;
    private startY = 0;
    private selectedTool: ShapeTool = ShapeTool.Rectangle;
    private cleanupFunctions: (() => void)[] = [];

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
        this.initResizeCanvas();
    }

    setTool(tool: ShapeTool) {
        this.selectedTool = tool;
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        this.clearCanvas();
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "chat") {
                const parsedShape = JSON.parse(message.message);
                this.existingShapes.push(parsedShape);
                this.clearCanvas();
            }
        };
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        this.existingShapes.forEach((shape) => {
            if (shape.type === 'rect') {
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
                this.ctx.stroke();
            } else if (shape.type === 'pencil') {
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.stroke();
            }
        });
    }

    initMouseHandlers() {
        const handleMouseDown = (e: MouseEvent) => {
            if (this.selectedTool === ShapeTool.Pointer) return;

            this.clicked = true;
            const rect = this.canvas.getBoundingClientRect();
            this.startX = e.clientX - rect.left;
            this.startY = e.clientY - rect.top;
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!this.clicked || this.selectedTool === ShapeTool.Pointer) {
                this.clicked = false;
                return;
            }

            this.clicked = false;
            const rect = this.canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;
            const width = endX - this.startX;
            const height = endY - this.startY;

            let shape: Shape;

            if (this.selectedTool === ShapeTool.Rectangle) {
                shape = {
                    type: 'rect',
                    x: this.startX,
                    y: this.startY,
                    height: height,
                    width: width
                };
            } else if (this.selectedTool === ShapeTool.Circle) {
                const radius = Math.sqrt(width * width + height * height) / 2;
                shape = {
                    type: 'circle',
                    centerX: this.startX + width / 2,
                    centerY: this.startY + height / 2,
                    radius: radius
                };
            } else if (this.selectedTool === ShapeTool.Pencile) {
                shape = {
                    type: 'pencil',
                    startX: this.startX,
                    startY: this.startY,
                    endX: endX,
                    endY: endY
                };
            } else {
                return;
            }

            this.existingShapes.push(shape);
            this.clearCanvas();

            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify(shape),
                roomId: this.roomId
            }));
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (this.clicked) {
                const rect = this.canvas.getBoundingClientRect();
                const currentX = e.clientX - rect.left;
                const currentY = e.clientY - rect.top;
                const width = currentX - this.startX;
                const height = currentY - this.startY;

                this.clearCanvas();
                this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";

                if (this.selectedTool === ShapeTool.Rectangle) {
                    this.ctx.strokeRect(this.startX, this.startY, width, height);
                } else if (this.selectedTool === ShapeTool.Circle) {
                    const radius = Math.sqrt(width * width + height * height) / 2;
                    const centerX = this.startX + width / 2;
                    const centerY = this.startY + height / 2;
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.closePath();
                } else if (this.selectedTool === ShapeTool.Pencile) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.startX, this.startY);
                    this.ctx.lineTo(currentX, currentY);
                    this.ctx.stroke();
                }
            }
        };

        this.canvas.addEventListener("mousedown", handleMouseDown);
        this.canvas.addEventListener("mouseup", handleMouseUp);
        this.canvas.addEventListener("mousemove", handleMouseMove);

        this.cleanupFunctions.push(() => {
            this.canvas.removeEventListener("mousedown", handleMouseDown);
            this.canvas.removeEventListener("mouseup", handleMouseUp);
            this.canvas.removeEventListener("mousemove", handleMouseMove);
        });
    }

    initResizeCanvas() {
        const resizeCanvas = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.clearCanvas();
        };
        resizeCanvas();

        window.addEventListener("resize", resizeCanvas);

        this.cleanupFunctions.push(() => {
            window.removeEventListener("resize", resizeCanvas);
        });

        this.clearCanvas();
    }

    cleanup() {
        this.cleanupFunctions.forEach(fn => fn());
    }
}