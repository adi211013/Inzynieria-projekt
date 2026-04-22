"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const auth_routes_1 = require("./routes/auth.routes");
const habits_routes_1 = require("./routes/habits.routes");
const goals_routes_1 = require("./routes/goals.routes");
const logs_routes_1 = require("./routes/logs.routes");
const stats_routes_1 = require("./routes/stats.routes");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost,http://localhost:3000,http://localhost:80')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error(`CORS: origin ${origin} nie jest dozwolony`));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/auth', auth_routes_1.authRouter);
app.use('/api/habits', habits_routes_1.habitsRouter);
app.use('/api/goals', goals_routes_1.goalsRouter);
app.use('/api/logs', logs_routes_1.logsRouter);
app.use('/api/stats', stats_routes_1.statsRouter);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS allowed origins:`, allowedOrigins);
});
//# sourceMappingURL=index.js.map