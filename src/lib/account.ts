import type { UserStats } from '../types';
import { normalizeThemeId } from './themes';

const USER_STATS_KEY = 'offwhite_user_stats';
const DEFAULT_THEME_ID = 'theme-selah';

export type AccountTier = 'starter' | 'core' | 'pro' | 'elite' | 'master' | 'legend' | 'apex';

export interface AccountLevelInfo {
  level: number;
  tier: AccountTier;
  title: string;
  minPoints: number;
  nextLevelAt: number | null;
  progressPercent: number;
  perks: string[];
}

export const ACCOUNT_LEVELS: Array<{
  minPoints: number;
  tier: AccountTier;
  title: string;
  perks: string[];
}> = [
  {
    minPoints: 0,
    tier: 'starter',
    title: 'Starter',
    perks: ['Accesso base alla dashboard', 'Tema Off White incluso', 'Avatar Bot Hero incluso'],
  },
  {
    minPoints: 50,
    tier: 'core',
    title: 'Core',
    perks: ['Check-in giornalieri attivi', 'Sblocco temi base', 'Storico obiettivi settimanali'],
  },
  {
    minPoints: 150,
    tier: 'pro',
    title: 'Pro',
    perks: ['Sblocco tema Forest e Sunset', 'Avatar rari sbloccabili', 'Streak bonus +10% credits'],
  },
  {
    minPoints: 300,
    tier: 'elite',
    title: 'Elite',
    perks: ['Sblocco tema Dark (800cr)', 'Avatar epici sbloccabili', 'Badge Elite sul profilo'],
  },
  {
    minPoints: 500,
    tier: 'master',
    title: 'Master',
    perks: ['Sblocco avatar Invincible', 'Accesso anticipato nuovi temi', 'Badge animato Master'],
  },
  {
    minPoints: 1000,
    tier: 'legend',
    title: 'Legend',
    perks: ['Sblocco avatar leggendari', 'Badge leggendario speciale', 'Border speciale leggendaria'],
  },
  {
    minPoints: 2000,
    tier: 'apex',
    title: 'Apex',
    perks: ['Sblocco Gold Titan avatar', 'Accesso a tutti i contenuti futuri', 'Titolo Apex sul profilo'],
  },
];

export function getDefaultUserStats(): UserStats {
  return {
    points: 0,
    activeTheme: DEFAULT_THEME_ID,
    unlockedThemes: [DEFAULT_THEME_ID],
  };
}

export function normalizeUserStats(stats?: Partial<UserStats> | null): UserStats {
  const normalizedThemes = Array.isArray(stats?.unlockedThemes)
    ? stats.unlockedThemes.filter((themeId): themeId is string => typeof themeId === 'string' && themeId.length > 0)
    : [DEFAULT_THEME_ID];

  return {
    ...getDefaultUserStats(),
    ...stats,
    points: typeof stats?.points === 'number' ? stats.points : Number(stats?.points) || 0,
    activeTheme: normalizeThemeId(stats?.activeTheme),
    unlockedThemes: Array.from(new Set([DEFAULT_THEME_ID, ...normalizedThemes.map((themeId) => normalizeThemeId(themeId))])),
  };
}

export function getStoredUserStats(): UserStats {
  const saved = localStorage.getItem(USER_STATS_KEY);
  if (!saved) return getDefaultUserStats();

  try {
    return normalizeUserStats(JSON.parse(saved) as Partial<UserStats>);
  } catch {
    return getDefaultUserStats();
  }
}

export function saveUserStats(stats: Partial<UserStats> | UserStats) {
  const normalized = normalizeUserStats(stats);
  localStorage.setItem(USER_STATS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('stats-update'));
  return normalized;
}

export function awardUserPoints(points: number) {
  const current = getStoredUserStats();
  return saveUserStats({
    ...current,
    points: current.points + points,
  });
}

export function getAccountLevelInfo(points: number): AccountLevelInfo {
  const safePoints = Math.max(0, Number(points) || 0);
  const currentIndex = ACCOUNT_LEVELS.reduce(
    (bestIndex, level, index) => (safePoints >= level.minPoints ? index : bestIndex),
    0,
  );
  const currentLevel = ACCOUNT_LEVELS[currentIndex];
  const nextLevel = ACCOUNT_LEVELS[currentIndex + 1] ?? null;
  const currentBandStart = currentLevel.minPoints;
  const currentBandEnd = nextLevel?.minPoints ?? currentBandStart;
  const bandSize = Math.max(1, currentBandEnd - currentBandStart);

  return {
    level: currentIndex + 1,
    tier: currentLevel.tier,
    title: currentLevel.title,
    minPoints: currentLevel.minPoints,
    nextLevelAt: nextLevel?.minPoints ?? null,
    progressPercent: nextLevel ? Math.min(100, Math.round(((safePoints - currentBandStart) / bandSize) * 100)) : 100,
    perks: currentLevel.perks,
  };
}
