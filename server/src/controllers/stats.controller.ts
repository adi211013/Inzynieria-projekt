import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

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

function toUserLocalDate(isoUtc: string, timezone: string): Date {
    const d = new Date(isoUtc);
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(d);

    const year = parts.find(p => p.type === 'year')!.value;
    const month = parts.find(p => p.type === 'month')!.value;
    const day = parts.find(p => p.type === 'day')!.value;

    return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

function daysBetween(a: Date, b: Date): number {
    const ms = a.getTime() - b.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
}

async function calculateStreak(habitId: number, timezone: string): Promise<number> {
    const today = getTodayInTimezone(timezone);

    const logs = await prisma.habit_logs.findMany({
        where: { habit_id: habitId },
        orderBy: { date: 'desc' },
        select: { date: true },
    });

    if (logs.length === 0) return 0;

    let streak = 0;
    let expectedDate = today;

    const mostRecent = logs[0].date;
    const gap = daysBetween(today, mostRecent);
    if (gap > 1) return 0;
    if (gap === 1) expectedDate = new Date(today.getTime() - 86400000);

    for (const log of logs) {
        const diff = daysBetween(expectedDate, log.date);
        if (diff === 0) {
            streak++;
            expectedDate = new Date(expectedDate.getTime() - 86400000);
        } else if (diff > 0) {
            break;
        }
    }

    return streak;
}

async function autoFailExpiredGoals(userId: number, today: Date): Promise<void> {
    await prisma.goals.updateMany({
        where: {
            user_id: userId,
            is_active: true,
            status: 'in_progress',
            deadline: { lt: today, not: null },
        },
        data: { status: 'failed' },
    });
}

export const overview = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.users.findUnique({
            where: { user_id: req.userId! },
            select: { timezone: true },
        });

        const timezone = user?.timezone ?? 'UTC';
        const today = getTodayInTimezone(timezone);

        await autoFailExpiredGoals(req.userId!, today);

        const [habits, goals, totalLogs, todayLogs] = await Promise.all([
            prisma.habits.findMany({
                where: { user_id: req.userId!, is_active: true },
                select: { habit_id: true, name: true, icon: true, color: true },
            }),
            prisma.goals.findMany({
                where: { user_id: req.userId!, is_active: true },
                include: { goal_logs: { where: { completed: true } } },
            }),
            prisma.habit_logs.count({ where: { user_id: req.userId! } }),
            prisma.habit_logs.count({ where: { user_id: req.userId!, date: today } }),
        ]);

        const habitIds = habits.map(h => h.habit_id);
        const todayHabitLogs = await prisma.habit_logs.findMany({
            where: { user_id: req.userId!, habit_id: { in: habitIds }, date: today },
            select: { habit_id: true },
        });
        const completedTodaySet = new Set(todayHabitLogs.map(l => l.habit_id));

        const habitStreaks = await Promise.all(
            habits.map(async (h) => ({
                habit_id: h.habit_id,
                name: h.name,
                icon: h.icon,
                color: h.color,
                streak: await calculateStreak(h.habit_id, timezone),
                completed_today: completedTodaySet.has(h.habit_id),
            }))
        );

        const goalsProgress = goals.map((g) => {
            const currentDays = Math.min(g.goal_logs.length, g.target_days);
            const rawPercent = (g.goal_logs.length / g.target_days) * 100;
            const percent = Math.min(100, Math.round(rawPercent));

            return {
                goal_id: g.goal_id,
                name: g.name,
                status: g.status,
                target_days: g.target_days,
                current_days: currentDays,
                progress_percent: percent,
                deadline: g.deadline,
            };
        });

        const longestStreak = habitStreaks.reduce((max, h) => Math.max(max, h.streak), 0);

        res.json({
            total_habits: habits.length,
            total_goals: goals.length,
            total_logs: totalLogs,
            today_logs: todayLogs,
            longest_current_streak: longestStreak,
            habits: habitStreaks,
            goals: goalsProgress,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const habitStats = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(365, Math.max(1, Number(req.query.limit) || 90));

    try {
        const habit = await prisma.habits.findFirst({
            where: { habit_id: Number(id), user_id: req.userId! },
        });

        if (!habit) {
            res.status(404).json({ message: 'Nawyk nie znaleziony' });
            return;
        }

        const user = await prisma.users.findUnique({
            where: { user_id: req.userId! },
            select: { timezone: true },
        });

        const timezone = user?.timezone ?? 'UTC';

        const [logs, totalCount] = await Promise.all([
            prisma.habit_logs.findMany({
                where: { habit_id: Number(id) },
                orderBy: { date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.habit_logs.count({ where: { habit_id: Number(id) } }),
        ]);

        const streak = await calculateStreak(Number(id), timezone);

        res.json({
            habit,
            streak,
            total_completions: totalCount,
            recent_logs: logs,
            page,
            limit,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

export const history = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.users.findUnique({
            where: { user_id: req.userId! },
            select: { timezone: true },
        });

        const timezone = user?.timezone ?? 'UTC';
        const today = getTodayInTimezone(timezone);
        const defaultFrom = new Date(today.getTime() - 29 * 86400000);

        const fromDate = req.query.from
            ? toUserLocalDate(String(req.query.from), timezone)
            : defaultFrom;
        const toDate = req.query.to
            ? toUserLocalDate(String(req.query.to), timezone)
            : today;

        if (fromDate > toDate) {
            res.status(400).json({ message: 'Parametr "from" nie może być większy niż "to"' });
            return;
        }

        const activeHabitsCount = await prisma.habits.count({
            where: { user_id: req.userId!, is_active: true },
        });

        const logs = await prisma.habit_logs.findMany({
            where: {
                user_id: req.userId!,
                date: { gte: fromDate, lte: toDate },
            },
            include: {
                habits: { select: { category: true } },
            },
            orderBy: { date: 'asc' },
        });

        const dailyMap = new Map<string, number>();
        const cursor = new Date(fromDate);
        while (cursor <= toDate) {
            dailyMap.set(cursor.toISOString().slice(0, 10), 0);
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

        for (const log of logs) {
            const dateKey = log.date instanceof Date
                ? log.date.toISOString().slice(0, 10)
                : String(log.date).slice(0, 10);
            dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + 1);
        }

        const daily = Array.from(dailyMap.entries()).map(([date, completed]) => ({
            date,
            completed,
            total: activeHabitsCount,
        }));

        const categoryMap = new Map<string, number>();
        for (const log of logs) {
            const key = log.habits?.category ?? '__null__';
            categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
        }

        const by_category = Array.from(categoryMap.entries())
            .map(([key, completed]) => ({
                category: key === '__null__' ? null : key,
                completed,
            }))
            .sort((a, b) => b.completed - a.completed);

        res.json({ daily, by_category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};