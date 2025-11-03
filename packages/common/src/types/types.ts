import { z } from "zod";

export const createUserSchema = z.object({
    email: z.email(),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters" })
        .refine((password) => /[A-Z]/.test(password), {
            message: "Password must contain at least one uppercase letter"
        })
        .refine((password) => /[a-z]/.test(password), {
            message: "Password must contain at least one lowercase letter",
        })
        .refine((password) => /[0-9]/.test(password), {
            message: "Password must contain at least one number",
        })
        .refine((password) => /[!@#$%^&*]/.test(password), {
            message: "Password must contain at least one special character (!@#$%^&*)",
        }),
    name: z.string()
});

export const SigninSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters" })
        .refine((password) => /[A-Z]/.test(password), {
            message: "Password must contain at least one uppercase letter"
        })
        .refine((password) => /[a-z]/.test(password), {
            message: "Password must contain at least one lowercase letter",
        })
        .refine((password) => /[0-9]/.test(password), {
            message: "Password must contain at least one number",
        })
        .refine((password) => /[!@#$%^&*]/.test(password), {
            message: "Password must contain at least one special character (!@#$%^&*)",
        }),
});

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20)
})