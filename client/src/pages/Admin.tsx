import { createSignal, createResource, For, Index, Show, Switch, Match } from 'solid-js';
import {
    ExerciseSummary,
    ExercisePublic,
    ExerciseType,
    ExerciseDifficulty,
    ExerciseCategory,
    QuestionData,
    IdentifieraData,
    OrdnaData,
    FyllIData,
    ValjRattData,
    StudentStats,
    CreateExerciseRequest,
} from '@skrivstudio/shared';

const CATEGORIES: ExerciseCategory[] = [
    'Satsdelar',
    'Meningsbyggnad',
    'Ordklasser',
    'Interpunktion',
    'Stavning',
    'Texttyper',
];

// ─── Question editors ──────────────────────────────
function IdentifieraEditor(props: {
    data: IdentifieraData;
    onChange: (d: IdentifieraData) => void;
}) {
    const words = () => props.data.words;
    return (
        <div>
            <div class="form-group">
                <label class="form-label">Mening (ord separerade med mellanslag)</label>
                <input
                    class="input"
                    type="text"
                    value={words().join(' ')}
                    onBlur={(e) =>
                        props.onChange({
                            ...props.data,
                            words: e.currentTarget.value.trim().split(/\s+/).filter(Boolean),
                            correctIndices: [],
                        })
                    }
                    placeholder="Hunden springer snabbt i parken"
                />
            </div>
            <div class="form-group">
                <label class="form-label">Etikett (t.ex. predikatet, subjektet)</label>
                <input
                    class="input"
                    type="text"
                    value={props.data.targetLabel}
                    onInput={(e) => props.onChange({ ...props.data, targetLabel: e.currentTarget.value })}
                    placeholder="predikatet"
                />
            </div>
            <div class="form-group">
                <label class="form-label">Rätt ord (kryssa i)</label>
                <div class="word-tokens" style="flex-wrap:wrap;gap:0.5rem">
                    <For each={words()}>
                        {(word, i) => (
                            <label style="display:flex;align-items:center;gap:0.3rem;cursor:pointer">
                                <input
                                    type="checkbox"
                                    checked={props.data.correctIndices.includes(i())}
                                    onChange={(e) => {
                                        const indices = props.data.correctIndices.filter((x) => x !== i());
                                        if (e.currentTarget.checked) indices.push(i());
                                        props.onChange({ ...props.data, correctIndices: indices.sort() });
                                    }}
                                />
                                <span class="word-token" style="cursor:inherit">{word}</span>
                            </label>
                        )}
                    </For>
                </div>
            </div>
        </div>
    );
}

function OrdnaEditor(props: { data: OrdnaData; onChange: (d: OrdnaData) => void }) {
    return (
        <div>
            <div class="form-group">
                <label class="form-label">
                    Ord i RÄTT ordning (kommaseparerade — systemet blandar dem automatiskt)
                </label>
                <input
                    class="input"
                    type="text"
                    value={props.data.correctOrder.map((i) => props.data.words[i]).join(', ')}
                    onBlur={(e) => {
                        const ws = e.currentTarget.value.split(',').map((w) => w.trim()).filter(Boolean);
                        const correctOrder = ws.map((_, i) => i);
                        props.onChange({ words: ws, correctOrder });
                    }}
                    placeholder="Vi, äter, lunch, idag"
                />
            </div>
        </div>
    );
}

function FyllIEditor(props: { data: FyllIData; onChange: (d: FyllIData) => void }) {
    return (
        <div>
            <div class="form-group">
                <label class="form-label">Mening (använd ___ för luckan)</label>
                <input
                    class="input"
                    type="text"
                    value={props.data.sentence}
                    onInput={(e) => props.onChange({ ...props.data, sentence: e.currentTarget.value })}
                    placeholder="Igår ___ vi till stranden. (åka)"
                />
            </div>
            <div class="form-group">
                <label class="form-label">Rätt svar</label>
                <input
                    class="input"
                    type="text"
                    value={props.data.answer}
                    onInput={(e) => props.onChange({ ...props.data, answer: e.currentTarget.value })}
                    placeholder="åkte"
                />
            </div>
            <div class="form-group">
                <label class="form-label">Ledtråd (valfritt)</label>
                <input
                    class="input"
                    type="text"
                    value={props.data.hint ?? ''}
                    onInput={(e) => props.onChange({ ...props.data, hint: e.currentTarget.value || undefined })}
                    placeholder="Imperfektform av åka"
                />
            </div>
        </div>
    );
}

