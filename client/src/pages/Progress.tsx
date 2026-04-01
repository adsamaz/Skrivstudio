import { createResource, Show, For } from 'solid-js';
import { UserProgressSummary, RecentAttempt } from '@skrivstudio/shared';
import XPBar from '../components/XPBar';
import StreakBadge from '../components/StreakBadge';

async function fetchProgress(): Promise<UserProgressSummary> {
    const res = await fetch('/api/progress/me', { credentials: 'include' });
    if (!res.ok) throw new Error('');
    return res.json();
}

async function fetchAttempts(): Promise<RecentAttempt[]> {
    const res = await fetch('/api/progress/me/attempts', { credentials: 'include' });
    if (!res.ok) throw new Error('');
    return res.json();
}

export default function Progress() {
    const [progress] = createResource(fetchProgress);
    const [attempts] = createResource(fetchAttempts);

    return (
        <div class="page">
            <h1 class="page-title">Mina framsteg</h1>

            <Show when={progress.loading}>
                <div class="loading">Laddar...</div>
            </Show>

            <Show when={progress()}>
                {(p) => (
                    <>
                        <div class="card mb-2">
                            <div class="flex justify-between items-center mb-2">
                                <div>
                                    <XPBar
                                        totalXp={p().totalXp}
                                        level={p().level}
                                        xpToNextLevel={p().xpToNextLevel}
                                    />
                                </div>
                                <StreakBadge streak={p().currentStreak} />
                            </div>
                            <p class="text-sm text-muted">
                                Längsta streak: {p().longestStreak} {p().longestStreak === 1 ? 'dag' : 'dagar'}
                            </p>
                        </div>

                        <Show when={p().categoryProgress.length > 0}>
                            <div class="card mb-2">
                                <h2 class="section-title">Framsteg per kategori</h2>
                                <For each={p().categoryProgress}>
                                    {(cp) => (
                                        <div class="progress-category-bar">
                                            <div class="progress-category-header">
                                                <span class="progress-category-name">{cp.category}</span>
                                                <span class="progress-category-pct">
                                                    {Math.round(cp.masteryPercent)}% · {cp.attemptsCount} försök
                                                </span>
                                            </div>
                                            <div class="progress-bar">
                                                <div
                                                    class="progress-bar-fill"
                                                    style={{ width: `${cp.masteryPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </Show>
                    </>
                )}
            </Show>

            <Show when={attempts()}>
                {(atts) => (
                    <Show when={atts().length > 0}>
                        <div class="card">
                            <h2 class="section-title">Senaste övningar</h2>
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Övning</th>
                                        <th>Poäng</th>
                                        <th>XP</th>
                                        <th>Datum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <For each={atts()}>
                                        {(a) => (
                                            <tr>
                                                <td>{a.exerciseTitle}</td>
                                                <td>{a.score}%</td>
                                                <td>+{a.xpEarned}</td>
                                                <td>
                                                    {new Date(a.completedAt).toLocaleDateString('sv-SE')}
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                    </Show>
                )}
            </Show>
        </div>
    );
}
