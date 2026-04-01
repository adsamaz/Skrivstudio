import { createSignal, createEffect, For } from 'solid-js';
import { QuestionPublic, ValjRattData } from '@skrivstudio/shared';

interface Props {
    question: QuestionPublic;
    onAnswer: (correct: boolean) => void;
}

export default function ValjRattExercise(props: Props) {
    const data = () => props.question.data as ValjRattData;
    const [chosen, setChosen] = createSignal<number | null>(null);

    createEffect(() => {
        void props.question.id;
        setChosen(null);
    });

    const choose = (idx: number) => {
        if (chosen() !== null) return;
        setChosen(idx);
        const correct = idx === data().correctIndex;
        setTimeout(() => props.onAnswer(correct), 1200);
    };

    const optionClass = (idx: number) => {
        if (chosen() === null) return 'valja-option';
        if (idx === data().correctIndex) return 'valja-option valja-option--correct';
        if (idx === chosen()) return 'valja-option valja-option--wrong';
        return 'valja-option';
    };

    return (
        <div>
            <p class="valja-question">{data().question}</p>
            <div class="valja-options">
                <For each={data().options}>
                    {(option, i) => (
                        <button
                            class={optionClass(i())}
                            onClick={() => choose(i())}
                            disabled={chosen() !== null}
                            type="button"
                        >
                            {option}
                        </button>
                    )}
                </For>
            </div>
            {chosen() !== null && (
                <div
                    class={`feedback-message feedback-message--${chosen() === data().correctIndex ? 'correct' : 'wrong'}`}
                >
                    {chosen() === data().correctIndex
                        ? '✓ Rätt!'
                        : `✗ Fel. Rätt svar: "${data().options[data().correctIndex]}"`}
                </div>
            )}
        </div>
    );
}
