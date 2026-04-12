/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState } from 'react';
import { LayoutDashboard, Wallet, Dumbbell, ShoppingBag, Trophy, Menu, X, Utensils, Calendar, SwatchBook } from 'lucide-react';
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
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const isFinanceFullscreen = activeTab === 'finance';

  React.useEffect(() => {
    const handleStatsUpdate = () => {
      setStats(getStoredStats());
    };
    window.addEventListener('stats-update', handleStatsUpdate);
    return () => window.removeEventListener('stats-update', handleStatsUpdate);
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setShowLaunchScreen(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  const activeTheme = getThemeDefinition(stats.activeTheme);

  const navItems = [
    { id: 'dashboard', label: 'PANORAMICA', icon: LayoutDashboard },
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

  return (
    <div 
      className={`dashboard-theme ${normalizeThemeId(stats.activeTheme)} flex h-dvh min-h-dvh flex-col overflow-hidden md:flex-row`}
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
      <main className={`main-shell relative flex-1 overflow-y-auto md:p-8 md:pb-8 ${isFinanceFullscreen ? 'p-0 pb-0' : 'p-4 pb-24'}`}>
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
                {/* DAILY CHECK-IN BAR */}
                <div className="offwhite-border bg-black text-white p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="offwhite-label bg-white text-black shrink-0">DAILY_STATUS</div>
                    <div className="font-black text-xl uppercase tracking-tighter truncate">
                      {hasCheckedInToday ? '"CHECK-IN_COMPLETATO"' : '"CHECK-IN_IN_ATTESA"'}
                    </div>
                  </div>
                  <button 
                    onClick={handleCheckIn}
                    disabled={hasCheckedInToday}
                    className={`px-8 py-3 font-mono text-xs uppercase tracking-widest transition-all ${
                      hasCheckedInToday 
                      ? 'bg-white/20 text-white/40 cursor-not-allowed' 
                      : 'bg-offwhite-orange text-white hover:bg-white hover:text-black'
                    }`}
                  >
                    {hasCheckedInToday ? 'COMPLETATO' : 'FAI CHECK-IN'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-6">
                    <DailyRoutine />
                    <Finance />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Fitness />
                      <Diet />
                    </div>
                    <Shopping />
                  </div>
                  <div className="lg:col-span-4">
                    <Trophies />
                  </div>
                </div>
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
      <nav className="mobile-nav-shell mobile-safe-area mobile-nav-scroll md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2 overflow-x-auto border-t-2 border-white/10 px-3 py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex min-w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-sm border px-2 py-2 transition-all ${
              activeTab === item.id
                ? 'border-current bg-black/5 text-offwhite-orange'
                : 'border-black/15 text-black/70'
            }`}
          >
            <span className="flex h-5 items-center justify-center">
              <item.icon size={18} strokeWidth={2.2} />
            </span>
            <span className="text-center font-mono text-[8px] uppercase leading-tight tracking-tighter">
              {item.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
