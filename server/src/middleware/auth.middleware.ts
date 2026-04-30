import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from "../lib/prisma";

export interface AuthRequest extends Request {
  userId?: number;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ message: 'Brak tokenu' }); return; }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    const user = await prisma.users.findUnique({
      where: { user_id: decoded.userId },
      select: { user_id: true },
    });
    if (!user) { res.status(401).json({ message: 'Użytkownik nie istnieje' }); return; }

    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Nieprawidłowy token' });
  }
};