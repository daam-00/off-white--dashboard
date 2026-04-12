import React, { useMemo, useState } from 'react';
import { Dumbbell, Flame, Shield, Zap } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

type Exercise = {
  name: string;
  sets: number;
  reps: number;
};

type Block = {
  label: string;
  exercises: Exercise[];
};

type DayKey = 'A' | 'B';

const DAYS: Record<
  DayKey,
  {
    title: string;
    subtitle: string;
    blocks: Block[];
  }
> = {
  A: {
    title: 'GIORNO A',
    subtitle: 'Spinta, lower body e core',
    blocks: [
      {
        label: 'BLOCCO A',
        exercises: [
          { name: 'AFFONDI INVERSI (2 MANUBRI)', sets: 3, reps: 8 },
          { name: 'PIEGAMENTI', sets: 3, reps: 8 },
          { name: 'LAT MACHINE PRESA INVERSA', sets: 3, reps: 10 },
        ],
      },
      {
        label: 'BLOCCO B',
        exercises: [
          { name: 'BRIDGE FITBALL (DISTENDERE & TORNARE)', sets: 3, reps: 12 },
          { name: 'TRICIPITI CORDE INTRECCIATE', sets: 3, reps: 12 },
          { name: 'REVERSE FLY MANUBRI PANCA 30', sets: 3, reps: 12 },
          { name: 'ABS (SIDE PLANK / CRUNCH INVERSO)', sets: 3, reps: 15 },
        ],
      },
    ],
  },
  B: {
    title: 'GIORNO B',
    subtitle: 'Tirata, gambe e spalle',
    blocks: [
      {
        label: 'BLOCCO A',
        exercises: [
          { name: 'GOBLET SQUAT (DISCESA LENTA)', sets: 3, reps: 8 },
          { name: 'SPINTE MANUBRI PANCA PIANA', sets: 3, reps: 8 },
          { name: 'PULLEY ERCOLINO PRESA SUPINA', sets: 3, reps: 10 },
        ],
      },
      {
        label: 'BLOCCO B',
        exercises: [
          { name: 'SITTED CALF (FLUIDI & CONTROLLATI)', sets: 3, reps: 12 },
          { name: 'CURL ERCOLINO CAVI BASSI', sets: 3, reps: 12 },
          { name: 'ALZATE LATERALI SEDUTI (DISCESA LENTA)', sets: 3, reps: 12 },
          { name: 'ABS (KNEE TO CHEST)', sets: 3, reps: 12 },
        ],
      },
    ],
  },
};

function getExerciseVisual(name: string) {
  const normalized = name.toLowerCase();

  if (
    normalized.includes('affondi') ||
    normalized.includes('squat') ||
    normalized.includes('calf')
  ) {
    return { Icon: Flame, label: 'LOWER', className: 'training-visual-lower' };
  }

  if (
    normalized.includes('piegamenti') ||
    normalized.includes('spinte') ||
    normalized.includes('tricipiti')
  ) {
    return { Icon: Zap, label: 'PUSH', className: 'training-visual-push' };
  }

  if (
    normalized.includes('abs') ||
    normalized.includes('plank') ||
    normalized.includes('crunch') ||
    normalized.includes('bridge') ||
    normalized.includes('knee to chest')
  ) {
    return { Icon: Shield, label: 'CORE', className: 'training-visual-core' };
  }

  return { Icon: Dumbbell, label: 'PULL', className: 'training-visual-pull' };
}

export const Fitness: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<DayKey>('A');
  const currentDay = DAYS[selectedDay];

  const totalExercises = useMemo(
    () => currentDay.blocks.reduce((sum, block) => sum + block.exercises.length, 0),
    [currentDay],
  );

  return (
    <div className="offwhite-border h-full">
      <SectionHeader title="ALLENAMENTO" label="SCHEDA_SETTIMANALE" />

      <div className="mt-4 flex gap-2">
        {(['A', 'B'] as const).map((day) => {
          const active = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`flex-1 border-2 px-4 py-3 text-left transition-all ${
                active
                  ? 'border-black bg-black text-white'
                  : 'border-black bg-white text-black hover:bg-gray-50'
              }`}
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.28em]">
                GIORNO
              </div>
              <div className="mt-1 text-2xl font-black leading-none">{day}</div>
            </button>
          );
        })}
      </div>

      <div className="training-summary-panel mt-4 border-2 border-black p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-offwhite-orange">
              {currentDay.title}
            </div>
            <div className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">
              {currentDay.subtitle}
            </div>
          </div>
          <div className="border-2 border-black px-3 py-2 text-right">
            <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-gray-500">
              Esercizi
            </div>
            <div className="mt-1 text-2xl font-black">{totalExercises}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {currentDay.blocks.map((block) => (
          <section key={block.label}>
            <div className="mb-3 flex items-center justify-between border-b-2 border-black pb-2">
              <div className="text-xl font-black uppercase tracking-tight">{block.label}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-gray-500">
                {block.exercises.length} esercizi
              </div>
            </div>

            <div className="grid gap-3">
              {block.exercises.map((exercise) => {
                const visual = getExerciseVisual(exercise.name);

                return (
                  <article key={`${block.label}-${exercise.name}`} className="training-exercise-card border-2 border-black p-3 md:p-4">
                    <div className="grid grid-cols-[84px_1fr] gap-3 md:grid-cols-[110px_1fr] md:gap-4">
                      <div className={`training-visual ${visual.className} min-h-24 border-2 border-black`}>
                        <visual.Icon size={24} />
                        <div className="training-visual-caption">{visual.label}</div>
                      </div>

                      <div className="min-w-0">
                        <div className="inline-block border border-black px-2 py-1 font-mono text-[8px] uppercase tracking-[0.22em] text-offwhite-orange">
                          {exercise.sets} serie x {exercise.reps} rip
                        </div>
                        <h3 className="mt-3 text-base font-black uppercase leading-tight tracking-tight md:text-xl">
                          {exercise.name}
                        </h3>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
