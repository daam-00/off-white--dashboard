import React, { useState, useEffect } from 'react';
import { SectionHeader } from './SectionHeader';
import { CircleCheck, Circle, Droplets, Dumbbell, Wallet, Utensils, Moon, Trophy as TrophyIcon, Plus, Trash2, PencilLine } from 'lucide-react';
import { motion } from 'motion/react';

interface RoutineTask {
  id: string;
  label: string;
  iconId: string;
  completed: boolean;
  kind?: 'preset' | 'custom';
}

const ICON_MAP: Record<string, any> = {
  water: Droplets,
  workout: Dumbbell,
  finance: Wallet,
  diet: Utensils,
  sleep: Moon,
  custom: PencilLine,
};

const INITIAL_TASKS: RoutineTask[] = [
  { id: 'water', label: 'BEVI 2L DI ACQUA', iconId: 'water', completed: false, kind: 'preset' },
  { id: 'workout', label: '30 MINUTI DI ALLENAMENTO', iconId: 'workout', completed: false, kind: 'preset' },
  { id: 'finance', label: 'REGISTRA LE SPESE', iconId: 'finance', completed: false, kind: 'preset' },
  { id: 'diet', label: 'SEGUI IL PIANO ALIMENTARE', iconId: 'diet', completed: false, kind: 'preset' },
  { id: 'sleep', label: '8 ORE DI SONNO', iconId: 'sleep', completed: false, kind: 'preset' },
];

const TASKS_STORAGE_KEY = 'offwhite_daily_tasks';
const TASKS_UPDATED_KEY = 'offwhite_last_task_update';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function normalizeTasks(tasks: RoutineTask[]) {
  return tasks.map((task) => ({
    ...task,
    kind: task.kind ?? 'preset',
  }));
}

export const DailyRoutine: React.FC = () => {
  const [tasks, setTasks] = useState<RoutineTask[]>(() => {
    const saved = localStorage.getItem(TASKS_STORAGE_KEY);
    const lastUpdate = localStorage.getItem(TASKS_UPDATED_KEY);
    const today = getTodayKey();

    if (lastUpdate !== today) {
      return INITIAL_TASKS;
    }

    if (!saved) {
      return INITIAL_TASKS;
    }

    try {
      return normalizeTasks(JSON.parse(saved) as RoutineTask[]);
    } catch {
      return INITIAL_TASKS;
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
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
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
      },
    ]);
    setCustomGoal('');
  };

  const removeCustomTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const progress = tasks.length ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;

  return (
    <div className="offwhite-border h-full">
      <SectionHeader title="ROUTINE GIORNALIERA" label="TRACCIATORE_ROUTINE_V1.0" />

      <div className="mb-6 border-2 border-black bg-gray-50 p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="offwhite-label mb-1">OBIETTIVI_PERSONALI</div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
              Aggiungi i tuoi to-do personali e salvali automaticamente per oggi.
            </p>
          </div>
        </div>

        <form onSubmit={addCustomTask} className="flex flex-col gap-3 md:flex-row">
          <input
            value={customGoal}
            onChange={(event) => setCustomGoal(event.target.value)}
            placeholder="SCRIVI L OBIETTIVO DI OGGI"
            className="min-w-0 flex-1 border-2 border-black bg-white px-4 py-3 font-mono text-xs uppercase tracking-widest outline-none placeholder:text-gray-300 focus:border-offwhite-orange"
            maxLength={80}
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 border-2 border-black bg-black px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-offwhite-orange"
          >
            <Plus size={16} />
            Salva To-Do
          </button>
        </form>
      </div>
      
      <div className="space-y-3">
        {tasks.map((task) => {
          const Icon = ICON_MAP[task.iconId] || Circle;
          return (
            <div key={task.id} className="flex items-stretch gap-3">
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-full flex items-center justify-between p-4 border-2 transition-all ${
                  task.completed 
                    ? 'border-black bg-black text-white' 
                    : 'border-gray-100 bg-white text-gray-400 hover:border-black'
                }`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`p-2 ${task.completed ? 'bg-white text-black' : 'bg-gray-50 text-gray-300'}`}>
                    <Icon size={18} />
                  </div>
                  <span className={`font-black text-sm uppercase tracking-tighter ${task.completed ? 'text-white' : 'text-gray-600'}`}>
                    {task.label}
                  </span>
                </div>
                {task.completed ? (
                  <CircleCheck size={20} className="shrink-0 text-white" />
                ) : (
                  <Circle size={20} className="shrink-0 text-gray-200" />
                )}
              </button>

              {task.kind === 'custom' && (
                <button
                  type="button"
                  onClick={() => removeCustomTask(task.id)}
                  className="shrink-0 border-2 border-black px-4 text-black transition-all hover:bg-black hover:text-white"
                  aria-label={`Rimuovi ${task.label}`}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-black text-white relative overflow-hidden border-2 border-black">
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
            {progress === 100 ? 'TUTTE LE ATTIVITA COMPLETATE! PREMIO SBLOCCATO' : 'COMPLETA TUTTE LE ATTIVITA PER OTTENERE PREMI'}
          </div>
        </div>
      </div>
    </div>
  );
};
