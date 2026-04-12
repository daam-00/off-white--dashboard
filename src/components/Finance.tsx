import React, { useEffect, useMemo, useState } from 'react';
import { SectionHeader } from './SectionHeader';
import { Account, Transaction } from '../types';
import {
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  ArrowLeft,
  BellRing,
  CalendarDays,
  ChevronRight,
  Cloud,
  Film,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Minus,
  Music4,
  Phone,
  Plus,
  Scissors,
  Tv,
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

type FinanceTab = 'portfolio' | 'subscriptions';
type MovementType = 'income' | 'expense';
type SubscriptionMobileView = 'subscriptions' | 'calendar';
type SubscriptionIconName =
  | 'film'
  | 'tv'
  | 'music'
  | 'phone'
  | 'cloud'
  | 'scissors'
  | 'health'
  | 'study'
  | 'gaming';

interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  active: boolean;
  iconName: SubscriptionIconName;
}

const SUBSCRIPTION_ICON_OPTIONS: Array<{
  id: SubscriptionIconName;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: 'film', label: 'VIDEO', Icon: Film },
  { id: 'tv', label: 'TV', Icon: Tv },
  { id: 'music', label: 'MUSICA', Icon: Music4 },
  { id: 'phone', label: 'TEL', Icon: Phone },
  { id: 'cloud', label: 'CLOUD', Icon: Cloud },
  { id: 'scissors', label: 'BEAUTY', Icon: Scissors },
  { id: 'health', label: 'SALUTE', Icon: HeartPulse },
  { id: 'study', label: 'STUDIO', Icon: GraduationCap },
  { id: 'gaming', label: 'GAME', Icon: Gamepad2 },
];

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

function normalizeSubscription(raw: Partial<SubscriptionItem>): SubscriptionItem | null {
  if (!raw.id || !raw.name || typeof raw.amount !== 'number' || typeof raw.dayOfMonth !== 'number') {
    return null;
  }

  const iconName = SUBSCRIPTION_ICON_OPTIONS.some((option) => option.id === raw.iconName)
    ? raw.iconName
    : 'film';

  return {
    id: raw.id,
    name: raw.name,
    amount: raw.amount,
    dayOfMonth: raw.dayOfMonth,
    active: raw.active ?? true,
    iconName,
  };
}

function getSubscriptionDueLabel(dayOfMonth: number) {
  const now = new Date();
  const nextDate = getNextSubscriptionDate(dayOfMonth, now);

  const diffMs = nextDate.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return 'OGGI';
  if (diffDays === 1) return 'DOMANI';
  return `TRA ${diffDays} GIORNI`;
}

function getSubscriptionDateLabel(dayOfMonth: number) {
  const nextDate = getNextSubscriptionDate(dayOfMonth, new Date());

  return nextDate.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getClampedDayOfMonth(year: number, monthIndex: number, dayOfMonth: number) {
  return Math.min(dayOfMonth, new Date(year, monthIndex + 1, 0).getDate());
}

function getNextSubscriptionDate(dayOfMonth: number, fromDate: Date) {
  const candidate = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    getClampedDayOfMonth(fromDate.getFullYear(), fromDate.getMonth(), dayOfMonth),
  );

  candidate.setHours(0, 0, 0, 0);
  const compareDate = new Date(fromDate);
  compareDate.setHours(0, 0, 0, 0);

  if (candidate < compareDate) {
    const nextMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1);
    return new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      getClampedDayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth(), dayOfMonth),
    );
  }

  return candidate;
}

function buildSubscriptionCalendar(subscriptions: SubscriptionItem[], monthDate: Date) {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<
    | { type: 'empty'; key: string }
    | { type: 'day'; key: string; day: number; items: SubscriptionItem[]; isToday: boolean }
  > = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ type: 'empty', key: `empty-${index}` });
  }

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDate = now.getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const items = subscriptions.filter(
      (subscription) => getClampedDayOfMonth(year, monthIndex, subscription.dayOfMonth) === day,
    );

    cells.push({
      type: 'day',
      key: `day-${day}`,
      day,
      items,
      isToday: year === todayYear && monthIndex === todayMonth && day === todayDate,
    });
  }

  return cells;
}

