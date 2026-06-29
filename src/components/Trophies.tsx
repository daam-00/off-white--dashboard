import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, CalendarCheck, CheckCircle2, ChevronRight, Flame, Gift, ListChecks, ShoppingBag, Sparkles, Utensils, X } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { CircularProgress } from './CircularProgress';
import { awardUserPoints, getStoredUserStats } from '../lib/account';

type WeeklyGoal = {
  id: string;
  title: string;
  kicker: string;
  description: string;
  target: number;
  progress: number;
  unit: string;
  reward: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

type WeeklyReward = {
  weekKey: string;
  label: string;
  credits: number;
  claimedAt: string;
};

const WEEKLY_REWARDS_KEY = 'offwhite_weekly_rewards';
const WEEKLY_REWARD_CREDITS = 300;

// Credits awarded per individual goal completion (awarded on claim)
const GOAL_CREDITS: Record<string, number> = {
  'weekly-checkins': 70,
  'weekly-routine': 90,
  'weekly-tasks': 80,
  'weekly-food': 60,
  'weekly-shopping': 50,
};

function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekStart(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  return start;
}

function getWeekEnd(date = new Date()) {
  const end = getWeekStart(date);
  end.setDate(end.getDate() + 6);
  return end;
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

function countDatesThisWeek(dates: string[], weekStart: string, weekEnd: string) {
  return new Set(dates.filter((date) => date >= weekStart && date <= weekEnd)).size;
}

function getWeekLabel() {
  const formatter = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' });
  return `${formatter.format(getWeekStart())} - ${formatter.format(getWeekEnd())}`;
}

function getWeeklyRewards() {
  return parseStoredArray<WeeklyReward>(WEEKLY_REWARDS_KEY);
}

function getStats() {
  return getStoredUserStats();
}

function buildWeeklyGoals(): WeeklyGoal[] {
  const weekStart = getLocalDateKey(getWeekStart());
  const weekEnd = getLocalDateKey(getWeekEnd());
  const checkins = parseStoredArray<string>('offwhite_checkins');
  const routinePerfectDays = parseStoredArray<string>('offwhite_routine_completed_dates');
  const taskLog = parseStoredArray<{ date?: string }>('offwhite_task_completion_log');
  const shopping = parseStoredArray<{ bought?: boolean }>('offwhite_shopping');

  // Track recipe vault saves this week
  const recipeVault = parseStoredArray<{ savedAt?: string; date?: string }>('offwhite_recipes');
  const recipesThisWeek = recipeVault.filter((r) => {
    const date = (r.savedAt ?? r.date ?? '').slice(0, 10);
    return date >= weekStart && date <= weekEnd;
  }).length;

  const tasksThisWeek = taskLog.filter((entry) => {
    const date = entry.date || '';
    return date >= weekStart && date <= weekEnd;
  }).length;

  const shoppingComplete = shopping.length > 0 && shopping.every((item) => item.bought);

  return [
    {
      id: 'weekly-checkins',
      title: 'Serie viva',
      kicker: 'Check-in',
      description: 'Entra in Better Me per cinque giorni della settimana.',
      target: 5,
      progress: countDatesThisWeek(checkins, weekStart, weekEnd),
      unit: 'giorni',
      reward: '+70 credits · verso tema Forest',
      Icon: Flame,
    },
    {
      id: 'weekly-routine',
      title: 'Giornate chiuse',
      kicker: 'Routine',
      description: 'Completa tutti i tuoi to-do giornalieri in tre giorni diversi.',
      target: 3,
      progress: countDatesThisWeek(routinePerfectDays, weekStart, weekEnd),
      unit: 'giorni perfetti',
      reward: '+90 credits · verso tema Dark',
      Icon: CalendarCheck,
    },
    {
      id: 'weekly-tasks',
      title: 'Lista in movimento',
      kicker: 'To-do',
      description: 'Completa sette to-do personali durante la settimana.',
      target: 7,
      progress: tasksThisWeek,
      unit: 'to-do',
      reward: '+80 credits · verso avatar rari',
      Icon: ListChecks,
    },
    {
      id: 'weekly-food',
      title: 'Vault pieno',
      kicker: 'Ricette',
      description: 'Salva almeno 3 ricette nel vault questa settimana.',
      target: 3,
      progress: recipesThisWeek,
      unit: 'ricette',
      reward: '+60 credits',
      Icon: Utensils,
    },
    {
      id: 'weekly-shopping',
      title: 'Spesa pulita',
      kicker: 'Spesa',
      description: 'Chiudi la lista della spesa comprando tutti gli articoli inseriti.',
      target: 1,
      progress: shoppingComplete ? 1 : 0,
      unit: 'lista',
      reward: '+50 credits · verso tema Sunset',
      Icon: ShoppingBag,
    },
  ];
}

function awardWeeklyReward(weekKey: string) {
  const rewards = getWeeklyRewards();
  if (rewards.some((reward) => reward.weekKey === weekKey)) return rewards;

  const nextReward: WeeklyReward = {
    weekKey,
    label: 'Weekly Prize Pass',
    credits: WEEKLY_REWARD_CREDITS,
    claimedAt: new Date().toISOString(),
  };
  awardUserPoints(WEEKLY_REWARD_CREDITS);

  const nextRewards = [...rewards, nextReward];
  localStorage.setItem(WEEKLY_REWARDS_KEY, JSON.stringify(nextRewards));
  return nextRewards;
}

export const Trophies: React.FC = () => {
  const [goals, setGoals] = useState<WeeklyGoal[]>(() => buildWeeklyGoals());
  const [selectedGoalId, setSelectedGoalId] = useState(() => buildWeeklyGoals()[0]?.id ?? '');
  const [rewards, setRewards] = useState<WeeklyReward[]>(() => getWeeklyRewards());

  const weekKey = getLocalDateKey(getWeekStart());
  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? goals[0];
  const completedGoals = goals.filter((goal) => goal.progress >= goal.target).length;
  const weeklyProgress = goals.length ? Math.round((completedGoals / goals.length) * 100) : 0;
  const weeklyComplete = goals.length > 0 && completedGoals === goals.length;
  const rewardClaimed = rewards.some((reward) => reward.weekKey === weekKey);

  const previewSteps = useMemo(() => {
    if (!selectedGoal) return [];
    return [
      `${Math.min(selectedGoal.progress, selectedGoal.target)}/${selectedGoal.target} ${selectedGoal.unit}`,
      selectedGoal.progress >= selectedGoal.target ? 'Obiettivo completato' : `${selectedGoal.target - selectedGoal.progress} mancanti`,
      selectedGoal.reward,
    ];
  }, [selectedGoal]);

  useEffect(() => {
    const refreshGoals = () => {
      setGoals(buildWeeklyGoals());
      setRewards(getWeeklyRewards());
    };

    const interval = window.setInterval(refreshGoals, 2000);
    window.addEventListener('checkin-update', refreshGoals);
    window.addEventListener('routine-update', refreshGoals);
    window.addEventListener('shopping-update', refreshGoals);
    window.addEventListener('stats-update', refreshGoals);
    window.addEventListener('focus', refreshGoals);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('checkin-update', refreshGoals);
      window.removeEventListener('routine-update', refreshGoals);
      window.removeEventListener('shopping-update', refreshGoals);
      window.removeEventListener('stats-update', refreshGoals);
      window.removeEventListener('focus', refreshGoals);
    };
  }, []);

  const claimReward = () => {
    if (!weeklyComplete || rewardClaimed) return;
    setRewards(awardWeeklyReward(weekKey));
  };

  return (
    <div className="offwhite-border h-full weekly-goals-shell">
      <SectionHeader title="OBIETTIVI" label="SETTIMANA_PREMIO" />

      <section className="weekly-prize-panel">
        <div>
          <div className="weekly-prize-kicker">Settimana {getWeekLabel()}</div>
          <h3>Completa tutto e ritira il premio.</h3>
          <p>Chiudi le card settimanali per vincere <strong>{WEEKLY_REWARD_CREDITS} Better Credits</strong> e sbloccare temi ed avatar premium.</p>
        </div>
        <div className="weekly-prize-meter" aria-label={`${weeklyProgress}% completato`}>
          <span>{weeklyProgress}%</span>
          <div>
            <i style={{ width: `${weeklyProgress}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={claimReward}
          disabled={!weeklyComplete || rewardClaimed}
          className="weekly-prize-button"
        >
          <Gift size={17} />
          {rewardClaimed ? 'Premio ritirato' : weeklyComplete ? 'Ritira premio' : `${completedGoals}/${goals.length} completati`}
        </button>
      </section>

      <div className="weekly-goals-layout">
        <div className="weekly-goal-grid">
          {goals.map((goal) => {
            const active = selectedGoal?.id === goal.id;
            const complete = goal.progress >= goal.target;
            const percent = Math.min(100, Math.round((goal.progress / goal.target) * 100));

            return (
              <motion.button
                key={goal.id}
                type="button"
                onClick={() => setSelectedGoalId(goal.id)}
                className={`weekly-goal-card ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                                <span className="weekly-goal-topline">
                  <span>{goal.kicker}</span>
                  {complete ? <CheckCircle2 size={16} className="text-[#a600ff]" /> : <ChevronRight size={16} />}
                </span>
                <div className="flex justify-center items-center my-4">
                  <CircularProgress 
                    progress={percent} 
                    size={64} 
                    strokeWidth={5} 
                    color={active ? "#a600ff" : "#FF5C00"}
                    icon={<goal.Icon size={24} />}
                  />
                </div>
                <strong>{goal.title}</strong>
                <span className="weekly-goal-progress">
                  {Math.min(goal.progress, goal.target)}/{goal.target} {goal.unit}
                </span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {selectedGoal && (
            <motion.aside
              key={selectedGoal.id}
              className="weekly-goal-preview"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
            >
              <div className="weekly-preview-head">
                <div className="weekly-preview-icon">
                  <selectedGoal.Icon size={30} />
                </div>
                <button type="button" onClick={() => setSelectedGoalId('')} aria-label="Chiudi anteprima">
                  <X size={16} />
                </button>
              </div>
              <div className="weekly-preview-kicker">{selectedGoal.kicker}</div>
              <h3>{selectedGoal.title}</h3>
              <p>{selectedGoal.description}</p>

              <div className="weekly-preview-steps">
                {previewSteps.map((step, index) => (
                  <div key={step}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>

              <div className="weekly-preview-reward">
                <Award size={18} />
                <span>
                  {selectedGoal.progress >= selectedGoal.target
                    ? `✓ ${selectedGoal.reward}`
                    : selectedGoal.reward}
                </span>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <div className="weekly-reward-history">
        <Sparkles size={18} />
        <span>
          Premi vinti: {rewards.length === 0 ? 'nessuno ancora' : rewards.map((reward) => reward.label).join(', ')}
        </span>
      </div>
    </div>
  );
};
