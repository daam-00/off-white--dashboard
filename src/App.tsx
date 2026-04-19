/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, type User } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, type Timestamp, updateDoc, where } from 'firebase/firestore';
import { BookOpen, Calendar, Check, CircleHelp, Dumbbell, Flame, Heart, LayoutDashboard, LogOut, Mail, Menu, MessageCircle, PencilLine, Send, ShoppingBag, Sparkles, SwatchBook, Trophy, Utensils, UserRound, Wallet, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeCssClass, getThemeDefinition, normalizeThemeId } from './lib/themes';
import { getDailyVerse } from './data/dailyVerses';
import { auth, db } from './lib/firebase';
import { initializeFirebaseSync, markDashboardStateChanged, resetFirebaseSync, syncDashboardStateNow } from './lib/firebaseSync';
import { awardUserPoints, getAccountLevelInfo, getStoredUserStats } from './lib/account';

const Finance = lazy(() => import('./components/Finance').then((module) => ({ default: module.Finance })));
const Fitness = lazy(() => import('./components/Fitness').then((module) => ({ default: module.Fitness })));
const Diet = lazy(() => import('./components/Diet').then((module) => ({ default: module.Diet })));
const Shopping = lazy(() => import('./components/Shopping').then((module) => ({ default: module.Shopping })));
const Trophies = lazy(() => import('./components/Trophies').then((module) => ({ default: module.Trophies })));
const DailyRoutine = lazy(() => import('./components/DailyRoutine').then((module) => ({ default: module.DailyRoutine })));
const ThemeStudio = lazy(() => import('./components/ThemeStudio').then((module) => ({ default: module.ThemeStudio })));
const Bible = lazy(() => import('./components/Bible').then((module) => ({ default: module.Bible })));

type Tab = 'dashboard' | 'finance' | 'fitness' | 'diet' | 'shopping' | 'trophies' | 'routine' | 'themes' | 'bible';
type SectionTab = Exclude<Tab, 'dashboard'>;
type AuthMode = 'login' | 'register';

const TUTORIAL_SEEN_KEY = 'offwhite_tutorial_seen';
const LOCAL_TUTORIAL_SEEN_KEY = 'betterme_tutorial_seen_local';
const ENABLED_SECTIONS_KEY = 'offwhite_enabled_sections';
const VERSE_REACTIONS_KEY = 'offwhite_verse_reactions';

const SECTION_CHOICES: Array<{
  id: SectionTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: 'routine', label: 'Routine', description: 'To-do, credits e ritmo giornaliero.', icon: Calendar },
  { id: 'finance', label: 'Portafoglio', description: 'Conti, spese, entrate e abbonamenti.', icon: Wallet },
  { id: 'fitness', label: 'Allenamento', description: 'Schede e sessioni workout.', icon: Dumbbell },
  { id: 'diet', label: 'Alimentazione', description: 'Pasti, calorie e ricette.', icon: Utensils },
  { id: 'shopping', label: 'Spesa', description: 'Lista acquisti e articoli presi.', icon: ShoppingBag },
  { id: 'trophies', label: 'Obiettivi', description: 'Missioni settimanali e premi.', icon: Trophy },
  { id: 'themes', label: 'Temi', description: 'Personalizzazione visuale.', icon: SwatchBook },
  { id: 'bible', label: 'Bibbia', description: 'Versetto, lettura e riflessioni personali.', icon: BookOpen },
];

const DEFAULT_ENABLED_SECTIONS = SECTION_CHOICES.map((section) => section.id);

type UserProfile = {
  name?: string;
};

type HomeMetrics = {
  caloriesConsumed: number;
  caloriesTarget: number;
  mealsCompleted: number;
  mealsTarget: number;
  monthlySpent: number;
  monthlyBudget: number;
  shoppingPending: number;
  shoppingTotal: number;
  workoutsCompleted: number;
  workoutsTarget: number;
};

type VerseComment = {
  id: string;
  text: string;
  createdAt: string;
  authorName?: string;
  userId?: string;
};

type VerseReaction = {
  liked: boolean;
  likes: number;
};

type VerseReactionMap = Record<string, VerseReaction>;

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
    if (!Array.isArray(parsed)) return DEFAULT_ENABLED_SECTIONS;
    const enabled = parsed.filter((section): section is SectionTab =>
      SECTION_CHOICES.some((choice) => choice.id === section),
    );
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

function getStoredVerseReactions(): VerseReactionMap {
  return {};
}

function getEmptyVerseReaction(): VerseReaction {
  return {
    liked: false,
    likes: 0,
  };
}

function buildVerseReactionId(reference: string, dateKey: string) {
  return `${dateKey}:${reference}`;
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

function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

function FullScreenStatus({ label, detail }: { label: string; detail?: string }) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <img src="/better-me-logo.png" alt="better me" className="auth-logo" />
        <div className="auth-kicker">{label}</div>
        {detail ? <div className="auth-copy">{detail}</div> : null}
      </div>
    </div>
  );
}

function getAuthErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';

  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
    return 'Email o password non corretti.';
  }
  if (code.includes('auth/email-already-in-use')) {
    return 'Esiste gia un account con questa email.';
  }
  if (code.includes('auth/weak-password')) {
    return 'Usa una password di almeno 6 caratteri.';
  }
  if (code.includes('auth/invalid-email')) {
    return 'Inserisci una email valida.';
  }

  return 'Accesso non riuscito. Riprova tra poco.';
}

function AuthScreen() {
  const authTheme = getThemeDefinition('theme-offwhite');
  const [mode, setMode] = useState<AuthMode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="auth-shell"
      style={{
        '--theme-accent': authTheme.accent,
        '--theme-accent-soft': authTheme.accentSoft,
        '--theme-bg': authTheme.background,
        '--theme-panel': authTheme.panel,
        '--theme-panel-muted': authTheme.panelMuted,
        '--theme-ink': authTheme.ink,
        '--theme-ink-contrast': authTheme.inkContrast,
        '--theme-border': authTheme.border,
      } as React.CSSProperties}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-panel"
      >
        <div className="auth-brand-row">
          <img src="/better-me-logo.png" alt="better me" className="auth-logo" />
          <div>
            <div className="auth-kicker">BETTER_ME_OS</div>
            <h1 className="auth-title">{isRegister ? 'Crea il tuo spazio' : 'Accedi alla dashboard'}</h1>
          </div>
        </div>

        <p className="auth-copy">
          Registrati per usare la dashboard, partire da uno spazio pulito e far crescere il tuo livello account con i tuoi progressi.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Email</span>
            <div className="auth-input-shell">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@email.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-shell">
              <UserRound size={16} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimo 6 caratteri"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </div>
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Attendi...' : isRegister ? 'Registrati' : 'Entra'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(isRegister ? 'login' : 'register');
            setError('');
          }}
          className="auth-mode-button"
        >
          {isRegister ? 'Hai gia un account? Accedi' : 'Nuovo utente? Crea account'}
        </button>
      </motion.div>
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

