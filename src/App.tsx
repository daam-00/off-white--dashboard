/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Finance } from './components/Finance';
import { Fitness } from './components/Fitness';
import { Diet } from './components/Diet';
import { Shopping } from './components/Shopping';
import { Trophies } from './components/Trophies';
import { DailyRoutine } from './components/DailyRoutine';
import { LayoutDashboard, Wallet, Dumbbell, ShoppingBag, Trophy, Menu, X, Utensils, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'dashboard' | 'finance' | 'fitness' | 'diet' | 'shopping' | 'trophies' | 'routine';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('offwhite_user_stats');
    return saved ? JSON.parse(saved) : { points: 0, activeTheme: 'standard' };
  });

  React.useEffect(() => {
    const handleStatsUpdate = () => {
      const saved = localStorage.getItem('offwhite_user_stats');
      if (saved) setStats(JSON.parse(saved));
    };
    window.addEventListener('stats-update', handleStatsUpdate);
    return () => window.removeEventListener('stats-update', handleStatsUpdate);
  }, []);

  const themeColor = stats.activeTheme === 'theme-blue' ? '#0055FF' : '#FF5C00';

  const navItems = [
    { id: 'dashboard', label: 'PANORAMICA', icon: LayoutDashboard },
    { id: 'routine', label: 'ROUTINE GIORNALIERA', icon: Calendar },
    { id: 'finance', label: 'PORTAFOGLIO', icon: Wallet },
    { id: 'fitness', label: 'ALLENAMENTO', icon: Dumbbell },
    { id: 'diet', label: 'ALIMENTAZIONE', icon: Utensils },
    { id: 'shopping', label: 'SPESA', icon: ShoppingBag },
    { id: 'trophies', label: 'OBIETTIVI', icon: Trophy },
  ];

  const [checkins, setCheckins] = useState<string[]>(() => {
    const saved = localStorage.getItem('offwhite_checkins');
    return saved ? JSON.parse(saved) : [];
  });

  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = checkins.includes(today);

  const handleCheckIn = () => {
    if (!hasCheckedInToday) {
      const updated = [...checkins, today];
      setCheckins(updated);
      localStorage.setItem('offwhite_checkins', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('checkin-update'));
    }
  };

  return (
    <div 
      className="h-screen bg-white flex flex-col md:flex-row overflow-hidden"
      style={{ '--color-offwhite-orange': themeColor } as React.CSSProperties}
    >
      {/* DESKTOP SIDEBAR */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="hidden md:flex bg-white border-r-2 border-black h-full flex-shrink-0 flex-col relative z-50"
      >
        <div className="p-6 mb-8 flex items-center justify-between">
          <div className={`font-black text-2xl tracking-tighter transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            OFF-WHITE™
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-black hover:text-offwhite-orange transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center p-3 transition-all group relative ${
                activeTab === item.id ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-4 font-mono text-[10px] font-bold uppercase tracking-widest"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t-2 border-black">
          <div className="font-mono text-[8px] text-gray-400 uppercase leading-tight">
            © 2026 OFF_WHITE_DASHBOARD<br />
            SISTEMA_PERSONALE
          </div>
        </div>
      </motion.aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-white border-b-2 border-black p-4 flex justify-between items-center z-50 shrink-0">
        <div className="font-black text-xl tracking-tighter">OFF-WHITE™</div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] font-black text-offwhite-orange">{stats.points} PTS</div>
          <div className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            {navItems.find(n => n.id === activeTab)?.label}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-white p-4 md:p-8 relative pb-24 md:pb-8">
        <div className="absolute top-0 right-0 p-4 flex items-center gap-4 pointer-events-none select-none hidden sm:flex">
          <div className="font-mono text-[10px] font-black text-offwhite-orange">{stats.points} OFF-CREDITS</div>
          <div className="font-mono text-[8px] md:text-[10px] text-gray-300">
            "IL_PROGRESSO_E_UN_PERCORSO" // V1.0
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* DAILY CHECK-IN BAR */}
                <div className="offwhite-border bg-black text-white p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="offwhite-label bg-white text-black shrink-0">DAILY_STATUS</div>
                    <div className="font-black text-xl uppercase tracking-tighter truncate">
                      {hasCheckedInToday ? '"CHECK-IN_COMPLETATO"' : '"CHECK-IN_IN_ATTESA"'}
                    </div>
                  </div>
                  <button 
                    onClick={handleCheckIn}
                    disabled={hasCheckedInToday}
                    className={`px-8 py-3 font-mono text-xs uppercase tracking-widest transition-all ${
                      hasCheckedInToday 
                      ? 'bg-white/20 text-white/40 cursor-not-allowed' 
                      : 'bg-offwhite-orange text-white hover:bg-white hover:text-black'
                    }`}
                  >
                    {hasCheckedInToday ? 'COMPLETATO' : 'FAI CHECK-IN'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-6">
                    <DailyRoutine />
                    <Finance />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Fitness />
                      <Diet />
                    </div>
                    <Shopping />
                  </div>
                  <div className="lg:col-span-4">
                    <Trophies />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'routine' && (
              <motion.div key="routine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DailyRoutine />
              </motion.div>
            )}

            {activeTab === 'finance' && (
              <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Finance />
              </motion.div>
            )}

            {activeTab === 'fitness' && (
              <motion.div key="fitness" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Fitness />
              </motion.div>
            )}

            {activeTab === 'diet' && (
              <motion.div key="diet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Diet />
              </motion.div>
            )}

            {activeTab === 'shopping' && (
              <motion.div key="shopping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Shopping />
              </motion.div>
            )}

            {activeTab === 'trophies' && (
              <motion.div key="trophies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Trophies />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black text-white flex justify-around items-center p-2 border-t-2 border-white/10 z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex flex-col items-center p-2 transition-all ${
              activeTab === item.id ? 'text-offwhite-orange' : 'text-white/50'
            }`}
          >
            <item.icon size={20} />
            <span className="font-mono text-[8px] uppercase mt-1 tracking-tighter">
              {item.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
