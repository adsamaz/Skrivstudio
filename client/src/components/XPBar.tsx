import { xpForLevel } from '../utils/xp';

interface Props {
    totalXp: number;
    level: number;
    xpToNextLevel: number;
}

export default function XPBar(props: Props) {
    const levelStart = () => xpForLevel(props.level);
    const levelEnd = () => xpForLevel(props.level + 1);
    const progress = () => {
        const range = levelEnd() - levelStart();
        const earned = props.totalXp - levelStart();
        return Math.min(100, Math.max(0, (earned / range) * 100));
    };

    return (
        <div class="xp-bar-container">
            <div class="xp-bar-labels">
                <span class="xp-level-label">Nivå {props.level}</span>
                <span class="xp-numbers">
                    {props.totalXp} / {levelEnd()} XP
                </span>
            </div>
            <div class="xp-bar">
                <div class="xp-bar-fill" style={{ width: `${progress()}%` }} />
            </div>
            <div class="text-sm text-muted">{props.xpToNextLevel} XP till nästa nivå</div>
        </div>
    );
}
