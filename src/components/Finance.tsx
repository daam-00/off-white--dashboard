import React, { useEffect, useRef, useState } from 'react';
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
  ImagePlus,
  Minus,
  Music4,
  Phone,
  Plus,
  RotateCcw,
  Scissors,
  Tv,
  WalletCards,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';

const FINANCE_SPRING = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 24,
  mass: 0.9,
};

const FINANCE_TAP = { scale: 0.985, y: 1.5 };
const FINANCE_HOVER = { y: -2, scale: 1.01 };

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
type PortfolioAction = 'balance' | 'income' | 'expense' | null;
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
  customIconDataUrl?: string;
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

function getShortMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('it-IT', {
    month: 'short',
  }).replace('.', '').toUpperCase();
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

function buildAreaPath(points: Array<{ x: number; y: number }>, height: number) {
  if (points.length === 0) return '';
  const linePath = buildLinePath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  return `${linePath} L ${lastPoint.x.toFixed(2)} ${height.toFixed(2)} L ${firstPoint.x.toFixed(2)} ${height.toFixed(2)} Z`;
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
    customIconDataUrl: typeof raw.customIconDataUrl === 'string' ? raw.customIconDataUrl : undefined,
  };
}

function getSubscriptionIconOption(iconName: SubscriptionIconName) {
  return SUBSCRIPTION_ICON_OPTIONS.find((option) => option.id === iconName) ?? SUBSCRIPTION_ICON_OPTIONS[0];
}

