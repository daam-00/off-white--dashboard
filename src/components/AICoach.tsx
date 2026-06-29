import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SectionHeader } from './SectionHeader';
import { Sparkles, Send, RefreshCw, Key, ArrowRight, Bot, Trash2, ShieldAlert, BrainCircuit, Plus, X, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

const CHAT_STORAGE_KEY = 'betterme_ai_chat_history';
const API_KEY_STORAGE_KEY = 'betterme_gemini_api_key';
const COMPANION_MEMORY_KEY = 'betterme_ai_companion_memory';

export const AICoach: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    const local = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (local) return local;
    try {
      return (process.env.GEMINI_API_KEY as string) || '';
    } catch {
      return '';
    }
  });

  const [inputKey, setInputKey] = useState('');
  const [showKeyForm, setShowKeyForm] = useState(!apiKey);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Companion Memory States
  const [memoryList, setMemoryList] = useState<string[]>(() => {
    const saved = localStorage.getItem(COMPANION_MEMORY_KEY);
    if (saved) {
      try { return JSON.parse(saved) as string[]; } catch { return []; }
    }
    return [
      "Obiettivo primario: Crescita personale e benessere",
      "Sviluppare costanza nel check-in giornaliero"
    ];
  });
  const [newMemoryInput, setNewMemoryInput] = useState('');

  // Sync Memory with Storage
  useEffect(() => {
    localStorage.setItem(COMPANION_MEMORY_KEY, JSON.stringify(memoryList));
  }, [memoryList]);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([
        {
          id: 'welcome',
          sender: 'coach',
          text: 'Ciao! Sono il tuo Personal AI Companion. Sono collegato in tempo reale alla tua dashboard: conosco le tue finanze, la tua dieta, i tuoi allenamenti e le tue abitudini.\n\nHo anche una memoria attiva per ricordare le tue preferenze a lungo termine. Scrivimi pure o chiedi un riepilogo per cominciare!',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Save API Key helper
  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = inputKey.trim();
    if (!cleanKey) return;
    
    localStorage.setItem(API_KEY_STORAGE_KEY, cleanKey);
    setApiKey(cleanKey);
    setShowKeyForm(false);
    setErrorMsg('');
  };

  const handleClearKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setShowKeyForm(true);
  };

  const handleClearChat = () => {
    const defaultWelcome: Message[] = [
      {
        id: 'welcome',
        sender: 'coach',
        text: 'Memoria della conversazione pulita. Dimmi pure come posso aiutarti adesso!',
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(defaultWelcome);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(defaultWelcome));
  };

  // Add memory fact manually
  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    const fact = newMemoryInput.trim();
    if (!fact) return;
    setMemoryList(prev => [...prev, fact]);
    setNewMemoryInput('');
  };

  // Remove memory fact
  const handleRemoveMemory = (index: number) => {
    setMemoryList(prev => prev.filter((_, idx) => idx !== index));
  };

  // Gather User Dashboard Data contextually from LocalStorage
  const getUserDataContext = () => {
    const meals = (() => {
      try { return JSON.parse(localStorage.getItem('offwhite_meals') || '[]'); } catch { return []; }
    })();
    const transactions = (() => {
      try { return JSON.parse(localStorage.getItem('offwhite_transactions') || '[]'); } catch { return []; }
    })();
    const shopping = (() => {
      try { return JSON.parse(localStorage.getItem('offwhite_shopping') || '[]'); } catch { return []; }
    })();
    const tasks = (() => {
      try { return JSON.parse(localStorage.getItem('offwhite_daily_tasks') || '[]'); } catch { return []; }
    })();
    const workouts = (() => {
      try { return JSON.parse(localStorage.getItem('offwhite_workouts') || '[]'); } catch { return []; }
    })();
    const profile = (() => {
      try { return JSON.parse(localStorage.getItem('offwhite_user_profile') || '{}'); } catch { return {}; }
    })();
    const checkins = (() => {
      try { return JSON.parse(localStorage.getItem('offwhite_checkins') || '[]'); } catch { return []; }
    })();
    const stats = (() => {
      try { return JSON.parse(localStorage.getItem('betterme_user_stats') || '{}'); } catch { return {}; }
    })();

    return {
      profile: {
        name: profile.name || 'Utente',
        credits: stats.points ?? 0,
        streak: checkins.length
      },
      todayTasks: tasks.map((t: any) => ({ label: t.label, completed: t.completed })),
      workoutsThisWeek: workouts.map((w: any) => ({ name: w.name, duration: w.duration, completedAt: w.completedAt || w.date })),
      dietToday: {
        meals: meals.map((m: any) => ({ name: m.name, calories: m.calories, category: m.category })),
        totalCaloriesConsumed: meals.reduce((sum: number, m: any) => sum + (Number(m.calories) || 0), 0)
      },
      walletThisMonth: {
        transactions: transactions.map((t: any) => ({ description: t.description, amount: t.amount, type: t.type, category: t.category })),
        totalSpent: transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount) || 0), 0)
      },
      shoppingList: shopping.map((s: any) => ({ item: s.name || s.label, bought: s.bought }))
    };
  };

  // Call Gemini API
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setErrorMsg('');

    const contextData = getUserDataContext();
    const systemPrompt = `Sei "Personal AI Companion" per l'applicazione "Better Me", un Life Operating System completo.
Parli in italiano. Sei stimolante, accogliente, diretto ed estremamente pratico.
Usi uno stile pulito, minimalista e diretto (off-white design language).
Non usare risposte chilometriche: preferisci punti elenco chiari ed emoji mirate.
Hai accesso diretto ai dati correnti della dashboard e alla tua MEMORIA ATTIVA.

Ecco le cose memorizzate che ricordi sull'utente (Preferenze, vincoli, note importanti):
${memoryList.map((f, i) => `${i + 1}. ${f}`).join('\n')}

IMPORTANTE: Se nel corso della conversazione l'utente ti dice qualcosa di rilevante su di sé, sulle sue abitudini, preferenze o budget (es. "mi alleno sempre al mattino", "voglio risparmiare €100 al mese", "sono vegano"), alla fine della tua risposta scrivi una riga speciale nel formato:
[MEMORIZZA: <breve fatto da ricordare>]
Puoi scrivere più righe se ci sono più fatti importanti. Questi fatti verranno inseriti automaticamente nella tua memoria persistente per le conversazioni future.

Ecco i dati reali dell'utente in questo momento:
- Profilo: ${contextData.profile.name}, Crediti Better Credits accumulati: ${contextData.profile.credits}, Giorni di check-in totali: ${contextData.profile.streak}.
- Routine di oggi: ${contextData.todayTasks.length === 0 ? 'Nessuna attività programmata oggi' : contextData.todayTasks.map((t: any) => `${t.label} (${t.completed ? 'Completata' : 'Da fare'})`).join(', ')}.
- Alimentazione odierna: Consumate ${contextData.dietToday.totalCaloriesConsumed} kcal. Pasti: ${contextData.dietToday.meals.length === 0 ? 'Nessun pasto registrato oggi' : contextData.dietToday.meals.map((m: any) => `${m.name} (${m.calories} kcal)`).join(', ')}.
- Finanze del mese: Spese totali registrate di ${contextData.walletThisMonth.totalSpent}€. Transazioni: ${contextData.walletThisMonth.transactions.length === 0 ? 'Nessuna spesa inserita' : contextData.walletThisMonth.transactions.map((t: any) => `${t.description}: ${t.amount}€ (${t.type})`).join(', ')}.
- Allenamenti salvati: ${contextData.workoutsThisWeek.length === 0 ? 'Nessun allenamento completato questa settimana' : contextData.workoutsThisWeek.map((w: any) => `${w.name} (${w.duration} min)`).join(', ')}.
- Lista della spesa: ${contextData.shoppingList.length === 0 ? 'Lista vuota' : `${contextData.shoppingList.filter((s: any) => !s.bought).length} articoli rimanenti`}.`;

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
              parts: [{ text: textToSend }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.7,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Errore API (Codice: ${response.status})`);
      }

      const data = await response.json();
      const rawAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawAnswer) {
        throw new Error("Nessuna risposta ricevuta dal modello.");
      }

      // Auto-extract facts to remember
      const regex = /\[MEMORIZZA:\s*([^\]]+)\]/gi;
      let match;
      const newFacts: string[] = [];
      while ((match = regex.exec(rawAnswer)) !== null) {
        const fact = match[1].trim();
        if (fact) newFacts.push(fact);
      }

      // Strip tags from clean answer
      const cleanAnswer = rawAnswer.replace(regex, '').trim();

      if (newFacts.length > 0) {
        setMemoryList(current => {
          const next = [...current];
          newFacts.forEach(f => {
            if (!next.includes(f)) next.push(f);
          });
          return next;
        });
      }

      const coachMsg: Message = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: cleanAnswer,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, coachMsg]);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Errore di connessione.');
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'coach',
          text: `⚠️ Errore di connessione con il modello Gemini.\n\nDettaglio: ${err.message || 'Chiave API non valida o problemi di rete'}.`,
          timestamp: new Date().toISOString(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Companion Shortcuts
  const companionShortcuts = [
    { label: '⚡ Analizza Routine', text: 'Analizza come sta andando la mia giornata basandoti sulla routine, alimentazione e finanze di oggi. Dammi 2 suggerimenti immediati.' },
    { label: '💼 Report Finanze', text: 'Fai un riassunto critico delle mie spese mensili e controlla se sto rispettando il budget. Proietta la spesa a fine mese.' },
    { label: '🏋️ Suggerisci Workout', text: 'Dammi una raccomandazione di workout in base al mio storico settimanale e ai miei obiettivi.' },
    { label: '📖 Leggi Consigliata', text: 'Suggeriscimi un versetto biblico o un tema di studio in base al mio focus o alle mie fatiche attuali.' }
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      <SectionHeader 
        title="AI COMPANION" 
        label="PERSONAL_ASSISTANT_OS" 
        subtitle="Il tuo compagno personale con memoria a lungo termine, collegato a tutti i tracker della tua vita."
      />

      {/* API Key Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-2 border-black bg-gray-50/50 p-4 font-mono text-[10px] uppercase tracking-wider rounded-2xl">
        <div className="flex items-center gap-2">
          <Key size={14} className={apiKey ? "text-green-600 animate-pulse" : "text-amber-500"} />
          <span>
            Stato Assistente: {apiKey ? <strong className="text-green-600">Online & Collegato</strong> : <strong className="text-amber-600">Off-line (Configura Chiave)</strong>}
          </span>
        </div>
        <div className="flex gap-2">
          {apiKey && (
            <button onClick={handleClearKey} className="border border-black bg-white px-2 py-1 text-[9px] font-black hover:bg-black hover:text-white transition-colors">
              Rimuovi Chiave
            </button>
          )}
          <button onClick={() => setShowKeyForm(!showKeyForm)} className="border border-black bg-white px-2 py-1 text-[9px] font-black hover:bg-black hover:text-white transition-colors">
            {showKeyForm ? 'Nascondi setup' : 'Configura Chiave'}
          </button>
        </div>
      </div>

      {/* Key Setup Form */}
      <AnimatePresence>
        {showKeyForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-2 border-black bg-white p-4 rounded-2xl shadow-sm"
          >
            <div className="flex items-start gap-3 mb-3">
              <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-black text-xs uppercase tracking-tight">Come ottenere una chiave gratuita</h4>
                <p className="font-mono text-[9px] text-gray-500 uppercase leading-relaxed tracking-wider mt-1">
                  1. Accedi a <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-offwhite-orange font-black underline">Google AI Studio</a>.<br />
                  2. Clicca su <strong>"Get API Key"</strong> poi su <strong>"Create API Key"</strong>.<br />
                  3. Incolla il codice qui sotto. Sarà memorizzato localmente.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveKey} className="flex gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Incolla qui la chiave API (inizia con AIzaSy...)"
                className="flex-1 rounded-xl bg-black/5 border-0 focus:ring-1 focus:ring-offwhite-orange px-4 py-2 font-medium text-xs outline-none transition-all"
                required
              />
              <button 
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black px-5 py-2 font-bold text-xs hover:opacity-90 shadow-md transition-all shrink-0"
              >
                Abilita Companion
                <ArrowRight size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TWO-COLUMN OS WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0">
        
        {/* COLUMN 1: MAIN CHAT PANEL (8/12) */}
        <div className="lg:col-span-8 flex flex-col border-2 border-black rounded-3xl bg-white/40 dark:bg-black/10 overflow-hidden shadow-sm min-h-[450px]">
          
          {/* Messages Scroller */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-[11px] leading-relaxed">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 border-black shadow-sm ${isUser ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-offwhite-orange text-white'}`}>
                    {isUser ? <span className="font-black text-[9px]">ME</span> : <Brain size={16} />}
                  </div>

                  {/* Bubble */}
                  <div className={`p-4 whitespace-pre-line text-sm leading-relaxed border-2 border-black rounded-2xl shadow-sm ${
                    isUser 
                      ? 'bg-white text-black rounded-tr-sm' 
                      : 'bg-black text-white dark:bg-zinc-900 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                <div className="w-9 h-9 rounded-full bg-offwhite-orange text-white flex items-center justify-center animate-spin border-2 border-black shadow-sm">
                  <RefreshCw size={14} />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-sm bg-black border-2 border-black text-white italic text-xs shadow-sm">
                  L'AI Companion sta analizzando i dati e recuperando i ricordi...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Proactive Shortcuts */}
          {apiKey && !isLoading && (
            <div className="px-4 py-3 border-t border-black/10 bg-black/5 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
              {companionShortcuts.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSendMessage(s.text)}
                  className="rounded-full bg-white border border-black/15 px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wide text-black hover:border-black active-press-scale shadow-sm shrink-0"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Form Bar */}
          <div className="border-t border-black/15 p-4 bg-black/5">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }} 
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={apiKey ? "Chiedi, proponi o conversa con il tuo Companion..." : "Fornisci una chiave API in alto per avviare il sistema..."}
                disabled={!apiKey || isLoading}
                className="flex-1 rounded-full bg-white border-2 border-black px-5 py-3 text-sm outline-none focus:ring-1 focus:ring-offwhite-orange disabled:bg-gray-100 disabled:cursor-not-allowed shadow-inner placeholder:text-gray-400 font-medium"
              />
              <button
                type="submit"
                disabled={!apiKey || !inputText.trim() || isLoading}
                className="rounded-full bg-black text-white dark:bg-white dark:text-black w-12 h-12 flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-md transition-all border-2 border-black"
                aria-label="Invia"
              >
                <Send size={15} />
              </button>
              
              <button
                type="button"
                onClick={handleClearChat}
                title="Pulisci cronologia conversazione"
                className="rounded-full bg-white text-gray-500 border-2 border-black w-12 h-12 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center shrink-0 shadow-sm"
              >
                <Trash2 size={15} />
              </button>
            </form>
          </div>
        </div>

        {/* COLUMN 2: MEMORY CONSOLE (4/12) */}
        <div className="lg:col-span-4 flex flex-col border-2 border-black rounded-3xl bg-white/40 dark:bg-black/10 overflow-hidden shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-black/10">
            <BrainCircuit size={18} className="text-offwhite-orange" />
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-offwhite-orange block">COMPANION_MEMORY</span>
              <h3 className="text-xs font-bold uppercase tracking-tight">Ricordi & Preferenze</h3>
            </div>
          </div>

          {/* Memory List */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] lg:max-h-none scrollbar-thin">
            {memoryList.length === 0 ? (
              <div className="text-center py-8 opacity-45 font-mono text-[9px] uppercase">
                Memoria vuota. Di' al compagno le tue abitudini o aggiungi un fatto manuale.
              </div>
            ) : (
              memoryList.map((fact, idx) => (
                <div key={idx} className="flex items-start justify-between p-2.5 border border-black/10 rounded-xl bg-white hover:border-black transition-all">
                  <p className="text-[11px] font-mono leading-relaxed text-black/80 flex-1 pr-2">
                    {fact}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveMemory(idx)}
                    className="text-gray-400 hover:text-red-500 p-0.5 shrink-0 transition-colors"
                    title="Dimentica questo fatto"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add fact manually */}
          <form onSubmit={handleAddMemory} className="border-t-2 border-black/10 pt-3 space-y-2 shrink-0">
            <span className="font-mono text-[8px] uppercase tracking-widest text-gray-500 block">Aggiungi ricordo manuale</span>
            <div className="flex gap-1.5">
              <input
                value={newMemoryInput}
                onChange={(e) => setNewMemoryInput(e.target.value)}
                placeholder="es. Preferisco pesi medi"
                maxLength={80}
                className="flex-1 bg-white border border-black/15 focus:border-black focus:ring-0 rounded-xl px-3 py-1.5 text-xs font-mono"
              />
              <button 
                type="submit" 
                disabled={!newMemoryInput.trim()} 
                className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center hover:opacity-80 disabled:opacity-30 transition-all shrink-0 border border-black"
                title="Aggiungi ricordo"
              >
                <Plus size={14} />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
