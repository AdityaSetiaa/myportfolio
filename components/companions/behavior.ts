export const between = (min: number, max: number) => min + Math.random() * (max - min);

export function varied<T>(choices: readonly T[], previous?: T): T {
  const other = choices.filter(choice => choice !== previous);
  const pool = other.length ? other : choices;
  return pool[Math.floor(Math.random() * pool.length)];
}
