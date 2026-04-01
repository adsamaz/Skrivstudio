import { Router, Response } from 'express';
import { prisma } from '../db/client.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { xpForLevel, levelFromXp } from '../utils/xp.js';

const router = Router();

router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;

    try {
        const [user, streak, categoryProgress] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.streak.findUnique({ where: { userId } }),
            prisma.userProgress.findMany({ where: { userId } }),
        ]);

        if (!user) {
            res.status(404).json({ error: 'Användare hittades inte' });
            return;
        }

        const level = levelFromXp(user.totalXp);
        const xpToNextLevel = xpForLevel(level + 1) - user.totalXp;

        res.json({
            totalXp: user.totalXp,
            level,
            xpToNextLevel: Math.max(0, xpToNextLevel),
            currentStreak: streak?.currentStreak ?? 0,
            longestStreak: streak?.longestStreak ?? 0,
            categoryProgress: categoryProgress.map((p) => ({
                category: p.category,
                masteryPercent: Math.round(p.masteryPercent),
                attemptsCount: p.attemptsCount,
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

router.get('/me/attempts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;

    try {
        const attempts = await prisma.exerciseAttempt.findMany({
            where: { userId },
            orderBy: { completedAt: 'desc' },
            take: 20,
            include: { exercise: { select: { title: true } } },
        });

        res.json(
            attempts.map((a) => ({
                id: a.id,
                exerciseId: a.exerciseId,
                exerciseTitle: a.exercise.title,
                score: a.score,
                xpEarned: a.xpEarned,
                completedAt: a.completedAt.toISOString(),
            })),
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

export default router;
