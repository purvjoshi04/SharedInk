// import axios from "axios";

// type Shape = {
//     type: "rect";
//     x: number;
//     y: number;
//     width: number;
//     height: number;
// } | {
//     type: "circle";
//     centerX: number;
//     centerY: number;
//     radius: number;
// }

// export default async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
//     const ctx = canvas.getContext("2d");

//     const existingShapes: Shape[] = await getExistingShapes(roomId);

//     if (!ctx) {
//         return;
//     }

//     socket.onmessage = (event) => {
//         const message = JSON.parse(event.data);

//         if (message.type === "chat") {
//             const parsedShape = JSON.parse(message.message);
//             existingShapes.push(parsedShape);
//             clearCanvas(existingShapes, canvas, ctx);
//         }
//     };

//     const resizeCanvas = () => {
//         canvas.width = window.innerWidth;
//         canvas.height = window.innerHeight;
//         clearCanvas(existingShapes, canvas, ctx);
//     };
//     resizeCanvas();

//     window.addEventListener("resize", resizeCanvas);

//     clearCanvas(existingShapes, canvas, ctx);

//     let clicked = false;
//     let startX = 0;
//     let startY = 0;

//     const handleMouseDown = (e: MouseEvent) => {
//         clicked = true;
//         const rect = canvas.getBoundingClientRect();
//         startX = e.clientX - rect.left;
//         startY = e.clientY - rect.top;
//     };

//     const handleMouseUp = (e: MouseEvent) => {
//         clicked = false;
//         const rect = canvas.getBoundingClientRect();
//         const width = (e.clientX - rect.left) - startX;
//         const height = (e.clientY - rect.top) - startY;

//         const shape: Shape = {
//             type: 'rect',
//             x: startX,
//             y: startY,
//             height: height,
//             width: width
//         };

//         existingShapes.push(shape);
//         clearCanvas(existingShapes, canvas, ctx);

//         socket.send(JSON.stringify({
//             type: "chat",
//             message: JSON.stringify({ shape }),
//             roomId
//         }));
//     };

//     const handleMouseMove = (e: MouseEvent) => {
//         if (clicked) {
//             const rect = canvas.getBoundingClientRect();
//             const width = (e.clientX - rect.left) - startX;
//             const height = (e.clientY - rect.top) - startY;
//             clearCanvas(existingShapes, canvas, ctx);
//             ctx.strokeStyle = "rgba(255, 255, 255, 1)";
//             ctx.strokeRect(startX, startY, width, height);
//         }
//     };

//     canvas.addEventListener("mousedown", handleMouseDown);
//     canvas.addEventListener("mouseup", handleMouseUp);
//     canvas.addEventListener("mousemove", handleMouseMove);

//     return () => {
//         window.removeEventListener("resize", resizeCanvas);
//         canvas.removeEventListener("mousedown", handleMouseDown);
//         canvas.removeEventListener("mouseup", handleMouseUp);
//         canvas.removeEventListener("mousemove", handleMouseMove);
//     };
// }

// function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     ctx.strokeStyle = "rgba(255, 255, 255, 1)";
//     existingShapes.forEach((shape) => {
//         if (shape.type === 'rect') {
//             ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
//         } else if (shape.type === 'circle') {
//             ctx.beginPath();
//             ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
//             ctx.stroke();
//         }
//     });
// }

// async function getExistingShapes(roomId: string): Promise<Shape[]> {
//     try {
//         const url = `${process.env.NEXT_PUBLIC_BACKEND_URL!.replace(/\/$/, '')}/chats/${roomId}`;

//         const res = await axios.get(url, {
//             withCredentials: true,
//         });

//         if (!res.data?.messages?.length) {
//             return [];
//         }

//         const shapes: Shape[] = [];

//         for (const msg of res.data.messages) {
//             try {
//                 if (!msg.message || typeof msg.message !== 'string') continue;

//                 const parsed = JSON.parse(msg.message);
//                 const shapeData = parsed.shape || parsed;

//                 if (shapeData && typeof shapeData === 'object' && shapeData.type) {
//                     if (shapeData.type === 'rect' || shapeData.type === 'circle') {
//                         shapes.push(shapeData as Shape);
//                     }
//                 }
//             } catch (e) {
//                 continue;
//             }
//         }

//         return shapes;

//     } catch (error: any) {
//         if (error.response) {
//             console.error("API Error:", error.response.status, error.response.data);
//             if (error.response.status === 401) {
//                 console.error("Unauthorized! Check if you're logged in on backend");
//             }
//         } else {
//             console.error("Network error:", error.message);
//         }
//         return [];
//     }
// }