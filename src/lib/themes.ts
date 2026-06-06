export type DashboardThemeId =
  | 'theme-offwhite'
  | 'theme-blue'
  | 'theme-dark'
  | 'theme-forest'
  | 'theme-sunset'
  | 'theme-invincible-v2';

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
  cssClass?: string;
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
  {
    id: 'theme-dark',
    name: 'Midnight',
    badge: 'DARK',
    description: 'Superfici quasi nere, accento verde neon. Alta densità, zero distrazioni.',
    accent: '#00FF94',
    accentSoft: '#003D24',
    background: '#0A0A0A',
    panel: '#111111',
    panelMuted: '#1A1A1A',
    ink: '#E8E8E8',
    inkContrast: '#0A0A0A',
    border: '#2A2A2A',
    grid: 'rgba(0, 255, 148, 0.07)',
    shadow: '10px 10px 0 rgba(0, 255, 148, 0.12)',
  },
  {
    id: 'theme-forest',
    name: 'Deep Forest',
    badge: 'NATURE',
    description: 'Verde muschio, superfici calde e terragne. Calma radicata, focus naturale.',
    accent: '#4CAF50',
    accentSoft: '#C8E6C9',
    background: '#F1F8F1',
    panel: '#FFFFFF',
    panelMuted: '#E8F5E9',
    ink: '#1B2E1B',
    inkContrast: '#FFFFFF',
    border: '#1B2E1B',
    grid: 'rgba(76, 175, 80, 0.12)',
    shadow: '10px 10px 0 rgba(27, 46, 27, 0.10)',
  },
  {
    id: 'theme-sunset',
    name: 'Golden Hour',
    badge: 'WARM',
    description: 'Arancio bruciato e viola profondo. L\'ora d\'oro prima che cada la notte.',
    accent: '#FF6B35',
    accentSoft: '#FFE0D4',
    background: '#FFF8F5',
    panel: '#FFFFFF',
    panelMuted: '#FFF0EA',
    ink: '#2D1B10',
    inkContrast: '#FFFFFF',
    border: '#2D1B10',
    grid: 'rgba(255, 107, 53, 0.10)',
    shadow: '10px 10px 0 rgba(45, 27, 16, 0.09)',
  },
  {
    id: 'theme-invincible-v2',
    name: 'INVINCIBLE',
    badge: 'COMIC · LEGENDARY',
    description: 'Navy cosmico e giallo Viltrum. Potenza da pagina a schermo. Chi ferma l\'invincibile?',
    accent: '#FFD400',
    accentSoft: '#332900',
    background: '#030B15',
    panel: '#081220',
    panelMuted: '#0D1E33',
    ink: '#FFD400',
    inkContrast: '#030B15',
    border: '#FFD400',
    grid: 'rgba(255, 212, 0, 0.08)',
    shadow: '8px 8px 0 rgba(255, 0, 0, 0.35)',
    cssClass: 'theme-invincible-v2',
  },
];

const LEGACY_THEME_MAP: Record<string, DashboardThemeId> = {
  standard: 'theme-offwhite',
  'theme-orange': 'theme-offwhite',
  'theme-blue': 'theme-blue',
  'theme-dark': 'theme-dark',
  'theme-forest': 'theme-forest',
  'theme-sunset': 'theme-sunset',
  'theme-invincible-v2': 'theme-invincible-v2',
  'theme-invincible': 'theme-invincible-v2',
  'theme-invincible-hero': 'theme-invincible-v2',
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

export function getThemeCssClass(themeId?: string): string {
  const def = getThemeDefinition(themeId);
  return def.cssClass ?? def.id;
}
