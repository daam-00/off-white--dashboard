import React, { useState, useEffect, useMemo } from 'react';
import { Flame, BookOpen, Heart, MessageCircle, Send, Utensils, Dumbbell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDocs, collection, query, where, onSnapshot, orderBy, type Timestamp, addDoc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { useDashboard, type SectionTab } from '../context/DashboardContext';
import { db } from '../lib/firebase';
import { PROFILE_AVATARS } from '../lib/avatars';
import { getDailyVerse } from '../data/dailyVerses';
import { getLocalDateKey, formatCurrencyCompact, parseStoredArray } from '../lib/utils';
import { ACCOUNT_LEVELS, getAccountLevelInfo } from '../lib/account';
import { syncDashboardStateNow, markDashboardStateChanged } from '../lib/firebaseSync';

const VERSE_REACTIONS_KEY = 'offwhite_verse_reactions';

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

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenUserPanel }) => {
  const {
    authUser,
    profile,
    stats,
    enabledSections,
    setActiveTab,
    homeMetrics,
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

  // Handle Likes
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

  // Handle Comments
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

  // Metrics Calculations
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

  const displayName = profile.name ?? authUser?.displayName ?? authUser?.email?.split('@')[0] ?? 'Utente';

  // Sincronizzazione check-in locale con animazione di burst
  const handleCheckInClick = () => {
    if (!hasCheckedInToday) {
      setShowCheckinBurst(true);
      window.setTimeout(() => setShowCheckinBurst(false), 1800);
      handleCheckIn();
    }
  };

  const visibleVerseComments = sharedVerseComments;

  return (
    <div className="home-app-stage relative">
      <section className="home-app-shell">
        <div className="home-top-rail">
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
        </div>

        <div className="home-app-glow home-app-glow-mint" />
        <div className="home-app-glow home-app-glow-blue" />

        <div className="home-check-zone">
          <div className="home-check-card-label">
            <span>Daily rhythm</span>
            <strong>{hasCheckedInToday ? 'completato' : checkinStreak >= 5 ? `serie ${checkinStreak}` : 'da fare'}</strong>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            animate={showCheckinBurst ? { y: [0, -6, 0], scale: [1, 1.02, 1] } : { y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            onClick={handleCheckInClick}
            disabled={hasCheckedInToday}
            className={`home-check-button active-press-scale ${hasCheckedInToday ? 'is-complete' : ''} ${showCheckinBurst ? 'is-celebrating' : ''}`}
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

        <article className="home-verse-card home-verse-card-enhanced shimmer-sweep active-press-scale">
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

        <div className="home-metric-grid">
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
      </section>

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
            className="streak-celebration-overlay"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            aria-hidden="true"
          >
            <div className="celebration-content">
              <Flame size={72} className="text-offwhite-orange animate-bounce" fill="currentColor" />
              <h2>SERIE DI {streakCelebration} GIORNI!</h2>
              <p>Continua così per far crescere il tuo livello account.</p>
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
                <h3>Riflessioni Condivise</h3>
                <button type="button" onClick={() => setShowVerseChat(false)} className="close-drawer" aria-label="Chiudi chat">
                  <X size={18} />
                </button>
              </div>

              <div className="drawer-body">
                <div className="verse-preview-card">
                  <blockquote>{dailyVerse.text}</blockquote>
                  <cite>{dailyVerse.reference}</cite>
                </div>

                <div className="comments-scroller">
                  {visibleVerseComments.length === 0 ? (
                    <div className="text-center py-8 opacity-40 font-mono text-[10px] uppercase">
                      Nessuna riflessione ancora condivisa. Scrivi la prima!
                    </div>
                  ) : (
                    <div className="comments-list">
                      {visibleVerseComments.map((comment) => (
                        <div key={comment.id} className="comment-bubble">
                          <div className="comment-bubble-meta">
                            <strong>{comment.authorName}</strong>
                            <span>{new Date(comment.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p>{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={addDailyVerseComment} className="drawer-comment-form">
                  <input
                    value={verseCommentDraft}
                    onChange={(event) => setVerseCommentDraft(event.target.value)}
                    placeholder="Scrivi una riflessione..."
                    maxLength={180}
                  />
                  <button type="submit" disabled={!verseCommentDraft.trim()}>
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
