import { createSignal, createEffect, For } from 'solid-js';
import { QuestionPublic, IdentifieraData } from '@skrivstudio/shared';

interface Props {
    question: QuestionPublic;
    onAnswer: (correct: boolean) => void;
}

export default function IdentifieraExercise(props: Props) {
    const data = () => props.question.data as IdentifieraData;
    const [selected, setSelected] = createSignal<Set<number>>(new Set());
    const [submitted, setSubmitted] = createSignal(false);
    const [correct, setCorrect] = createSignal(false);

    createEffect(() => {
        // Reset when question changes
        void props.question.id;
        setSelected(new Set());
        setSubmitted(false);
        setCorrect(false);
    });

    const toggleWord = (idx: number) => {
        if (submitted()) return;
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const check = () => {
        const correctSet = new Set(data().correctIndices);
        const sel = selected();
        const isCorrect =
            sel.size === correctSet.size && [...sel].every((i) => correctSet.has(i));
        setCorrect(isCorrect);
        setSubmitted(true);
        setTimeout(() => props.onAnswer(isCorrect), 1200);
    };

    const wordClass = (idx: number) => {
        if (!submitted()) {
            return selected().has(idx) ? 'word-token word-token--selected' : 'word-token';
        }
        const correctSet = new Set(data().correctIndices);
        if (correctSet.has(idx)) return 'word-token word-token--correct';
        if (selected().has(idx) && !correctSet.has(idx)) return 'word-token word-token--wrong';
        return 'word-token';
    };

    return (
        <div>
            <p class="text-muted mb-1">
                Klicka på <strong>{data().targetLabel}</strong> i meningen:
            </p>
            <div class={`word-tokens${submitted() && !correct() ? ' shake' : ''}`}>
                <For each={data().words}>
                    {(word, i) => (
                        <button class={wordClass(i())} onClick={() => toggleWord(i())} type="button">
                            {word}
                        </button>
                    )}
                </For>
            </div>
            {submitted() ? (
                <div class={`feedback-message feedback-message--${correct() ? 'correct' : 'wrong'}`}>
                    {correct() ? '✓ Rätt!' : `✗ Fel. Rätt svar: ${data().correctIndices.map((i) => data().words[i]).join(', ')}`}
                </div>
            ) : (
                <button
                    class="btn btn-primary mt-2"
                    onClick={check}
                    disabled={selected().size === 0}
                    type="button"
                >
                    Kontrollera
                </button>
            )}
        </div>
    );
}
