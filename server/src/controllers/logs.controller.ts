import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

function toUserLocalDate(isoUtc: string, timezone: string): Date {
  const d = new Date(isoUtc);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;

  return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

async function getUserTimezone(userId: number): Promise<string> {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { timezone: true },
  });
  return user?.timezone ?? 'UTC';
}

export const createLog = async (req: AuthRequest, res: Response) => {
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
    const timezone = await getUserTimezone(req.userId!);
    const localDate = toUserLocalDate(date, timezone);

    if (type === 'habit') {
      const { habit_id, value } = req.body;

      if (!habit_id) {
        res.status(400).json({ message: 'Pole "habit_id" jest wymagane' });
        return;
      }

      const habit = await prisma.habits.findFirst({
        where: { habit_id: Number(habit_id), user_id: req.userId!, is_active: true },
      });

      if (!habit) {
        res.status(404).json({ message: 'Nawyk nie znaleziony' });
        return;
      }

      const log = await prisma.habit_logs.upsert({
        where: { habit_id_date: { habit_id: Number(habit_id), date: localDate } },
        create: {
          user_id: req.userId!,
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

    const goal = await prisma.goals.findFirst({
      where: { goal_id: Number(goal_id), user_id: req.userId!, is_active: true },
    });

    if (!goal) {
      res.status(404).json({ message: 'Cel nie znaleziony' });
      return;
    }

    const log = await prisma.goal_logs.upsert({
      where: { goal_id_date: { goal_id: Number(goal_id), date: localDate } },
      create: {
        user_id: req.userId!,
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
};

export const deleteLog = async (req: AuthRequest, res: Response) => {
  const { type, date } = req.body;

  if (!type || !date) {
    res.status(400).json({ message: 'Pola "type" i "date" są wymagane' });
    return;
  }

  try {
    const timezone = await getUserTimezone(req.userId!);
    const localDate = toUserLocalDate(date, timezone);

    if (type === 'habit') {
      const { habit_id } = req.body;
      await prisma.habit_logs.deleteMany({
        where: { habit_id: Number(habit_id), user_id: req.userId!, date: localDate },
      });
      res.json({ message: 'Log nawyku usunięty' });
      return;
    }

    if (type === 'goal') {
      const { goal_id } = req.body;
      await prisma.goal_logs.deleteMany({
        where: { goal_id: Number(goal_id), user_id: req.userId!, date: localDate },
      });
      res.json({ message: 'Log celu usunięty' });
      return;
    }

    res.status(400).json({ message: 'Nieprawidłowy "type"' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
};
