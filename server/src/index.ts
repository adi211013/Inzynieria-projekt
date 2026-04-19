import express from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
import habitsRoutes from './routes/habits.routes';

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});