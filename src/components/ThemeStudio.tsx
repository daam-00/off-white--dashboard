import React, { useMemo } from 'react';
import { Check, Sparkles, SwatchBook } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { DASHBOARD_THEMES, getThemeDefinition, normalizeThemeId } from '../lib/themes';
import type { UserStats } from '../types';

function getStoredStats(): UserStats {
  const saved = localStorage.getItem('offwhite_user_stats');
  if (!saved) {
    return { points: 0, activeTheme: 'theme-offwhite' };
  }

  try {
    const parsed = JSON.parse(saved) as UserStats;
    return {
      ...parsed,
      activeTheme: normalizeThemeId(parsed.activeTheme),
    };
  } catch {
    return { points: 0, activeTheme: 'theme-offwhite' };
  }
}

export const ThemeStudio: React.FC = () => {
  const [stats, setStats] = React.useState<UserStats>(() => getStoredStats());
  const activeThemeId = normalizeThemeId(stats.activeTheme);
  const activeTheme = useMemo(() => getThemeDefinition(activeThemeId), [activeThemeId]);

  const applyTheme = (themeId: string) => {
    const nextStats = {
      ...stats,
      activeTheme: normalizeThemeId(themeId),
    };

    setStats(nextStats);
    localStorage.setItem('offwhite_user_stats', JSON.stringify(nextStats));
    window.dispatchEvent(new CustomEvent('stats-update'));
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
          </div>

          <div className="theme-chip-panel border-2 border-black px-5 py-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.32em] text-gray-500">Tema attivo</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="theme-dot h-4 w-4 rounded-full border-2 border-black" />
              <div>
                <div className="text-2xl font-black uppercase tracking-tight">{activeTheme.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-offwhite-orange">{activeTheme.badge}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <SectionHeader title="TEMI" label="VISUAL_SYSTEM_SWITCHER" />

          <div className="grid gap-4 lg:grid-cols-3">
            {DASHBOARD_THEMES.map((theme) => {
              const isActive = theme.id === activeThemeId;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => applyTheme(theme.id)}
                  className={`theme-card theme-card-${theme.id} border-2 p-4 text-left transition-all ${
                    isActive ? 'border-black' : 'border-black/20 hover:-translate-y-1 hover:border-black'
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-500">{theme.badge}</div>
                      <div className="mt-2 text-2xl font-black uppercase leading-none tracking-tight">{theme.name}</div>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center border-2 border-black ${isActive ? 'bg-black text-white' : 'bg-white text-black'}`}>
                      {isActive ? <Check size={16} /> : <SwatchBook size={16} />}
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
                I temi cambiano shell, palette, superfici, accenti e atmosfera generale. I tuoi dati restano invariati.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
