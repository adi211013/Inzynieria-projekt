"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.me = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const VALID_THEMES = ['light', 'dark'];
const VALID_LANGUAGES = ['pl', 'en'];
const userSelect = {
    user_id: true,
    username: true,
    email: true,
    display_name: true,
    theme: true,
    timezone: true,
    language: true,
    notifications_enabled: true,
    reminder_time: true,
    created_at: true,
};
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
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                theme: user.theme,
                timezone: user.timezone,
                language: user.language,
            }
        });
    }
    catch (error) {
        console.error(error);
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
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                theme: user.theme,
                timezone: user.timezone,
                language: user.language,
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        const user = await prisma_1.default.users.findUnique({
            where: { user_id: req.userId },
            select: userSelect,
        });
        if (!user) {
            res.status(404).json({ message: 'Użytkownik nie znaleziony' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.me = me;
const updateUser = async (req, res) => {
    const { username, email, password, display_name, theme, timezone, language, notifications_enabled, reminder_time, } = req.body;
    try {
        const data = {};
        if (username !== undefined)
            data.username = username;
        if (email !== undefined)
            data.email = email;
        if (password !== undefined)
            data.password = await bcrypt_1.default.hash(password, 10);
        if (display_name !== undefined)
            data.display_name = display_name;
        if (notifications_enabled !== undefined)
            data.notifications_enabled = notifications_enabled;
        if (reminder_time !== undefined)
            data.reminder_time = reminder_time;
        if (theme !== undefined) {
            if (!VALID_THEMES.includes(theme)) {
                res.status(400).json({ message: `Nieprawidłowy motyw. Dozwolone: ${VALID_THEMES.join(', ')}` });
                return;
            }
            data.theme = theme;
        }
        if (language !== undefined) {
            if (!VALID_LANGUAGES.includes(language)) {
                res.status(400).json({ message: `Nieprawidłowy język. Dozwolone: ${VALID_LANGUAGES.join(', ')}` });
                return;
            }
            data.language = language;
        }
        if (timezone !== undefined) {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: timezone });
                data.timezone = timezone;
            }
            catch {
                res.status(400).json({ message: 'Nieprawidłowa strefa czasowa (IANA)' });
                return;
            }
        }
        if (reminder_time !== undefined && reminder_time !== null) {
            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(reminder_time)) {
                res.status(400).json({ message: 'Nieprawidłowy format czasu (HH:MM)' });
                return;
            }
        }
        if (Object.keys(data).length === 0) {
            res.status(400).json({ message: 'Brak danych do aktualizacji' });
            return;
        }
        const user = await prisma_1.default.users.update({
            where: { user_id: req.userId },
            data,
            select: userSelect,
        });
        res.json(user);
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(409).json({ message: 'Email lub nazwa użytkownika już zajęta' });
            return;
        }
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        await prisma_1.default.users.delete({ where: { user_id: req.userId } });
        res.json({ message: 'Konto zostało usunięte' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=auth.controller.js.map