import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import disposableDomains from 'disposable-email-domains';
import { prisma } from '../db/client.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { RegisterRequest, LoginRequest } from '@skrivstudio/shared';

const router = Router();

const DISPOSABLE_EMAIL_DOMAINS = new Set<string>(disposableDomains);


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
};

function signToken(userId: string, username: string, role: string): string {
    return jwt.sign({ userId, username, role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

function createTransport() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

async function sendVerificationEmail(to: string, token: string) {
    const baseUrl = process.env.CLIENT_URL ?? 'http://localhost:3004';
    const link = `${baseUrl}/verify-email?token=${token}`;
    const transporter = createTransport();
    await transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to,
        subject: 'Bekräfta din e-postadress – Skrivstudio',
        html: `
            <p>Välkommen till Skrivstudio!</p>
            <p>Klicka på länken nedan för att bekräfta din e-postadress:</p>
            <p><a href="${link}">${link}</a></p>
            <p>Länken är giltig i 24 timmar.</p>
        `,
        text: `Välkommen till Skrivstudio!\n\nBekräfta din e-postadress:\n${link}\n\nLänken är giltig i 24 timmar.`,
    });
}

router.post('/register', async (req, res: Response) => {
    const { username, email, password } = req.body as RegisterRequest;

    if (!username || !email || !password) {
        res.status(400).json({ error: 'Användarnamn, e-post och lösenord krävs' });
        return;
    }

    if (username.length < 2 || username.length > 30) {
        res.status(400).json({ error: 'Användarnamnet måste vara 2–30 tecken' });
        return;
    }


    if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: 'Ogiltig e-postadress' });
        return;
    }

    const emailDomain = email.split('@')[1].toLowerCase();
    if (DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
        res.status(400).json({ error: 'Engångse-postadresser är inte tillåtna' });
        return;
    }

    if (password.length < 6) {
        res.status(400).json({ error: 'Lösenordet måste vara minst 6 tecken' });
        return;
    }

    try {
        const [existingUsername, existingEmail] = await Promise.all([
            prisma.user.findUnique({ where: { username } }),
            prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
        ]);

        if (existingUsername) {
            res.status(409).json({ error: 'Användarnamnet är redan taget' });
            return;
        }
        if (existingEmail) {
            res.status(409).json({ error: 'E-postadressen är redan registrerad' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = randomBytes(32).toString('hex');

        const user = await prisma.user.create({
            data: {
                username,
                email: email.toLowerCase(),
                passwordHash,
                role: 'student',
                verificationToken,
            },
        });

        // TODO: send verification email when email verification is re-enabled
        // await sendVerificationEmail(user.email, verificationToken);

        const token = signToken(user.id, user.username, user.role);
        res.cookie('token', token, COOKIE_OPTIONS);
        res.status(201).json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

router.post('/login', async (req, res: Response) => {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
        res.status(400).json({ error: 'E-post och lösenord krävs' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            res.status(401).json({ error: 'Felaktiga uppgifter' });
            return;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ error: 'Felaktiga uppgifter' });
            return;
        }

        // TODO: re-enable when email verification is enforced
        // if (!user.emailVerified) {
        //     res.status(403).json({ error: 'E-postadressen är inte verifierad. Kontrollera din inkorg.' });
        //     return;
        // }

        const token = signToken(user.id, user.username, user.role);
        res.cookie('token', token, COOKIE_OPTIONS);
        res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch {
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

router.get('/verify-email', async (req, res: Response) => {
    const { token } = req.query;

    if (typeof token !== 'string' || !token) {
        res.status(400).json({ error: 'Ogiltig verifieringslänk' });
        return;
    }

    try {
        const user = await prisma.user.findFirst({
            where: { verificationToken: token },
        });

        if (!user) {
            res.status(400).json({ error: 'Verifieringslänken är ogiltig eller har redan använts' });
            return;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true, verificationToken: null },
        });

        const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3004';
        res.redirect(`${clientUrl}/login?verified=1`);
    } catch {
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

router.post('/resend-verification', async (req, res: Response) => {
    const { email } = req.body as { email: string };

    if (!email) {
        res.status(400).json({ error: 'E-post krävs' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

        // Always respond with the same message to avoid user enumeration
        if (!user || user.emailVerified) {
            res.json({ message: 'Om kontot finns och inte är verifierat har ett nytt e-postmeddelande skickats.' });
            return;
        }

        const verificationToken = randomBytes(32).toString('hex');
        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken },
        });

        await sendVerificationEmail(user.email, verificationToken);
        res.json({ message: 'Om kontot finns och inte är verifierat har ett nytt e-postmeddelande skickats.' });
    } catch {
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

router.post('/logout', (_req, res: Response) => {
    res.clearCookie('token', { path: '/' });
    res.json({ ok: true });
});

router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        if (!user) {
            res.status(404).json({ error: 'Användare hittades inte' });
            return;
        }
        res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch {
        res.status(500).json({ error: 'Internt serverfel' });
    }
});

export default router;
