import React, { useMemo, useState } from 'react';
import { Check, Lock, Star, SwatchBook, User } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { DASHBOARD_THEMES, getThemeDefinition, normalizeThemeId } from '../lib/themes';
import { PROFILE_AVATARS, RARITY_COLOR, RARITY_LABEL } from '../lib/avatars';
import type { UserStats } from '../types';
import { getAccountLevelInfo, getStoredUserStats, saveUserStats } from '../lib/account';

const ADMIN_EMAIL = 'thsedici@gmail.com';

const THEME_COSTS: Record<string, number> = {
  'theme-offwhite': 0,
  'theme-liquid-glass': 600,
};

interface ThemeStudioProps {
  ownerEmail?: string | null;
}

export const ThemeStudio: React.FC<ThemeStudioProps> = ({ ownerEmail }) => {
  const isAdmin = ownerEmail === ADMIN_EMAIL;
  const [stats, setStats] = React.useState<UserStats>(() => getStoredUserStats());
  const [tab, setTab] = useState<'themes' | 'avatars'>('themes');

  const activeThemeId = normalizeThemeId(stats.activeTheme);
  const activeTheme = useMemo(() => getThemeDefinition(activeThemeId), [activeThemeId]);
  const accountLevel = useMemo(() => getAccountLevelInfo(stats.points), [stats.points]);

  /* ── helpers ───────────────────────────────────────────────── */
  const unlockedThemeSet = useMemo(
    () => new Set(Array.from(new Set([...(stats.unlockedThemes ?? ['theme-offwhite']), activeThemeId]))),
    [stats.unlockedThemes, activeThemeId],
  );

  const unlockedAvatarSet = useMemo(
    () => new Set(['default-bot', ...(stats.unlockedAvatars ?? [])]),
    [stats.unlockedAvatars],
  );

  const activeAvatarId = stats.avatarId ?? 'default-bot';

  /* ── apply theme ────────────────────────────────────────────── */
  const applyTheme = (themeId: string) => {
    const normalizedId = normalizeThemeId(themeId);
    const isUnlocked = isAdmin || unlockedThemeSet.has(normalizedId);
    const cost = THEME_COSTS[normalizedId] ?? 0;

    if (!isUnlocked && stats.points < cost) return;

    const nextStats: UserStats = {
      ...stats,
      points: isAdmin || isUnlocked ? stats.points : stats.points - cost,
      activeTheme: normalizedId,
      unlockedThemes: Array.from(new Set([...unlockedThemeSet, normalizedId])),
    };

    setStats(nextStats);
    saveUserStats(nextStats);
  };

  /* ── apply avatar ───────────────────────────────────────────── */
  const applyAvatar = (avatarId: string) => {
    const avatar = PROFILE_AVATARS.find((a) => a.id === avatarId);
    if (!avatar) return;
    const isUnlocked = isAdmin || unlockedAvatarSet.has(avatarId);
    if (!isUnlocked && stats.points < avatar.cost) return;

    const nextStats: UserStats = {
      ...stats,
      points: isAdmin || isUnlocked ? stats.points : stats.points - avatar.cost,
      avatarId,
      avatarUrl: avatar.imageUrl,
      unlockedAvatars: Array.from(new Set([...unlockedAvatarSet, avatarId])),
    };

    setStats(nextStats);
    saveUserStats(nextStats);
  };

  /* ── group avatars by series ────────────────────────────────── */
  const avatarsBySeries = useMemo(() => {
    const map = new Map<string, typeof PROFILE_AVATARS>();
    for (const avatar of PROFILE_AVATARS) {
      if (!map.has(avatar.series)) map.set(avatar.series, []);
      map.get(avatar.series)!.push(avatar);
    }
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero panel */}
      <div className="offwhite-border hero-panel overflow-hidden">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="offwhite-label">THEME_STUDIO</div>
            <h1 className="dashboard-brand text-5xl leading-none md:text-7xl">BETTER ME</h1>
            <p className="mt-4 max-w-xl font-mono text-[11px] uppercase tracking-[0.28em] text-gray-500">
              Cambia l'identità visiva dell'intera dashboard senza toccare dati, routine o contenuti.
            </p>
            <div className="mt-5 inline-flex items-center gap-3 border-2 border-black bg-white px-4 py-2">
              <span className="font-mono text-[10px] font-black uppercase tracking-widest">{stats.points} Better Credits</span>
              {isAdmin && (
                <span className="font-mono text-[8px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">ADMIN</span>
              )}
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
                  Livello {accountLevel.level} · {accountLevel.title}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-0 border-2 border-black w-fit">
        <button
          type="button"
          onClick={() => setTab('themes')}
          className={`flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] font-black uppercase tracking-widest transition-colors ${
            tab === 'themes' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5'
          }`}
        >
          <SwatchBook size={14} />
          Temi
        </button>
        <button
          type="button"
          onClick={() => setTab('avatars')}
          className={`flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] font-black uppercase tracking-widest transition-colors border-l-2 border-black ${
            tab === 'avatars' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5'
          }`}
        >
          <User size={14} />
          Avatar
        </button>
      </div>

      {/* THEMES TAB */}
      {tab === 'themes' && (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <SectionHeader title="TEMI" label="VISUAL_SYSTEM_SWITCHER" />

            <div className="grid gap-4 lg:grid-cols-2">
              {DASHBOARD_THEMES.map((theme) => {
                const isActive = theme.id === activeThemeId;
                const isUnlocked = isAdmin || unlockedThemeSet.has(theme.id);
                const cost = THEME_COSTS[theme.id] ?? 0;
                const canAfford = isAdmin || stats.points >= cost;
                const cardClass = theme.cssClass ?? theme.id;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => applyTheme(theme.id)}
                    disabled={!isUnlocked && !canAfford}
                    className={`theme-card theme-card-${cardClass} border-2 p-4 text-left transition-all ${
                      isActive ? 'border-black' : 'border-black/20 hover:-translate-y-1 hover:border-black'
                    } ${!isUnlocked && !canAfford ? 'cursor-not-allowed opacity-45 grayscale' : ''}`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-500">{theme.badge}</div>
                        <div className="mt-2 text-2xl font-black uppercase leading-none tracking-tight">{theme.name}</div>
                        <div className="mt-2 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-offwhite-orange">
                          {isAdmin ? '✦ ADMIN FREE' : isUnlocked ? 'Sbloccato' : `${cost} credits`}
                        </div>
                      </div>
                      <div
                        className={`flex h-9 w-9 items-center justify-center border-2 border-black ${isActive ? 'bg-black text-white' : 'bg-white text-black'}`}
                      >
                        {isActive ? <Check size={16} /> : isUnlocked || canAfford ? <SwatchBook size={16} /> : <Lock size={16} />}
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
                    : 'Hai raggiunto il livello account massimo. Continua ad accumulare Better Credits.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AVATARS TAB */}
      {tab === 'avatars' && (
        <div className="space-y-6">
          <SectionHeader title="AVATAR" label="PROFILE_IDENTITY" />

          <div className="offwhite-border p-5">
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-500 mb-4">Avatar attivo</div>
            <div className="flex items-center gap-4">
              {(() => {
                const active = PROFILE_AVATARS.find((a) => a.id === activeAvatarId) ?? PROFILE_AVATARS[0];
                return (
                  <>
                    <img
                      src={active.imageUrl}
                      alt={active.name}
                      className="h-16 w-16 rounded-full border-2 border-black"
                      style={{ backgroundColor: active.bgColor }}
                    />
                    <div>
                      <div className="text-2xl font-black uppercase tracking-tight">{active.name}</div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.24em]" style={{ color: RARITY_COLOR[active.rarity] }}>
                        {RARITY_LABEL[active.rarity]} · {active.series}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {Array.from(avatarsBySeries.entries()).map(([series, avatars]) => (
            <div key={series}>
              <div className="avatar-series-header">{series}</div>
              <div className="avatar-grid">
                {avatars.map((avatar) => {
                  const isActive = avatar.id === activeAvatarId;
                  const isUnlocked = isAdmin || unlockedAvatarSet.has(avatar.id);
                  const canAfford = isAdmin || stats.points >= avatar.cost;
                  const locked = !isUnlocked && !canAfford;

                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => applyAvatar(avatar.id)}
                      disabled={locked}
                      className={`avatar-card ${isActive ? 'is-active' : ''} ${locked ? 'is-locked' : ''}`}
                      title={locked ? `${avatar.cost} credits richiesti` : avatar.name}
                    >
                      <div
                        className="relative rounded-full border-2 border-black overflow-hidden"
                        style={{ width: 48, height: 48, backgroundColor: avatar.bgColor }}
                      >
                        <img src={avatar.imageUrl} alt={avatar.name} className="w-full h-full object-cover" />
                        {locked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Lock size={14} className="text-white" />
                          </div>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                      <span className="font-mono text-[7px] font-black uppercase tracking-wide text-center leading-tight line-clamp-2">
                        {avatar.name}
                      </span>
                      <span className="font-mono text-[7px] uppercase" style={{ color: RARITY_COLOR[avatar.rarity] }}>
                        {isAdmin ? '✦' : isUnlocked ? '✓' : `${avatar.cost}cr`}
                      </span>
                      {avatar.rarity === 'legendary' && (
                        <Star size={8} style={{ color: RARITY_COLOR.legendary }} fill={RARITY_COLOR.legendary} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
