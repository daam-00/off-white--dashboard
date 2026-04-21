const STATS_KEY = 'offwhite_user_stats';

export type UserStats = {
  points: number;
  activeTheme: string;
};

const LEVEL_THRESHOLDS: Array<{ level: number; title: string; threshold: number }> = [
  { level: 1, title: 'Principiante', threshold: 0 },
  { level: 2, title: 'Apprendista', threshold: 100 },
  { level: 3, title: 'Praticante', threshold: 300 },
  { level: 4, title: 'Esperto', threshold: 600 },
  { level: 5, title: 'Maestro', threshold: 1000 },
  { level: 6, title: 'Campione', threshold: 1500 },
  { level: 7, title: 'Leggenda', threshold: 2200 },
  { level: 8, title: 'Mito', threshold: 3000 },
];

export function getStoredUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { points: 0, activeTheme: 'theme-offwhite' };
    const parsed = JSON.parse(raw) as Partial<UserStats>;
    return {
      points: typeof parsed.points === 'number' ? parsed.points : 0,
      activeTheme: typeof parsed.activeTheme === 'string' ? parsed.activeTheme : 'theme-offwhite',
    };
  } catch {
    return { points: 0, activeTheme: 'theme-offwhite' };
  }
}

export function saveUserStats(stats: UserStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function awardUserPoints(points: number) {
  const current = getStoredUserStats();
  saveUserStats({ ...current, points: current.points + points });
}

export function getAccountLevelInfo(points: number): {
  level: number;
  title: string;
  progressPercent: number;
  nextLevelAt: number | null;
} {
  let current = LEVEL_THRESHOLDS[0];
  let next: (typeof LEVEL_THRESHOLDS)[number] | null = null;

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i].threshold) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] ?? null;
    } else {
      break;
    }
  }

  const progressPercent = next
    ? Math.min(100, Math.round(((points - current.threshold) / (next.threshold - current.threshold)) * 100))
    : 100;

  return {
    level: current.level,
    title: current.title,
    progressPercent,
    nextLevelAt: next?.threshold ?? null,
  };
}
