import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const teacher = await prisma.user.findFirst({ where: { role: 'teacher' } });
    if (!teacher) {
        console.error('No teacher account found. Run db:seed first to create one.');
        process.exit(1);
    }

    console.log(`Using teacher account: ${teacher.username}`);

    // 1. identifiera · Satsdelar · difficulty 1 (Lätt)
    const ex1 = await prisma.exercise.create({
        data: {
            title: 'Hitta adjektivet',
            instructions: 'Klicka på adjektivet (beskrivande ord) i varje mening.',
            type: 'identifiera',
            difficulty: 1,
            category: 'Ordklasser',
            xpReward: 30,
            createdById: teacher.id,
            questions: {
                create: [
                    {
                        order: 0,
                        data: {
                            words: ['Den', 'röda', 'bilen', 'kör', 'fort'],
                            correctIndices: [1],
                            targetLabel: 'adjektivet',
                        },
                    },
                    {
                        order: 1,
                        data: {
                            words: ['Hon', 'har', 'ett', 'vackert', 'leende'],
                            correctIndices: [3],
                            targetLabel: 'adjektivet',
                        },
                    },
                    {
                        order: 2,
                        data: {
                            words: ['Gamla', 'huset', 'stod', 'på', 'kullen'],
                            correctIndices: [0],
                            targetLabel: 'adjektivet',
                        },
                    },
                ],
            },
        },
    });
    console.log(`Created: ${ex1.title} (id: ${ex1.id})`);

    // 2. valjRatt · Interpunktion · difficulty 1 (Lätt)
    const ex2 = await prisma.exercise.create({
        data: {
            title: 'Rätt skiljetecken',
            instructions: 'Välj vilket skiljetecken som passar bäst i meningen.',
            type: 'valjRatt',
            difficulty: 1,
            category: 'Interpunktion',
            xpReward: 30,
            createdById: teacher.id,
            questions: {
                create: [
                    {
                        order: 0,
                        data: {
                            question: 'Vad sätter du efter en fråga: "Vart går du___"',
                            options: ['.', '!', '?', ','],
                            correctIndex: 2,
                        },
                    },
                    {
                        order: 1,
                        data: {
                            question: 'Vilket tecken listar upp saker: "Jag köpte äpplen___ päron och bananer."',
                            options: ['.', ';', ':', ','],
                            correctIndex: 3,
                        },
                    },
                    {
                        order: 2,
                        data: {
                            question: 'Vilket tecken avslutar en uppmaning: "Sitt ner___"',
                            options: ['?', '.', '!', ','],
                            correctIndex: 2,
                        },
                    },
                    {
                        order: 3,
                        data: {
                            question: 'Vad används för att introducera en förklaring: "Han var trött___ han hade inte sovit."',
                            options: [',', ';', ':', '.'],
                            correctIndex: 0,
                        },
                    },
                ],
            },
        },
    });
    console.log(`Created: ${ex2.title} (id: ${ex2.id})`);

    // 3. fyllI · Stavning · difficulty 2 (Medel)
    const ex3 = await prisma.exercise.create({
        data: {
            title: 'Stavning: dubbelkonsonant',
            instructions: 'Fyll i ordet med rätt stavning (enkelt eller dubbelt konsonant).',
            type: 'fyllI',
            difficulty: 2,
            category: 'Stavning',
            xpReward: 50,
            createdById: teacher.id,
            questions: {
                create: [
                    {
                        order: 0,
                        data: {
                            sentence: 'Han ___ sig på axeln. (kla/klappa)',
                            answer: 'klappade',
                            hint: 'Kort vokal före konsonanten kräver dubbelskrivning.',
                        },
                    },
                    {
                        order: 1,
                        data: {
                            sentence: 'Hon ___ ut genom fönstret. (tita/titta)',
                            answer: 'tittade',
                            hint: 'Kort vokal i "titta" → dubbel t.',
                        },
                    },
                    {
                        order: 2,
                        data: {
                            sentence: 'Vi ___ på sjön hela dagen. (fiska/fissca)',
                            answer: 'fiskade',
                            hint: 'Lång vokal i "fiska" → enkel k.',
                        },
                    },
                    {
                        order: 3,
                        data: {
                            sentence: 'Barnen ___ länge utomhus. (leka/lecka)',
                            answer: 'lekte',
                            hint: 'Imperfektform av "leka".',
                        },
                    },
                ],
            },
        },
    });
    console.log(`Created: ${ex3.title} (id: ${ex3.id})`);

    // 4. ordna · Meningsbyggnad · difficulty 2 (Medel)
    const ex4 = await prisma.exercise.create({
        data: {
            title: 'Ordna bisatsen',
            instructions: 'Dra orden till rätt ordning. Obs: bisatsen har inverterad ordföljd.',
            type: 'ordna',
            difficulty: 2,
            category: 'Meningsbyggnad',
            xpReward: 50,
            createdById: teacher.id,
            questions: {
                create: [
                    {
                        order: 0,
                        data: {
                            words: ['att', 'han', 'inte', 'kom', 'Jag', 'visste'],
                            correctOrder: [4, 5, 0, 1, 2, 3],
                        },
                    },
                    {
                        order: 1,
                        data: {
                            words: ['regnar', 'om', 'det', 'vet', 'Ingen'],
                            correctOrder: [4, 3, 1, 2, 0],
                        },
                    },
                    {
                        order: 2,
                        data: {
                            words: ['när', 'stannade', 'han', 'tåget', 'Hon', 'frågade'],
                            correctOrder: [4, 5, 0, 3, 1, 2],
                        },
                    },
                ],
            },
        },
    });
    console.log(`Created: ${ex4.title} (id: ${ex4.id})`);

    // 5. valjRatt · Satsdelar · difficulty 3 (Svår)
    const ex5 = await prisma.exercise.create({
        data: {
            title: 'Adverbial eller objekt?',
            instructions: 'Bestäm om det markerade ledet är ett adverbial eller ett objekt.',
            type: 'valjRatt',
            difficulty: 3,
            category: 'Satsdelar',
            xpReward: 75,
            createdById: teacher.id,
            questions: {
                create: [
                    {
                        order: 0,
                        data: {
                            question: 'I meningen "Hon läste BOKEN snabbt" – vad är "boken"?',
                            options: ['Subjekt', 'Predikat', 'Objekt', 'Adverbial'],
                            correctIndex: 2,
                        },
                    },
                    {
                        order: 1,
                        data: {
                            question: 'I meningen "Han sov I SOFFAN" – vad är "i soffan"?',
                            options: ['Subjekt', 'Predikat', 'Objekt', 'Adverbial'],
                            correctIndex: 3,
                        },
                    },
                    {
                        order: 2,
                        data: {
                            question: 'I meningen "De spelade FOTBOLL IGÅR" – vad är "fotboll"?',
                            options: ['Subjekt', 'Predikat', 'Objekt', 'Adverbial'],
                            correctIndex: 2,
                        },
                    },
                    {
                        order: 3,
                        data: {
                            question: 'I meningen "De spelade fotboll IGÅR" – vad är "igår"?',
                            options: ['Subjekt', 'Predikat', 'Objekt', 'Adverbial'],
                            correctIndex: 3,
                        },
                    },
                    {
                        order: 4,
                        data: {
                            question: 'I meningen "Läraren gav ELEVERNA läxan" – vad är "eleverna"?',
                            options: ['Subjekt', 'Indirekt objekt', 'Direkt objekt', 'Adverbial'],
                            correctIndex: 1,
                        },
                    },
                ],
            },
        },
    });
    console.log(`Created: ${ex5.title} (id: ${ex5.id})`);

    console.log('\nDone! 5 exercises created.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
