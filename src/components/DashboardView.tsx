import React, { useState, useEffect, useMemo } from 'react';
import { Flame, BookOpen, Heart, MessageCircle, Send, Utensils, Dumbbell, X, Plus, Sparkles, Check, ChevronRight, GripVertical, Calendar as CalendarIcon, DollarSign, ListTodo } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { doc, getDocs, collection, query, where, onSnapshot, orderBy, type Timestamp, addDoc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { useDashboard, type SectionTab } from '../context/DashboardContext';
import { db } from '../lib/firebase';
import { PROFILE_AVATARS } from '../lib/avatars';
import { getDailyVerse } from '../data/dailyVerses';
import { getLocalDateKey, formatCurrencyCompact, parseStoredArray } from '../lib/utils';
import { ACCOUNT_LEVELS, getAccountLevelInfo } from '../lib/account';
import { syncDashboardStateNow, markDashboardStateChanged } from '../lib/firebaseSync';

const VERSE_REACTIONS_KEY = 'offwhite_verse_reactions';
const FOCUS_STORAGE_KEY = 'offwhite_focus_of_day';
const WIDGET_ORDER_KEY = 'offwhite_widget_layout';

interface VerseReaction {
  liked: boolean;
  likes: number;
}

type VerseReactionMap = Record<string, VerseReaction>;

interface VerseComment {
  id: string;
  text: string;
  authorName: string;
  userId?: string;
  createdAt: string;
}

interface DashboardViewProps {
  onOpenUserPanel: () => void;
}

const DEFAULT_WIDGET_ORDER = [
  'ai-insight',
  'rhythm-checkin',
  'focus-day',
  'quick-actions',
  'calendar-strip',
  'timeline-day',
  'verse-day',
  'metrics-grid'
];

interface LoggedMeal {
  id: string;
  name: string;
  calories: number;
  completed: boolean;
  category: 'colazione' | 'pranzo' | 'cena' | 'spuntino';
  timestamp: string;
}

interface FocusState {
  text: string;
  completed: boolean;
  awardedDate?: string;
}

function getStoredVerseReactions(): VerseReactionMap {
  try {
    const raw = localStorage.getItem(VERSE_REACTIONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as VerseReactionMap;
  } catch {
    return {};
  }
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

function formatTime(isoString: string) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '12:00';
  }
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

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenUserPanel }) => {
  const {
    authUser,
    profile,
    stats,
    setStats,
    enabledSections,
    setActiveTab,
    homeMetrics,
    triggerRefreshHomeMetrics,
    checkins,
    hasCheckedInToday,
    checkinStreak,
    handleCheckIn,
  } = useDashboard();

  // Local Daily Verse & Reactions State
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => getLocalDateKey(now), [now]);
  const dailyVerse = useMemo(() => getDailyVerse(now), [now]);
  const dailyVerseReactionId = useMemo(
    () => buildVerseReactionId(dailyVerse.reference, today),
    [dailyVerse, today]
  );

  const [verseReactions, setVerseReactions] = useState<VerseReactionMap>(() => getStoredVerseReactions());
  const [showVerseChat, setShowVerseChat] = useState(false);
  const [verseCommentDraft, setVerseCommentDraft] = useState('');
  const [verseCommentError, setVerseCommentError] = useState('');
  const [sharedVerseComments, setSharedVerseComments] = useState<VerseComment[]>([]);
  const [verseReactionReady, setVerseReactionReady] = useState<Record<string, boolean>>({});
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [streakCelebration, setStreakCelebration] = useState<number | null>(null);
  const [showCheckinBurst, setShowCheckinBurst] = useState(false);

  // Widget Order State
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem(WIDGET_ORDER_KEY);
    if (!saved) return DEFAULT_WIDGET_ORDER;
    try {
      const parsed = JSON.parse(saved) as string[];
      // Filtra ID invalidi o mancanti
      const filtered = parsed.filter(id => DEFAULT_WIDGET_ORDER.includes(id));
      // Aggiungi eventuali widget mancanti
      DEFAULT_WIDGET_ORDER.forEach(id => {
        if (!filtered.includes(id)) filtered.push(id);
      });
      return filtered;
    } catch {
      return DEFAULT_WIDGET_ORDER;
    }
  });

  // Save Widget Order
  useEffect(() => {
    localStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  // Focus of the Day State
  const [focusState, setFocusState] = useState<FocusState>(() => {
    const saved = localStorage.getItem(FOCUS_STORAGE_KEY);
    if (!saved) return { text: '', completed: false };
    try {
      return JSON.parse(saved) as FocusState;
    } catch {
      return { text: '', completed: false };
    }
  });

  const saveFocusState = (nextState: FocusState) => {
    setFocusState(nextState);
    localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(nextState));
  };

  const handleFocusCheck = (completed: boolean) => {
    let nextState = { ...focusState, completed };
    
    // Assegna +10 credits per il primo completamento del giorno
    if (completed && focusState.awardedDate !== today && !isAdmin) {
      nextState.awardedDate = today;
      // Award points
      const nextStats = { ...stats, points: stats.points + 10 };
      setStats(nextStats);
      localStorage.setItem('offwhite_user_stats', JSON.stringify(nextStats));
      markDashboardStateChanged();
      window.dispatchEvent(new CustomEvent('stats-update'));
      void syncDashboardStateNow();
    }
    
    saveFocusState(nextState);
  };

  // Quick Action form overlays
  const [quickActionActive, setQuickActionActive] = useState<'meal' | 'expense' | 'task' | null>(null);
  
  // Fast log forms states
  const [mealForm, setMealForm] = useState({ name: '', calories: 250, category: 'spuntino' as LoggedMeal['category'] });
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', category: 'ALTRO', type: 'expense' as 'expense' | 'income' });
  const [taskForm, setTaskForm] = useState({ label: '' });

  // AI Summary States
  const displayName = profile.name ?? authUser?.displayName ?? authUser?.email?.split('@')[0] ?? 'Utente';
  const [aiSummaryText, setAiSummaryText] = useState('Analizzo le metriche personali...');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  // Firestore listeners for Daily Verse comments & likes
  useEffect(() => {
    if (!authUser) return;

    const commentsQuery = query(
      collection(db, 'dailyVerseComments', dailyVerseReactionId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const likesCollection = collection(db, 'dailyVerseReactions', dailyVerseReactionId, 'likes');
    const legacyLikesQuery = query(collection(db, 'dailyVerseLikes'), where('verseId', '==', dailyVerseReactionId));
    
    let nestedLikeUserIds = new Set<string>();
    let legacyLikeUserIds = new Set<string>();

    const publishLikes = () => {
      const combined = new Set<string>([...legacyLikeUserIds, ...nestedLikeUserIds]);
      setVerseReactions((current) => {
        const next = {
          ...current,
          [dailyVerseReactionId]: {
            liked: combined.has(authUser.uid),
            likes: combined.size,
          },
        };
        localStorage.setItem(VERSE_REACTIONS_KEY, JSON.stringify(next));
        return next;
      });
      setVerseReactionReady((current) => ({ ...current, [dailyVerseReactionId]: true }));
    };

    void Promise.all([getDocs(likesCollection), getDocs(legacyLikesQuery)])
      .then(([nestedSnapshot, legacySnapshot]) => {
        nestedLikeUserIds = new Set(nestedSnapshot.docs.map((likeDoc) => likeDoc.id));
        legacyLikeUserIds = new Set(
          legacySnapshot.docs
            .map((likeDoc) => {
              const data = likeDoc.data() as { userId?: string };
              return data.userId ?? '';
            })
            .filter(Boolean)
        );
        publishLikes();
      })
      .catch(() => {
        setVerseReactionReady((current) => ({ ...current, [dailyVerseReactionId]: true }));
      });

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
          })
        );
        setVerseCommentError('');
      },
      () => {
        setVerseCommentError('Commenti condivisi non disponibili al momento.');
      }
    );

    const unsubscribeLikes = onSnapshot(
      likesCollection,
      (snapshot) => {
        nestedLikeUserIds = new Set(snapshot.docs.map((likeDoc) => likeDoc.id));
        publishLikes();
      },
      () => {
        setVerseCommentError('Like condivisi non disponibili al momento.');
      }
    );

    return () => {
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [authUser, dailyVerseReactionId]);

  // AI Insight generator logic
  const getRuleBasedSummary = (metrics: typeof homeMetrics, streak: number, name: string) => {
    const caloriesLeft = Math.max(0, metrics.caloriesTarget - metrics.caloriesConsumed);
    const budgetLeft = Math.max(0, metrics.monthlyBudget - metrics.monthlySpent);
    
    let mealMsg = metrics.mealsCompleted === 0
      ? 'Nessun pasto loggato oggi. Monitora i tuoi macro per un piano equilibrato.'
      : `Hai loggato ${metrics.mealsCompleted} pasti per ${metrics.caloriesConsumed} kcal. Ricarica con altri ${caloriesLeft} kcal.`;
      
    let financeMsg = metrics.monthlySpent === 0
      ? `Budget mensile di ${formatCurrencyCompact(metrics.monthlyBudget)} pronto.`
      : `Spesi ${formatCurrencyCompact(metrics.monthlySpent)} questo mese. Rimangono ${formatCurrencyCompact(budgetLeft)} di riserva.`;
      
    let streakMsg = streak > 0
      ? `Rhythm attivo: ${streak} giorni di check-in consecutivi. Grandioso!`
      : 'Inizia la tua serie personale eseguendo il check-in oggi.';

    return `SISTEMA OS // Ciao ${name}. ${mealMsg} ${financeMsg} ${streakMsg}`;
  };

  useEffect(() => {
    const apiKey = localStorage.getItem('betterme_gemini_api_key');
    if (!apiKey) {
      setAiSummaryText(getRuleBasedSummary(homeMetrics, checkinStreak, displayName));
      return;
    }

    setAiSummaryLoading(true);
    const systemPrompt = `Sei l'AI Coach OS di "Better Me". Genera una sintesi giornaliera personalizzata in italiano basata sui numeri dell'utente. Sii diretto, motivante, ed editoriale. Non superare le 2-3 frasi.`;
    const promptText = `Dati reali:
    - Calorie consumate: ${homeMetrics.caloriesConsumed}/${homeMetrics.caloriesTarget} kcal.
    - Spese mensili: ${homeMetrics.monthlySpent}/${homeMetrics.monthlyBudget} €.
    - Compiti spesa pendenti: ${homeMetrics.shoppingPending}.
    - Allenamenti completati: ${homeMetrics.workoutsCompleted}/${homeMetrics.workoutsTarget} sessioni.
    - Streak di check-in: ${checkinStreak} giorni.
    - Nome utente: ${displayName}.`;
    
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
      })
    })
      .then(res => res.json())
      .then(data => {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          setAiSummaryText(text.trim());
        } else {
          setAiSummaryText(getRuleBasedSummary(homeMetrics, checkinStreak, displayName));
        }
      })
      .catch(() => {
        setAiSummaryText(getRuleBasedSummary(homeMetrics, checkinStreak, displayName));
      })
      .finally(() => {
        setAiSummaryLoading(false);
      });
  }, [homeMetrics, checkinStreak, displayName]);

  // Timeline Data Aggregations
  const timelineItems = useMemo(() => {
    const items: Array<{ id: string; time: string; label: string; type: 'checkin' | 'meal' | 'transaction' | 'task' }> = [];
    
    // 1. Checkin
    if (hasCheckedInToday) {
      items.push({
        id: 'checkin-today',
        time: '10:00',
        label: 'CHECK-IN GIORNALIERO REGISTRATO (+10 CREDITS)',
        type: 'checkin'
      });
    }

    // 2. Meals
    const meals = parseStoredArray<LoggedMeal>('offwhite_meals');
    meals.forEach(m => {
      if (m && typeof m.timestamp === 'string' && m.timestamp.startsWith(today)) {
        items.push({
          id: m.id || Math.random().toString(),
          time: formatTime(m.timestamp),
          label: `LOG PASTO: ${(m.name || 'Pasto').toUpperCase()} (+${m.calories || 0} KCAL)`,
          type: 'meal'
        });
      }
    });

    // 3. Transactions
    const transactions = parseStoredArray<{ id: string; amount: number; description: string; date: string; type: string }>('offwhite_transactions');
    transactions.forEach(tx => {
      if (tx && typeof tx.date === 'string' && tx.date.startsWith(today)) {
        items.push({
          id: tx.id || Math.random().toString(),
          time: formatTime(tx.date),
          label: tx.type === 'income'
            ? `ENTRATA REGISTRATA: +${formatCurrencyCompact(tx.amount || 0)} (${(tx.description || '').toUpperCase()})`
            : `SPESA REGISTRATA: -${formatCurrencyCompact(tx.amount || 0)} (${(tx.description || '').toUpperCase()})`,
          type: 'transaction'
        });
      }
    });

    // 4. Tasks completed
    const taskLog = parseStoredArray<{ id: string; label: string; date: string }>('offwhite_task_completion_log');
    taskLog.forEach(log => {
      if (log && typeof log.date === 'string' && log.date === today) {
        items.push({
          id: log.id || Math.random().toString(),
          time: '12:00',
          label: `ABITUDINE COMPLETATA: "${(log.label || '').toUpperCase()}"`,
          type: 'task'
        });
      }
    });

    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [hasCheckedInToday, today]);

  // Horizontal Calendar Strip
  const last7Days = useMemo(() => {
    const days = [];
    const dateNames = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = getLocalDateKey(d);
      days.push({
        dateKey,
        dayName: dateNames[d.getDay()],
        dayNumber: d.getDate(),
        isToday: i === 0,
        checkedIn: Array.isArray(checkins) && checkins.includes(dateKey),
        routineBonus: localStorage.getItem(`offwhite_daily_routine_bonus_awarded_${dateKey}`) === 'true',
      });
    }
    return days;
  }, [checkins]);

  // Likes & Comment Handles
  const dailyVerseReaction = verseReactions[dailyVerseReactionId] ?? getEmptyVerseReaction();
  const isDailyVerseReactionReady = verseReactionReady[dailyVerseReactionId] ?? false;

  const toggleDailyVerseLike = () => {
    if (!authUser) return;
    const current = dailyVerseReaction;

    setVerseReactions((prev) => ({
      ...prev,
      [dailyVerseReactionId]: {
        liked: !current.liked,
        likes: Math.max(0, current.likes + (current.liked ? -1 : 1)),
      },
    }));

    const likeDoc = doc(db, 'dailyVerseReactions', dailyVerseReactionId, 'likes', authUser.uid);
    if (current.liked) {
      void deleteDoc(likeDoc);
    } else {
      void setDoc(likeDoc, { userId: authUser.uid, createdAt: serverTimestamp() });
    }
  };

  const addDailyVerseComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) return;
    const text = verseCommentDraft.trim();
    if (!text) return;

    const displayName = profile.name ?? authUser.displayName ?? authUser.email?.split('@')[0] ?? 'Utente';
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticComment: VerseComment = {
      id: optimisticId,
      text,
      authorName: displayName,
      userId: authUser.uid,
      createdAt: new Date().toISOString(),
    };

    setVerseCommentDraft('');
    setVerseCommentError('');
    setSharedVerseComments((prev) => [...prev, optimisticComment]);

    try {
      await addDoc(collection(db, 'dailyVerseComments', dailyVerseReactionId, 'comments'), {
        text,
        authorName: displayName,
        userId: authUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch {
      setVerseCommentError('Impossibile salvare il commento condiviso. Riprova.');
    }
  };

  // Metrics calculations
  const vaultRecipeCount = useMemo(() => {
    try {
      return (JSON.parse(localStorage.getItem('offwhite_recipes') || '[]') as unknown[]).length;
    } catch {
      return 0;
    }
  }, []);
  const vaultRecipePercent = useMemo(() => Math.min(100, Math.round((vaultRecipeCount / 20) * 100)), [vaultRecipeCount]);
  
  const workoutPercent = useMemo(
    () => Math.min(100, Math.round((homeMetrics.workoutsCompleted / homeMetrics.workoutsTarget) * 100) || 0),
    [homeMetrics]
  );

  // Level HUD Calculations
  const isAdmin = authUser?.email === 'thsedici@gmail.com';
  const accountLevel = useMemo(() => getAccountLevelInfo(stats.points), [stats.points]);
  const displayPoints = isAdmin ? '∞' : String(stats.points);
  const displayLevel = isAdmin ? 7 : accountLevel.level;
  const displayLevelTitle = isAdmin ? 'Apex' : accountLevel.title;
  const levelProgressWidth = isAdmin ? '100%' : `${accountLevel.progressPercent}%`;

  const handleCheckInClick = () => {
    if (!hasCheckedInToday) {
      setShowCheckinBurst(true);
      window.setTimeout(() => setShowCheckinBurst(false), 1800);
      
      const updated = Array.from(new Set([...checkins, today])).sort();
      const nextStreak = calculateCheckinStreak(updated);
      if (nextStreak >= 5 && nextStreak % 5 === 0) {
        setStreakCelebration(nextStreak);
        window.setTimeout(() => setStreakCelebration(null), 3000);
      }
      handleCheckIn();
    }
  };

  // Submits for quick logs
  const logMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealForm.name.trim() || !mealForm.calories) return;

    const newMeal = {
      id: crypto.randomUUID(),
      name: mealForm.name.trim(),
      calories: Number(mealForm.calories),
      completed: true,
      category: mealForm.category,
      timestamp: new Date().toISOString()
    };

    const current = parseStoredArray<LoggedMeal>('offwhite_meals');
    localStorage.setItem('offwhite_meals', JSON.stringify([newMeal, ...current]));
    
    // Refresh & Notify
    triggerRefreshHomeMetrics();
    window.dispatchEvent(new CustomEvent('dashboard-data-update'));
    setMealForm({ name: '', calories: 250, category: 'spuntino' });
    setQuickActionActive(null);
  };

  const logExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount) return;

    const parsedAmount = Math.abs(Number(expenseForm.amount)) || 0;
    const newTx = {
      id: crypto.randomUUID(),
      accountId: 'default',
      amount: parsedAmount,
      description: expenseForm.description.trim() ? expenseForm.description.trim().toUpperCase() : expenseForm.category,
      date: new Date().toISOString(),
      type: expenseForm.type,
      category: expenseForm.category
    };

    // Update transactions list
    const currentTxs = parseStoredArray<any>('offwhite_transactions');
    localStorage.setItem('offwhite_transactions', JSON.stringify([newTx, ...currentTxs]));

    // Update account balance
    const accounts = parseStoredArray<any>('offwhite_accounts');
    const primaryAccount = accounts[0] || { id: 'default', name: 'PORTAFOGLIO', balance: 0 };
    const diff = expenseForm.type === 'income' ? parsedAmount : -parsedAmount;
    primaryAccount.balance += diff;
    localStorage.setItem('offwhite_accounts', JSON.stringify([primaryAccount]));

    // Refresh & Notify
    triggerRefreshHomeMetrics();
    window.dispatchEvent(new CustomEvent('dashboard-data-update'));
    setExpenseForm({ amount: '', description: '', category: 'ALTRO', type: 'expense' });
    setQuickActionActive(null);
  };

  const logTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.label.trim()) return;

    const newTask = {
      id: crypto.randomUUID(),
      label: taskForm.label.trim(),
      iconId: 'custom',
      completed: false,
      kind: 'custom',
      points: 25,
      awarded: false
    };

    const currentTasks = parseStoredArray<any>('offwhite_daily_tasks');
    localStorage.setItem('offwhite_daily_tasks', JSON.stringify([...currentTasks, newTask]));

    // Notify
    window.dispatchEvent(new CustomEvent('dashboard-data-update'));
    setTaskForm({ label: '' });
    setQuickActionActive(null);
  };

  const visibleVerseComments = sharedVerseComments;

  return (
    <div className="home-app-stage relative pb-16">
      {/* STATIC HUD (NON-REORDERABLE FOR PERFECT COHERENCE) */}
      <section className="home-top-rail shrink-0 px-4 pt-4 md:px-0">
        <div className="home-level-hud">
          <button
            type="button"
            className="home-level-circle"
            onClick={() => setShowLevelModal(true)}
            aria-label={`Livello ${displayLevel} — clicca per dettagli`}
            title="Vedi progressione livelli"
          >
            <strong>{isAdmin ? '∞' : displayLevel}</strong>
          </button>
        </div>

        <div className="home-identity-stack">
          <div className="home-app-logo">
            <div className="home-wordmark" aria-label="Better Me">
              <span className="home-wordmark-top">BETTER</span>
              <span className="home-wordmark-bottom">ME</span>
            </div>
          </div>
          <div className="home-level-track" aria-label={`Progresso livello ${accountLevel.level}`}>
            <div className="home-level-fill" style={{ width: levelProgressWidth }} />
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenUserPanel}
          className="home-user-button active-press-scale"
          aria-label="Apri area utente"
        >
          {stats.avatarId ? (
            (() => {
              const av = PROFILE_AVATARS.find(a => a.id === stats.avatarId);
              return av ? (
                <img
                  src={av.imageUrl}
                  alt={av.name}
                  className="w-full h-full object-cover"
                  style={{ backgroundColor: av.bgColor }}
                />
              ) : <span>{displayName.slice(0, 1).toUpperCase()}</span>;
            })()
          ) : <span>{displayName.slice(0, 1).toUpperCase()}</span>}
        </button>
      </section>

      <div className="home-app-glow home-app-glow-mint" />
      <div className="home-app-glow home-app-glow-blue" />

      {/* DRAGGABLE WIDGET GROUP */}
      <Reorder.Group axis="y" values={widgetOrder} onReorder={setWidgetOrder} className="space-y-5 mt-6 px-4 md:px-0">
        {widgetOrder.map((widgetId) => (
          <Reorder.Item key={widgetId} value={widgetId} dragListener={false} className="w-full">
            {/* WIDGET: AI SMART INSIGHT */}
            {widgetId === 'ai-insight' && (
              <div className="widget-card relative pr-10">
                <div className="absolute top-4 right-4 drag-handle cursor-grab" onPointerDown={(e) => e.currentTarget.parentElement?.dispatchEvent(new MouseEvent('mousedown'))}>
                  <GripVertical size={16} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-offwhite-orange animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-offwhite-orange">SYSTEM_INSIGHT // ANALISI_IA</span>
                </div>
                {aiSummaryLoading ? (
                  <div className="animate-pulse space-y-2 py-1">
                    <div className="h-3 w-3/4 bg-black/10 dark:bg-white/10 rounded" />
                    <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded" />
                  </div>
                ) : (
                  <p className="text-sm font-medium leading-relaxed tracking-tight select-text">
                    {aiSummaryText}
                  </p>
                )}
              </div>
            )}

            {/* WIDGET: RHYTHM CHECK-IN */}
            {widgetId === 'rhythm-checkin' && (
              <div className="widget-card relative pr-10">
                <div className="absolute top-4 right-4 drag-handle cursor-grab">
                  <GripVertical size={16} />
                </div>
                <div className="home-check-zone p-0 border-0 bg-transparent shadow-none">
                  <div className="home-check-card-label mb-2">
                    <span>Daily rhythm</span>
                    <strong className="text-xs uppercase">{hasCheckedInToday ? 'completato' : checkinStreak >= 5 ? `serie ${checkinStreak}` : 'da fare'}</strong>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    animate={showCheckinBurst ? { y: [0, -6, 0], scale: [1, 1.02, 1] } : { y: 0, scale: 1 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    onClick={handleCheckInClick}
                    disabled={hasCheckedInToday}
                    className={`home-check-button w-full active-press-scale ${hasCheckedInToday ? 'is-complete' : ''} ${showCheckinBurst ? 'is-celebrating' : ''}`}
                  >
                    <span className="home-check-flame" aria-hidden="true">
                      <Flame size={24} fill="currentColor" />
                    </span>
                    <span className="home-check-copy text-left">
                      <span>{hasCheckedInToday ? 'Check-in fatto' : 'Fai check-in'}</span>
                      <span className="home-check-reward">
                        {hasCheckedInToday ? 'torna domani per continuare' : '+10 credits oggi'}
                      </span>
                    </span>
                    <span className="home-streak-badge">
                      <small>serie</small>
                      <strong>{checkinStreak}</strong>
                    </span>
                  </motion.button>
                </div>
              </div>
            )}

            {/* WIDGET: FOCUS DEL GIORNO */}
            {widgetId === 'focus-day' && (
              <div className="widget-card relative pr-10">
                <div className="absolute top-4 right-4 drag-handle cursor-grab">
                  <GripVertical size={16} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Check size={16} className="text-offwhite-orange" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-offwhite-orange">IL_FOCUS_DEL_GIORNO</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleFocusCheck(!focusState.completed)}
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      focusState.completed 
                        ? 'bg-black border-black text-white dark:bg-white dark:border-white dark:text-black' 
                        : 'border-black/30 hover:border-black dark:border-white/30 dark:hover:border-white'
                    }`}
                  >
                    {focusState.completed && <Check size={12} strokeWidth={3} />}
                  </button>
                  <input
                    value={focusState.text}
                    onChange={(e) => saveFocusState({ ...focusState, text: e.target.value })}
                    placeholder="Scrivi l'obiettivo principale di oggi..."
                    className={`flex-1 bg-transparent font-medium border-0 focus:ring-0 p-0 text-sm placeholder:opacity-40 focus:outline-none ${
                      focusState.completed ? 'line-through opacity-50' : ''
                    }`}
                  />
                  {focusState.completed && focusState.awardedDate === today && (
                    <span className="font-mono text-[8px] bg-offwhite-orange/10 text-offwhite-orange border border-offwhite-orange/20 px-2 py-0.5 rounded uppercase tracking-widest shrink-0">
                      +10 PTS
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* WIDGET: QUICK ACTIONS */}
            {widgetId === 'quick-actions' && (
              <div className="widget-card relative pr-10">
                <div className="absolute top-4 right-4 drag-handle cursor-grab">
                  <GripVertical size={16} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Plus size={16} className="text-offwhite-orange" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-offwhite-orange">QUICK_ACTIONS // INSERIMENTI_RAPIDI</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickActionActive(quickActionActive === 'meal' ? null : 'meal')}
                    className="flex flex-col items-center justify-center p-3 border border-black/10 dark:border-white/10 rounded-2xl hover:border-black/30 transition-all quick-action-btn"
                  >
                    <Utensils size={18} className="text-offwhite-orange mb-1" />
                    <span className="font-mono text-[8px] uppercase tracking-wide">Pasto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickActionActive(quickActionActive === 'expense' ? null : 'expense')}
                    className="flex flex-col items-center justify-center p-3 border border-black/10 dark:border-white/10 rounded-2xl hover:border-black/30 transition-all quick-action-btn"
                  >
                    <DollarSign size={18} className="text-offwhite-orange mb-1" />
                    <span className="font-mono text-[8px] uppercase tracking-wide">Spesa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickActionActive(quickActionActive === 'task' ? null : 'task')}
                    className="flex flex-col items-center justify-center p-3 border border-black/10 dark:border-white/10 rounded-2xl hover:border-black/30 transition-all quick-action-btn"
                  >
                    <ListTodo size={18} className="text-offwhite-orange mb-1" />
                    <span className="font-mono text-[8px] uppercase tracking-wide">Abitudine</span>
                  </button>
                </div>

                {/* MODAL / FORM ACCORDIONS */}
                <AnimatePresence>
                  {quickActionActive === 'meal' && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={logMealSubmit}
                      className="mt-4 border-t border-black/5 dark:border-white/5 pt-4 space-y-3"
                    >
                      <div className="flex gap-2">
                        <input
                          required
                          value={mealForm.name}
                          onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                          placeholder="Cosa hai mangiato? (es. Yogurt)"
                          className="flex-1 bg-black/5 dark:bg-white/5 border-0 focus:ring-1 focus:ring-offwhite-orange rounded-xl px-3 py-2 text-xs placeholder:opacity-50"
                        />
                        <input
                          required
                          type="number"
                          value={mealForm.calories || ''}
                          onChange={(e) => setMealForm({ ...mealForm, calories: Number(e.target.value) })}
                          placeholder="kcal"
                          className="w-20 bg-black/5 dark:bg-white/5 border-0 focus:ring-1 focus:ring-offwhite-orange rounded-xl px-3 py-2 text-xs text-center placeholder:opacity-50"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <select
                          value={mealForm.category}
                          onChange={(e) => setMealForm({ ...mealForm, category: e.target.value as any })}
                          className="bg-black/5 dark:bg-white/5 border-0 text-[10px] uppercase font-mono tracking-wider rounded-xl px-2.5 py-1.5 focus:ring-0"
                        >
                          <option value="colazione">Mattina</option>
                          <option value="pranzo">Pranzo</option>
                          <option value="cena">Cena</option>
                          <option value="spuntino">Spuntino</option>
                        </select>
                        <button type="submit" className="font-mono text-[9px] uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-xl">
                          Registra Pasto
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {quickActionActive === 'expense' && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={logExpenseSubmit}
                      className="mt-4 border-t border-black/5 dark:border-white/5 pt-4 space-y-3"
                    >
                      <div className="flex gap-2">
                        <input
                          required
                          type="number"
                          step="0.01"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                          placeholder="Importo (EUR)"
                          className="w-32 bg-black/5 dark:bg-white/5 border-0 focus:ring-1 focus:ring-offwhite-orange rounded-xl px-3 py-2 text-xs placeholder:opacity-50"
                        />
                        <input
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                          placeholder="Nota (es. Spesa pranzo)"
                          className="flex-1 bg-black/5 dark:bg-white/5 border-0 focus:ring-1 focus:ring-offwhite-orange rounded-xl px-3 py-2 text-xs placeholder:opacity-50"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <select
                          value={expenseForm.category}
                          onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                          className="bg-black/5 dark:bg-white/5 border-0 text-[10px] uppercase font-mono tracking-wider rounded-xl px-2.5 py-1.5 focus:ring-0"
                        >
                          <option value="SPESA">Alimentari</option>
                          <option value="RISTORANTI">Ristoranti</option>
                          <option value="TRASPORTI">Trasporti</option>
                          <option value="ABBONAMENTI">Abbonamento</option>
                          <option value="SVAGO">Svago</option>
                          <option value="ALTRO">Altro</option>
                        </select>
                        <button type="submit" className="font-mono text-[9px] uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-xl">
                          Salva Spesa
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {quickActionActive === 'task' && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={logTaskSubmit}
                      className="mt-4 border-t border-black/5 dark:border-white/5 pt-4 flex gap-2"
                    >
                      <input
                        required
                        value={taskForm.label}
                        onChange={(e) => setTaskForm({ ...taskForm, label: e.target.value })}
                        placeholder="Cosa vuoi tracciare? (es. Leggi 10 pag.)"
                        className="flex-1 bg-black/5 dark:bg-white/5 border-0 focus:ring-1 focus:ring-offwhite-orange rounded-xl px-3 py-2 text-xs placeholder:opacity-50"
                      />
                      <button type="submit" className="font-mono text-[9px] uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-xl shrink-0">
                        Aggiungi
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* WIDGET: CALENDAR STRIP */}
            {widgetId === 'calendar-strip' && (
              <div className="widget-card relative pr-10">
                <div className="absolute top-4 right-4 drag-handle cursor-grab">
                  <GripVertical size={16} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon size={16} className="text-offwhite-orange" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-offwhite-orange">LOG_CONSISTENCY // 7_GIORNI</span>
                </div>
                <div className="flex justify-between gap-1 overflow-x-auto py-1">
                  {last7Days.map((day) => (
                    <div
                      key={day.dateKey}
                      className={`flex flex-col items-center p-2 rounded-xl border w-10 shrink-0 ${
                        day.isToday 
                          ? 'border-black bg-black/5 dark:border-white dark:bg-white/5' 
                          : 'border-black/5 bg-transparent dark:border-white/5'
                      }`}
                    >
                      <span className="text-[8px] font-mono opacity-50 mb-1">{day.dayName}</span>
                      <span className="text-xs font-bold font-mono">{day.dayNumber}</span>
                      <div className="flex flex-col gap-1 mt-2.5 h-7 justify-end items-center">
                        {day.checkedIn && (
                          <Flame size={12} className="text-offwhite-orange fill-offwhite-orange" />
                        )}
                        {day.routineBonus && (
                          <Check size={10} className="text-green-500 font-bold" strokeWidth={3} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WIDGET: TIMELINE DELLA GIORNATA */}
            {widgetId === 'timeline-day' && (
              <div className="widget-card relative pr-10">
                <div className="absolute top-4 right-4 drag-handle cursor-grab">
                  <GripVertical size={16} />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon size={16} className="text-offwhite-orange" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-offwhite-orange">ATTIVITA_DI_OGGI // TIMELINE</span>
                </div>
                {timelineItems.length === 0 ? (
                  <div className="text-center py-6 opacity-30 font-mono text-[9px] uppercase">
                    Ancora nessuna attività registrata oggi.
                  </div>
                ) : (
                  <div className="timeline-track">
                    {timelineItems.map((item) => (
                      <div key={item.id} className="timeline-item flex flex-col items-start">
                        <span className="timeline-dot" />
                        <span className="font-mono text-[8px] opacity-40">{item.time}</span>
                        <p className="font-mono text-[9px] font-bold tracking-wide uppercase mt-0.5 leading-snug">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WIDGET: VERSE OF THE DAY */}
            {widgetId === 'verse-day' && (
              <article className="home-verse-card home-verse-card-enhanced shimmer-sweep active-press-scale relative pr-10">
                <div className="absolute top-4 right-4 drag-handle cursor-grab">
                  <GripVertical size={16} />
                </div>
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
                    className={`home-verse-action active-press-scale ${dailyVerseReaction.liked ? 'is-liked' : ''}`}
                  >
                    <Heart size={16} fill={dailyVerseReaction.liked ? 'currentColor' : 'none'} />
                    <span>{isDailyVerseReactionReady ? dailyVerseReaction.likes : '...'}</span>
                  </button>
                  <button type="button" className="home-verse-action active-press-scale" onClick={() => setShowVerseChat(true)}>
                    <MessageCircle size={16} />
                    <span>{visibleVerseComments.length}</span>
                  </button>
                  {enabledSections.includes('bible') ? (
                    <button type="button" onClick={() => setActiveTab('bible')} className="home-verse-read-button active-press-scale">
                      Leggi Bibbia
                    </button>
                  ) : null}
                </div>

                <form onSubmit={addDailyVerseComment} className="home-verse-comment-form">
                  <input
                    value={verseCommentDraft}
                    onChange={(event) => setVerseCommentDraft(event.target.value)}
                    placeholder="Condividi una riflessione..."
                    maxLength={180}
                  />
                  <button type="submit" disabled={!verseCommentDraft.trim()} aria-label="Salva commento">
                    <Send size={15} />
                  </button>
                </form>

                {verseCommentError ? <p className="home-verse-comment-error">{verseCommentError}</p> : null}
              </article>
            )}

            {/* WIDGET: METRICS SHORTCUT GRID */}
            {widgetId === 'metrics-grid' && (
              <div className="home-metric-grid relative">
                <div className="absolute -top-6 right-0 drag-handle cursor-grab">
                  <GripVertical size={16} />
                </div>
                {enabledSections.includes('diet') && (
                  <button onClick={() => setActiveTab('diet')} className="home-metric-card home-metric-diet shimmer-sweep active-press-scale">
                    <div className="home-card-title">Diet</div>
                    <div className="home-donut" style={{ '--progress': `${vaultRecipePercent}%` } as React.CSSProperties}>
                      <span>{vaultRecipeCount}</span>
                      <Utensils size={16} strokeWidth={2.2} />
                    </div>
                    <p>Vault ricette:</p>
                    <strong>{vaultRecipeCount} salvate</strong>
                  </button>
                )}

                {enabledSections.includes('finance') && (
                  <button onClick={() => setActiveTab('finance')} className="home-metric-card home-metric-expenses shimmer-sweep active-press-scale">
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
                  <button onClick={() => setActiveTab('shopping')} className="home-wide-card home-shopping-card shimmer-sweep active-press-scale">
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
                  <button onClick={() => setActiveTab('fitness')} className="home-metric-card home-workout-card shimmer-sweep active-press-scale">
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
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* LEVEL MODAL */}
      <AnimatePresence>
        {showLevelModal && (
          <motion.div
            className="level-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLevelModal(false)}
          >
            <motion.div
              className="level-modal"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="level-modal-header">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-offwhite-orange">PROGRESSIONE</div>
                  <h2 className="text-3xl font-black uppercase tracking-tight mt-1">Livelli Account</h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 mt-1">
                    Sei al Livello {displayLevel} · {displayLevelTitle} · {displayPoints} credits totali
                  </p>
                </div>
                <button type="button" onClick={() => setShowLevelModal(false)} className="p-1 hover:text-offwhite-orange" aria-label="Chiudi">
                  <X size={20} />
                </button>
              </div>
              <div className="level-modal-body">
                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest mb-1.5">
                    <span>{displayLevelTitle}</span>
                    <span>{isAdmin ? '∞ ADMIN' : accountLevel.nextLevelAt ? `${Math.max(0, accountLevel.nextLevelAt - stats.points)} mancanti` : 'LIVELLO MAX'}</span>
                  </div>
                  <div className="h-2 w-full bg-black/10 border border-black/20">
                    <div className="h-full bg-black transition-all" style={{ width: levelProgressWidth }} />
                  </div>
                </div>

                {/* All levels */}
                <div className="border-t-2 border-black/10">
                  {ACCOUNT_LEVELS.map((lvl, idx) => {
                    const lvlNumber = idx + 1;
                    const isCurrent = lvlNumber === displayLevel;
                    const isPast = lvlNumber < displayLevel;
                    const badgeClass = isCurrent ? 'is-current' : isPast ? 'is-past' : 'is-future';
                    return (
                      <div key={lvl.tier} className={`level-row ${isCurrent ? 'bg-black/[0.03]' : ''}`}>
                        <div className={`level-row-badge ${badgeClass}`}>
                          {isPast ? '✓' : lvlNumber}
                        </div>
                        <div className="level-row-info">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-black uppercase tracking-tight">{lvl.title}</span>
                            <span className="font-mono text-[9px] text-gray-400">{lvl.minPoints} pts</span>
                            {isCurrent && <span className="font-mono text-[8px] bg-black text-white px-1.5 py-0.5 uppercase tracking-widest">ATTUALE</span>}
                          </div>
                          <ul className="mt-1 space-y-0.5">
                            {lvl.perks.map((perk) => (
                              <li key={perk} className="font-mono text-[9px] uppercase tracking-[0.15em] text-gray-500 flex gap-1.5">
                                <span className="text-offwhite-orange">›</span>{perk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STREAK CELEBRATION OVERLAY */}
      <AnimatePresence>
        {streakCelebration !== null && (
          <motion.div
            className="streak-celebration-overlay shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            aria-hidden="true"
          >
            <div className="celebration-content border-2 border-offwhite-orange rounded-3xl bg-black p-8 text-center max-w-sm relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at center, var(--theme-accent), transparent 70%)` }} />
              <Flame size={72} className="text-offwhite-orange animate-bounce mx-auto mb-4" fill="currentColor" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">SERIE DI {streakCelebration} GIORNI!</h2>
              <p className="text-xs text-gray-400 mt-2">La costanza genera perfezione. Continua la tua catena di successi!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VERSE REFLECTIONS DRAWER */}
      <AnimatePresence>
        {showVerseChat && (
          <motion.div
            className="verse-chat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowVerseChat(false)}
          >
            <motion.div
              className="verse-chat-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header">
                <span className="font-mono text-[9px] uppercase tracking-widest text-offwhite-orange">RIFLESSIONI_CONDIVISE</span>
                <button type="button" onClick={() => setShowVerseChat(false)} className="close-drawer" aria-label="Chiudi chat">
                  <X size={18} />
                </button>
              </div>

              <div className="drawer-body">
                <div className="verse-preview-card p-4 border border-black/5 dark:border-white/5 rounded-2xl bg-black/[0.02]">
                  <blockquote className="italic text-sm font-medium">"{dailyVerse.text}"</blockquote>
                  <cite className="font-mono text-[8px] uppercase tracking-wider block mt-2">— {dailyVerse.reference}</cite>
                </div>

                <div className="comments-scroller flex-1 overflow-y-auto mt-6 space-y-4">
                  {visibleVerseComments.length === 0 ? (
                    <div className="text-center py-12 opacity-30 font-mono text-[9px] uppercase">
                      Nessuna riflessione condivisa oggi.
                    </div>
                  ) : (
                    <div className="comments-list space-y-3">
                      {visibleVerseComments.map((comment) => (
                        <div key={comment.id} className="comment-bubble p-3 border border-black/5 dark:border-white/5 rounded-2xl bg-black/[0.01]">
                          <div className="comment-bubble-meta flex justify-between items-center mb-1.5">
                            <strong className="text-xs font-bold font-mono uppercase tracking-wide">{comment.authorName}</strong>
                            <span className="font-mono text-[8px] opacity-40">{new Date(comment.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs leading-relaxed">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={addDailyVerseComment} className="drawer-comment-form mt-4 flex gap-2 border-t border-black/5 dark:border-white/5 pt-4">
                  <input
                    value={verseCommentDraft}
                    onChange={(event) => setVerseCommentDraft(event.target.value)}
                    placeholder="Scrivi una riflessione..."
                    maxLength={180}
                    className="flex-1 bg-black/5 dark:bg-white/5 border-0 focus:ring-1 focus:ring-offwhite-orange rounded-xl px-3 py-2 text-xs"
                  />
                  <button type="submit" disabled={!verseCommentDraft.trim()} className="font-mono text-[9px] uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-xl">
                    Invia
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
