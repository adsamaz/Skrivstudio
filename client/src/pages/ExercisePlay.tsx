import { createResource, createSignal, Show, Switch, Match } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { useAuth } from '../stores/auth';
import { ExercisePublic, SubmitAttemptResponse, AchievementPublic } from '@skrivstudio/shared';
import IdentifieraExercise from '../exercises/IdentifieraExercise';
import OrdnaExercise from '../exercises/OrdnaExercise';
import FyllIExercise from '../exercises/FyllIExercise';
import ValjRattExercise from '../exercises/ValjRattExercise';
import XPBar from '../components/XPBar';

const CONFETTI_COLORS = ['#1a56db', '#f59e0b', '#16a34a', '#dc2626', '#7c3aed', '#ea580c'];

function Confetti() {
    const pieces = Array.from({ length: 20 }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: `${Math.random() * 0.8}s`,
        size: `${6 + Math.random() * 8}px`,
    }));
    return (
        <div class="confetti-container">
            {pieces.map((p) => (
                <div
                    class="confetti-piece"
                    style={{
                        left: p.left,
                        background: p.color,
                        'animation-delay': p.delay,
                        width: p.size,
                        height: p.size,
                    }}
                />
            ))}
        </div>
    );
}

export default function ExercisePlay() {
    const params = useParams<{ id: string }>();
    const [auth] = useAuth();

    const [exercise] = createResource(async () => {
        const res = await fetch(`/api/exercises/${params.id}`);
        if (!res.ok) throw new Error('Övningen hittades inte');
        return res.json() as Promise<ExercisePublic>;
    });

    const [phase, setPhase] = createSignal<'playing' | 'results'>('playing');
    const [currentQ, setCurrentQ] = createSignal(0);
    const [correctCount, setCorrectCount] = createSignal(0);
    const [startTime] = createSignal(Date.now());
    const [attemptResult, setAttemptResult] = createSignal<SubmitAttemptResponse | null>(null);
    const [showLevelUp, setShowLevelUp] = createSignal(false);

    const handleAnswer = async (correct: boolean) => {
        if (correct) setCorrectCount((c) => c + 1);
        const ex = exercise();
        if (!ex) return;

        if (currentQ() < ex.questions.length - 1) {
            setCurrentQ((q) => q + 1);
            return;
        }

        // Last question answered — compute results
        const total = ex.questions.length;
        const score = Math.round((correctCount() / total) * 100);
        const timeTakenMs = Date.now() - startTime();

        if (auth.user) {
            try {
                const res = await fetch('/api/attempts', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ exerciseId: ex.id, score, timeTakenMs }),
                });
                if (res.ok) {
                    const data = (await res.json()) as SubmitAttemptResponse;
                    setAttemptResult(data);
                    if (data.leveledUp) {
                        setShowLevelUp(true);
                        setTimeout(() => setShowLevelUp(false), 4000);
                    }
                }
            } catch {
                // Attempt failed silently — still show results
            }
        }

        setPhase('results');
    };

    const score = () => {
        const ex = exercise();
        if (!ex) return 0;
        return Math.round((correctCount() / ex.questions.length) * 100);
    };

    return (
        <div class="page">
            <Show when={exercise.loading}>
                <div class="loading">Hämtar övning...</div>
            </Show>
            <Show when={exercise.error}>
                <div class="empty-state">
                    <p>Övningen hittades inte.</p>
                    <A href="/exercises" class="btn btn-secondary mt-2">Tillbaka</A>
                </div>
            </Show>

            <Show when={exercise() && phase() === 'playing'}>
                {(_ex) => {
                    const ex = exercise()!;
                    const q = () => ex.questions[currentQ()];
                    const progress = () => (currentQ() / ex.questions.length) * 100;

                    return (
                        <div class="exercise-play">
                            <div class="exercise-header">
                                <div class="flex justify-between items-center mb-1">
                                    <A href="/exercises" class="text-sm text-muted">← Tillbaka</A>
                                    <span class="badge badge-xp">+{ex.xpReward} XP</span>
                                </div>
                                <h1 class="exercise-title">{ex.title}</h1>
                                <p class="exercise-instructions">{ex.instructions}</p>
                            </div>

                            <div class="exercise-progress-bar">
                                <div class="exercise-progress-fill" style={{ width: `${progress()}%` }} />
                            </div>
                            <p class="question-number">
                                Fråga {currentQ() + 1} av {ex.questions.length}
                            </p>

                            <div class="card">
                                <Switch>
                                    <Match when={ex.type === 'identifiera'}>
                                        <IdentifieraExercise question={q()} onAnswer={handleAnswer} />
                                    </Match>
                                    <Match when={ex.type === 'ordna'}>
                                        <OrdnaExercise question={q()} onAnswer={handleAnswer} />
                                    </Match>
                                    <Match when={ex.type === 'fyllI'}>
                                        <FyllIExercise question={q()} onAnswer={handleAnswer} />
                                    </Match>
                                    <Match when={ex.type === 'valjRatt'}>
                                        <ValjRattExercise question={q()} onAnswer={handleAnswer} />
                                    </Match>
                                </Switch>
                            </div>
                        </div>
                    );
                }}
            </Show>

            <Show when={exercise() && phase() === 'results'}>
                {/* Level-up modal */}
                <Show when={showLevelUp() && attemptResult()}>
                    <div class="modal-overlay" onClick={() => setShowLevelUp(false)}>
                        <div class="modal" onClick={(e) => e.stopPropagation()}>
                            <Confetti />
                            <div class="level-up-title">Nivå upp!</div>
                            <div class="level-up-subtitle">
                                Du är nu nivå {attemptResult()!.newLevel}!
                            </div>
                            <button class="btn btn-primary" onClick={() => setShowLevelUp(false)}>
                                Fortsätt
                            </button>
                        </div>
                    </div>
                </Show>

                <div class="exercise-play">
                    <div class="card results-card">
                        <h2 class="section-title">Resultat</h2>
                        <div class="results-score">{score()}%</div>
                        <p class="text-muted mb-2">
                            {correctCount()} av {exercise()!.questions.length} rätt
                        </p>

                        <Show when={auth.user && attemptResult()}>
                            <div class="results-xp">+{attemptResult()!.xpEarned} XP</div>
                            <XPBar
                                totalXp={attemptResult()!.newTotalXp}
                                level={attemptResult()!.newLevel}
                                xpToNextLevel={
                                    (function () {
                                        const l = attemptResult()!.newLevel + 1;
                                        return (l * (l + 1)) / 2 * 50 - attemptResult()!.newTotalXp;
                                    })()
                                }
                            />
                            <p class="text-sm text-muted mt-1">
                                🔥 {attemptResult()!.newStreak} {attemptResult()!.newStreak === 1 ? 'dag' : 'dagars'} streak
                            </p>

                            <Show when={attemptResult()!.achievementsUnlocked.length > 0}>
                                <h3 class="section-title mt-2">Nya utmärkelser!</h3>
                                <div class="achievements-list">
                                    {attemptResult()!.achievementsUnlocked.map((a: AchievementPublic) => (
                                        <div class="achievement-item">
                                            <span class="achievement-icon">🏅</span>
                                            <div class="achievement-info">
                                                <div class="achievement-title">{a.title}</div>
                                                <div class="achievement-desc">{a.description} (+{a.xpBonus} XP)</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Show>
                        </Show>

                        <Show when={!auth.user}>
                            <div class="guest-cta">
                                <div class="guest-cta-title">Spara dina framsteg!</div>
                                <div class="guest-cta-subtitle">
                                    Skapa ett konto för att tjäna XP, spåra din streak och se din progress.
                                </div>
                                <A href="/register" class="btn btn-primary">
                                    Skapa konto gratis
                                </A>
                            </div>
                        </Show>

                        <div class="flex gap-2 mt-3" style="justify-content:center">
                            <A href="/exercises" class="btn btn-secondary">
                                Fler övningar
                            </A>
                            <button
                                class="btn btn-primary"
                                onClick={() => {
                                    setPhase('playing');
                                    setCurrentQ(0);
                                    setCorrectCount(0);
                                    setAttemptResult(null);
                                }}
                                type="button"
                            >
                                Försök igen
                            </button>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
