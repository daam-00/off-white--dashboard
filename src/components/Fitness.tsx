import React, { useState, useEffect } from 'react';
import { SectionHeader } from './SectionHeader';
import { Workout } from '../types';
import { Plus, Check, Trash2, Dumbbell, Zap, Info } from 'lucide-react';

const ROUTINES = {
  'FULLBODY_A': {
    name: 'FULLBODY_A',
    blocks: [
      {
        label: 'BLOCCO_A',
        exercises: [
          { name: 'AFFONDI INVERSI (2 MANUBRI)', sets: 3, reps: 8 },
          { name: 'PIEGAMENTI', sets: 3, reps: 8 },
          { name: 'LAT MACHINE PRESA INVERSA', sets: 3, reps: 10 },
        ]
      },
      {
        label: 'BLOCCO_B',
        exercises: [
          { name: 'BRIDGE FITBALL (DISTENDERE & TORNARE)', sets: 3, reps: 12 },
          { name: 'TRICIPITI CORDE INTRECCIATE', sets: 3, reps: 12 },
          { name: 'REVERSE FLY MANUBRI PANCA 30', sets: 3, reps: 12 },
          { name: 'ABS (SIDE PLANK / CRUNCH INVERSO)', sets: 3, reps: 15 },
        ]
      }
    ]
  },
  'FULLBODY_B': {
    name: 'FULLBODY_B',
    blocks: [
      {
        label: 'BLOCCO_A',
        exercises: [
          { name: 'GOBLET SQUAT (DISCESA LENTA)', sets: 3, reps: 8 },
          { name: 'SPINTE MANUBRI PANCA PIANA', sets: 3, reps: 8 },
          { name: 'PULLEY ERCOLINO PRESA SUPINA', sets: 3, reps: 10 },
        ]
      },
      {
        label: 'BLOCCO_B',
        exercises: [
          { name: 'SITTED CALF (FLUIDI & CONTROLLATI)', sets: 3, reps: 12 },
          { name: 'CURL ERCOLINO CAVI BASSI', sets: 3, reps: 12 },
          { name: 'ALZATE LATERALI SEDUTI (DISCESA LENTA)', sets: 3, reps: 12 },
          { name: 'ABS (KNEE TO CHEST)', sets: 3, reps: 12 },
        ]
      }
    ]
  }
};

