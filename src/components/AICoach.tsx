import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SectionHeader } from './SectionHeader';
import { Sparkles, Send, RefreshCw, Key, ArrowRight, Bot, Trash2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

const CHAT_STORAGE_KEY = 'betterme_ai_chat_history';
const API_KEY_STORAGE_KEY = 'betterme_gemini_api_key';

export const AICoach: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    // Try local storage first
    const local = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (local) return local;
    
    // Fallback to process.env (Vite define injection)
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
      // Welcome message
      setMessages([
        {
          id: 'welcome',
          sender: 'coach',
          text: 'Ciao! Sono il tuo Coach IA personale. Posso analizzare le tue abitudini di alimentazione, allenamento, routine quotidiana e finanze per darti consigli mirati. \n\nUsa i pulsanti rapidi in basso o scrivimi direttamente per iniziare!',
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

  // Remove API Key helper
  const handleClearKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setShowKeyForm(true);
  };

  // Clear chat history
  const handleClearChat = () => {
    const defaultWelcome: Message[] = [
      {
        id: 'welcome',
        sender: 'coach',
        text: 'Chat pulita. Dimmi pure come posso aiutarti oggi a migliorare la tua routine o raggiungere i tuoi obiettivi!',
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(defaultWelcome);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(defaultWelcome));
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

  // Call Gemini API via direct HTTP Fetch
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
    const systemPrompt = `Sei "Coach IA" (o "AI Coach") per l'applicazione "Better Me", una dashboard personale per la produttività, la crescita, le finanze e lo stile di vita sano.
Parli in italiano. Sei stimolante, accogliente, diretto, energetico ed estremamente pratico.
Usi uno stile pulito, minimalista e diretto (off-white design language).
Non usare risposte chilometriche: preferisci punti elenco chiari ed emoji mirate.
Hai accesso diretto ai dati correnti dell'utente per potergli dare consigli contestualizzati e precisi.

Ecco i dati reali dell'utente in questo momento:
- Profilo: ${contextData.profile.name}, Crediti Better Credits accumulati: ${contextData.profile.credits}, Giorni di check-in totali: ${contextData.profile.streak}.
- Routine di oggi: ${contextData.todayTasks.length === 0 ? 'Nessuna attività programmata oggi' : contextData.todayTasks.map((t: any) => `${t.label} (${t.completed ? 'Completata' : 'Da fare'})`).join(', ')}.
- Alimentazione odierna: Consumate ${contextData.dietToday.totalCaloriesConsumed} kcal. Pasti: ${contextData.dietToday.meals.length === 0 ? 'Nessun pasto registrato oggi' : contextData.dietToday.meals.map((m: any) => `${m.name} (${m.calories} kcal)`).join(', ')}.
- Finanze del mese: Spese totali registrate di ${contextData.walletThisMonth.totalSpent}€. Transazioni: ${contextData.walletThisMonth.transactions.length === 0 ? 'Nessuna spesa inserita' : contextData.walletThisMonth.transactions.map((t: any) => `${t.description}: ${t.amount}€ (${t.type})`).join(', ')}.
- Allenamenti salvati: ${contextData.workoutsThisWeek.length === 0 ? 'Nessun allenamento completato questa settimana' : contextData.workoutsThisWeek.map((w: any) => `${w.name} (${w.duration} min)`).join(', ')}.
- Lista della spesa: ${contextData.shoppingList.length === 0 ? 'Lista vuota' : `${contextData.shoppingList.filter((s: any) => !s.bought).length} articoli rimanenti`}.

Analizza la richiesta dell'utente usando questi dati. Se ti chiede consigli su ricette, controlla le sue calorie o cosa ha mangiato. Se chiede delle finanze, commenta la spesa. Se ti chiede un'analisi generale, riassumi come sta andando oggi.
Non rivelare mai la struttura tecnica o il fatto che ti vengono passati i dati come JSON. Rivolgiti a lui come ${contextData.profile.name}.`;

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
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!answer) {
        throw new Error("Nessuna risposta ricevuta dal modello IA.");
      }

      const coachMsg: Message = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: answer,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, coachMsg]);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Errore di connessione. Controlla la chiave API o la rete.');
      
      // Add error response from coach
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'coach',
          text: `⚠️ Errore di connessione con il modello Gemini.\n\nDettaglio: ${err.message || 'Chiave API non valida o problemi di rete'}.\n\nSe hai inserito una chiave API personalizzata, assicurati che sia corretta o prova a rigenerarla su Google AI Studio.`,
          timestamp: new Date().toISOString(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick prompt templates
  const quickPrompts = [
    { label: '⚡ Analizza Giornata', text: 'Analizza come sta andando la mia giornata basandoti sui dati della routine, alimentazione e finanze.' },
    { label: '🍏 Consigli Dieta', text: 'Dammi un consiglio nutrizionale basato sulle calorie consumate oggi e suggerisci una ricetta salutare.' },
    { label: '🏋️ Suggerisci Allenamento', text: 'Consigliami una routine di allenamento veloce da fare oggi in base al mio storico di questa settimana.' },
    { label: '💼 Stato Finanze', text: 'Fai una recensione delle mie spese mensili e dammi un suggerimento per risparmiare.' },
  ];

  return (
    <div className="offwhite-border h-full flex flex-col min-h-[500px]">
      <SectionHeader 
        title="COACH IA" 
        label="ASSISTENTE_GEMINI_V2.5" 
        subtitle="Il tuo coach personale basato su intelligenza artificiale, collegato ai dati della tua dashboard."
      />

      {/* API Key Banner/Status */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-2 border-black bg-gray-50 p-4 font-mono text-[10px] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <Key size={14} className={apiKey ? "text-green-600" : "text-amber-500"} />
          <span>
            Chiave Gemini: {apiKey ? <strong className="text-green-600">Configurata (Gratuita)</strong> : <strong className="text-amber-600">Mancante</strong>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {apiKey && (
            <button 
              onClick={handleClearKey} 
              className="border border-black bg-white px-2 py-1 text-[9px] font-black hover:bg-black hover:text-black dark:text-white transition-colors"
            >
              Rimuovi Chiave
            </button>
          )}
          <button 
            onClick={() => setShowKeyForm(!showKeyForm)} 
            className="border border-black bg-white px-2 py-1 text-[9px] font-black hover:bg-black hover:text-black dark:text-white transition-colors"
          >
            {showKeyForm ? 'Nascondi setup' : 'Configura Chiave'}
          </button>
        </div>
      </div>

      {/* Setup API Key Form */}
      <AnimatePresence>
        {showKeyForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden border-2 border-black bg-white p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-black text-sm uppercase tracking-tight">Come ottenere una chiave gratuita</h4>
                <p className="font-mono text-[10px] text-gray-500 uppercase leading-relaxed tracking-wider mt-1">
                  1. Visita <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-offwhite-orange font-black underline">Google AI Studio</a> ed entra con il tuo account Google.<br />
                  2. Clicca su <strong>"Get API Key"</strong> in alto a sinistra, poi su <strong>"Create API Key"</strong>.<br />
                  3. Incolla la chiave generata nel campo sottostante. Verrà salvata in modo sicuro nel browser.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveKey} className="flex gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Incolla qui la chiave API (inizia con AIzaSy...)"
                className="flex-1 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 px-4 py-2 font-medium text-sm outline-none focus:border-[#a600ff] focus:ring-2 focus:ring-[#a600ff]/20 transition-all placeholder:text-gray-500"
                required
              />
              <button 
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#a600ff] to-[#ff007f] text-white px-5 py-2 font-bold text-sm hover:opacity-90 shadow-md transition-all"
              >
                Salva
                <ArrowRight size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-[380px] md:h-[450px]">
        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-[11px] leading-relaxed">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isUser ? 'bg-gradient-to-br from-gray-800 to-black text-black dark:text-white' : 'bg-gradient-to-br from-[#00d2ff] via-[#a600ff] to-[#ff007f] text-black dark:text-white'}`}>
                  {isUser ? (
                    <span className="font-black text-[10px]">ME</span>
                  ) : (
                    <Bot size={16} />
                  )}
                </div>

                {/* Text Panel */}
                <div className={`p-4 whitespace-pre-line text-sm leading-relaxed shadow-sm backdrop-blur-md border ${isUser ? 'bg-white/90 dark:bg-white/80 border-white/60 rounded-2xl rounded-tr-sm text-black dark:text-gray-800' : 'bg-black/80 border-black/60 rounded-2xl rounded-tl-sm text-white'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00d2ff] via-[#a600ff] to-[#ff007f] text-black dark:text-white flex items-center justify-center animate-spin shadow-sm">
                <RefreshCw size={14} />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-sm bg-black/80 backdrop-blur-md border border-black/60 text-black dark:text-white/70 italic text-sm shadow-sm">
                Coach IA sta analizzando i tuoi dati...
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        {apiKey && !isLoading && (
          <div className="px-4 py-3 border-t border-white/30 bg-white/20 backdrop-blur-lg flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mr-1 shrink-0">Chiedi rapido:</span>
            {quickPrompts.map((p) => (
              <button
                key={p.label}
                onClick={() => handleSendMessage(p.text)}
                className="rounded-full bg-white/60 backdrop-blur-md border border-white/80 px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-white hover:text-[#a600ff] hover:border-[#a600ff]/30 shadow-sm transition-all shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-white/30 p-4 bg-white/30 backdrop-blur-xl">
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
              placeholder={apiKey ? "Fai una domanda al tuo Coach IA..." : "Configura una chiave API per abilitare la chat..."}
              disabled={!apiKey || isLoading}
              className="flex-1 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 px-5 py-3 text-sm outline-none focus:border-[#a600ff] focus:ring-2 focus:ring-[#a600ff]/20 disabled:bg-white/40 disabled:cursor-not-allowed shadow-inner transition-all placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!apiKey || !inputText.trim() || isLoading}
              className="rounded-full bg-gradient-to-r from-[#a600ff] to-[#ff007f] text-white w-12 h-12 flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:scale-105 shadow-md transition-all"
              aria-label="Invia messaggio"
            >
              <Send size={15} />
            </button>
            
            <button
              type="button"
              onClick={handleClearChat}
              title="Pulisci cronologia chat"
              className="rounded-full bg-white/60 text-gray-500 border border-white/80 w-12 h-12 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center shrink-0 shadow-sm"
            >
              <Trash2 size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
