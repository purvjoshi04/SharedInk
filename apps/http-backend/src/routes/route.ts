import { prisma } from '@repo/db';
import { getJwtSecret } from '@repo/common/config';
import { createUserSchema } from '@repo/common/types';
import { Router, type Router as RouterType } from "express";
import { userMiddleware } from "../middleware/middleware";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
    const { email, password, name } = requiredBody.data;
    try {
        const userExisted = await prisma.user.findFirst({
            where: {
                email
            }
        });
        if (userExisted) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });
        const userId = user.id;

        const token = jwt.sign({ userId, username: user.email},
            getJwtSecret(),
            { expiresIn: '7d' }
        );
        return res.status(201).json({
            success: true,
            message: "You are signed up!",
            token
        });
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong during signup"
        });
    }
});


router.post("/signin", (req, res) => {

})

router.post("/room", userMiddleware, (req, res) => {

})