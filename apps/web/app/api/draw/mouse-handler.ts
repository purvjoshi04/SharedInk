import { ShapeTool } from "@/components/Navbar";
import { Shape, ResizeHandle, Camera } from "./types";
import { isPointInShape, translateShape, resizeShape, getShapeBounds, shapeIntersectsEraser, splitPencilStroke } from "./shape-utils";

const ERASER_RADIUS = 10;
const HANDLE_SIZE = 8;
const SELECTION_PADDING = 8;

const RESIZE_CURSORS: Record<ResizeHandle, string> = {
    tl: 'nwse-resize', tr: 'nesw-resize',
    bl: 'nesw-resize',  br: 'nwse-resize',
};

interface MouseHandlerOptions {
    canvas: HTMLCanvasElement;
    getCamera: () => Camera;
    getShapes: () => Shape[];
    setShapes: (shapes: Shape[]) => void;
    getSelectedTool: () => ShapeTool;
    getIsPanning: () => boolean;
    selectedShape: Shape | null;
    selectedShapeIndex: number;
    onSelectShape: (shape: Shape | null, index: number) => void;
    onShapeCreated: (shape: Shape) => void;
    onShapeMoved: (oldShape: Shape, newShape: Shape) => void;
    onShapeDeleted: (shape: Shape) => void;
    onRedraw: () => void;
    onToolCreated: () => void;
}

export class MouseHandler {
    private clicked = false;
    private startX = 0;
    private startY = 0;
    private currentPencilStroke: { x: number; y: number }[] = [];

    private isDragging = false;
    private dragStartX = 0;
    private dragStartY = 0;
    private shapeBeforeDrag: Shape | null = null;

    private isResizing = false;
    private resizeHandle: ResizeHandle | null = null;
    private shapeBeforeResize: Shape | null = null;

    private isErasing = false;
    private eraserPath: { x: number; y: number }[] = [];

    private cleanupFns: (() => void)[] = [];

    constructor(public opts: MouseHandlerOptions) {
        this.init();
    }

