import { ShapeTool } from "@/components/Navbar";
import { getExistingShapes } from "./http";
import { Shape, Camera } from "./types";
import { CanvasRenderer } from "./canvas-renderer";
import { InfiniteCanvas } from "./infinite-canvas";
import { MouseHandler } from "./mouse-handler";

const ERASER_RADIUS = 10;
const CURSOR_COLORS = ['#f97316', '#22c55e', '#3b82f6', '#e11d48', '#a855f7', '#14b8a6', '#eab308', '#ec4899'];

export interface RemoteCursor {
    userId: string;
    name: string;
    screenX: number;
    screenY: number;
    color: string;
}

export interface RemotePreview {
    userId: string;
    name: string;
    color: string;
    tool: ShapeTool;
    startX: number;
    startY: number;
    worldX: number;
    worldY: number;
    pencilPoints: { x: number; y: number }[];
}

export interface RemoteSelection {
    userId: string;
    name: string;
    color: string;
    shapeId: string;
}

export interface PresenceUser {
    userId: string;
    name: string;
    color: string;
}

function colorForUserId(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

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

    private remoteCursors: Map<string, { name: string; x: number; y: number }> = new Map();
    private onCursorsUpdateCb?: (cursors: RemoteCursor[]) => void;
    private lastCursorSent = 0;

    private remotePreviews: Map<string, { name: string; color: string; tool: ShapeTool; startX: number; startY: number; worldX: number; worldY: number; pencilPoints: { x: number; y: number }[] }> = new Map();
    private onRemotePreviewsUpdateCb?: (previews: RemotePreview[]) => void;
    private lastPreviewSent = 0;

    private remoteSelections: Map<string, { name: string; color: string; shapeId: string }> = new Map();
    private onRemoteSelectionsUpdateCb?: (selections: RemoteSelection[]) => void;

    private presence: Map<string, string> = new Map();
    private onPresenceUpdateCb?: (users: PresenceUser[]) => void;

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
                this.broadcastSelection(shape ? shape.id : null);
            },
            onShapeCreated: (shape) => this.broadcastShape(shape),
            onShapeMoved: (oldShape, newShape) => this.broadcastMove(oldShape, newShape),
            onShapeDeleted: (shape) => this.broadcastDelete(shape),
            onRedraw: () => this.redraw(),
            onToolCreated: () => this.onShapeCreatedCb?.(),
        });

        this.initWebSocket();
        this.initCursorBroadcast();
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
            this.broadcastSelection(null);
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

    setOnCursorsUpdate(cb: (cursors: RemoteCursor[]) => void) {
        this.onCursorsUpdateCb = cb;
    }

    setOnRemotePreviewsUpdate(cb: (previews: RemotePreview[]) => void) {
        this.onRemotePreviewsUpdateCb = cb;
    }

    setOnRemoteSelectionsUpdate(cb: (selections: RemoteSelection[]) => void) {
        this.onRemoteSelectionsUpdateCb = cb;
    }

    setOnPresenceUpdate(cb: (users: PresenceUser[]) => void) {
        this.onPresenceUpdateCb = cb;
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
            this.throttledBroadcastPreview(preview);
        } else {
            this.throttledBroadcastPreview(null);
        }

        this.remotePreviews.forEach((p) => {
            if (p.tool === ShapeTool.Pencil) {
                this.renderer.drawPencilPreview(p.pencilPoints, this.camera, p.color);
            } else {
                const toolToType: Partial<Record<ShapeTool, string>> = {
                    [ShapeTool.Rectangle]: 'rect',
                    [ShapeTool.Circle]: 'circle',
                    [ShapeTool.Arrow]: 'arrow',
                };
                const type = toolToType[p.tool];
                if (type) this.renderer.drawShapePreview(type, p.startX, p.startY, p.worldX, p.worldY, this.camera, p.color);
            }
        });

        this.remoteSelections.forEach((sel) => {
            const shape = this.shapes.find(s => s.id === sel.shapeId);
            if (shape) this.renderer.drawRemoteSelection(shape, this.camera, sel.color, sel.name);
        });

        this.emitCursors();
    }

    private async init() {
        if (this.socket.readyState !== WebSocket.OPEN) return;
        this.shapes = await getExistingShapes(this.roomId);
        this.redraw();
        this.socket.send(JSON.stringify({ type: "join_room", roomId: this.roomId }));
        this.socket.send(JSON.stringify({ type: "request_canvas_state", roomId: this.roomId }));
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
        this.broadcastSelection(null);
        this.redraw();
    }

    private broadcastShape(shape: Shape) {
        this.socket.send(JSON.stringify({ type: "shape_add", shape, roomId: this.roomId }));
    }

    private broadcastMove(oldShape: Shape, newShape: Shape) {
        this.socket.send(JSON.stringify({
            type: "move_shape",
            shapeId: oldShape.id,
            newShape,
            roomId: this.roomId,
        }));
    }

    private broadcastDelete(shape: Shape) {
        this.socket.send(JSON.stringify({
            type: "delete_shape",
            shapeId: shape.id,
            roomId: this.roomId,
        }));
    }

    private broadcastSelection(shapeId: string | null) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: "shape_select", roomId: this.roomId, shapeId }));
        }
    }

    private throttledBroadcastPreview(preview: typeof this.mouseHandler._previewState) {
        const now = Date.now();
        if (now - this.lastPreviewSent < 50) return;
        this.lastPreviewSent = now;
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: "shape_preview", roomId: this.roomId, preview }));
        }
    }

    private initWebSocket() {
        const handler = (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data);

                if (msg.type === "shape_add" && msg.roomId === this.roomId) {
                    this.shapes.push(msg.shape);
                    this.redraw();
                }
                if (msg.type === "send_canvas_state" && msg.roomId === this.roomId) {
                    this.socket.send(JSON.stringify({ type: "canvas_state", roomId: this.roomId, canvasData: this.shapes, requesterId: msg.requesterId }));
                }
                if (msg.type === "canvas_state" && msg.roomId === this.roomId && Array.isArray(msg.shapes)) {
                    const existingIds = new Set(this.shapes.map(s => s.id));
                    msg.shapes.forEach((s: Shape) => { if (!existingIds.has(s.id)) this.shapes.push(s); });
                    this.redraw();
                }
                if (msg.type === "delete_shape" && msg.roomId === this.roomId) {
                    this.shapes = this.shapes.filter(s => s.id !== msg.shapeId);
                    if (this.selectedShape?.id === msg.shapeId) {
                        this.selectedShape = null;
                        this.selectedShapeIndex = -1;
                    }
                    this.redraw();
                }
                if (msg.type === "move_shape" && msg.roomId === this.roomId) {
                    const idx = this.shapes.findIndex(s => s.id === msg.shapeId);
                    if (idx !== -1) {
                        this.shapes[idx] = msg.newShape;
                        if (this.selectedShapeIndex === idx) this.selectedShape = msg.newShape;
                        this.redraw();
                    }
                }
                if (msg.type === "cursor_move" && msg.roomId === this.roomId) {
                    this.remoteCursors.set(msg.userId, { name: msg.name, x: msg.x, y: msg.y });
                    this.emitCursors();
                }
                if (msg.type === "room_users" && msg.roomId === this.roomId) {
                    (msg.users as { userId: string; name: string }[]).forEach(u => this.presence.set(u.userId, u.name));
                    this.emitPresence();
                }
                if (msg.type === "user_joined" && msg.roomId === this.roomId) {
                    this.presence.set(msg.userId, msg.name);
                    this.emitPresence();
                }
                if (msg.type === "user_left" && msg.roomId === this.roomId) {
                    this.remoteCursors.delete(msg.userId);
                    this.remotePreviews.delete(msg.userId);
                    this.remoteSelections.delete(msg.userId);
                    this.presence.delete(msg.userId);
                    this.emitCursors();
                    this.emitRemotePreviews();
                    this.emitRemoteSelections();
                    this.emitPresence();
                }
                if (msg.type === "shape_preview" && msg.roomId === this.roomId) {
                    if (msg.preview === null) {
                        this.remotePreviews.delete(msg.userId);
                    } else {
                        this.remotePreviews.set(msg.userId, { ...msg.preview, name: msg.name, color: colorForUserId(msg.userId) });
                    }
                    this.emitRemotePreviews();
                }
                if (msg.type === "shape_select" && msg.roomId === this.roomId) {
                    if (msg.shapeId === null) {
                        this.remoteSelections.delete(msg.userId);
                    } else {
                        this.remoteSelections.set(msg.userId, { name: msg.name, color: colorForUserId(msg.userId), shapeId: msg.shapeId });
                    }
                    this.emitRemoteSelections();
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

    private emitCursors() {
        if (!this.onCursorsUpdateCb) return;
        const cursors: RemoteCursor[] = Array.from(this.remoteCursors.entries()).map(([userId, c]) => ({
            userId,
            name: c.name,
            screenX: c.x * this.camera.scale + this.camera.x,
            screenY: c.y * this.camera.scale + this.camera.y,
            color: colorForUserId(userId),
        }));
        this.onCursorsUpdateCb(cursors);
    }

    private emitRemotePreviews() {
        if (!this.onRemotePreviewsUpdateCb) return;
        const list: RemotePreview[] = Array.from(this.remotePreviews.entries()).map(([userId, p]) => ({
            userId,
            name: p.name,
            color: p.color,
            tool: p.tool,
            startX: p.startX,
            startY: p.startY,
            worldX: p.worldX,
            worldY: p.worldY,
            pencilPoints: p.pencilPoints,
        }));
        this.onRemotePreviewsUpdateCb(list);
    }

    private emitRemoteSelections() {
        if (!this.onRemoteSelectionsUpdateCb) return;
        const list: RemoteSelection[] = Array.from(this.remoteSelections.entries()).map(([userId, s]) => ({
            userId,
            name: s.name,
            color: s.color,
            shapeId: s.shapeId,
        }));
        this.onRemoteSelectionsUpdateCb(list);
    }

    private emitPresence() {
        if (!this.onPresenceUpdateCb) return;
        const list: PresenceUser[] = Array.from(this.presence.entries())
            .filter(([, name]) => !!name)
            .map(([userId, name]) => ({
                userId,
                name,
                color: colorForUserId(userId),
            }));
        this.onPresenceUpdateCb(list);
    }

    private initCursorBroadcast() {
        const handler = (e: MouseEvent) => {
            const now = Date.now();
            if (now - this.lastCursorSent < 50) return;
            this.lastCursorSent = now;

            const rect = this.canvas.getBoundingClientRect();
            const worldX = (e.clientX - rect.left - this.camera.x) / this.camera.scale;
            const worldY = (e.clientY - rect.top - this.camera.y) / this.camera.scale;

            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ type: "cursor_move", roomId: this.roomId, x: worldX, y: worldY }));
            }
        };
        this.canvas.addEventListener("mousemove", handler);
        this.cleanupFns.push(() => this.canvas.removeEventListener("mousemove", handler));
    }
}