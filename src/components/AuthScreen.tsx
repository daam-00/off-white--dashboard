import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Mail, UserRound } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { getThemeDefinition } from '../lib/themes';

type AuthMode = 'login' | 'register';

function getAuthErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';

  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
    return 'Email o password non corretti.';
  }
  if (code.includes('auth/email-already-in-use')) {
    return 'Esiste già un account con questa email.';
  }
  if (code.includes('auth/weak-password')) {
    return 'Usa una password di almeno 6 caratteri.';
  }
  if (code.includes('auth/invalid-email')) {
    return 'Inserisci una email valida.';
  }

  return 'Accesso non riuscito. Riprova tra poco.';
}

export const AuthScreen: React.FC = () => {
  const authTheme = getThemeDefinition('theme-offwhite');
  const [mode, setMode] = useState<AuthMode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="auth-shell"
      style={{
        '--theme-accent': authTheme.accent,
        '--theme-accent-soft': authTheme.accentSoft,
        '--theme-bg': authTheme.background,
        '--theme-panel': authTheme.panel,
        '--theme-panel-muted': authTheme.panelMuted,
        '--theme-ink': authTheme.ink,
        '--theme-ink-contrast': authTheme.inkContrast,
        '--theme-border': authTheme.border,
      } as React.CSSProperties}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-panel"
      >
        <div className="auth-brand-row">
          <img src="/better-me-logo.png" alt="better me" className="auth-logo" />
          <div>
            <div className="auth-kicker">BETTER_ME_OS</div>
            <h1 className="auth-title">{isRegister ? 'Crea il tuo spazio' : 'Accedi alla dashboard'}</h1>
          </div>
        </div>

        <p className="auth-copy">
          Registrati per usare la dashboard, partire da uno spazio pulito e far crescere il tuo livello account con i tuoi progressi.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Email</span>
            <div className="auth-input-shell">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@email.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-shell">
              <UserRound size={16} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimo 6 caratteri"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </div>
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Attendi...' : isRegister ? 'Registrati' : 'Entra'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(isRegister ? 'login' : 'register');
            setError('');
          }}
          className="auth-mode-button"
        >
          {isRegister ? 'Hai già un account? Accedi' : 'Nuovo utente? Crea account'}
        </button>
      </motion.div>
    </div>
  );
};
