export type DashboardThemeId =
  | 'theme-offwhite'
  | 'theme-invincible'
  | 'theme-blue';

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
}

export const DASHBOARD_THEMES: DashboardThemeDefinition[] = [
  {
    id: 'theme-offwhite',
    name: 'Off White',
    badge: 'DEFAULT',
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
  },
  {
    id: 'theme-invincible',
    name: 'Invincible',
    badge: 'HERO MODE',
    description: 'Palette da cover fumetto: crema solare, rosso d impatto e blu elettrico.',
    accent: '#EE2737',
    accentSoft: '#FFD34F',
    background: '#FFF6CC',
    panel: '#FFFBE8',
    panelMuted: '#FFE28A',
    ink: '#111827',
    inkContrast: '#FFF8DB',
    border: '#111827',
    grid: 'rgba(17, 24, 39, 0.12)',
    shadow: '12px 12px 0 #2B59FF',
  },
  {
    id: 'theme-blue',
    name: 'Velocity Blue',
    badge: 'ALT',
    description: 'Una variante più notturna e tecnica, con accento cobalto e superfici fredde.',
    accent: '#2B59FF',
    accentSoft: '#C9D5FF',
    background: '#EEF3FF',
    panel: '#F8FAFF',
    panelMuted: '#DCE6FF',
    ink: '#0F172A',
    inkContrast: '#F8FAFF',
    border: '#0F172A',
    grid: 'rgba(43, 89, 255, 0.14)',
    shadow: '10px 10px 0 rgba(43, 89, 255, 0.16)',
  },
];

const LEGACY_THEME_MAP: Record<string, DashboardThemeId> = {
  standard: 'theme-offwhite',
  'theme-orange': 'theme-offwhite',
  'theme-blue': 'theme-blue',
  'theme-invincible': 'theme-invincible',
  'theme-offwhite': 'theme-offwhite',
};

export function normalizeThemeId(themeId?: string): DashboardThemeId {
  if (!themeId) return 'theme-offwhite';
  return LEGACY_THEME_MAP[themeId] ?? 'theme-offwhite';
}

export function getThemeDefinition(themeId?: string): DashboardThemeDefinition {
  const normalizedId = normalizeThemeId(themeId);
  return DASHBOARD_THEMES.find((theme) => theme.id === normalizedId) ?? DASHBOARD_THEMES[0];
}
