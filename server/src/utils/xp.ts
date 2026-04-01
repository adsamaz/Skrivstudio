export function xpForLevel(level: number): number {
    return (level * (level + 1)) / 2 * 50;
}

export function levelFromXp(totalXp: number): number {
    let level = 1;
    while (xpForLevel(level + 1) <= totalXp) level++;
    return level;
}
