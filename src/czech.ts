/**
 * Czech counts come in three forms: 1 recept, 2 recepty, 5 receptů. Getting
 * this wrong is the kind of thing that reads as broken to the person using it.
 */
export function plural(count: number, one: string, few: string, many: string): string {
    if (count === 1) return `${count} ${one}`;
    if (count >= 2 && count <= 4) return `${count} ${few}`;

    return `${count} ${many}`;
}
