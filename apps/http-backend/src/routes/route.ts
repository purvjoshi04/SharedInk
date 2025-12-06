import { prisma } from '@repo/db';
import { getJwtSecret, JWT_EXPIRY } from '@repo/common/config';
import { CreateRoomSchema, createUserSchema, SigninSchema } from '@repo/common/types';
import { Router, type Router as RouterType } from "express";
import { userMiddleware } from "../middleware/middleware";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

(BigInt.prototype as any).toJSON = function() {
    return this.toString();
};

export const router: RouterType = Router();

router.post("/signup", async (req, res) => {
    const requiredBody = createUserSchema.safeParse(req.body);
    if (!requiredBody.success) {
        const formattedErrors = requiredBody.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
        }));
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: formattedErrors
        });
    };
    try {
        const userExisted = await prisma.user.findFirst({
            where: {
                email: requiredBody.data.email
            }
        });
        if (userExisted) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(requiredBody.data.password, 10);

        const user = await prisma.user.create({
            data: {
                email: requiredBody.data.email,
                password: hashedPassword,
                name: requiredBody.data.name
            }
        });
        const userId = user.id;
        const token = jwt.sign({ userId, username: user.email },
            getJwtSecret(),
            { expiresIn: JWT_EXPIRY }
        );
        let room = await prisma.room.findFirst({
            where: {
                adminId: user.id
            }
        });

        if (!room) {
            room = await prisma.room.create({
                data: {
                    slug: `canvas-${user.id}-${Date.now()}`,
                    adminId: user.id,
                }
            });
        }
        return res.status(201).json({
            success: true,
            message: "You are signed up!",
            token,
            roomId: room.id
        });

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong during signup"
        });
    }
});

router.post("/signin", async (req, res) => {
    try {
        const requiredBody = SigninSchema.safeParse(req.body);
        if (!requiredBody.success) {
            const formattedErrors = requiredBody.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message
            }));
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: formattedErrors
            });
        };
        const user = await prisma.user.findUnique({
            where: {
                email: requiredBody.data.email
            }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        const passwordCompare = await bcrypt.compare(requiredBody.data.password, user.password as string);
        if (!passwordCompare) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            getJwtSecret(),
            { expiresIn: JWT_EXPIRY }
        );

        let room = await prisma.room.findFirst({
            where: {
                adminId: user.id
            }
        });

        if (!room) {
            room = await prisma.room.create({
                data: {
                    slug: `canvas-${user.id}-${Date.now()}`,
                    adminId: user.id,
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Signed in successfully",
            token: token,
            user: {
                id: user.id,
                email: user.email
            },
            roomId: room.id
        })
    } catch (error) {
        console.error("Signin error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong during signin"
        });
    }
});

router.post("/room", userMiddleware, async (req, res) => {
    try {
        const requiredBody = CreateRoomSchema.safeParse(req.body);
        if (!requiredBody.success) {
            const formattedErrors = requiredBody.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message
            }));
            return res.status(400).json({
                success: false,
                message: "Invalid inputs",
                errors: formattedErrors
            });
        };
        const userId = req.userId;

        const room = await prisma.room.create({
            data: {
                slug: requiredBody.data.name,
                adminId: userId,
            }
        });
        res.json({
            roomId: room.id
        })
    } catch (error) {
        res.status(411).json({
            message: "Room already exists with this name"
        });
    }
});

router.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const messages = await prisma.chat.findMany({
            where: {
                roomId: roomId,
            },
            orderBy: {
                id: "asc"
            }
        });

        const serializedMessages = messages.map(msg => ({
            id: msg.id.toString(),
            message: msg.message,
            userId: msg.userId,
            roomId: msg.roomId,
            createdAt: msg.createdAt.toISOString()
        }));

        res.json({
            messages: serializedMessages
        });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

router.get("/room/:slug", async (req, res) => {
    try {
        const slug = req.params.slug;

        const room = await prisma.room.findFirst({
            where: {
                slug
            }
        });

        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }

        res.json({
            id: room.id,
            slug: room.slug,
            adminId: room.adminId
        });
    } catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).json({ error: "Failed to fetch room" });
    }
});