function ValjRattEditor(props: { data: ValjRattData; onChange: (d: ValjRattData) => void }) {
    return (
        <div>
            <div class="form-group">
                <label class="form-label">Fråga</label>
                <input
                    class="input"
                    type="text"
                    value={props.data.question}
                    onInput={(e) => props.onChange({ ...props.data, question: e.currentTarget.value })}
                    placeholder="Vilket ordklass är 'snabbt'?"
                />
            </div>
            <div class="form-group">
                <label class="form-label">Alternativ (kommaseparerade)</label>
                <input
                    class="input"
                    type="text"
                    value={props.data.options.join(', ')}
                    onBlur={(e) => {
                        const opts = e.currentTarget.value.split(',').map((o) => o.trim()).filter(Boolean);
                        props.onChange({ ...props.data, options: opts, correctIndex: 0 });
                    }}
                    placeholder="Substantiv, Verb, Adjektiv, Adverb"
                />
            </div>
            <div class="form-group">
                <label class="form-label">Rätt alternativ</label>
                <select
                    class="select"
                    value={props.data.correctIndex}
                    onChange={(e) =>
                        props.onChange({ ...props.data, correctIndex: Number(e.currentTarget.value) })
                    }
                >
                    <For each={props.data.options}>
                        {(opt, i) => <option value={i()}>{opt}</option>}
                    </For>
                </select>
            </div>
        </div>
    );
}

// ─── Default question data ──────────────────────────
function defaultQuestionData(type: ExerciseType): QuestionData {
    switch (type) {
        case 'identifiera':
            return { words: [], correctIndices: [], targetLabel: 'predikatet' };
        case 'ordna':
            return { words: [], correctOrder: [] };
        case 'fyllI':
            return { sentence: '', answer: '' };
        case 'valjRatt':
            return { question: '', options: ['', '', '', ''], correctIndex: 0 };
    }
}

// ─── Exercise Form ──────────────────────────────────
interface FormState {
    title: string;
    instructions: string;
    type: ExerciseType;
    difficulty: ExerciseDifficulty;
    category: ExerciseCategory;
    xpReward: number;
    questions: QuestionData[];
}

