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
    private readonly ERASER_RADIUS = 10;
    private isErasing = false;
    private eraserPath: { x: number; y: number }[] = [];
    private selectedShape: Shape | null = null;
    private selectedShapeIndex = -1;
    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private shapeBeforeDrag: Shape | null = null;
    private onShapeCreated?: () => void;
    private isResizing = false;
    private resizeHandle: 'tl' | 'tr' | 'bl' | 'br' | null = null;
    private shapeBeforeResize: Shape | null = null;

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

        if (tool !== ShapeTool.Pointer) {
            this.selectedShape = null;
            this.selectedShapeIndex = -1;
            this.clearCanvas();
        }

        if (tool === ShapeTool.Eraser) {
            this.updateEraserCursor();
        } else if (tool !== ShapeTool.Pointer) {
            this.canvas.style.cursor = 'default';
        }
    }

    setOnShapeCreated(cb: () => void) {
        this.onShapeCreated = cb;
    }

    async init() {
        if (this.socket.readyState !== WebSocket.OPEN) return;

        this.existingShapes = await getExistingShapes(this.roomId);
        this.clearCanvas();

        if (this.socket.readyState !== WebSocket.OPEN) return;

        this.socket.send(JSON.stringify({
            type: "join_room",
            roomId: this.roomId
        }));

        setTimeout(() => {
            if (this.socket.readyState !== WebSocket.OPEN) return;
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
                    this.existingShapes.push(parsedShape);
                    this.clearCanvas();
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

                if (message.type === "delete_shape" && message.roomId === this.roomId) {
                    const shapeToDelete = message.shape;
                    this.existingShapes = this.existingShapes.filter(shape =>
                        JSON.stringify(shape) !== JSON.stringify(shapeToDelete)
                    );
                    if (this.selectedShape && JSON.stringify(this.selectedShape) === JSON.stringify(shapeToDelete)) {
                        this.selectedShape = null;
                        this.selectedShapeIndex = -1;
                    }
                    this.clearCanvas();
                }

                if (message.type === "move_shape" && message.roomId === this.roomId) {
                    const { oldShape, newShape } = message;
                    const idx = this.existingShapes.findIndex(s =>
                        JSON.stringify(s) === JSON.stringify(oldShape)
                    );
                    if (idx !== -1) {
                        this.existingShapes[idx] = newShape;
                        if (this.selectedShapeIndex === idx) {
                            this.selectedShape = newShape;
                        }
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
        let isSpacePressed = false;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !isSpacePressed) {
                isSpacePressed = true;
                this.canvas.style.cursor = 'grab';
                e.preventDefault();
            }

            if ((e.code === 'Backspace' || e.code === 'Delete') && this.selectedShape) {
                const shapeToDelete = this.selectedShape;
                this.existingShapes = this.existingShapes.filter(s =>
                    JSON.stringify(s) !== JSON.stringify(shapeToDelete)
                );
                this.socket.send(JSON.stringify({
                    type: "delete_shape",
                    shape: shapeToDelete,
                    roomId: this.roomId
                }));
                this.selectedShape = null;
                this.selectedShapeIndex = -1;
                this.clearCanvas();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                isSpacePressed = false;
                if (!this.isPanning) {
                    if (this.selectedTool === ShapeTool.Eraser) {
                        this.updateEraserCursor();
                    } else {
                        this.canvas.style.cursor = 'default';
                    }
                }
                e.preventDefault();
            }
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
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
            } else if (e.shiftKey) {
                this.cameraX -= e.deltaY;
                this.clearCanvas();
            } else {
                this.cameraY -= e.deltaY;
                this.clearCanvas();
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
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
                if (isSpacePressed) {
                    this.canvas.style.cursor = 'grab';
                } else if (this.selectedTool === ShapeTool.Eraser) {
                    this.updateEraserCursor();
                } else {
                    this.canvas.style.cursor = 'default';
                }
            }
        };

        const preventContextMenu = (e: MouseEvent) => {
            if (e.button === 1) e.preventDefault();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        this.canvas.addEventListener('wheel', handleWheel, { passive: false });
        this.canvas.addEventListener('mousedown', handleMouseDown);
        this.canvas.addEventListener('mousemove', handleMouseMove);
        this.canvas.addEventListener('mouseup', handleMouseUp);
        this.canvas.addEventListener('contextmenu', preventContextMenu);

        this.cleanupFunctions.push(() => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
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

    private distanceToLineSegment(
        px: number, py: number,
        x1: number, y1: number,
        x2: number, y2: number
    ): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) {
            return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
        }

        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        const nearestX = x1 + t * dx;
        const nearestY = y1 + t * dy;
        return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
    }

    private isPointInShape(x: number, y: number, shape: Shape): boolean {
        if (shape.type === "rect") {
            return x >= Math.min(shape.x, shape.x + shape.width) &&
                x <= Math.max(shape.x, shape.x + shape.width) &&
                y >= Math.min(shape.y, shape.y + shape.height) &&
                y <= Math.max(shape.y, shape.y + shape.height);
        } else if (shape.type === 'circle') {
            const dx = x - shape.centerX;
            const dy = y - shape.centerY;
            return Math.sqrt(dx * dx + dy * dy) <= shape.radius;
        } else if (shape.type === 'pencil') {
            for (let i = 0; i < shape.points.length - 1; i++) {
                const dist = this.distanceToLineSegment(
                    x, y,
                    shape.points[i].x, shape.points[i].y,
                    shape.points[i + 1].x, shape.points[i + 1].y
                );
                if (dist < 5 / this.scale) return true;
            }
            return false;
        } else if (shape.type === "arrow") {
            const dist = this.distanceToLineSegment(x, y, shape.startX, shape.startY, shape.endX, shape.endY);
            return dist < 5 / this.scale;
        }
        return false;
    }

    private getShapeBounds(shape: Shape): { minX: number; minY: number; maxX: number; maxY: number } {
        if (shape.type === 'rect') {
            return {
                minX: Math.min(shape.x, shape.x + shape.width),
                minY: Math.min(shape.y, shape.y + shape.height),
                maxX: Math.max(shape.x, shape.x + shape.width),
                maxY: Math.max(shape.y, shape.y + shape.height),
            };
        } else if (shape.type === 'circle') {
            return {
                minX: shape.centerX - shape.radius,
                minY: shape.centerY - shape.radius,
                maxX: shape.centerX + shape.radius,
                maxY: shape.centerY + shape.radius,
            };
        } else if (shape.type === 'pencil') {
            const xs = shape.points.map(p => p.x);
            const ys = shape.points.map(p => p.y);
            return {
                minX: Math.min(...xs),
                minY: Math.min(...ys),
                maxX: Math.max(...xs),
                maxY: Math.max(...ys),
            };
        } else if (shape.type === 'arrow') {
            return {
                minX: Math.min(shape.startX, shape.endX),
                minY: Math.min(shape.startY, shape.endY),
                maxX: Math.max(shape.startX, shape.endX),
                maxY: Math.max(shape.startY, shape.endY),
            };
        }
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    private translateShape(shape: Shape, dx: number, dy: number): Shape {
        if (shape.type === 'rect') {
            return { ...shape, x: shape.x + dx, y: shape.y + dy };
        } else if (shape.type === 'circle') {
            return { ...shape, centerX: shape.centerX + dx, centerY: shape.centerY + dy };
        } else if (shape.type === 'pencil') {
            return { ...shape, points: shape.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
        } else if (shape.type === 'arrow') {
            return {
                ...shape,
                startX: shape.startX + dx,
                startY: shape.startY + dy,
                endX: shape.endX + dx,
                endY: shape.endY + dy,
            };
        }
        return shape;
    }

    private updateEraserCursor() {
        const radius = this.ERASER_RADIUS;
        const diameter = radius * 2;
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${diameter}' height='${diameter}' viewBox='0 0 ${diameter} ${diameter}'><circle cx='${radius}' cy='${radius}' r='${radius - 1}' fill='none' stroke='white' stroke-width='1.5'/></svg>`;
        const encoded = encodeURIComponent(svg);
        this.canvas.style.cursor = `url("data:image/svg+xml,${encoded}") ${radius} ${radius}, crosshair`;
    }

    private drawSelectionHighlight(shape: Shape) {
        const PADDING = 8;
        const bounds = this.getShapeBounds(shape);
        const topLeft = this.worldToScreen(bounds.minX, bounds.minY);
        const bottomRight = this.worldToScreen(bounds.maxX, bounds.maxY);

        const x = topLeft.x - PADDING;
        const y = topLeft.y - PADDING;
        const w = (bottomRight.x - topLeft.x) + PADDING * 2;
        const h = (bottomRight.y - topLeft.y) + PADDING * 2;

        this.ctx.save();
        this.ctx.strokeStyle = "rgba(99, 179, 237, 0.9)";
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([6, 3]);
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.fillStyle = "rgba(99, 179, 237, 0.9)";
        this.ctx.setLineDash([]);
        const hs = 8;
        [
            [x, y],
            [x + w, y],
            [x, y + h],
            [x + w, y + h],
        ].forEach(([cx, cy]) => {
            this.ctx.fillRect((cx as number) - hs / 2, (cy as number) - hs / 2, hs, hs);
        });

        this.ctx.restore();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.cameraX, this.cameraY);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        this.ctx.fillStyle = "rgba(255, 255, 255, 1)";
        this.ctx.lineWidth = 2 / this.scale;

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

        if (this.selectedShape) {
            this.drawSelectionHighlight(this.selectedShape);
        }
    }

    private eraseAlongPath(eraserPath: { x: number; y: number }[]) {
        const shapesToModify: { index: number; shape: Shape }[] = [];

        for (let i = this.existingShapes.length - 1; i >= 0; i--) {
            const shape = this.existingShapes[i];
            let intersects = false;

            for (const point of eraserPath) {
                if (this.shapeIntersectsEraser(shape, point.x, point.y)) {
                    intersects = true;
                    break;
                }
            }

            if (intersects) {
                shapesToModify.push({ index: i, shape });
            }
        }

        for (const { index, shape } of shapesToModify) {
            if (shape.type === 'pencil') {
                const newStrokes = this.splitPencilStroke(shape.points, eraserPath);
                this.existingShapes.splice(index, 1);
                this.socket.send(JSON.stringify({
                    type: "delete_shape",
                    shape: shape,
                    roomId: this.roomId
                }));

                for (const newStroke of newStrokes) {
                    if (newStroke.length >= 2) {
                        const newShape: Shape = { type: 'pencil', points: newStroke };
                        this.existingShapes.push(newShape);
                        this.socket.send(JSON.stringify({
                            type: "chat",
                            message: JSON.stringify(newShape),
                            roomId: this.roomId
                        }));
                    }
                }
            } else {
                this.existingShapes.splice(index, 1);
                this.socket.send(JSON.stringify({
                    type: "delete_shape",
                    shape: shape,
                    roomId: this.roomId
                }));
            }
        }
    }

    private shapeIntersectsEraser(shape: Shape, eraserX: number, eraserY: number): boolean {
        const radius = this.ERASER_RADIUS / this.scale;

        if (shape.type === 'pencil') {
            for (let i = 0; i < shape.points.length - 1; i++) {
                const dist = this.distanceToLineSegment(
                    eraserX, eraserY,
                    shape.points[i].x, shape.points[i].y,
                    shape.points[i + 1].x, shape.points[i + 1].y
                );
                if (dist < radius) return true;
            }
            return false;
        } else if (shape.type === 'rect') {
            const closestX = Math.max(shape.x, Math.min(eraserX, shape.x + shape.width));
            const closestY = Math.max(shape.y, Math.min(eraserY, shape.y + shape.height));
            const distX = eraserX - closestX;
            const distY = eraserY - closestY;
            return (distX * distX + distY * distY) < (radius * radius);
        } else if (shape.type === 'circle') {
            const dx = eraserX - shape.centerX;
            const dy = eraserY - shape.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < (shape.radius + radius);
        } else if (shape.type === 'arrow') {
            const dist = this.distanceToLineSegment(
                eraserX, eraserY,
                shape.startX, shape.startY,
                shape.endX, shape.endY
            );
            return dist < radius;
        }

        return false;
    }

    private splitPencilStroke(points: { x: number; y: number }[], eraserPath: { x: number; y: number }[]): { x: number; y: number }[][] {
        const radius = this.ERASER_RADIUS / this.scale;
        const segments: { x: number; y: number }[][] = [];
        let currentSegment: { x: number; y: number }[] = [];

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            let shouldErase = false;
            for (const eraserPoint of eraserPath) {
                const dx = point.x - eraserPoint.x;
                const dy = point.y - eraserPoint.y;
                if (Math.sqrt(dx * dx + dy * dy) < radius) {
                    shouldErase = true;
                    break;
                }
            }

            if (shouldErase) {
                if (currentSegment.length >= 2) segments.push(currentSegment);
                currentSegment = [];
            } else {
                currentSegment.push(point);
            }
        }

        if (currentSegment.length >= 2) segments.push(currentSegment);
        return segments;
    }

    private drawArrow(fromX: number, fromY: number, toX: number, toY: number) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        const headlen = 12 / this.scale;

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
        this.ctx.lineWidth = 2 / this.scale;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    }

    private getResizeHandle(x: number, y: number): 'tl' | 'tr' | 'bl' | 'br' | null {
        if (!this.selectedShape) return null;

        const PADDING = 8;
        const HANDLE_SIZE = 8;
        const bounds = this.getShapeBounds(this.selectedShape);
        const topLeft = this.worldToScreen(bounds.minX, bounds.minY);
        const bottomRight = this.worldToScreen(bounds.maxX, bounds.maxY);

        const handles = {
            tl: { x: topLeft.x - PADDING,     y: topLeft.y - PADDING },
            tr: { x: bottomRight.x + PADDING,  y: topLeft.y - PADDING },
            bl: { x: topLeft.x - PADDING,      y: bottomRight.y + PADDING },
            br: { x: bottomRight.x + PADDING,  y: bottomRight.y + PADDING },
        };

        for (const [key, pos] of Object.entries(handles)) {
            if (
                x >= pos.x - HANDLE_SIZE && x <= pos.x + HANDLE_SIZE &&
                y >= pos.y - HANDLE_SIZE && y <= pos.y + HANDLE_SIZE
            ) {
                return key as 'tl' | 'tr' | 'bl' | 'br';
            }
        }
        return null;
    }

    private resizeShape(shape: Shape, handle: 'tl' | 'tr' | 'bl' | 'br', screenX: number, screenY: number): Shape {
        const world = this.screenToWorld(screenX, screenY);
        const bounds = this.getShapeBounds(shape);

        let minX = bounds.minX, minY = bounds.minY;
        let maxX = bounds.maxX, maxY = bounds.maxY;

        if (handle === 'tl') { minX = world.x; minY = world.y; }
        if (handle === 'tr') { maxX = world.x; minY = world.y; }
        if (handle === 'bl') { minX = world.x; maxY = world.y; }
        if (handle === 'br') { maxX = world.x; maxY = world.y; }

        if (minX > maxX) [minX, maxX] = [maxX, minX];
        if (minY > maxY) [minY, maxY] = [maxY, minY];

        const newWidth = maxX - minX;
        const newHeight = maxY - minY;
        const oldWidth = bounds.maxX - bounds.minX;
        const oldHeight = bounds.maxY - bounds.minY;
        const scaleX = oldWidth === 0 ? 1 : newWidth / oldWidth;
        const scaleY = oldHeight === 0 ? 1 : newHeight / oldHeight;

        if (shape.type === 'rect') {
            return { ...shape, x: minX, y: minY, width: newWidth, height: newHeight };
        }
        if (shape.type === 'circle') {
            const rx = newWidth / 2;
            const ry = newHeight / 2;
            const radius = Math.max(rx, ry);
            return { ...shape, centerX: minX + rx, centerY: minY + ry, radius };
        }
        if (shape.type === 'pencil') {
            const points = shape.points.map(p => ({
                x: minX + (p.x - bounds.minX) * scaleX,
                y: minY + (p.y - bounds.minY) * scaleY,
            }));
            return { ...shape, points };
        }
        if (shape.type === 'arrow') {
            return {
                ...shape,
                startX: minX + (shape.startX - bounds.minX) * scaleX,
                startY: minY + (shape.startY - bounds.minY) * scaleY,
                endX:   minX + (shape.endX   - bounds.minX) * scaleX,
                endY:   minY + (shape.endY   - bounds.minY) * scaleY,
            };
        }
        return shape;
    }

    initMouseHandlers() {
        const handleMouseDown = (e: MouseEvent) => {
            if (this.isPanning || e.button === 1) return;

            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const world = this.screenToWorld(screenX, screenY);

            if (this.selectedShape && this.selectedTool === ShapeTool.Pointer) {
                const handle = this.getResizeHandle(screenX, screenY);
                if (handle) {
                    this.isResizing = true;
                    this.resizeHandle = handle;
                    this.shapeBeforeResize = structuredClone(this.selectedShape);
                    return;
                }
            }

            if (this.selectedTool === ShapeTool.Pointer) {
                let hitShape: Shape | null = null;
                let hitIndex = -1;
                for (let i = this.existingShapes.length - 1; i >= 0; i--) {
                    if (this.isPointInShape(world.x, world.y, this.existingShapes[i])) {
                        hitShape = this.existingShapes[i];
                        hitIndex = i;
                        break;
                    }
                }

                if (hitShape) {
                    this.selectedShape = hitShape;
                    this.selectedShapeIndex = hitIndex;
                    this.isDragging = true;
                    this.dragStartX = world.x;
                    this.dragStartY = world.y;
                    this.shapeBeforeDrag = JSON.parse(JSON.stringify(hitShape));
                    this.canvas.style.cursor = 'grabbing';
                } else {
                    this.selectedShape = null;
                    this.selectedShapeIndex = -1;
                }

                this.clearCanvas();
                return;
            }

            if (this.selectedTool === ShapeTool.Eraser) {
                this.isErasing = true;
                this.eraserPath = [{ x: world.x, y: world.y }];
                return;
            }

            this.clicked = true;
            this.startX = world.x;
            this.startY = world.y;

            if (this.selectedTool === ShapeTool.Pencil) {
                this.currentPencilStroke = [{ x: this.startX, y: this.startY }];
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (this.isResizing && this.shapeBeforeResize && this.selectedShape) {
                this.isResizing = false;
                this.resizeHandle = null;

                if (JSON.stringify(this.shapeBeforeResize) !== JSON.stringify(this.selectedShape)) {
                    this.socket.send(JSON.stringify({
                        type: "move_shape",
                        oldShape: this.shapeBeforeResize,
                        newShape: this.selectedShape,
                        roomId: this.roomId
                    }));
                }
                this.shapeBeforeResize = null;
                return;
            }

            if (this.isDragging && this.selectedShape && this.shapeBeforeDrag) {
                this.isDragging = false;
                this.canvas.style.cursor = 'move';

                const oldShape = this.shapeBeforeDrag;
                const newShape = this.selectedShape;
                if (JSON.stringify(oldShape) !== JSON.stringify(newShape)) {
                    this.socket.send(JSON.stringify({
                        type: "move_shape",
                        oldShape,
                        newShape,
                        roomId: this.roomId
                    }));
                }

                this.shapeBeforeDrag = null;
                return;
            }

            if (this.isErasing) {
                this.isErasing = false;
                if (this.eraserPath.length > 0) {
                    this.eraseAlongPath(this.eraserPath);
                    this.eraserPath = [];
                    this.clearCanvas();
                }
                return;
            }

            if (!this.clicked || this.selectedTool === ShapeTool.Pointer) {
                this.clicked = false;
                return;
            }

            this.clicked = false;
            const rect = this.canvas.getBoundingClientRect();
            const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
            this.endX = world.x;
            this.endY = world.y;

            const width = this.endX - this.startX;
            const height = this.endY - this.startY;

            let shape: Shape;

            if (this.selectedTool === ShapeTool.Rectangle) {
                shape = { type: 'rect', x: this.startX, y: this.startY, height, width };
            } else if (this.selectedTool === ShapeTool.Circle) {
                const radius = Math.sqrt(width * width + height * height) / 2;
                shape = {
                    type: 'circle',
                    centerX: this.startX + width / 2,
                    centerY: this.startY + height / 2,
                    radius
                };
            } else if (this.selectedTool === ShapeTool.Pencil) {
                this.currentPencilStroke.push({ x: this.endX, y: this.endY });
                shape = { type: 'pencil', points: this.currentPencilStroke };
                this.currentPencilStroke = [];
            } else if (this.selectedTool === ShapeTool.Arrow) {
                shape = {
                    type: "arrow",
                    startX: this.startX,
                    startY: this.startY,
                    endX: this.endX,
                    endY: this.endY
                };
            } else {
                return;
            }

            this.existingShapes.push(shape);
            this.clearCanvas();
            this.onShapeCreated?.();

            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify(shape),
                roomId: this.roomId
            }));
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const world = this.screenToWorld(screenX, screenY);

            if (this.isResizing && this.resizeHandle && this.selectedShape) {
                const resized = this.resizeShape(this.selectedShape, this.resizeHandle, screenX, screenY);
                if (this.selectedShapeIndex !== -1) {
                    this.existingShapes[this.selectedShapeIndex] = resized;
                }
                this.selectedShape = resized;
                this.clearCanvas();
                return;
            }

            if (this.isDragging && this.selectedShape) {
                const dx = world.x - this.dragStartX;
                const dy = world.y - this.dragStartY;
                const movedShape = this.translateShape(this.selectedShape, dx, dy);
                if (this.selectedShapeIndex !== -1) {
                    this.existingShapes[this.selectedShapeIndex] = movedShape;
                }
                this.selectedShape = movedShape;
                this.dragStartX = world.x;
                this.dragStartY = world.y;
                this.clearCanvas();
                return;
            }

            if (this.selectedTool === ShapeTool.Pointer) {
                const handle = this.selectedShape ? this.getResizeHandle(screenX, screenY) : null;
                if (handle) {
                    const cursors: Record<string, string> = {
                        tl: 'nwse-resize', tr: 'nesw-resize',
                        bl: 'nesw-resize',  br: 'nwse-resize'
                    };
                    this.canvas.style.cursor = cursors[handle];
                } else {
                    const hovering = this.existingShapes.some(s => this.isPointInShape(world.x, world.y, s));
                    this.canvas.style.cursor = hovering ? 'move' : 'default';
                }
            }

            if (this.isErasing) {
                this.eraserPath.push({ x: world.x, y: world.y });
                this.clearCanvas();
                return;
            }

            if (this.clicked && !this.isPanning) {
                const width = world.x - this.startX;
                const height = world.y - this.startY;

                this.clearCanvas();
                this.ctx.save();
                this.ctx.translate(this.cameraX, this.cameraY);
                this.ctx.scale(this.scale, this.scale);
                this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
                this.ctx.lineWidth = 2 / this.scale;

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
                    this.currentPencilStroke.push({ x: world.x, y: world.y });
                    this.drawPencilStroke(this.currentPencilStroke);
                } else if (this.selectedTool === ShapeTool.Arrow) {
                    this.drawArrow(this.startX, this.startY, world.x, world.y);
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