function UserPanel({
  email,
  displayName,
  points,
  accountLevelLabel,
  accountLevelNumber,
  accountLevelProgress,
  nextLevelCopy,
  checkinStreak,
  enabledSections,
  onProfileSave,
  onSectionsSave,
  onClose,
  onLogout,
}: {
  email?: string | null;
  displayName: string;
  points: number;
  accountLevelLabel: string;
  accountLevelNumber: number;
  accountLevelProgress: number;
  nextLevelCopy: string;
  checkinStreak: number;
  enabledSections: SectionTab[];
  onProfileSave: (profile: UserProfile) => void;
  onSectionsSave: (sections: SectionTab[]) => void;
  onClose: () => void;
  onLogout: () => void;
}) {
  const [nameInput, setNameInput] = useState(displayName);
  const [sectionDraft, setSectionDraft] = useState<SectionTab[]>(enabledSections);
  const [isNameSaved, setIsNameSaved] = useState(false);
  const [areSectionsSaved, setAreSectionsSaved] = useState(false);

  React.useEffect(() => {
    setNameInput(displayName);
  }, [displayName]);

  React.useEffect(() => {
    setSectionDraft(enabledSections);
  }, [enabledSections]);

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = nameInput.trim();
    if (!nextName) return;

    onProfileSave({ name: nextName });
    setIsNameSaved(true);
    window.setTimeout(() => setIsNameSaved(false), 1400);
  };

  const toggleSection = (section: SectionTab) => {
    setSectionDraft((current) => {
      if (current.includes(section)) {
        return current.length > 1 ? current.filter((item) => item !== section) : current;
      }

      return [...current, section];
    });
  };

  const selectOnlySection = (section: SectionTab) => {
    setSectionDraft([section]);
  };

  const handleSectionsSubmit = () => {
    onSectionsSave([...sectionDraft]);
    setAreSectionsSaved(true);
    window.setTimeout(() => setAreSectionsSaved(false), 1400);
  };

  return (
    <motion.div
      className="user-panel-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        className="user-panel"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="user-panel-head">
          <div className="user-avatar-large">{displayName.slice(0, 1).toUpperCase()}</div>
          <div>
            <div className="offwhite-label">AREA_UTENTE</div>
            <h2>{displayName}</h2>
            <p>{email}</p>
          </div>
          <button type="button" onClick={onClose} className="user-panel-close" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleProfileSubmit} className="user-profile-form">
          <label>
            <span>Nome visualizzato</span>
            <div>
              <PencilLine size={16} />
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Il tuo nome"
                maxLength={32}
              />
            </div>
          </label>
          <button type="submit" disabled={!nameInput.trim()}>
            {isNameSaved ? <Check size={16} /> : <PencilLine size={16} />}
            {isNameSaved ? 'Salvato' : 'Aggiorna'}
          </button>
        </form>

        <div className="user-panel-stats">
          <div>
            <span>{points}</span>
            <p>Better Credits</p>
          </div>
          <div>
            <span>L{accountLevelNumber}</span>
            <p>{accountLevelLabel}</p>
          </div>
          <div>
            <span>{checkinStreak}</span>
            <p>Giorni di serie</p>
          </div>
        </div>

        <section className="offwhite-border bg-white p-4">
          <div className="user-tutorial-title">
            <Sparkles size={18} />
            <span>Livello account</span>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-gray-500">
            {nextLevelCopy}
          </p>
          <div className="mt-3 h-2 overflow-hidden border-2 border-black bg-gray-100">
            <div className="h-full bg-black transition-all" style={{ width: `${accountLevelProgress}%` }} />
          </div>
        </section>

        <section className="user-sections-editor">
          <div className="user-tutorial-title">
            <LayoutDashboard size={18} />
            <span>Sezioni attive</span>
          </div>
          <div className="section-choice-grid is-compact">
            {SECTION_CHOICES.map((section) => {
              const Icon = section.icon;
              const active = sectionDraft.includes(section.id);

              return (
                <div key={section.id} className={`section-choice-card ${active ? 'is-selected' : ''}`}>
                  <button type="button" onClick={() => toggleSection(section.id)} className="section-choice-main">
                    <Icon size={18} />
                    <span>{section.label}</span>
                    <small>{active ? 'Attiva' : 'Nascosta'}</small>
                  </button>
                  <button type="button" onClick={() => selectOnlySection(section.id)} className="section-only-action">
                    Solo questa
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={handleSectionsSubmit} className="section-save-button">
            {areSectionsSaved ? <Check size={16} /> : <LayoutDashboard size={16} />}
            {areSectionsSaved ? 'Sezioni salvate' : 'Salva sezioni'}
          </button>
        </section>

        <div className="user-tutorial">
          <div className="user-tutorial-title">
            <CircleHelp size={18} />
            <span>Come funziona Better Me</span>
          </div>
          <ol>
            <li>Fai check-in una volta al giorno: aumenta la serie e ricevi +10 credits.</li>
            <li>Crea i tuoi to-do giornalieri nella Routine. Ogni to-do completato vale +25 credits.</li>
            <li>Completa tutti i to-do del giorno per ricevere un bonus +50 credits.</li>
            <li>Usa i credits per sbloccare nuovi temi e salire di livello account.</li>
            <li>Dieta, spesa, finanze, routine e preferenze vengono salvate nel tuo account.</li>
          </ol>
        </div>

        <button type="button" onClick={onLogout} className="user-panel-logout">
          <LogOut size={16} />
          Esci
        </button>
      </motion.section>
    </motion.div>
  );
}

function OnboardingTutorial({ onComplete }: { onComplete: (sections: SectionTab[]) => void }) {
  const [selectedSections, setSelectedSections] = useState<SectionTab[]>(DEFAULT_ENABLED_SECTIONS);

  const toggleSection = (section: SectionTab) => {
    setSelectedSections((current) => {
      if (current.includes(section)) {
        return current.length > 1 ? current.filter((item) => item !== section) : current;
      }

      return [...current, section];
    });
  };

  return (
    <motion.div className="user-panel-backdrop onboarding-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        className="onboarding-panel"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
      >
        <div className="onboarding-icon">
          <Sparkles size={28} />
        </div>
        <div className="offwhite-label">PRIMO_ACCESSO</div>
        <h2>Costruisci la tua dashboard</h2>
        <p>
          Better Me parte pulita: nessun dato pre-caricato, solo il tuo account, i tuoi obiettivi e la tua progressione.
        </p>
        <div className="onboarding-steps">
          <div><strong>1</strong><span>Check-in giornaliero per mantenere la serie.</span></div>
          <div><strong>2</strong><span>To-do personali: +25 credits ciascuno.</span></div>
          <div><strong>3</strong><span>Bonus +50 quando completi tutta la routine.</span></div>
          <div><strong>4</strong><span>I Better Credits fanno salire anche il livello account.</span></div>
        </div>

        <div className="section-picker">
          <div className="user-tutorial-title">
            <LayoutDashboard size={18} />
            <span>Scegli le sezioni</span>
          </div>
          <div className="section-choice-grid">
            {SECTION_CHOICES.map((section) => {
              const Icon = section.icon;
              const active = selectedSections.includes(section.id);

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`section-choice-card ${active ? 'is-selected' : ''}`}
                >
                  <Icon size={18} />
                  <span>{section.label}</span>
                  <small>{section.description}</small>
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={() => onComplete(selectedSections)} className="auth-submit onboarding-submit">
          Inizia
        </button>
      </motion.section>
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
  const [profile, setProfile] = useState(() => getStoredProfile());
  const [homeMetrics, setHomeMetrics] = useState(() => getHomeMetrics());
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [checkins, setCheckins] = useState<string[]>(() => getStoredCheckins());
  const [showCheckinBurst, setShowCheckinBurst] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [enabledSections, setEnabledSections] = useState<SectionTab[]>(() => getStoredEnabledSections());
  const [verseReactions, setVerseReactions] = useState<VerseReactionMap>(() => getStoredVerseReactions());
  const [verseCommentDraft, setVerseCommentDraft] = useState('');
  const [sharedVerseComments, setSharedVerseComments] = useState<VerseComment[]>([]);
  const [verseCommentError, setVerseCommentError] = useState('');
  const [showVerseChat, setShowVerseChat] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [levelUpCelebration, setLevelUpCelebration] = useState<{ level: number; title: string } | null>(null);
  const [streakCelebration, setStreakCelebration] = useState<number | null>(null);
  const didHydrateLevelRef = React.useRef(false);
  const lastKnownLevelRef = React.useRef(1);
  const isFinanceFullscreen = activeTab === 'finance';
  const dailyVerse = getDailyVerse(now);
  const today = getLocalDateKey();
  const dailyVerseReactionId = buildVerseReactionId(dailyVerse.reference, today);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setIsAuthReady(true);
      setIsSyncReady(false);

      if (!user) {
        resetFirebaseSync();
      }
    });

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (!authUser) return;

    let isActive = true;
    let stopSync: (() => void) | undefined;

    const startSync = async () => {
      stopSync = await initializeFirebaseSync(authUser);
      if (!isActive) {
        stopSync?.();
        return;
      }

      const syncedStats = getStoredStats();
      setStats(syncedStats);
      setProfile(getStoredProfile());
      setEnabledSections(getStoredEnabledSections());
      setVerseReactions(getStoredVerseReactions());
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

  React.useEffect(() => {
    const handleStatsUpdate = () => {
      setStats(getStoredStats());
    };
    window.addEventListener('stats-update', handleStatsUpdate);
    return () => window.removeEventListener('stats-update', handleStatsUpdate);
  }, []);

  React.useEffect(() => {
    const handleSectionsUpdate = () => {
      setEnabledSections(getStoredEnabledSections());
    };

    window.addEventListener('sections-update', handleSectionsUpdate);
    return () => window.removeEventListener('sections-update', handleSectionsUpdate);
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

  React.useEffect(() => {
    if (!authUser) {
      setSharedVerseComments([]);
      return;
    }

    const commentsQuery = query(
      collection(db, 'dailyVerseComments', dailyVerseReactionId, 'comments'),
      orderBy('createdAt', 'desc'),
    );
    const likesQuery = query(collection(db, 'dailyVerseLikes'), where('verseId', '==', dailyVerseReactionId));

    const unsubscribeComments = onSnapshot(
      commentsQuery,
      (snapshot) => {
        setSharedVerseComments(
          snapshot.docs.map((commentDoc) => {
            const data = commentDoc.data() as {
              text?: string;
              authorName?: string;
              userId?: string;
              createdAt?: Timestamp;
            };

            return {
              id: commentDoc.id,
              text: data.text ?? '',
              authorName: data.authorName ?? 'Utente',
              userId: data.userId,
              createdAt: data.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
            };
          }),
        );
        setVerseCommentError('');
      },
      () => {
        setVerseCommentError('Commenti condivisi non disponibili al momento.');
      },
    );
    const unsubscribeLikes = onSnapshot(
      likesQuery,
      (snapshot) => {
        setVerseReactions((current) => ({
          ...current,
          [dailyVerseReactionId]: {
            liked: snapshot.docs.some((likeDoc) => (likeDoc.data() as { userId?: string }).userId === authUser.uid),
            likes: snapshot.size,
          },
        }));
      },
      () => {
        setVerseCommentError('Like condivisi non disponibili al momento.');
      },
    );

    return () => {
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [authUser, dailyVerseReactionId]);

  React.useEffect(() => {
    if (activeTab !== 'dashboard' && !enabledSections.includes(activeTab as SectionTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, enabledSections]);

  React.useEffect(() => {
    if (!isSyncReady) return;

    const currentLevel = getAccountLevelInfo(stats.points).level;

    if (!didHydrateLevelRef.current) {
      didHydrateLevelRef.current = true;
      lastKnownLevelRef.current = currentLevel;
      return;
    }

    if (currentLevel > lastKnownLevelRef.current) {
      setLevelUpCelebration({
        level: currentLevel,
        title: getAccountLevelInfo(stats.points).title,
      });
      window.setTimeout(() => setLevelUpCelebration(null), 3200);
    }

    lastKnownLevelRef.current = currentLevel;
  }, [isSyncReady, stats.points]);

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
  const levelProgressWidth = `${accountLevel.progressPercent}%`;
  const nextLevelCopy = accountLevel.nextLevelAt
    ? `${Math.max(0, accountLevel.nextLevelAt - stats.points)} credits al livello ${accountLevel.level + 1}`
    : 'Livello massimo attuale raggiunto';

  const allNavItems = [
    { id: 'dashboard', label: 'HOME', icon: LayoutDashboard },
    { id: 'routine', label: 'ROUTINE GIORNALIERA', icon: Calendar },
    { id: 'finance', label: 'PORTAFOGLIO', icon: Wallet },
    { id: 'fitness', label: 'ALLENAMENTO', icon: Dumbbell },
    { id: 'diet', label: 'ALIMENTAZIONE', icon: Utensils },
    { id: 'shopping', label: 'SPESA', icon: ShoppingBag },
    { id: 'trophies', label: 'OBIETTIVI', icon: Trophy },
    { id: 'themes', label: 'TEMI', icon: SwatchBook },
    { id: 'bible', label: 'BIBBIA', icon: BookOpen },
  ];

  const navItems = allNavItems.filter((item) => item.id === 'dashboard' || enabledSections.includes(item.id as SectionTab));
  const mobileNavItems = navItems;

  const hasCheckedInToday = checkins.includes(today);
  const checkinStreak = calculateCheckinStreak(checkins);
  const dailyVerseReaction = verseReactions[dailyVerseReactionId] ?? getEmptyVerseReaction();
  const visibleVerseComments = sharedVerseComments;

  const toggleDailyVerseLike = () => {
    const likeDoc = doc(db, 'dailyVerseLikes', `${dailyVerseReactionId}__${authUser.uid}`);
    if (dailyVerseReaction.liked) {
      void deleteDoc(likeDoc);
      return;
    }

    void setDoc(likeDoc, {
      verseId: dailyVerseReactionId,
      userId: authUser.uid,
      createdAt: serverTimestamp(),
    });
  };

  const addDailyVerseComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = verseCommentDraft.trim();
    if (!text) return;

    setVerseCommentDraft('');
    setVerseCommentError('');

    try {
      await addDoc(collection(db, 'dailyVerseComments', dailyVerseReactionId, 'comments'), {
        text,
        authorName: displayName,
        userId: authUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch {
      setVerseCommentDraft(text);
      setVerseCommentError('Non riesco a pubblicare il commento condiviso adesso.');
    }
  };

  const deleteVerseComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'dailyVerseComments', dailyVerseReactionId, 'comments', commentId));
    } catch {
      // silently ignore
    }
  };

  const saveEditComment = async (commentId: string) => {
    const text = editingCommentText.trim();
    if (!text) return;
    try {
      await updateDoc(doc(db, 'dailyVerseComments', dailyVerseReactionId, 'comments', commentId), { text });
    } catch {
      // silently ignore
    }
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleLogout = async () => {
    await signOut(auth);
    resetFirebaseSync();
    setActiveTab('dashboard');
  };

  const handleCheckIn = () => {
    if (!hasCheckedInToday) {
      const updated = Array.from(new Set([...getStoredCheckins(), today])).sort();
      const nextStreak = calculateCheckinStreak(updated);
      setCheckins(updated);
      localStorage.setItem('offwhite_checkins', JSON.stringify(updated));
      markDashboardStateChanged();
      awardPoints(10);
      setShowCheckinBurst(true);
      window.setTimeout(() => setShowCheckinBurst(false), 1800);
      if (nextStreak >= 5 && nextStreak % 5 === 0) {
        setStreakCelebration(nextStreak);
        window.setTimeout(() => setStreakCelebration(null), 3000);
      }
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

  const handleProfileSave = (nextProfile: UserProfile) => {
    const cleanProfile = {
      ...profile,
      ...nextProfile,
      name: nextProfile.name?.trim(),
    };

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

  const caloriesPercent = Math.min(100, Math.round((homeMetrics.caloriesConsumed / homeMetrics.caloriesTarget) * 100) || 0);
  const workoutPercent = Math.min(100, Math.round((homeMetrics.workoutsCompleted / homeMetrics.workoutsTarget) * 100) || 0);

  return (
    <div 
      className={`dashboard-theme ${getThemeCssClass(stats.activeTheme)} flex min-h-svh flex-col overflow-x-hidden md:h-dvh md:min-h-dvh md:overflow-hidden md:flex-row`}
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

      <AnimatePresence>
        {showOnboarding && <OnboardingTutorial onComplete={completeOnboarding} />}
      </AnimatePresence>

      <AnimatePresence>
        {isUserPanelOpen && (
          <UserPanel
            email={authUser.email}
            displayName={displayName}
            points={stats.points}
            accountLevelLabel={accountLevel.title}
            accountLevelNumber={accountLevel.level}
            accountLevelProgress={accountLevel.progressPercent}
            nextLevelCopy={nextLevelCopy}
            checkinStreak={checkinStreak}
            enabledSections={enabledSections}
            onProfileSave={handleProfileSave}
            onSectionsSave={handleSectionsSave}
            onClose={() => setIsUserPanelOpen(false)}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {streakCelebration && (
          <motion.div
            className="streak-up-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="streak-up-burst"
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.06, opacity: 0 }}
              transition={{ duration: 0.38, ease: 'easeOut' }}
            >
              <div className="streak-up-flames" aria-hidden="true">
                {Array.from({ length: 8 }).map((_, index) => (
                  <span key={index}>
                    <Flame size={28} fill="currentColor" />
                  </span>
                ))}
              </div>
              <div className="streak-up-copy">
                <div className="streak-up-kicker">Daily Streak</div>
                <strong>{streakCelebration}</strong>
                <span>giorni di fuoco</span>
              </div>
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
          <div className={`mb-4 ${isSidebarOpen ? 'block' : 'hidden'}`}>
            <div className="font-mono text-[8px] uppercase tracking-widest text-gray-400">Account</div>
            <div className="truncate font-mono text-[10px] font-black uppercase tracking-widest">
              {authUser.email}
            </div>
            <div className="mt-2 font-mono text-[9px] uppercase tracking-widest text-offwhite-orange">
              Livello {accountLevel.level} · {accountLevel.title}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mb-5 flex w-full items-center gap-3 border-2 border-black bg-white p-3 font-mono text-[10px] font-black uppercase tracking-widest transition-all hover:bg-black hover:text-white"
            aria-label="Esci"
          >
            <LogOut size={16} />
            {isSidebarOpen ? <span>Esci</span> : null}
          </button>
          <div className="font-mono text-[8px] text-gray-400 uppercase leading-tight">
            © 2026 BETTER_ME_OS<br />
            PERSONAL_SYSTEM
          </div>
        </div>
      </motion.aside>

      {/* MOBILE HEADER */}
      <header className={`sidebar-shell md:hidden border-b-2 border-black p-4 justify-between items-center z-50 shrink-0 ${isFinanceFullscreen || activeTab === 'dashboard' ? 'hidden' : 'flex'}`}>
        <div className="dashboard-brand font-black text-xl tracking-tighter">BETTER ME</div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] font-black text-offwhite-orange">{stats.points} PTS</div>
          <div className="font-mono text-[10px] font-black uppercase tracking-widest opacity-50">L{accountLevel.level}</div>
          <button type="button" onClick={handleLogout} className="text-black" aria-label="Esci">
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
          <div className="font-mono text-[10px] font-black text-offwhite-orange">{stats.points} BETTER-CREDITS</div>
          <div className="font-mono text-[10px] font-black uppercase tracking-widest text-black/45">LIVELLO {accountLevel.level}</div>
          <div className="font-mono text-[8px] md:text-[10px] text-gray-300">
            "IL_PROGRESSO_E_UN_PERCORSO" // V1.0
          </div>
        </div>
        
        <div className="mx-auto w-full max-w-7xl min-w-0 overflow-x-clip">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="home-app-stage"
              >
                <section className="home-app-shell">
                  <div className="home-top-rail">
                    <div className="home-level-hud">
                      <div className="home-level-circle">
                        <strong>{accountLevel.level}</strong>
                      </div>
                    </div>

                    <div className="home-identity-stack">
                      <div className="home-app-logo">
                        <span className="home-app-logo-mark">
                          <img src="/better-me-logo.png" alt="better me" />
                        </span>
                      </div>
                      <div className="home-level-track" aria-label={`Progresso livello ${accountLevel.level}`}>
                        <div className="home-level-fill" style={{ width: levelProgressWidth }} />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsUserPanelOpen(true)}
                      className="home-user-button"
                      aria-label="Apri area utente"
                    >
                      <span>{displayName.slice(0, 1).toUpperCase()}</span>
                    </button>
                  </div>

                  <div className="home-app-glow home-app-glow-mint" />
                  <div className="home-app-glow home-app-glow-blue" />

                  <div className="invincible-home-pack" aria-hidden="true">
                    <div className="invincible-logo-strip">
                      <img src="/themes/invincible/invincible-comic-logo.png" alt="" />
                      <span>weekly hero system</span>
                    </div>
                    <div className="invincible-comic-stage">
                      <div className="invincible-character-card invincible-character-card-main">
                        <span className="invincible-character-mask" />
                        <strong>INVINCIBLE</strong>
                      </div>
                      <div className="invincible-character-card invincible-character-card-side">
                        <span className="invincible-character-mask" />
                        <strong>OMNI-MAN</strong>
                      </div>
                      <div className="invincible-character-card invincible-character-card-third">
                        <strong>ATOM EVE</strong>
                      </div>
                      <span className="invincible-action-word">WHAM!</span>
                      <span className="invincible-speed-line invincible-speed-line-one" />
                      <span className="invincible-speed-line invincible-speed-line-two" />
                      <span className="invincible-speed-line invincible-speed-line-three" />
                    </div>
                  </div>

                  <div className="home-check-zone">
                    <div className="home-check-card-label">
                      <span>Daily rhythm</span>
                      <strong>{hasCheckedInToday ? 'completato' : checkinStreak >= 5 ? `serie ${checkinStreak}` : 'da fare'}</strong>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      animate={showCheckinBurst ? { y: [0, -6, 0], scale: [1, 1.02, 1] } : { y: 0, scale: 1 }}
                      transition={{ duration: 0.65, ease: 'easeOut' }}
                      onClick={handleCheckIn}
                      disabled={hasCheckedInToday}
                      className={`home-check-button ${hasCheckedInToday ? 'is-complete' : ''} ${showCheckinBurst ? 'is-celebrating' : ''}`}
                    >
                      <span className="home-check-flame" aria-hidden="true">
                        <Flame size={24} fill="currentColor" />
                      </span>
                      <span className="home-check-copy">
                        <span>{hasCheckedInToday ? 'Check-in fatto' : 'Fai check-in'}</span>
                        <span className="home-check-reward">
                          {hasCheckedInToday
                            ? 'torna domani per continuare'
                            : checkinStreak > 0 && (checkinStreak + 1) % 5 === 0
                              ? `domani chiudi serie ${checkinStreak + 1}`
                              : '+10 credits oggi'}
                        </span>
                      </span>
                      <span className="home-streak-badge" aria-label={`${checkinStreak} giorni di serie`}>
                        <small>serie</small>
                        <strong>{checkinStreak}</strong>
                      </span>
                    </motion.button>

                    <AnimatePresence>
                      {showCheckinBurst && (
                        <motion.div
                          className="home-check-burst"
                          initial={{ opacity: 0, scale: 0.78 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.08 }}
                          transition={{ duration: 0.32 }}
                          aria-hidden="true"
                        >
                          {Array.from({ length: 10 }).map((_, index) => (
                            <span key={index} style={{ '--burst-index': index } as React.CSSProperties} />
                          ))}
                          <strong>+1</strong>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>

                  <article className="home-verse-card home-verse-card-enhanced">
                    <div className="home-verse-main">
                      <div className="home-verse-icon">
                        <BookOpen size={20} strokeWidth={2.1} />
                      </div>
                      <div>
                        <p className="home-card-kicker">Verse of the day</p>
                        <blockquote>{dailyVerse.text}</blockquote>
                        <cite>{dailyVerse.reference} · NR2006</cite>
                      </div>
                    </div>

                    <div className="home-verse-actions" aria-label="Azioni versetto giornaliero">
                      <button
                        type="button"
                        onClick={toggleDailyVerseLike}
                        className={`home-verse-action ${dailyVerseReaction.liked ? 'is-liked' : ''}`}
                      >
                        <Heart size={16} fill={dailyVerseReaction.liked ? 'currentColor' : 'none'} />
                        <span>{dailyVerseReaction.likes}</span>
                      </button>
                      <button type="button" className="home-verse-action" onClick={() => setShowVerseChat(true)}>
                        <MessageCircle size={16} />
                        <span>{visibleVerseComments.length}</span>
                      </button>
                      {enabledSections.includes('bible') ? (
                        <button type="button" onClick={() => setActiveTab('bible')} className="home-verse-read-button">
                          Leggi Bibbia
                        </button>
                      ) : null}
                    </div>

                    <form onSubmit={addDailyVerseComment} className="home-verse-comment-form">
                      <input
                        value={verseCommentDraft}
                        onChange={(event) => setVerseCommentDraft(event.target.value)}
                        placeholder="Aggiungi una riflessione"
                        maxLength={180}
                      />
                      <button type="submit" disabled={!verseCommentDraft.trim()} aria-label="Salva commento">
                        <Send size={15} />
                      </button>
                    </form>

                    {verseCommentError ? <p className="home-verse-comment-error">{verseCommentError}</p> : null}
                  </article>

                  <div className="home-metric-grid">
                    {enabledSections.includes('diet') && (
                      <button onClick={() => setActiveTab('diet')} className="home-metric-card home-metric-diet">
                        <div className="home-card-title">Diet</div>
                        <div className="home-donut" style={{ '--progress': `${caloriesPercent}%` } as React.CSSProperties}>
                          <span>{caloriesPercent}%</span>
                          <Utensils size={16} strokeWidth={2.2} />
                        </div>
                        <p>Calories:</p>
                        <strong>{homeMetrics.caloriesConsumed}/{homeMetrics.caloriesTarget} kcal</strong>
                      </button>
                    )}

                    {enabledSections.includes('finance') && (
                      <button onClick={() => setActiveTab('finance')} className="home-metric-card home-metric-expenses">
                        <div className="home-card-title">Expenses</div>
                        <svg viewBox="0 0 180 92" className="home-sparkline" aria-hidden="true">
                          <path d="M18 62 L58 38 L94 50 L132 24 L162 10" />
                          <circle cx="18" cy="62" r="6" />
                          <circle cx="58" cy="38" r="6" />
                          <circle cx="94" cy="50" r="6" />
                          <circle cx="132" cy="24" r="6" />
                          <circle cx="162" cy="10" r="6" />
                          <path className="home-down-arrow" d="M150 60 v28 m-12-12 12 12 12-12" />
                        </svg>
                        <p>Spent:</p>
                        <strong>{formatCurrencyCompact(homeMetrics.monthlySpent)}/{formatCurrencyCompact(homeMetrics.monthlyBudget)}</strong>
                      </button>
                    )}

                    {enabledSections.includes('shopping') && (
                      <button onClick={() => setActiveTab('shopping')} className="home-wide-card home-shopping-card">
                        <div>
                          <div className="home-card-title">Shopping</div>
                          <p>Pending items</p>
                          <strong>{homeMetrics.shoppingPending}/{homeMetrics.shoppingTotal || 0}</strong>
                        </div>
                        <div className="home-ripple">
                          <span />
                          <span />
                          <span />
                        </div>
                      </button>
                    )}

                    {enabledSections.includes('fitness') && (
                      <button onClick={() => setActiveTab('fitness')} className="home-metric-card home-workout-card">
                        <div className="home-card-title">Workouts</div>
                        <div className="home-workout-visual">
                          <Dumbbell size={42} strokeWidth={2.1} />
                          <span style={{ height: `${Math.max(24, workoutPercent * 0.45)}px` }} />
                          <span style={{ height: `${Math.max(34, workoutPercent * 0.65)}px` }} />
                          <span style={{ height: `${Math.max(46, workoutPercent * 0.85)}px` }} />
                        </div>
                        <p>Completed:</p>
                        <strong>{homeMetrics.workoutsCompleted}/{homeMetrics.workoutsTarget} sessions</strong>
                      </button>
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'routine' && enabledSections.includes('routine') && (
              <TabPanel panelKey="routine">
                <DailyRoutine />
              </TabPanel>
            )}

            {activeTab === 'finance' && enabledSections.includes('finance') && (
              <TabPanel panelKey="finance">
                <Finance />
              </TabPanel>
            )}

            {activeTab === 'fitness' && enabledSections.includes('fitness') && (
              <TabPanel panelKey="fitness">
                <Fitness />
              </TabPanel>
            )}

            {activeTab === 'diet' && enabledSections.includes('diet') && (
              <TabPanel panelKey="diet">
                <Diet />
              </TabPanel>
            )}

            {activeTab === 'shopping' && enabledSections.includes('shopping') && (
              <TabPanel panelKey="shopping">
                <Shopping />
              </TabPanel>
            )}

            {activeTab === 'trophies' && enabledSections.includes('trophies') && (
              <TabPanel panelKey="trophies">
                <Trophies />
              </TabPanel>
            )}

            {activeTab === 'themes' && enabledSections.includes('themes') && (
              <TabPanel panelKey="themes">
                <ThemeStudio canUseInvincible={authUser?.email?.toLowerCase().trim() === 'thsedici@gmail.com'} />
              </TabPanel>
            )}

            {activeTab === 'bible' && enabledSections.includes('bible') && (
              <TabPanel panelKey="bible">
                <Bible />
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
            className={`mobile-nav-orbit-item flex min-w-[76px] flex-none flex-col items-center justify-center gap-1.5 px-2 py-3 transition-all ${
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

      {showVerseChat && (
        <div className="verse-chat-overlay" onClick={() => { setShowVerseChat(false); setEditingCommentId(null); }}>
          <div className="verse-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="verse-chat-header">
              <span className="font-mono text-[10px] uppercase tracking-widest">Riflessioni del giorno</span>
              <button type="button" onClick={() => { setShowVerseChat(false); setEditingCommentId(null); }} className="verse-chat-close">
                <X size={18} />
              </button>
            </div>

            <div className="verse-chat-scroll">
              {visibleVerseComments.length === 0 ? (
                <p className="verse-chat-empty">Nessuna riflessione ancora. Scrivi la prima!</p>
              ) : visibleVerseComments.map((comment) => (
                editingCommentId === comment.id ? (
                  <div key={comment.id} className="verse-chat-msg verse-chat-msg-editing">
                    <textarea
                      className="verse-chat-edit-input"
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      maxLength={180}
                      autoFocus
                    />
                    <div className="verse-chat-edit-actions">
                      <button type="button" className="verse-chat-btn-save" onClick={() => saveEditComment(comment.id)}>Salva</button>
                      <button type="button" className="verse-chat-btn-cancel" onClick={() => setEditingCommentId(null)}>Annulla</button>
                    </div>
                  </div>
                ) : (
                  <div key={comment.id} className="verse-chat-msg">
                    <div className="verse-chat-msg-meta">
                      <strong>{comment.authorName ?? 'Utente'}</strong>
                      <span className="verse-chat-msg-time">{comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <p className="verse-chat-msg-text">{comment.text}</p>
                    {comment.userId === authUser?.uid && (
                      <div className="verse-chat-msg-actions">
                        <button type="button" onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.text); }} className="verse-chat-action-btn">
                          <PencilLine size={13} />
                        </button>
                        <button type="button" onClick={() => deleteVerseComment(comment.id)} className="verse-chat-action-btn verse-chat-action-delete">
                          <X size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>

            <form onSubmit={addDailyVerseComment} className="verse-chat-form">
              <input
                value={verseCommentDraft}
                onChange={(e) => setVerseCommentDraft(e.target.value)}
                placeholder="Scrivi una riflessione…"
                maxLength={180}
                className="verse-chat-input"
              />
              <button type="submit" disabled={!verseCommentDraft.trim()} className="verse-chat-send">
                <Send size={15} />
              </button>
            </form>
            {verseCommentError ? <p className="verse-chat-error">{verseCommentError}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
