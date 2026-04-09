import React, { useState, useEffect } from 'react';
import { SectionHeader } from './SectionHeader';
import { Plus, Trash2, BookOpen, ShoppingCart, Info, ClipboardList, Scale, RefreshCw, Pill } from 'lucide-react';
import { Recipe, ShoppingItem } from '../types';

const DIET_PLAN = {
  bmi: {
    value: 24.98,
    status: 'PESO NORMALE (LIMITE SUPERIORE)',
    note: 'Obiettivo: Aumento massa muscolare e riduzione grasso.'
  },
  schedule: {
    'LUNEDÌ': 'HIGH CARB',
    'MARTEDÌ': 'MEDIUM CARB',
    'MERCOLEDÌ': 'LOW CARB',
    'GIOVEDÌ': 'HIGH CARB',
    'VENERDÌ': 'MEDIUM CARB',
    'SABATO': 'HIGH CARB',
    'DOMENICA': 'LOW CARB'
  },
  guidelines: [
    { title: 'ACQUA', content: '2.5-3 litri al giorno. Aumentare durante allenamento.' },
    { title: 'SALE', content: '5-6g al giorno (Marino/Himalaya). Più nei giorni intensi.' },
    { title: 'CAFFÈ', content: 'Moderato, senza zucchero. Meglio mattina o pre-workout.' },
    { title: 'OLIO/GRASSI', content: 'EVO a crudo. Avocado, noci, semi, olio cocco.' },
    { title: 'PASTO LIBERO', content: '1 volta a settimana (preferibilmente giorno High Carb).' }
  ],
  portions: [
    { item: 'PROTEINE', size: 'Palmo della mano (120-150g)' },
    { item: 'VERDURE', size: 'Due mani a coppa (abbondante)' },
    { item: 'CARBOIDRATI', size: 'Pugno chiuso (80-100g cotti)' },
    { item: 'GRASSI', size: 'Punta del pollice (10g / 1 cucchiaio)' }
  ],
  menus: {
    phase1: {
      high: [
        { meal: 'COLAZIONE', items: ['Avena: 80g', 'Frutti di bosco: 100g', 'Semi di chia: 10g', 'Cannella'] },
        { meal: 'SPUNTINO', items: ['Yogurt greco intero: 150g', 'Miele: 5g', 'Frutta secca: 20g'] },
        { meal: 'PRANZO', items: ['Riso basmati: 120g (crudo)', 'Petto di pollo: 150g', 'Verdure vapore: 200g', 'EVO: 10g'] },
        { meal: 'MERENDA', items: ['Banana: 1', 'Proteine in polvere: 30g'] },
        { meal: 'CENA', items: ['Pasta integrale: 100g', 'Pesto: 30g', 'Insalata: 150g', 'EVO: 10g'] }
      ],
      medium: [
        { meal: 'COLAZIONE', items: ['Pancake proteici (2 uova, 50g avena, 1 banana)', 'Burro arachidi: 10g'] },
        { meal: 'SPUNTINO', items: ['Frutta fresca: 150g'] },
        { meal: 'PRANZO', items: ['Pollo alla piastra: 150g', 'Patate dolci: 150g (crudo)', 'Insalata: 100g', 'EVO: 10g'] },
        { meal: 'MERENDA', items: ['Skyr o Kefir: 200ml'] },
        { meal: 'CENA', items: ['Zuppa legumi: 150g (cotto)', 'Crostini integrali: 30g', 'Verdure crude'] }
      ],
      low: [
        { meal: 'COLAZIONE', items: ['Uova intere: 3', 'Burro arachidi: 10g', 'Miele: 10g'] },
        { meal: 'SPUNTINO', items: ['Frutta secca mista: 30g'] },
        { meal: 'PRANZO', items: ['Farro: 80g', 'Tonno naturale: 150g', 'Pomodorini/Cetrioli: 150g', 'EVO: 10g'] },
        { meal: 'MERENDA', items: ['Cioccolato fondente 70%: 15g'] },
        { meal: 'CENA', items: ['Salmone: 180g', 'Asparagi: 150g', 'Verdure grigliate: 200g', 'EVO: 10g'] }
      ]
    },
    phase2: {
      high: [
        { meal: 'COLAZIONE', items: ['Pane integrale: 90g', 'Marmellata 100%: 20g', 'Omelette (3 albumi + 1 uovo)', 'Frullato mandorla/frutta'] },
        { meal: 'SPUNTINO', items: ['Ricotta magra: 100g', 'Miele: 5g', 'Noci: 15g'] },
        { meal: 'PRANZO', items: ['Couscous integrale: 120g (crudo)', 'Tacchino: 150g', 'Verdure grigliate: 200g', 'EVO: 10g'] },
        { meal: 'MERENDA', items: ['Mix frutta fresca: 150g', 'Yogurt greco 0%: 150g'] },
        { meal: 'CENA', items: ['Risotto funghi: 100g (crudo)', 'Gamberi: 150g', 'Insalata avocado: 100g', 'EVO: 10g'] }
      ],
      medium: [
        { meal: 'COLAZIONE', items: ['Pancake avena (50g avena, 1 uovo, latte mandorla)', 'Sciroppo acero: 5g', 'Frutti bosco: 100g'] },
        { meal: 'SPUNTINO', items: ['Mela: 150g', 'Burro mandorle: 20g'] },
        { meal: 'PRANZO', items: ['Filetto manzo: 200g', 'Orzo perlato: 100g (crudo)', 'Zucchine: 150g', 'EVO: 10g'] },
        { meal: 'MERENDA', items: ['Yogurt greco: 150g', 'Burro arachidi: 10g'] },
        { meal: 'CENA', items: ['Zuppa pesce con verdure', 'Crostini integrali: 30g', 'Verdure crude'] }
      ],
      low: [
        { meal: 'COLAZIONE', items: ['Frittata 3 uova: 150g', 'Burro mandorle: 15g', 'Miele: 10g'] },
        { meal: 'SPUNTINO', items: ['Mix semi: 20g'] },
        { meal: 'PRANZO', items: ['Merluzzo forno: 180g', 'Asparagi: 150g', 'Insalata rucola/finocchio: 150g', 'EVO: 10g'] },
        { meal: 'MERENDA', items: ['Cioccolato fondente 70%: 20g'] },
        { meal: 'CENA', items: ['Tofu grigliato: 150g', 'Broccoli vapore: 150g', 'Funghi trifolati: 100g', 'EVO: 10g'] }
      ]
    }
  }
};

