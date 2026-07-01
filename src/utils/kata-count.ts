export type RequiredKataCount = 1 | 2 | 3;

export function getRequiredKataCount(
  belt: string | null | undefined,
): RequiredKataCount {
  if (!belt) return 3;

  const normalized = belt.toString().trim().toLowerCase().replace(/\s+/g, " ");

  if (!normalized) return 3;
  if (["white", "yellow", "orange"].includes(normalized)) return 1;
  if (["green", "blue", "purple"].includes(normalized)) return 2;
  if (
    normalized.includes("brown") ||
    normalized.includes("black") ||
    normalized.includes("dan")
  ) {
    return 3;
  }

  return 3;
}
