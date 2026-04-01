import { createResource } from 'solid-js';
import { A } from '@solidjs/router';
import { useAuth } from '../stores/auth';
import XPBar from '../components/XPBar';
import StreakBadge from '../components/StreakBadge';
import { UserProgressSummary } from '@skrivstudio/shared';

async function fetchProgress(): Promise<UserProgressSummary> {
    const res = await fetch('/api/progress/me', { credentials: 'include' });
    if (!res.ok) throw new Error('Kunde inte hämta framsteg');
    return res.json();
}

export default function Dashboard() {
    const [auth] = useAuth();
    const [progress] = createResource(fetchProgress);

    return (
        <div class="page">
            <div class="dashboard-hero">
                <div class="dashboard-greeting">
                    Hej, {auth.user?.username}! 👋
                </div>
                {progress() && (
                    <>
                        <XPBar
                            totalXp={progress()!.totalXp}
                            level={progress()!.level}
                            xpToNextLevel={progress()!.xpToNextLevel}
                        />
                        <div style="margin-top:1rem">
                            <StreakBadge streak={progress()!.currentStreak} />
                        </div>
                    </>
                )}
            </div>

            {progress() && progress()!.categoryProgress.length > 0 && (
                <div class="card mb-2">
                    <h2 class="section-title">Framsteg per kategori</h2>
                    {progress()!.categoryProgress.map((cp) => (
                        <div class="progress-category-bar">
                            <div class="progress-category-header">
                                <span class="progress-category-name">{cp.category}</span>
                                <span class="progress-category-pct">{Math.round(cp.masteryPercent)}%</span>
                            </div>
                            <div class="progress-bar">
                                <div
                                    class="progress-bar-fill"
                                    style={{ width: `${cp.masteryPercent}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div class="text-center mt-2">
                <A href="/exercises" class="btn btn-primary btn-lg">
                    Börja öva
                </A>
            </div>
        </div>
    );
}
