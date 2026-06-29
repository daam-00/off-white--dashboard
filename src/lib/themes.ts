export type DashboardThemeId =
  | 'theme-offwhite'
  | 'theme-offwhite-dark'
  | 'theme-liquid-glass'
  | 'theme-liquid-glass-dark'
  | 'theme-selah'
  | 'theme-selah-light';

export interface DashboardThemeDefinition {
  id: DashboardThemeId;
  name: string;
  badge: string;
  description: string;
  accent: string;
  accentSoft: string;
  background: string;
  panel: string;
  panelMuted: string;
  ink: string;
  inkContrast: string;
  border: string;
  grid: string;
  shadow: string;
  darkPair?: DashboardThemeId;
  lightPair?: DashboardThemeId;
  cssClass?: string;
}

export const DASHBOARD_THEMES: DashboardThemeDefinition[] = [
  {
    id: 'theme-selah',
    name: 'Selah',
    badge: 'PREMIUM',
    description: 'Caldo, profondo e sofisticato. Scuro ambra Off-White con serif display.',
    accent: '#E8671A',
    accentSoft: 'rgba(232, 103, 26, 0.18)',
    background: '#1C1A18',
    panel: '#242220',
    panelMuted: '#2E2B28',
    ink: '#FFF8EF',
    inkContrast: '#1C1A18',
    border: 'rgba(255, 248, 239, 0.08)',
    grid: 'rgba(232, 103, 26, 0.06)',
    shadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
    lightPair: 'theme-selah-light',
  },
  {
    id: 'theme-selah-light',
    name: 'Selah Luce',
    badge: 'DAY',
    description: 'Versione diurna del tema Selah: crema calda e arancio ricco.',
    accent: '#C85A14',
    accentSoft: 'rgba(200, 90, 20, 0.1)',
    background: '#FFFBF5',
    panel: '#FFFFFF',
    panelMuted: '#FFF4E8',
    ink: '#1C1007',
    inkContrast: '#FFFFFF',
    border: 'rgba(155, 76, 40, 0.12)',
    grid: 'rgba(155, 76, 40, 0.06)',
    shadow: '0 4px 20px rgba(100, 50, 20, 0.08)',
    darkPair: 'theme-selah',
  },
  {
    id: 'theme-offwhite',
    name: 'Off White',
    badge: 'CLASSIC',
    description: 'Il layout originale: pulito, netto, editoriale e ad alto contrasto.',
    accent: '#FF5C00',
    accentSoft: '#FFE2D1',
    background: '#FFFFFF',
    panel: '#FFFFFF',
    panelMuted: '#F4F4F4',
    ink: '#090909',
    inkContrast: '#FFFFFF',
    border: '#090909',
    grid: 'rgba(9, 9, 9, 0.08)',
    shadow: '10px 10px 0 rgba(9, 9, 9, 0.06)',
    darkPair: 'theme-offwhite-dark',
  },
  {
    id: 'theme-offwhite-dark',
    name: 'Off White Dark',
    badge: 'DARK',
    description: 'Off White in modalità notturna.',
    accent: '#FF5C00',
    accentSoft: 'rgba(255, 92, 0, 0.15)',
    background: '#0A0A0A',
    panel: '#141414',
    panelMuted: '#1E1E1E',
    ink: '#F5F5F0',
    inkContrast: '#0A0A0A',
    border: 'rgba(245, 245, 240, 0.12)',
    grid: 'rgba(255, 92, 0, 0.06)',
    shadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
    lightPair: 'theme-offwhite',
  },
  {
    id: 'theme-liquid-glass',
    name: 'Liquid Glass',
    badge: 'SIRI',
    description: 'Vetro satinato lucidato, riflessi fluidi neon e sfondi ambientali Siri.',
    accent: '#A600FF',
    accentSoft: 'rgba(166, 0, 255, 0.15)',
    background: '#F2F2F7',
    panel: 'rgba(255, 255, 255, 0.6)',
    panelMuted: 'rgba(255, 255, 255, 0.35)',
    ink: '#1C1C1E',
    inkContrast: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.45)',
    grid: 'rgba(166, 0, 255, 0.08)',
    shadow: '0 15px 35px -5px rgba(0, 0, 0, 0.05)',
    darkPair: 'theme-liquid-glass-dark',
  },
  {
    id: 'theme-liquid-glass-dark',
    name: 'Liquid Glass Dark',
    badge: 'NIGHT',
    description: 'Liquid Glass in modalità notte con riflessi Siri profondi.',
    accent: '#BF5AF2',
    accentSoft: 'rgba(191, 90, 242, 0.18)',
    background: '#000000',
    panel: 'rgba(28, 28, 30, 0.75)',
    panelMuted: 'rgba(44, 44, 46, 0.55)',
    ink: '#EBEBF5',
    inkContrast: '#000000',
    border: 'rgba(255, 255, 255, 0.12)',
    grid: 'rgba(191, 90, 242, 0.08)',
    shadow: '0 15px 35px -5px rgba(0, 0, 0, 0.6)',
    lightPair: 'theme-liquid-glass',
  },
];

const LEGACY_THEME_MAP: Record<string, DashboardThemeId> = {
  standard: 'theme-selah',
  'theme-orange': 'theme-offwhite',
  'theme-blue': 'theme-liquid-glass',
  'theme-dark': 'theme-selah',
  'theme-forest': 'theme-selah',
  'theme-sunset': 'theme-selah',
  'theme-invincible-v2': 'theme-offwhite',
  'theme-invincible': 'theme-offwhite',
  'theme-invincible-hero': 'theme-offwhite',
  'theme-offwhite': 'theme-offwhite',
  'theme-offwhite-dark': 'theme-offwhite-dark',
  'theme-liquid-glass': 'theme-liquid-glass',
  'theme-liquid-glass-dark': 'theme-liquid-glass-dark',
  'theme-selah': 'theme-selah',
  'theme-selah-light': 'theme-selah-light',
};

export function normalizeThemeId(themeId?: string): DashboardThemeId {
  if (!themeId) return 'theme-selah';
  return LEGACY_THEME_MAP[themeId] ?? 'theme-selah';
}

export function getThemeDefinition(themeId?: string): DashboardThemeDefinition {
  const normalizedId = normalizeThemeId(themeId);
  return DASHBOARD_THEMES.find((theme) => theme.id === normalizedId) ?? DASHBOARD_THEMES[0];
}

export function getThemeCssClass(themeId?: string): string {
  const def = getThemeDefinition(themeId);
  return def.cssClass ?? def.id;
}

export function getDarkPair(themeId?: string): DashboardThemeId {
  const def = getThemeDefinition(themeId);
  return def.darkPair ?? (themeId?.includes('light') ? (def.darkPair ?? 'theme-selah') : 'theme-selah');
}

export function toggleThemeDark(currentThemeId?: string): DashboardThemeId {
  const def = getThemeDefinition(currentThemeId);
  if (def.darkPair) return def.darkPair;
  if (def.lightPair) return def.lightPair;
  return 'theme-selah';
}

export function isThemeDark(themeId?: string): boolean {
  if (!themeId) return true; // selah is dark by default
  if (themeId === 'theme-selah') return true;
  return themeId.includes('dark');
}
