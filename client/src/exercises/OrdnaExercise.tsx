import { createSignal, createEffect, For, Index } from 'solid-js';
import { QuestionPublic, OrdnaData } from '@skrivstudio/shared';

interface Props {
    question: QuestionPublic;
    onAnswer: (correct: boolean) => void;
}

export default function OrdnaExercise(props: Props) {
    const data = () => props.question.data as OrdnaData;

    // bank: indices of words still in the bank
    // placed: array of word-indices placed in answer slots (null = empty)
    const [bank, setBank] = createSignal<number[]>([]);
    const [placed, setPlaced] = createSignal<(number | null)[]>([]);
    const [submitted, setSubmitted] = createSignal(false);
    const [correct, setCorrect] = createSignal(false);
    const [selected, setSelected] = createSignal<number | null>(null); // selected word index from bank

    const init = () => {
        const indices = data().words.map((_, i) => i);
        // shuffle bank
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        setBank(indices);
        setPlaced(new Array(data().words.length).fill(null));
        setSubmitted(false);
        setCorrect(false);
        setSelected(null);
    };

    createEffect(() => {
        void props.question.id;
        init();
    });

    const selectFromBank = (wordIdx: number) => {
        if (submitted()) return;
        setSelected((prev) => (prev === wordIdx ? null : wordIdx));
    };

    const placeInSlot = (slotIdx: number) => {
        if (submitted()) return;
        const sel = selected();
        const currentPlaced = placed();

        if (sel !== null) {
            // Place selected word into slot
            const prev = currentPlaced[slotIdx];
            const newPlaced = [...currentPlaced];
            newPlaced[slotIdx] = sel;
            // Return previously placed word to bank if any
            const newBank = bank().filter((i) => i !== sel);
            if (prev !== null) newBank.push(prev);
            setPlaced(newPlaced);
            setBank(newBank);
            setSelected(null);
        } else if (currentPlaced[slotIdx] !== null) {
            // Return placed word to bank
            const wordIdx = currentPlaced[slotIdx]!;
            const newPlaced = [...currentPlaced];
            newPlaced[slotIdx] = null;
            setPlaced(newPlaced);
            setBank((prev) => [...prev, wordIdx]);
        }
    };

    const check = () => {
        const p = placed();
        const correctOrder = data().correctOrder;
        // correctOrder[i] = which word-index should be at position i
        const isCorrect = p.every((wordIdx, i) => wordIdx === correctOrder[i]);
        setCorrect(isCorrect);
        setSubmitted(true);
        setTimeout(() => props.onAnswer(isCorrect), 1400);
    };

    const allPlaced = () => placed().every((p) => p !== null);

    const slotClass = (slotIdx: number) => {
        if (!submitted()) return 'ordna-chip ordna-chip--placed';
        const wordIdx = placed()[slotIdx];
        if (wordIdx === null) return 'ordna-chip';
        const isCorrect = wordIdx === data().correctOrder[slotIdx];
        return isCorrect ? 'ordna-chip ordna-chip--correct' : 'ordna-chip ordna-chip--wrong';
    };

    return (
        <div>
            <p class="text-muted mb-1">Klicka på ett ord i banken, sedan klicka på en plats i svarsraden:</p>

            <p class="text-sm text-muted mb-1" style="font-style:italic">Ord att placera:</p>
            <div class="ordna-bank">
                <For each={bank()}>
                    {(wordIdx) => (
                        <button
                            class={`ordna-chip${selected() === wordIdx ? ' ordna-chip--placed' : ''}`}
                            onClick={() => selectFromBank(wordIdx)}
                            type="button"
                        >
                            {data().words[wordIdx]}
                        </button>
                    )}
                </For>
            </div>

            <p class="text-sm text-muted mb-1" style="font-style:italic">Din mening:</p>
            <div class={`ordna-answer${submitted() && !correct() ? ' shake' : ''}`}>
                <Index each={placed()}>
                    {(wordIdx, slotIdx) => (
                        <button
                            class={wordIdx() !== null ? slotClass(slotIdx) : 'ordna-chip'}
                            onClick={() => placeInSlot(slotIdx)}
                            type="button"
                            style={wordIdx() === null ? 'min-width:80px;border-style:dashed;color:var(--color-muted)' : ''}
                        >
                            {wordIdx() !== null ? data().words[wordIdx()!] : '___'}
                        </button>
                    )}
                </Index>
            </div>

            {submitted() ? (
                <div class={`feedback-message feedback-message--${correct() ? 'correct' : 'wrong'}`}>
                    {correct()
                        ? '✓ Rätt ordning!'
                        : `✗ Fel. Rätt ordning: ${data().correctOrder.map((i) => data().words[i]).join(' ')}`}
                </div>
            ) : (
                <button
                    class="btn btn-primary mt-2"
                    onClick={check}
                    disabled={!allPlaced()}
                    type="button"
                >
                    Kontrollera
                </button>
            )}
        </div>
    );
}
