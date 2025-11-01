import "dotenv/config";

export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is missing!');
    }

    return secret;
}

export const JWT_EXPIRY = '7d';