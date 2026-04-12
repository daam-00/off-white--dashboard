import React, { useState, useEffect } from 'react';
import { SectionHeader } from './SectionHeader';
import { ShoppingItem, Recipe } from '../types';
import { Plus, ShoppingCart, Trash2, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ['PRODUCE', 'PROTEIN', 'DAIRY', 'PANTRY', 'HOUSEHOLD', 'OTHER'];

function sanitizeShoppingItems(items: ShoppingItem[]) {
  return items.filter((item) => !item.isMarketplaceItem && item.category !== 'MARKETPLACE');
}

export const Shopping: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('offwhite_shopping');
    return saved ? sanitizeShoppingItems(JSON.parse(saved)) : [];
  });

  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'BOUGHT'>('ALL');

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('offwhite_shopping');
      if (saved) {
        setItems(sanitizeShoppingItems(JSON.parse(saved)));
      } else {
        setItems([]);
      }
    };
    window.addEventListener('shopping-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('shopping-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('offwhite_shopping', JSON.stringify(items));
  }, [items]);

  const addItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItem) return;
    setItems([...items, { 
      id: crypto.randomUUID(), 
      name: newItem.toUpperCase(), 
      bought: false,
      category: selectedCategory 
    }]);
    setNewItem('');
  };

  const toggleItem = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, bought: !i.bought } : i));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const clearBought = () => {
    setItems(items.filter(i => !i.bought));
  };

  const clearAll = () => {
    if (window.confirm('CLEAR ALL ITEMS?')) {
      setItems([]);
    }
  };

  const importFromRecipes = () => {
    const recipes: Recipe[] = JSON.parse(localStorage.getItem('offwhite_recipes') || '[]');
    if (recipes.length === 0) return;
    
    const newItems: ShoppingItem[] = [];
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        if (!items.some(i => i.name === ing.toUpperCase())) {
          newItems.push({
            id: crypto.randomUUID(),
            name: ing.toUpperCase(),
            bought: false,
            category: 'PANTRY'
          });
        }
      });
    });
    
    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'PENDING') return !item.bought;
    if (filter === 'BOUGHT') return item.bought;
    return true;
  });

  const progress = items.length > 0 
    ? (items.filter(i => i.bought).length / items.length) * 100 
    : 0;

  return (
    <div className="offwhite-border h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <SectionHeader title="SPESA" label="LISTA_SPESA_V2.0" className="mb-0" />
        <div className="flex gap-2">
          <button 
            onClick={importFromRecipes}
            className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all group"
            title="Importa da alimentazione"
          >
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <button 
            onClick={clearBought}
            className="p-2 border-2 border-black hover:bg-offwhite-orange hover:text-white transition-all"
            title="Rimuovi acquistati"
          >
            <CheckSquare size={16} />
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="mb-8 p-4 bg-black text-white border-2 border-black relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-end mb-2">
          <div>
            <div className="font-mono text-[8px] uppercase text-gray-400 mb-1">Stato lista</div>
            <div className="text-2xl font-black tracking-tighter">
              {items.filter(i => i.bought).length}/{items.length} <span className="text-offwhite-orange">ARTICOLI PRESI</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black tracking-tighter text-offwhite-orange">{Math.round(progress)}%</div>
          </div>
        </div>
        <div className="w-full h-1 bg-white/10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-offwhite-orange"
          />
        </div>
      </div>
      
      <form onSubmit={addItem} className="space-y-3 mb-8 p-4 border-2 border-black bg-gray-50">
        <div className="text-[10px] font-mono uppercase mb-2 text-black font-bold">Aggiungi articolo</div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="NOME ARTICOLO..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1 border-2 border-black p-2 font-mono text-xs uppercase focus:outline-none focus:bg-black focus:text-white transition-all"
          />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-32 border-2 border-black p-2 font-mono text-[10px] uppercase focus:outline-none focus:bg-black focus:text-white transition-all"
          >
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button type="submit" className="bg-black text-white p-2 px-6 hover:bg-offwhite-orange transition-colors">
            <Plus size={20} />
          </button>
        </div>
      </form>

      {/* FILTERS */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
        {(['ALL', 'PENDING', 'BOUGHT'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 font-mono text-[8px] font-bold uppercase transition-all whitespace-nowrap ${filter === f ? 'bg-black text-white' : 'border border-black/10 text-gray-400 hover:border-black hover:text-black'}`}
          >
            {f === 'ALL' ? 'TUTTO' : f === 'PENDING' ? 'DA PRENDERE' : 'PRESI'}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        {CATEGORIES.map(cat => {
          const catItems = filteredItems.filter(i => (i.category || 'OTHER') === cat);
          if (catItems.length === 0) return null;

          return (
            <div key={cat} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-[2px] bg-black flex-1" />
                <span className="font-mono text-[8px] font-black tracking-widest text-black">{cat}</span>
                <div className="h-[2px] bg-black flex-1" />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <AnimatePresence mode="popLayout">
                  {catItems.map(item => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={item.id} 
                      className={`flex items-center justify-between p-3 border-2 transition-all group ${item.bought ? 'border-gray-100 bg-gray-50/50 opacity-50' : 'border-black bg-white'}`}
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <button 
                          onClick={() => toggleItem(item.id)}
                          className={`transition-colors ${item.bought ? 'text-gray-300' : 'text-black hover:text-offwhite-orange'}`}
                        >
                          {item.bought ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>

                        <div className="overflow-hidden">
                          <div className={`font-black text-sm uppercase tracking-tighter truncate ${item.bought ? 'line-through text-gray-400' : 'text-black'}`}>
                            {item.name}
                          </div>
                          {item.category && (
                            <div className="font-mono text-[8px] text-gray-400 font-bold uppercase">{item.category}</div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => deleteItem(item.id)} className="text-gray-200 hover:text-offwhite-orange transition-colors shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-black/10">
            <ShoppingCart className="mx-auto mb-2 text-gray-200" size={32} />
            <div className="font-mono text-[10px] text-gray-300 uppercase font-bold">Lista spesa vuota</div>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <button 
          onClick={clearAll}
          className="mt-6 w-full p-3 border-2 border-black font-mono text-[10px] font-black uppercase tracking-widest hover:bg-offwhite-orange hover:text-white transition-all"
        >
          RESET LISTA
        </button>
      )}
    </div>
  );
};
