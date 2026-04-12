import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Circle, Plus, RefreshCw, ShoppingCart, Sparkles, Trash2 } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { Recipe, ShoppingItem } from '../types';

const CATEGORIES = ['PRODUCE', 'PROTEIN', 'DAIRY', 'PANTRY', 'HOUSEHOLD', 'OTHER'] as const;
const QUICK_SUGGESTIONS = ['UOVA', 'LATTE', 'POLLO', 'RISO', 'BANANE', 'INSALATA'];

function sanitizeShoppingItems(items: ShoppingItem[]) {
  return items.filter((item) => !item.isMarketplaceItem && item.category !== 'MARKETPLACE');
}

export const Shopping: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('offwhite_shopping');
    return saved ? sanitizeShoppingItems(JSON.parse(saved)) : [];
  });
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>('PRODUCE');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'BOUGHT'>('ALL');

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('offwhite_shopping');
      setItems(saved ? sanitizeShoppingItems(JSON.parse(saved)) : []);
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

  const boughtCount = items.filter((item) => item.bought).length;
  const pendingCount = items.length - boughtCount;
  const progress = items.length > 0 ? (boughtCount / items.length) * 100 : 0;

  const addItem = (event?: React.FormEvent, explicitName?: string, explicitCategory?: string) => {
    if (event) event.preventDefault();
    const rawName = explicitName ?? newItem;
    const normalizedName = rawName.trim().toUpperCase();
    if (!normalizedName) return;
    if (items.some((item) => item.name === normalizedName)) {
      setNewItem('');
      return;
    }

    setItems((prev) => [
      {
        id: crypto.randomUUID(),
        name: normalizedName,
        bought: false,
        category: explicitCategory ?? selectedCategory,
      },
      ...prev,
    ]);

    if (!explicitName) setNewItem('');
  };

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, bought: !item.bought } : item)));
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearBought = () => {
    setItems((prev) => prev.filter((item) => !item.bought));
  };

  const clearAll = () => {
    if (window.confirm('VUOI DAVVERO SVUOTARE LA LISTA SPESA?')) {
      setItems([]);
    }
  };

  const importFromRecipes = () => {
    const recipes: Recipe[] = JSON.parse(localStorage.getItem('offwhite_recipes') || '[]');
    if (recipes.length === 0) return;

    const existingNames = new Set(items.map((item) => item.name));
    const importedItems: ShoppingItem[] = [];

    recipes.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        const normalizedName = ingredient.trim().toUpperCase();
        if (!normalizedName || existingNames.has(normalizedName)) return;
        existingNames.add(normalizedName);
        importedItems.push({
          id: crypto.randomUUID(),
          name: normalizedName,
          bought: false,
          category: 'PANTRY',
        });
      });
    });

    if (importedItems.length > 0) {
      setItems((prev) => [...importedItems, ...prev]);
    }
  };

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (filter === 'PENDING') return !item.bought;
        if (filter === 'BOUGHT') return item.bought;
        return true;
      }),
    [filter, items],
  );

  const categorySections = CATEGORIES.map((category) => ({
    category,
    items: filteredItems.filter((item) => (item.category || 'OTHER') === category),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="shopping-screen offwhite-border min-h-full">
      <div className="shopping-toolbar">
        <SectionHeader title="SPESA" label="LISTA_SPESA_V3.0" className="mb-0" />
        <div className="shopping-toolbar-actions">
          <button type="button" onClick={importFromRecipes} className="shopping-icon-button" title="Importa ingredienti">
            <RefreshCw size={16} />
          </button>
          <button type="button" onClick={clearBought} className="shopping-icon-button is-accent" title="Rimuovi comprati">
            <Check size={16} />
          </button>
        </div>
      </div>

      <div className="shopping-summary-card">
        <div className="shopping-summary-copy">
          <div className="shopping-summary-kicker">Shopping focus</div>
          <div className="shopping-summary-title">
            {pendingCount} da prendere
          </div>
          <div className="shopping-summary-meta">
            {boughtCount} presi su {items.length} articoli
          </div>
        </div>
        <div className="shopping-summary-progress">
          <div className="shopping-summary-percentage">{Math.round(progress)}%</div>
          <div className="shopping-summary-track">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="shopping-summary-fill"
            />
          </div>
        </div>
      </div>

      <form onSubmit={addItem} className="shopping-quick-add">
        <div className="shopping-quick-add-head">
          <div>
            <div className="shopping-panel-kicker">Quick add</div>
            <div className="shopping-panel-title">Aggiungi in un tap</div>
          </div>
          <div className="shopping-category-pill">{selectedCategory}</div>
        </div>

        <div className="shopping-add-row">
          <input
            type="text"
            placeholder="COSA TI SERVE?"
            value={newItem}
            onChange={(event) => setNewItem(event.target.value)}
            className="shopping-input"
          />
          <button type="submit" className="shopping-primary-button" aria-label="Aggiungi articolo">
            <Plus size={18} />
            <span>Aggiungi</span>
          </button>
        </div>

        <div className="shopping-category-row">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`shopping-chip ${selectedCategory === category ? 'is-active' : ''}`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="shopping-suggestion-row">
          <div className="shopping-suggestion-label">
            <Sparkles size={14} />
            <span>Rapidi</span>
          </div>
          <div className="shopping-suggestion-chips">
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addItem(undefined, suggestion, selectedCategory)}
                className="shopping-suggestion-chip"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div className="shopping-filter-row">
        {([
          { id: 'ALL', label: 'Tutto' },
          { id: 'PENDING', label: 'Da prendere' },
          { id: 'BOUGHT', label: 'Presi' },
        ] as const).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`shopping-filter-pill ${filter === item.id ? 'is-active' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="shopping-list-shell">
        {categorySections.length > 0 ? (
          categorySections.map((section) => (
            <div key={section.category} className="shopping-section">
              <div className="shopping-section-head">
                <span>{section.category}</span>
                <span>{section.items.length}</span>
              </div>

              <div className="shopping-list">
                <AnimatePresence initial={false}>
                  {section.items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className={`shopping-item-row ${item.bought ? 'is-bought' : ''}`}
                    >
                      <button type="button" onClick={() => toggleItem(item.id)} className="shopping-item-toggle">
                        {item.bought ? <Check size={16} /> : <Circle size={16} />}
                      </button>

                      <div className="shopping-item-copy">
                        <div className="shopping-item-name">{item.name}</div>
                        <div className="shopping-item-meta">
                          {item.bought ? 'Preso' : 'Da comprare'}
                        </div>
                      </div>

                      <button type="button" onClick={() => deleteItem(item.id)} className="shopping-item-delete">
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        ) : (
          <div className="shopping-empty-state">
            <ShoppingCart size={34} />
            <div className="shopping-empty-title">Lista vuota</div>
            <div className="shopping-empty-copy">
              Aggiungi i primi articoli o importa ingredienti dalle ricette.
            </div>
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <button type="button" onClick={clearAll} className="shopping-reset-button">
          Svuota lista
        </button>
      ) : null}
    </div>
  );
};
