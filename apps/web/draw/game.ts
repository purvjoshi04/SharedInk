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
    private endX = 0;
    private endY = 0;
    private currentPencilStroke: { x: number; y: number }[] = [];
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
        this.ctx.fillStyle = "rgba(255, 255, 255, 1)";

        this.existingShapes.forEach((shape) => {
            if (shape.type === 'rect') {
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
                this.ctx.stroke();
            } else if (shape.type === 'pencil') {
                this.drawPencilStroke(shape.points);
            } else if (shape.type === 'arrow') {
                this.drawArrow(shape.startX, shape.startY, shape.endX, shape.endY);
            }
        });
    }

    private drawArrow(fromX: number, fromY: number, toX: number, toY: number) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        const headlen = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);

        this.ctx.lineTo(
            toX - headlen * Math.cos(angle - Math.PI / 6),
            toY - headlen * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headlen * Math.cos(angle + Math.PI / 6),
            toY - headlen * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }

    private drawPencilStroke(points: { x: number; y: number }[]) {
        if (!points || points.length < 2) return;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }

        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
    }

    initMouseHandlers() {
        const handleMouseDown = (e: MouseEvent) => {
            if (this.selectedTool === ShapeTool.Pointer) return;

            this.clicked = true;
            const rect = this.canvas.getBoundingClientRect();
            this.startX = e.clientX - rect.left;
            this.startY = e.clientY - rect.top;
            if (this.selectedTool === ShapeTool.Pencil) {
                this.currentPencilStroke = [{ x: this.startX, y: this.startY }];
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!this.clicked || this.selectedTool === ShapeTool.Pointer) {
                this.clicked = false;
                return;
            }

            this.clicked = false;
            const rect = this.canvas.getBoundingClientRect();
            this.endX = e.clientX - rect.left;
            this.endY = e.clientY - rect.top;
            const width = this.endX - this.startX;
            const height = this.endY - this.startY;

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
            } else if (this.selectedTool === ShapeTool.Pencil) {
                this.currentPencilStroke.push({ x: this.endX, y: this.endY });
                shape = {
                    type: 'pencil',
                    points: this.currentPencilStroke
                };
                this.currentPencilStroke = [];
            } else if (this.selectedTool === ShapeTool.Arrow) {
                shape = {
                    type: "arrow",
                    startX: this.startX,
                    startY: this.startY,
                    endX: this.endX,
                    endY: this.endY
                }
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
                } else if (this.selectedTool === ShapeTool.Pencil) {
                    this.currentPencilStroke.push({ x: currentX, y: currentY });
                    this.drawPencilStroke(this.currentPencilStroke);
                } else if (this.selectedTool === ShapeTool.Arrow) {
                    this.drawArrow(this.startX, this.startY, currentX, currentY);
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