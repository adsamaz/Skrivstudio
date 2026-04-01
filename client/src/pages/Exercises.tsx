import { createSignal, createResource, For, Show } from 'solid-js';
import ExerciseCard from '../components/ExerciseCard';
import { ExerciseSummary, ExerciseCategory, ExerciseDifficulty, ExerciseType } from '@skrivstudio/shared';

const CATEGORIES: ExerciseCategory[] = [
    'Satsdelar',
    'Meningsbyggnad',
    'Ordklasser',
    'Interpunktion',
    'Stavning',
    'Texttyper',
];

const TYPES: { value: ExerciseType; label: string }[] = [
    { value: 'identifiera', label: 'Identifiera' },
    { value: 'ordna', label: 'Ordna' },
    { value: 'fyllI', label: 'Fyll i' },
    { value: 'valjRatt', label: 'Välj rätt' },
];

export default function Exercises() {
    const [category, setCategory] = createSignal('');
    const [difficulty, setDifficulty] = createSignal('');
    const [type, setType] = createSignal('');

    const fetchExercises = async () => {
        const params = new URLSearchParams();
        if (category()) params.set('category', category());
        if (difficulty()) params.set('difficulty', difficulty());
        if (type()) params.set('type', type());
        const res = await fetch(`/api/exercises?${params}`);
        if (!res.ok) throw new Error('Kunde inte hämta övningar');
        return res.json() as Promise<ExerciseSummary[]>;
    };

    const [exercises, { refetch }] = createResource(
        () => ({ category: category(), difficulty: difficulty(), type: type() }),
        fetchExercises,
    );

    const reset = () => {
        setCategory('');
        setDifficulty('');
        setType('');
    };

    return (
        <div class="page-wide">
            <h1 class="page-title">Övningar</h1>
            <p class="page-subtitle">Välj en övning och träna din svenska grammatik.</p>

            <div class="filter-bar">
                <div class="filter-group">
                    <label class="filter-label">Kategori</label>
                    <select
                        class="select"
                        value={category()}
                        onChange={(e) => setCategory(e.currentTarget.value)}
                        style="min-width:160px"
                    >
                        <option value="">Alla kategorier</option>
                        {CATEGORIES.map((c) => (
                            <option value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Svårighet</label>
                    <select
                        class="select"
                        value={difficulty()}
                        onChange={(e) => setDifficulty(e.currentTarget.value)}
                        style="min-width:130px"
                    >
                        <option value="">Alla nivåer</option>
                        <option value="1">★ Lätt</option>
                        <option value="2">★★ Medel</option>
                        <option value="3">★★★ Svår</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Typ</label>
                    <select
                        class="select"
                        value={type()}
                        onChange={(e) => setType(e.currentTarget.value)}
                        style="min-width:130px"
                    >
                        <option value="">Alla typer</option>
                        {TYPES.map((t) => (
                            <option value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div class="filter-group" style="justify-content:flex-end">
                    <label class="filter-label" style="visibility:hidden">.</label>
                    <button class="btn btn-secondary btn-sm" onClick={reset}>
                        Återställ
                    </button>
                </div>
            </div>

            <Show when={exercises.loading}>
                <div class="loading">Hämtar övningar...</div>
            </Show>

            <Show when={exercises.error}>
                <div class="empty-state">Något gick fel. Försök igen.</div>
            </Show>

            <Show when={exercises() && !exercises.loading}>
                <Show
                    when={exercises()!.length > 0}
                    fallback={
                        <div class="empty-state">
                            <div class="empty-state-icon">📚</div>
                            <p>Inga övningar hittades.</p>
                        </div>
                    }
                >
                    <div class="exercise-grid">
                        <For each={exercises()}>
                            {(ex) => <ExerciseCard exercise={ex} />}
                        </For>
                    </div>
                </Show>
            </Show>
        </div>
    );
}
