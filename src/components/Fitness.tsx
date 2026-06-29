import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, Dumbbell, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import type { Workout } from '../types';

// ─── SCHEDA THSEDICI ─────────────────────────────────────────────────────────

const THSEDICI_SCHEDULE = [
  {
    day: 'GIORNO A',
    label: 'FULLBODY A',
    color: 'bg-black text-white',
    accentBar: 'bg-offwhite-orange',
    blocks: [
      {
        label: 'BLOCCO A',
        note: '2-3 giri · recupero breve tra esercizi',
        exercises: [
          { name: 'Affondi inversi (2 manubri)', sets: 3, reps: 8 },
          { name: 'Piegamenti', sets: 3, reps: 8 },
          { name: 'Lat machine presa inversa', sets: 3, reps: 10 },
        ],
      },
      {
        label: 'BLOCCO B',
        note: '2-3 giri · recupero ampio a fine blocco',
        exercises: [
          { name: 'Bridge fitball (distendi e torna)', sets: 3, reps: 12 },
          { name: 'Tricipiti corde intrecciate', sets: 3, reps: 12 },
          { name: 'Reverse fly manubri panca 30°', sets: 3, reps: 12 },
          { name: 'Abs — Side plank / Crunch inverso', sets: 3, reps: 15 },
        ],
      },
    ],
  },
  {
    day: 'GIORNO B',
    label: 'FULLBODY B',
    color: 'bg-white text-black',
    accentBar: 'bg-black',
    blocks: [
      {
        label: 'BLOCCO A',
        note: '2-3 giri · recupero breve tra esercizi',
        exercises: [
          { name: 'Goblet squat (discesa lenta)', sets: 3, reps: 8 },
          { name: 'Spinte manubri panca piana', sets: 3, reps: 8 },
          { name: 'Pulley ercolino presa supina', sets: 3, reps: 10 },
        ],
      },
      {
        label: 'BLOCCO B',
        note: '2-3 giri · recupero ampio a fine blocco',
        exercises: [
          { name: 'Sitted calf (fluidi e controllati)', sets: 3, reps: 12 },
          { name: 'Curl ercolino cavi bassi', sets: 3, reps: 12 },
          { name: 'Alzate laterali seduti (discesa lenta)', sets: 3, reps: 12 },
          { name: 'Abs — Knee to chest', sets: 3, reps: 12 },
        ],
      },
    ],
  },
] as const;

type ExerciseKey = `${number}-${number}-${number}`;

