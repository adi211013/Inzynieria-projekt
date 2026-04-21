import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth.routes';
import { habitsRouter } from './routes/habits.routes';
import { goalsRouter } from './routes/goals.routes';
import { logsRouter } from './routes/logs.routes';
import { statsRouter } from './routes/stats.routes';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/stats', statsRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});