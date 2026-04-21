import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, ClipboardList, ExternalLink, Info, Pill, Plus, RefreshCw, Scale, ShoppingCart, Sparkles, Trash2 } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import type { MealCategory, Recipe, ShoppingItem } from '../types';

const OWNER_EMAIL = 'thsedici@gmail.com';

// ─── DIET PLAN (owner only) ───────────────────────────────────────────────────

const DIET_PLAN = {
  bmi: {
    value: 24.98,
    status: 'PESO NORMALE (LIMITE SUPERIORE)',
    note: 'Obiettivo: aumento massa muscolare e riduzione grasso.',
  },
  schedule: {
    LUNEDÌ: 'HIGH CARB',
    MARTEDÌ: 'MEDIUM CARB',
    MERCOLEDÌ: 'LOW CARB',
    GIOVEDÌ: 'HIGH CARB',
    VENERDÌ: 'MEDIUM CARB',
    SABATO: 'HIGH CARB',
    DOMENICA: 'LOW CARB',
  },
  guidelines: [
    { title: 'ACQUA', content: '2.5-3 litri al giorno. Aumentare durante allenamento.' },
    { title: 'SALE', content: '5-6g al giorno. Un po di piu nei giorni intensi.' },
    { title: 'CAFFÈ', content: 'Moderato, senza zucchero. Meglio mattina o pre-workout.' },
    { title: 'OLIO/GRASSI', content: 'EVO a crudo. Avocado, noci, semi, olio di cocco.' },
    { title: 'PASTO LIBERO', content: '1 volta a settimana, preferibilmente giorno High Carb.' },
  ],
  portions: [
    { item: 'PROTEINE', size: 'Palmo della mano (120-150g)' },
    { item: 'VERDURE', size: 'Due mani a coppa (abbondante)' },
    { item: 'CARBOIDRATI', size: 'Pugno chiuso (80-100g cotti)' },
    { item: 'GRASSI', size: 'Punta del pollice (10g / 1 cucchiaio)' },
  ],
  menus: {
    phase1: {
      high: [
        { meal: 'COLAZIONE', items: ['Avena 80g', 'Frutti di bosco 100g', 'Semi di chia 10g', 'Cannella'] },
        { meal: 'SPUNTINO', items: ['Yogurt greco intero 150g', 'Miele 5g', 'Frutta secca 20g'] },
        { meal: 'PRANZO', items: ['Riso basmati 120g', 'Petto di pollo 150g', 'Verdure al vapore 200g', 'EVO 10g'] },
        { meal: 'MERENDA', items: ['Banana 1', 'Proteine in polvere 30g'] },
        { meal: 'CENA', items: ['Pasta integrale 100g', 'Pesto 30g', 'Insalata 150g', 'EVO 10g'] },
      ],
      medium: [
        { meal: 'COLAZIONE', items: ['Pancake proteici', '2 uova', '50g avena', '1 banana', 'Burro arachidi 10g'] },
        { meal: 'SPUNTINO', items: ['Frutta fresca 150g'] },
        { meal: 'PRANZO', items: ['Pollo alla piastra 150g', 'Patate dolci 150g', 'Insalata 100g', 'EVO 10g'] },
        { meal: 'MERENDA', items: ['Skyr o kefir 200ml'] },
        { meal: 'CENA', items: ['Zuppa di legumi 150g', 'Crostini integrali 30g', 'Verdure crude'] },
      ],
      low: [
        { meal: 'COLAZIONE', items: ['3 uova intere', 'Burro arachidi 10g', 'Miele 10g'] },
        { meal: 'SPUNTINO', items: ['Frutta secca mista 30g'] },
        { meal: 'PRANZO', items: ['Farro 80g', 'Tonno naturale 150g', 'Pomodorini e cetrioli 150g', 'EVO 10g'] },
        { meal: 'MERENDA', items: ['Cioccolato fondente 70% 15g'] },
        { meal: 'CENA', items: ['Salmone 180g', 'Asparagi 150g', 'Verdure grigliate 200g', 'EVO 10g'] },
      ],
    },
    phase2: {
      high: [
        { meal: 'COLAZIONE', items: ['Pane integrale 90g', 'Marmellata 20g', 'Omelette 3 albumi + 1 uovo', 'Frullato mandorla e frutta'] },
        { meal: 'SPUNTINO', items: ['Ricotta magra 100g', 'Miele 5g', 'Noci 15g'] },
        { meal: 'PRANZO', items: ['Couscous integrale 120g', 'Tacchino 150g', 'Verdure grigliate 200g', 'EVO 10g'] },
        { meal: 'MERENDA', items: ['Frutta fresca 150g', 'Yogurt greco 150g'] },
        { meal: 'CENA', items: ['Risotto integrale ai funghi 100g', 'Gamberi 150g', 'Insalata con avocado 100g', 'EVO 10g'] },
      ],
      medium: [
        { meal: 'COLAZIONE', items: ['Pancake di avena 50g', '1 uovo', 'Latte di mandorla', 'Frutti di bosco 100g'] },
        { meal: 'SPUNTINO', items: ['Mela 150g', 'Burro di mandorle 20g'] },
        { meal: 'PRANZO', items: ['Filetto di manzo 200g', 'Orzo perlato 100g', 'Zucchine 150g', 'EVO 10g'] },
        { meal: 'MERENDA', items: ['Yogurt greco 150g', 'Burro d arachidi 10g'] },
        { meal: 'CENA', items: ['Zuppa di pesce', 'Crostini integrali 30g', 'Verdure crude'] },
      ],
      low: [
        { meal: 'COLAZIONE', items: ['Frittata 3 uova', 'Burro di mandorle 15g', 'Miele 10g'] },
        { meal: 'SPUNTINO', items: ['Mix semi 20g'] },
        { meal: 'PRANZO', items: ['Merluzzo al forno 180g', 'Asparagi 150g', 'Rucola e finocchio 150g', 'EVO 10g'] },
        { meal: 'MERENDA', items: ['Cioccolato fondente 70% 20g'] },
        { meal: 'CENA', items: ['Tofu grigliato 150g', 'Broccoli 150g', 'Funghi trifolati 100g', 'EVO 10g'] },
      ],
    },
  },
} as const;

