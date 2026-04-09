import React, { useEffect, useState } from 'react';
import { SectionHeader } from './SectionHeader';
import { Account, Transaction } from '../types';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Minus,
  Plus,
  Sparkles,
  Tags,
  WalletCards,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const DEFAULT_ACCOUNT: Account = { id: 'default', name: 'PORTAFOGLIO', balance: 0 };
const DEFAULT_EXPENSE_CATEGORIES = [
  'SPESA',
  'AFFITTO',
  'BOLLETTE',
  'TRASPORTI',
  'RISTORANTI',
  'SHOPPING',
  'SALUTE',
  'ABBONAMENTI',
  'SVAGO',
  'VIAGGI',
  'REGALI',
  'ALTRO',
];

interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  active: boolean;
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase();
}

function formatCurrency(value: number) {
  return value.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function polarStyle(index: number, total: number, radius: number) {
  const angleOffset = total === 1 ? 0 : total === 2 ? -Math.PI / 2 : -Math.PI / 2;
  const angle = ((Math.PI * 2) / Math.max(total, 1)) * index + angleOffset;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return {
    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
  };
}

function getOrbitRadius(index: number, total: number) {
  if (total <= 1) return 122;
  if (total === 2) return 128;
  if (total <= 4) return index < 2 ? 104 : 138;
  return index < 2 ? 92 : index < 4 ? 130 : 156;
}

function isTodayLastDayOfMonth(date = new Date()) {
  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);
  return tomorrow.getMonth() !== date.getMonth();
}

const AnimatedValue: React.FC<{
  value: number;
  prefix?: string;
  className?: string;
}> = ({ value, prefix = '', className }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let frame = 0;
    let startTime: number | null = null;
    const startValue = displayValue;
    const duration = 800;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * eased);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <span className={className}>{prefix}{formatCurrency(Math.abs(displayValue))}</span>;
};

