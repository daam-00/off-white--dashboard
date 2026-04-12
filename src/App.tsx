/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState } from 'react';
import { ArrowRight, Calendar, Dumbbell, LayoutDashboard, Menu, ShoppingBag, Sparkles, SwatchBook, Trophy, Utensils, Wallet, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeDefinition, normalizeThemeId } from './lib/themes';

const Finance = lazy(() => import('./components/Finance').then((module) => ({ default: module.Finance })));
const Fitness = lazy(() => import('./components/Fitness').then((module) => ({ default: module.Fitness })));
const Diet = lazy(() => import('./components/Diet').then((module) => ({ default: module.Diet })));
const Shopping = lazy(() => import('./components/Shopping').then((module) => ({ default: module.Shopping })));
const Trophies = lazy(() => import('./components/Trophies').then((module) => ({ default: module.Trophies })));
const DailyRoutine = lazy(() => import('./components/DailyRoutine').then((module) => ({ default: module.DailyRoutine })));
const ThemeStudio = lazy(() => import('./components/ThemeStudio').then((module) => ({ default: module.ThemeStudio })));

type Tab = 'dashboard' | 'finance' | 'fitness' | 'diet' | 'shopping' | 'trophies' | 'routine' | 'themes';

type UserProfile = {
  name?: string;
};

type HomeMetrics = {
  mealsCompleted: number;
  mealsTarget: number;
  monthlySpent: number;
  monthlyBudget: number;
  shoppingPending: number;
  shoppingTotal: number;
  workoutsCompleted: number;
  workoutsTarget: number;
};

function getStoredStats() {
  const fallback = { points: 0, activeTheme: 'theme-offwhite' };
  const saved = localStorage.getItem('offwhite_user_stats');

  if (!saved) return fallback;

  try {
    const parsed = JSON.parse(saved) as { points?: number; activeTheme?: string };
    return {
      points: typeof parsed.points === 'number' ? parsed.points : 0,
      activeTheme: normalizeThemeId(parsed.activeTheme),
    };
  } catch {
    return fallback;
  }
}

function getStoredProfile(): UserProfile {
  const saved = localStorage.getItem('offwhite_user_profile');

  if (!saved) return {};

  try {
    const parsed = JSON.parse(saved) as UserProfile;
    return typeof parsed.name === 'string' ? parsed : {};
  } catch {
    return {};
  }
}

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buona sera';
}

function getClockLabel(date: Date) {
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function parseStoredArray<T>(key: string): T[] {
  const saved = localStorage.getItem(key);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getHomeMetrics(): HomeMetrics {
  const meals = parseStoredArray<{ completed?: boolean }>('offwhite_meals');
  const transactions = parseStoredArray<{ amount?: number; type?: string; date?: string }>('offwhite_transactions');
  const shopping = parseStoredArray<{ bought?: boolean }>('offwhite_shopping');
  const workouts = parseStoredArray<unknown>('offwhite_workouts');
  const monthKey = getCurrentMonthKey();

  const monthlySpent = transactions
    .filter((transaction) => transaction?.type === 'expense' && typeof transaction.date === 'string' && transaction.date.startsWith(monthKey))
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount) || 0), 0);

  const shoppingPending = shopping.filter((item) => !item?.bought).length;
  const workoutsCompleted = workouts.length;
  const mealsCompleted = meals.length;

  return {
    mealsCompleted,
    mealsTarget: Math.max(3, Math.max(mealsCompleted, 0)),
    monthlySpent,
    monthlyBudget: Math.max(1800, monthlySpent || 0),
    shoppingPending,
    shoppingTotal: shopping.length,
    workoutsCompleted,
    workoutsTarget: Math.max(5, Math.max(workoutsCompleted, 0)),
  };
}

function formatCompactValue(value: number, suffix = '') {
  return `${value}${suffix}`;
}

