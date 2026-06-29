/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { Moon, Sun, Menu, LogOut, Sparkles, Trophy, Calendar, Utensils, BookOpen, Dumbbell, Wallet, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeCssClass, getThemeDefinition, isThemeDark, toggleThemeDark } from './lib/themes';
import { auth } from './lib/firebase';
import { initializeFirebaseSync, markDashboardStateChanged, resetFirebaseSync, syncDashboardStateNow } from './lib/firebaseSync';
import { awardUserPoints, getAccountLevelInfo, getStoredUserStats, saveUserStats } from './lib/account';
import { PROFILE_AVATARS } from './lib/avatars';

// Shared Utilities & Components
import { getLocalDateKey, getCurrentMonthKey, parseStoredArray } from './lib/utils';
import { DashboardContext, type Tab, type SectionTab, type UserProfile, type HomeMetrics, SECTION_CHOICES } from './context/DashboardContext';
import { AuthScreen } from './components/AuthScreen';
import { UserPanel } from './components/UserPanel';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { DashboardView } from './components/DashboardView';

// Lazy Loaded Sections
const Diet = lazy(() => import('./components/Diet').then((module) => ({ default: module.Diet })));
const Finance = lazy(() => import('./components/Finance').then((module) => ({ default: module.Finance })));
const Shopping = lazy(() => import('./components/Shopping').then((module) => ({ default: module.Shopping })));
const Fitness = lazy(() => import('./components/Fitness').then((module) => ({ default: module.Fitness })));
const Trophies = lazy(() => import('./components/Trophies').then((module) => ({ default: module.Trophies })));
const DailyRoutine = lazy(() => import('./components/DailyRoutine').then((module) => ({ default: module.DailyRoutine })));
const Bible = lazy(() => import('./components/Bible').then((module) => ({ default: module.Bible })));
const AICoach = lazy(() => import('./components/AICoach').then((module) => ({ default: module.AICoach })));

const TUTORIAL_SEEN_KEY = 'offwhite_tutorial_seen';
const LOCAL_TUTORIAL_SEEN_KEY = 'betterme_tutorial_seen_local';
const ENABLED_SECTIONS_KEY = 'offwhite_enabled_sections';
const DEFAULT_ENABLED_SECTIONS = SECTION_CHOICES.map((section) => section.id);

function getStoredStats() {
  return getStoredUserStats();
}