function ExerciseForm(props: {
    initial?: ExercisePublic;
    onSave: (data: CreateExerciseRequest) => Promise<void>;
    onCancel: () => void;
}) {
    const init = props.initial;
    const [form, setForm] = createSignal<FormState>({
        title: init?.title ?? '',
        instructions: init?.instructions ?? '',
        type: (init?.type ?? 'identifiera') as ExerciseType,
        difficulty: (init?.difficulty ?? 1) as ExerciseDifficulty,
        category: (init?.category ?? 'Satsdelar') as ExerciseCategory,
        xpReward: init?.xpReward ?? 30,
        questions: init?.questions.map((q) => q.data as QuestionData) ?? [
            defaultQuestionData('identifiera'),
        ],
    });
    const [saving, setSaving] = createSignal(false);
    const [error, setError] = createSignal('');

    const updateField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: val }));
    };

    const changeType = (type: ExerciseType) => {
        setForm((prev) => ({
            ...prev,
            type,
            questions: [defaultQuestionData(type)],
        }));
    };

    const addQuestion = () => {
        setForm((prev) => ({
            ...prev,
            questions: [...prev.questions, defaultQuestionData(prev.type)],
        }));
    };

    const removeQuestion = (idx: number) => {
        setForm((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== idx),
        }));
    };

    const updateQuestion = (idx: number, data: QuestionData) => {
        setForm((prev) => {
            const qs = [...prev.questions];
            qs[idx] = data;
            return { ...prev, questions: qs };
        });
    };

    const handleSave = async (e: Event) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const f = form();
            await props.onSave({
                title: f.title,
                instructions: f.instructions,
                type: f.type,
                difficulty: f.difficulty,
                category: f.category,
                xpReward: f.xpReward,
                questions: f.questions.map((data, i) => ({ data, order: i })),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Något gick fel');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave}>
            <div class="form-group">
                <label class="form-label">Titel</label>
                <input
                    class="input"
                    type="text"
                    value={form().title}
                    onInput={(e) => updateField('title', e.currentTarget.value)}
                    required
                />
            </div>
            <div class="form-group">
                <label class="form-label">Instruktioner</label>
                <textarea
                    class="input"
                    value={form().instructions}
                    onInput={(e) => updateField('instructions', e.currentTarget.value)}
                    required
                />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
                <div class="form-group">
                    <label class="form-label">Typ</label>
                    <select
                        class="select"
                        value={form().type}
                        onChange={(e) => changeType(e.currentTarget.value as ExerciseType)}
                    >
                        <option value="identifiera">Identifiera</option>
                        <option value="ordna">Ordna</option>
                        <option value="fyllI">Fyll i</option>
                        <option value="valjRatt">Välj rätt</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Kategori</label>
                    <select
                        class="select"
                        value={form().category}
                        onChange={(e) => updateField('category', e.currentTarget.value as ExerciseCategory)}
                    >
                        <For each={CATEGORIES}>{(c) => <option value={c}>{c}</option>}</For>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Svårighet</label>
                    <select
                        class="select"
                        value={form().difficulty}
                        onChange={(e) => updateField('difficulty', Number(e.currentTarget.value) as ExerciseDifficulty)}
                    >
                        <option value={1}>★ Lätt</option>
                        <option value={2}>★★ Medel</option>
                        <option value={3}>★★★ Svår</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">XP-belöning</label>
                    <input
                        class="input"
                        type="number"
                        min={10}
                        max={500}
                        value={form().xpReward}
                        onInput={(e) => updateField('xpReward', Number(e.currentTarget.value))}
                    />
                </div>
            </div>

            <h3 class="section-title mt-2">Frågor</h3>
            <Index each={form().questions}>
                {(qData, i) => (
                    <div class="card mb-2" style="border-left:3px solid var(--color-accent)">
                        <div class="flex justify-between items-center mb-1">
                            <strong>Fråga {i + 1}</strong>
                            <Show when={form().questions.length > 1}>
                                <button
                                    type="button"
                                    class="btn btn-danger btn-sm"
                                    onClick={() => removeQuestion(i)}
                                >
                                    Ta bort
                                </button>
                            </Show>
                        </div>
                        <Switch>
                            <Match when={form().type === 'identifiera'}>
                                <IdentifieraEditor
                                    data={qData() as IdentifieraData}
                                    onChange={(d) => updateQuestion(i, d)}
                                />
                            </Match>
                            <Match when={form().type === 'ordna'}>
                                <OrdnaEditor
                                    data={qData() as OrdnaData}
                                    onChange={(d) => updateQuestion(i, d)}
                                />
                            </Match>
                            <Match when={form().type === 'fyllI'}>
                                <FyllIEditor
                                    data={qData() as FyllIData}
                                    onChange={(d) => updateQuestion(i, d)}
                                />
                            </Match>
                            <Match when={form().type === 'valjRatt'}>
                                <ValjRattEditor
                                    data={qData() as ValjRattData}
                                    onChange={(d) => updateQuestion(i, d)}
                                />
                            </Match>
                        </Switch>
                    </div>
                )}
            </Index>

            <button type="button" class="btn btn-secondary mb-2" onClick={addQuestion}>
                + Lägg till fråga
            </button>

            {error() && <p class="error-text mb-1">{error()}</p>}

            <div class="flex gap-2">
                <button type="button" class="btn btn-secondary" onClick={props.onCancel}>
                    Avbryt
                </button>
                <button type="submit" class="btn btn-primary" disabled={saving()}>
                    {saving() ? 'Sparar...' : 'Spara övning'}
                </button>
            </div>
        </form>
    );
}

