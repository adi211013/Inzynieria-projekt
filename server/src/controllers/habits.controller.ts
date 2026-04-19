import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getHabits = async (req: AuthRequest, res: Response) => {
    try {
        const habits = await prisma.habits.findMany({
            where: { user_id: req.userId! }
        });
        res.json(habits);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const getHabit = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const habit = await prisma.habits.findFirst({
            where: { habit_id: Number(id), user_id: req.userId! }
        });

        if (!habit) {
            res.status(404).json({ message: 'Nawyk nie znaleziony' });
            return;
        }

        res.json(habit);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const createHabit = async (req: AuthRequest, res: Response) => {
    const { name, description, frequency } = req.body;

    if (!name) {
        res.status(400).json({ message: 'Nazwa nawyku jest wymagana' });
        return;
    }

    try {
        const habit = await prisma.habits.create({
            data: {
                user_id: req.userId!,
                name,
                description,
                frequency
            }
        });
        res.status(201).json(habit);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const updateHabit = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, description, frequency, is_active } = req.body;

    try {
        const habit = await prisma.habits.findFirst({
            where: { habit_id: Number(id), user_id: req.userId! }
        });

        if (!habit) {
            res.status(404).json({ message: 'Nawyk nie znaleziony' });
            return;
        }

        const updated = await prisma.habits.update({
            where: { habit_id: Number(id) },
            data: { name, description, frequency, is_active }
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const deleteHabit = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        const habit = await prisma.habits.findFirst({
            where: { habit_id: Number(id), user_id: req.userId! }
        });

        if (!habit) {
            res.status(404).json({ message: 'Nawyk nie znaleziony' });
            return;
        }

        await prisma.habits.delete({ where: { habit_id: Number(id) } });
        res.json({ message: 'Nawyk usunięty' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};