export const Finance: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('offwhite_accounts');
    if (!saved) return [DEFAULT_ACCOUNT];

    try {
      const parsed = JSON.parse(saved) as Account[];
      return parsed.length > 0 ? parsed : [DEFAULT_ACCOUNT];
    } catch {
      return [DEFAULT_ACCOUNT];
    }
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('offwhite_transactions');
    if (!saved) return [];

    try {
      return JSON.parse(saved) as Transaction[];
    } catch {
      return [];
    }
  });
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('offwhite_user_stats');
    return saved ? JSON.parse(saved) : { points: 0, activeTheme: 'standard' };
  });
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('offwhite_expense_categories');
    if (!saved) return DEFAULT_EXPENSE_CATEGORIES;

    try {
      const parsed = JSON.parse(saved) as string[];
      return parsed.length > 0 ? parsed : DEFAULT_EXPENSE_CATEGORIES;
    } catch {
      return DEFAULT_EXPENSE_CATEGORIES;
    }
  });
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => {
    const saved = localStorage.getItem('offwhite_subscriptions');
    if (!saved) return [];

    try {
      return JSON.parse(saved) as SubscriptionItem[];
    } catch {
      return [];
    }
  });

  const [totalAmount, setTotalAmount] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [description, setDescription] = useState('');
  const [movementType, setMovementType] = useState<'income' | 'expense'>('expense');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [newCategory, setNewCategory] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [selectedMonthKey, setSelectedMonthKey] = useState(getMonthKey());
  const [subscriptionName, setSubscriptionName] = useState('');
  const [subscriptionAmount, setSubscriptionAmount] = useState('');
  const [subscriptionDay, setSubscriptionDay] = useState('1');

  useEffect(() => {
    localStorage.setItem('offwhite_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('offwhite_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('offwhite_expense_categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem('offwhite_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    const handleStatsUpdate = () => {
      const saved = localStorage.getItem('offwhite_user_stats');
      if (saved) setStats(JSON.parse(saved));
    };
    window.addEventListener('stats-update', handleStatsUpdate);
    return () => window.removeEventListener('stats-update', handleStatsUpdate);
  }, []);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const currentMonthKey = getMonthKey();
  const monthKeys = Array.from(
    new Set([currentMonthKey, ...transactions.map((transaction) => transaction.date.slice(0, 7))]),
  ).sort((a, b) => b.localeCompare(a));
  const visibleMonthKeys = monthKeys.slice(0, 6);
  const selectedMonthIndex = monthKeys.indexOf(selectedMonthKey);

  useEffect(() => {
    if (!monthKeys.includes(selectedMonthKey)) {
      setSelectedMonthKey(currentMonthKey);
    }
  }, [monthKeys, selectedMonthKey, currentMonthKey]);

  const selectedMonthTransactions = transactions.filter((transaction) => transaction.date.startsWith(selectedMonthKey));
  const selectedMonthLabel = formatMonthLabel(selectedMonthKey);
  const currentMonthTransactions = transactions.filter((transaction) => transaction.date.startsWith(currentMonthKey));

  const selectedMonthExpenses = selectedMonthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const selectedMonthIncome = selectedMonthTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const selectedMonthSalary = selectedMonthTransactions
    .filter((transaction) => transaction.type === 'income' && transaction.category === 'STIPENDIO')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const selectedMonthSaved = selectedMonthIncome - selectedMonthExpenses;
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.active);
  const selectedMonthSubscriptions = activeSubscriptions.reduce((sum, subscription) => sum + subscription.amount, 0);

  const currentMonthSalary = currentMonthTransactions
    .filter((transaction) => transaction.type === 'income' && transaction.category === 'STIPENDIO')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const isLastDay = isTodayLastDayOfMonth();
  const hasSalaryForCurrentMonth = currentMonthSalary > 0;
  const spendingTrendData = Array.from(
    new Map(
      selectedMonthTransactions
        .sort((a, b) => a.date.localeCompare(b.date))
        .reduce<Array<{ label: string; amount: number }>>((accumulator, transaction) => {
          const dayLabel = new Date(transaction.date).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
          });
          const signedAmount = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
          const previous = accumulator[accumulator.length - 1];

          if (previous && previous.label === dayLabel) {
            previous.amount += signedAmount;
          } else {
            accumulator.push({ label: dayLabel, amount: signedAmount });
          }

          return accumulator;
        }, [])
        .map((entry) => [entry.label, entry]),
    ).values(),
  );

  const updateTotalBalance = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = parseFloat(totalAmount);
    if (Number.isNaN(parsedAmount)) return;

    setAccounts([{ ...DEFAULT_ACCOUNT, balance: parsedAmount }]);
    setTotalAmount('');
  };

  const addMovement = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = parseFloat(movementAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      accountId: DEFAULT_ACCOUNT.id,
      amount: parsedAmount,
      description: description.trim() ? description.toUpperCase() : movementType === 'income' ? 'ENTRATA' : 'USCITA',
      date: new Date().toISOString(),
      type: movementType,
      category: movementType === 'expense' ? selectedCategory : 'ENTRATA',
    };

    setTransactions((prev) => [newTransaction, ...prev]);
    setAccounts((prev) => {
      const current = prev[0] ?? DEFAULT_ACCOUNT;
      const balance = movementType === 'income'
        ? current.balance + parsedAmount
        : current.balance - parsedAmount;
      return [{ ...current, id: DEFAULT_ACCOUNT.id, name: DEFAULT_ACCOUNT.name, balance }];
    });

    setMovementAmount('');
    setDescription('');
  };

  const addExpenseCategory = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = newCategory.trim().toUpperCase();
    if (!normalized || expenseCategories.includes(normalized)) return;

    setExpenseCategories((prev) => [...prev, normalized]);
    setSelectedCategory(normalized);
    setNewCategory('');
  };

  const addSalaryForMonth = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = parseFloat(salaryAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    const salaryTransaction: Transaction = {
      id: crypto.randomUUID(),
      accountId: DEFAULT_ACCOUNT.id,
      amount: parsedAmount,
      description: `STIPENDIO ${currentMonthKey}`,
      date: new Date().toISOString(),
      type: 'income',
      category: 'STIPENDIO',
    };

    setTransactions((prev) => [salaryTransaction, ...prev]);
    setAccounts((prev) => {
      const current = prev[0] ?? DEFAULT_ACCOUNT;
      return [{ ...current, id: DEFAULT_ACCOUNT.id, name: DEFAULT_ACCOUNT.name, balance: current.balance + parsedAmount }];
    });
    setSalaryAmount('');
  };

  const addSubscription = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = parseFloat(subscriptionAmount);
    const parsedDay = parseInt(subscriptionDay, 10);
    if (!subscriptionName.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (Number.isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) return;

    setSubscriptions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: subscriptionName.trim().toUpperCase(),
        amount: parsedAmount,
        dayOfMonth: parsedDay,
        active: true,
      },
    ]);
    setSubscriptionName('');
    setSubscriptionAmount('');
    setSubscriptionDay('1');
  };

  const toggleSubscription = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((subscription) =>
        subscription.id === id ? { ...subscription, active: !subscription.active } : subscription,
      ),
    );
  };

  return (
    <div className="offwhite-border h-full">
      <SectionHeader title="PORTAFOGLIO" label="GESTIONE_DENARO_V4.0" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <div>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="border-2 border-black bg-black p-4 text-white">
              <div className="mb-1 font-mono text-[10px] uppercase text-gray-400">Saldo totale</div>
              <div className="text-2xl font-black tracking-tighter md:text-3xl">
                <AnimatedValue value={totalBalance} prefix="€" />
              </div>
            </div>
            <div className="border-2 border-black bg-white p-4">
              <div className="mb-1 font-mono text-[10px] uppercase text-gray-400">Punti</div>
              <div className="text-2xl font-black tracking-tighter text-offwhite-orange md:text-3xl">
                {stats.points} <span className="text-[10px] font-mono text-black">PTS</span>
              </div>
            </div>
          </div>

          <div className="mb-6 border-2 border-black bg-gray-50 p-4 md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <WalletCards size={18} />
              <div>
                <div className="offwhite-label mb-1">SALDO_INIZIALE</div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                  Inserisci il totale reale che hai adesso.
                </p>
              </div>
            </div>
            <form onSubmit={updateTotalBalance} className="flex flex-col gap-3 md:flex-row">
              <input
                type="number"
                step="0.01"
                placeholder="IMPORTO TOTALE"
                value={totalAmount}
                onChange={(event) => setTotalAmount(event.target.value)}
                className="min-w-0 flex-1 border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
              />
              <button
                type="submit"
                className="border-2 border-black bg-black px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-offwhite-orange"
              >
                Salva totale
              </button>
            </form>
          </div>

          <form onSubmit={addMovement} className="mb-6 space-y-4 border-2 border-black bg-white p-4 md:p-5">
            <div className="flex items-center gap-3">
              <Landmark size={18} />
              <div>
                <div className="offwhite-label mb-1">MOVIMENTI</div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                  Usa il meno per le uscite e il più per le entrate.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('expense')}
                className={`flex items-center justify-center gap-2 border-2 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-all ${
                  movementType === 'expense' ? 'border-black bg-black text-white' : 'border-black bg-white text-black hover:bg-gray-100'
                }`}
              >
                <Minus size={16} />
                Uscita
              </button>
              <button
                type="button"
                onClick={() => setMovementType('income')}
                className={`flex items-center justify-center gap-2 border-2 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-all ${
                  movementType === 'income' ? 'border-black bg-offwhite-orange text-white' : 'border-black bg-white text-black hover:bg-gray-100'
                }`}
              >
                <Plus size={16} />
                Entrata
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px]">
              <input
                type="text"
                placeholder="DESCRIZIONE"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
              />
              <input
                type="number"
                step="0.01"
                placeholder="IMPORTO"
                value={movementAmount}
                onChange={(event) => setMovementAmount(event.target.value)}
                className="border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
              />
            </div>

            {movementType === 'expense' && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
                >
                  {expenseCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="border-2 border-black bg-black px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-offwhite-orange"
                >
                  Registra uscita
                </button>
              </div>
            )}

            {movementType === 'income' && (
              <button
                type="submit"
                className="w-full border-2 border-black bg-black px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-offwhite-orange"
              >
                Registra entrata
              </button>
            )}
          </form>

          <div className="mb-6 border-2 border-black bg-gray-50 p-4 md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <Tags size={18} />
              <div>
                <div className="offwhite-label mb-1">CATEGORIE_USCITE</div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                  Categorie iniziali ispirate ai tracker spese piu comuni.
                </p>
              </div>
            </div>

            <form onSubmit={addExpenseCategory} className="mb-4 flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                placeholder="NUOVA CATEGORIA"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                className="min-w-0 flex-1 border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
              />
              <button
                type="submit"
                className="border-2 border-black bg-white px-5 py-3 font-mono text-xs uppercase tracking-widest text-black transition-all hover:bg-black hover:text-white"
              >
                Aggiungi categoria
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((category) => (
                <span key={category} className="border-2 border-black bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
                  {category}
                </span>
              ))}
            </div>
          </div>

          {(isLastDay || hasSalaryForCurrentMonth) && (
            <div className={`mb-6 border-2 border-black p-4 md:p-5 ${isLastDay && !hasSalaryForCurrentMonth ? 'bg-offwhite-orange text-white' : 'bg-white text-black'}`}>
              <div className="mb-4">
                <div className={`font-mono text-[10px] uppercase tracking-widest ${isLastDay && !hasSalaryForCurrentMonth ? 'text-white/70' : 'text-gray-500'}`}>
                  Stipendio fine mese
                </div>
                <div className="text-xl font-black tracking-tighter uppercase">
                  {hasSalaryForCurrentMonth ? `STIPENDIO GIÀ REGISTRATO PER ${currentMonthKey}` : 'OGGI È L ULTIMO GIORNO DEL MESE'}
                </div>
              </div>

              {!hasSalaryForCurrentMonth ? (
                <form onSubmit={addSalaryForMonth} className="flex flex-col gap-3 md:flex-row">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="IMPORTO STIPENDIO"
                    value={salaryAmount}
                    onChange={(event) => setSalaryAmount(event.target.value)}
                    className="min-w-0 flex-1 border-2 border-black bg-white p-3 font-mono text-xs uppercase text-black focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="border-2 border-black bg-black px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black"
                  >
                    Salva stipendio
                  </button>
                </form>
              ) : (
                <div className="font-mono text-[11px] uppercase tracking-widest">
                  Stipendio registrato: €{formatCurrency(currentMonthSalary)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="mb-6 overflow-hidden border-2 border-black bg-white">
            <div className="border-b-2 border-black bg-black px-4 py-3 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">Riepilogo mensile</div>
                  <div className="text-xl font-black tracking-tighter">{selectedMonthLabel}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMonthIndex < monthKeys.length - 1) {
                        setSelectedMonthKey(monthKeys[selectedMonthIndex + 1]);
                      }
                    }}
                    disabled={selectedMonthIndex === monthKeys.length - 1}
                    className="border border-white/20 p-2 text-white transition-all hover:border-offwhite-orange hover:text-offwhite-orange disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMonthIndex > 0) {
                        setSelectedMonthKey(monthKeys[selectedMonthIndex - 1]);
                      }
                    }}
                    disabled={selectedMonthIndex <= 0}
                    className="border border-white/20 p-2 text-white transition-all hover:border-offwhite-orange hover:text-offwhite-orange disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <Sparkles size={18} className="text-offwhite-orange" />
                </div>
              </div>
            </div>

            <div className="border-b-2 border-black bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                <CalendarRange size={14} />
                Storico mesi
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleMonthKeys.map((monthKey) => (
                  <button
                    key={monthKey}
                    type="button"
                    onClick={() => setSelectedMonthKey(monthKey)}
                    className={`border-2 px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-all ${
                      selectedMonthKey === monthKey
                        ? 'border-black bg-black text-white'
                        : 'border-black bg-white text-black hover:bg-black hover:text-white'
                    }`}
                  >
                    {formatMonthLabel(monthKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
              <motion.div layout className="border-2 border-black bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                  <ArrowDownRight size={14} />
                  Uscite
                </div>
                <div className="text-2xl font-black tracking-tighter text-offwhite-orange">
                  <AnimatedValue value={selectedMonthExpenses} prefix="€" />
                </div>
              </motion.div>

              <motion.div layout className="border-2 border-black bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                  <Landmark size={14} />
                  Stipendio
                </div>
                <div className="text-2xl font-black tracking-tighter text-black">
                  <AnimatedValue value={selectedMonthSalary} prefix="€" />
                </div>
              </motion.div>

              <motion.div layout className="border-2 border-black bg-black p-4 text-white">
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/50">
                  <ArrowUpRight size={14} />
                  Risparmio
                </div>
                <div className={`text-2xl font-black tracking-tighter ${selectedMonthSaved >= 0 ? 'text-white' : 'text-offwhite-orange'}`}>
                  <AnimatedValue value={selectedMonthSaved} prefix={selectedMonthSaved >= 0 ? '€' : '-€'} />
                </div>
              </motion.div>
            </div>

            <div className="border-t-2 border-black bg-gray-50 p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Grafico orbits</div>
                  <div className="text-lg font-black tracking-tighter uppercase">Abbonamenti mensili</div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                  {activeSubscriptions.length > 0 ? `${activeSubscriptions.length} orbite attive` : 'nessun abbonamento'}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-center">
                <div className="relative mx-auto h-[360px] w-[360px] rounded-full border-2 border-black bg-white">
                  <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/15" />
                  <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/15" />
                  <div className="absolute left-1/2 top-1/2 h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/15" />

                  <motion.div
                    layout
                    className="absolute left-1/2 top-1/2 z-10 flex h-[122px] w-[122px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-black bg-black p-3 text-center text-white"
                  >
                    <div className="font-mono text-[9px] uppercase tracking-widest text-white/60">Totale abbonamenti</div>
                    <div className="text-2xl font-black tracking-tighter text-offwhite-orange">
                      <AnimatedValue value={selectedMonthSubscriptions} prefix="€" />
                    </div>
                  </motion.div>

                  {activeSubscriptions.length > 0 ? (
                    activeSubscriptions.slice(0, 6).map((item, index) => {
                      const radius = getOrbitRadius(index, activeSubscriptions.length);
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1, rotate: 360 }}
                          transition={{
                            opacity: { duration: 0.4, delay: index * 0.06 },
                            scale: { duration: 0.4, delay: index * 0.06 },
                            rotate: { duration: 18 + index * 3, repeat: Infinity, ease: 'linear' },
                          }}
                          className="absolute left-1/2 top-1/2 z-20"
                          style={polarStyle(index, activeSubscriptions.length, radius)}
                        >
                          <div className="min-w-[96px] max-w-[118px] border-2 border-black bg-white px-3 py-2 text-center shadow-[4px_4px_0_0_#000]">
                            <div className="truncate font-black text-[10px] uppercase tracking-widest">{item.name}</div>
                            <div className="mt-1 font-mono text-[9px] uppercase text-offwhite-orange">
                              €{formatCurrency(item.amount)}
                            </div>
                            <div className="font-mono text-[8px] uppercase text-gray-400">
                              giorno {item.dayOfMonth}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="absolute left-1/2 top-1/2 w-[180px] -translate-x-1/2 translate-y-[84px] text-center">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-300">
                        Nessun abbonamento attivo da visualizzare
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {activeSubscriptions.length > 0 ? (
                    activeSubscriptions.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSubscription(item.id)}
                        className={`flex w-full items-center justify-between border-2 p-3 text-left transition-all ${
                          item.active ? 'border-black bg-white' : 'border-black/20 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center border-2 border-black bg-black font-mono text-[10px] font-bold text-white">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-black text-sm uppercase tracking-tighter">{item.name}</div>
                            <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400">
                              rinnovo il giorno {item.dayOfMonth}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-base text-offwhite-orange">€{formatCurrency(item.amount)}</div>
                          <div className="font-mono text-[8px] uppercase tracking-widest text-gray-400">
                            {item.active ? 'attivo' : 'pausa'}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="border-2 border-dashed border-black/10 py-10 text-center">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-300">
                        Aggiungi un abbonamento e comparira nel grafico orbitale
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t-2 border-black bg-white p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-gray-500">Andamento spese</div>
                  <div className="text-lg font-black tracking-tighter uppercase">Grafico stile borsa</div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                  mese selezionato
                </div>
              </div>

              <div className="h-72 border-2 border-black bg-gray-50 p-3">
                {spendingTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spendingTrendData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#d4d4d4" strokeDasharray="4 4" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#000" />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        stroke="#000"
                        tickFormatter={(value) => `€${Number(value).toFixed(0)}`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`€${formatCurrency(value)}`, 'Saldo giornaliero']}
                        labelFormatter={(label) => `Giorno ${label}`}
                        contentStyle={{
                          border: '2px solid #000',
                          borderRadius: '0',
                          backgroundColor: '#fff',
                          fontFamily: '"JetBrains Mono", monospace',
                          textTransform: 'uppercase',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#FF5C00"
                        strokeWidth={3}
                        dot={{ r: 3, fill: '#000' }}
                        activeDot={{ r: 5, fill: '#FF5C00', stroke: '#000', strokeWidth: 2 }}
                        animationDuration={900}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-center">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-gray-300">
                      Registra entrate o uscite per vedere il movimento del mese
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t-2 border-black bg-white p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="border border-black p-3">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400">Movimenti</div>
                  <div className="text-lg font-black tracking-tighter">{selectedMonthTransactions.length}</div>
                </div>
                <div className="border border-black p-3">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400">Entrate</div>
                  <div className="text-lg font-black tracking-tighter">€{formatCurrency(selectedMonthIncome)}</div>
                </div>
                <div className="border border-black p-3">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400">Spese</div>
                  <div className="text-lg font-black tracking-tighter text-offwhite-orange">€{formatCurrency(selectedMonthExpenses)}</div>
                </div>
                <div className="border border-black p-3">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-gray-400">Stato</div>
                  <div className={`text-lg font-black tracking-tighter ${selectedMonthSaved >= 0 ? 'text-black' : 'text-offwhite-orange'}`}>
                    {selectedMonthSaved >= 0 ? 'POSITIVO' : 'NEGATIVO'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-1">
              <div className="text-[10px] font-mono font-bold uppercase text-black">Movimenti recenti</div>
              <div className="text-[8px] font-mono uppercase text-gray-400">Scorri per vedere tutto</div>
            </div>

            <div className="max-h-96 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border border-black/10 bg-white p-3 transition-all hover:border-black">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 ${transaction.type === 'income' ? 'bg-black text-white' : 'bg-offwhite-orange text-white'}`}>
                      {transaction.type === 'income' ? <Plus size={16} /> : <Minus size={16} />}
                    </div>
                    <div className="overflow-hidden">
                      <div className="truncate font-black text-sm uppercase tracking-tighter">{transaction.description}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[8px] uppercase text-gray-400">
                          {new Date(transaction.date).toLocaleDateString('it-IT')}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-gray-200" />
                        <span className="font-mono text-[8px] font-bold uppercase text-offwhite-orange">
                          {transaction.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`shrink-0 font-black text-sm md:text-base ${transaction.type === 'income' ? 'text-black' : 'text-offwhite-orange'}`}>
                    {transaction.type === 'income' ? '+' : '-'}€{formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="border-2 border-dashed border-black/10 py-12 text-center">
                  <div className="font-mono text-[10px] font-bold uppercase text-gray-300">Nessun movimento registrato</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-2 border-black bg-gray-50 p-4 md:p-5">
        <div className="mb-4 flex items-center gap-3">
          <Sparkles size={18} />
          <div>
            <div className="offwhite-label mb-1">ABBONAMENTI_MENSILI</div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
              Gli abbonamenti attivi entrano nel grafico orbitale e ruotano continuamente.
            </p>
          </div>
        </div>

        <form onSubmit={addSubscription} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_110px_180px]">
          <input
            type="text"
            placeholder="NOME ABBONAMENTO"
            value={subscriptionName}
            onChange={(event) => setSubscriptionName(event.target.value)}
            className="border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
          />
          <input
            type="number"
            step="0.01"
            placeholder="IMPORTO"
            value={subscriptionAmount}
            onChange={(event) => setSubscriptionAmount(event.target.value)}
            className="border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
          />
          <input
            type="number"
            min="1"
            max="31"
            placeholder="GIORNO"
            value={subscriptionDay}
            onChange={(event) => setSubscriptionDay(event.target.value)}
            className="border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
          />
          <button
            type="submit"
            className="border-2 border-black bg-black px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-offwhite-orange"
          >
            Aggiungi abbonamento
          </button>
        </form>
      </div>
    </div>
  );
};