// ─── Main Admin Page ────────────────────────────────
export default function Admin() {
    const [tab, setTab] = createSignal<'exercises' | 'students'>('exercises');
    const [showForm, setShowForm] = createSignal(false);
    const [editExercise, setEditExercise] = createSignal<ExercisePublic | null>(null);

    const [exercises, { refetch: refetchExercises }] = createResource(async () => {
        const res = await fetch('/api/admin/exercises', { credentials: 'include' });
        if (!res.ok) throw new Error('');
        return res.json() as Promise<ExerciseSummary[]>;
    });

    const [students] = createResource(async () => {
        const res = await fetch('/api/admin/students', { credentials: 'include' });
        if (!res.ok) throw new Error('');
        return res.json() as Promise<StudentStats[]>;
    });

    const fetchFullExercise = async (id: string) => {
        const res = await fetch(`/api/admin/exercises/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('');
        return res.json() as Promise<ExercisePublic>;
    };

    const handleCreate = async (data: CreateExerciseRequest) => {
        const res = await fetch('/api/admin/exercises', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = (await res.json()) as { error: string };
            throw new Error(err.error);
        }
        setShowForm(false);
        refetchExercises();
    };

    const handleUpdate = async (data: CreateExerciseRequest) => {
        const ex = editExercise();
        if (!ex) return;
        const res = await fetch(`/api/admin/exercises/${ex.id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = (await res.json()) as { error: string };
            throw new Error(err.error);
        }
        setEditExercise(null);
        refetchExercises();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Är du säker på att du vill ta bort övningen?')) return;
        await fetch(`/api/admin/exercises/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        refetchExercises();
    };

    const startEdit = async (id: string) => {
        const ex = await fetchFullExercise(id);
        setEditExercise(ex);
    };

    return (
        <div class="page-wide">
            <h1 class="page-title">Adminpanel</h1>

            <div class="admin-tabs">
                <button
                    class={`admin-tab${tab() === 'exercises' ? ' admin-tab--active' : ''}`}
                    onClick={() => setTab('exercises')}
                >
                    Övningar
                </button>
                <button
                    class={`admin-tab${tab() === 'students' ? ' admin-tab--active' : ''}`}
                    onClick={() => setTab('students')}
                >
                    Elever
                </button>
            </div>

            <Show when={tab() === 'exercises'}>
                <Show
                    when={!showForm() && !editExercise()}
                    fallback={
                        <div class="card">
                            <h2 class="section-title mb-2">
                                {editExercise() ? 'Redigera övning' : 'Skapa ny övning'}
                            </h2>
                            <ExerciseForm
                                initial={editExercise() ?? undefined}
                                onSave={editExercise() ? handleUpdate : handleCreate}
                                onCancel={() => {
                                    setShowForm(false);
                                    setEditExercise(null);
                                }}
                            />
                        </div>
                    }
                >
                    <div class="flex justify-between items-center mb-2">
                        <p class="text-muted">{exercises()?.length ?? 0} övningar totalt</p>
                        <button class="btn btn-primary" onClick={() => setShowForm(true)}>
                            + Skapa övning
                        </button>
                    </div>

                    <Show when={exercises.loading}>
                        <div class="loading">Laddar...</div>
                    </Show>

                    <Show when={exercises()}>
                        <div class="card">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Titel</th>
                                        <th>Kategori</th>
                                        <th>Typ</th>
                                        <th>Svårighet</th>
                                        <th>XP</th>
                                        <th>Frågor</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <For each={exercises()}>
                                        {(ex) => (
                                            <tr>
                                                <td>{ex.title}</td>
                                                <td>{ex.category}</td>
                                                <td>{ex.type}</td>
                                                <td>{'★'.repeat(ex.difficulty)}</td>
                                                <td>{ex.xpReward}</td>
                                                <td>{ex.questionCount}</td>
                                                <td>
                                                    <div class="flex gap-1">
                                                        <button
                                                            class="btn btn-secondary btn-sm"
                                                            onClick={() => startEdit(ex.id)}
                                                        >
                                                            Redigera
                                                        </button>
                                                        <button
                                                            class="btn btn-danger btn-sm"
                                                            onClick={() => handleDelete(ex.id)}
                                                        >
                                                            Ta bort
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                    </Show>
                </Show>
            </Show>

            <Show when={tab() === 'students'}>
                <Show when={students.loading}>
                    <div class="loading">Laddar...</div>
                </Show>
                <Show when={students()}>
                    <div class="card">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Användarnamn</th>
                                    <th>Nivå</th>
                                    <th>XP</th>
                                    <th>Streak</th>
                                    <th>Övningar</th>
                                </tr>
                            </thead>
                            <tbody>
                                <For each={students()}>
                                    {(s) => (
                                        <tr>
                                            <td>{s.username}</td>
                                            <td>{s.level}</td>
                                            <td>{s.totalXp}</td>
                                            <td>{s.currentStreak} 🔥</td>
                                            <td>{s.attemptsCount}</td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>
                </Show>
            </Show>
        </div>
    );
}
