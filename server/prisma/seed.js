"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Seeding achievements...');
    const achievements = [
        { key: 'first_exercise', title: 'Första steget', description: 'Slutförde din första övning', xpBonus: 25 },
        { key: 'streak_3', title: '3-dagars streak', description: 'Tränade 3 dagar i rad', xpBonus: 50 },
        { key: 'streak_7', title: 'Veckosegrare', description: 'Tränade 7 dagar i rad', xpBonus: 150 },
        { key: 'streak_30', title: 'Månadshjälte', description: 'Tränade 30 dagar i rad', xpBonus: 500 },
        { key: 'perfect_score', title: 'Perfekt!', description: 'Fick 100% på en övning', xpBonus: 75 },
        { key: 'xp_1000', title: 'XP-samlare', description: 'Samlade 1000 XP totalt', xpBonus: 100 },
    ];
    for (const ach of achievements) {
        await prisma.achievement.upsert({
            where: { key: ach.key },
            update: ach,
            create: ach,
        });
    }
    console.log('Creating teacher account...');
    const passwordHash = await bcryptjs_1.default.hash('larare123', 10);
    await prisma.user.upsert({
        where: { username: 'larare' },
        update: {},
        create: { username: 'larare', passwordHash, role: 'teacher' },
    });
    const teacher = await prisma.user.findUnique({ where: { username: 'larare' } });
    if (!teacher)
        throw new Error('Teacher not found');
    console.log('Creating sample exercises...');
    // Exercise 1: Identifiera predikatet
    const ex1 = await prisma.exercise.upsert({
        where: { id: 'seed-ex-1' },
        update: {},
        create: {
            id: 'seed-ex-1',
            title: 'Identifiera predikatet',
            instructions: 'Klicka på predikatet (verbfrasen) i varje mening.',
            type: 'identifiera',
            difficulty: 1,
            category: 'Satsdelar',
            xpReward: 30,
            createdById: teacher.id,
        },
    });
    await prisma.question.deleteMany({ where: { exerciseId: ex1.id } });
    await prisma.question.createMany({
        data: [
            {
                exerciseId: ex1.id,
                order: 0,
                data: {
                    words: ['Hunden', 'springer', 'snabbt', 'i', 'parken'],
                    correctIndices: [1],
                    targetLabel: 'predikatet',
                },
            },
            {
                exerciseId: ex1.id,
                order: 1,
                data: {
                    words: ['Maria', 'äter', 'en', 'stor', 'pizza'],
                    correctIndices: [1],
                    targetLabel: 'predikatet',
                },
            },
            {
                exerciseId: ex1.id,
                order: 2,
                data: {
                    words: ['Vi', 'har', 'spelat', 'fotboll', 'hela', 'dagen'],
                    correctIndices: [1, 2],
                    targetLabel: 'predikatet',
                },
            },
        ],
    });
    // Exercise 2: Identifiera subjektet
    const ex2 = await prisma.exercise.upsert({
        where: { id: 'seed-ex-2' },
        update: {},
        create: {
            id: 'seed-ex-2',
            title: 'Identifiera subjektet',
            instructions: 'Klicka på subjektet (vem eller vad som gör något) i varje mening.',
            type: 'identifiera',
            difficulty: 1,
            category: 'Satsdelar',
            xpReward: 30,
            createdById: teacher.id,
        },
    });
    await prisma.question.deleteMany({ where: { exerciseId: ex2.id } });
    await prisma.question.createMany({
        data: [
            {
                exerciseId: ex2.id,
                order: 0,
                data: {
                    words: ['Katten', 'sover', 'på', 'soffan'],
                    correctIndices: [0],
                    targetLabel: 'subjektet',
                },
            },
            {
                exerciseId: ex2.id,
                order: 1,
                data: {
                    words: ['Den', 'gamla', 'mannen', 'läser', 'tidningen'],
                    correctIndices: [0, 1, 2],
                    targetLabel: 'subjektet',
                },
            },
        ],
    });
    // Exercise 3: Ordna meningar
    const ex3 = await prisma.exercise.upsert({
        where: { id: 'seed-ex-3' },
        update: {},
        create: {
            id: 'seed-ex-3',
            title: 'Ordna meningar',
            instructions: 'Dra orden till rätt ordning för att bilda korrekta meningar.',
            type: 'ordna',
            difficulty: 2,
            category: 'Meningsbyggnad',
            xpReward: 50,
            createdById: teacher.id,
        },
    });
    await prisma.question.deleteMany({ where: { exerciseId: ex3.id } });
    await prisma.question.createMany({
        data: [
            {
                exerciseId: ex3.id,
                order: 0,
                data: {
                    words: ['äter', 'lunch', 'Vi', 'idag'],
                    correctOrder: [2, 0, 1, 3],
                },
            },
            {
                exerciseId: ex3.id,
                order: 1,
                data: {
                    words: ['boken', 'läste', 'Han', 'igår', 'hela'],
                    correctOrder: [2, 1, 4, 0, 3],
                },
            },
            {
                exerciseId: ex3.id,
                order: 2,
                data: {
                    words: ['skolan', 'till', 'cyklar', 'varje', 'dag', 'hon'],
                    correctOrder: [5, 2, 1, 0, 3, 4],
                },
            },
        ],
    });
    // Exercise 4: Fyll i rätt form
    const ex4 = await prisma.exercise.upsert({
        where: { id: 'seed-ex-4' },
        update: {},
        create: {
            id: 'seed-ex-4',
            title: 'Fyll i rätt verbform',
            instructions: 'Fyll i rätt form av verbet i parentesen.',
            type: 'fyllI',
            difficulty: 2,
            category: 'Ordklasser',
            xpReward: 50,
            createdById: teacher.id,
        },
    });
    await prisma.question.deleteMany({ where: { exerciseId: ex4.id } });
    await prisma.question.createMany({
        data: [
            {
                exerciseId: ex4.id,
                order: 0,
                data: {
                    sentence: 'Igår ___ vi till stranden. (åka)',
                    answer: 'åkte',
                    hint: 'Imperfektform av "åka"',
                },
            },
            {
                exerciseId: ex4.id,
                order: 1,
                data: {
                    sentence: 'Hon ___ redan hem när jag ringde. (gå)',
                    answer: 'hade gått',
                    hint: 'Pluskvamperfektform',
                },
            },
            {
                exerciseId: ex4.id,
                order: 2,
                data: {
                    sentence: 'De ___ en ny bil nästa vecka. (köpa)',
                    answer: 'ska köpa',
                    hint: 'Futurum med "ska"',
                },
            },
        ],
    });
    // Exercise 5: Välj rätt ordklass
    const ex5 = await prisma.exercise.upsert({
        where: { id: 'seed-ex-5' },
        update: {},
        create: {
            id: 'seed-ex-5',
            title: 'Välj rätt ordklass',
            instructions: 'Välj vilken ordklass det understrukna ordet tillhör.',
            type: 'valjRatt',
            difficulty: 1,
            category: 'Ordklasser',
            xpReward: 30,
            createdById: teacher.id,
        },
    });
    await prisma.question.deleteMany({ where: { exerciseId: ex5.id } });
    await prisma.question.createMany({
        data: [
            {
                exerciseId: ex5.id,
                order: 0,
                data: {
                    question: 'Vilket ordklass är "snabbt" i meningen: "Bilen kör snabbt"?',
                    options: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb'],
                    correctIndex: 3,
                },
            },
            {
                exerciseId: ex5.id,
                order: 1,
                data: {
                    question: 'Vilket ordklass är "springer" i meningen: "Hunden springer"?',
                    options: ['Substantiv', 'Verb', 'Pronomen', 'Adverb'],
                    correctIndex: 1,
                },
            },
            {
                exerciseId: ex5.id,
                order: 2,
                data: {
                    question: 'Vilket ordklass är "hon" i meningen: "Hon läser"?',
                    options: ['Substantiv', 'Verb', 'Pronomen', 'Adjektiv'],
                    correctIndex: 2,
                },
            },
            {
                exerciseId: ex5.id,
                order: 3,
                data: {
                    question: 'Vilket ordklass är "röd" i meningen: "En röd bil"?',
                    options: ['Substantiv', 'Verb', 'Adjektiv', 'Adverb'],
                    correctIndex: 2,
                },
            },
        ],
    });
    // Exercise 6: Identifiera objekt (harder)
    const ex6 = await prisma.exercise.upsert({
        where: { id: 'seed-ex-6' },
        update: {},
        create: {
            id: 'seed-ex-6',
            title: 'Identifiera objektet',
            instructions: 'Klicka på objektet (vad som tar emot handlingen) i varje mening.',
            type: 'identifiera',
            difficulty: 2,
            category: 'Satsdelar',
            xpReward: 50,
            createdById: teacher.id,
        },
    });
    await prisma.question.deleteMany({ where: { exerciseId: ex6.id } });
    await prisma.question.createMany({
        data: [
            {
                exerciseId: ex6.id,
                order: 0,
                data: {
                    words: ['Läraren', 'förklarade', 'grammatiken', 'noggrant'],
                    correctIndices: [2],
                    targetLabel: 'objektet',
                },
            },
            {
                exerciseId: ex6.id,
                order: 1,
                data: {
                    words: ['Anna', 'köpte', 'en', 'ny', 'bok', 'igår'],
                    correctIndices: [2, 3, 4],
                    targetLabel: 'objektet',
                },
            },
        ],
    });
    console.log('Seed completed!');
    console.log('Teacher login: username=larare, password=larare123');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map