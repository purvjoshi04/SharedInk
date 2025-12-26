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
    private messageHandler: ((event: MessageEvent) => void) | null = null;
    private cameraX = 0;
    private cameraY = 0;
    private scale = 1;
    private isPanning = false;
    private panStartX = 0;
    private panStartY = 0;
    private lastPanX = 0;
    private lastPanY = 0;
    private readonly MIN_SCALE = 0.1;
    private readonly MAX_SCALE = 5;
    private readonly ZOOM_SENSITIVITY = 0.009;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.initHandlers();
        this.init();
        this.initMouseHandlers();
        this.initResizeCanvas();
        this.initInfiniteCanvas();
    }

    setTool(tool: ShapeTool) {
        this.selectedTool = tool;
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        this.clearCanvas();

        this.socket.send(JSON.stringify({
            type: "join_room",
            roomId: this.roomId
        }));

        setTimeout(() => {
            this.socket.send(JSON.stringify({
                type: "request_canvas_state",
                roomId: this.roomId
            }));
        }, 200);
    }

    initHandlers() {
        this.messageHandler = (event: MessageEvent) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === "chat" && message.roomId === this.roomId) {
                    const parsedShape = JSON.parse(message.message);

                    const shapeExists = this.existingShapes.some(s =>
                        JSON.stringify(s) === JSON.stringify(parsedShape)
                    );

                    if (!shapeExists) {
                        this.existingShapes.push(parsedShape);
                        this.clearCanvas();
                    }
                }

                if (message.type === "send_canvas_state" && message.roomId === this.roomId) {
                    this.socket.send(JSON.stringify({
                        type: "canvas_state",
                        roomId: this.roomId,
                        canvasData: this.existingShapes,
                        requesterId: message.requesterId
                    }));
                }

                if (message.type === "canvas_state" && message.roomId === this.roomId) {
                    if (message.canvasData && Array.isArray(message.canvasData) && message.canvasData.length > 0) {
                        const existingShapesSet = new Set(
                            this.existingShapes.map(s => JSON.stringify(s))
                        );

                        message.canvasData.forEach((shape: Shape) => {
                            const shapeStr = JSON.stringify(shape);
                            if (!existingShapesSet.has(shapeStr)) {
                                this.existingShapes.push(shape);
                                existingShapesSet.add(shapeStr);
                            }
                        });

                        this.clearCanvas();
                    }
                }
            } catch (error) {
                console.error("Error handling WebSocket message:", error);
            }
        };

        this.socket.addEventListener("message", this.messageHandler);

        this.cleanupFunctions.push(() => {
            if (this.messageHandler) {
                this.socket.removeEventListener("message", this.messageHandler);
            }
        });
    }

    initInfiniteCanvas() {
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.shiftKey) {
                this.cameraX -= e.deltaY;
                this.clearCanvas();
            } else {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const worldX = (mouseX - this.cameraX) / this.scale;
                const worldY = (mouseY - this.cameraY) / this.scale;
                const zoomFactor = e.deltaY * this.ZOOM_SENSITIVITY;
                const newScale = Math.min(
                    Math.max(this.scale * (1 - zoomFactor), this.MIN_SCALE),
                    this.MAX_SCALE
                );

                this.cameraX = mouseX - worldX * newScale;
                this.cameraY = mouseY - worldY * newScale;
                this.scale = newScale;

                this.clearCanvas();
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
                e.preventDefault();
                this.isPanning = true;
                this.panStartX = e.clientX;
                this.panStartY = e.clientY;
                this.lastPanX = this.cameraX;
                this.lastPanY = this.cameraY;
                this.canvas.style.cursor = 'grabbing';
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (this.isPanning) {
                e.preventDefault();
                const dx = e.clientX - this.panStartX;
                const dy = e.clientY - this.panStartY;
                this.cameraX = this.lastPanX + dx;
                this.cameraY = this.lastPanY + dy;
                this.clearCanvas();
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (e.button === 1 || (e.button === 0 && this.isPanning)) {
                this.isPanning = false;
                this.canvas.style.cursor = 'default';
            }
        };

        const preventContextMenu = (e: MouseEvent) => {
            if (e.button === 1) {
                e.preventDefault();
            }
        };

        this.canvas.addEventListener('wheel', handleWheel, { passive: false });
        this.canvas.addEventListener('mousedown', handleMouseDown);
        this.canvas.addEventListener('mousemove', handleMouseMove);
        this.canvas.addEventListener('mouseup', handleMouseUp);
        this.canvas.addEventListener('contextmenu', preventContextMenu);

        this.cleanupFunctions.push(() => {
            this.canvas.removeEventListener('wheel', handleWheel);
            this.canvas.removeEventListener('mousedown', handleMouseDown);
            this.canvas.removeEventListener('mousemove', handleMouseMove);
            this.canvas.removeEventListener('mouseup', handleMouseUp);
            this.canvas.removeEventListener('contextmenu', preventContextMenu);
        });
    }

    private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        return {
            x: (screenX - this.cameraX) / this.scale,
            y: (screenY - this.cameraY) / this.scale
        };
    }

    private worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
        return {
            x: worldX * this.scale + this.cameraX,
            y: worldY * this.scale + this.cameraY
        };
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.cameraX, this.cameraY);
        this.ctx.scale(this.scale, this.scale);

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

        this.ctx.restore();
    }

    private drawArrow(fromX: number, fromY: number, toX: number, toY: number) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        const headlen = 12;
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
    }

    initMouseHandlers() {
        const handleMouseDown = (e: MouseEvent) => {
            if (this.isPanning || e.button === 1 || e.shiftKey) return;
            if (this.selectedTool === ShapeTool.Pointer) return;

            this.clicked = true;
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const world = this.screenToWorld(screenX, screenY);
            this.startX = world.x;
            this.startY = world.y;

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
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const world = this.screenToWorld(screenX, screenY);
            this.endX = world.x;
            this.endY = world.y;

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
            if (this.clicked && !this.isPanning) {
                const rect = this.canvas.getBoundingClientRect();
                const screenX = e.clientX - rect.left;
                const screenY = e.clientY - rect.top;
                const world = this.screenToWorld(screenX, screenY);
                const currentX = world.x;
                const currentY = world.y;

                const width = currentX - this.startX;
                const height = currentY - this.startY;

                this.clearCanvas();
                this.ctx.save();
                this.ctx.translate(this.cameraX, this.cameraY);
                this.ctx.scale(this.scale, this.scale);
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

                this.ctx.restore();
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

    public getScale(): number {
        return this.scale;
    }

    public zoom(delta: number): void {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const worldX = (centerX - this.cameraX) / this.scale;
        const worldY = (centerY - this.cameraY) / this.scale;
        const newScale = Math.min(
            Math.max(this.scale * (1 + delta), this.MIN_SCALE),
            this.MAX_SCALE
        );

        this.cameraX = centerX - worldX * newScale;
        this.cameraY = centerY - worldY * newScale;
        this.scale = newScale;

        this.clearCanvas();
    }

    public resetView(): void {
        this.cameraX = 0;
        this.cameraY = 0;
        this.scale = 1;
        this.clearCanvas();
    }

    cleanup() {
        this.cleanupFunctions.forEach(fn => fn());
    }
}