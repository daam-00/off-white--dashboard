export interface Account {
  id: string;
  name: string;
  balance: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
}

export type MealCategory = 'mattina' | 'pranzo' | 'cena' | 'spuntino';

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  image?: string;
  category?: MealCategory;
}

export interface CheckIn {
  date: string;
}

export interface Workout {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  bought: boolean;
  category?: string;
  cost?: number;
  isMarketplaceItem?: boolean;
  owned?: boolean;
}

export interface Trophy {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
  points: number;
}

export interface UserStats {
  points: number;
  activeTheme: string;
  unlockedThemes?: string[];
  avatarUrl?: string;
  avatarId?: string;
  unlockedAvatars?: string[];
}
