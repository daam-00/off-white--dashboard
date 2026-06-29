import React, { useState, useEffect } from 'react';
import { SectionHeader } from './SectionHeader';
import { CircleCheck, Circle, Trophy as TrophyIcon, Plus, Trash2, PencilLine } from 'lucide-react';
import { motion } from 'motion/react';
import { Heatmap } from './Heatmap';
import { awardUserPoints } from '../lib/account';

interface RoutineTask {
  id: string;
  label: string;
  iconId: string;
  completed: boolean;
  kind?: 'preset' | 'custom';
  points?: number;
  awarded?: boolean;
}

const ICON_MAP: Record<string, any> = {
  custom: PencilLine,
};

const TASKS_STORAGE_KEY = 'offwhite_daily_tasks';
const TASKS_UPDATED_KEY = 'offwhite_last_task_update';
const DAILY_BONUS_KEY = 'offwhite_daily_routine_bonus_awarded';
const ROUTINE_COMPLETED_DATES_KEY = 'offwhite_routine_completed_dates';
const TASK_COMPLETION_LOG_KEY = 'offwhite_task_completion_log';
const TASK_POINTS = 25;
const DAILY_COMPLETION_BONUS = 50;

function getTodayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeTasks(tasks: RoutineTask[]) {
  return tasks.map((task) => ({
    ...task,
    kind: 'custom',
    iconId: 'custom',
    points: task.points ?? TASK_POINTS,
    awarded: task.awarded ?? task.completed,
  }));
}

function appendStoredDate(key: string, dateKey: string) {
  const saved = localStorage.getItem(key);
  const dates = saved ? JSON.parse(saved) as string[] : [];
  const nextDates = Array.from(new Set([...dates, dateKey])).sort();
  localStorage.setItem(key, JSON.stringify(nextDates));
}

function appendTaskCompletion(dateKey: string, task: RoutineTask) {
  const saved = localStorage.getItem(TASK_COMPLETION_LOG_KEY);
  const log = saved ? JSON.parse(saved) as Array<{ id: string; label: string; date: string }> : [];
  const entryId = `${dateKey}-${task.id}`;

  if (log.some((entry) => entry.id === entryId)) return;

  localStorage.setItem(
    TASK_COMPLETION_LOG_KEY,
    JSON.stringify([...log, { id: entryId, label: task.label, date: dateKey }]),
  );
}

