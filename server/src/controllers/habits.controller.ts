import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

function validateFrequency(frequency: any): string | null {
    if (!frequency || typeof frequency !== 'object') return 'frequency musi być obiektem';

    const { type } = frequency;

    if (type === 'daily') return null;

    if (type === 'weekly_days') {
        if (!Array.isArray(frequency.days)) return 'weekly_days wymaga pola "days" (tablica)';
        if (!frequency.days.every((d: any) => Number.isInteger(d) && d >= 0 && d <= 6)) {
            return 'weekly_days.days musi zawierać liczby 0-6';
        }
        return null;
    }

    if (type === 'times_per_week') {
        if (!Number.isInteger(frequency.count) || frequency.count < 1 || frequency.count > 7) {
            return 'times_per_week.count musi być liczbą 1-7';
        }
        return null;
    }

    return 'Nieprawidłowy typ frequency';
}

export const getHabits = async (req: AuthRequest, res: Response) => {
    try {
        const habits = await prisma.habits.findMany({
            where: { user_id: req.userId!, is_active: true },
            orderBy: { created_at: 'desc' },
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
            where: { habit_id: Number(id), user_id: req.userId!, is_active: true },
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
    const {
        name,
        description,
        category,
        icon,
        color,
        frequency,
        target_count,
        unit,
        notifications_enabled,
        reminder_time,
    } = req.body;

    if (!name) {
        res.status(400).json({ message: 'Nazwa nawyku jest wymagana' });
        return;
    }

    if (!frequency) {
        res.status(400).json({ message: 'Pole frequency jest wymagane' });
        return;
    }

    const freqError = validateFrequency(frequency);
    if (freqError) {
        res.status(400).json({ message: freqError });
        return;
    }

    try {
        const habit = await prisma.habits.create({
            data: {
                user_id: req.userId!,
                name,
                description,
                category,
                icon,
                color,
                frequency,
                target_count,
                unit,
                notifications_enabled: notifications_enabled ?? false,
                reminder_time,
            },
        });
        res.status(201).json(habit);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const updateHabit = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
        name,
        description,
        category,
        icon,
        color,
        frequency,
        target_count,
        unit,
        notifications_enabled,
        reminder_time,
    } = req.body;

    try {
        const habit = await prisma.habits.findFirst({
            where: { habit_id: Number(id), user_id: req.userId!, is_active: true },
        });

        if (!habit) {
            res.status(404).json({ message: 'Nawyk nie znaleziony' });
            return;
        }

        if (frequency !== undefined) {
            const freqError = validateFrequency(frequency);
            if (freqError) {
                res.status(400).json({ message: freqError });
                return;
            }
        }

        const updated = await prisma.habits.update({
            where: { habit_id: Number(id) },
            data: {
                name,
                description,
                category,
                icon,
                color,
                frequency,
                target_count,
                unit,
                notifications_enabled,
                reminder_time,
            },
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
            where: { habit_id: Number(id), user_id: req.userId!, is_active: true },
        });

        if (!habit) {
            res.status(404).json({ message: 'Nawyk nie znaleziony' });
            return;
        }

        await prisma.habits.update({
            where: { habit_id: Number(id) },
            data: { is_active: false },
        });

        res.json({ message: 'Nawyk usunięty' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
