import { ShapeTool } from "@/components/Navbar";
import { getExistingShapes } from "./http";
import { Shape, Camera } from "./types";
import { CanvasRenderer } from "./canvas-renderer";
import { InfiniteCanvas } from "./infinite-canvas";
import { MouseHandler } from "./mouse-handler";

const ERASER_RADIUS = 10;

export class Game {
    private shapes: Shape[] = [];
    private camera: Camera = { x: 0, y: 0, scale: 1 };
    private selectedShape: Shape | null = null;
    private selectedShapeIndex = -1;
    private selectedTool: ShapeTool = ShapeTool.Rectangle;

    private renderer: CanvasRenderer;
    private infiniteCanvas: InfiniteCanvas;
    private mouseHandler: MouseHandler;
    private cleanupFns: (() => void)[] = [];
    private onShapeCreatedCb?: () => void;

    constructor(
        private canvas: HTMLCanvasElement,
        private roomId: string,
        private socket: WebSocket,
    ) {
        const ctx = canvas.getContext("2d")!;
        this.renderer = new CanvasRenderer(ctx, canvas);

        this.infiniteCanvas = new InfiniteCanvas({
            canvas,
            getCamera: () => this.camera,
            setCamera: (cam) => { this.camera = cam; },
            getSelectedTool: () => this.selectedTool,
            getSelectedShapeExists: () => this.selectedShape !== null,
            onDeleteSelected: () => this.deleteSelected(),
            onRedraw: () => this.redraw(),
            eraserCursor: this.renderer.getEraserCursor(ERASER_RADIUS),
        });

        this.mouseHandler = new MouseHandler({
            canvas,
            getCamera: () => this.camera,
            getShapes: () => this.shapes,
            setShapes: (shapes) => { this.shapes = shapes; },
            getSelectedTool: () => this.selectedTool,
            getIsPanning: () => this.infiniteCanvas.panning,
            selectedShape: this.selectedShape,
            selectedShapeIndex: this.selectedShapeIndex,
            onSelectShape: (shape, index) => {
                this.selectedShape = shape;
                this.selectedShapeIndex = index;
                this.mouseHandler.opts.selectedShape = shape;
                this.mouseHandler.opts.selectedShapeIndex = index;
            },
            onShapeCreated: (shape) => this.broadcastShape(shape),
            onShapeMoved: (oldShape, newShape) => this.broadcastMove(oldShape, newShape),
            onShapeDeleted: (shape) => this.broadcastDelete(shape),
            onRedraw: () => this.redraw(),
            onToolCreated: () => this.onShapeCreatedCb?.(),
        });

        this.initWebSocket();
        this.initResizeCanvas();
        this.init();
    }

    setTool(tool: ShapeTool) {
        this.selectedTool = tool;
        if (tool !== ShapeTool.Pointer) {
            this.selectedShape = null;
            this.selectedShapeIndex = -1;
            this.mouseHandler.opts.selectedShape = null;
            this.mouseHandler.opts.selectedShapeIndex = -1;
            this.redraw();
        }
        if (tool === ShapeTool.Eraser) {
            this.canvas.style.cursor = this.renderer.getEraserCursor(ERASER_RADIUS);
        } else if (tool !== ShapeTool.Pointer) {
            this.canvas.style.cursor = 'default';
        }
    }

    setOnShapeCreated(cb: () => void) {
        this.onShapeCreatedCb = cb;
    }

    getScale() { return this.camera.scale; }

    zoom(delta: number) { this.infiniteCanvas.zoom(delta, this.canvas); }

    resetView() { this.infiniteCanvas.resetView(); }

    cleanup() {
        this.infiniteCanvas.cleanup();
        this.mouseHandler.cleanup();
        this.cleanupFns.forEach(fn => fn());
    }