function awardPoints(points: number) {
  awardUserPoints(points);
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

function getStoredEnabledSections(): SectionTab[] {
  const saved = localStorage.getItem(ENABLED_SECTIONS_KEY);
  if (!saved) return DEFAULT_ENABLED_SECTIONS;
  try {
    const parsed = JSON.parse(saved);
    if (!ariaIsArray(parsed)) return DEFAULT_ENABLED_SECTIONS;
    let enabled = parsed.filter((section): section is SectionTab =>
      SECTION_CHOICES.some((choice) => choice.id === section)
    );
    const forceInclude: SectionTab[] = ['finance', 'shopping', 'fitness'];
    forceInclude.forEach(sec => {
        if (!enabled.includes(sec)) enabled.push(sec);
    });
    return enabled.length > 0 ? enabled : DEFAULT_ENABLED_SECTIONS;
  } catch {
    return DEFAULT_ENABLED_SECTIONS;
  }
}

function saveEnabledSections(sections: SectionTab[]) {
  const normalized = SECTION_CHOICES
    .map((section) => section.id)
    .filter((section) => sections.includes(section));
  const nextSections = normalized.length > 0 ? normalized : DEFAULT_ENABLED_SECTIONS;

  localStorage.setItem(ENABLED_SECTIONS_KEY, JSON.stringify(nextSections));
  markDashboardStateChanged();
  window.dispatchEvent(new CustomEvent('sections-update'));
  void syncDashboardStateNow();
  return nextSections;
}

function ariaIsArray(val: unknown): val is unknown[] {
  return Array.isArray(val);
}

function getHomeMetrics(): HomeMetrics {
  const meals = parseStoredArray<{ calories?: number; completed?: boolean }>('offwhite_meals');
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
  const caloriesConsumed = meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);

  return {
    caloriesConsumed,
    caloriesTarget: 2100,
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

function getStoredCheckins() {
  const saved = localStorage.getItem('offwhite_checkins');
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function hasSeenTutorial() {
  return localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true' || localStorage.getItem(LOCAL_TUTORIAL_SEEN_KEY) === 'true';
}

function calculateCheckinStreak(dates: string[], now = new Date()) {
  if (dates.length === 0) return 0;
  const dateSet = new Set(dates);
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  const todayKey = getLocalDateKey(cursor);
  if (!dateSet.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dateSet.has(getLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function FullScreenStatus({ label, detail }: { label: string; detail?: string }) {
  return (
    <div className="launch-screen fixed inset-0 flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-xl font-black uppercase tracking-widest animate-pulse">{label}</h2>
        {detail ? <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500 mt-2">{detail}</p> : null}
      </div>
    </div>
  );
}

function TabPanel({ children, panelKey }: { children: React.ReactNode; panelKey: string }) {
  return (
    <motion.div
      key={panelKey}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="w-full h-full"
    >
      <Suspense fallback={<FullScreenStatus label="Caricamento modulo" detail={`${panelKey.toUpperCase()}_STAGE`} />}>
        {children}
      </Suspense>
    </motion.div>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSyncReady, setIsSyncReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState(() => getStoredStats());
  const isDarkMode = isThemeDark(stats.activeTheme);

  const toggleDarkMode = () => {
    const nextThemeId = toggleThemeDark(stats.activeTheme);
    const nextStats = saveUserStats({ ...stats, activeTheme: nextThemeId });
    setStats({ ...nextStats });
  };

  const [profile, setProfile] = useState(() => getStoredProfile());
  const [homeMetrics, setHomeMetrics] = useState(() => getHomeMetrics());
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [checkins, setCheckins] = useState<string[]>(() => getStoredCheckins());
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [enabledSections, setEnabledSections] = useState<SectionTab[]>(() => getStoredEnabledSections());
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [levelUpCelebration, setLevelUpCelebration] = useState<{ level: number; title: string } | null>(null);

  const didHydrateLevelRef = useRef(false);
  const lastKnownLevelRef = useRef(1);
  const isFinanceFullscreen = activeTab === 'finance';
  const ADMIN_EMAIL = 'thsedici@gmail.com';
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  useEffect(() => {
    const today = getLocalDateKey();
    const lastRewardDate = localStorage.getItem('betterme_last_reward_date');
    if (lastRewardDate !== today) {
      setShowDailyReward(true);
    }
  }, []);

  const claimDailyReward = () => {
    awardPoints(25);
    localStorage.setItem('betterme_last_reward_date', getLocalDateKey());
    setShowDailyReward(false);
  };

  // Auth observer
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setIsAuthReady(true);
    });
  }, []);

  // Firebase Sync manager
  useEffect(() => {
    if (!authUser) {
      setIsSyncReady(true);
      return;
    }
    setIsSyncReady(false);
    let stopSync: (() => void) | undefined;
    let isActive = true;

    const startSync = async () => {
      stopSync = await initializeFirebaseSync(authUser);
      if (!isActive) {
        stopSync?.();
        return;
      }
      setStats(getStoredStats());
      setProfile(getStoredProfile());
      setEnabledSections(getStoredEnabledSections());
      setHomeMetrics(getHomeMetrics());
      setCheckins(getStoredCheckins());
      setShowOnboarding(!hasSeenTutorial() && getStoredCheckins().length === 0);
      setIsSyncReady(true);
    };

    void startSync();
    return () => {
      isActive = false;
      stopSync?.();
    };
  }, [authUser]);

  // Global update listeners
  useEffect(() => {
    const handleStatsUpdate = () => setStats(getStoredStats());
    const handleSectionsUpdate = () => setEnabledSections(getStoredEnabledSections());
    const handleProfileUpdate = () => setProfile(getStoredProfile());
    
    window.addEventListener('stats-update', handleStatsUpdate);
    window.addEventListener('sections-update', handleSectionsUpdate);
    window.addEventListener('profile-update', handleProfileUpdate);

    return () => {
      window.removeEventListener('stats-update', handleStatsUpdate);
      window.removeEventListener('sections-update', handleSectionsUpdate);
      window.removeEventListener('profile-update', handleProfileUpdate);
    };
  }, []);

  // Metrics update listeners
  useEffect(() => {
    const handleMetricsUpdate = () => setHomeMetrics(getHomeMetrics());
    window.addEventListener('checkin-update', handleMetricsUpdate);
    window.addEventListener('dashboard-data-update', handleMetricsUpdate);
    window.addEventListener('shopping-update', handleMetricsUpdate);
    window.addEventListener('storage', handleMetricsUpdate);
    window.addEventListener('focus', handleMetricsUpdate);

    return () => {
      window.removeEventListener('checkin-update', handleMetricsUpdate);
      window.removeEventListener('dashboard-data-update', handleMetricsUpdate);
      window.removeEventListener('shopping-update', handleMetricsUpdate);
      window.removeEventListener('storage', handleMetricsUpdate);
      window.removeEventListener('focus', handleMetricsUpdate);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLaunchScreen(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeTab !== 'dashboard' && !enabledSections.includes(activeTab as SectionTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, enabledSections]);

  // Admin and limits check
  useEffect(() => {
    if (!isSyncReady || authUser?.email !== ADMIN_EMAIL) return;
    const current = getStoredUserStats();
    if (current.points < 99999) {
      const boosted = saveUserStats({ ...current, points: 99999 });
      setStats(boosted);
    }
  }, [isSyncReady, authUser?.email]);

  const triggerRefreshHomeMetrics = () => {
    setHomeMetrics(getHomeMetrics());
  };

  const handleProfileSave = (nextProfile: UserProfile) => {
    const cleanProfile = { ...profile, ...nextProfile, name: nextProfile.name?.trim() };
    localStorage.setItem('offwhite_user_profile', JSON.stringify(cleanProfile));
    markDashboardStateChanged();
    setProfile(cleanProfile);
    window.dispatchEvent(new CustomEvent('profile-update'));
    void syncDashboardStateNow();
  };

  const handleSectionsSave = (sections: SectionTab[]) => {
    const nextSections = saveEnabledSections(sections);
    setEnabledSections(nextSections);
  };

  const handleLogout = async () => {
    await signOut(auth);
    resetFirebaseSync();
    setActiveTab('dashboard');
  };

  const handleCheckIn = () => {
    const today = getLocalDateKey();
    if (!hasCheckedInToday) {
      const updated = Array.from(new Set([...getStoredCheckins(), today])).sort();
      setCheckins(updated);
      localStorage.setItem('offwhite_checkins', JSON.stringify(updated));
      markDashboardStateChanged();
      awardPoints(10);
      window.dispatchEvent(new CustomEvent('checkin-update'));
      void syncDashboardStateNow();
    }
  };

  const completeOnboarding = (sections: SectionTab[]) => {
    const nextSections = saveEnabledSections(sections);
    setEnabledSections(nextSections);
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    localStorage.setItem(LOCAL_TUTORIAL_SEEN_KEY, 'true');
    markDashboardStateChanged();
    setShowOnboarding(false);
    void syncDashboardStateNow();
  };

  if (!isAuthReady) {
    return <FullScreenStatus label="Avvio dashboard" detail="Preparo lo spazio personale." />;
  }

  if (!authUser) {
    return <AuthScreen />;
  }

  if (!isSyncReady) {
    return <FullScreenStatus label="Sincronizzazione" detail="Carico solo i dati del tuo account." />;
  }

  const activeTheme = getThemeDefinition(stats.activeTheme);
  const displayName = profile.name?.trim() || authUser.email?.split('@')[0] || 'Utente';
  const accountLevel = getAccountLevelInfo(stats.points);
  const displayPoints = isAdmin ? '∞' : String(stats.points);
  const displayLevel = isAdmin ? 7 : accountLevel.level;
  const displayLevelTitle = isAdmin ? 'Apex' : accountLevel.title;
  const levelProgressWidth = isAdmin ? '100%' : `${accountLevel.progressPercent}%`;
  const nextLevelCopy = isAdmin
    ? '∞ credits · Livello Apex massimo'
    : accountLevel.nextLevelAt
    ? `${Math.max(0, accountLevel.nextLevelAt - stats.points)} credits al livello ${accountLevel.level + 1}`
    : 'Livello massimo attuale raggiunto';

  const hasCheckedInToday = checkins.includes(getLocalDateKey());
  const checkinStreak = calculateCheckinStreak(checkins);

  const allNavItems = [
    { id: 'dashboard', label: 'Hub', icon: LayoutDashboard },
    { id: 'ai-coach', label: 'Coach', icon: Sparkles },
    { id: 'trophies', label: 'Trofei', icon: Trophy },
    { id: 'routine', label: 'Routine', icon: Calendar },
    { id: 'diet', label: 'Dieta', icon: Utensils },
    { id: 'bible', label: 'Fede', icon: BookOpen },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell },
    { id: 'finance', label: 'Finanze', icon: Wallet },
    { id: 'shopping', label: 'Spesa', icon: ShoppingBag },
  ];

  const navItems = allNavItems.filter((item) => item.id === 'dashboard' || enabledSections.includes(item.id as SectionTab));
  const mobileNavItems = navItems;

  return (
    <DashboardContext.Provider
      value={{
        authUser,
        profile,
        setProfile,
        stats,
        setStats,
        enabledSections,
        setEnabledSections,
        activeTab,
        setActiveTab,
        homeMetrics,
        setHomeMetrics,
        checkins,
        setCheckins,
        hasCheckedInToday,
        checkinStreak,
        handleCheckIn,
        handleProfileSave,
        handleSectionsSave,
        handleLogout,
        triggerRefreshHomeMetrics,
      }}
    >
      <div 
        className={`dashboard-theme ${getThemeCssClass(stats.activeTheme)} flex min-h-svh flex-col overflow-x-hidden md:h-dvh md:min-h-dvh md:overflow-hidden`}
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
          '--sidebar-w': isSidebarOpen ? '280px' : '80px',
        } as React.CSSProperties}
      >
        {/* Scrolling caution marquee */}
        <div className="offwhite-marquee shrink-0">
          <div className="offwhite-marquee-content">
            <span className="offwhite-marquee-text">
              <span>[ SYSTEM STATUS: ACTIVE ]</span>
              <span>[ BETTER CREDITS: {displayPoints} ]</span>
              <span>[ LEVEL: {displayLevel} · {displayLevelTitle.toUpperCase()} ]</span>
              <span>[ DAILY STREAK: {checkinStreak} DAYS ]</span>
              <span>[ SYSTEM VERSION: RELEASE_V2.5 ]</span>
              <span>[ ACTIVE THEME: {activeTheme.name.toUpperCase()} ]</span>
              <span>[ USER IDENTIFICATION: {displayName.toUpperCase()} ]</span>
            </span>
            <span className="offwhite-marquee-text">
              <span>[ SYSTEM STATUS: ACTIVE ]</span>
              <span>[ BETTER CREDITS: {displayPoints} ]</span>
              <span>[ LEVEL: {displayLevel} · {displayLevelTitle.toUpperCase()} ]</span>
              <span>[ DAILY STREAK: {checkinStreak} DAYS ]</span>
              <span>[ SYSTEM VERSION: RELEASE_V2.5 ]</span>
              <span>[ ACTIVE THEME: {activeTheme.name.toUpperCase()} ]</span>
              <span>[ USER IDENTIFICATION: {displayName.toUpperCase()} ]</span>
            </span>
          </div>
        </div>
        
        {/* Inner layout row container */}
        <div className="flex flex-1 flex-col overflow-x-hidden md:h-full md:overflow-hidden md:flex-row">
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

          <AnimatePresence>
            {showOnboarding && <OnboardingTutorial onComplete={completeOnboarding} defaultEnabledSections={DEFAULT_ENABLED_SECTIONS} />}
          </AnimatePresence>

          <AnimatePresence>
            {isUserPanelOpen && (
              <UserPanel
                email={authUser.email}
                displayName={displayName}
                points={stats.points}
                accountLevelLabel={displayLevelTitle}
                accountLevelNumber={displayLevel}
                accountLevelProgress={isAdmin ? 100 : accountLevel.progressPercent}
                nextLevelCopy={nextLevelCopy}
                checkinStreak={checkinStreak}
                enabledSections={enabledSections}
                avatarId={stats.avatarId}
                activeThemeId={stats.activeTheme}
                onProfileSave={handleProfileSave}
                onSectionsSave={handleSectionsSave}
                onThemeChange={(themeId) => {
                  const nextStats = saveUserStats({ ...stats, activeTheme: themeId });
                  setStats({ ...nextStats });
                  markDashboardStateChanged();
                  void syncDashboardStateNow();
                }}
                onAvatarChange={(avatarId) => {
                  const av = PROFILE_AVATARS.find(a => a.id === avatarId);
                  if (!av) return;
                  const nextStats = saveUserStats({ ...stats, avatarId, avatarUrl: av.imageUrl });
                  setStats({ ...nextStats });
                  markDashboardStateChanged();
                  void syncDashboardStateNow();
                }}
                onClose={() => setIsUserPanelOpen(false)}
                onLogout={handleLogout}
              />
            )}
          </AnimatePresence>

          {/* DESKTOP SIDEBAR */}
          <motion.aside
            className={`sidebar-shell hidden md:flex flex-col h-full overflow-y-auto border-r-2 border-black/10 shrink-0 transition-all duration-300 relative z-30`}
            style={{ width: 'var(--sidebar-w)' }}
          >
            <div className="p-6 flex items-center justify-between border-b-2 border-black/5 shrink-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-black hover:opacity-70 dark:text-white"
                aria-label={isSidebarOpen ? 'Riduci sidebar' : 'Espandi sidebar'}
              >
                <Menu size={18} />
              </button>
              {isSidebarOpen && (
                <div className="font-mono text-[9px] uppercase tracking-widest text-offwhite-orange">
                  V2.5 PERSONAL OS
                </div>
              )}
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 font-mono text-[10px] uppercase tracking-widest transition-all rounded-xl relative overflow-hidden active-press-scale ${
                    activeTab === item.id
                      ? 'text-white'
                      : 'text-[color:var(--theme-ink)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 bg-black dark:bg-white/10 z-0"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 shrink-0">
                    <item.icon size={16} />
                  </span>
                  {isSidebarOpen && (
                    <span className="relative z-10 truncate">{item.label}</span>
                  )}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t-2 border-black/5 shrink-0">
              {isSidebarOpen ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 flex items-center justify-center overflow-hidden shrink-0">
                      {stats.avatarId ? (
                        (() => {
                          const av = PROFILE_AVATARS.find(a => a.id === stats.avatarId);
                          return av ? (
                            <img src={av.imageUrl} alt={av.name} className="h-full w-full object-cover object-top" style={{ backgroundColor: av.bgColor }} />
                          ) : <span>{displayName.slice(0, 1).toUpperCase()}</span>;
                        })()
                      ) : <span>{displayName.slice(0, 1).toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] font-black uppercase tracking-wider truncate">
                        {displayName}
                      </div>
                      <div className="font-mono text-[8px] uppercase tracking-widest text-gray-500 truncate">
                        L{displayLevel} · {displayLevelTitle}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={toggleDarkMode}
                      className="flex-1 flex justify-center items-center py-2.5 border border-black/15 hover:border-black rounded-lg transition-all text-black dark:text-white"
                      title={isDarkMode ? 'Attiva Tema Chiaro' : 'Attiva Tema Scuro'}
                    >
                      {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUserPanelOpen(true)}
                      className="flex-1 font-mono text-[8px] uppercase tracking-widest text-center border border-black/15 hover:border-black rounded-lg transition-all"
                    >
                      Profilo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUserPanelOpen(true)}
                    className="h-9 w-9 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 flex items-center justify-center overflow-hidden"
                  >
                    {stats.avatarId ? (
                      (() => {
                        const av = PROFILE_AVATARS.find(a => a.id === stats.avatarId);
                        return av ? (
                          <img src={av.imageUrl} alt={av.name} className="h-full w-full object-cover object-top" style={{ backgroundColor: av.bgColor }} />
                        ) : displayName.slice(0, 1).toUpperCase();
                      })()
                    ) : <span>{displayName.slice(0, 1).toUpperCase()}</span>}
                  </button>
                  <button type="button" onClick={toggleDarkMode} className="text-black dark:text-white">
                    {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                  </button>
                </div>
              )}
            </div>
          </motion.aside>

          {/* MOBILE HEADER */}
          <header className={`sidebar-shell md:hidden border-b-2 border-black p-4 justify-between items-center z-50 shrink-0 ${isFinanceFullscreen || activeTab === 'dashboard' ? 'hidden' : 'flex'}`}>
            <div className="dashboard-brand font-black text-xl tracking-tighter">Better Me</div>
            <div className="flex items-center gap-3">
              <div className="font-mono text-[10px] font-black text-offwhite-orange">{displayPoints} PTS</div>
              <div className="font-mono text-[10px] font-black uppercase tracking-widest opacity-50">L{displayLevel}</div>
              <button type="button" onClick={toggleDarkMode} className="text-black dark:text-white" aria-label="Cambia tema chiaro/scuro">
                {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button type="button" onClick={handleLogout} className="text-black dark:text-white" aria-label="Esci">
                <LogOut size={17} />
              </button>
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-50">
                {navItems.find(n => n.id === activeTab)?.label}
              </div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className={`main-shell relative flex-1 min-h-0 overflow-y-auto md:p-8 md:pb-8 ${isFinanceFullscreen ? 'p-0 pb-0' : activeTab === 'dashboard' ? 'home-main-surface p-0 pb-24 md:p-0 md:pb-0' : 'p-4 pb-24'}`}>
            <div className="absolute top-0 right-0 p-4 flex items-center gap-4 pointer-events-none select-none hidden sm:flex">
              <div className="font-mono text-[10px] font-black text-offwhite-orange">{displayPoints} BETTER-CREDITS</div>
              <div className="font-mono text-[10px] font-black uppercase tracking-widest text-black/45">LIVELLO {displayLevel}</div>
              <div className="font-mono text-[8px] md:text-[10px] text-gray-300">
                "IL_PROGRESSO_E_UN_PERCORSO" // V1.0
              </div>
            </div>
            
            <div className={activeTab === 'finance' ? "w-full h-full" : "mx-auto w-full max-w-7xl min-w-0 overflow-x-clip"}>
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                  <TabPanel panelKey="dashboard">
                    <DashboardView onOpenUserPanel={() => setIsUserPanelOpen(true)} />
                  </TabPanel>
                )}

                {activeTab === 'routine' && enabledSections.includes('routine') && (
                  <TabPanel panelKey="routine">
                    <DailyRoutine />
                  </TabPanel>
                )}

                {activeTab === 'diet' && enabledSections.includes('diet') && (
                  <TabPanel panelKey="diet">
                    <Diet ownerEmail={authUser?.email ?? null} />
                  </TabPanel>
                )}

                {activeTab === 'trophies' && enabledSections.includes('trophies') && (
                  <TabPanel panelKey="trophies">
                    <Trophies />
                  </TabPanel>
                )}

                {activeTab === 'bible' && enabledSections.includes('bible') && (
                  <TabPanel panelKey="bible">
                    <Bible />
                  </TabPanel>
                )}

                {activeTab === 'ai-coach' && enabledSections.includes('ai-coach') && (
                  <TabPanel panelKey="ai-coach">
                    <AICoach />
                  </TabPanel>
                )}

                {activeTab === 'finance' && (
                  <TabPanel panelKey="finance">
                    <Finance />
                  </TabPanel>
                )}

                {activeTab === 'shopping' && (
                  <TabPanel panelKey="shopping">
                    <Shopping />
                  </TabPanel>
                )}

                {activeTab === 'fitness' && (
                  <TabPanel panelKey="fitness">
                    <Fitness ownerEmail={authUser?.email ?? null} />
                  </TabPanel>
                )}
              </AnimatePresence>
            </div>
          </main>

          {/* MOBILE BOTTOM NAVIGATION */}
          <nav className="mobile-nav-shell mobile-safe-area md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 py-2">
            <div className="mobile-nav-scroll mobile-nav-orbit flex items-center gap-1.5 overflow-x-auto">
              {mobileNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`mobile-nav-orbit-item relative flex min-w-[76px] flex-none flex-col items-center justify-center gap-1.5 px-2 py-3 transition-all active-press-scale ${
                    activeTab === item.id
                      ? 'is-active text-white'
                      : 'text-[color:var(--theme-ink)]/78'
                  }`}
                >
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="mobile-nav-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
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

          <AnimatePresence>
            {showDailyReward && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  style={{
                    backgroundColor: 'var(--theme-panel)',
                    borderColor: 'var(--theme-accent)',
                    color: 'var(--theme-ink)',
                  }}
                  className="border-2 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: `radial-gradient(circle at center, var(--theme-accent), transparent 70%)` }} />
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: `color-mix(in srgb, var(--theme-accent) 15%, transparent)`, border: `1.5px solid color-mix(in srgb, var(--theme-accent) 25%, transparent)` }}>
                      <Sparkles size={32} style={{ color: 'var(--theme-accent)' }} />
                    </div>
                    <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--theme-ink)' }}>Bentornato!</h2>
                    <p className="text-sm font-medium mb-6" style={{ color: `color-mix(in srgb, var(--theme-ink) 65%, transparent)` }}>
                      La costanza è la chiave del successo. Ecco <strong style={{ color: 'var(--theme-accent)' }}>+25 XP</strong> gratuiti per aver aperto l'app oggi!
                    </p>
                    <button
                      onClick={claimDailyReward}
                      className="w-full rounded-2xl px-6 py-4 font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                      style={{ background: `linear-gradient(135deg, var(--theme-accent), color-mix(in srgb, var(--theme-accent) 70%, #000))` }}
                    >
                      Riscatta +25 XP
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* GLOBAL LEVEL UP CELEBRATION OVERLAY */}
          <AnimatePresence>
            {levelUpCelebration && (
              <motion.div
                className="level-up-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="level-up-burst"
                  initial={{ scale: 0.68, opacity: 0, rotate: -6 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 1.08, opacity: 0 }}
                  transition={{ duration: 0.42, ease: 'easeOut' }}
                >
                  <div className="level-up-ring level-up-ring-outer" />
                  <div className="level-up-ring level-up-ring-inner" />
                  <div className="level-up-stars" aria-hidden="true">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <span key={index} style={{ '--level-star-index': index } as React.CSSProperties} />
                    ))}
                  </div>
                  <div className="level-up-copy">
                    <div className="level-up-kicker">Level Up</div>
                    <strong>LVL {levelUpCelebration.level}</strong>
                    <span>{levelUpCelebration.title}</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div> {/* <-- End inner layout row container */}
      </div>
    </DashboardContext.Provider>
  );
}