// ─── RECIPE POOL (12 ricette, ruotano ogni giorno) ────────────────────────────

type RecipeSuggestion = {
  id: string;
  title: string;
  source: string;
  url: string;
  image: string;
  focus: string;
  tag: string;
  ingredients: string[];
};

const ALL_RECIPE_POOL: RecipeSuggestion[] = [
  {
    id: 'pancake-proteici',
    title: 'Pancake proteici',
    source: 'GialloZafferano Blog',
    url: 'https://blog.giallozafferano.it/crisemaxincucina/pancake-proteici/',
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&q=75',
    focus: 'Colazione · medium day',
    tag: 'Pre-workout',
    ingredients: ['Albumi', 'Avena', 'Yogurt', 'Frutta'],
  },
  {
    id: 'salmone-asparagi',
    title: 'Salmone al forno con asparagi',
    source: "Cucchiaio d'Argento",
    url: 'https://www.cucchiaio.it/ricetta/salmone-al-forno-con-asparagi/',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=75',
    focus: 'Cena · low day',
    tag: 'Proteine + verdure',
    ingredients: ['Salmone', 'Asparagi', 'Limone', 'EVO'],
  },
  {
    id: 'pollo-peperoni',
    title: 'Pollo e peperoni in padella',
    source: "Cucchiaio d'Argento",
    url: 'https://www.cucchiaio.it/ricetta/pollo-e-peperoni-in-padella/',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=75',
    focus: 'Pranzo · high day',
    tag: 'Meal prep',
    ingredients: ['Pollo', 'Peperoni', 'Aglio', 'Basilico'],
  },
  {
    id: 'cous-cous-pollo',
    title: 'Cous cous pollo e spezie',
    source: "Cucchiaio d'Argento",
    url: 'https://www.cucchiaio.it/ricetta/ricetta-cuscus-pollo-spezie-verdure/',
    image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&q=75',
    focus: 'Pranzo · high day',
    tag: 'Carbo + proteine',
    ingredients: ['Cous cous', 'Pollo', 'Carote', 'Spezie'],
  },
  {
    id: 'omelette-verdure',
    title: 'Omelette con verdure',
    source: 'GialloZafferano',
    url: 'https://ricette.giallozafferano.it/Omelette-alle-verdure.html',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=75',
    focus: 'Colazione · low day',
    tag: 'Proteine mattina',
    ingredients: ['Uova', 'Zucchine', 'Peperoni', 'Erbe'],
  },
  {
    id: 'riso-tonno',
    title: 'Riso integrale con tonno',
    source: 'GialloZafferano',
    url: 'https://ricette.giallozafferano.it/Riso-con-tonno.html',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=75',
    focus: 'Pranzo · medium day',
    tag: 'Veloce',
    ingredients: ['Riso integrale', 'Tonno', 'Pomodorini', 'Capperi'],
  },
  {
    id: 'bowl-avocado',
    title: 'Bowl pollo e avocado',
    source: 'GialloZafferano',
    url: 'https://ricette.giallozafferano.it/Chicken-bowl.html',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=75',
    focus: 'Pranzo · high day',
    tag: 'Post-workout',
    ingredients: ['Pollo grigliato', 'Avocado', 'Riso', 'Limone'],
  },
  {
    id: 'branzino-limone',
    title: 'Branzino al limone e erbe',
    source: "Cucchiaio d'Argento",
    url: 'https://www.cucchiaio.it/ricetta/branzino-al-forno/',
    image: 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=600&q=75',
    focus: 'Cena · low day',
    tag: 'Omega-3',
    ingredients: ['Branzino', 'Limone', 'Timo', 'Rosmarino'],
  },
  {
    id: 'frittata-spinaci',
    title: 'Frittata spinaci e ricotta',
    source: 'GialloZafferano',
    url: 'https://ricette.giallozafferano.it/Frittata-con-spinaci.html',
    image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600&q=75',
    focus: 'Cena · medium day',
    tag: 'Proteine + ferro',
    ingredients: ['Uova', 'Spinaci', 'Ricotta', 'Parmigiano'],
  },
  {
    id: 'zuppa-legumi',
    title: 'Zuppa di legumi misti',
    source: "Cucchiaio d'Argento",
    url: 'https://www.cucchiaio.it/ricetta/minestrone-di-legumi/',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=75',
    focus: 'Cena · medium day',
    tag: 'Fibre + proteine',
    ingredients: ['Lenticchie', 'Ceci', 'Carote', 'Sedano'],
  },
  {
    id: 'tacchino-patate',
    title: 'Tacchino con patate dolci',
    source: 'GialloZafferano',
    url: 'https://ricette.giallozafferano.it/Fesa-di-tacchino-al-forno.html',
    image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&q=75',
    focus: 'Pranzo · high day',
    tag: 'Lean bulk',
    ingredients: ['Petto di tacchino', 'Patate dolci', 'Rosmarino', 'EVO'],
  },
  {
    id: 'yogurt-bowl',
    title: 'Yogurt bowl con frutta e semi',
    source: 'GialloZafferano Blog',
    url: 'https://blog.giallozafferano.it/peccatodigola/smoothie-bowl/',
    image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&q=75',
    focus: 'Colazione · qualsiasi',
    tag: 'Rapido',
    ingredients: ['Yogurt greco', 'Frutti di bosco', 'Semi di chia', 'Miele'],
  },
];