    private redraw() {
        this.renderer.render(this.shapes, this.camera, this.selectedShape);
        const preview = this.mouseHandler._previewState;
        if (preview) {
            if (preview.tool === ShapeTool.Pencil) {
                this.renderer.drawPencilPreview(preview.pencilPoints, this.camera);
            } else {
                const toolToType: Partial<Record<ShapeTool, string>> = {
                    [ShapeTool.Rectangle]: 'rect',
                    [ShapeTool.Circle]: 'circle',
                    [ShapeTool.Arrow]: 'arrow',
                };
                const type = toolToType[preview.tool];
                if (type) this.renderer.drawShapePreview(type, preview.startX, preview.startY, preview.worldX, preview.worldY, this.camera);
            }
        }
    }

    private async init() {
        if (this.socket.readyState !== WebSocket.OPEN) return;
        this.shapes = await getExistingShapes(this.roomId);
        this.redraw();
        if (this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({ type: "join_room", roomId: this.roomId }));
        setTimeout(() => {
            if (this.socket.readyState !== WebSocket.OPEN) return;
            this.socket.send(JSON.stringify({ type: "request_canvas_state", roomId: this.roomId }));
        }, 200);
    }

    private deleteSelected() {
        if (!this.selectedShape) return;
        const shape = this.selectedShape;
        this.shapes = this.shapes.filter(s => JSON.stringify(s) !== JSON.stringify(shape));
        this.broadcastDelete(shape);
        this.selectedShape = null;
        this.selectedShapeIndex = -1;
        this.mouseHandler.opts.selectedShape = null;
        this.mouseHandler.opts.selectedShapeIndex = -1;
        this.redraw();
    }

    private broadcastShape(shape: Shape) {
        this.socket.send(JSON.stringify({ type: "chat", message: JSON.stringify(shape), roomId: this.roomId }));
    }

    private broadcastMove(oldShape: Shape, newShape: Shape) {
        this.socket.send(JSON.stringify({ type: "move_shape", oldShape, newShape, roomId: this.roomId }));
    }

    private broadcastDelete(shape: Shape) {
        this.socket.send(JSON.stringify({ type: "delete_shape", shape, roomId: this.roomId }));
    }

    private initWebSocket() {
        const handler = (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data);

                if (msg.type === "chat" && msg.roomId === this.roomId) {
                    this.shapes.push(JSON.parse(msg.message));
                    this.redraw();
                }
                if (msg.type === "send_canvas_state" && msg.roomId === this.roomId) {
                    this.socket.send(JSON.stringify({ type: "canvas_state", roomId: this.roomId, canvasData: this.shapes, requesterId: msg.requesterId }));
                }
                if (msg.type === "canvas_state" && msg.roomId === this.roomId && Array.isArray(msg.canvasData)) {
                    const existing = new Set(this.shapes.map(s => JSON.stringify(s)));
                    msg.canvasData.forEach((s: Shape) => { if (!existing.has(JSON.stringify(s))) this.shapes.push(s); });
                    this.redraw();
                }
                if (msg.type === "delete_shape" && msg.roomId === this.roomId) {
                    this.shapes = this.shapes.filter(s => JSON.stringify(s) !== JSON.stringify(msg.shape));
                    if (JSON.stringify(this.selectedShape) === JSON.stringify(msg.shape)) {
                        this.selectedShape = null;
                        this.selectedShapeIndex = -1;
                    }
                    this.redraw();
                }
                if (msg.type === "move_shape" && msg.roomId === this.roomId) {
                    const idx = this.shapes.findIndex(s => JSON.stringify(s) === JSON.stringify(msg.oldShape));
                    if (idx !== -1) {
                        this.shapes[idx] = msg.newShape;
                        if (this.selectedShapeIndex === idx) this.selectedShape = msg.newShape;
                        this.redraw();
                    }
                }
            } catch (err) {
                console.error("WebSocket message error:", err);
            }
        };

        this.socket.addEventListener("message", handler);
        this.cleanupFns.push(() => this.socket.removeEventListener("message", handler));
    }

    private initResizeCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.redraw();
        };
        resize();
        window.addEventListener("resize", resize);
        this.cleanupFns.push(() => window.removeEventListener("resize", resize));
    }
}