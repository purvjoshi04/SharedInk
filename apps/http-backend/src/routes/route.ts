import { prisma } from '@repo/db';
import { getJwtSecret, JWT_EXPIRY } from '@repo/common/config';
import { CreateRoomSchema, createUserSchema, SigninSchema } from '@repo/common/types';
import { Router, type Router as RouterType } from "express";
import { userMiddleware } from "../middleware/middleware.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../lib/email.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

(BigInt.prototype as any).toJSON = function () {
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




router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If that email exists, a reset link has been sent"
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        await prisma.passwordResetToken.create({
            data: { token, userId: user.id, expiresAt }
        });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        await sendPasswordResetEmail(user.email, resetUrl);

        return res.status(200).json({
            success: true,
            message: "If that email exists, a reset link has been sent"
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
});

router.post("/reset-password", async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, message: "Token and password are required" });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset link" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword }
        });

        await prisma.passwordResetToken.delete({ where: { token } });

        return res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
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


router.post('/auth/google', async (req, res) => {
    const { email, name, image } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    const validation = CreateRoomSchema.safeParse(req.body);
    if (!validation.success) {
        console.log('Room validation failed:', validation.error.issues);
    }

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                name: name ?? undefined,
                image: image ?? undefined,
                provider: 'google',
            },
            create: {
                email,
                name,
                image,
                provider: 'google',
            },
        });

        let room = await prisma.room.findFirst({
            where: { adminId: user.id },
        });

        if (!room) {
            const fallbackName = user.name?.split(' ')[0]?.toLowerCase() || 'canvas';
            const slug = `${fallbackName}-${Date.now().toString().slice(-6)}`;

            room = await prisma.room.create({
                data: {
                    slug,
                    adminId: user.id,
                },
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        return res.json({
            token,
            roomId: room.id,
        });
    } catch (error) {
        res.status(500).json({
            errorDetails: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
    }
});