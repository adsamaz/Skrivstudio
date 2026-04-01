interface Props {
    streak: number;
}

export default function StreakBadge(props: Props) {
    return (
        <div class={`streak-badge${props.streak >= 5 ? ' streak-glow' : ''}`}>
            🔥 {props.streak} {props.streak === 1 ? 'dag' : 'dagar'}
        </div>
    );
}