export const DailyRoutine: React.FC = () => {
  const [tasks, setTasks] = useState<RoutineTask[]>(() => {
    const saved = localStorage.getItem(TASKS_STORAGE_KEY);
    const lastUpdate = localStorage.getItem(TASKS_UPDATED_KEY);
    const today = getTodayKey();

    if (lastUpdate !== today) {
      return [];
    }

    if (!saved) {
      return [];
    }

    try {
      const parsed = JSON.parse(saved) as RoutineTask[];
      return normalizeTasks(parsed).filter((task) => task.kind === 'custom');
    } catch {
      return [];
    }
  });
  const [customGoal, setCustomGoal] = useState('');

  useEffect(() => {
    const today = getTodayKey();
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    localStorage.setItem(TASKS_UPDATED_KEY, today);
    
    // Dispatch event for trophies
    window.dispatchEvent(new CustomEvent('routine-update'));
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks((prev) => {
      let pointsToAward = 0;
      let shouldAwardDailyBonus = false;

      const next = prev.map((task) => {
        if (task.id !== id) return task;

        const nextCompleted = !task.completed;
        const shouldAwardTask = nextCompleted && !task.awarded;
        if (shouldAwardTask) {
          pointsToAward += task.points ?? TASK_POINTS;
          appendTaskCompletion(getTodayKey(), task);
        }

        return {
          ...task,
          completed: nextCompleted,
          awarded: task.awarded || shouldAwardTask,
        };
      });

      const today = getTodayKey();
      const bonusAlreadyAwarded = localStorage.getItem(DAILY_BONUS_KEY) === today;
      if (next.length > 0 && next.every((task) => task.completed) && !bonusAlreadyAwarded) {
        shouldAwardDailyBonus = true;
        localStorage.setItem(DAILY_BONUS_KEY, today);
        appendStoredDate(ROUTINE_COMPLETED_DATES_KEY, today);
      }

      if (pointsToAward > 0) awardUserPoints(pointsToAward);
      if (shouldAwardDailyBonus) awardUserPoints(DAILY_COMPLETION_BONUS);

      return next;
    });
  };

  const addCustomTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextLabel = customGoal.trim();
    if (!nextLabel) return;

    setTasks((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        label: nextLabel.toUpperCase(),
        iconId: 'custom',
        completed: false,
        kind: 'custom',
        points: TASK_POINTS,
        awarded: false,
      },
    ]);
    setCustomGoal('');
  };

  const removeCustomTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const progress = tasks.length ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;
  
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem(ROUTINE_COMPLETED_DATES_KEY);
    if (saved) {
      setCompletedDates(JSON.parse(saved));
    }
  }, [tasks]);

  return (
    <div className="h-full rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-3xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col p-6">
      <SectionHeader title="ROUTINE GIORNALIERA" label="TRACCIATORE_ROUTINE_V1.0" />

      <div className="mb-6 rounded-3xl border border-white/80 bg-white/80 dark:bg-white/10 backdrop-blur-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="offwhite-label mb-1">OBIETTIVI_PERSONALI</div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
              Aggiungi i tuoi to-do personali. La routine parte vuota ogni giorno.
            </p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-offwhite-orange">
              Ogni to-do completato vale +{TASK_POINTS} credits. Completali tutti: bonus +{DAILY_COMPLETION_BONUS}.
            </p>
          </div>
        </div>

        <form onSubmit={addCustomTask} className="flex flex-col gap-3 md:flex-row">
          <input
            value={customGoal}
            onChange={(event) => setCustomGoal(event.target.value)}
            placeholder="SCRIVI L OBIETTIVO DI OGGI"
            className="min-w-0 flex-1 rounded-2xl bg-white/80 backdrop-blur-md border border-white/80 px-5 py-3.5 font-medium text-sm outline-none placeholder:text-gray-400 focus:border-[#a600ff] focus:ring-2 focus:ring-[#a600ff]/20 shadow-inner transition-all"
            maxLength={80}
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a600ff] to-[#ff007f] px-6 py-3.5 font-bold text-sm text-white shadow-lg transition-all hover:scale-105 hover:opacity-90"
          >
            <Plus size={16} />
            Salva To-Do
          </button>
        </form>
      </div>
      
      
      <div className="mb-6 rounded-3xl border border-white/80 bg-white/80 dark:bg-white/10 backdrop-blur-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
        <div className="offwhite-label mb-3">ACTIVITY_HEATMAP</div>
        <Heatmap dates={completedDates} />
      </div>

      <div className="space-y-3">

        {tasks.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#a600ff]/30 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-8 text-center shadow-inner">
            <PencilLine size={28} className="mx-auto mb-3 text-offwhite-orange" />
            <div className="mb-2 text-xl font-black uppercase tracking-tighter">Nessun to-do</div>
            <p className="mx-auto max-w-md font-mono text-[10px] uppercase leading-relaxed tracking-widest text-gray-500">
              Scrivi il primo obiettivo della giornata. Qui compariranno solo i to-do che inserisci tu.
            </p>
          </div>
        ) : (
          tasks.map((task) => {
          const Icon = ICON_MAP[task.iconId] || Circle;
          return (
            <div key={task.id} className="flex items-stretch gap-3">
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-full flex items-center justify-between p-4 border-2 transition-all ${
                  task.completed 
                    ? 'border-black bg-black text-black dark:text-white dark:text-white' 
                    : 'border-gray-100 bg-white text-gray-400 hover:border-black'
                }`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`p-2 ${task.completed ? 'bg-white text-black dark:text-white' : 'bg-gray-50 text-gray-300'}`}>
                    <Icon size={18} />
                  </div>
                  <span className={`font-black text-sm uppercase tracking-tighter ${task.completed ? 'text-black dark:text-white dark:text-white' : 'text-gray-600'}`}>
                    {task.label}
                  </span>
                  <span className={`shrink-0 font-mono text-[9px] font-black uppercase tracking-widest ${task.completed ? 'text-black dark:text-white dark:text-white/70' : 'text-offwhite-orange'}`}>
                    +{task.points ?? TASK_POINTS}
                  </span>
                </div>
                {task.completed ? (
                  <CircleCheck size={20} className="shrink-0 text-black dark:text-white dark:text-white" />
                ) : (
                  <Circle size={20} className="shrink-0 text-gray-200" />
                )}
              </button>

              {task.kind === 'custom' && (
                <button
                  type="button"
                  onClick={() => removeCustomTask(task.id)}
                  className="shrink-0 border-2 border-black px-4 text-black dark:text-white transition-all hover:bg-black hover:text-black dark:text-white dark:text-white"
                  aria-label={`Rimuovi ${task.label}`}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          );
        }))}
      </div>

      <div className="mt-8 p-6 bg-black text-black dark:text-white dark:text-white relative overflow-hidden border-2 border-black">
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase text-gray-400 mb-1">Progresso giornaliero</div>
              <div className="text-3xl font-black tracking-tighter">{Math.round(progress)}%</div>
            </div>
            <TrophyIcon className={progress === 100 ? 'text-offwhite-orange animate-bounce' : 'text-gray-700'} size={32} />
          </div>
          
          <div className="w-full h-2 bg-white/10 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-offwhite-orange"
            />
          </div>
          
          <div className="mt-4 font-mono text-[8px] uppercase text-gray-500 tracking-widest">
            {tasks.length === 0
              ? 'AGGIUNGI I TUOI TO-DO PER INIZIARE'
              : progress === 100
                ? 'TUTTE LE ATTIVITA COMPLETATE! PREMIO SBLOCCATO'
                : 'COMPLETA TUTTE LE ATTIVITA PER OTTENERE PREMI'}
          </div>
        </div>
      </div>
    </div>
  );
};