function formatCurrencyCompact(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function SectionFallback() {
  return (
    <div className="offwhite-border min-h-[280px] animate-pulse">
      <div className="mb-6 md:mb-8">
        <div className="offwhite-label bg-gray-100 text-transparent">LOADING</div>
        <div className="mt-3 h-10 bg-gray-100" />
      </div>
      <div className="space-y-4">
        <div className="h-24 border-2 border-gray-100 bg-gray-50" />
        <div className="h-24 border-2 border-gray-100 bg-gray-50" />
        <div className="h-24 border-2 border-gray-100 bg-gray-50" />
      </div>
    </div>
  );
}

function TabPanel({ children, panelKey }: { children: React.ReactNode; panelKey: string }) {
  return (
    <motion.div key={panelKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Suspense fallback={<SectionFallback />}>{children}</Suspense>
    </motion.div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState(() => getStoredStats());
  const [profile, setProfile] = useState(() => getStoredProfile());
  const [homeMetrics, setHomeMetrics] = useState(() => getHomeMetrics());
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const isFinanceFullscreen = activeTab === 'finance';

  React.useEffect(() => {
    const handleStatsUpdate = () => {
      setStats(getStoredStats());
    };
    window.addEventListener('stats-update', handleStatsUpdate);
    return () => window.removeEventListener('stats-update', handleStatsUpdate);
  }, []);

  React.useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile(getStoredProfile());
    };
    window.addEventListener('profile-update', handleProfileUpdate);
    return () => window.removeEventListener('profile-update', handleProfileUpdate);
  }, []);

  React.useEffect(() => {
    const handleMetricsUpdate = () => {
      setHomeMetrics(getHomeMetrics());
    };

    window.addEventListener('checkin-update', handleMetricsUpdate);
    window.addEventListener('shopping-update', handleMetricsUpdate);
    window.addEventListener('storage', handleMetricsUpdate);
    window.addEventListener('focus', handleMetricsUpdate);

    return () => {
      window.removeEventListener('checkin-update', handleMetricsUpdate);
      window.removeEventListener('shopping-update', handleMetricsUpdate);
      window.removeEventListener('storage', handleMetricsUpdate);
      window.removeEventListener('focus', handleMetricsUpdate);
    };
  }, []);

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setShowLaunchScreen(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  const activeTheme = getThemeDefinition(stats.activeTheme);
  const greeting = getGreeting(now);
  const displayName = profile.name?.trim() || 'tu';
  const clockLabel = getClockLabel(now);

  const navItems = [
    { id: 'dashboard', label: 'HOME', icon: LayoutDashboard },
    { id: 'routine', label: 'ROUTINE GIORNALIERA', icon: Calendar },
    { id: 'finance', label: 'PORTAFOGLIO', icon: Wallet },
    { id: 'fitness', label: 'ALLENAMENTO', icon: Dumbbell },
    { id: 'diet', label: 'ALIMENTAZIONE', icon: Utensils },
    { id: 'shopping', label: 'SPESA', icon: ShoppingBag },
    { id: 'trophies', label: 'OBIETTIVI', icon: Trophy },
    { id: 'themes', label: 'TEMI', icon: SwatchBook },
  ];

  const [checkins, setCheckins] = useState<string[]>(() => {
    const saved = localStorage.getItem('offwhite_checkins');
    return saved ? JSON.parse(saved) : [];
  });

  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = checkins.includes(today);

  const handleCheckIn = () => {
    if (!hasCheckedInToday) {
      const updated = [...checkins, today];
      setCheckins(updated);
      localStorage.setItem('offwhite_checkins', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('checkin-update'));
    }
  };

  const homeCards: Array<{
    tab: Tab;
    label: string;
    value: string;
    detail: string;
    accent: string;
  }> = [
    {
      tab: 'diet',
      label: 'Alimentazione',
      value: `${Math.round((homeMetrics.mealsCompleted / homeMetrics.mealsTarget) * 100) || 0}%`,
      detail: `${formatCompactValue(homeMetrics.mealsCompleted)}/${formatCompactValue(homeMetrics.mealsTarget)} pasti`,
      accent: 'is-mint',
    },
    {
      tab: 'finance',
      label: 'Portafoglio',
      value: formatCurrencyCompact(homeMetrics.monthlySpent),
      detail: `spesi su ${formatCurrencyCompact(homeMetrics.monthlyBudget)}`,
      accent: 'is-sky',
    },
    {
      tab: 'shopping',
      label: 'Spesa',
      value: `${homeMetrics.shoppingPending}`,
      detail: `${homeMetrics.shoppingTotal} articoli in lista`,
      accent: 'is-apricot',
    },
    {
      tab: 'fitness',
      label: 'Allenamento',
      value: `${homeMetrics.workoutsCompleted}/${homeMetrics.workoutsTarget}`,
      detail: 'sessioni completate',
      accent: 'is-lilac',
    },
  ];

  return (
    <div 
      className={`dashboard-theme ${normalizeThemeId(stats.activeTheme)} flex min-h-svh flex-col overflow-x-hidden md:h-dvh md:min-h-dvh md:overflow-hidden md:flex-row`}
      style={{
        '--color-offwhite-orange': activeTheme.accent,
        '--theme-accent': activeTheme.accent,
        '--theme-accent-soft': activeTheme.accentSoft,
        '--theme-bg': activeTheme.background,
        '--theme-panel': activeTheme.panel,
        '--theme-panel-muted': activeTheme.panelMuted,
        '--theme-ink': activeTheme.ink,
        '--theme-ink-contrast': activeTheme.inkContrast,
        '--theme-border': activeTheme.border,
        '--theme-grid': activeTheme.grid,
        '--theme-shadow': activeTheme.shadow,
      } as React.CSSProperties}
    >
      <AnimatePresence>
        {showLaunchScreen && (
          <motion.div
            key="launch-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="launch-screen fixed inset-0 z-[120] flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="launch-screen-card"
            >
              <img src="/better-me-logo.png" alt="better me" className="launch-screen-logo" />
              <div className="launch-screen-name">better me</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="sidebar-shell hidden h-full flex-shrink-0 flex-col border-r-2 border-black relative z-50 md:flex"
      >
        <div className="p-6 mb-8 flex items-center justify-between">
          <div className={`dashboard-brand font-black text-2xl tracking-tighter transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            BETTER ME
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-black hover:text-offwhite-orange transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center p-3 transition-all group relative ${
                activeTab === item.id ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-4 font-mono text-[10px] font-bold uppercase tracking-widest"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t-2 border-black">
          <div className="font-mono text-[8px] text-gray-400 uppercase leading-tight">
            © 2026 BETTER_ME_OS<br />
            PERSONAL_SYSTEM
          </div>
        </div>
      </motion.aside>

      {/* MOBILE HEADER */}
      <header className={`sidebar-shell md:hidden border-b-2 border-black p-4 justify-between items-center z-50 shrink-0 ${isFinanceFullscreen ? 'hidden' : 'flex'}`}>
        <div className="dashboard-brand font-black text-xl tracking-tighter">BETTER ME</div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] font-black text-offwhite-orange">{stats.points} PTS</div>
          <div className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            {navItems.find(n => n.id === activeTab)?.label}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className={`main-shell relative flex-1 min-h-0 overflow-y-auto md:p-8 md:pb-8 ${isFinanceFullscreen ? 'p-0 pb-0' : 'p-4 pb-24'}`}>
        <div className="absolute top-0 right-0 p-4 flex items-center gap-4 pointer-events-none select-none hidden sm:flex">
          <div className="font-mono text-[10px] font-black text-offwhite-orange">{stats.points} BETTER-CREDITS</div>
          <div className="font-mono text-[8px] md:text-[10px] text-gray-300">
            "IL_PROGRESSO_E_UN_PERCORSO" // V1.0
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <section className="welcome-home-shell overflow-hidden">
                  <div className="welcome-home-noise" />
                  <div className="welcome-home-orbit welcome-home-orbit-primary" />
                  <div className="welcome-home-orbit welcome-home-orbit-secondary" />
                  <div className="welcome-home-glow welcome-home-glow-primary" />
                  <div className="welcome-home-glow welcome-home-glow-secondary" />

                  <div className="welcome-home-content relative z-10">
                    <div className="welcome-home-topline">
                      <div className="welcome-home-kicker">
                        <Sparkles size={14} strokeWidth={2.1} />
                        home rituale
                      </div>
                      <div className="welcome-home-time">
                        <span>{clockLabel}</span>
                        <span>{stats.points} pts</span>
                      </div>
                    </div>

                    <div className="welcome-home-hero">
                      <div className="welcome-home-copy">
                        <p className="welcome-home-greeting">{greeting}</p>
                        <h1 className="welcome-home-title">{displayName}</h1>
                        <p className="welcome-home-subtitle">
                          Una home sola, piu calma e piu bella. Entri, ti orienti in un secondo e poi vai dritto dove ti serve davvero.
                        </p>

                        <div className="welcome-home-status-row">
                          <div className="welcome-home-pill">
                            <span className="welcome-home-pill-label">check-in</span>
                            <span>{hasCheckedInToday ? 'gia fatto' : 'in attesa'}</span>
                          </div>
                          <div className="welcome-home-pill">
                            <span className="welcome-home-pill-label">profilo</span>
                            <span>{profile.name ? 'nome attivo' : 'nome dal login'}</span>
                          </div>
                          <div className="welcome-home-pill">
                            <span className="welcome-home-pill-label">momento</span>
                            <span>{clockLabel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="welcome-home-spotlight">
                        <div className="welcome-home-spotlight-card">
                          <div className="welcome-home-spotlight-label">capsula del giorno</div>
                          <div className="welcome-home-spotlight-value">
                            {hasCheckedInToday ? 'Sei gia dentro il ritmo.' : 'Parti con un gesto semplice.'}
                          </div>
                          <p className="welcome-home-spotlight-text">
                            Meno dashboard, piu atmosfera. Questa schermata deve darti il tono giusto prima ancora dei dati.
                          </p>
                          <div className="welcome-home-spotlight-meta">
                            <div>
                              <span className="welcome-home-spotlight-meta-label">focus</span>
                              <strong>{hasCheckedInToday ? 'Routine' : 'Check-in'}</strong>
                            </div>
                            <div>
                              <span className="welcome-home-spotlight-meta-label">tema</span>
                              <strong>{activeTheme.name}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="welcome-home-grid">
                      {homeLinks.map((item, index) => (
                        <motion.button
                          key={item.tab}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.985 }}
                          transition={{ duration: 0.18 }}
                          onClick={() => setActiveTab(item.tab)}
                          className={`welcome-entry-card ${index === 1 ? 'is-featured' : ''}`}
                        >
                          <div className="welcome-entry-eyebrow">{item.eyebrow}</div>
                          <div className="welcome-entry-title">{item.label}</div>
                          <p className="welcome-entry-detail">{item.detail}</p>
                          <span className="welcome-entry-cta">
                            Apri
                            <ArrowRight size={14} strokeWidth={2.2} />
                          </span>
                        </motion.button>
                      ))}
                    </div>

                    <div className="welcome-home-footer">
                      <div className="welcome-home-footer-note">
                        Il nome qui sopra e gia pronto per il login futuro: quando colleghiamo l autenticazione, questa home salutera davvero chi entra.
                      </div>
                      <button
                        onClick={hasCheckedInToday ? () => setActiveTab('finance') : handleCheckIn}
                        className="welcome-home-primary-button"
                      >
                        <span>{hasCheckedInToday ? 'Apri portafoglio' : 'Fai check-in'}</span>
                        <ArrowRight size={16} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'routine' && (
              <TabPanel panelKey="routine">
                <DailyRoutine />
              </TabPanel>
            )}

            {activeTab === 'finance' && (
              <TabPanel panelKey="finance">
                <Finance />
              </TabPanel>
            )}

            {activeTab === 'fitness' && (
              <TabPanel panelKey="fitness">
                <Fitness />
              </TabPanel>
            )}

            {activeTab === 'diet' && (
              <TabPanel panelKey="diet">
                <Diet />
              </TabPanel>
            )}

            {activeTab === 'shopping' && (
              <TabPanel panelKey="shopping">
                <Shopping />
              </TabPanel>
            )}

            {activeTab === 'trophies' && (
              <TabPanel panelKey="trophies">
                <Trophies />
              </TabPanel>
            )}

            {activeTab === 'themes' && (
              <TabPanel panelKey="themes">
                <ThemeStudio />
              </TabPanel>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="mobile-nav-shell mobile-safe-area md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 py-2">
        <div className="mobile-nav-scroll mobile-nav-orbit flex items-center gap-1.5 overflow-x-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`mobile-nav-orbit-item flex min-w-[88px] shrink-0 flex-col items-center justify-center gap-1.5 px-3 py-3 transition-all ${
              activeTab === item.id
                ? 'is-active text-white'
                : 'text-[color:var(--theme-ink)]/78'
            }`}
          >
            <span className="flex h-5 items-center justify-center">
              <item.icon size={20} strokeWidth={2.1} />
            </span>
            <span className="text-center font-mono text-[8px] uppercase leading-tight tracking-[0.16em]">
              {item.label.split(' ')[0]}
            </span>
          </button>
        ))}
        </div>
      </nav>
    </div>
  );
}
