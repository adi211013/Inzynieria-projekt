import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/users', async (req, res) => {
    const users = await prisma.users.findMany();
    res.json(users);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});