    private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        const cam = this.opts.getCamera();
        return { x: (screenX - cam.x) / cam.scale, y: (screenY - cam.y) / cam.scale };
    }

    private getResizeHandle(screenX: number, screenY: number): ResizeHandle | null {
        const shape = this.opts.selectedShape;
        if (!shape) return null;

        const cam = this.opts.getCamera();
        const bounds = getShapeBounds(shape);
        const tl = { x: bounds.minX * cam.scale + cam.x, y: bounds.minY * cam.scale + cam.y };
        const br = { x: bounds.maxX * cam.scale + cam.x, y: bounds.maxY * cam.scale + cam.y };

        const handles: Record<ResizeHandle, { x: number; y: number }> = {
            tl: { x: tl.x - SELECTION_PADDING, y: tl.y - SELECTION_PADDING },
            tr: { x: br.x + SELECTION_PADDING, y: tl.y - SELECTION_PADDING },
            bl: { x: tl.x - SELECTION_PADDING, y: br.y + SELECTION_PADDING },
            br: { x: br.x + SELECTION_PADDING, y: br.y + SELECTION_PADDING },
        };

        for (const [key, pos] of Object.entries(handles)) {
            if (Math.abs(screenX - pos.x) <= HANDLE_SIZE && Math.abs(screenY - pos.y) <= HANDLE_SIZE) {
                return key as ResizeHandle;
            }
        }
        return null;
    }

    private eraseAlongPath(path: { x: number; y: number }[]) {
        const shapes = this.opts.getShapes();
        const cam = this.opts.getCamera();
        const radius = ERASER_RADIUS / cam.scale;
        const toProcess: { index: number; shape: Shape }[] = [];

        for (let i = shapes.length - 1; i >= 0; i--) {
            if (path.some(p => shapeIntersectsEraser(shapes[i], p.x, p.y, radius))) {
                toProcess.push({ index: i, shape: shapes[i] });
            }
        }

        for (const { index, shape } of toProcess) {
            if (shape.type === 'pencil') {
                const newStrokes = splitPencilStroke(shape.points, path, radius);
                shapes.splice(index, 1);
                this.opts.onShapeDeleted(shape);
                for (const pts of newStrokes) {
                    if (pts.length >= 2) {
                        const newShape: Shape = { type: 'pencil', points: pts };
                        shapes.push(newShape);
                        this.opts.onShapeCreated(newShape);
                    }
                }
            } else {
                shapes.splice(index, 1);
                this.opts.onShapeDeleted(shape);
            }
        }

        this.opts.setShapes([...shapes]);
    }

    private init() {
        const { canvas } = this.opts;

        const onMouseDown = (e: MouseEvent) => {
            if (this.opts.getIsPanning() || e.button === 1) return;

            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const world = this.screenToWorld(screenX, screenY);
            const tool = this.opts.getSelectedTool();

            if (this.opts.selectedShape && tool === ShapeTool.Pointer) {
                const handle = this.getResizeHandle(screenX, screenY);
                if (handle) {
                    this.isResizing = true;
                    this.resizeHandle = handle;
                    this.shapeBeforeResize = structuredClone(this.opts.selectedShape);
                    return;
                }
            }

            if (tool === ShapeTool.Pointer) {
                const shapes = this.opts.getShapes();
                const cam = this.opts.getCamera();
                let hitShape: Shape | null = null;
                let hitIndex = -1;

                for (let i = shapes.length - 1; i >= 0; i--) {
                    if (isPointInShape(world.x, world.y, shapes[i], cam.scale)) {
                        hitShape = shapes[i];
                        hitIndex = i;
                        break;
                    }
                }

                if (hitShape) {
                    this.opts.onSelectShape(hitShape, hitIndex);
                    this.isDragging = true;
                    this.dragStartX = world.x;
                    this.dragStartY = world.y;
                    this.shapeBeforeDrag = structuredClone(hitShape);
                    canvas.style.cursor = 'grabbing';
                } else {
                    this.opts.onSelectShape(null, -1);
                }
                this.opts.onRedraw();
                return;
            }

            if (tool === ShapeTool.Eraser) {
                this.isErasing = true;
                this.eraserPath = [{ x: world.x, y: world.y }];
                return;
            }

            this.clicked = true;
            this.startX = world.x;
            this.startY = world.y;
            if (tool === ShapeTool.Pencil) {
                this.currentPencilStroke = [{ x: world.x, y: world.y }];
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (this.opts.getIsPanning()) return;

            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const world = this.screenToWorld(screenX, screenY);
            const cam = this.opts.getCamera();
            
            if (this.isResizing && this.resizeHandle && this.opts.selectedShape) {
                const worldPos = this.screenToWorld(screenX, screenY);
                const resized = resizeShape(this.opts.selectedShape, this.resizeHandle, worldPos.x, worldPos.y);
                const shapes = this.opts.getShapes();
                if (this.opts.selectedShapeIndex !== -1) {
                    shapes[this.opts.selectedShapeIndex] = resized;
                    this.opts.setShapes([...shapes]);
                }
                this.opts.onSelectShape(resized, this.opts.selectedShapeIndex);
                this.opts.onRedraw();
                return;
            }

            if (this.isDragging && this.opts.selectedShape) {
                const dx = world.x - this.dragStartX;
                const dy = world.y - this.dragStartY;
                const moved = translateShape(this.opts.selectedShape, dx, dy);
                const shapes = this.opts.getShapes();
                if (this.opts.selectedShapeIndex !== -1) {
                    shapes[this.opts.selectedShapeIndex] = moved;
                    this.opts.setShapes([...shapes]);
                }
                this.opts.onSelectShape(moved, this.opts.selectedShapeIndex);
                this.dragStartX = world.x;
                this.dragStartY = world.y;
                this.opts.onRedraw();
                return;
            }

            const tool = this.opts.getSelectedTool();
            if (tool === ShapeTool.Pointer) {
                const handle = this.opts.selectedShape ? this.getResizeHandle(screenX, screenY) : null;
                if (handle) {
                    canvas.style.cursor = RESIZE_CURSORS[handle];
                } else {
                    const shapes = this.opts.getShapes();
                    const hovering = shapes.some(s => isPointInShape(world.x, world.y, s, cam.scale));
                    canvas.style.cursor = hovering ? 'move' : 'default';
                }
            }

            if (this.isErasing) {
                this.eraserPath.push({ x: world.x, y: world.y });
                this.opts.onRedraw();
                return;
            }

            if (this.clicked) {
                this.opts.onRedraw();
                if (tool === ShapeTool.Pencil) {
                    this.currentPencilStroke.push({ x: world.x, y: world.y });
                }
                this._previewState = { tool, startX: this.startX, startY: this.startY, worldX: world.x, worldY: world.y, pencilPoints: [...this.currentPencilStroke] };
            }
        };

        const onMouseUp = (e: MouseEvent) => {
            if (this.isResizing && this.shapeBeforeResize && this.opts.selectedShape) {
                this.isResizing = false;
                this.resizeHandle = null;
                if (JSON.stringify(this.shapeBeforeResize) !== JSON.stringify(this.opts.selectedShape)) {
                    this.opts.onShapeMoved(this.shapeBeforeResize, this.opts.selectedShape);
                }
                this.shapeBeforeResize = null;
                this._previewState = null;
                return;
            }

            if (this.isDragging && this.opts.selectedShape && this.shapeBeforeDrag) {
                this.isDragging = false;
                canvas.style.cursor = 'move';
                if (JSON.stringify(this.shapeBeforeDrag) !== JSON.stringify(this.opts.selectedShape)) {
                    this.opts.onShapeMoved(this.shapeBeforeDrag, this.opts.selectedShape);
                }
                this.shapeBeforeDrag = null;
                this._previewState = null;
                return;
            }

            if (this.isErasing) {
                this.isErasing = false;
                if (this.eraserPath.length > 0) {
                    this.eraseAlongPath(this.eraserPath);
                    this.eraserPath = [];
                    this.opts.onRedraw();
                }
                this._previewState = null;
                return;
            }

            if (!this.clicked || this.opts.getSelectedTool() === ShapeTool.Pointer) {
                this.clicked = false;
                this._previewState = null;
                return;
            }

            this.clicked = false;
            this._previewState = null;

            const rect = this.opts.canvas.getBoundingClientRect();
            const world = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
            const tool = this.opts.getSelectedTool();
            const width = world.x - this.startX;
            const height = world.y - this.startY;

            let shape: Shape;

            if (tool === ShapeTool.Rectangle) {
                shape = { type: 'rect', x: this.startX, y: this.startY, width, height };
            } else if (tool === ShapeTool.Circle) {
                const radius = Math.sqrt(width * width + height * height) / 2;
                shape = { type: 'circle', centerX: this.startX + width / 2, centerY: this.startY + height / 2, radius };
            } else if (tool === ShapeTool.Pencil) {
                this.currentPencilStroke.push({ x: world.x, y: world.y });
                shape = { type: 'pencil', points: [...this.currentPencilStroke] };
                this.currentPencilStroke = [];
            } else if (tool === ShapeTool.Arrow) {
                shape = { type: 'arrow', startX: this.startX, startY: this.startY, endX: world.x, endY: world.y };
            } else {
                return;
            }

            const shapes = this.opts.getShapes();
            this.opts.setShapes([...shapes, shape]);
            this.opts.onShapeCreated(shape);
            this.opts.onToolCreated();
            this.opts.onRedraw();
        };

        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);

        this.cleanupFns.push(
            () => canvas.removeEventListener('mousedown', onMouseDown),
            () => canvas.removeEventListener('mousemove', onMouseMove),
            () => canvas.removeEventListener('mouseup', onMouseUp),
        );
    }

    public _previewState: {
        tool: ShapeTool;
        startX: number;
        startY: number;
        worldX: number;
        worldY: number;
        pencilPoints: { x: number; y: number }[];
    } | null = null;

    cleanup() {
        this.cleanupFns.forEach(fn => fn());
    }
}