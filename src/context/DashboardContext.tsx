import React, { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import { Sparkles, Trophy, Calendar, Utensils, BookOpen, Dumbbell, Wallet, ShoppingBag } from 'lucide-react';
import type { UserStats } from '../types';

export type Tab = 'dashboard' | 'ai-coach' | 'trophies' | 'routine' | 'diet' | 'bible' | 'finance' | 'shopping' | 'fitness';
export type SectionTab = Exclude<Tab, 'dashboard'>;
export type UserProfile = { name?: string; };

export const SECTION_CHOICES: Array<{
  id: SectionTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: 'ai-coach', label: 'Produttività', description: 'Coach IA e task.', icon: Sparkles },
  { id: 'trophies', label: 'Rafforzamento', description: 'Obiettivi e statistiche.', icon: Trophy },
  { id: 'routine', label: 'Abitudini', description: 'Ritmo e tracker.', icon: Calendar },
  { id: 'diet', label: 'Alimentazione', description: 'Ricette e macro.', icon: Utensils },
  { id: 'bible', label: 'Fede', description: 'Bibbia e preghiera.', icon: BookOpen },
  { id: 'fitness', label: 'Allenamento', description: 'Schede e workout.', icon: Dumbbell },
  { id: 'finance', label: 'Finanza', description: 'Spese e budget.', icon: Wallet },
  { id: 'shopping', label: 'Spesa', description: 'Lista supermercato.', icon: ShoppingBag },
];

export interface HomeMetrics {
  caloriesConsumed: number;
  caloriesTarget: number;
  mealsCompleted: number;
  mealsTarget: number;
  monthlySpent: number;
  monthlyBudget: number;
  shoppingPending: number;
  shoppingTotal: number;
  workoutsCompleted: number;
  workoutsTarget: number;
}

export interface DashboardContextType {
  authUser: User | null;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  stats: UserStats;
  setStats: React.Dispatch<React.SetStateAction<UserStats>>;
  enabledSections: SectionTab[];
  setEnabledSections: React.Dispatch<React.SetStateAction<SectionTab[]>>;
  activeTab: Tab;
  setActiveTab: React.Dispatch<React.SetStateAction<Tab>>;
  homeMetrics: HomeMetrics;
  setHomeMetrics: React.Dispatch<React.SetStateAction<HomeMetrics>>;
  checkins: string[];
  setCheckins: React.Dispatch<React.SetStateAction<string[]>>;
  hasCheckedInToday: boolean;
  checkinStreak: number;
  handleCheckIn: () => void;
  handleProfileSave: (nextProfile: UserProfile) => void;
  handleSectionsSave: (sections: SectionTab[]) => void;
  handleLogout: () => void;
  triggerRefreshHomeMetrics: () => void;
}

export const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