function SubscriptionIcon({
  subscription,
  size = 18,
  className,
}: {
  subscription: Pick<SubscriptionItem, 'iconName' | 'customIconDataUrl' | 'name'>;
  size?: number;
  className?: string;
}) {
  if (subscription.customIconDataUrl) {
    return (
      <img
        src={subscription.customIconDataUrl}
        alt={`${subscription.name} icon`}
        className={`subscription-custom-icon ${className ?? ''}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const Icon = getSubscriptionIconOption(subscription.iconName).Icon;
  return <Icon size={size} className={className} />;
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

  const formattedValue = `${prefix}${formatCurrency(Math.abs(displayValue))}`;
  const compactClassName =
    formattedValue.length >= 11 ? 'is-ultra-compact' : formattedValue.length >= 9 ? 'is-compact' : '';

  return <span className={[className, compactClassName].filter(Boolean).join(' ')}>{formattedValue}</span>;
};

export const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('portfolio');
  const [portfolioAction, setPortfolioAction] = useState<PortfolioAction>(null);
  const [showSubscriptionSheet, setShowSubscriptionSheet] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [subscriptionMobileView, setSubscriptionMobileView] = useState<SubscriptionMobileView>('subscriptions');
  const [calendarMonthDate, setCalendarMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
  );
  const [accounts, setAccounts] = useState<Account[]>(() => parseAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => parseTransactions());
  const [expenseCategories] = useState<string[]>(() => parseExpenseCategories());
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => parseSubscriptions());

  // Finance AI Advisor States
  const [apiKey] = useState<string>(() => {
    const local = localStorage.getItem('betterme_gemini_api_key');
    if (local) return local;
    try { return (process.env.GEMINI_API_KEY as string) || ''; } catch { return ''; }
  });

  const [aiAdvice, setAiAdvice] = useState<string>(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    return localStorage.getItem(`betterme_finance_ai_advice_${todayKey}`) || '';
  });
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [errorAdvice, setErrorAdvice] = useState('');

  const fetchFinanceAIAdvice = async () => {
    if (!apiKey) return;
    setLoadingAdvice(true);
    setErrorAdvice('');

    const todayKey = new Date().toISOString().split('T')[0];
    const monthKey = todayKey.substring(0, 7);

    const monthlyExpenses = transactions
      .filter((t) => t.type === 'expense' && typeof t.date === 'string' && t.date.startsWith(monthKey))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

    const monthlyIncome = transactions
      .filter((t) => t.type === 'income' && typeof t.date === 'string' && t.date.startsWith(monthKey))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

    const totalActiveSubscriptions = subscriptions
      .filter((s) => s.active)
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const promptText = `Fornisci un consiglio finanziario personalizzato ed estremamente conciso in italiano basandoti sui dati reali di questo mese (${monthKey}):
- Entrate registrate questo mese: ${monthlyIncome}€.
- Spese registrate questo mese: ${monthlyExpenses}€.
- Totale abbonamenti attivi mensili: ${totalActiveSubscriptions}€ (Abbonamenti: ${subscriptions.filter(s => s.active).map(s => `${s.name}: ${s.amount}€`).join(', ') || 'Nessuno'}).
- Transazioni recenti di questo mese: ${transactions.slice(0, 10).map((t) => `${t.description || 'Spesa'}: ${t.amount}€ (${t.type})`).join(', ') || 'Nessuna transazione'}.

Fornisci una proiezione o un suggerimento pratico per ottimizzare le spese o tagliare abbonamenti inutili. Massimo 3 frasi, stile minimalista ed elegante (off-white design).`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 250,
            temperature: 0.7,
          }
        })
      });

      if (!response.ok) throw new Error("Errore API");
      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!answer) throw new Error("Nessuna risposta");

      setAiAdvice(answer);
      localStorage.setItem(`betterme_finance_ai_advice_${todayKey}`, answer);
    } catch (e) {
      console.error(e);
      setErrorAdvice("Impossibile caricare l'analisi. Riprova.");
    } finally {
      setLoadingAdvice(false);
    }
  };

  const [totalAmount, setTotalAmount] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [selectedMonthKey, setSelectedMonthKey] = useState(getMonthKey());

  const [subscriptionName, setSubscriptionName] = useState('');
  const [subscriptionAmount, setSubscriptionAmount] = useState('');
  const [subscriptionDay, setSubscriptionDay] = useState('1');
  const [subscriptionIconName, setSubscriptionIconName] = useState<SubscriptionIconName>('film');
  const [subscriptionCustomIconDataUrl, setSubscriptionCustomIconDataUrl] = useState<string | undefined>(undefined);
  const portfolioAmountInputRef = useRef<HTMLInputElement | null>(null);

  const resetSubscriptionForm = () => {
    setEditingSubscriptionId(null);
    setSubscriptionName('');
    setSubscriptionAmount('');
    setSubscriptionDay('1');
    setSubscriptionIconName('film');
    setSubscriptionCustomIconDataUrl(undefined);
  };

  const openNewSubscriptionSheet = () => {
    resetSubscriptionForm();
    setShowSubscriptionSheet(true);
  };

  const openEditSubscriptionSheet = (subscription: SubscriptionItem) => {
    setEditingSubscriptionId(subscription.id);
    setSubscriptionName(subscription.name);
    setSubscriptionAmount(String(subscription.amount));
    setSubscriptionDay(String(subscription.dayOfMonth));
    setSubscriptionIconName(subscription.iconName);
    setSubscriptionCustomIconDataUrl(subscription.customIconDataUrl);
    setShowSubscriptionSheet(true);
  };

  const closeSubscriptionSheet = () => {
    setShowSubscriptionSheet(false);
    resetSubscriptionForm();
  };

  useEffect(() => {
    localStorage.setItem('offwhite_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('offwhite_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('offwhite_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    const shouldLockScroll = Boolean(portfolioAction || showSubscriptionSheet);
    if (!shouldLockScroll || typeof window === 'undefined') return;

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousHtmlOverflow = documentElement.style.overflow;

    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [portfolioAction, showSubscriptionSheet]);

  useEffect(() => {
    if (!portfolioAction) return;
    const input = portfolioAmountInputRef.current;
    if (!input) return;

    const frame = window.requestAnimationFrame(() => {
      try {
        input.focus({ preventScroll: true });
      } catch {
        input.focus();
      }
      const length = input.value.length;
      input.setSelectionRange(length, length);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [portfolioAction]);

  useEffect(() => {
    const shouldTrackViewport = Boolean(portfolioAction || showSubscriptionSheet);
    if (!shouldTrackViewport || typeof window === 'undefined' || !window.visualViewport) {
      setKeyboardOffset(0);
      return;
    }

    const viewport = window.visualViewport;
    const updateKeyboardOffset = () => {
      const nextOffset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOffset(nextOffset);
    };

    updateKeyboardOffset();
    viewport.addEventListener('resize', updateKeyboardOffset);
    viewport.addEventListener('scroll', updateKeyboardOffset);

    return () => {
      viewport.removeEventListener('resize', updateKeyboardOffset);
      viewport.removeEventListener('scroll', updateKeyboardOffset);
      setKeyboardOffset(0);
    };
  }, [portfolioAction, showSubscriptionSheet]);

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
  const selectedMonthDate = new Date(`${selectedMonthKey}-01T00:00:00`);
  const portfolioMarketData = Array.from({ length: 8 }, (_, offset) => {
    const date = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() - (7 - offset), 1);
    const monthKey = getMonthKey(date);
    const monthTransactions = transactions.filter((transaction) => transaction.date.startsWith(monthKey));
    const income = monthTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expense = monthTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const net = income - expense;

    return {
      key: monthKey,
      label: getShortMonthLabel(monthKey),
      income,
      expense,
      net,
    };
  });
  const marketMin = Math.min(...portfolioMarketData.map((item) => item.net), 0);
  const marketMax = Math.max(...portfolioMarketData.map((item) => item.net), 0, 1);
  const marketRange = Math.max(1, marketMax - marketMin);
  const marketChartWidth = 320;
  const marketChartHeight = 132;
  const marketChartPaddingX = 8;
  const marketChartPaddingY = 14;
  const marketPoints = portfolioMarketData.map((item, index) => {
    const progressX = portfolioMarketData.length === 1 ? 0.5 : index / (portfolioMarketData.length - 1);
    const x = marketChartPaddingX + progressX * (marketChartWidth - marketChartPaddingX * 2);
    const normalized = (item.net - marketMin) / marketRange;
    const y = marketChartHeight - marketChartPaddingY - normalized * (marketChartHeight - marketChartPaddingY * 2);
    return { x, y, key: item.key, label: item.label, net: item.net };
  });
  const marketLinePath = buildLinePath(marketPoints);
  const marketAreaPath = buildAreaPath(marketPoints, marketChartHeight - marketChartPaddingY);
  const latestMarketPoint = portfolioMarketData[portfolioMarketData.length - 1];
  const previousMarketPoint = portfolioMarketData[portfolioMarketData.length - 2];
  const marketDelta = latestMarketPoint.net - (previousMarketPoint?.net ?? 0);

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.active);
  const monthlySubscriptionsTotal = activeSubscriptions.reduce((sum, subscription) => sum + subscription.amount, 0);
  const annualSubscriptionsTotal = monthlySubscriptionsTotal * 12;
  const calendarCells = buildSubscriptionCalendar(activeSubscriptions, calendarMonthDate);
  const calendarList = [...activeSubscriptions].sort(
    (a, b) => getClampedDayOfMonth(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth(), a.dayOfMonth)
      - getClampedDayOfMonth(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth(), b.dayOfMonth),
  );

  const recentTransactions = [...selectedMonthTransactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const openPortfolioAction = (action: Exclude<PortfolioAction, null>) => {
    setPortfolioAction(action);
    setMovementAmount('');
    setDescription('');
    setTotalAmount(action === 'balance' ? String(Math.max(totalBalance, 0)) : '');
    setEditingTransactionId(null);
  };

  const closePortfolioAction = () => {
    setPortfolioAction(null);
    setMovementAmount('');
    setDescription('');
    setTotalAmount('');
    setEditingTransactionId(null);
  };

  const openEditTransactionSheet = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id);
    setPortfolioAction(transaction.type === 'income' ? 'income' : 'expense');
    setMovementAmount(String(transaction.amount));
    setDescription(transaction.description);
    setSelectedCategory(transaction.category);
  };

  const savePortfolioAction = (event: React.FormEvent) => {
    event.preventDefault();
    if (!portfolioAction) return;

    if (portfolioAction === 'balance') {
      const parsedAmount = parseFloat(totalAmount);
      if (Number.isNaN(parsedAmount) || parsedAmount < 0) return;
      setAccounts((prev) => [{ ...(prev[0] ?? DEFAULT_ACCOUNT), balance: parsedAmount }]);
      closePortfolioAction();
      return;
    }

    const parsedAmount = parseFloat(movementAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    const type: MovementType = portfolioAction === 'income' ? 'income' : 'expense';

    if (editingTransactionId) {
      setTransactions((prev) => {
        const oldTransaction = prev.find((t) => t.id === editingTransactionId);
        if (!oldTransaction) return prev;

        const updatedTransactions = prev.map((transaction) =>
          transaction.id === editingTransactionId
            ? {
                ...transaction,
                amount: parsedAmount,
                type,
                description: description.trim()
                  ? description.trim().toUpperCase()
                  : selectedCategory,
                category: selectedCategory,
              }
            : transaction,
        );

        setAccounts((prevAccounts) => {
          const current = prevAccounts[0] ?? DEFAULT_ACCOUNT;
          // Rimuovi l'effetto della vecchia transazione
          const oldAmount = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
          // Aggiungi l'effetto della nuova transazione
          const newAmount = type === 'income' ? parsedAmount : -parsedAmount;
          return [{ ...current, balance: current.balance + oldAmount + newAmount }];
        });

        return updatedTransactions;
      });
    } else {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        accountId: DEFAULT_ACCOUNT.id,
        amount: parsedAmount,
        description: description.trim()
          ? description.trim().toUpperCase()
          : selectedCategory,
        date: new Date().toISOString(),
        type,
        category: selectedCategory,
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      setAccounts((prev) => {
        const current = prev[0] ?? DEFAULT_ACCOUNT;
        const balance = type === 'income'
          ? current.balance + parsedAmount
          : current.balance - parsedAmount;
        return [{ ...current, balance }];
      });
    }

    closePortfolioAction();
  };

  const deleteTransaction = () => {
    if (!editingTransactionId) return;
    
    setTransactions((prev) => {
      const transaction = prev.find((t) => t.id === editingTransactionId);
      if (!transaction) return prev;

      setAccounts((prevAccounts) => {
        const current = prevAccounts[0] ?? DEFAULT_ACCOUNT;
        const adjustment = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        return [{ ...current, balance: current.balance + adjustment }];
      });

      return prev.filter((t) => t.id !== editingTransactionId);
    });

    closePortfolioAction();
  };

  const saveSubscription = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = parseFloat(subscriptionAmount);
    const parsedDay = parseInt(subscriptionDay, 10);
    if (!subscriptionName.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (Number.isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) return;

    setSubscriptions((prev) => {
      if (editingSubscriptionId) {
        return prev.map((subscription) =>
          subscription.id === editingSubscriptionId
            ? {
                ...subscription,
                name: subscriptionName.trim(),
                amount: parsedAmount,
                dayOfMonth: parsedDay,
                iconName: subscriptionIconName,
                customIconDataUrl: subscriptionCustomIconDataUrl,
              }
            : subscription,
        );
      }

      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: subscriptionName.trim(),
          amount: parsedAmount,
          dayOfMonth: parsedDay,
          active: true,
          iconName: subscriptionIconName,
          customIconDataUrl: subscriptionCustomIconDataUrl,
        },
      ];
    });

    closeSubscriptionSheet();
  };

  const handleSubscriptionIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 512_000) {
      window.alert('Icona troppo grande. Usa un file sotto 512KB, meglio PNG/WebP trasparente.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSubscriptionCustomIconDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteSubscription = () => {
    if (!editingSubscriptionId) return;
    setSubscriptions((prev) => prev.filter((subscription) => subscription.id !== editingSubscriptionId));
    closeSubscriptionSheet();
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

  const subscriptionIconPreview = {
    name: subscriptionName.trim() || 'Abbonamento',
    iconName: subscriptionIconName,
    customIconDataUrl: subscriptionCustomIconDataUrl,
  };

  return (
    <div
      className={
        activeTab === 'subscriptions'
          ? 'min-h-full w-full min-w-0 overflow-x-clip md:border-2 md:border-black md:p-6'
          : 'finance-portfolio-screen offwhite-border min-h-full w-full min-w-0 overflow-x-clip'
      }
    >
      <div className={activeTab === 'subscriptions' ? 'hidden md:block' : ''}>
        <SectionHeader title="PORTAFOGLIO" label="GESTIONE_DENARO_V5.0" />
      </div>

      <div className={`finance-tab-shell mb-3 md:mb-6 grid grid-cols-2 gap-2 ${activeTab === 'subscriptions' ? 'hidden md:grid' : ''}`}>
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
        <div className="finance-ios-shell">
          <motion.section
            className="finance-ios-balance-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={FINANCE_SPRING}
          >
            <motion.button
              type="button"
              onClick={() => openPortfolioAction('balance')}
              className="finance-ios-balance-button"
              whileHover={FINANCE_HOVER}
              whileTap={FINANCE_TAP}
              transition={FINANCE_SPRING}
            >
              <div className="finance-ios-balance-topline">
                <span>Totale portafoglio</span>
                <small>Tocca per modificarlo</small>
              </div>
              <motion.div
                key={`balance-${totalBalance}`}
                className="finance-ios-balance-figure"
                initial={{ opacity: 0.72, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="finance-ios-balance-currency">EUR</span>
                <strong className="finance-ios-balance-amount"><AnimatedValue value={totalBalance} prefix="€" /></strong>
              </motion.div>
            </motion.button>

            <div className="finance-ios-actions">
              <motion.button
                type="button"
                onClick={() => openPortfolioAction('expense')}
                className="finance-ios-action is-minus"
                whileHover={FINANCE_HOVER}
                whileTap={FINANCE_TAP}
                transition={FINANCE_SPRING}
              >
                <Minus size={22} />
                <span>Uscita</span>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => openPortfolioAction('income')}
                className="finance-ios-action is-plus"
                whileHover={FINANCE_HOVER}
                whileTap={FINANCE_TAP}
                transition={FINANCE_SPRING}
              >
                <Plus size={22} />
                <span>Entrata</span>
              </motion.button>
            </div>

            <div className="finance-ios-month-strip">
              <motion.div
                key={`income-${selectedMonthIncome}`}
                initial={{ opacity: 0.8, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1], delay: 0.02 }}
              >
                <span>Entrate</span>
                <strong>€{formatCurrency(selectedMonthIncome)}</strong>
              </motion.div>
              <motion.div
                key={`expenses-${selectedMonthExpenses}`}
                initial={{ opacity: 0.8, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
              >
                <span>Uscite</span>
                <strong>€{formatCurrency(selectedMonthExpenses)}</strong>
              </motion.div>
              <motion.div
                key={`saved-${selectedMonthSaved}`}
                initial={{ opacity: 0.8, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              >
                <span>Netto</span>
                <strong>{selectedMonthSaved >= 0 ? '+' : '-'}€{formatCurrency(Math.abs(selectedMonthSaved))}</strong>
              </motion.div>
            </div>
          </motion.section>

          {/* AI CONTEXTUAL ADVISOR CARD */}
          <div className="border-2 border-black rounded-3xl p-5 bg-gradient-to-br from-white via-blue-50/10 to-indigo-50/10 relative overflow-hidden shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-offwhite-orange animate-pulse" />
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-offwhite-orange block">FINANCE_AI_ADVISOR</span>
                <h3 className="text-xs font-bold uppercase tracking-tight">Analista Finanziario IA</h3>
              </div>
            </div>

            {aiAdvice ? (
              <div className="space-y-3">
                <p className="text-sm font-mono leading-relaxed bg-black/5 p-3 rounded-2xl border border-black/5 text-black/80">
                  {aiAdvice}
                </p>
                <div className="flex justify-end">
                  <button 
                    onClick={fetchFinanceAIAdvice}
                    disabled={loadingAdvice || !apiKey}
                    className="flex items-center gap-1.5 border border-black px-2.5 py-1 rounded-xl text-[9px] font-mono uppercase bg-white hover:bg-black hover:text-white transition-colors"
                  >
                    <RefreshCw size={10} className={loadingAdvice ? 'animate-spin' : ''} />
                    Aggiorna Insight
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wide max-w-md">
                  {apiKey 
                    ? "Ottieni un'analisi e proiezione di spesa a fine mese basata sul tuo budget e abbonamenti attivi."
                    : "Configura la chiave API Gemini nell'AI Companion per sbloccare l'analisi finanziaria in tempo reale."
                  }
                </p>
                {apiKey && (
                  <button
                    onClick={fetchFinanceAIAdvice}
                    disabled={loadingAdvice}
                    className="flex items-center justify-center gap-1.5 border-2 border-black bg-black text-white hover:bg-offwhite-orange hover:border-offwhite-orange hover:text-black rounded-xl px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-all shrink-0 font-bold"
                  >
                    {loadingAdvice ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        Analisi...
                      </>
                    ) : (
                      <>
                        Chiedi all'IA
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            {errorAdvice && (
              <p className="mt-2 text-[10px] font-mono text-red-500 uppercase tracking-wider">{errorAdvice}</p>
            )}
          </div>

          <section className="finance-ios-history">
            <div className="finance-ios-history-head">
              <div>
                <span>Storico</span>
                <strong>{selectedMonthLabel}</strong>
              </div>
              <select value={selectedMonthKey} onChange={(event) => setSelectedMonthKey(event.target.value)}>
                {monthKeys.slice(0, 12).map((monthKey) => (
                  <option key={monthKey} value={monthKey}>
                    {formatMonthLabel(monthKey)}
                  </option>
                ))}
              </select>
            </div>

            <motion.div
              className="finance-ios-market-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            >
              <div className="finance-ios-market-head">
                <div>
                  <span>Trend cashflow</span>
                  <strong>Andamento portafoglio</strong>
                </div>
                <div className={`finance-ios-market-badge ${marketDelta >= 0 ? 'is-up' : 'is-down'}`}>
                  {marketDelta >= 0 ? '+' : '-'}€{formatCurrency(Math.abs(marketDelta))}
                </div>
              </div>

              <div className="finance-ios-market-chart">
                <svg viewBox={`0 0 ${marketChartWidth} ${marketChartHeight}`} preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="finance-market-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255, 92, 0, 0.28)" />
                      <stop offset="100%" stopColor="rgba(255, 92, 0, 0)" />
                    </linearGradient>
                  </defs>
                  <path className="finance-ios-market-area" d={marketAreaPath} />
                  <path className="finance-ios-market-line" d={marketLinePath} />
                  {marketPoints.map((point) => (
                    <circle
                      key={point.key}
                      className={point.key === selectedMonthKey ? 'is-current' : ''}
                      cx={point.x}
                      cy={point.y}
                      r={point.key === selectedMonthKey ? 4.5 : 3}
                    />
                  ))}
                </svg>
                <div className="finance-ios-market-axis">
                  {portfolioMarketData.map((item) => (
                    <small key={item.key} className={item.key === selectedMonthKey ? 'is-current' : ''}>
                      {item.label}
                    </small>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="finance-ios-list">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <button
                    key={transaction.id} 
                    type="button"
                    className="finance-ios-row"
                    onClick={() => openEditTransactionSheet(transaction)}
                  >
                    <div className={`finance-ios-row-icon ${transaction.type === 'income' ? 'is-income' : ''}`}>
                      {transaction.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div className="min-w-0">
                      <strong>{transaction.description}</strong>
                      <span>{transaction.category} · {new Date(transaction.date).toLocaleDateString('it-IT')}</span>
                    </div>
                    <b className={transaction.type === 'income' ? 'is-income' : ''}>
                      {transaction.type === 'income' ? '+' : '-'}€{formatCurrency(transaction.amount)}
                    </b>
                  </button>
                ))
              ) : (
                <div className="finance-ios-empty">Nessun movimento registrato</div>
              )}
            </div>
          </section>

          {portfolioAction ? (
            <div
              className="finance-ios-sheet-backdrop"
              onClick={closePortfolioAction}
              style={{ paddingBottom: `calc(1rem + ${keyboardOffset}px)` }}
            >
              <motion.form
                onSubmit={savePortfolioAction}
                className="finance-ios-sheet"
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 28, opacity: 0 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="finance-ios-sheet-handle" />
                <div className="finance-ios-sheet-head">
                  <div>
                    <span>{portfolioAction === 'balance' ? 'Saldo totale' : portfolioAction === 'income' ? 'Entrata' : 'Uscita'}</span>
                    <strong>{portfolioAction === 'balance' ? 'Imposta importo' : editingTransactionId ? 'Modifica movimento' : 'Nuovo movimento'}</strong>
                  </div>
                  <button type="button" onClick={closePortfolioAction}>×</button>
                </div>

                <label className="finance-ios-amount-field">
                  <div className="finance-ios-amount-head">
                    <span className="finance-ios-amount-kicker">Importo</span>
                    <span className="finance-ios-amount-currency">EUR</span>
                  </div>
                  <div className="finance-ios-amount-entry">
                    <span className="finance-ios-amount-prefix">€</span>
                    <input
                      ref={portfolioAmountInputRef}
                      inputMode="decimal"
                      type="text"
                      placeholder="0,00"
                      value={portfolioAction === 'balance' ? totalAmount : movementAmount}
                      onChange={(event) => {
                        const cleanValue = event.target.value.replace(/[^\d,.]/g, '').replace(',', '.');
                        if (portfolioAction === 'balance') setTotalAmount(cleanValue);
                        else setMovementAmount(cleanValue);
                      }}
                      className="finance-ios-amount-input"
                    />
                  </div>
                </label>

                {portfolioAction !== 'balance' ? (
                  <>
                    {editingTransactionId ? (
                      <div className="finance-ios-type-selector">
                        <button
                          type="button"
                          onClick={() => setPortfolioAction('income')}
                          className={`finance-ios-type-button ${portfolioAction === 'income' ? 'is-active' : ''}`}
                        >
                          <ArrowUpRight size={18} />
                          <span>Entrata</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortfolioAction('expense')}
                          className={`finance-ios-type-button ${portfolioAction === 'expense' ? 'is-active' : ''}`}
                        >
                          <ArrowDownRight size={18} />
                          <span>Uscita</span>
                        </button>
                      </div>
                    ) : null}
                    <select
                      value={selectedCategory}
                      onChange={(event) => setSelectedCategory(event.target.value)}
                      className="finance-ios-field"
                    >
                      {expenseCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Nota opzionale"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="finance-ios-field"
                    />
                  </>
                ) : null}

                <button type="submit" className="finance-ios-submit">
                  {editingTransactionId ? 'Salva modifiche' : 'Salva'}
                </button>

                {editingTransactionId ? (
                  <button
                    type="button"
                    onClick={deleteTransaction}
                    className="finance-ios-submit"
                    style={{ marginTop: '0.5rem', backgroundColor: '#dc2626' }}
                  >
                    Elimina movimento
                  </button>
                ) : null}
              </motion.form>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          <div className={`orbit-mobile-screen md:hidden ${subscriptionMobileView === 'calendar' ? 'is-calendar-view' : ''}`}>
            <div className="orbit-mobile-topbar">
              <div className="orbit-mobile-title">
                <div className="orbit-mobile-title-main">
                  {subscriptionMobileView === 'calendar' ? 'Calendario' : 'Hub Servizi'}
                </div>
              </div>
              <button
                type="button"
                className="orbit-top-action-button"
                onClick={() => setActiveTab('portfolio')}
                aria-label="Torna al portafoglio"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`orbit-top-action-button ${subscriptionMobileView === 'calendar' ? 'is-active' : ''}`}
                  onClick={() => setSubscriptionMobileView((view) => (view === 'calendar' ? 'subscriptions' : 'calendar'))}
                  aria-label={subscriptionMobileView === 'calendar' ? 'Mostra lista abbonamenti' : 'Mostra calendario'}
                >
                  <CalendarDays size={20} />
                </button>
                <button
                  type="button"
                  className={`orbit-notification-button ${notificationPermission === 'granted' ? 'is-active' : ''}`}
                  onClick={requestNotificationPermission}
                >
                  <BellRing size={20} />
                </button>
                <button type="button" className="orbit-plus-button" onClick={openNewSubscriptionSheet}>
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
                          '--orbit-duration': `${12 + layerIndex * 4}s`,
                          '--orbit-direction': layerIndex % 2 === 0 ? 'normal' : 'reverse',
                        } as React.CSSProperties
                      }
                    >
                      <div className={`orbit-hero-ring ${layerIndex === 0 ? 'orbit-hero-ring-primary' : 'orbit-hero-ring-secondary'}`} />
                      {layer.items.map((subscription, itemIndex) => {
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
                              <SubscriptionIcon subscription={subscription} size={nodeSize > 28 ? 17 : 15} />
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
                  <div className="min-w-0">
                    <div className="orbit-mobile-stat-value">{activeSubscriptions.length}</div>
                    <div className="orbit-mobile-stat-label">Personal</div>
                  </div>
                  <div className="orbit-mobile-stat-card is-right">
                    <div className="orbit-mobile-stat-value orbit-mobile-stat-value-amount">€{formatCurrency(annualSubscriptionsTotal)}</div>
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
                      return (
                        <button
                          type="button"
                          key={subscription.id}
                          className="orbit-subscription-row"
                          onClick={() => openEditSubscriptionSheet(subscription)}
                        >
                          <div className="orbit-subscription-row-left">
                            <div className="orbit-subscription-icon">
                              <SubscriptionIcon subscription={subscription} size={20} />
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

            {showSubscriptionSheet && (
              <div className="orbit-sheet-backdrop" onClick={closeSubscriptionSheet}>
                <div className="orbit-sheet" onClick={(event) => event.stopPropagation()}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="orbit-sheet-kicker">
                        {editingSubscriptionId ? 'Gestione abbonamento' : 'Nuovo abbonamento'}
                      </div>
                      <div className="orbit-sheet-title">
                        {editingSubscriptionId ? 'Modifica servizio' : 'Aggiungi servizio'}
                      </div>
                      <div className="orbit-sheet-body">
                        Il rinnovo e mensile: scegli il giorno del mese in cui verra addebitato.
                      </div>
                    </div>
                    <button type="button" className="orbit-sheet-close" onClick={closeSubscriptionSheet}>
                      ×
                    </button>
                  </div>

                  <form onSubmit={saveSubscription} className="space-y-3">
                    <input
                      id="subscription-name-input"
                      type="text"
                      placeholder="NOME ABBONAMENTO"
                      value={subscriptionName}
                      onChange={(event) => setSubscriptionName(event.target.value)}
                      className="orbit-sheet-input w-full"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="IMPORTO"
                        value={subscriptionAmount}
                        onChange={(event) => setSubscriptionAmount(event.target.value)}
                        className="orbit-sheet-input"
                      />
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="GIORNO RINNOVO"
                        value={subscriptionDay}
                        onChange={(event) => setSubscriptionDay(event.target.value)}
                        className="orbit-sheet-input"
                      />
                    </div>

                    <div className="orbit-sheet-note">
                      Si rinnova ogni mese il giorno <strong>{subscriptionDay || '1'}</strong>.
                    </div>

                    <div className="subscription-icon-grid">
                      {SUBSCRIPTION_ICON_OPTIONS.map((option) => {
                        const active = !subscriptionCustomIconDataUrl && subscriptionIconName === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setSubscriptionIconName(option.id);
                              setSubscriptionCustomIconDataUrl(undefined);
                            }}
                            className={`subscription-icon-picker orbit-sheet-icon-picker ${active ? 'is-active' : ''}`}
                          >
                            <option.Icon size={18} />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="subscription-custom-icon-panel">
                      <div className="subscription-custom-icon-preview">
                        <SubscriptionIcon subscription={subscriptionIconPreview} size={30} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="subscription-custom-icon-title">Icona personalizzata</div>
                        <div className="subscription-custom-icon-copy">Carica PNG/WebP/SVG trasparente: viene inserita senza sfondo.</div>
                      </div>
                      <label className="subscription-upload-button">
                        <ImagePlus size={16} />
                        Carica
                        <input type="file" accept="image/*" onChange={handleSubscriptionIconUpload} />
                      </label>
                      {subscriptionCustomIconDataUrl ? (
                        <button
                          type="button"
                          onClick={() => setSubscriptionCustomIconDataUrl(undefined)}
                          className="subscription-reset-icon-button"
                          aria-label="Rimuovi icona personalizzata"
                        >
                          <RotateCcw size={16} />
                        </button>
                      ) : null}
                    </div>

                    <button
                      type="submit"
                      className="orbit-sheet-action orbit-sheet-action-primary w-full"
                    >
                      {editingSubscriptionId ? 'Salva modifiche' : 'Salva abbonamento'}
                    </button>

                    {editingSubscriptionId ? (
                      <button
                        type="button"
                        onClick={deleteSubscription}
                        className="orbit-sheet-action orbit-sheet-action-secondary w-full"
                      >
                        Elimina abbonamento
                      </button>
                    ) : null}
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
                  openNewSubscriptionSheet();
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
                        <SubscriptionIcon subscription={subscription} size={18} />
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

                <form onSubmit={saveSubscription} className="space-y-3">
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
                      const active = !subscriptionCustomIconDataUrl && subscriptionIconName === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setSubscriptionIconName(option.id);
                            setSubscriptionCustomIconDataUrl(undefined);
                          }}
                          className={`subscription-icon-picker ${active ? 'is-active' : ''}`}
                        >
                          <option.Icon size={18} />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="subscription-custom-icon-panel">
                    <div className="subscription-custom-icon-preview">
                      <SubscriptionIcon subscription={subscriptionIconPreview} size={30} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="subscription-custom-icon-title">Icona personalizzata</div>
                      <div className="subscription-custom-icon-copy">Carica un file con trasparenza: verra usato senza sfondo.</div>
                    </div>
                    <label className="subscription-upload-button">
                      <ImagePlus size={16} />
                      Carica
                      <input type="file" accept="image/*" onChange={handleSubscriptionIconUpload} />
                    </label>
                    {subscriptionCustomIconDataUrl ? (
                      <button
                        type="button"
                        onClick={() => setSubscriptionCustomIconDataUrl(undefined)}
                        className="subscription-reset-icon-button"
                        aria-label="Rimuovi icona personalizzata"
                      >
                        <RotateCcw size={16} />
                      </button>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className="w-full border-2 border-black bg-black px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-offwhite-orange"
                  >
                    {editingSubscriptionId ? 'Salva modifiche' : 'Salva abbonamento'}
                  </button>
                </form>
              </div>

              <div className="space-y-3 pt-5">
                {subscriptions.length > 0 ? (
                  subscriptions.map((subscription) => {
                    return (
                      <button
                        type="button"
                        key={subscription.id}
                        className={`subscription-app-row w-full ${subscription.active ? '' : 'is-muted'}`}
                        onClick={() => openEditSubscriptionSheet(subscription)}
                      >
                        <div className="subscription-app-row-left">
                          <div className="subscription-app-row-icon">
                            <SubscriptionIcon subscription={subscription} size={18} />
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
