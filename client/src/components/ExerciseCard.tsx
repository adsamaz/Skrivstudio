import { A } from '@solidjs/router';
import { ExerciseSummary, ExerciseType } from '@skrivstudio/shared';

const TYPE_LABELS: Record<ExerciseType, string> = {
    identifiera: 'Identifiera',
    ordna: 'Ordna',
    fyllI: 'Fyll i',
    valjRatt: 'Välj rätt',
};

const TYPE_ICONS: Record<ExerciseType, string> = {
    identifiera: '🖱',
    ordna: '🔀',
    fyllI: '✏️',
    valjRatt: '✅',
};

interface Props {
    exercise: ExerciseSummary;
}

function DifficultyStars(props: { difficulty: number }) {
    return (
        <span class="difficulty-stars">
            {[1, 2, 3].map((i) => (
                <span class={i <= props.difficulty ? '' : 'star-empty'}>★</span>
            ))}
        </span>
    );
}

export default function ExerciseCard(props: Props) {
    const { exercise: ex } = props;
    return (
        <div class="exercise-card">
            <div class="exercise-card-header">
                <h3 class="exercise-card-title">{ex.title}</h3>
                <DifficultyStars difficulty={ex.difficulty} />
            </div>
            <div class="exercise-card-meta">
                <span class="badge badge-category">{ex.category}</span>
                <span class="badge badge-type">
                    {TYPE_ICONS[ex.type as ExerciseType]} {TYPE_LABELS[ex.type as ExerciseType]}
                </span>
                <span class="text-sm text-muted">{ex.questionCount} frågor</span>
            </div>
            <div class="exercise-card-footer">
                <span class="badge badge-xp">+{ex.xpReward} XP</span>
                <A href={`/exercises/${ex.id}`} class="btn btn-primary btn-sm">
                    Öva nu
                </A>
            </div>
        </div>
    );
}