export const Diet: React.FC = () => {
  const [activeView, setActiveView] = useState<'TRACKER' | 'PLAN'>('TRACKER');
  const [activePhase, setActivePhase] = useState<'phase1' | 'phase2'>('phase1');
  const [activeCarb, setActiveCarb] = useState<'high' | 'medium' | 'low'>('high');
  const [meals, setMeals] = useState<any[]>(() => {
    const saved = localStorage.getItem('offwhite_meals');
    return saved ? JSON.parse(saved) : [];
  });
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('offwhite_recipes');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'PROTEIN_SHAKE', ingredients: ['Whey Protein', 'Milk', 'Banana'] },
      { id: '2', name: 'CHICKEN_RICE', ingredients: ['Chicken Breast', 'Basmati Rice', 'Broccoli'] }
    ];
  });
  const [time, setTime] = useState('');
  const [content, setContent] = useState('');
  const [calories, setCalories] = useState('');
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeIngredients, setNewRecipeIngredients] = useState('');

  useEffect(() => {
    localStorage.setItem('offwhite_meals', JSON.stringify(meals));
    localStorage.setItem('offwhite_recipes', JSON.stringify(recipes));
  }, [meals, recipes]);

  const addMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    const newMeal = {
      id: crypto.randomUUID(),
      time: time || '00:00',
      content,
      calories: parseInt(calories) || 0
    };
    setMeals([...meals, newMeal].sort((a, b) => a.time.localeCompare(b.time)));
    setTime('');
    setContent('');
    setCalories('');
  };

  const addRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipeName || !newRecipeIngredients) return;
    const newRec: Recipe = {
      id: crypto.randomUUID(),
      name: newRecipeName.toUpperCase(),
      ingredients: newRecipeIngredients.split(',').map(i => i.trim())
    };
    setRecipes([...recipes, newRec]);
    setNewRecipeName('');
    setNewRecipeIngredients('');
  };

  const addToShoppingList = (recipe: Recipe) => {
    const currentShopping: ShoppingItem[] = JSON.parse(localStorage.getItem('offwhite_shopping') || '[]');
    const newItems = recipe.ingredients.map(ing => ({
      id: crypto.randomUUID(),
      name: ing.toUpperCase(),
      bought: false
    }));
    localStorage.setItem('offwhite_shopping', JSON.stringify([...currentShopping, ...newItems]));
    window.dispatchEvent(new CustomEvent('shopping-update'));
  };

  const deleteMeal = (id: string) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(recipes.filter(r => r.id !== id));
  };

  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);

  return (
    <div className="offwhite-border h-full">
      <div className="flex justify-between items-start mb-6">
        <SectionHeader title="ALIMENTAZIONE" label="PIANO_NUTRIZIONALE_V3.0" className="mb-0" />
        <div className="flex bg-gray-100 p-1">
          <button 
            onClick={() => setActiveView('TRACKER')}
            className={`px-4 py-1.5 font-mono text-[10px] uppercase font-bold transition-all ${activeView === 'TRACKER' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Diario
          </button>
          <button 
            onClick={() => setActiveView('PLAN')}
            className={`px-4 py-1.5 font-mono text-[10px] uppercase font-bold transition-all ${activeView === 'PLAN' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Piano
          </button>
        </div>
      </div>
      
      {activeView === 'TRACKER' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div>
            <div className="mb-6 p-6 bg-black text-white flex justify-between items-center border-2 border-black">
              <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Assunzione giornaliera</div>
              <div className="text-3xl font-black tracking-tighter text-offwhite-orange">{totalCalories} KCAL</div>
            </div>

            <form onSubmit={addMeal} className="mb-8 space-y-3 p-4 border-2 border-black bg-gray-50">
              <div className="text-[10px] font-mono uppercase mb-2 text-black font-bold">Registra pasto</div>
              <div className="flex gap-2">
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-24 border-2 border-black p-2 font-mono text-xs focus:outline-none focus:bg-black focus:text-white transition-all"
                />
                <input 
                  type="text" 
                  placeholder="DESCRIZIONE"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 border-2 border-black p-2 font-mono text-xs uppercase focus:outline-none focus:bg-black focus:text-white transition-all"
                />
              </div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="KCAL"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="flex-1 border-2 border-black p-2 font-mono text-xs focus:outline-none focus:bg-black focus:text-white transition-all"
                />
                <button type="submit" className="bg-black text-white p-2 px-6 hover:bg-offwhite-orange transition-colors">
                  <Plus size={20} />
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {meals.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 border border-black/10 hover:border-black transition-all group bg-white">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="font-mono text-[10px] font-bold bg-black text-white px-2 py-1 shrink-0">{m.time}</div>
                    <div className="overflow-hidden">
                      <div className="font-black text-sm uppercase tracking-tighter truncate">{m.content}</div>
                      <div className="font-mono text-[8px] text-offwhite-orange font-bold uppercase">{m.calories} KCAL</div>
                    </div>
                  </div>
                  <button onClick={() => deleteMeal(m.id)} className="text-gray-300 hover:text-offwhite-orange transition-colors shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-black" />
              <div className="text-xs font-mono uppercase text-black border-b-2 border-black flex-1 pb-1 font-bold">Ricette preferite</div>
            </div>

            <div className="space-y-4 mb-6">
              {recipes.map(recipe => (
                <div key={recipe.id} className="p-4 border-2 border-black bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-black text-lg tracking-tighter uppercase truncate pr-2">{recipe.name}</div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => addToShoppingList(recipe)}
                        className="p-1.5 bg-white border-2 border-black text-black hover:bg-black hover:text-white transition-all"
                        title="Aggiungi alla lista"
                      >
                        <ShoppingCart size={14} />
                      </button>
                      <button 
                        onClick={() => deleteRecipe(recipe.id)} 
                        className="p-1.5 bg-white border-2 border-black text-black hover:bg-offwhite-orange hover:text-white transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients.map((ing, idx) => (
                      <span key={idx} className="font-mono text-[8px] bg-black text-white px-2 py-0.5 font-bold uppercase">{ing}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={addRecipe} className="space-y-2 p-4 border-2 border-dashed border-black">
              <div className="text-[10px] font-mono uppercase text-black mb-2 font-bold">Nuova ricetta</div>
              <input 
                type="text" 
                placeholder="NOME"
                value={newRecipeName}
                onChange={(e) => setNewRecipeName(e.target.value)}
                className="w-full border-2 border-black p-2 font-mono text-xs uppercase focus:outline-none focus:bg-black focus:text-white transition-all"
              />
              <textarea 
                placeholder="INGREDIENTI (SEPARATI DA VIRGOLA)"
                value={newRecipeIngredients}
                onChange={(e) => setNewRecipeIngredients(e.target.value)}
                className="w-full border-2 border-black p-2 font-mono text-xs h-20 focus:outline-none focus:bg-black focus:text-white transition-all uppercase"
              />
              <button type="submit" className="w-full bg-black text-white p-2 text-xs font-mono uppercase hover:bg-offwhite-orange transition-colors">
                Salva ricetta
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* BMI & METHOD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-black text-white border-2 border-black">
              <div className="flex items-center gap-2 mb-3">
                <Scale size={16} className="text-offwhite-orange" />
                <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">BMI_ANALYSIS</div>
              </div>
              <div className="text-4xl font-black tracking-tighter text-offwhite-orange mb-1">{DIET_PLAN.bmi.value}</div>
              <div className="font-mono text-[8px] uppercase leading-tight text-gray-500">{DIET_PLAN.bmi.status}</div>
            </div>
            <div className="p-6 border-2 border-black bg-white md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw size={16} className="text-black" />
                <div className="font-mono text-[10px] uppercase tracking-widest text-black font-bold">METHOD: CARB_CYCLING</div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {Object.entries(DIET_PLAN.schedule).map(([day, type]) => (
                  <div key={day} className="text-center">
                    <div className="font-mono text-[8px] text-gray-400 mb-1 font-bold">{day.slice(0, 3)}</div>
                    <div className={`p-2 font-black text-[8px] tracking-tighter transition-all uppercase ${
                      type === 'HIGH CARB' ? 'bg-black text-white' : 
                      type === 'MEDIUM CARB' ? 'bg-gray-100 text-black' : 
                      'bg-gray-50 text-gray-300'
                    }`}>
                      {type.split(' ')[0]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GUIDELINES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                <ClipboardList size={18} className="text-black" />
                <div className="font-black text-sm tracking-tighter uppercase">Linee guida generali</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DIET_PLAN.guidelines.map(g => (
                  <div key={g.title} className="p-4 border-2 border-black bg-white hover:bg-gray-50 transition-all">
                    <div className="font-black text-[10px] uppercase tracking-widest mb-1 text-offwhite-orange">{g.title}</div>
                    <div className="font-mono text-[10px] leading-tight font-bold text-gray-600 uppercase">{g.content}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                <Info size={18} className="text-black" />
                <div className="font-black text-sm tracking-tighter uppercase">Guida porzioni</div>
              </div>
              <div className="space-y-2">
                {DIET_PLAN.portions.map(p => (
                  <div key={p.item} className="flex justify-between items-center p-3 border border-black/10 bg-gray-50">
                    <div className="font-black text-[10px] uppercase tracking-widest text-black">{p.item}</div>
                    <div className="font-mono text-[10px] text-offwhite-orange font-bold uppercase">{p.size}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-black text-white font-mono text-[8px] uppercase leading-tight tracking-widest">
                * USA IL PIATTO DIVISO: METÀ VERDURE, UN QUARTO PROTEINE, UN QUARTO CARBOIDRATI.
              </div>
            </div>
          </div>

          {/* SUPPLEMENTS */}
          <div className="p-6 border-2 border-black bg-gray-50">
            <div className="flex items-center gap-2 mb-6">
              <Pill size={18} className="text-black" />
              <div className="font-black text-sm tracking-tighter uppercase">Integratori consigliati</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'OMEGA-3', desc: '1-3G AL GIORNO DURANTE I PASTI. RIDUCE INFIAMMAZIONE.' },
                { title: 'MULTIVITAMINICO', desc: '1 COMPRESSA AL MATTINO CON COLAZIONE.' },
                { title: 'MAGNESIO', desc: '300-400MG PRIMA DI DORMIRE. SUPPORTO MUSCOLARE.' }
              ].map(s => (
                <div key={s.title} className="p-4 border-2 border-black bg-white">
                  <div className="font-black text-[10px] uppercase mb-1 text-offwhite-orange">{s.title}</div>
                  <div className="font-mono text-[10px] text-gray-500 font-bold leading-tight uppercase">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* DAILY MENUS */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-black pb-2">
              <div className="font-black text-sm tracking-tighter uppercase">Menu giornalieri</div>
              <div className="flex bg-gray-100 p-1">
                <select 
                  value={activePhase}
                  onChange={(e) => setActivePhase(e.target.value as any)}
                  className="bg-transparent text-black font-mono text-[10px] font-bold uppercase px-2 py-1 outline-none"
                >
                  <option value="phase1">Fase 1-2</option>
                  <option value="phase2">Fase 3-4</option>
                </select>
                <div className="flex gap-1 ml-2">
                  {(['high', 'medium', 'low'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setActiveCarb(type)}
                      className={`px-3 py-1 font-mono text-[8px] font-bold uppercase transition-all ${activeCarb === type ? 'bg-black text-white' : 'text-gray-400'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(DIET_PLAN.menus as any)[activePhase][activeCarb].map((m: any, idx: number) => (
                <div key={idx} className="p-5 border-2 border-black bg-white hover:bg-gray-50 transition-all">
                  <div className="font-black text-[10px] uppercase tracking-widest mb-3 text-offwhite-orange border-b border-black/10 pb-2">
                    {m.meal}
                  </div>
                  <ul className="space-y-2">
                    {m.items.map((item: string, i: number) => (
                      <li key={i} className="font-mono text-[10px] font-bold text-gray-600 leading-tight flex items-start gap-2 uppercase">
                        <div className="w-1.5 h-1.5 bg-black mt-1 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* COOKING & FREE MEAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border-2 border-black bg-gray-50">
              <div className="font-black text-[10px] uppercase tracking-widest mb-3 border-b-2 border-black pb-2 text-black">Consigli cucina</div>
              <ul className="font-mono text-[10px] font-bold text-gray-600 space-y-2 uppercase">
                <li className="flex gap-2"><span className="text-black">•</span> CARNI: GRIGLIA, FORNO O VAPORE CON SPEZIE.</li>
                <li className="flex gap-2"><span className="text-black">•</span> VERDURE: VAPORE O GRIGLIA CON FILO D'OLIO.</li>
                <li className="flex gap-2"><span className="text-black">•</span> ZUPPE: FUOCO LENTO PER CONSERVARE NUTRIENTI.</li>
              </ul>
            </div>
            <div className="p-6 bg-black text-white border-2 border-black">
              <div className="font-black text-[10px] uppercase tracking-widest mb-3 border-b border-white/20 pb-2">Pasto libero</div>
              <ul className="font-mono text-[10px] font-bold space-y-2 uppercase">
                <li className="flex gap-2"><span>•</span> FREQUENZA: 1 VOLTA A SETTIMANA (GIORNO HIGH CARB).</li>
                <li className="flex gap-2"><span>•</span> SCELTA: PIZZA, BURGER, SUSHI (QUALITÀ ELEVATA).</li>
                <li className="flex gap-2"><span>•</span> NOTA: TORNARE SUBITO AL PIANO IL GIORNO DOPO.</li>
              </ul>
            </div>
          </div>

          {/* SUBSTITUTIONS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
              <RefreshCw size={18} className="text-black" />
              <div className="font-black text-sm tracking-tighter uppercase">Sostituzioni alimentari</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { cat: 'PROTEINE', items: 'Pollo, Tacchino, Manzo magro, Pesce, Tofu, Uova/Albumi.' },
                { cat: 'CARBOIDRATI', items: 'Riso (Basmati/Integrale), Quinoa, Patate, Pasta integrale/legumi, Pane segale.' },
                { cat: 'VERDURE', items: 'Spinaci, Zucchine, Asparagi, Broccoli, Peperoni, Fagiolini.' },
                { cat: 'GRASSI SANI', items: 'EVO, Olio cocco, Avocado, Noci, Mandorle, Burro arachidi.' },
                { cat: 'LATTICINI', items: 'Yogurt greco, Ricotta magra, Fiocchi di latte, Latte mandorla/soia.' },
                { cat: 'FRUTTA', items: 'Frutti di bosco, Mela, Pera, Arancia, Banana (moderata).' }
              ].map(s => (
                <div key={s.cat} className="p-4 border-2 border-black bg-white hover:bg-gray-50 transition-all">
                  <div className="font-black text-[10px] uppercase mb-1 text-offwhite-orange">{s.cat}</div>
                  <div className="font-mono text-[10px] font-bold text-gray-500 leading-tight uppercase">{s.items}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
