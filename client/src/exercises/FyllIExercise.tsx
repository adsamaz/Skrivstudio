import { createSignal, createEffect, Show } from 'solid-js';
import { QuestionPublic, FyllIData } from '@skrivstudio/shared';

interface Props {
    question: QuestionPublic;
    onAnswer: (correct: boolean) => void;
}

export default function FyllIExercise(props: Props) {
    const data = () => props.question.data as FyllIData;
    const [value, setValue] = createSignal('');
    const [submitted, setSubmitted] = createSignal(false);
    const [correct, setCorrect] = createSignal(false);

    createEffect(() => {
        void props.question.id;
        setValue('');
        setSubmitted(false);
        setCorrect(false);
    });

    const check = () => {
        const isCorrect = value().trim().toLowerCase() === data().answer.trim().toLowerCase();
        setCorrect(isCorrect);
        setSubmitted(true);
        setTimeout(() => props.onAnswer(isCorrect), 1400);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !submitted() && value().trim()) check();
    };

    // Split sentence on ___ for rendering
    const parts = () => data().sentence.split('___');

    return (
        <div>
            <p class={`fyllisentence${submitted() && !correct() ? ' shake' : ''}`}>
                {parts()[0]}
                <input
                    class={`fylli-input${submitted() ? (correct() ? ' fylli-input--correct' : ' fylli-input--wrong') : ''}`}
                    type="text"
                    value={value()}
                    onInput={(e) => setValue(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    disabled={submitted()}
                    placeholder="..."
                />
                {parts()[1]}
            </p>

            <Show when={data().hint && !submitted()}>
                <p class="hint-text">Ledtråd: {data().hint}</p>
            </Show>

            {submitted() ? (
                <div class={`feedback-message feedback-message--${correct() ? 'correct' : 'wrong'}`}>
                    {correct() ? '✓ Rätt!' : `✗ Fel. Rätt svar: "${data().answer}"`}
                </div>
            ) : (
                <button
                    class="btn btn-primary mt-2"
                    onClick={check}
                    disabled={!value().trim()}
                    type="button"
                >
                    Kontrollera
                </button>
            )}
        </div>
    );
}
