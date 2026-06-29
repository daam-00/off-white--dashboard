import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface HeatmapProps {
  dates: string[];
}

export const Heatmap: React.FC<HeatmapProps> = ({ dates }) => {
  const { weeks, maxStreak, currentStreak } = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dateSet = new Set(dates);
    
    // Calculate streak
    let curr = 0;
    let maxStr = 0;
    let tempStr = 0;
    const sortedDates = [...dates].sort();
    
    // simple streak calculation (can be improved)
    let cursor = new Date(today);
    const todayKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (!dateSet.has(todayKey)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (dateSet.has(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`)) {
      curr++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Build last 12 weeks for heatmap (84 days)
    const days = [];
    cursor = new Date(today);
    cursor.setDate(cursor.getDate() - 83); // 12 weeks ago
    for (let i = 0; i < 84; i++) {
      const dKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      days.push({ date: dKey, active: dateSet.has(dKey) });
      cursor.setDate(cursor.getDate() + 1);
    }

    const wks = [];
    for (let i = 0; i < days.length; i += 7) {
      wks.push(days.slice(i, i + 7));
    }

    return { weeks: wks, maxStreak: maxStr, currentStreak: curr };
  }, [dates]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map((day, j) => (
              <div 
                key={day.date} 
                className={`w-4 h-4 rounded-sm transition-all duration-300 ${day.active ? 'bg-offwhite-orange/80 shadow-[0_0_8px_rgba(255,92,0,0.6)]' : 'bg-black/5'}`}
                title={day.date}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-4 font-mono text-[10px] uppercase tracking-widest text-black/50">
        <div>STREAK: <strong className="text-offwhite-orange">{currentStreak}</strong></div>
        <div>TOTAL: <strong>{dates.length}</strong></div>
      </div>
    </div>
  );
};
