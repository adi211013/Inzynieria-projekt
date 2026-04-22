"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogs = exports.deleteLog = exports.createLog = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
function toUserLocalDate(isoUtc, timezone) {
    const d = new Date(isoUtc);
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(d);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return new Date(`${year}-${month}-${day}T00:00:00Z`);
}
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
async function getUserTimezone(userId) {
    const user = await prisma_1.default.users.findUnique({
        where: { user_id: userId },
        select: { timezone: true },
    });
    return user?.timezone ?? 'UTC';
}
async function maybeCompleteGoal(goalId) {
    const goal = await prisma_1.default.goals.findUnique({ where: { goal_id: goalId } });
    if (!goal || goal.status !== 'in_progress')
        return;
    const completedDays = await prisma_1.default.goal_logs.count({
        where: { goal_id: goalId, completed: true },
    });
    if (completedDays >= goal.target_days) {
        await prisma_1.default.goals.update({
            where: { goal_id: goalId },
            data: { status: 'completed' },
        });
    }
}
const createLog = async (req, res) => {
    const { type, date, note } = req.body;
    if (!type || !date) {
        res.status(400).json({ message: 'Pola "type" i "date" są wymagane' });
        return;
    }
    if (type !== 'habit' && type !== 'goal') {
        res.status(400).json({ message: 'Pole "type" musi być "habit" lub "goal"' });
        return;
    }
    try {
        const timezone = await getUserTimezone(req.userId);
        const localDate = toUserLocalDate(date, timezone);
        if (type === 'habit') {
            const { habit_id, value } = req.body;
            if (!habit_id) {
                res.status(400).json({ message: 'Pole "habit_id" jest wymagane' });
                return;
            }
            const habit = await prisma_1.default.habits.findFirst({
                where: { habit_id: Number(habit_id), user_id: req.userId, is_active: true },
            });
            if (!habit) {
                res.status(404).json({ message: 'Nawyk nie znaleziony' });
                return;
            }
            const log = await prisma_1.default.habit_logs.upsert({
                where: { habit_id_date: { habit_id: Number(habit_id), date: localDate } },
                create: {
                    user_id: req.userId,
                    habit_id: Number(habit_id),
                    date: localDate,
                    value: value ?? null,
                    note: note ?? null,
                },
                update: {
                    value: value ?? undefined,
                    note: note ?? undefined,
                },
            });
            res.status(201).json({ type: 'habit', log });
            return;
        }
        const { goal_id, completed } = req.body;
        if (!goal_id) {
            res.status(400).json({ message: 'Pole "goal_id" jest wymagane' });
            return;
        }
        const goal = await prisma_1.default.goals.findFirst({
            where: { goal_id: Number(goal_id), user_id: req.userId, is_active: true },
        });
        if (!goal) {
            res.status(404).json({ message: 'Cel nie znaleziony' });
            return;
        }
        if (goal.status !== 'in_progress') {
            res.status(400).json({
                message: `Cel jest już w stanie "${goal.status}" i nie można do niego logować`,
            });
            return;
        }
        const log = await prisma_1.default.goal_logs.upsert({
            where: { goal_id_date: { goal_id: Number(goal_id), date: localDate } },
            create: {
                user_id: req.userId,
                goal_id: Number(goal_id),
                date: localDate,
                completed: completed ?? true,
                note: note ?? null,
            },
            update: {
                completed: completed ?? undefined,
                note: note ?? undefined,
            },
        });
        await maybeCompleteGoal(Number(goal_id));
        res.status(201).json({ type: 'goal', log });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.createLog = createLog;
const deleteLog = async (req, res) => {
    const { type, date } = req.body;
    if (!type || !date) {
        res.status(400).json({ message: 'Pola "type" i "date" są wymagane' });
        return;
    }
    try {
        const timezone = await getUserTimezone(req.userId);
        const localDate = toUserLocalDate(date, timezone);
        const today = getTodayInTimezone(timezone);
        if (localDate.getTime() !== today.getTime()) {
            res.status(403).json({
                message: 'Można usuwać tylko dzisiejsze logi. Historia jest niemodyfikowalna.',
            });
            return;
        }
        if (type === 'habit') {
            const { habit_id } = req.body;
            if (!habit_id) {
                res.status(400).json({ message: 'Pole "habit_id" jest wymagane' });
                return;
            }
            await prisma_1.default.habit_logs.deleteMany({
                where: { habit_id: Number(habit_id), user_id: req.userId, date: localDate },
            });
            res.json({ message: 'Log nawyku usunięty' });
            return;
        }
        if (type === 'goal') {
            const { goal_id } = req.body;
            if (!goal_id) {
                res.status(400).json({ message: 'Pole "goal_id" jest wymagane' });
                return;
            }
            await prisma_1.default.goal_logs.deleteMany({
                where: { goal_id: Number(goal_id), user_id: req.userId, date: localDate },
            });
            res.json({ message: 'Log celu usunięty' });
            return;
        }
        res.status(400).json({ message: 'Nieprawidłowy "type"' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.deleteLog = deleteLog;
const getLogs = async (req, res) => {
    const { type, id, from, to } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    if (type !== 'habit' && type !== 'goal') {
        res.status(400).json({ message: 'Parametr "type" musi być "habit" lub "goal"' });
        return;
    }
    if (!id) {
        res.status(400).json({ message: 'Parametr "id" jest wymagany' });
        return;
    }
    try {
        const timezone = await getUserTimezone(req.userId);
        const today = getTodayInTimezone(timezone);
        const defaultFrom = new Date(today.getTime() - 29 * 86400000);
        const fromDate = from ? toUserLocalDate(String(from), timezone) : defaultFrom;
        const toDate = to ? toUserLocalDate(String(to), timezone) : today;
        if (fromDate > toDate) {
            res.status(400).json({ message: 'Parametr "from" nie może być większy niż "to"' });
            return;
        }
        if (type === 'habit') {
            const habitId = Number(id);
            const habit = await prisma_1.default.habits.findFirst({
                where: { habit_id: habitId, user_id: req.userId },
            });
            if (!habit) {
                res.status(404).json({ message: 'Nawyk nie znaleziony' });
                return;
            }
            const where = {
                habit_id: habitId,
                user_id: req.userId,
                date: { gte: fromDate, lte: toDate },
            };
            const [logs, total] = await Promise.all([
                prisma_1.default.habit_logs.findMany({
                    where,
                    orderBy: { date: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma_1.default.habit_logs.count({ where }),
            ]);
            res.json({
                data: logs,
                total,
                page,
                limit,
                from: fromDate.toISOString().slice(0, 10),
                to: toDate.toISOString().slice(0, 10),
            });
            return;
        }
        const goalId = Number(id);
        const goal = await prisma_1.default.goals.findFirst({
            where: { goal_id: goalId, user_id: req.userId },
        });
        if (!goal) {
            res.status(404).json({ message: 'Cel nie znaleziony' });
            return;
        }
        const where = {
            goal_id: goalId,
            user_id: req.userId,
            date: { gte: fromDate, lte: toDate },
        };
        const [logs, total] = await Promise.all([
            prisma_1.default.goal_logs.findMany({
                where,
                orderBy: { date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma_1.default.goal_logs.count({ where }),
        ]);
        res.json({
            data: logs,
            total,
            page,
            limit,
            from: fromDate.toISOString().slice(0, 10),
            to: toDate.toISOString().slice(0, 10),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.getLogs = getLogs;
//# sourceMappingURL=logs.controller.js.map