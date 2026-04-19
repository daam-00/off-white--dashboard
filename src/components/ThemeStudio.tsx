import React, { useMemo } from 'react';
import { Check, Lock, Sparkles, SwatchBook } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { DASHBOARD_THEMES, getThemeDefinition, normalizeThemeId } from '../lib/themes';
import type { UserStats } from '../types';
import { getAccountLevelInfo, getStoredUserStats, saveUserStats } from '../lib/account';

const THEME_COSTS: Record<string, number> = {
  'theme-offwhite': 0,
  'theme-invincible': 300,
  'theme-blue': 500,
};

const INVINCIBLE_EMAIL = 'thsedici@gmail.com';

export const ThemeStudio: React.FC<{ userEmail: string }> = ({ userEmail }) => {
  const [stats, setStats] = React.useState<UserStats>(() => getStoredUserStats());
  const canUseInvincible = userEmail === INVINCIBLE_EMAIL;
  const visibleThemes = useMemo(
    () => DASHBOARD_THEMES.filter((t) => t.id !== 'theme-invincible' || canUseInvincible),
    [canUseInvincible],
  );

  const rawActiveThemeId = normalizeThemeId(stats.activeTheme);
  const activeThemeId = !canUseInvincible && rawActiveThemeId === 'theme-invincible' ? 'theme-offwhite' : rawActiveThemeId;
  const activeTheme = useMemo(() => getThemeDefinition(activeThemeId), [activeThemeId]);
  const accountLevel = useMemo(() => getAccountLevelInfo(stats.points), [stats.points]);

  const applyTheme = (themeId: string) => {
    const normalizedThemeId = normalizeThemeId(themeId);
    const unlockedThemes = Array.from(new Set([...(stats.unlockedThemes ?? ['theme-offwhite']), activeThemeId]));
    const isUnlocked = unlockedThemes.includes(normalizedThemeId);
    const cost = THEME_COSTS[normalizedThemeId] ?? 0;

    if (!isUnlocked && stats.points < cost) return;

    const nextStats = {
      ...stats,
      points: isUnlocked ? stats.points : stats.points - cost,
      activeTheme: normalizedThemeId,
      unlockedThemes: Array.from(new Set([...unlockedThemes, normalizedThemeId])),
    };

    setStats(nextStats);
    saveUserStats(nextStats);
  };

  return (
    <div className="space-y-6">
      <div className="offwhite-border hero-panel overflow-hidden">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="offwhite-label">THEME_STUDIO</div>
            <h1 className="dashboard-brand text-5xl leading-none md:text-7xl">BETTER ME</h1>
            <p className="mt-4 max-w-xl font-mono text-[11px] uppercase tracking-[0.28em] text-gray-500">
              Cambia l identita visiva dell intera dashboard senza toccare dati, routine o contenuti.
            </p>
            <div className="mt-5 inline-flex border-2 border-black bg-white px-4 py-2 font-mono text-[10px] font-black uppercase tracking-widest">
              {stats.points} Better Credits disponibili
            </div>
          </div>

          <div className="theme-chip-panel border-2 border-black px-5 py-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.32em] text-gray-500">Tema attivo</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="theme-dot h-4 w-4 rounded-full border-2 border-black" />
              <div>
                <div className="text-2xl font-black uppercase tracking-tight">{activeTheme.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-offwhite-orange">{activeTheme.badge}</div>
                <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-gray-500">
                  Livello account {accountLevel.level} · {accountLevel.title}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <SectionHeader title="TEMI" label="VISUAL_SYSTEM_SWITCHER" />

          <div className="grid gap-4 lg:grid-cols-3">
            {visibleThemes.map((theme) => {
              const isActive = theme.id === activeThemeId;
              const unlockedThemes = Array.from(new Set([...(stats.unlockedThemes ?? ['theme-offwhite']), activeThemeId]));
              const isUnlocked = unlockedThemes.includes(theme.id);
              const cost = THEME_COSTS[theme.id] ?? 0;
              const canUnlock = stats.points >= cost;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => applyTheme(theme.id)}
                  disabled={!isUnlocked && !canUnlock}
                  className={`theme-card theme-card-${theme.id} border-2 p-4 text-left transition-all ${
                    isActive ? 'border-black' : 'border-black/20 hover:-translate-y-1 hover:border-black'
                  } ${!isUnlocked && !canUnlock ? 'cursor-not-allowed opacity-45 grayscale' : ''}`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-500">{theme.badge}</div>
                      <div className="mt-2 text-2xl font-black uppercase leading-none tracking-tight">{theme.name}</div>
                      <div className="mt-2 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-offwhite-orange">
                        {isUnlocked ? 'Sbloccato' : `${cost} credits`}
                      </div>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center border-2 border-black ${isActive ? 'bg-black text-white' : 'bg-white text-black'}`}>
                      {isActive ? <Check size={16} /> : isUnlocked || canUnlock ? <SwatchBook size={16} /> : <Lock size={16} />}
                    </div>
                  </div>

                  <p className="min-h-16 font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-gray-600">
                    {theme.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-black" style={{ backgroundColor: theme.accent }} />
                    <div className="h-4 w-4 rounded-full border-2 border-black" style={{ backgroundColor: theme.panelMuted }} />
                    <div className="h-4 w-4 rounded-full border-2 border-black" style={{ backgroundColor: theme.ink }} />
                  </div>

                  <div className="mt-5 theme-card-preview border-2 border-black p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-mono text-[8px] uppercase tracking-[0.28em]">Preview</div>
                      <div className="h-2.5 w-16 border border-black" style={{ backgroundColor: theme.accent }} />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-3/4 border border-black/30" />
                      <div className="h-10 border-2 border-black" style={{ backgroundColor: theme.panel }} />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-8 border-2 border-black" style={{ backgroundColor: theme.accentSoft }} />
                        <div className="h-8 border-2 border-black" style={{ backgroundColor: theme.panel }} />
                        <div className="h-8 border-2 border-black" style={{ backgroundColor: theme.ink }} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="offwhite-border h-full">
            <SectionHeader title="SELEZIONE" label="LIVE_APPEARANCE" />

            {activeThemeId === 'theme-invincible' ? (
              <div className="invincible-selection-panel space-y-0 overflow-hidden border-3 border-[#061426]">
                {/* Logo strip */}
                <div className="invincible-sel-logo-bar flex items-center justify-between px-4 py-2">
                  <img
                    src="/themes/invincible/invincible-comic-logo.png"
                    alt="Invincible"
                    className="invincible-sel-logo h-8 w-auto"
                  />
                  <div className="invincible-sel-badge font-mono text-[9px] font-black uppercase tracking-[0.28em]">
                    ★ HERO MODE ACTIVE ★
                  </div>
                </div>

                {/* Hero art */}
                <div className="invincible-sel-hero-stage relative overflow-hidden">
                  <div className="invincible-sel-speed-bg" />
                  <img
                    src="/themes/invincible/mark-grayson-s3.png"
                    alt="Mark Grayson — Invincible"
                    className="invincible-sel-hero-img relative z-10"
                  />
                  <img
                    src="/themes/invincible/omni-man-s1.png"
                    alt="Omni-Man"
                    className="invincible-sel-omni-img absolute bottom-0 right-0 z-10"
                  />
                  <div className="invincible-sel-impact absolute left-3 top-3 z-20 font-mono text-[8px] font-black uppercase tracking-widest text-[#FFD51F]">
                    INVINCIBLE
                  </div>
                </div>

                {/* Stats panel */}
                <div className="invincible-sel-stats grid grid-cols-3 border-t-3 border-[#061426]">
                  <div className="invincible-sel-stat border-r-2 border-[#061426] p-3 text-center">
                    <div className="font-mono text-[8px] uppercase tracking-[0.24em] opacity-70">Forza</div>
                    <div className="mt-1 font-black text-lg leading-none">100%</div>
                  </div>
                  <div className="invincible-sel-stat border-r-2 border-[#061426] p-3 text-center">
                    <div className="font-mono text-[8px] uppercase tracking-[0.24em] opacity-70">Volo</div>
                    <div className="mt-1 font-black text-lg leading-none">ON</div>
                  </div>
                  <div className="invincible-sel-stat p-3 text-center">
                    <div className="font-mono text-[8px] uppercase tracking-[0.24em] opacity-70">Power</div>
                    <div className="mt-1 font-black text-lg leading-none">MAX</div>
                  </div>
                </div>

                {/* Credits note */}
                <div className="border-t-2 border-[#061426] bg-[#061426] px-4 py-2">
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#FFD51F]">
                    {accountLevel.nextLevelAt
                      ? `${Math.max(0, accountLevel.nextLevelAt - stats.points)} credits al prossimo livello`
                      : 'Livello massimo raggiunto — Invincible!'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="theme-chip-panel border-2 border-black p-4">
                  <div className="mb-2 flex items-center gap-2 text-offwhite-orange">
                    <Sparkles size={16} />
                    <span className="font-mono text-[9px] uppercase tracking-[0.28em]">Effetto attivo</span>
                  </div>
                  <div className="text-3xl font-black uppercase tracking-tight">{activeTheme.name}</div>
                  <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-gray-500">
                    {activeTheme.description}
                  </p>
                </div>

                <div className="theme-live-preview border-2 border-black p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="font-mono text-[9px] uppercase tracking-[0.28em]">Dashboard sample</div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-offwhite-orange">Better Me</div>
                  </div>

                  <div className="space-y-3">
                    <div className="theme-live-banner border-2 border-black p-4">
                      <div className="font-mono text-[8px] uppercase tracking-[0.28em]">Daily status</div>
                      <div className="mt-2 text-2xl font-black uppercase tracking-tight">Focused and consistent</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="theme-live-tile border-2 border-black p-3">
                        <div className="font-mono text-[8px] uppercase tracking-[0.24em]">Energy</div>
                        <div className="mt-2 text-xl font-black">87%</div>
                      </div>
                      <div className="theme-live-tile border-2 border-black p-3">
                        <div className="font-mono text-[8px] uppercase tracking-[0.24em]">Streak</div>
                        <div className="mt-2 text-xl font-black">12 giorni</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-gray-500">
                  {accountLevel.nextLevelAt
                    ? `Check-in e obiettivi danno Better Credits. Ti mancano ${Math.max(0, accountLevel.nextLevelAt - stats.points)} credits per il livello successivo.`
                    : 'Hai raggiunto il livello account massimo attuale. Continua ad accumulare Better Credits per consolidare i tuoi progressi.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
