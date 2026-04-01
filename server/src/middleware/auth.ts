import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user?: { userId: string; username: string; role: string };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const token = (req.cookies as Record<string, string>)?.token;
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
            username: string;
            role: string;
        };
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

export function teacherOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (req.user?.role !== 'teacher') {
        res.status(403).json({ error: 'Forbidden: teachers only' });
        return;
    }
    next();
}