function polarStyle(index: number, total: number, radius: number) {
  const angleOffset = -Math.PI / 2;
  const angle = ((Math.PI * 2) / Math.max(total, 1)) * index + angleOffset;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return {
    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
  };
}

function getOrbitRadius(index: number, total: number) {
  if (total <= 2) return 112;
  if (total <= 4) return index % 2 === 0 ? 106 : 124;
  return index % 3 === 0 ? 98 : index % 3 === 1 ? 122 : 142;
}

function getMobileOrbitLayers(subscriptions: SubscriptionItem[]) {
  return Array.from({ length: Math.ceil(subscriptions.length / 4) }, (_, layerIndex) => {
    const items = subscriptions.slice(layerIndex * 4, layerIndex * 4 + 4);
    return {
      radius: 116 + layerIndex * 34,
      items,
    };
  });
}

function parseAccounts() {
  const saved = localStorage.getItem('offwhite_accounts');
  if (!saved) return [DEFAULT_ACCOUNT];

  try {
    const parsed = JSON.parse(saved) as Account[];
    return parsed.length > 0 ? parsed : [DEFAULT_ACCOUNT];
  } catch {
    return [DEFAULT_ACCOUNT];
  }
}

function parseTransactions() {
  const saved = localStorage.getItem('offwhite_transactions');
  if (!saved) return [];

  try {
    return JSON.parse(saved) as Transaction[];
  } catch {
    return [];
  }
}

function parseExpenseCategories() {
  const saved = localStorage.getItem('offwhite_expense_categories');
  if (!saved) return DEFAULT_EXPENSE_CATEGORIES;

  try {
    const parsed = JSON.parse(saved) as string[];
    return parsed.length > 0 ? parsed : DEFAULT_EXPENSE_CATEGORIES;
  } catch {
    return DEFAULT_EXPENSE_CATEGORIES;
  }
}

function parseSubscriptions() {
  const saved = localStorage.getItem('offwhite_subscriptions');
  if (!saved) return [];

  try {
    return (JSON.parse(saved) as Partial<SubscriptionItem>[])
      .map(normalizeSubscription)
      .filter((item): item is SubscriptionItem => item !== null);
  } catch {
    return [];
  }
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
    const duration = 700;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * eased);
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <span className={className}>{prefix}{formatCurrency(Math.abs(displayValue))}</span>;
};