function ThsediciView() {
  const [activeDay, setActiveDay] = useState<0 | 1>(0);
  const [done, setDone] = useState<Set<ExerciseKey>>(() => {
    try {
      const raw = localStorage.getItem('fitness_thsedici_done');
      return raw ? new Set(JSON.parse(raw) as ExerciseKey[]) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem('fitness_thsedici_done', JSON.stringify([...done]));
  }, [done]);

  const toggle = (key: ExerciseKey) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const resetDay = () => {
    setDone((prev) => {
      const next = new Set(prev);
      const day = THSEDICI_SCHEDULE[activeDay];
      day.blocks.forEach((block, bi) => {
        block.exercises.forEach((_, ei) => {
          next.delete(`${activeDay}-${bi}-${ei}` as ExerciseKey);
        });
      });
      return next;
    });
  };

  const currentDay = THSEDICI_SCHEDULE[activeDay];

  const totalExercises = currentDay.blocks.reduce((sum, b) => sum + b.exercises.length, 0);
  const completedExercises = currentDay.blocks.reduce(
    (sum, b, bi) =>
      sum + b.exercises.filter((_, ei) => done.has(`${activeDay}-${bi}-${ei}` as ExerciseKey)).length,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="offwhite-border overflow-hidden">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="offwhite-label">SCHEDA_ALLENAMENTO</div>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight">
              Workout Split 2 Giorni
            </h2>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              Alterna Giorno A e Giorno B ogni sessione. Completa 2-3 giri per blocco.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {THSEDICI_SCHEDULE.map((s, i) => (
              <button
                key={s.day}
                type="button"
                onClick={() => setActiveDay(i as 0 | 1)}
                className={`border-2 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeDay === i
                    ? 'border-black bg-black text-white'
                    : 'border-black/20 bg-white text-black hover:border-black'
                }`}
              >
                {s.day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 border-2 border-black bg-white px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-gray-400 truncate">
              {currentDay.day} · {currentDay.label}
            </span>
            <span className="shrink-0 font-mono text-[10px] font-black text-offwhite-orange">
              {completedExercises}/{totalExercises}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden border border-black/20 bg-gray-100">
            <div
              className="h-full bg-offwhite-orange transition-all duration-500"
              style={{ width: `${totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={resetDay}
          title="Reset giorno"
          className="shrink-0 border border-black/20 bg-white p-2 text-gray-400 transition-all hover:border-offwhite-orange hover:text-offwhite-orange"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Blocks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {currentDay.blocks.map((block, bi) => (
          <div key={block.label} className="border-2 border-black bg-white">
            {/* Block header */}
            <div className="border-b-2 border-black bg-black px-4 py-3 text-white">
              <div className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/40">
                {currentDay.day}
              </div>
              <div className="mt-0.5 text-base font-black uppercase leading-tight tracking-tight">
                {block.label}
              </div>
              <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-white/50">
                {block.note}
              </div>
            </div>

            {/* Exercises */}
            <div className="divide-y-2 divide-black/10">
              {block.exercises.map((ex, ei) => {
                const key = `${activeDay}-${bi}-${ei}` as ExerciseKey;
                const isDone = done.has(key);
                return (
                  <button
                    key={ex.name}
                    type="button"
                    onClick={() => toggle(key)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-gray-50 ${isDone ? 'opacity-50' : ''}`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all ${
                        isDone ? 'border-black bg-black text-white' : 'border-black bg-white'
                      }`}
                    >
                      {isDone ? <Check size={11} /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-black uppercase leading-snug tracking-tight ${isDone ? 'text-gray-400 line-through' : 'text-black'}`}
                      >
                        {ex.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-gray-400">
                        {ex.sets} serie · {ex.reps} rip
                      </div>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 transition-opacity ${isDone ? 'opacity-20' : 'opacity-25'}`} />
                  </button>
                );
              })}
            </div>

            {/* Block footer */}
            <div className="border-t border-black/10 bg-gray-50 px-4 py-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-gray-400">
                {block.exercises.filter((_, ei) => done.has(`${activeDay}-${bi}-${ei}` as ExerciseKey)).length}/
                {block.exercises.length} completati
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Guide */}
      <div className="border-2 border-black/15 bg-gray-50 px-5 py-4">
        <div className="mb-3 font-mono text-[9px] font-black uppercase tracking-[0.28em] text-gray-400">
          Come seguire la scheda
        </div>
        <ol className="space-y-1.5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-gray-600">
          <li><span className="mr-2 font-black text-offwhite-orange">1.</span>Riscaldamento e mobilità prima di partire.</li>
          <li><span className="mr-2 font-black text-offwhite-orange">2.</span>Esegui 2-3 giri del Blocco A, poi 2-3 giri del Blocco B.</li>
          <li><span className="mr-2 font-black text-offwhite-orange">3.</span>Recupero breve tra esercizi dentro il blocco, più lungo tra blocchi.</li>
          <li><span className="mr-2 font-black text-offwhite-orange">4.</span>Alterna Giorno A e Giorno B a ogni sessione.</li>
        </ol>
      </div>
    </div>
  );
}

// ─── SCHEDA PERSONALE (altri utenti) ─────────────────────────────────────────

type PersonalGroup = {
  id: string;
  label: string;
  exercises: Workout[];
};

function PersonalView() {
  const [groups, setGroups] = useState<PersonalGroup[]>(() => {
    try {
      const raw = localStorage.getItem('fitness_personal_groups');
      if (raw) return JSON.parse(raw) as PersonalGroup[];
    } catch {}
    // migrate legacy flat workouts
    try {
      const legacy = localStorage.getItem('offwhite_workouts');
      if (legacy) {
        const workouts = JSON.parse(legacy) as Workout[];
        if (workouts.length > 0) {
          return [{ id: crypto.randomUUID(), label: 'Scheda', exercises: workouts }];
        }
      }
    } catch {}
    return [];
  });

  const [groupName, setGroupName] = useState('');
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('');
  const [exReps, setExReps] = useState('');
  const [targetGroup, setTargetGroup] = useState<string>('');
  const [showAddGroup, setShowAddGroup] = useState(false);

  useEffect(() => {
    localStorage.setItem('fitness_personal_groups', JSON.stringify(groups));
    // keep legacy key in sync for home metrics
    const allEx = groups.flatMap((g) => g.exercises);
    localStorage.setItem('offwhite_workouts', JSON.stringify(allEx));
    window.dispatchEvent(new CustomEvent('dashboard-data-update'));
  }, [groups]);

  // auto-select first group when groups change
  useEffect(() => {
    if (!targetGroup && groups.length > 0) setTargetGroup(groups[0].id);
  }, [groups, targetGroup]);

  const addGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const label = groupName.trim().toUpperCase();
    if (!label) return;
    const newGroup: PersonalGroup = { id: crypto.randomUUID(), label, exercises: [] };
    setGroups((g) => [...g, newGroup]);
    setTargetGroup(newGroup.id);
    setGroupName('');
    setShowAddGroup(false);
  };

  const deleteGroup = (id: string) => {
    if (!window.confirm('Eliminare questo gruppo e tutti i suoi esercizi?')) return;
    setGroups((g) => g.filter((gr) => gr.id !== id));
    if (targetGroup === id) setTargetGroup(groups.find((gr) => gr.id !== id)?.id ?? '');
  };

  const addExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exName.trim() || !targetGroup) return;
    const ex: Workout = {
      id: crypto.randomUUID(),
      name: exName.trim().toUpperCase(),
      sets: Number.parseInt(exSets, 10) || 0,
      reps: Number.parseInt(exReps, 10) || 0,
      weight: 0,
      completed: false,
    };
    setGroups((g) =>
      g.map((gr) => gr.id === targetGroup ? { ...gr, exercises: [...gr.exercises, ex] } : gr),
    );
    setExName('');
    setExSets('');
    setExReps('');
  };

  const toggleEx = (groupId: string, exId: string) => {
    setGroups((g) =>
      g.map((gr) =>
        gr.id === groupId
          ? { ...gr, exercises: gr.exercises.map((ex) => ex.id === exId ? { ...ex, completed: !ex.completed } : ex) }
          : gr,
      ),
    );
  };

  const deleteEx = (groupId: string, exId: string) => {
    setGroups((g) =>
      g.map((gr) =>
        gr.id === groupId ? { ...gr, exercises: gr.exercises.filter((ex) => ex.id !== exId) } : gr,
      ),
    );
  };

  const totalAll = groups.reduce((s, g) => s + g.exercises.length, 0);
  const doneAll = groups.reduce((s, g) => s + g.exercises.filter((e) => e.completed).length, 0);

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      {totalAll > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/60 px-5 py-3 backdrop-blur-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
            Organizza per giorno, muscolo o tipo.
          </p>
          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">Completati</div>
            <strong className="mt-0.5 block text-xl font-black tracking-tight text-offwhite-orange">
              {doneAll}/{totalAll}
            </strong>
          </div>
        </div>
      )}

      {/* Add group */}
      {showAddGroup ? (
        <form onSubmit={addGroup} className="flex gap-2 border-2 border-black bg-white p-3">
          <input
            autoFocus
            type="text"
            placeholder="NOME GRUPPO (es. GIORNO 1 / GAMBE / PUSH)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="flex-1 border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none transition-all"
          />
          <button type="submit" className="bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white hover:bg-offwhite-orange hover:text-black transition-colors">
            Crea
          </button>
          <button type="button" onClick={() => setShowAddGroup(false)} className="border-2 border-black px-3 py-2 text-gray-400 hover:text-black transition-colors">
            ✕
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddGroup(true)}
          className="flex w-full items-center gap-3 border-2 border-dashed border-black/30 bg-white p-4 font-mono text-[10px] uppercase tracking-[0.24em] text-gray-400 transition-all hover:border-black hover:text-black"
        >
          <Plus size={16} />
          Aggiungi gruppo esercizi
        </button>
      )}

      {/* Groups */}
      {groups.length === 0 && (
        <div className="border-2 border-dashed border-black/20 py-16 text-center">
          <Dumbbell className="mx-auto mb-4 text-gray-200" size={40} />
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
            Nessun gruppo ancora. Crea il primo per iniziare.
          </div>
        </div>
      )}

      <div className="space-y-6">
        {groups.map((group) => {
          const groupDone = group.exercises.filter((e) => e.completed).length;
          const isTarget = targetGroup === group.id;

          return (
            <div key={group.id} className={`border-2 transition-all ${isTarget ? 'border-black' : 'border-black/20'}`}>
              {/* Group header */}
              <div
                className={`flex items-center justify-between px-5 py-3 cursor-pointer ${isTarget ? 'bg-black text-white' : 'bg-gray-50 text-black hover:bg-gray-100'}`}
                onClick={() => setTargetGroup(isTarget ? '' : group.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="font-black uppercase tracking-tight">{group.label}</div>
                  <div className={`font-mono text-[9px] uppercase tracking-[0.22em] ${isTarget ? 'text-white/50' : 'text-gray-400'}`}>
                    {groupDone}/{group.exercises.length} esercizi
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                    className={`p-1.5 transition-colors ${isTarget ? 'text-white/40 hover:text-offwhite-orange' : 'text-gray-300 hover:text-red-400'}`}
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${isTarget ? 'rotate-90 text-white/50' : 'text-gray-400'}`}
                  />
                </div>
              </div>

              {/* Progress bar */}
              {group.exercises.length > 0 && (
                <div className="h-1.5 bg-gray-100">
                  <div
                    className="h-full bg-offwhite-orange transition-all"
                    style={{ width: `${(groupDone / group.exercises.length) * 100}%` }}
                  />
                </div>
              )}

              {/* Exercises list */}
              {group.exercises.length === 0 && isTarget && (
                <div className="px-5 py-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">
                  Nessun esercizio. Aggiungine uno qui sotto.
                </div>
              )}

              {group.exercises.length > 0 && (
                <div className="divide-y divide-black/8">
                  {group.exercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className={`flex items-center gap-4 px-5 py-3.5 transition-all ${ex.completed ? 'opacity-50' : 'hover:bg-gray-50'}`}
                    >
                      <span className="w-5 shrink-0 font-mono text-[9px] text-gray-300 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleEx(group.id, ex.id)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all ${ex.completed ? 'border-black bg-black text-white' : 'border-black bg-white'}`}
                      >
                        {ex.completed ? <Check size={12} /> : null}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className={`font-black uppercase tracking-tight ${ex.completed ? 'line-through text-gray-400' : 'text-black'}`}>
                          {ex.name}
                        </div>
                        {(ex.sets > 0 || ex.reps > 0) && (
                          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
                            {ex.sets > 0 ? `${ex.sets} serie` : ''}
                            {ex.sets > 0 && ex.reps > 0 ? ' × ' : ''}
                            {ex.reps > 0 ? `${ex.reps} rip` : ''}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteEx(group.id, ex.id)}
                        className="shrink-0 text-gray-200 transition-colors hover:text-offwhite-orange"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add exercise form (only for selected group) */}
              {isTarget && (
                <form
                  onSubmit={addExercise}
                  className="border-t-2 border-black/10 bg-gray-50 p-4"
                >
                  <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.24em] text-gray-400">
                    Aggiungi esercizio a {group.label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      placeholder="NOME ESERCIZIO"
                      value={exName}
                      onChange={(e) => setExName(e.target.value)}
                      className="min-w-0 flex-[3] border-2 border-black p-2.5 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none transition-all"
                    />
                    <input
                      type="number"
                      placeholder="SERIE"
                      value={exSets}
                      onChange={(e) => setExSets(e.target.value)}
                      className="w-20 border-2 border-black p-2.5 font-mono text-xs focus:bg-black focus:text-white focus:outline-none transition-all"
                    />
                    <input
                      type="number"
                      placeholder="RIP"
                      value={exReps}
                      onChange={(e) => setExReps(e.target.value)}
                      className="w-20 border-2 border-black p-2.5 font-mono text-xs focus:bg-black focus:text-white focus:outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!exName.trim()}
                      className="bg-black px-4 py-2.5 text-white transition-colors hover:bg-offwhite-orange hover:text-black disabled:opacity-30"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────

type FitnessProps = {
  ownerEmail?: string | null;
};

const THSEDICI_EMAILS = ['thsedici@gmail.com'];

export const Fitness: React.FC<FitnessProps> = ({ ownerEmail }) => {
  const isThsedici = ownerEmail
    ? THSEDICI_EMAILS.includes(ownerEmail.toLowerCase().trim())
    : false;

  return (
    <div className="offwhite-border h-full">
      <SectionHeader 
        title={isThsedici ? 'Workout Split' : 'I Miei Allenamenti'} 
        label={isThsedici ? 'SPLIT_2_GIORNI' : 'SCHEDA_PERSONALE'}
        subtitle={isThsedici ? undefined : 'Organizza gli esercizi in gruppi — per giorno, muscolo o tipo.'}
      />
      <div className="mt-5">
        {isThsedici ? <ThsediciView /> : <PersonalView />}
      </div>
    </div>
  );
};
