"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGoal = exports.updateGoal = exports.createGoal = exports.getGoal = exports.getGoals = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getGoals = async (req, res) => {
    try {
        const goals = await prisma_1.default.goals.findMany({
            where: { user_id: req.userId, is_active: true },
            include: { habits: true },
            orderBy: { created_at: 'desc' },
        });
        res.json(goals);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.getGoals = getGoals;
const getGoal = async (req, res) => {
    const { id } = req.params;
    try {
        const goal = await prisma_1.default.goals.findFirst({
            where: { goal_id: Number(id), user_id: req.userId, is_active: true },
            include: { habits: true, goal_logs: true },
        });
        if (!goal) {
            res.status(404).json({ message: 'Cel nie znaleziony' });
            return;
        }
        res.json(goal);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.getGoal = getGoal;
const createGoal = async (req, res) => {
    const { habit_id, name, description, category, icon, color, frequency, target_days, deadline, notifications_enabled, reminder_time, } = req.body;
    if (!habit_id || !name || !target_days || !frequency) {
        res.status(400).json({ message: 'Pola habit_id, name, target_days, frequency są wymagane' });
        return;
    }
    if (!Number.isInteger(target_days) || target_days < 1) {
        res.status(400).json({ message: 'target_days musi być liczbą całkowitą >= 1' });
        return;
    }
    try {
        // sprawdź czy habit należy do usera
        const habit = await prisma_1.default.habits.findFirst({
            where: { habit_id: Number(habit_id), user_id: req.userId, is_active: true },
        });
        if (!habit) {
            res.status(404).json({ message: 'Nawyk nie znaleziony' });
            return;
        }
        const goal = await prisma_1.default.goals.create({
            data: {
                user_id: req.userId,
                habit_id: Number(habit_id),
                name,
                description,
                category,
                icon,
                color,
                frequency,
                target_days,
                deadline: deadline ? new Date(deadline) : null,
                notifications_enabled: notifications_enabled ?? false,
                reminder_time,
            },
        });
        res.status(201).json(goal);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.createGoal = createGoal;
const updateGoal = async (req, res) => {
    const { id } = req.params;
    const { name, description, category, icon, color, frequency, target_days, status, deadline, notifications_enabled, reminder_time, } = req.body;
    try {
        const goal = await prisma_1.default.goals.findFirst({
            where: { goal_id: Number(id), user_id: req.userId, is_active: true },
        });
        if (!goal) {
            res.status(404).json({ message: 'Cel nie znaleziony' });
            return;
        }
        if (status !== undefined && !['in_progress', 'completed', 'failed'].includes(status)) {
            res.status(400).json({ message: 'Nieprawidłowy status' });
            return;
        }
        const updated = await prisma_1.default.goals.update({
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
                deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
                notifications_enabled,
                reminder_time,
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.updateGoal = updateGoal;
const deleteGoal = async (req, res) => {
    const { id } = req.params;
    try {
        const goal = await prisma_1.default.goals.findFirst({
            where: { goal_id: Number(id), user_id: req.userId, is_active: true },
        });
        if (!goal) {
            res.status(404).json({ message: 'Cel nie znaleziony' });
            return;
        }
        await prisma_1.default.goals.update({
            where: { goal_id: Number(id) },
            data: { is_active: false },
        });
        res.json({ message: 'Cel usunięty' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.deleteGoal = deleteGoal;
//# sourceMappingURL=goals.controller.js.map