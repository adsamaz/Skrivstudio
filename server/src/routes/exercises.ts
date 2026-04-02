import { Router, Response, Request } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { ExerciseCategory, ExerciseDifficulty, ExerciseType } from '@skrivstudio/shared';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const { category, difficulty, type } = req.query;

    const where: Prisma.ExerciseWhereInput = {};
    if (category) where.category = (Array.isArray(category) ? category[0] : category) as ExerciseCategory;
    if (difficulty) where.difficulty = Number(Array.isArray(difficulty) ? difficulty[0] : difficulty) as ExerciseDifficulty;
    if (type) where.type = (Array.isArray(type) ? type[0] : type) as ExerciseType;

    try {
        const exercises = await prisma.exercise.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { questions: true } } },
        });

        res.json(
            exercises.map((e) => ({
                id: e.id,
                title: e.title,
                type: e.type,
                difficulty: e.difficulty,
                category: e.category,
                xpReward: e.xpReward,
                questionCount: e._count.questions,
            })),
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const exercise = await prisma.exercise.findUnique({
            where: { id: String(req.params.id) },
            include: { questions: { orderBy: { order: 'asc' } } },
        });

        if (!exercise) {
            res.status(404).json({ error: 'Övningen hittades inte' });
            return;
        }

        res.json({
            id: exercise.id,
            title: exercise.title,
            instructions: exercise.instructions,
            type: exercise.type,
            difficulty: exercise.difficulty,
            category: exercise.category,
            xpReward: exercise.xpReward,
            createdAt: exercise.createdAt.toISOString(),
            questions: exercise.questions.map((q) => ({
                id: q.id,
                order: q.order,
                data: q.data,
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

export default router;
