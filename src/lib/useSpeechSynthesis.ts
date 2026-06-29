import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechStatus = 'idle' | 'playing' | 'paused';

export interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voiceURI?: string;
  onVerseStart?: (index: number) => void;
  onVerseEnd?: (index: number) => void;
  onDone?: () => void;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const {
    lang = 'it-IT',
    rate = 1,
    pitch = 1,
    voiceURI,
    onVerseStart,
    onVerseEnd,
    onDone,
  } = options;

  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number>(-1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const versesRef = useRef<string[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const isCancelledRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Callbacks refs to avoid stale closures
  const onVerseStartRef = useRef(onVerseStart);
  const onVerseEndRef = useRef(onVerseEnd);
  const onDoneRef = useRef(onDone);
  onVerseStartRef.current = onVerseStart;
  onVerseEndRef.current = onVerseEnd;
  onDoneRef.current = onDone;

  // Load available voices
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const loadVoices = () => {
      const voices = synth.getVoices();
      const italianVoices = voices.filter(
        (v) => v.lang.startsWith('it') || v.lang.startsWith('it-')
      );
      // If no Italian voices, show all voices as fallback
      setAvailableVoices(italianVoices.length > 0 ? italianVoices : voices);
    };

    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const getSelectedVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (!voiceURI) {
      // Auto-select best Italian voice (prioritize high-quality/natural ones)
      const italianVoices = voices.filter(
        (v) => v.lang.startsWith('it') || v.lang.startsWith('it-')
      );
      if (italianVoices.length === 0) return null;

      // Prioritize natural, premium, Google, Siri or Luca/Alice voices
      const premium = italianVoices.find((v) => {
        const nameLower = v.name.toLowerCase();
        return (
          nameLower.includes('premium') ||
          nameLower.includes('natural') ||
          nameLower.includes('siri') ||
          nameLower.includes('google')
        );
      });
      if (premium) return premium;

      const local = italianVoices.find((v) => v.localService);
      return local ?? italianVoices[0];
    }
    return voices.find((v) => v.voiceURI === voiceURI) ?? null;
  }, [voiceURI]);

  const speakVerse = useCallback(
    (text: string, index: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (isCancelledRef.current) {
          reject(new Error('cancelled'));
          return;
        }

        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        const voice = getSelectedVoice();
        if (voice) utterance.voice = voice;
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = pitch;

        currentIndexRef.current = index;
        setCurrentVerseIndex(index);
        onVerseStartRef.current?.(index);

        utterance.onend = () => {
          onVerseEndRef.current?.(index);
          resolve();
        };

        utterance.onerror = (event) => {
          if (event.error === 'canceled' || event.error === 'interrupted') {
            resolve();
          } else {
            reject(new Error(event.error));
          }
        };

        synth.speak(utterance);
      });
    },
    [getSelectedVoice, lang, rate, pitch]
  );

  const speakAll = useCallback(
    async (verses: string[], startIndex = 0) => {
      const synth = window.speechSynthesis;
      if (!synth) return;

      // Cancel any ongoing speech
      synth.cancel();
      isCancelledRef.current = false;
      versesRef.current = verses;
      setStatus('playing');

      try {
        for (let i = startIndex; i < verses.length; i++) {
          if (isCancelledRef.current) break;
          await speakVerse(verses[i], i);
          // Small pause between verses
          if (!isCancelledRef.current && i < verses.length - 1) {
            await new Promise((r) => setTimeout(r, 300));
          }
        }
      } catch {
        // Speech was cancelled or errored
      }

      if (!isCancelledRef.current) {
        setStatus('idle');
        setCurrentVerseIndex(-1);
        currentIndexRef.current = -1;
        onDoneRef.current?.();
      }
    },
    [speakVerse]
  );

  const speakSingle = useCallback(
    async (text: string, index: number) => {
      const synth = window.speechSynthesis;
      if (!synth) return;

      synth.cancel();
      isCancelledRef.current = false;
      setStatus('playing');

      try {
        await speakVerse(text, index);
      } catch {
        // cancelled
      }

      if (!isCancelledRef.current) {
        setStatus('idle');
        setCurrentVerseIndex(-1);
        currentIndexRef.current = -1;
      }
    },
    [speakVerse]
  );

  const pause = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth?.speaking) {
      synth.pause();
      setStatus('paused');
    }
  }, []);

  const resume = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth?.paused) {
      synth.resume();
      setStatus('playing');
    }
  }, []);

  const stop = useCallback(() => {
    isCancelledRef.current = true;
    const synth = window.speechSynthesis;
    synth?.cancel();
    setStatus('idle');
    setCurrentVerseIndex(-1);
    currentIndexRef.current = -1;
  }, []);

  const togglePlayPause = useCallback(
    (verses?: string[], startIndex?: number) => {
      if (status === 'playing') {
        pause();
      } else if (status === 'paused') {
        resume();
      } else if (verses) {
        speakAll(verses, startIndex ?? 0);
      }
    },
    [status, pause, resume, speakAll]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Chrome has a bug where speech stops after ~15s. This keeps it alive.
  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => {
      const synth = window.speechSynthesis;
      if (synth?.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [status]);

  return {
    status,
    currentVerseIndex,
    availableVoices,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    speakAll,
    speakSingle,
    pause,
    resume,
    stop,
    togglePlayPause,
  };
}
