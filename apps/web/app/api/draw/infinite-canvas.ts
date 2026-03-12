import { Camera } from "./types";
import { ShapeTool } from "@/components/Navbar";

interface InfiniteCanvasOptions {
    canvas: HTMLCanvasElement;
    getCamera: () => Camera;
    setCamera: (camera: Camera) => void;
    getSelectedTool: () => ShapeTool;
    getSelectedShapeExists: () => boolean;
    onDeleteSelected: () => void;
    onRedraw: () => void;
    eraserCursor: string;
}

export class InfiniteCanvas {
    private isPanning = false;
    private panStartX = 0;
    private panStartY = 0;
    private lastPanX = 0;
    private lastPanY = 0;
    private isSpacePressed = false;
    private cleanupFns: (() => void)[] = [];

    private readonly MIN_SCALE = 0.1;
    private readonly MAX_SCALE = 5;
    private readonly ZOOM_SENSITIVITY = 0.009;

    constructor(private opts: InfiniteCanvasOptions) {
        this.init();
    }

    get panning() { return this.isPanning; }

    private init() {
        const { canvas } = this.opts;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !this.isSpacePressed) {
                this.isSpacePressed = true;
                canvas.style.cursor = 'grab';
                e.preventDefault();
            }
            if ((e.code === 'Backspace' || e.code === 'Delete') && this.opts.getSelectedShapeExists()) {
                this.opts.onDeleteSelected();
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                this.isSpacePressed = false;
                if (!this.isPanning) this.resetCursor();
                e.preventDefault();
            }
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const camera = this.opts.getCamera();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (e.ctrlKey || e.metaKey) {
                const worldX = (mouseX - camera.x) / camera.scale;
                const worldY = (mouseY - camera.y) / camera.scale;
                const zoomFactor = e.deltaY * this.ZOOM_SENSITIVITY;
                const newScale = Math.min(Math.max(camera.scale * (1 - zoomFactor), this.MIN_SCALE), this.MAX_SCALE);
                this.opts.setCamera({ x: mouseX - worldX * newScale, y: mouseY - worldY * newScale, scale: newScale });
            } else if (e.shiftKey) {
                this.opts.setCamera({ ...camera, x: camera.x - e.deltaY });
            } else {
                this.opts.setCamera({ ...camera, y: camera.y - e.deltaY });
            }
            this.opts.onRedraw();
        };

        const onMouseDown = (e: MouseEvent) => {
            if (e.button === 1 || (e.button === 0 && this.isSpacePressed)) {
                e.preventDefault();
                this.isPanning = true;
                this.panStartX = e.clientX;
                this.panStartY = e.clientY;
                const cam = this.opts.getCamera();
                this.lastPanX = cam.x;
                this.lastPanY = cam.y;
                canvas.style.cursor = 'grabbing';
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (this.isPanning) {
                e.preventDefault();
                const cam = this.opts.getCamera();
                this.opts.setCamera({
                    ...cam,
                    x: this.lastPanX + (e.clientX - this.panStartX),
                    y: this.lastPanY + (e.clientY - this.panStartY),
                });
                this.opts.onRedraw();
            }
        };

        const onMouseUp = (e: MouseEvent) => {
            if (e.button === 1 || (e.button === 0 && this.isPanning)) {
                this.isPanning = false;
                if (this.isSpacePressed) {
                    canvas.style.cursor = 'grab';
                } else {
                    this.resetCursor();
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('contextmenu', (e) => { if (e.button === 1) e.preventDefault(); });

        this.cleanupFns.push(
            () => window.removeEventListener('keydown', onKeyDown),
            () => window.removeEventListener('keyup', onKeyUp),
            () => canvas.removeEventListener('wheel', onWheel),
            () => canvas.removeEventListener('mousedown', onMouseDown),
            () => canvas.removeEventListener('mousemove', onMouseMove),
            () => canvas.removeEventListener('mouseup', onMouseUp),
        );
    }

    private resetCursor() {
        const tool = this.opts.getSelectedTool();
        if (tool === ShapeTool.Eraser) {
            this.opts.canvas.style.cursor = this.opts.eraserCursor;
        } else {
            this.opts.canvas.style.cursor = 'default';
        }
    }

    zoom(delta: number, canvas: HTMLCanvasElement) {
        const camera = this.opts.getCamera();
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const worldX = (centerX - camera.x) / camera.scale;
        const worldY = (centerY - camera.y) / camera.scale;
        const newScale = Math.min(Math.max(camera.scale * (1 + delta), this.MIN_SCALE), this.MAX_SCALE);
        this.opts.setCamera({ x: centerX - worldX * newScale, y: centerY - worldY * newScale, scale: newScale });
        this.opts.onRedraw();
    }

    resetView() {
        this.opts.setCamera({ x: 0, y: 0, scale: 1 });
        this.opts.onRedraw();
    }

    cleanup() {
        this.cleanupFns.forEach(fn => fn());
    }
}