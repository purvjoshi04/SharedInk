import { Shape, Camera } from "./types";
import { getShapeBounds } from "./shape-utils";

export class CanvasRenderer {
    private readonly SELECTION_PADDING = 8;
    private readonly HANDLE_SIZE = 8;

    constructor(
        private ctx: CanvasRenderingContext2D,
        private canvas: HTMLCanvasElement,
    ) {}

    render(shapes: Shape[], camera: Camera, selectedShape: Shape | null) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(camera.x, camera.y);
        this.ctx.scale(camera.scale, camera.scale);
        this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        this.ctx.fillStyle = "rgba(255, 255, 255, 1)";
        this.ctx.lineWidth = 2 / camera.scale;

        shapes.forEach(shape => this.drawShape(shape, camera.scale));

        this.ctx.restore();

        if (selectedShape) {
            this.drawSelectionHighlight(selectedShape, camera);
        }
    }

    drawShapePreview(type: string, startX: number, startY: number, worldX: number, worldY: number, camera: Camera) {
        const width = worldX - startX;
        const height = worldY - startY;

        this.ctx.save();
        this.ctx.translate(camera.x, camera.y);
        this.ctx.scale(camera.scale, camera.scale);
        this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        this.ctx.lineWidth = 2 / camera.scale;

        if (type === 'rect') {
            this.ctx.strokeRect(startX, startY, width, height);
        } else if (type === 'circle') {
            const radius = Math.sqrt(width * width + height * height) / 2;
            this.ctx.beginPath();
            this.ctx.arc(startX + width / 2, startY + height / 2, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        } else if (type === 'arrow') {
            this.drawArrow(startX, startY, worldX, worldY, camera.scale);
        }

        this.ctx.restore();
    }

    drawPencilPreview(points: { x: number; y: number }[], camera: Camera) {
        this.ctx.save();
        this.ctx.translate(camera.x, camera.y);
        this.ctx.scale(camera.scale, camera.scale);
        this.drawPencilStroke(points, camera.scale);
        this.ctx.restore();
    }

    getEraserCursor(radius: number): string {
        const d = radius * 2;
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${d}' height='${d}' viewBox='0 0 ${d} ${d}'><circle cx='${radius}' cy='${radius}' r='${radius - 1}' fill='none' stroke='white' stroke-width='1.5'/></svg>`;
        return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${radius} ${radius}, crosshair`;
    }

    private drawShape(shape: Shape, scale: number) {
        if (shape.type === 'rect') {
            this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
            this.ctx.stroke();
        } else if (shape.type === 'pencil') {
            this.drawPencilStroke(shape.points, scale);
        } else if (shape.type === 'arrow') {
            this.drawArrow(shape.startX, shape.startY, shape.endX, shape.endY, scale);
        }
    }

    private drawArrow(fromX: number, fromY: number, toX: number, toY: number, scale: number) {
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headlen = 12 / scale;
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
    }

    private drawPencilStroke(points: { x: number; y: number }[], scale: number) {
        if (!points || points.length < 2) return;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach(p => this.ctx.lineTo(p.x, p.y));
        this.ctx.lineWidth = 2 / scale;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    }

    private drawSelectionHighlight(shape: Shape, camera: Camera) {
        const P = this.SELECTION_PADDING;
        const hs = this.HANDLE_SIZE;
        const bounds = getShapeBounds(shape);

        const tl = { x: bounds.minX * camera.scale + camera.x, y: bounds.minY * camera.scale + camera.y };
        const br = { x: bounds.maxX * camera.scale + camera.x, y: bounds.maxY * camera.scale + camera.y };

        const x = tl.x - P, y = tl.y - P;
        const w = (br.x - tl.x) + P * 2;
        const h = (br.y - tl.y) + P * 2;

        this.ctx.save();
        this.ctx.strokeStyle = "rgba(99, 179, 237, 0.9)";
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([6, 3]);
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.fillStyle = "rgba(99, 179, 237, 0.9)";
        this.ctx.setLineDash([]);
        [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
            this.ctx.fillRect((cx as number) - hs / 2, (cy as number) - hs / 2, hs, hs);
        });
        this.ctx.restore();
    }
}