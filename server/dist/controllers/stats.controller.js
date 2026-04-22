"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.habitStats = exports.overview = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
function getTodayInTimezone(timezone) {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return new Date(`${year}-${month}-${day}T00:00:00Z`);
}
function daysBetween(a, b) {
    const ms = a.getTime() - b.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
}
async function calculateStreak(habitId, timezone) {
    const today = getTodayInTimezone(timezone);
    const logs = await prisma_1.default.habit_logs.findMany({
        where: { habit_id: habitId },
        orderBy: { date: 'desc' },
        select: { date: true },
    });
    if (logs.length === 0)
        return 0;
    let streak = 0;
    let expectedDate = today;
    const mostRecent = logs[0].date;
    const gap = daysBetween(today, mostRecent);
    if (gap > 1)
        return 0;
    if (gap === 1)
        expectedDate = new Date(today.getTime() - 86400000);
    for (const log of logs) {
        const diff = daysBetween(expectedDate, log.date);
        if (diff === 0) {
            streak++;
            expectedDate = new Date(expectedDate.getTime() - 86400000);
        }
        else if (diff > 0) {
            break;
        }
    }
    return streak;
}
async function autoFailExpiredGoals(userId, today) {
    await prisma_1.default.goals.updateMany({
        where: {
            user_id: userId,
            is_active: true,
            status: 'in_progress',
            deadline: { lt: today, not: null },
        },
        data: { status: 'failed' },
    });
}
const overview = async (req, res) => {
    try {
        const user = await prisma_1.default.users.findUnique({
            where: { user_id: req.userId },
            select: { timezone: true },
        });
        const timezone = user?.timezone ?? 'UTC';
        const today = getTodayInTimezone(timezone);
        await autoFailExpiredGoals(req.userId, today);
        const [habits, goals, totalLogs, todayLogs] = await Promise.all([
            prisma_1.default.habits.findMany({
                where: { user_id: req.userId, is_active: true },
                select: { habit_id: true, name: true, icon: true, color: true },
            }),
            prisma_1.default.goals.findMany({
                where: { user_id: req.userId, is_active: true },
                include: { goal_logs: { where: { completed: true } } },
            }),
            prisma_1.default.habit_logs.count({ where: { user_id: req.userId } }),
            prisma_1.default.habit_logs.count({ where: { user_id: req.userId, date: today } }),
        ]);
        const habitStreaks = await Promise.all(habits.map(async (h) => ({
            habit_id: h.habit_id,
            name: h.name,
            icon: h.icon,
            color: h.color,
            streak: await calculateStreak(h.habit_id, timezone),
        })));
        const goalsProgress = goals.map((g) => {
            const currentDays = Math.min(g.goal_logs.length, g.target_days); // clamp do target_days
            const rawPercent = (g.goal_logs.length / g.target_days) * 100;
            const percent = Math.min(100, Math.round(rawPercent)); // clamp do 100%
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.overview = overview;
const habitStats = async (req, res) => {
    const { id } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(365, Math.max(1, Number(req.query.limit) || 90));
    try {
        const habit = await prisma_1.default.habits.findFirst({
            where: { habit_id: Number(id), user_id: req.userId },
        });
        if (!habit) {
            res.status(404).json({ message: 'Nawyk nie znaleziony' });
            return;
        }
        const user = await prisma_1.default.users.findUnique({
            where: { user_id: req.userId },
            select: { timezone: true },
        });
        const timezone = user?.timezone ?? 'UTC';
        const [logs, totalCount] = await Promise.all([
            prisma_1.default.habit_logs.findMany({
                where: { habit_id: Number(id) },
                orderBy: { date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma_1.default.habit_logs.count({ where: { habit_id: Number(id) } }),
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.habitStats = habitStats;
//# sourceMappingURL=stats.controller.js.map