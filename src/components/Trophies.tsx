import React, { useState, useEffect } from 'react';
import { SectionHeader } from './SectionHeader';
import { Trophy as TrophyType } from '../types';
import { Award, Star, Zap, Target, Flame, Utensils, Droplets, Moon, CircleCheck } from 'lucide-react';

const INITIAL_TROPHIES: TrophyType[] = [
  { id: '1', title: 'PRIMO_PASSO', description: 'Completa il tuo primo allenamento', unlocked: false, icon: 'Zap', points: 100 },
  { id: '2', title: 'MODALITA_RISPARMIO', description: 'Raggiungi un saldo totale oltre €1000', unlocked: false, icon: 'Target', points: 250 },
  { id: '3', title: 'COSTANZA', description: 'Apri l app per 3 giorni di fila', unlocked: false, icon: 'Flame', points: 150 },
  { id: '4', title: 'LISTA_PULITA', description: 'Svuota tutta la lista della spesa', unlocked: false, icon: 'Star', points: 100 },
  { id: '5', title: 'CHEF_MODE', description: 'Crea la tua prima ricetta', unlocked: false, icon: 'Utensils', points: 100 },
  { id: '6', title: 'IDRATAZIONE_TOP', description: 'Completa il task acqua 3 volte', unlocked: false, icon: 'Droplets', points: 100 },
  { id: '7', title: 'GIORNATA_PERFETTA', description: 'Completa tutta la routine giornaliera', unlocked: false, icon: 'CircleCheck', points: 200 },
];

const IconMap: Record<string, any> = {
  Zap, Target, Flame, Star, Utensils, Droplets, Moon, CircleCheck
};

export const Trophies: React.FC = () => {
  const [trophies, setTrophies] = useState<TrophyType[]>(() => {
    const saved = localStorage.getItem('offwhite_trophies');
    return saved ? JSON.parse(saved) : INITIAL_TROPHIES;
  });

  useEffect(() => {
    const checkTrophies = () => {
      const workouts = JSON.parse(localStorage.getItem('offwhite_workouts') || '[]');
      const accounts = JSON.parse(localStorage.getItem('offwhite_accounts') || '[]');
      const shopping = JSON.parse(localStorage.getItem('offwhite_shopping') || '[]');
      const recipes = JSON.parse(localStorage.getItem('offwhite_recipes') || '[]');
      const checkins = JSON.parse(localStorage.getItem('offwhite_checkins') || '[]');
      const dailyTasks = JSON.parse(localStorage.getItem('offwhite_daily_tasks') || '[]');

      const calculateStreak = (dates: string[]) => {
        if (dates.length === 0) return 0;
        const sortedDates = [...dates].sort().reverse();
        let streak = 1;
        let currentDate = new Date(sortedDates[0]);
        
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i]);
          const diff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            streak++;
            currentDate = prevDate;
          } else if (diff > 1) {
            break;
          }
        }
        return streak;
      };

      const streak = calculateStreak(checkins);
      const totalBalance = accounts.reduce((acc: number, curr: any) => acc + curr.balance, 0);

      let newlyUnlockedPoints = 0;
      const newTrophies = trophies.map(t => {
        if (t.unlocked) return t;
        
        let unlocked = false;
        if (t.id === '1' && workouts.some((w: any) => w.completed)) unlocked = true;
        if (t.id === '2' && totalBalance > 1000) unlocked = true;
        if (t.id === '3' && streak >= 3) unlocked = true;
        if (t.id === '4' && shopping.length > 0 && shopping.every((i: any) => i.bought)) unlocked = true;
        if (t.id === '5' && recipes.length > 2) unlocked = true;
        if (t.id === '7' && dailyTasks.length > 0 && dailyTasks.every((task: any) => task.completed)) unlocked = true;
        
        if (unlocked) {
          newlyUnlockedPoints += t.points;
          return { ...t, unlocked: true };
        }
        return t;
      });

      if (JSON.stringify(newTrophies) !== JSON.stringify(trophies)) {
        setTrophies(newTrophies);
        if (newlyUnlockedPoints > 0) {
          const stats = JSON.parse(localStorage.getItem('offwhite_user_stats') || '{"points":0,"activeTheme":"standard"}');
          stats.points += newlyUnlockedPoints;
          localStorage.setItem('offwhite_user_stats', JSON.stringify(stats));
          window.dispatchEvent(new CustomEvent('stats-update'));
        }
      }
    };

    const interval = setInterval(checkTrophies, 2000);
    window.addEventListener('checkin-update', checkTrophies);
    window.addEventListener('routine-update', checkTrophies);
    return () => {
      clearInterval(interval);
      window.removeEventListener('checkin-update', checkTrophies);
      window.removeEventListener('routine-update', checkTrophies);
    };
  }, [trophies]);

  useEffect(() => {
    localStorage.setItem('offwhite_trophies', JSON.stringify(trophies));
  }, [trophies]);

  return (
    <div className="offwhite-border h-full">
      <SectionHeader title="OBIETTIVI" label="SISTEMA_TRAGUARDI" />
      
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {trophies.map(t => {
          const Icon = IconMap[t.icon] || Award;
          return (
            <div 
              key={t.id} 
              className={`p-4 border-2 flex flex-col items-center text-center transition-all ${t.unlocked ? 'border-black bg-black text-white' : 'border-gray-100 bg-white opacity-40 grayscale'}`}
            >
              <div className={`w-12 h-12 flex items-center justify-center mb-3 ${t.unlocked ? 'bg-white text-black' : 'bg-gray-100 text-gray-300'}`}>
                <Icon size={24} />
              </div>
              <div className={`font-black text-[10px] md:text-xs uppercase tracking-widest mb-1 truncate w-full ${t.unlocked ? 'text-white' : 'text-gray-400'}`}>{t.title}</div>
              <div className="font-mono text-[8px] text-offwhite-orange font-bold mb-1">+{t.points} PTS</div>
              <div className={`font-mono text-[7px] md:text-[8px] leading-tight uppercase line-clamp-2 ${t.unlocked ? 'text-gray-400' : 'text-gray-300'}`}>{t.description}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-black text-white border-2 border-black">
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="font-mono text-[10px] uppercase text-gray-400 mb-1">Completamento</div>
            <div className="text-3xl font-black tracking-tighter">{Math.round((trophies.filter(t => t.unlocked).length / trophies.length) * 100)}%</div>
          </div>
          <Award className="text-offwhite-orange" size={32} />
        </div>
        <div className="w-full h-2 bg-white/10 overflow-hidden">
          <div 
            className="h-full bg-offwhite-orange transition-all duration-1000" 
            style={{ width: `${(trophies.filter(t => t.unlocked).length / trophies.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
