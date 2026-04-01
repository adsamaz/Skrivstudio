// ─────────────────────────────────────────────────
// Core User
// ─────────────────────────────────────────────────
export type UserRole = 'student' | 'teacher';

export interface UserPublic {
    id: string;
    username: string;
    role: UserRole;
}

// ─────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────
export interface RegisterRequest {
    username: string;
    password: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    user: UserPublic;
}

// ─────────────────────────────────────────────────
// Exercise Types & Question Data
// ─────────────────────────────────────────────────
export type ExerciseType = 'identifiera' | 'ordna' | 'fyllI' | 'valjRatt';
export type ExerciseDifficulty = 1 | 2 | 3; // 1=Lätt, 2=Medel, 3=Svår

export type ExerciseCategory =
    | 'Satsdelar'
    | 'Meningsbyggnad'
    | 'Ordklasser'
    | 'Interpunktion'
    | 'Stavning'
    | 'Texttyper';

export interface IdentifieraData {
    words: string[];
    correctIndices: number[];
    targetLabel: string;
}

export interface OrdnaData {
    words: string[];
    correctOrder: number[];
}

export interface FyllIData {
    sentence: string;
    answer: string;
    hint?: string;
}

export interface ValjRattData {
    question: string;
    options: string[];
    correctIndex: number;
}

export type QuestionData = IdentifieraData | OrdnaData | FyllIData | ValjRattData;

// ─────────────────────────────────────────────────
// Exercise API shapes
// ─────────────────────────────────────────────────
export interface QuestionPublic {
    id: string;
    order: number;
    data: QuestionData;
}

export interface ExercisePublic {
    id: string;
    title: string;
    instructions: string;
    type: ExerciseType;
    difficulty: ExerciseDifficulty;
    category: ExerciseCategory;
    xpReward: number;
    createdAt: string;
    questions: QuestionPublic[];
}

export interface ExerciseSummary {
    id: string;
    title: string;
    type: ExerciseType;
    difficulty: ExerciseDifficulty;
    category: ExerciseCategory;
    xpReward: number;
    questionCount: number;
}

// ─────────────────────────────────────────────────
// Attempt
// ─────────────────────────────────────────────────
export interface SubmitAttemptRequest {
    exerciseId: string;
    score: number;
    timeTakenMs: number;
}

export interface SubmitAttemptResponse {
    xpEarned: number;
    newTotalXp: number;
    newLevel: number;
    leveledUp: boolean;
    newStreak: number;
    achievementsUnlocked: AchievementPublic[];
}

// ─────────────────────────────────────────────────
// Progress
// ─────────────────────────────────────────────────
export interface CategoryProgress {
    category: ExerciseCategory;
    masteryPercent: number;
    attemptsCount: number;
}

export interface UserProgressSummary {
    totalXp: number;
    level: number;
    xpToNextLevel: number;
    currentStreak: number;
    longestStreak: number;
    categoryProgress: CategoryProgress[];
}

export interface RecentAttempt {
    id: string;
    exerciseId: string;
    exerciseTitle: string;
    score: number;
    xpEarned: number;
    completedAt: string;
}

// ─────────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────────
export interface AchievementPublic {
    id: string;
    key: string;
    title: string;
    description: string;
    xpBonus: number;
}

// ─────────────────────────────────────────────────
// Admin (Teacher) shapes
// ─────────────────────────────────────────────────
export interface CreateExerciseRequest {
    title: string;
    instructions: string;
    type: ExerciseType;
    difficulty: ExerciseDifficulty;
    category: ExerciseCategory;
    xpReward: number;
    questions: Array<{ data: QuestionData; order: number }>;
}

export interface UpdateExerciseRequest {
    title?: string;
    instructions?: string;
    type?: ExerciseType;
    difficulty?: ExerciseDifficulty;
    category?: ExerciseCategory;
    xpReward?: number;
    questions?: Array<{ data: QuestionData; order: number }>;
}

export interface StudentStats {
    userId: string;
    username: string;
    totalXp: number;
    level: number;
    currentStreak: number;
    attemptsCount: number;
}
