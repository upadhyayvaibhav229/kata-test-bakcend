// src/lib/karate-data.ts
// Mirrors the frontend's karate-data.ts so validation is consistent.

export const BELT_KEYS = [
  "white",
  "yellow",
  "orange",
  "green",
  "blue",
  "purple",
  "brown3",
  "brown2",
  "brown1",
  "black1",
  "black2",
  "black3",
] as const;

export type BeltKey = (typeof BELT_KEYS)[number];

export const BELT_KATAS: Record<BeltKey, string[]> = {
  white:  ["Taikyoku Shodan", "Taikyoku Nidan", "Taikyoku Sandan"],
  yellow: ["Heian Shodan"],
  orange: ["Heian Nidan"],
  green:  ["Heian Sandan"],
  blue:   ["Heian Yondan"],
  purple: ["Heian Godan"],
  brown3: ["Tekki Shodan"],
  brown2: ["Bassai Dai", "Kanku Dai"],
  brown1: ["Jion", "Empi", "Hangetsu"],
  black1: ["Bassai Sho", "Kanku Sho", "Nijushiho", "Sochin", "Chinte"],
  black2: ["Unsu", "Gojushiho Sho", "Gojushiho Dai"],
  black3: ["Meikyo", "Wankan", "Jitte"],
};

// Each belt can perform katas from its own level and below
export function availableKatasFor(belt: BeltKey): string[] {
  const idx = BELT_KEYS.indexOf(belt);
  const katas: string[] = [];
  for (let i = 0; i <= idx; i++) {
    katas.push(...BELT_KATAS[BELT_KEYS[i]]);
  }
  return katas;
}

export const BRANCHES = [
  "Andheri",
  "Bandra",
  "Borivali",
  "Chembur",
  "Dadar",
  "Kandivali",
  "Thane",
  "Vashi",
] as const;

export type Branch = (typeof BRANCHES)[number];
