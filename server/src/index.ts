import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRouter from './routes/auth.js';
import exercisesRouter from './routes/exercises.js';
import attemptsRouter from './routes/attempts.js';
import progressRouter from './routes/progress.js';
import adminRouter from './routes/admin.js';

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:3004',
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/attempts', attemptsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/admin', adminRouter);

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = Number(process.env.PORT) || 4001;
app.listen(PORT, () => {
    console.log(`Skrivstudio server running on http://localhost:${PORT}`);
});