// Daily rotation: seed from date string → pick 4 recipes
function getDailyRecipes(dateKey: string): RecipeSuggestion[] {
  let hash = 5381;
  for (let i = 0; i < dateKey.length; i++) {
    hash = ((hash << 5) + hash) ^ dateKey.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned
  }
  const pool = [...ALL_RECIPE_POOL];
  // Seeded Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 4);
}

function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

type DietProps = {
  ownerEmail?: string | null;
};

export const Diet: React.FC<DietProps> = ({ ownerEmail }) => {
  const [activeView, setActiveView] = useState<'TRACKER' | 'PLAN'>('TRACKER');
  const [activePhase, setActivePhase] = useState<'phase1' | 'phase2'>('phase1');
  const [activeCarb, setActiveCarb] = useState<'high' | 'medium' | 'low'>('high');
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem('offwhite_recipes');
      return saved ? (JSON.parse(saved) as Recipe[]) : [];
    } catch {
      return [];
    }
  });
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeIngredients, setNewRecipeIngredients] = useState('');
  const [newRecipeImage, setNewRecipeImage] = useState('');
  const [newRecipeCategory, setNewRecipeCategory] = useState<MealCategory>('pranzo');
  const [savedToday, setSavedToday] = useState<Set<string>>(new Set());

  const isOwner = ownerEmail?.toLowerCase().trim() === OWNER_EMAIL;
  const todayKey = getLocalDateKey();

  const dailyRecipes = useMemo(() => getDailyRecipes(todayKey), [todayKey]);

  // Mark already-saved suggestions
  useEffect(() => {
    const alreadySaved = new Set(
      dailyRecipes
        .filter((s) => recipes.some((r) => r.name === s.title.toUpperCase()))
        .map((s) => s.id),
    );
    setSavedToday(alreadySaved);
  }, [recipes, dailyRecipes]);

  useEffect(() => {
    localStorage.setItem('offwhite_recipes', JSON.stringify(recipes));
    window.dispatchEvent(new CustomEvent('dashboard-data-update'));
  }, [recipes]);

  const saveSuggestion = (suggestion: RecipeSuggestion) => {
    setRecipes((current) => {
      if (current.some((r) => r.name === suggestion.title.toUpperCase())) return current;
      return [
        ...current,
        {
          id: crypto.randomUUID(),
          name: suggestion.title.toUpperCase(),
          ingredients: suggestion.ingredients,
          image: suggestion.image,
          category: 'pranzo' as MealCategory,
        },
      ];
    });
    setSavedToday((prev) => new Set([...prev, suggestion.id]));
  };

  const saveAllDaily = () => {
    dailyRecipes.forEach((s) => saveSuggestion(s));
  };

  const addRecipe = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newRecipeName.trim() || !newRecipeIngredients.trim()) return;

    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      name: newRecipeName.trim().toUpperCase(),
      ingredients: newRecipeIngredients
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean),
      image: newRecipeImage.trim() || undefined,
      category: newRecipeCategory,
    };

    setRecipes((current) => [...current, newRecipe]);
    setNewRecipeName('');
    setNewRecipeIngredients('');
    setNewRecipeImage('');
    setNewRecipeCategory('pranzo');
  };

  const addToShoppingList = (recipe: Recipe) => {
    const currentShopping: ShoppingItem[] = JSON.parse(localStorage.getItem('offwhite_shopping') || '[]');
    const newItems = recipe.ingredients.map((ingredient) => ({
      id: crypto.randomUUID(),
      name: ingredient.toUpperCase(),
      bought: false,
    }));
    localStorage.setItem('offwhite_shopping', JSON.stringify([...currentShopping, ...newItems]));
    window.dispatchEvent(new CustomEvent('shopping-update'));
  };

  const deleteRecipe = (id: string) => {
    setRecipes((current) => current.filter((r) => r.id !== id));
  };

  return (
    <div className="offwhite-border h-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader title="ALIMENTAZIONE" label="NUTRITION_SPACE" className="mb-0" />
        <div className="flex bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveView('TRACKER')}
            className={`px-4 py-1.5 font-mono text-[10px] uppercase font-bold transition-all ${activeView === 'TRACKER' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Diario
          </button>
          <button
            type="button"
            onClick={() => setActiveView('PLAN')}
            className={`px-4 py-1.5 font-mono text-[10px] uppercase font-bold transition-all ${activeView === 'PLAN' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Piano
          </button>
        </div>
      </div>

      {activeView === 'TRACKER' ? (
        <div className="mt-6 space-y-8">

          {/* ── Ispirazioni del giorno ── */}
          <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-offwhite-orange" />
                  <span className="font-black text-sm uppercase tracking-tight">Ispirazioni di oggi</span>
                </div>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-gray-400">
                  {todayKey} · 4 ricette nuove ogni giorno
                </p>
              </div>
              <button
                type="button"
                onClick={saveAllDaily}
                className="border-2 border-black bg-white px-4 py-2 font-mono text-[10px] font-black uppercase tracking-widest transition hover:bg-black hover:text-white"
              >
                Salva tutte nel vault
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dailyRecipes.map((s) => {
                const isSaved = savedToday.has(s.id);
                return (
                  <div key={s.id} className="flex flex-col border-2 border-black bg-white">
                    {/* Image */}
                    <div
                      className="h-36 w-full shrink-0 border-b-2 border-black"
                      style={{
                        backgroundImage: `url(${s.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    {/* Content */}
                    <div className="flex flex-1 flex-col p-3">
                      <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-offwhite-orange">
                        {s.source}
                      </div>
                      <div className="mt-1 text-base font-black uppercase leading-tight tracking-tight">
                        {s.title}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="bg-black px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.14em] text-white">
                          {s.focus}
                        </span>
                        <span className="border border-black/30 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.14em] text-gray-500">
                          {s.tag}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.ingredients.map((ing) => (
                          <span
                            key={ing}
                            className="border border-black/15 bg-gray-50 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.12em] text-gray-500"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto flex gap-2 pt-3">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-white transition hover:bg-black hover:text-white"
                          aria-label="Apri ricetta"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button
                          type="button"
                          onClick={() => saveSuggestion(s)}
                          disabled={isSaved}
                          className={`flex flex-1 items-center justify-center gap-1.5 border-2 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest transition ${
                            isSaved
                              ? 'border-black/20 bg-gray-50 text-gray-400 cursor-default'
                              : 'border-black bg-black text-white hover:bg-offwhite-orange hover:border-offwhite-orange hover:text-black'
                          }`}
                        >
                          {isSaved ? <><Check size={11} /> Salvata</> : 'Salva'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Vault personale ── */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-black" />
              <span className="font-black text-sm uppercase tracking-tight">Vault ricette</span>
              <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.22em] text-gray-400">
                {recipes.length} salvate
              </span>
            </div>

            {recipes.length === 0 ? (
              <div className="border-2 border-dashed border-black/15 py-10 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-gray-300">
                Nessuna ricetta salvata ancora
              </div>
            ) : (
              <div className="space-y-6">
                {(['mattina', 'pranzo', 'cena', 'spuntino'] as MealCategory[]).map((cat) => {
                  const catRecipes = recipes.filter((r) => (r.category ?? 'pranzo') === cat);
                  if (catRecipes.length === 0) return null;
                  const catLabel: Record<MealCategory, string> = {
                    mattina: '☀️ Mattina',
                    pranzo: '🍽 Pranzo',
                    cena: '🌙 Cena',
                    spuntino: '🥜 Spuntino',
                  };
                  return (
                    <div key={cat}>
                      <div className="mb-3 font-mono text-[9px] font-black uppercase tracking-[0.28em] text-gray-400">
                        {catLabel[cat]}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {catRecipes.map((recipe) => (
                          <div key={recipe.id} className="border-2 border-black bg-white">
                            {recipe.image ? (
                              <div
                                className="h-32 w-full border-b-2 border-black"
                                style={{
                                  backgroundImage: `url(${recipe.image})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }}
                              />
                            ) : null}
                            <div className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-black uppercase leading-tight tracking-tight break-words">
                                    {recipe.name}
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {recipe.ingredients.map((ing, idx) => (
                                      <span
                                        key={`${recipe.id}-${idx}`}
                                        className="bg-black px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.12em] text-white"
                                      >
                                        {ing}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex shrink-0 flex-col gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => addToShoppingList(recipe)}
                                    className="flex h-8 w-8 items-center justify-center border-2 border-black transition hover:bg-black hover:text-white"
                                    title="Aggiungi alla spesa"
                                  >
                                    <ShoppingCart size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteRecipe(recipe.id)}
                                    className="flex h-8 w-8 items-center justify-center border-2 border-black transition hover:bg-offwhite-orange hover:text-white"
                                    title="Elimina"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Aggiungi ricetta manuale */}
            <form onSubmit={addRecipe} className="mt-6 space-y-2 border-2 border-dashed border-black p-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-gray-400">
                Aggiungi ricetta personale
              </div>
              <input
                type="text"
                placeholder="NOME RICETTA"
                value={newRecipeName}
                onChange={(e) => setNewRecipeName(e.target.value)}
                className="w-full border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none transition-all"
              />
              <textarea
                placeholder="INGREDIENTI SEPARATI DA VIRGOLA"
                value={newRecipeIngredients}
                onChange={(e) => setNewRecipeIngredients(e.target.value)}
                rows={3}
                className="w-full border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none transition-all resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newRecipeCategory}
                  onChange={(e) => setNewRecipeCategory(e.target.value as MealCategory)}
                  className="border-2 border-black bg-white p-3 font-mono text-xs uppercase focus:outline-none"
                >
                  <option value="mattina">☀️ Mattina</option>
                  <option value="pranzo">🍽 Pranzo</option>
                  <option value="cena">🌙 Cena</option>
                  <option value="spuntino">🥜 Spuntino</option>
                </select>
                <input
                  type="url"
                  placeholder="URL IMMAGINE (OPZ.)"
                  value={newRecipeImage}
                  onChange={(e) => setNewRecipeImage(e.target.value)}
                  className="border-2 border-black p-3 font-mono text-xs uppercase focus:bg-black focus:text-white focus:outline-none transition-all"
                />
              </div>
              {newRecipeImage.trim() ? (
                <div
                  className="h-24 w-full border-2 border-black"
                  style={{
                    backgroundImage: `url(${newRecipeImage.trim()})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ) : null}
              <button
                type="submit"
                className="w-full bg-black py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white transition hover:bg-offwhite-orange hover:text-black"
              >
                <Plus size={14} className="mr-2 inline" />
                Salva ricetta
              </button>
            </form>
          </div>
        </div>
      ) : isOwner ? (
        /* ── PIANO (owner only) ── */
        <div className="mt-6 space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border-2 border-black bg-black p-6 text-white">
              <div className="mb-3 flex items-center gap-2">
                <Scale size={16} className="text-offwhite-orange" />
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">BMI</div>
              </div>
              <div className="text-4xl font-black tracking-tighter text-offwhite-orange">{DIET_PLAN.bmi.value}</div>
              <div className="mt-2 font-mono text-[8px] uppercase leading-tight text-white/55">{DIET_PLAN.bmi.status}</div>
              <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">{DIET_PLAN.bmi.note}</div>
            </div>
            <div className="border-2 border-black bg-white p-6 md:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <RefreshCw size={16} />
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest">Carb cycling settimanale</div>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {Object.entries(DIET_PLAN.schedule).map(([day, type]) => (
                  <div key={day} className="text-center">
                    <div className="mb-1 font-mono text-[8px] font-bold text-gray-400">{day.slice(0, 3)}</div>
                    <div className={`p-2 font-black text-[8px] uppercase ${type === 'HIGH CARB' ? 'bg-black text-white' : type === 'MEDIUM CARB' ? 'bg-gray-100 text-black' : 'bg-gray-50 text-gray-400'}`}>
                      {type.split(' ')[0]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                <ClipboardList size={18} />
                <div className="font-black text-sm uppercase tracking-tight">Linee guida</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {DIET_PLAN.guidelines.map((g) => (
                  <div key={g.title} className="border-2 border-black bg-white p-4">
                    <div className="mb-1 font-black text-[10px] uppercase tracking-widest text-offwhite-orange">{g.title}</div>
                    <div className="font-mono text-[10px] uppercase leading-tight text-gray-600">{g.content}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                <Info size={18} />
                <div className="font-black text-sm uppercase tracking-tight">Guida porzioni</div>
              </div>
              <div className="space-y-2">
                {DIET_PLAN.portions.map((p) => (
                  <div key={p.item} className="flex items-center justify-between border border-black/10 bg-gray-50 p-3">
                    <div className="font-black text-[10px] uppercase tracking-widest">{p.item}</div>
                    <div className="font-mono text-[10px] uppercase text-offwhite-orange">{p.size}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-2 border-black bg-gray-50 p-6">
            <div className="mb-5 flex items-center gap-2">
              <Pill size={18} />
              <div className="font-black text-sm uppercase tracking-tight">Integratori</div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: 'OMEGA-3', desc: '1-3g al giorno durante i pasti principali.' },
                { title: 'MULTIVITAMINICO', desc: '1 compressa al mattino con la colazione.' },
                { title: 'MAGNESIO', desc: '300-400mg prima di dormire.' },
              ].map((item) => (
                <div key={item.title} className="border-2 border-black bg-white p-4">
                  <div className="mb-1 font-black text-[10px] uppercase text-offwhite-orange">{item.title}</div>
                  <div className="font-mono text-[10px] uppercase leading-tight text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-2">
              <div className="font-black text-sm uppercase tracking-tight">Menu giornalieri</div>
              <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1">
                <select
                  value={activePhase}
                  onChange={(e) => setActivePhase(e.target.value as 'phase1' | 'phase2')}
                  className="bg-transparent px-2 py-1 font-mono text-[10px] font-bold uppercase outline-none"
                >
                  <option value="phase1">Fase 1-2</option>
                  <option value="phase2">Fase 3-4</option>
                </select>
                <div className="flex gap-1">
                  {(['high', 'medium', 'low'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveCarb(type)}
                      className={`px-3 py-1 font-mono text-[8px] font-bold uppercase transition-all ${activeCarb === type ? 'bg-black text-white' : 'text-gray-400'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {DIET_PLAN.menus[activePhase][activeCarb].map((meal, index) => (
                <div key={`${meal.meal}-${index}`} className="border-2 border-black bg-white p-5">
                  <div className="mb-3 border-b border-black/10 pb-2 font-black text-[10px] uppercase tracking-widest text-offwhite-orange">
                    {meal.meal}
                  </div>
                  <ul className="space-y-2">
                    {meal.items.map((item) => (
                      <li key={item} className="flex gap-2 font-mono text-[10px] uppercase leading-tight text-gray-600">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-black" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 border-2 border-black bg-gray-50 p-6">
          <div className="offwhite-label">PIANO_PERSONALE</div>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-tighter">Piano riservato</h2>
          <p className="mt-3 max-w-2xl font-mono text-[10px] uppercase leading-relaxed tracking-widest text-gray-500">
            Piano dietetico disponibile solo sull account proprietario.
          </p>
        </div>
      )}
    </div>
  );
};
