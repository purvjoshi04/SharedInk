import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import "dotenv/config";

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        if (!decoded.userId) {
            return res.status(403).json({
                message: "Invalid token payload"
            });
        }

        req.userId = decoded.userId;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(403).json({
                success: false,
                message: "Invalid token"
            });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: "Token expired"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Authentication error"
        });
    }
}