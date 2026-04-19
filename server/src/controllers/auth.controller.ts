import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const register = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        res.status(400).json({ message: 'Wszystkie pola są wymagane' });
        return;
    }

    try {
        const existing = await prisma.users.findFirst({
            where: { OR: [{ email }, { username }] }
        });

        if (existing) {
            res.status(409).json({ message: 'Email lub nazwa użytkownika już istnieje' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.users.create({
            data: { username, email, password: hashedPassword }
        });

        const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { id: user.user_id, username: user.username, email: user.email }
        });
    } catch (e){
        console.error(e);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: 'Email i hasło są wymagane' });
        return;
    }

    try {
        const user = await prisma.users.findUnique({ where: { email } });

        if (!user) {
            res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
            return;
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
            return;
        }

        const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

        res.json({
            token,
            user: { id: user.user_id, username: user.username, email: user.email }
        });
    } catch(e) {
        console.error(e);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const me = async (req: Request & { userId?: number }, res: Response) => {
    try {
        const user = await prisma.users.findUnique({
            where: { user_id: req.userId! },
            select: { user_id: true, username: true, email: true, created_at: true }
        });

        if (!user) {
            res.status(404).json({ message: 'Użytkownik nie znaleziony' });
            return;
        }

        res.json(user);
    } catch(e) {
        console.error(e);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};