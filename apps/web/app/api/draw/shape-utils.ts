import { Shape, ResizeHandle, Bounds } from "./types";

export function getShapeBounds(shape: Shape): Bounds {
    if (shape.type === 'rect') {
        return {
            minX: Math.min(shape.x, shape.x + shape.width),
            minY: Math.min(shape.y, shape.y + shape.height),
            maxX: Math.max(shape.x, shape.x + shape.width),
            maxY: Math.max(shape.y, shape.y + shape.height),
        };
    }
    if (shape.type === 'circle') {
        return {
            minX: shape.centerX - shape.radius,
            minY: shape.centerY - shape.radius,
            maxX: shape.centerX + shape.radius,
            maxY: shape.centerY + shape.radius,
        };
    }
    if (shape.type === 'pencil') {
        const xs = shape.points.map(p => p.x);
        const ys = shape.points.map(p => p.y);
        return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
    }
    if (shape.type === 'arrow') {
        return {
            minX: Math.min(shape.startX, shape.endX),
            minY: Math.min(shape.startY, shape.endY),
            maxX: Math.max(shape.startX, shape.endX),
            maxY: Math.max(shape.startY, shape.endY),
        };
    }
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}

export function distanceToLineSegment(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
): number {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    return Math.sqrt((px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2);
}

export function isPointInShape(x: number, y: number, shape: Shape, scale: number): boolean {
    if (shape.type === 'rect') {
        return (
            x >= Math.min(shape.x, shape.x + shape.width) &&
            x <= Math.max(shape.x, shape.x + shape.width) &&
            y >= Math.min(shape.y, shape.y + shape.height) &&
            y <= Math.max(shape.y, shape.y + shape.height)
        );
    }
    if (shape.type === 'circle') {
        const dx = x - shape.centerX, dy = y - shape.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= shape.radius;
    }
    if (shape.type === 'pencil') {
        for (let i = 0; i < shape.points.length - 1; i++) {
            if (distanceToLineSegment(x, y, shape.points[i].x, shape.points[i].y, shape.points[i + 1].x, shape.points[i + 1].y) < 5 / scale)
                return true;
        }
        return false;
    }
    if (shape.type === 'arrow') {
        return distanceToLineSegment(x, y, shape.startX, shape.startY, shape.endX, shape.endY) < 5 / scale;
    }
    return false;
}

export function translateShape(shape: Shape, dx: number, dy: number): Shape {
    if (shape.type === 'rect') return { ...shape, x: shape.x + dx, y: shape.y + dy };
    if (shape.type === 'circle') return { ...shape, centerX: shape.centerX + dx, centerY: shape.centerY + dy };
    if (shape.type === 'pencil') return { ...shape, points: shape.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
    if (shape.type === 'arrow') return { ...shape, startX: shape.startX + dx, startY: shape.startY + dy, endX: shape.endX + dx, endY: shape.endY + dy };
    return shape;
}

export function resizeShape(shape: Shape, handle: ResizeHandle, worldX: number, worldY: number): Shape {
    const b = getShapeBounds(shape);
    let minX = b.minX, minY = b.minY, maxX = b.maxX, maxY = b.maxY;

    if (handle === 'tl') { minX = worldX; minY = worldY; }
    if (handle === 'tr') { maxX = worldX; minY = worldY; }
    if (handle === 'bl') { minX = worldX; maxY = worldY; }
    if (handle === 'br') { maxX = worldX; maxY = worldY; }

    if (minX > maxX) [minX, maxX] = [maxX, minX];
    if (minY > maxY) [minY, maxY] = [maxY, minY];

    const nw = maxX - minX, nh = maxY - minY;
    const sx = b.maxX - b.minX === 0 ? 1 : nw / (b.maxX - b.minX);
    const sy = b.maxY - b.minY === 0 ? 1 : nh / (b.maxY - b.minY);

    if (shape.type === 'rect') return { ...shape, x: minX, y: minY, width: nw, height: nh };
    if (shape.type === 'circle') {
        const rx = nw / 2, ry = nh / 2;
        return { ...shape, centerX: minX + rx, centerY: minY + ry, radius: Math.max(rx, ry) };
    }
    if (shape.type === 'pencil') {
        return { ...shape, points: shape.points.map(p => ({ x: minX + (p.x - b.minX) * sx, y: minY + (p.y - b.minY) * sy })) };
    }
    if (shape.type === 'arrow') {
        return {
            ...shape,
            startX: minX + (shape.startX - b.minX) * sx,
            startY: minY + (shape.startY - b.minY) * sy,
            endX: minX + (shape.endX - b.minX) * sx,
            endY: minY + (shape.endY - b.minY) * sy,
        };
    }
    return shape;
}

export function shapeIntersectsEraser(shape: Shape, eraserX: number, eraserY: number, eraserRadius: number): boolean {
    if (shape.type === 'pencil') {
        for (let i = 0; i < shape.points.length - 1; i++) {
            if (distanceToLineSegment(eraserX, eraserY, shape.points[i].x, shape.points[i].y, shape.points[i + 1].x, shape.points[i + 1].y) < eraserRadius)
                return true;
        }
        return false;
    }
    if (shape.type === 'rect') {
        const cx = Math.max(shape.x, Math.min(eraserX, shape.x + shape.width));
        const cy = Math.max(shape.y, Math.min(eraserY, shape.y + shape.height));
        return (eraserX - cx) ** 2 + (eraserY - cy) ** 2 < eraserRadius ** 2;
    }
    if (shape.type === 'circle') {
        const dx = eraserX - shape.centerX, dy = eraserY - shape.centerY;
        return Math.sqrt(dx * dx + dy * dy) < shape.radius + eraserRadius;
    }
    if (shape.type === 'arrow') {
        return distanceToLineSegment(eraserX, eraserY, shape.startX, shape.startY, shape.endX, shape.endY) < eraserRadius;
    }
    return false;
}

export function splitPencilStroke(
    points: { x: number; y: number }[],
    eraserPath: { x: number; y: number }[],
    eraserRadius: number
): { x: number; y: number }[][] {
    const segments: { x: number; y: number }[][] = [];
    let current: { x: number; y: number }[] = [];

    for (const point of points) {
        const erased = eraserPath.some(ep => Math.sqrt((point.x - ep.x) ** 2 + (point.y - ep.y) ** 2) < eraserRadius);
        if (erased) {
            if (current.length >= 2) segments.push(current);
            current = [];
        } else {
            current.push(point);
        }
    }
    if (current.length >= 2) segments.push(current);
    return segments;
}