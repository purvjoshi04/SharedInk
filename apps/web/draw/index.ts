type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
}

export default function initDraw(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");

    const existingShapes: Shape[] = [];

    if (!ctx) {
        return;
    }
    
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        clearCanvas(existingShapes, canvas, ctx);
    };
    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    let clicked = false;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener("mousedown", (e) => {
        clicked = true;
        const rect = canvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
    });

    canvas.addEventListener("mouseup", (e) => {
        clicked = false;
        const rect = canvas.getBoundingClientRect();
        const width = (e.clientX - rect.left) - startX;
        const height = (e.clientY - rect.top) - startY;
        existingShapes.push({
            type: 'rect',
            x: startX,
            y: startY,
            height: height,
            width: width
        });
        clearCanvas(existingShapes, canvas, ctx);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (clicked) {
            const rect = canvas.getBoundingClientRect();
            const width = (e.clientX - rect.left) - startX;
            const height = (e.clientY - rect.top) - startY;
            clearCanvas(existingShapes, canvas, ctx);
            ctx.strokeStyle = "rgba(255, 255, 255, 1)";
            ctx.strokeRect(startX, startY, width, height);
        }
    });
    
    return () => {
        window.removeEventListener("resize", resizeCanvas);
    };
}

function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    existingShapes.forEach((shape) => {
        if (shape.type === 'rect') {
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === 'circle') {
            ctx.beginPath();
            ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
    });
}