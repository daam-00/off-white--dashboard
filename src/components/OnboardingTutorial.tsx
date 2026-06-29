import React, { useState } from 'react';
import { Sparkles, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
import { SECTION_CHOICES, type SectionTab } from '../context/DashboardContext';

interface OnboardingTutorialProps {
  onComplete: (sections: SectionTab[]) => void;
  defaultEnabledSections: SectionTab[];
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete, defaultEnabledSections }) => {
  const [selectedSections, setSelectedSections] = useState<SectionTab[]>(defaultEnabledSections);

  const toggleSection = (section: SectionTab) => {
    setSelectedSections((current) => {
      if (current.includes(section)) {
        return current.length > 1 ? current.filter((item) => item !== section) : current;
      }
      return [...current, section];
    });
  };

  return (
    <motion.div className="user-panel-backdrop onboarding-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="onboarding-bg-orbs" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <motion.section
        className="onboarding-panel"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
      >
        <div className="onboarding-icon">
          <Sparkles size={28} />
        </div>
        <div className="offwhite-label">PRIMO_ACCESSO</div>
        <h2>Costruisci la tua dashboard</h2>
        <p>
          Better Me parte pulita: nessun dato pre-caricato, solo il tuo account, i tuoi obiettivi e la tua progressione.
        </p>
        <div className="onboarding-steps">
          <div><strong>1</strong><span>Check-in giornaliero per mantenere la serie.</span></div>
          <div><strong>2</strong><span>To-do personali: +25 credits ciascuno.</span></div>
          <div><strong>3</strong><span>Bonus +50 quando completi tutta la routine.</span></div>
          <div><strong>4</strong><span>I Better Credits fanno salire anche il livello account.</span></div>
        </div>

        <div className="section-picker">
          <div className="user-tutorial-title">
            <LayoutDashboard size={18} />
            <span>Scegli le sezioni</span>
          </div>
          <div className="section-choice-grid">
            {SECTION_CHOICES.map((section) => {
              const Icon = section.icon;
              const active = selectedSections.includes(section.id);

              return (
                <div
                  key={section.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSection(section.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSection(section.id);
                    }
                  }}
                  className={`section-choice-card cursor-pointer section-card-${section.id} ${active ? 'is-selected' : ''}`}
                >
                  <div className="section-card-icon-wrapper">
                    <Icon size={18} />
                  </div>
                  <div className="section-card-info">
                    <span>{section.label}</span>
                    <small>{section.description}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={() => onComplete(selectedSections)} className="auth-submit onboarding-submit">
          Inizia
        </button>
      </motion.section>
    </motion.div>
  );
};