export const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('portfolio');
  const [showSubscriptionSheet, setShowSubscriptionSheet] = useState(false);
  const [subscriptionMobileView, setSubscriptionMobileView] = useState<SubscriptionMobileView>('subscriptions');
  const [calendarMonthDate, setCalendarMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
  );
  const [accounts, setAccounts] = useState<Account[]>(() => parseAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => parseTransactions());
  const [expenseCategories] = useState<string[]>(() => parseExpenseCategories());
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => parseSubscriptions());

  const [totalAmount, setTotalAmount] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [description, setDescription] = useState('');
  const [movementType, setMovementType] = useState<MovementType>('expense');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [selectedMonthKey, setSelectedMonthKey] = useState(getMonthKey());

  const [subscriptionName, setSubscriptionName] = useState('');
  const [subscriptionAmount, setSubscriptionAmount] = useState('');
  const [subscriptionDay, setSubscriptionDay] = useState('1');
  const [subscriptionIconName, setSubscriptionIconName] = useState<SubscriptionIconName>('film');

  useEffect(() => {
    localStorage.setItem('offwhite_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('offwhite_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('offwhite_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const currentMonthKey = getMonthKey();
  const monthKeys = Array.from(
    new Set([currentMonthKey, ...transactions.map((transaction) => transaction.date.slice(0, 7))]),
  ).sort((a, b) => b.localeCompare(a));

  useEffect(() => {
    if (!monthKeys.includes(selectedMonthKey)) setSelectedMonthKey(currentMonthKey);
  }, [monthKeys, selectedMonthKey, currentMonthKey]);

  const selectedMonthTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(selectedMonthKey),
  );
  const selectedMonthLabel = formatMonthLabel(selectedMonthKey);
  const selectedMonthExpenses = selectedMonthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const selectedMonthIncome = selectedMonthTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const selectedMonthSaved = selectedMonthIncome - selectedMonthExpenses;

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.active);
  const monthlySubscriptionsTotal = activeSubscriptions.reduce((sum, subscription) => sum + subscription.amount, 0);
  const annualSubscriptionsTotal = monthlySubscriptionsTotal * 12;
  const calendarCells = buildSubscriptionCalendar(activeSubscriptions, calendarMonthDate);
  const calendarList = [...activeSubscriptions].sort(
    (a, b) => getClampedDayOfMonth(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth(), a.dayOfMonth)
      - getClampedDayOfMonth(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth(), b.dayOfMonth),
  );

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

  const recentTransactions = [...selectedMonthTransactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const adjustTotalBalance = (direction: 'increase' | 'decrease') => {
    const parsedAmount = parseFloat(totalAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    setAccounts((prev) => {
      const current = prev[0] ?? DEFAULT_ACCOUNT;
      const nextBalance = direction === 'increase'
        ? current.balance + parsedAmount
        : current.balance - parsedAmount;

      return [{ ...current, balance: nextBalance }];
    });

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
      description: description.trim() ? description.trim().toUpperCase() : movementType === 'income' ? 'ENTRATA' : 'USCITA',
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
      return [{ ...current, balance }];
    });

    setMovementAmount('');
    setDescription('');
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
        name: subscriptionName.trim(),
        amount: parsedAmount,
        dayOfMonth: parsedDay,
        active: true,
        iconName: subscriptionIconName,
      },
    ]);

    setSubscriptionName('');
    setSubscriptionAmount('');
    setSubscriptionDay('1');
    setSubscriptionIconName('film');
  };

  const toggleSubscription = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((subscription) =>
        subscription.id === id ? { ...subscription, active: !subscription.active } : subscription,
      ),
    );
  };

  const sortedSubscriptions = [...activeSubscriptions].sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  const mobileOrbitSubscriptions = sortedSubscriptions.slice(0, 12);
  const mobileOrbitLayers = getMobileOrbitLayers(mobileOrbitSubscriptions);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setNotificationPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted' || activeSubscriptions.length === 0) return;

    const todayKey = getMonthKey(new Date());
    const sentRaw = localStorage.getItem('offwhite_subscription_notifications_sent');
    const sent = sentRaw ? (JSON.parse(sentRaw) as Record<string, true>) : {};

    activeSubscriptions.forEach((subscription) => {
      const nextDate = getNextSubscriptionDate(subscription.dayOfMonth, new Date());
      const diffDays = Math.max(
        0,
        Math.ceil((nextDate.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)),
      );

      if (diffDays > 1) return;

      const notificationKey = `${todayKey}-${subscription.id}-${diffDays}`;
      if (sent[notificationKey]) return;

      new Notification(`Rinnovo ${subscription.name}`, {
        body:
          diffDays === 0
            ? `Oggi si rinnova a €${formatCurrency(subscription.amount)}.`
            : `Domani si rinnova a €${formatCurrency(subscription.amount)}.`,
        icon: '/better-me-logo.png',
        badge: '/better-me-logo.png',
      });

      sent[notificationKey] = true;
    });

    localStorage.setItem('offwhite_subscription_notifications_sent', JSON.stringify(sent));
  }, [activeSubscriptions]);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  return (
    <div className={activeTab === 'subscriptions' ? 'h-full md:border-2 md:border-black md:p-6' : 'offwhite-border h-full'}>
      <div className={activeTab === 'subscriptions' ? 'hidden md:block' : ''}>
        <SectionHeader title="PORTAFOGLIO" label="GESTIONE_DENARO_V5.0" />
      </div>

      <div className={`finance-tab-shell mb-6 grid grid-cols-2 gap-2 ${activeTab === 'subscriptions' ? 'hidden md:grid' : ''}`}>
        <button
          type="button"
          onClick={() => setActiveTab('portfolio')}
          className={`finance-tab-button ${activeTab === 'portfolio' ? 'is-active' : ''}`}
        >
          <WalletCards size={16} />
          <span>Portafoglio</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subscriptions')}
          className={`finance-tab-button ${activeTab === 'subscriptions' ? 'is-active' : ''}`}
        >
          <Tv size={16} />
          <span>Abbonamenti</span>
        </button>
      </div>

      {activeTab === 'portfolio' ? (
        <div className="space-y-6">
          <div className="finance-hero border-2 border-black p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-500">Saldo totale</div>
                <div className="mt-2 text-4xl font-black tracking-tighter md:text-5xl">
                  <AnimatedValue value={totalBalance} prefix="€" />
                </div>
                <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                  flusso mensile sincronizzato
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:max-w-[340px]">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="MODIFICA TOTALE"
                    value={totalAmount}
                    onChange={(event) => setTotalAmount(event.target.value)}
                    className="w-full border-2 border-black bg-white/80 p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => adjustTotalBalance('decrease')}
                      className="finance-total-adjust-button"
                    >
                      <Minus size={16} />
                      <span>Scala</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustTotalBalance('increase')}
                      className="finance-total-adjust-button is-positive"
                    >
                      <Plus size={16} />
                      <span>Aggiungi</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:min-w-[360px]">
                <div className="finance-stat-card border-2 border-black p-3">
                  <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-gray-500">Entrate</div>
                  <div className="mt-2 text-xl font-black">€{formatCurrency(selectedMonthIncome)}</div>
                </div>
                <div className="finance-stat-card border-2 border-black p-3">
                  <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-gray-500">Uscite</div>
                  <div className="mt-2 text-xl font-black text-offwhite-orange">€{formatCurrency(selectedMonthExpenses)}</div>
                </div>
                <div className="finance-stat-card border-2 border-black p-3">
                  <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-gray-500">Netto</div>
                  <div className={`mt-2 text-xl font-black tabular-nums ${selectedMonthSaved >= 0 ? '' : 'text-offwhite-orange'}`}>
                    <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                      <span>{selectedMonthSaved >= 0 ? '+' : '-'}</span>
                      <span>€{formatCurrency(Math.abs(selectedMonthSaved))}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="finance-panel border-2 border-black p-4 md:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="finance-panel-icon">
                    {movementType === 'expense' ? <Minus size={16} /> : <Plus size={16} />}
                  </div>
                  <div>
                    <div className="offwhite-label mb-1">NUOVO_MOVIMENTO</div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                      Registra entrate e uscite in modo rapido.
                    </p>
                  </div>
                </div>

                <form onSubmit={addMovement} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMovementType('expense')}
                      className={`finance-toggle-button ${movementType === 'expense' ? 'is-active' : ''}`}
                    >
                      <Minus size={16} />
                      <span>Uscita</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType('income')}
                      className={`finance-toggle-button ${movementType === 'income' ? 'is-income-active' : ''}`}
                    >
                      <Plus size={16} />
                      <span>Entrata</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="DESCRIZIONE"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="w-full border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
                  />

                  <div className="grid grid-cols-[1fr_140px] gap-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="IMPORTO"
                      value={movementAmount}
                      onChange={(event) => setMovementAmount(event.target.value)}
                      className="border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
                    />
                    {movementType === 'expense' ? (
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
                    ) : (
                      <div className="flex items-center border-2 border-black px-3 font-mono text-xs uppercase tracking-widest text-gray-400">
                        ENTRATA
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full border-2 border-black bg-black px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-offwhite-orange"
                  >
                    Registra movimento
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="finance-panel overflow-hidden border-2 border-black">
                <div className="border-b-2 border-black px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">Trend mensile</div>
                      <div className="text-2xl font-black tracking-tighter">{selectedMonthLabel}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {monthKeys.slice(0, 6).map((monthKey) => (
                        <button
                          key={monthKey}
                          type="button"
                          onClick={() => setSelectedMonthKey(monthKey)}
                          className={`finance-chip ${selectedMonthKey === monthKey ? 'is-active' : ''}`}
                        >
                          {formatMonthLabel(monthKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-[280px] p-4">
                  {spendingTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={spendingTrendData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 8" stroke="rgba(15,23,42,0.15)" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
                          tickFormatter={(value) => `${value > 0 ? '+' : ''}${Math.round(value)}`}
                        />
                        <Tooltip
                          formatter={(value: number) => [`€${formatCurrency(value)}`, 'Valore']}
                          labelFormatter={(label) => `Giorno ${label}`}
                          contentStyle={{
                            borderRadius: 0,
                            border: '2px solid #111',
                            backgroundColor: '#fff',
                            fontFamily: 'JetBrains Mono, monospace',
                            textTransform: 'uppercase',
                            fontSize: '10px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="var(--theme-accent)"
                          strokeWidth={3}
                          dot={{ r: 3, strokeWidth: 0, fill: 'var(--theme-accent)' }}
                          activeDot={{ r: 5, stroke: 'var(--theme-border)', strokeWidth: 2, fill: 'var(--theme-accent)' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center border-2 border-dashed border-black/10">
                      <div className="text-center">
                        <div className="font-black uppercase tracking-tight text-gray-400">Nessun dato per il mese</div>
                        <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-gray-300">
                          Registra entrate o uscite per vedere il trend
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="finance-panel border-2 border-black p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">Movimenti recenti</div>
                    <div className="text-2xl font-black tracking-tighter">Ultime voci</div>
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-500">
                    {recentTransactions.length} elementi
                  </div>
                </div>

                <div className="space-y-3">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="finance-transaction-row border-2 border-black p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className={`finance-transaction-icon ${transaction.type === 'income' ? 'is-income' : ''}`}>
                              {transaction.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-black text-sm uppercase tracking-tight">
                                {transaction.description}
                              </div>
                              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-400">
                                {transaction.category} · {new Date(transaction.date).toLocaleDateString('it-IT')}
                              </div>
                            </div>
                          </div>
                          <div className={`text-right font-black ${transaction.type === 'income' ? '' : 'text-offwhite-orange'}`}>
                            {transaction.type === 'income' ? '+' : '-'}€{formatCurrency(transaction.amount)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border-2 border-dashed border-black/10 py-10 text-center">
                      <div className="font-black uppercase tracking-tight text-gray-400">Nessun movimento registrato</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="orbit-mobile-screen md:hidden">
            <div className="orbit-mobile-topbar">
              <div className="orbit-mobile-title">
                <div className="orbit-mobile-title-kicker">Abbonamenti</div>
                <div className="orbit-mobile-title-main">Hub Servizi</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`orbit-notification-button ${notificationPermission === 'granted' ? 'is-active' : ''}`}
                  onClick={requestNotificationPermission}
                >
                  <BellRing size={20} />
                </button>
                <button type="button" className="orbit-plus-button" onClick={() => setShowSubscriptionSheet(true)}>
                  <Plus size={28} />
                </button>
              </div>
            </div>

            {subscriptionMobileView === 'subscriptions' ? (
              <>
                <div className="orbit-hero-stage">
                  {mobileOrbitLayers.map((layer, layerIndex) => (
                    <div
                      key={`ring-${layerIndex}`}
                      className="orbit-mobile-layer"
                      style={
                        {
                          width: `${layer.radius * 2}px`,
                          height: `${layer.radius * 2}px`,
                          '--orbit-duration': `${18 + layerIndex * 6}s`,
                        } as React.CSSProperties
                      }
                    >
                      <div className={`orbit-hero-ring ${layerIndex === 0 ? 'orbit-hero-ring-primary' : 'orbit-hero-ring-secondary'}`} />
                      {layer.items.map((subscription, itemIndex) => {
                        const iconOption = SUBSCRIPTION_ICON_OPTIONS.find((option) => option.id === subscription.iconName) ?? SUBSCRIPTION_ICON_OPTIONS[0];
                        const Icon = iconOption.Icon;
                        const nodeSize = layerIndex === 0 ? 30 : 26;

                        return (
                          <div
                            key={subscription.id}
                            className="orbit-mobile-node-shell"
                            style={{
                              ...polarStyle(itemIndex, layer.items.length, layer.radius),
                              '--orbit-node-size': `${nodeSize}px`,
                            } as React.CSSProperties}
                          >
                            <div className="orbit-mobile-node">
                              <Icon size={nodeSize > 28 ? 17 : 15} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  <div className="orbit-mobile-planet">
                    <div className="orbit-mobile-planet-label">Totale annuo</div>
                    <div className="orbit-mobile-planet-value">€{formatCurrency(annualSubscriptionsTotal)}</div>
                  </div>
                </div>

                <div className="orbit-mobile-stats">
                  <div>
                    <div className="orbit-mobile-stat-value">{activeSubscriptions.length}</div>
                    <div className="orbit-mobile-stat-label">Personal</div>
                  </div>
                  <div className="text-right">
                    <div className="orbit-mobile-stat-value">€{formatCurrency(annualSubscriptionsTotal)}</div>
                    <div className="orbit-mobile-stat-label">Totale annuale</div>
                  </div>
                </div>

                <div className="orbit-mobile-list-head">
                  <div>Attivo</div>
                  <div className="flex items-center gap-1">
                    <span>Prossimo</span>
                    <ArrowUpDown size={18} />
                  </div>
                </div>

                <div className="orbit-mobile-list">
                  {sortedSubscriptions.length > 0 ? (
                    sortedSubscriptions.map((subscription) => {
                      const iconOption = SUBSCRIPTION_ICON_OPTIONS.find((option) => option.id === subscription.iconName) ?? SUBSCRIPTION_ICON_OPTIONS[0];
                      const Icon = iconOption.Icon;
                      return (
                        <button
                          key={subscription.id}
                          type="button"
                          onClick={() => toggleSubscription(subscription.id)}
                          className="orbit-subscription-row"
                        >
                          <div className="orbit-subscription-row-left">
                            <div className="orbit-subscription-icon">
                              <Icon size={20} />
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="truncate text-[1.1rem] font-semibold text-white">{subscription.name}</div>
                              <div className="orbit-subscription-meta">
                                {getSubscriptionDueLabel(subscription.dayOfMonth)} • {getSubscriptionDateLabel(subscription.dayOfMonth)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="orbit-subscription-price">
                              €{formatCurrency(subscription.amount)}
                            </div>
                            <ChevronRight size={24} className="text-white/45" />
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="subscription-empty-state">
                      <div className="text-center">
                        <div className="font-black uppercase tracking-tight text-white/80">Nessun abbonamento</div>
                        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                          premi + per aggiungere il primo servizio
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="orbit-calendar-view">
                <div className="orbit-calendar-toolbar">
                  <button
                    type="button"
                    className="orbit-calendar-switch"
                    onClick={() => setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() - 1, 1))}
                  >
                    ‹
                  </button>
                  <div className="orbit-calendar-month">
                    {calendarMonthDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                  </div>
                  <button
                    type="button"
                    className="orbit-calendar-switch"
                    onClick={() => setCalendarMonthDate(new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 1))}
                  >
                    ›
                  </button>
                </div>

                <div className="orbit-calendar-grid">
                  {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((label, index) => (
                    <div key={`${label}-${index}`} className="orbit-calendar-weekday">{label}</div>
                  ))}
                  {calendarCells.map((cell) =>
                    cell.type === 'empty' ? (
                      <div key={cell.key} className="orbit-calendar-cell is-empty" />
                    ) : (
                      <div
                        key={cell.key}
                        className={`orbit-calendar-cell ${cell.isToday ? 'is-today' : ''} ${cell.items.length > 0 ? 'has-items' : ''}`}
                      >
                        <div className="orbit-calendar-day">{cell.day}</div>
                        <div className="orbit-calendar-dots">
                          {cell.items.slice(0, 3).map((item) => (
                            <span key={item.id} className="orbit-calendar-dot" />
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="orbit-calendar-list">
                  {calendarList.length > 0 ? (
                    calendarList.map((subscription) => {
                      const renewalDay = getClampedDayOfMonth(
                        calendarMonthDate.getFullYear(),
                        calendarMonthDate.getMonth(),
                        subscription.dayOfMonth,
                      );
                      return (
                        <div key={subscription.id} className="orbit-calendar-row">
                          <div className="orbit-calendar-row-day">{renewalDay}</div>
                          <div className="orbit-calendar-row-body">
                            <div className="font-semibold text-white">{subscription.name}</div>
                            <div className="orbit-subscription-meta">
                              Si rinnova ogni mese il giorno {subscription.dayOfMonth}
                            </div>
                          </div>
                          <div className="orbit-subscription-price">€{formatCurrency(subscription.amount)}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="subscription-empty-state">
                      <div className="text-center">
                        <div className="font-black uppercase tracking-tight text-white/80">Calendario vuoto</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="orbit-bottom-nav">
              <button
                type="button"
                className={`orbit-bottom-nav-item ${subscriptionMobileView === 'subscriptions' ? 'is-active' : ''}`}
                onClick={() => setSubscriptionMobileView('subscriptions')}
              >
                <span className="orbit-bottom-nav-icon">◐</span>
                <span>Abbonamenti</span>
              </button>
              <button
                type="button"
                className={`orbit-bottom-nav-item ${subscriptionMobileView === 'calendar' ? 'is-active' : ''}`}
                onClick={() => setSubscriptionMobileView('calendar')}
              >
                <CalendarDays size={26} />
                <span>Calendario</span>
              </button>
              <button
                type="button"
                className="orbit-bottom-nav-item"
                onClick={() => setActiveTab('portfolio')}
              >
                <ArrowLeft size={26} />
                <span>Portafoglio</span>
              </button>
            </div>

            {showSubscriptionSheet && (
              <div className="orbit-sheet-backdrop" onClick={() => setShowSubscriptionSheet(false)}>
                <div className="orbit-sheet" onClick={(event) => event.stopPropagation()}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">Nuovo abbonamento</div>
                      <div className="text-2xl font-black tracking-tight">Aggiungi servizio</div>
                      <div className="mt-2 text-sm text-gray-500">
                        Il rinnovo e mensile: scegli il giorno del mese in cui verra addebitato.
                      </div>
                    </div>
                    <button type="button" className="orbit-sheet-close" onClick={() => setShowSubscriptionSheet(false)}>
                      ×
                    </button>
                  </div>

                  <form
                    onSubmit={(event) => {
                      addSubscription(event);
                      setShowSubscriptionSheet(false);
                    }}
                    className="space-y-3"
                  >
                    <input
                      id="subscription-name-input"
                      type="text"
                      placeholder="NOME ABBONAMENTO"
                      value={subscriptionName}
                      onChange={(event) => setSubscriptionName(event.target.value)}
                      className="w-full border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
                    />

                    <div className="grid grid-cols-2 gap-3">
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
                        placeholder="GIORNO RINNOVO"
                        value={subscriptionDay}
                        onChange={(event) => setSubscriptionDay(event.target.value)}
                        className="border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
                      />
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-gray-600">
                      Si rinnova ogni mese il giorno <strong>{subscriptionDay || '1'}</strong>.
                    </div>

                    <div className="subscription-icon-grid">
                      {SUBSCRIPTION_ICON_OPTIONS.map((option) => {
                        const active = subscriptionIconName === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSubscriptionIconName(option.id)}
                            className={`subscription-icon-picker ${active ? 'is-active' : ''}`}
                          >
                            <option.Icon size={18} />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="submit"
                      className="w-full border-2 border-black bg-black px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-offwhite-orange"
                    >
                      Salva abbonamento
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          <div className="subscription-screen hidden p-4 md:block md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-gray-500">Abbonamenti</div>
                <div className="text-3xl font-black tracking-tight">Hub Servizi</div>
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-gray-500">
                {activeSubscriptions.length} attivi
              </div>
            </div>

            <div className="subscription-toolbar mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
                orbita personale dei tuoi servizi ricorrenti
              </div>
              <button
                type="button"
                onClick={() => {
                  const nameInput = document.getElementById('subscription-name-input');
                  if (nameInput instanceof HTMLInputElement) nameInput.focus();
                }}
                className="subscription-add-pill"
              >
                <Plus size={14} />
                <span>Aggiungi</span>
              </button>
            </div>

              <div className="subscription-orbit-space">
                <div className="subscription-orbit-space-ring subscription-orbit-space-ring-outer" />
                <div className="subscription-orbit-space-ring subscription-orbit-space-ring-mid" />
                <div className="subscription-orbit-space-ring subscription-orbit-space-ring-inner" />
                <motion.div layout className="subscription-orbit-planet">
                  <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/60">Totale annuo</div>
                  <div className="mt-2 text-3xl font-black text-white">€{formatCurrency(annualSubscriptionsTotal)}</div>
                </motion.div>

                {activeSubscriptions.slice(0, 8).map((subscription, index) => {
                  const iconOption = SUBSCRIPTION_ICON_OPTIONS.find((option) => option.id === subscription.iconName) ?? SUBSCRIPTION_ICON_OPTIONS[0];
                  const Icon = iconOption.Icon;
                  const radius = getOrbitRadius(index, activeSubscriptions.length || 1);
                  const angle = (360 / Math.max(activeSubscriptions.length, 1)) * index;
                  return (
                    <motion.div
                      key={subscription.id}
                      layout
                      initial={{ opacity: 0, scale: 0.75 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="subscription-orbit-track"
                      style={
                        {
                          '--orbit-radius': `${radius}px`,
                          '--orbit-angle': `${angle}deg`,
                          '--orbit-duration': `${18 + index * 1.8}s`,
                        } as React.CSSProperties
                      }
                    >
                      <div className="subscription-orbit-badge">
                        <Icon size={18} />
                      </div>
                    </motion.div>
                    );
                  })}
              </div>

              <div className="subscription-metrics-row">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/50">Personal</div>
                  <div className="mt-1 text-4xl font-black text-white">{activeSubscriptions.length}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/50">Totale annuale</div>
                  <div className="mt-1 text-4xl font-black text-white">€{formatCurrency(annualSubscriptionsTotal)}</div>
                </div>
              </div>

              <div className="subscription-form-block">
                <div className="mb-4">
                  <div className="offwhite-label mb-2">NUOVO_ABBONAMENTO</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                    Scegli icona, importo e giorno di rinnovo.
                  </div>
                </div>

                <form onSubmit={addSubscription} className="space-y-3">
                  <input
                    id="subscription-name-input"
                    type="text"
                    placeholder="NOME ABBONAMENTO"
                    value={subscriptionName}
                    onChange={(event) => setSubscriptionName(event.target.value)}
                    className="w-full border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none"
                  />

                  <div className="grid grid-cols-2 gap-3">
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
                  </div>

                  <div className="subscription-icon-grid">
                    {SUBSCRIPTION_ICON_OPTIONS.map((option) => {
                      const active = subscriptionIconName === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSubscriptionIconName(option.id)}
                          className={`subscription-icon-picker ${active ? 'is-active' : ''}`}
                        >
                          <option.Icon size={18} />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    className="w-full border-2 border-black bg-black px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-offwhite-orange"
                  >
                    Salva abbonamento
                  </button>
                </form>
              </div>

              <div className="space-y-3 pt-5">
                {subscriptions.length > 0 ? (
                  subscriptions.map((subscription) => {
                    const iconOption = SUBSCRIPTION_ICON_OPTIONS.find((option) => option.id === subscription.iconName) ?? SUBSCRIPTION_ICON_OPTIONS[0];
                    const Icon = iconOption.Icon;

                    return (
                      <button
                        key={subscription.id}
                        type="button"
                        onClick={() => toggleSubscription(subscription.id)}
                        className={`subscription-app-row w-full ${subscription.active ? '' : 'is-muted'}`}
                      >
                        <div className="subscription-app-row-left">
                          <div className="subscription-app-row-icon">
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="truncate text-lg font-black text-white">{subscription.name}</div>
                            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                              {getSubscriptionDueLabel(subscription.dayOfMonth)} · {getSubscriptionDateLabel(subscription.dayOfMonth)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-black text-white">€{formatCurrency(subscription.amount)}</div>
                          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
                            {subscription.active ? 'attivo' : 'pausa'}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="subscription-empty-state">
                    <div className="text-center">
                      <div className="font-black uppercase tracking-tight text-white/80">Nessun abbonamento</div>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                        aggiungi il primo servizio per vedere l orbita
                      </div>
                    </div>
                    </div>
                  )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};
