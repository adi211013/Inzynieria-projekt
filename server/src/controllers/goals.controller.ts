import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

async function getUserTimezone(userId: number): Promise<string> {
    const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { timezone: true },
    });
    return user?.timezone ?? 'UTC';
}

function getTodayInTimezone(timezone: string): Date {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);

    const year = parts.find(p => p.type === 'year')!.value;
    const month = parts.find(p => p.type === 'month')!.value;
    const day = parts.find(p => p.type === 'day')!.value;

    return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

function parseDeadline(deadline: string): Date | null {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return null;
    return new Date(`${d.toISOString().slice(0, 10)}T00:00:00Z`);
}

export const getGoals = async (req: AuthRequest, res: Response) => {
    try {
        const goals = await prisma.goals.findMany({
            where: { user_id: req.userId!, is_active: true },
            include: { habits: true },
            orderBy: { created_at: 'desc' },
        });
        res.json(goals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const getGoal = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const goal = await prisma.goals.findFirst({
            where: { goal_id: Number(id), user_id: req.userId!, is_active: true },
            include: { habits: true, goal_logs: true },
        });

        if (!goal) {
            res.status(404).json({ message: 'Cel nie znaleziony' });
            return;
        }

        res.json(goal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const createGoal = async (req: AuthRequest, res: Response) => {
    const {
        habit_id,
        name,
        description,
        category,
        icon,
        color,
        frequency,
        target_days,
        deadline,
        notifications_enabled,
        reminder_time,
    } = req.body;

    if (!habit_id || !name || !target_days || !frequency) {
        res.status(400).json({ message: 'Pola habit_id, name, target_days, frequency są wymagane' });
        return;
    }

    if (!Number.isInteger(target_days) || target_days < 1) {
        res.status(400).json({ message: 'target_days musi być liczbą całkowitą >= 1' });
        return;
    }

    try {
        const habit = await prisma.habits.findFirst({
            where: { habit_id: Number(habit_id), user_id: req.userId!, is_active: true },
        });

        if (!habit) {
            res.status(404).json({ message: 'Nawyk nie znaleziony' });
            return;
        }

        let deadlineDate: Date | null = null;
        if (deadline) {
            deadlineDate = parseDeadline(deadline);
            if (!deadlineDate) {
                res.status(400).json({ message: 'Nieprawidłowy format deadline (YYYY-MM-DD)' });
                return;
            }

            const timezone = await getUserTimezone(req.userId!);
            const today = getTodayInTimezone(timezone);
            if (deadlineDate < today) {
                res.status(400).json({ message: 'Deadline nie może być w przeszłości' });
                return;
            }
        }

        const goal = await prisma.goals.create({
            data: {
                user_id: req.userId!,
                habit_id: Number(habit_id),
                name,
                description,
                category,
                icon,
                color,
                frequency,
                target_days,
                deadline: deadlineDate,
                notifications_enabled: notifications_enabled ?? false,
                reminder_time,
            },
        });

        res.status(201).json(goal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const updateGoal = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
        name,
        description,
        category,
        icon,
        color,
        frequency,
        target_days,
        status,
        deadline,
        notifications_enabled,
        reminder_time,
    } = req.body;

    try {
        const goal = await prisma.goals.findFirst({
            where: { goal_id: Number(id), user_id: req.userId!, is_active: true },
        });

        if (!goal) {
            res.status(404).json({ message: 'Cel nie znaleziony' });
            return;
        }

        if (status !== undefined) {
            if (!['in_progress', 'completed', 'failed'].includes(status)) {
                res.status(400).json({ message: 'Nieprawidłowy status' });
                return;
            }
            if (goal.status !== 'in_progress' && status === 'in_progress') {
                res.status(400).json({
                    message: 'Nie można cofnąć ukończonego/nieudanego celu do "in_progress"',
                });
                return;
            }
        }

        let deadlineValue: Date | null | undefined = undefined;
        if (deadline !== undefined) {
            if (deadline === null) {
                deadlineValue = null;
            } else {
                deadlineValue = parseDeadline(deadline);
                if (!deadlineValue) {
                    res.status(400).json({ message: 'Nieprawidłowy format deadline (YYYY-MM-DD)' });
                    return;
                }
                const timezone = await getUserTimezone(req.userId!);
                const today = getTodayInTimezone(timezone);
                if (deadlineValue < today) {
                    res.status(400).json({ message: 'Deadline nie może być w przeszłości' });
                    return;
                }
            }
        }

        const updated = await prisma.goals.update({
            where: { goal_id: Number(id) },
            data: {
                name,
                description,
                category,
                icon,
                color,
                frequency,
                target_days,
                status,
                deadline: deadlineValue,
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

export const deleteGoal = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        const goal = await prisma.goals.findFirst({
            where: { goal_id: Number(id), user_id: req.userId!, is_active: true },
        });

        if (!goal) {
            res.status(404).json({ message: 'Cel nie znaleziony' });
            return;
        }

        await prisma.goals.update({
            where: { goal_id: Number(id) },
            data: { is_active: false },
        });

        res.json({ message: 'Cel usunięty' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};