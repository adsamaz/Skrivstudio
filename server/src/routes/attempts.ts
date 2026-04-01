import { Router, Response } from 'express';
import { prisma } from '../db/client.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { SubmitAttemptRequest, AchievementPublic } from '@skrivstudio/shared';
import { levelFromXp, xpForLevel } from '../utils/xp.js';

const router = Router();

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { exerciseId, score, timeTakenMs } = req.body as SubmitAttemptRequest;
    const userId = req.user!.userId;

    if (score < 0 || score > 100) {
        res.status(400).json({ error: 'Poäng måste vara 0–100' });
        return;
    }

    try {
        const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
        if (!exercise) {
            res.status(404).json({ error: 'Övningen hittades inte' });
            return;
        }

        const xpEarned = Math.round(exercise.xpReward * (score / 100));
        const category = exercise.category;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create attempt
            await tx.exerciseAttempt.create({
                data: { userId, exerciseId, score, xpEarned, timeTakenMs },
            });

            // 2. Update user XP + level
            const user = await tx.user.update({
                where: { id: userId },
                data: { totalXp: { increment: xpEarned } },
            });
            const newTotalXp = user.totalXp;
            const newLevel = levelFromXp(newTotalXp);
            const oldLevel = user.level;
            const leveledUp = newLevel > oldLevel;
            if (leveledUp) {
                await tx.user.update({ where: { id: userId }, data: { level: newLevel } });
            }

            // 3. Upsert UserProgress for this category
            const existingProgress = await tx.userProgress.findUnique({
                where: { userId_category: { userId, category } },
            });

            // Compute new mastery as rolling average of all scores in this category
            const allAttempts = await tx.exerciseAttempt.findMany({
                where: { userId, exercise: { category } },
                select: { score: true },
            });
            const masteryPercent =
                allAttempts.length > 0
                    ? allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length
                    : score;

            if (existingProgress) {
                await tx.userProgress.update({
                    where: { userId_category: { userId, category } },
                    data: {
                        masteryPercent,
                        attemptsCount: { increment: 1 },
                    },
                });
            } else {
                await tx.userProgress.create({
                    data: { userId, category, masteryPercent, attemptsCount: 1 },
                });
            }

            // 4. Upsert Streak
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let streakRecord = await tx.streak.findUnique({ where: { userId } });
            let newStreak = 1;

            if (streakRecord) {
                const last = streakRecord.lastPracticeDate
                    ? new Date(streakRecord.lastPracticeDate)
                    : null;
                if (last) {
                    last.setHours(0, 0, 0, 0);
                    const daysDiff = Math.round(
                        (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
                    );
                    if (daysDiff === 0) {
                        newStreak = streakRecord.currentStreak;
                    } else if (daysDiff === 1) {
                        newStreak = streakRecord.currentStreak + 1;
                    } else {
                        newStreak = 1;
                    }
                }
                const longestStreak = Math.max(newStreak, streakRecord.longestStreak);
                streakRecord = await tx.streak.update({
                    where: { userId },
                    data: { currentStreak: newStreak, longestStreak, lastPracticeDate: today },
                });
            } else {
                streakRecord = await tx.streak.create({
                    data: { userId, currentStreak: 1, longestStreak: 1, lastPracticeDate: today },
                });
            }

            // 5. Check achievements
            const alreadyEarned = await tx.userAchievement.findMany({
                where: { userId },
                select: { achievementId: true },
            });
            const earnedIds = new Set(alreadyEarned.map((a) => a.achievementId));

            const allAchievements = await tx.achievement.findMany();
            const totalAttempts = await tx.exerciseAttempt.count({ where: { userId } });

            const toUnlock: string[] = [];
            for (const ach of allAchievements) {
                if (earnedIds.has(ach.id)) continue;
                let unlock = false;
                switch (ach.key) {
                    case 'first_exercise':
                        unlock = totalAttempts === 1;
                        break;
                    case 'streak_3':
                        unlock = newStreak >= 3;
                        break;
                    case 'streak_7':
                        unlock = newStreak >= 7;
                        break;
                    case 'streak_30':
                        unlock = newStreak >= 30;
                        break;
                    case 'perfect_score':
                        unlock = score === 100;
                        break;
                    case 'xp_1000':
                        unlock = newTotalXp >= 1000;
                        break;
                }
                if (unlock) toUnlock.push(ach.id);
            }

            let bonusXp = 0;
            const unlockedAchievements: AchievementPublic[] = [];
            for (const achId of toUnlock) {
                await tx.userAchievement.create({ data: { userId, achievementId: achId } });
                const ach = allAchievements.find((a) => a.id === achId)!;
                bonusXp += ach.xpBonus;
                unlockedAchievements.push({
                    id: ach.id,
                    key: ach.key,
                    title: ach.title,
                    description: ach.description,
                    xpBonus: ach.xpBonus,
                });
            }

            if (bonusXp > 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: { totalXp: { increment: bonusXp } },
                });
            }

            const finalXp = newTotalXp + bonusXp;
            const finalLevel = levelFromXp(finalXp);
            const xpToNextLevel = xpForLevel(finalLevel + 1) - finalXp;

            return {
                xpEarned: xpEarned + bonusXp,
                newTotalXp: finalXp,
                newLevel: finalLevel,
                leveledUp: leveledUp || finalLevel > newLevel,
                newStreak,
                xpToNextLevel,
                achievementsUnlocked: unlockedAchievements,
            };
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

export default router;
