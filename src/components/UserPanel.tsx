import React, { useState, useEffect } from 'react';
import { PencilLine, Check, LayoutDashboard, CircleHelp, LogOut, X, SwatchBook, UserRound, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { PROFILE_AVATARS } from '../lib/avatars';
import { DASHBOARD_THEMES } from '../lib/themes';
import { SECTION_CHOICES, type SectionTab, type UserProfile } from '../context/DashboardContext';

interface UserPanelProps {
  email?: string | null;
  displayName: string;
  points: number;
  accountLevelLabel: string;
  accountLevelNumber: number;
  accountLevelProgress: number;
  nextLevelCopy: string;
  checkinStreak: number;
  enabledSections: SectionTab[];
  avatarId?: string | null;
  activeThemeId: string;
  onProfileSave: (profile: UserProfile) => void;
  onSectionsSave: (sections: SectionTab[]) => void;
  onThemeChange: (themeId: string) => void;
  onAvatarChange: (avatarId: string) => void;
  onClose: () => void;
  onLogout: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({
  email,
  displayName,
  points,
  accountLevelLabel,
  accountLevelNumber,
  accountLevelProgress,
  nextLevelCopy,
  checkinStreak,
  enabledSections,
  avatarId,
  activeThemeId,
  onProfileSave,
  onSectionsSave,
  onThemeChange,
  onAvatarChange,
  onClose,
  onLogout,
}) => {
  const [nameInput, setNameInput] = useState(displayName);
  const [sectionDraft, setSectionDraft] = useState<SectionTab[]>(enabledSections);
  const [isNameSaved, setIsNameSaved] = useState(false);
  const [areSectionsSaved, setAreSectionsSaved] = useState(false);

  useEffect(() => {
    setNameInput(displayName);
  }, [displayName]);

  useEffect(() => {
    setSectionDraft(enabledSections);
  }, [enabledSections]);

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = nameInput.trim();
    if (!nextName) return;

    onProfileSave({ name: nextName });
    setIsNameSaved(true);
    window.setTimeout(() => setIsNameSaved(false), 1400);
  };

  const toggleSection = (section: SectionTab) => {
    setSectionDraft((current) => {
      if (current.includes(section)) {
        return current.length > 1 ? current.filter((item) => item !== section) : current;
      }
      return [...current, section];
    });
  };

  const selectOnlySection = (section: SectionTab) => {
    setSectionDraft([section]);
  };

  const handleSectionsSubmit = () => {
    onSectionsSave([...sectionDraft]);
    setAreSectionsSaved(true);
    window.setTimeout(() => setAreSectionsSaved(false), 1400);
  };

  return (
    <motion.div
      className="user-panel-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        className="user-panel"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="user-panel-head">
          <div className="user-avatar-large">
            {avatarId ? (
              (() => {
                const av = PROFILE_AVATARS.find(a => a.id === avatarId);
                return av ? (
                  <img src={av.imageUrl} alt={av.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', borderRadius: '9999px', backgroundColor: av.bgColor }} />
                ) : displayName.slice(0, 1).toUpperCase();
              })()
            ) : displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="offwhite-label">AREA_UTENTE</div>
            <h2>{displayName}</h2>
            <p>{email}</p>
          </div>
          <button type="button" onClick={onClose} className="user-panel-close" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleProfileSubmit} className="user-profile-form">
          <label>
            <span>Nome visualizzato</span>
            <div>
              <PencilLine size={16} />
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Il tuo nome"
                maxLength={32}
              />
            </div>
          </label>
          <button type="submit" disabled={!nameInput.trim()}>
            {isNameSaved ? <Check size={16} /> : <PencilLine size={16} />}
            {isNameSaved ? 'Salvato' : 'Aggiorna'}
          </button>
        </form>

        <div className="user-panel-stats">
          <div>
            <span>{points}</span>
            <p>Better Credits</p>
          </div>
          <div>
            <span>L{accountLevelNumber}</span>
            <p>{accountLevelLabel}</p>
          </div>
          <div>
            <span>{checkinStreak}</span>
            <p>Giorni di serie</p>
          </div>
        </div>

        <section className="offwhite-border bg-white p-4">
          <div className="user-tutorial-title">
            <Sparkles size={18} />
            <span>Livello account</span>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-gray-500">
            {nextLevelCopy}
          </p>
          <div className="mt-3 h-2 overflow-hidden border-2 border-black bg-gray-100">
            <div className="h-full bg-black transition-all" style={{ width: `${accountLevelProgress}%` }} />
          </div>
        </section>

        <section className="user-sections-editor">
          <div className="user-tutorial-title">
            <LayoutDashboard size={18} />
            <span>Sezioni attive</span>
          </div>
          <div className="section-choice-grid is-compact">
            {SECTION_CHOICES.map((section) => {
              const Icon = section.icon;
              const active = sectionDraft.includes(section.id);

              return (
                <div key={section.id} className={`section-choice-card section-card-${section.id} ${active ? 'is-selected' : ''}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSection(section.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleSection(section.id);
                      }
                    }}
                    className="section-choice-main cursor-pointer"
                  >
                    <div className="section-card-icon-wrapper">
                      <Icon size={18} />
                    </div>
                    <div className="section-card-info">
                      <span>{section.label}</span>
                      <small>{active ? 'Attiva' : 'Nascosta'}</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => selectOnlySection(section.id)} className="section-only-action">
                    Solo questa
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={handleSectionsSubmit} className="section-save-button">
            {areSectionsSaved ? <Check size={16} /> : <LayoutDashboard size={16} />}
            {areSectionsSaved ? 'Sezioni salvate' : 'Salva sezioni'}
          </button>
        </section>

        <section className="user-sections-editor mt-6">
          <div className="user-tutorial-title">
            <SwatchBook size={18} />
            <span>Tema Attivo</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {DASHBOARD_THEMES.map((theme) => {
              const active = theme.id === activeThemeId;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onThemeChange(theme.id)}
                  className={`flex flex-col items-start p-3 border-2 text-left rounded-xl transition-all ${
                    active 
                      ? 'border-black bg-black/5 dark:bg-white/5' 
                      : 'border-black/10 hover:border-black'
                  }`}
                  style={{
                    borderColor: active ? 'var(--theme-accent)' : 'rgba(255,255,255,0.08)'
                  }}
                >
                  <span className="text-xs font-bold font-mono tracking-wide">{theme.name}</span>
                  <span className="text-[8px] opacity-60 uppercase mt-0.5">{theme.badge}</span>
                  <div className="flex gap-1.5 mt-2">
                    <span className="h-3.5 w-3.5 rounded-full border border-black/20" style={{ backgroundColor: theme.accent }} />
                    <span className="h-3.5 w-3.5 rounded-full border border-black/20" style={{ backgroundColor: theme.background }} />
                    <span className="h-3.5 w-3.5 rounded-full border border-black/20" style={{ backgroundColor: theme.ink }} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="user-sections-editor mt-6">
          <div className="user-tutorial-title">
            <UserRound size={18} />
            <span>Scegli Avatar</span>
          </div>
          <div className="flex gap-3 overflow-x-auto py-2.5 px-0.5 scrollbar-thin">
            {PROFILE_AVATARS.map((av) => {
              const active = av.id === avatarId;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => onAvatarChange(av.id)}
                  className={`shrink-0 h-12 w-12 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden ${
                    active ? 'border-black' : 'border-black/10 hover:border-black'
                  }`}
                  style={{
                    borderColor: active ? 'var(--theme-accent)' : 'rgba(255,255,255,0.1)',
                    backgroundColor: av.bgColor
                  }}
                  title={av.name}
                >
                  <img src={av.imageUrl} alt={av.name} className="h-full w-full object-cover object-top" />
                </button>
              );
            })}
          </div>
        </section>

        <div className="user-tutorial">
          <div className="user-tutorial-title">
            <CircleHelp size={18} />
            <span>Come funziona Better Me</span>
          </div>
          <ol>
            <li>Fai check-in una volta al giorno: aumenta la serie e ricevi +10 credits.</li>
            <li>Crea i tuoi to-do giornalieri nella Routine. Ogni to-do completato vale +25 credits.</li>
            <li>Completa tutti i to-do del giorno per ricevere un bonus +50 credits.</li>
            <li>Usa i credits per sbloccare nuovi temi e salire di livello account.</li>
            <li>Dieta, spesa, finanze, routine e preferenze vengono salvate nel tuo account.</li>
          </ol>
        </div>

        <button type="button" onClick={onLogout} className="user-panel-logout">
          <LogOut size={16} />
          Esci
        </button>
      </motion.section>
    </motion.div>
  );
};
