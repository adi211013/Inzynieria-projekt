"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const register = async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        res.status(400).json({ message: 'Wszystkie pola są wymagane' });
        return;
    }
    try {
        const existing = await prisma_1.default.users.findFirst({
            where: { OR: [{ email }, { username }] }
        });
        if (existing) {
            res.status(409).json({ message: 'Email lub nazwa użytkownika już istnieje' });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_1.default.users.create({
            data: { username, email, password: hashedPassword }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: { id: user.user_id, username: user.username, email: user.email }
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ message: 'Email i hasło są wymagane' });
        return;
    }
    try {
        const user = await prisma_1.default.users.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
            return;
        }
        const valid = await bcrypt_1.default.compare(password, user.password);
        if (!valid) {
            res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user.user_id, username: user.username, email: user.email }
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        const user = await prisma_1.default.users.findUnique({
            where: { user_id: req.userId },
            select: { user_id: true, username: true, email: true, created_at: true }
        });
        if (!user) {
            res.status(404).json({ message: 'Użytkownik nie znaleziony' });
            return;
        }
        res.json(user);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.me = me;
//# sourceMappingURL=auth.controller.js.map