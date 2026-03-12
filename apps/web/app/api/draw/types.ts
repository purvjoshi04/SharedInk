export type RectShape = {
    type: 'rect';
    x: number;
    y: number;
    width: number;
    height: number;
};

export type CircleShape = {
    type: 'circle';
    centerX: number;
    centerY: number;
    radius: number;
};

export type PencilShape = {
    type: 'pencil';
    points: { x: number; y: number }[];
};

export type ArrowShape = {
    type: 'arrow';
    startX: number;
    startY: number;
    endX: number;
    endY: number;
};

export type Shape = RectShape | CircleShape | PencilShape | ArrowShape;

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br';

export interface Camera {
    x: number;
    y: number;
    scale: number;
}

export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}