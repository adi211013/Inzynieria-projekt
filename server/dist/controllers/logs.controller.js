"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLog = exports.createLog = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Konwertuje ISO UTC timestamp na DATE w timezone użytkownika.
 * Np. "2026-04-21T22:30:00Z" dla Warszawy (UTC+2) -> "2026-04-22" (lokalna data)
 * Frontend wysyła ISO UTC, my zamieniamy na datę użytkownika.
 */
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
async function getUserTimezone(userId) {
    const user = await prisma_1.default.users.findUnique({
        where: { user_id: userId },
        select: { timezone: true },
    });
    return user?.timezone ?? 'UTC';
}
/**
 * POST /api/logs
 * Body:
 *   { type: 'habit', habit_id, date (ISO UTC), value?, note? }
 *   { type: 'goal', goal_id, date (ISO UTC), completed?, note? }
 * Działa jak upsert — jeśli log na dany dzień istnieje, aktualizuje go.
 */
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
        // type === 'goal'
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
        res.status(201).json({ type: 'goal', log });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.createLog = createLog;
/**
 * DELETE /api/logs
 * Body: { type, habit_id|goal_id, date (ISO UTC) }
 */
const deleteLog = async (req, res) => {
    const { type, date } = req.body;
    if (!type || !date) {
        res.status(400).json({ message: 'Pola "type" i "date" są wymagane' });
        return;
    }
    try {
        const timezone = await getUserTimezone(req.userId);
        const localDate = toUserLocalDate(date, timezone);
        if (type === 'habit') {
            const { habit_id } = req.body;
            await prisma_1.default.habit_logs.deleteMany({
                where: { habit_id: Number(habit_id), user_id: req.userId, date: localDate },
            });
            res.json({ message: 'Log nawyku usunięty' });
            return;
        }
        if (type === 'goal') {
            const { goal_id } = req.body;
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
//# sourceMappingURL=logs.controller.js.map