export const Fitness: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    const saved = localStorage.getItem('offwhite_workouts');
    return saved ? JSON.parse(saved) : [];
  });
  const [name, setName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    localStorage.setItem('offwhite_workouts', JSON.stringify(workouts));
  }, [workouts]);

  const addWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const newWorkout: Workout = {
      id: crypto.randomUUID(),
      name,
      sets: parseInt(sets) || 0,
      reps: parseInt(reps) || 0,
      weight: 0,
      completed: false
    };
    setWorkouts([...workouts, newWorkout]);
    setName('');
    setSets('');
    setReps('');
  };

  const loadRoutine = (routineKey: keyof typeof ROUTINES) => {
    const routine = ROUTINES[routineKey];
    const newWorkouts: Workout[] = routine.blocks.flatMap(block => 
      block.exercises.map(ex => ({
        id: crypto.randomUUID(),
        name: `${block.label}: ${ex.name}`,
        sets: ex.sets,
        reps: ex.reps,
        weight: 0,
        completed: false
      }))
    );
    setWorkouts([...workouts, ...newWorkouts]);
    setShowPresets(false);
  };

  const toggleWorkout = (id: string) => {
    setWorkouts(workouts.map(w => w.id === id ? { ...w, completed: !w.completed } : w));
  };

  const deleteWorkout = (id: string) => {
    setWorkouts(workouts.filter(w => w.id !== id));
  };

  const clearWorkouts = () => {
    if (confirm('CLEAR ALL WORKOUTS?')) {
      setWorkouts([]);
    }
  };

  return (
    <div className="offwhite-border h-full">
      <div className="flex justify-between items-start">
        <SectionHeader title="ALLENAMENTO" label="REGISTRO_ALLENAMENTI_V2.0" />
        <div className="flex gap-2">
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className={`p-2 border-2 transition-all ${showGuide ? 'bg-black border-black text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-black hover:text-black'}`}
            title="Guida allenamento"
          >
            <Info size={18} />
          </button>
          <button 
            onClick={() => setShowPresets(!showPresets)}
            className={`p-2 border-2 transition-all ${showPresets ? 'bg-black border-black text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-black hover:text-black'}`}
            title="Carica routine"
          >
            <Zap size={18} />
          </button>
          {workouts.length > 0 && (
            <button 
              onClick={clearWorkouts}
              className="p-2 border-2 border-gray-100 bg-white text-gray-400 hover:border-offwhite-orange hover:text-offwhite-orange transition-all"
              title="Cancella tutto"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {showGuide && (
        <div className="mb-6 p-4 bg-gray-50 border-2 border-black space-y-4">
          <div className="font-black text-xs uppercase tracking-widest border-b-2 border-black pb-2 text-black">
            "GUIDA_ALLENAMENTO"
          </div>
          <div className="space-y-3 font-mono text-[10px] leading-relaxed uppercase">
            <p className="font-bold text-offwhite-orange">1. RISCALDAMENTO & MOBILITÀ</p>
            <p className="text-gray-600">Prestare attenzione ad effettuare un buon riscaldamento soprattutto quando si cambia dalla parte bassa alla parte alta o viceversa.</p>
            
            <p className="font-bold text-offwhite-orange">2. STRUTTURA CIRCUITO</p>
            <p className="text-gray-600">Effettuare da 2 a 3 giri per il BLOCCO A e il BLOCCO B.</p>
            <p className="text-gray-600">Effettuare un ultimo giro completo che comprende entrambi i blocchi come unico circuito.</p>
            
            <p className="font-bold text-offwhite-orange">3. RECUPERO</p>
            <p className="text-gray-600">➤ 20” tra gli esercizi dello stesso blocco.</p>
            <p className="text-gray-600">➤ 75-90” alla fine di ogni blocco.</p>
          </div>
        </div>
      )}

      {showPresets && (
        <div className="mb-6 p-4 bg-black text-white space-y-4 border-2 border-black">
          <div className="font-mono text-[10px] uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2 text-gray-400">
            <Info size={12} /> Seleziona routine
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(ROUTINES).map((key) => (
              <button
                key={key}
                onClick={() => loadRoutine(key as keyof typeof ROUTINES)}
                className="p-3 border border-white/10 hover:bg-offwhite-orange hover:border-offwhite-orange transition-all font-black text-xs tracking-tighter uppercase"
              >
                {key}
              </button>
            ))}
          </div>
          <div className="font-mono text-[8px] text-gray-500 leading-tight uppercase">
            * CARICARE UNA ROUTINE AGGIUNGE GLI ESERCIZI ALLA LISTA ATTUALE.
            * SEGUI I BLOCCHI A E B COME INDICATO NEL TUO PIANO.
          </div>
        </div>
      )}
      
      <form onSubmit={addWorkout} className="mb-6 md:mb-8 space-y-2">
        <input 
          type="text" 
          placeholder="NOME ESERCIZIO"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border-2 border-black p-3 font-mono text-xs uppercase focus:outline-none focus:bg-black focus:text-white transition-all"
        />
        <div className="flex gap-2">
          <input 
            type="number" 
            placeholder="SERIE"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className="flex-1 border-2 border-black p-3 font-mono text-xs focus:outline-none focus:bg-black focus:text-white transition-all"
          />
          <input 
            type="number" 
            placeholder="RIPETIZIONI"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="flex-1 border-2 border-black p-3 font-mono text-xs focus:outline-none focus:bg-black focus:text-white transition-all"
          />
          <button type="submit" className="bg-black text-white p-3 px-6 hover:bg-offwhite-orange transition-colors">
            <Plus size={20} />
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {workouts.map(w => (
          <div key={w.id} className={`flex items-center justify-between p-4 border-2 transition-all group ${w.completed ? 'border-gray-50 bg-gray-50/50 opacity-50' : 'border-black bg-white hover:border-offwhite-orange'}`}>
            <div className="flex items-center gap-4 overflow-hidden">
              <button 
                onClick={() => toggleWorkout(w.id)}
                className={`w-6 h-6 border-2 flex items-center justify-center transition-all shrink-0 ${w.completed ? 'bg-black border-black text-white' : 'bg-white border-black text-white'}`}
              >
                {w.completed && <Check size={14} />}
              </button>
              <div className="overflow-hidden">
                <div className={`font-black text-lg md:text-xl tracking-tighter uppercase truncate ${w.completed ? 'line-through text-gray-400' : 'text-black'}`}>
                  {w.name}
                </div>
                <div className="font-mono text-[8px] md:text-[10px] text-gray-400 uppercase font-bold">
                  {w.sets} SERIE × {w.reps} RIP
                </div>
              </div>
            </div>
            <button onClick={() => deleteWorkout(w.id)} className="text-gray-300 hover:text-offwhite-orange transition-colors shrink-0">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {workouts.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-100">
            <Dumbbell className="mx-auto mb-2 text-gray-200" size={32} />
            <div className="font-mono text-[10px] md:text-xs text-gray-300 uppercase font-bold">Nessun allenamento attivo</div>
          </div>
        )}
      </div>
    </div>
  );
};
