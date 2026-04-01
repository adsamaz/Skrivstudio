import { Router, Response } from 'express';
import { prisma } from '../db/client.js';
import { authMiddleware, teacherOnly, AuthenticatedRequest } from '../middleware/auth.js';
import { CreateExerciseRequest, UpdateExerciseRequest } from '@skrivstudio/shared';
import { levelFromXp } from '../utils/xp.js';

const router = Router();
router.use(authMiddleware, teacherOnly);

// List all exercises (teacher view — includes question count)
router.get('/exercises', async (_req, res: Response) => {
    try {
        const exercises = await prisma.exercise.findMany({
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

// Get single exercise with full questions
router.get('/exercises/:id', async (req, res: Response) => {
    try {
        const exercise = await prisma.exercise.findUnique({
            where: { id: req.params.id },
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
            questions: exercise.questions.map((q) => ({ id: q.id, order: q.order, data: q.data })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

// Create exercise
router.post('/exercises', async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as CreateExerciseRequest;
    const { title, instructions, type, difficulty, category, xpReward, questions } = body;

    if (!title || !instructions || !type || !difficulty || !category || !xpReward || !questions?.length) {
        res.status(400).json({ error: 'Alla fält krävs' });
        return;
    }

    try {
        const exercise = await prisma.$transaction(async (tx) => {
            const ex = await tx.exercise.create({
                data: {
                    title,
                    instructions,
                    type,
                    difficulty,
                    category,
                    xpReward,
                    createdById: req.user!.userId,
                },
            });
            await tx.question.createMany({
                data: questions.map((q) => ({
                    exerciseId: ex.id,
                    data: q.data,
                    order: q.order,
                })),
            });
            return tx.exercise.findUnique({
                where: { id: ex.id },
                include: { questions: { orderBy: { order: 'asc' } } },
            });
        });

        res.status(201).json({
            id: exercise!.id,
            title: exercise!.title,
            instructions: exercise!.instructions,
            type: exercise!.type,
            difficulty: exercise!.difficulty,
            category: exercise!.category,
            xpReward: exercise!.xpReward,
            createdAt: exercise!.createdAt.toISOString(),
            questions: exercise!.questions.map((q) => ({ id: q.id, order: q.order, data: q.data })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

// Update exercise
router.put('/exercises/:id', async (req, res: Response) => {
    const body = req.body as UpdateExerciseRequest;
    const { questions, ...fields } = body;

    try {
        const exercise = await prisma.$transaction(async (tx) => {
            await tx.exercise.update({ where: { id: req.params.id }, data: fields });
            if (questions) {
                await tx.question.deleteMany({ where: { exerciseId: req.params.id } });
                await tx.question.createMany({
                    data: questions.map((q) => ({
                        exerciseId: req.params.id,
                        data: q.data,
                        order: q.order,
                    })),
                });
            }
            return tx.exercise.findUnique({
                where: { id: req.params.id },
                include: { questions: { orderBy: { order: 'asc' } } },
            });
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
            questions: exercise.questions.map((q) => ({ id: q.id, order: q.order, data: q.data })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

// Delete exercise
router.delete('/exercises/:id', async (req, res: Response) => {
    try {
        await prisma.exercise.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

// List all students with stats
router.get('/students', async (_req, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            where: { role: 'student' },
            orderBy: { totalXp: 'desc' },
            include: {
                _count: { select: { attempts: true } },
                streak: true,
            },
        });

        res.json(
            users.map((u) => ({
                userId: u.id,
                username: u.username,
                totalXp: u.totalXp,
                level: levelFromXp(u.totalXp),
                currentStreak: u.streak?.currentStreak ?? 0,
                attemptsCount: u._count.attempts,
            })),
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

export default router;
