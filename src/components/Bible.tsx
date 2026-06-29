import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Mic, MicOff, MoreHorizontal, Pause, Play, Search, SkipBack, SkipForward, Square, Volume2, X } from 'lucide-react';
import { BibleChapter, bibleLibrary } from '../data/bibleLibrary';
import { useSpeechSynthesis } from '../lib/useSpeechSynthesis';

const BIBLE_XML_PATH = '/bible/italian_nr2006.xml';

const ITALIAN_BOOK_NAMES: Record<string, string> = {
  Genesis: 'Genesi',
  Exodus: 'Esodo',
  Leviticus: 'Levitico',
  Numbers: 'Numeri',
  Deuteronomy: 'Deuteronomio',
  Joshua: 'Giosuè',
  Judges: 'Giudici',
  Ruth: 'Rut',
  '1 Samuel': '1 Samuele',
  '2 Samuel': '2 Samuele',
  '1 Kings': '1 Re',
  '2 Kings': '2 Re',
  '1 Chronicles': '1 Cronache',
  '2 Chronicles': '2 Cronache',
  Ezra: 'Esdra',
  Nehemiah: 'Neemia',
  Esther: 'Ester',
  Job: 'Giobbe',
  Psalms: 'Salmi',
  Proverbs: 'Proverbi',
  Ecclesiastes: 'Ecclesiaste',
  'Song of Solomon': 'Cantico dei Cantici',
  Isaiah: 'Isaia',
  Jeremiah: 'Geremia',
  Lamentations: 'Lamentazioni',
  Ezekiel: 'Ezechiele',
  Daniel: 'Daniele',
  Hosea: 'Osea',
  Joel: 'Gioele',
  Amos: 'Amos',
  Obadiah: 'Abdia',
  Jonah: 'Giona',
  Micah: 'Michea',
  Nahum: 'Naum',
  Habakkuk: 'Abacuc',
  Zephaniah: 'Sofonia',
  Haggai: 'Aggeo',
  Zechariah: 'Zaccaria',
  Malachi: 'Malachia',
  Matthew: 'Matteo',
  Mark: 'Marco',
  Luke: 'Luca',
  John: 'Giovanni',
  Acts: 'Atti',
  Romans: 'Romani',
  '1 Corinthians': '1 Corinzi',
  '2 Corinthians': '2 Corinzi',
  Galatians: 'Galati',
  Ephesians: 'Efesini',
  Philippians: 'Filippesi',
  Colossians: 'Colossesi',
  '1 Thessalonians': '1 Tessalonicesi',
  '2 Thessalonians': '2 Tessalonicesi',
  '1 Timothy': '1 Timoteo',
  '2 Timothy': '2 Timoteo',
  Titus: 'Tito',
  Philemon: 'Filemone',
  Hebrews: 'Ebrei',
  James: 'Giacomo',
  '1 Peter': '1 Pietro',
  '2 Peter': '2 Pietro',
  '1 John': '1 Giovanni',
  '2 John': '2 Giovanni',
  '3 John': '3 Giovanni',
  Jude: 'Giuda',
  Revelation: 'Apocalisse',
};

const SPEED_OPTIONS = [
  { label: '0.5×', value: 0.5 },
  { label: '0.75×', value: 0.75 },
  { label: '1×', value: 1 },
  { label: '1.25×', value: 1.25 },
  { label: '1.5×', value: 1.5 },
  { label: '2×', value: 2 },
];

const getBookName = (rawName: string) => ITALIAN_BOOK_NAMES[rawName] ?? rawName;

const parseBibleXml = (xmlText: string): BibleChapter[] => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');

  if (xml.querySelector('parsererror')) {
    throw new Error('XML non valido');
  }

  return Array.from(xml.querySelectorAll('BIBLEBOOK')).flatMap((bookNode) => {
    const bookNumber = Number(bookNode.getAttribute('bnumber') ?? 0);
    const rawBookName = bookNode.getAttribute('bname') ?? 'Libro';
    const book = getBookName(rawBookName);
    const testament: BibleChapter['testament'] = bookNumber >= 40 ? 'Nuovo' : 'Antico';

    return Array.from(bookNode.querySelectorAll(':scope > CHAPTER')).map((chapterNode) => {
      const chapter = Number(chapterNode.getAttribute('cnumber') ?? 1);
      const verses = Array.from(chapterNode.querySelectorAll(':scope > VERS')).map(
        (verseNode) => verseNode.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      );

      return {
        id: `${bookNumber}-${chapter}`,
        book,
        chapter,
        testament,
        summary: `${verses.length} versetti · Nuova Riveduta 2006`,
        verses,
      };
    });
  });
};

export const Bible: React.FC = () => {
  const [chapters, setChapters] = useState<BibleChapter[]>(bibleLibrary);
  const [selectedChapterId, setSelectedChapterId] = useState(bibleLibrary[0]?.id ?? '');
  const [selectedVerseIndex, setSelectedVerseIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [isLoadingBible, setIsLoadingBible] = useState(true);
  const [bibleError, setBibleError] = useState('');
  const [highlightedVerses, setHighlightedVerses] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem('bible_highlighted_verses') || '[]'))
  );

  // Voice reading state
  const [speechRate, setSpeechRate] = useState(1);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const versesContainerRef = useRef<HTMLDivElement>(null);

  const handleVerseStart = useCallback((index: number) => {
    const el = document.getElementById(`bible-verse-${index}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const speech = useSpeechSynthesis({
    lang: 'it-IT',
    rate: speechRate,
    voiceURI: selectedVoiceURI || undefined,
    onVerseStart: handleVerseStart,
  });

  useEffect(() => {
    let isMounted = true;

    const loadBible = async () => {
      try {
        const response = await fetch(BIBLE_XML_PATH);
        if (!response.ok) throw new Error('File Bibbia non trovato');
        const xmlText = await response.text();
        const parsedChapters = parseBibleXml(xmlText);

        if (isMounted && parsedChapters.length > 0) {
          setChapters(parsedChapters);
          setSelectedChapterId(parsedChapters[0].id);
          setBibleError('');
        }
      } catch (error) {
        if (isMounted) {
          setBibleError('Sto usando la libreria locale ridotta: il file XML completo non è disponibile.');
        }
      } finally {
        if (isMounted) setIsLoadingBible(false);
      }
    };

    loadBible();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredChapters = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return chapters;

    return chapters.filter((chapter) => {
      const haystack = `${chapter.book} ${chapter.chapter} ${chapter.summary} ${chapter.verses.join(' ')}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [chapters, query]);

  const selectedChapter =
    chapters.find((chapter) => chapter.id === selectedChapterId) ?? filteredChapters[0] ?? chapters[0];
  const selectedIndex = chapters.findIndex((chapter) => chapter.id === selectedChapter.id);
  const bookNames = useMemo(() => Array.from(new Set(chapters.map((chapter) => chapter.book))), [chapters]);
  const chaptersInSelectedBook = useMemo(
    () => chapters.filter((chapter) => chapter.book === selectedChapter.book),
    [chapters, selectedChapter.book],
  );

  const goToChapter = (direction: -1 | 1) => {
    speech.stop();
    const nextIndex = Math.min(Math.max(selectedIndex + direction, 0), chapters.length - 1);
    setSelectedChapterId(chapters[nextIndex].id);
    setSelectedVerseIndex(0);
  };

  const chooseBook = (book: string) => {
    speech.stop();
    const firstChapter = chapters.find((chapter) => chapter.book === book);
    if (firstChapter) {
      setSelectedChapterId(firstChapter.id);
      setSelectedVerseIndex(0);
    }
  };

  const chooseChapter = (chapterId: string) => {
    speech.stop();
    setSelectedChapterId(chapterId);
    setSelectedVerseIndex(0);
  };

  useEffect(() => {
    const verseElement = document.getElementById(`${selectedChapter.id}-verse-${selectedVerseIndex + 1}`);
    verseElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedChapter.id, selectedVerseIndex]);

  useEffect(() => {
    localStorage.setItem('bible_highlighted_verses', JSON.stringify(Array.from(highlightedVerses)));
  }, [highlightedVerses]);

  const toggleHighlight = (verseId: string) => {
    setHighlightedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(verseId)) {
        next.delete(verseId);
      } else {
        next.add(verseId);
      }
      return next;
    });
  };

  const highlightSearchTerms = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const needle = searchQuery.trim();
    const regex = new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index} className="bible-search-highlight">{part}</mark> : part
    );
  };

  // Voice reading handlers
  const handlePlayChapter = () => {
    if (speech.status === 'idle') {
      speech.speakAll(selectedChapter.verses, 0);
    } else {
      speech.togglePlayPause(selectedChapter.verses);
    }
  };

  const handlePlayFromVerse = (index: number) => {
    speech.speakAll(selectedChapter.verses, index);
  };

  const handleSpeakSingleVerse = (index: number) => {
    speech.speakSingle(selectedChapter.verses[index], index);
  };

  const handleSkipBack = () => {
    const prev = Math.max(0, speech.currentVerseIndex - 1);
    speech.speakAll(selectedChapter.verses, prev);
  };

  const handleSkipForward = () => {
    const next = Math.min(selectedChapter.verses.length - 1, speech.currentVerseIndex + 1);
    speech.speakAll(selectedChapter.verses, next);
  };

  // Stop speech when chapter changes
  useEffect(() => {
    return () => {
      speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapterId]);

  const isReading = speech.status !== 'idle';
  const readingProgress = speech.currentVerseIndex >= 0 
    ? Math.round(((speech.currentVerseIndex + 1) / selectedChapter.verses.length) * 100) 
    : 0;

  return (
    <section className="bible-app-shell">
      <header className="bible-app-topbar">
        <div className="bible-app-primary-controls" aria-label="Selezione lettura">
          <label className="bible-app-select bible-app-select-book">
            <span>Libro</span>
            <select value={selectedChapter.book} onChange={(event) => chooseBook(event.target.value)}>
              {bookNames.map((book) => (
                <option key={book} value={book}>
                  {book}
                </option>
              ))}
            </select>
          </label>

          <label className="bible-app-select">
            <span>Capitolo</span>
            <select value={selectedChapter.id} onChange={(event) => chooseChapter(event.target.value)}>
              {chaptersInSelectedBook.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.chapter}
                </option>
              ))}
            </select>
          </label>

          <div className="bible-app-version" aria-label="Versione Bibbia">NR2006</div>

          <button type="button" className="bible-app-icon-button" aria-label="Cerca">
            <Search size={28} />
          </button>
          <button 
            type="button" 
            className="bible-app-icon-button" 
            aria-label="Impostazioni voce"
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
          >
            <MoreHorizontal size={30} />
          </button>
        </div>

        <div className="bible-app-secondary-controls">
          <label className="bible-app-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca libro, parola o frase"
            />
          </label>

          <label className="bible-app-verse-select">
            <span>Versetto</span>
            <select
              value={selectedVerseIndex}
              onChange={(event) => setSelectedVerseIndex(Number(event.target.value))}
            >
              {selectedChapter.verses.map((_, index) => (
                <option key={`${selectedChapter.id}-verse-option-${index + 1}`} value={index}>
                  {index + 1}
                </option>
              ))}
            </select>
          </label>
        </div>

        {query.trim() ? (
          <div className="bible-app-results">
            {filteredChapters.slice(0, 8).map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => chooseChapter(chapter.id)}
                className={chapter.id === selectedChapter.id ? 'is-active' : ''}
              >
                {chapter.book} {chapter.chapter}
              </button>
            ))}
            {filteredChapters.length === 0 ? <span>Nessun risultato</span> : null}
          </div>
        ) : null}
      </header>

      {/* Voice Settings Panel */}
      {showVoiceSettings && (
        <div className="bible-voice-settings">
          <div className="bible-voice-settings-header">
            <span>Impostazioni Voce</span>
            <button type="button" onClick={() => setShowVoiceSettings(false)} aria-label="Chiudi">
              <X size={16} />
            </button>
          </div>
          <div className="bible-voice-settings-body">
            {speech.availableVoices.length > 0 && (
              <label className="bible-voice-select-label">
                <span>Voce</span>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className="bible-voice-select"
                >
                  <option value="">Automatica</option>
                  {speech.availableVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="bible-voice-select-label">
              <span>Velocità</span>
              <div className="bible-speed-chips">
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`bible-speed-chip ${speechRate === opt.value ? 'is-active' : ''}`}
                    onClick={() => setSpeechRate(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </label>
            {!speech.isSupported && (
              <p className="bible-voice-unsupported">
                Il tuo browser non supporta la sintesi vocale.
              </p>
            )}
          </div>
        </div>
      )}

      <article className="bible-app-page">
        <div className="bible-app-status">
          <span>{selectedChapter.testament} Testamento</span>
          <span>{isLoadingBible ? 'Carico testo' : `${chapters.length} capitoli`}</span>
        </div>
        {bibleError ? <p className="bible-app-error">{bibleError}</p> : null}

        <h2>{selectedChapter.book} {selectedChapter.chapter}</h2>

        {/* Dedicated Inline Audio Control Panel */}
        {speech.isSupported && (
          <div className="bible-inline-audio-panel">
            <span className="bible-inline-audio-title">Lettura Vocale</span>
            <div className="bible-inline-audio-actions">
              <button
                type="button"
                className={`bible-inline-audio-btn play-btn ${speech.status === 'playing' ? 'active' : ''}`}
                onClick={handlePlayChapter}
                aria-label={speech.status === 'playing' ? 'Metti in pausa' : 'Leggi capitolo'}
              >
                {speech.status === 'playing' ? <Pause size={16} /> : <Play size={16} />}
                <span>{speech.status === 'playing' ? 'Pausa' : 'Avvia'}</span>
              </button>

              {speech.status !== 'idle' && (
                <button
                  type="button"
                  className="bible-inline-audio-btn stop-btn"
                  onClick={speech.stop}
                  aria-label="Ferma"
                >
                  <Square size={14} />
                  <span>Ferma</span>
                </button>
              )}

              <div className="bible-inline-audio-divider" />

              <button
                type="button"
                className="bible-inline-audio-btn speed-btn"
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                title="Impostazioni voce"
              >
                <Volume2 size={15} />
                <span>Voce ({speechRate}x)</span>
              </button>
            </div>
            {speech.status !== 'idle' && (
              <div className="bible-inline-audio-status">
                <div className="bible-inline-audio-progress-bar">
                  <div 
                    className="bible-inline-audio-progress-fill" 
                    style={{ width: `${readingProgress}%` }}
                  />
                </div>
                <span className="bible-inline-audio-status-text">
                  Versetto {speech.currentVerseIndex + 1} di {selectedChapter.verses.length}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="bible-app-verses" ref={versesContainerRef}>
          {selectedChapter.verses.map((verse, index) => {
            const verseId = `${selectedChapter.id}-${index}`;
            const isHighlighted = highlightedVerses.has(verseId);
            const isBeingRead = speech.currentVerseIndex === index && isReading;

            return (
              <p
                key={verseId}
                id={`bible-verse-${index}`}
                className={`bible-verse-line ${index === selectedVerseIndex ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''} ${isBeingRead ? 'is-reading' : ''}`}
                onClick={() => toggleHighlight(verseId)}
                style={{ cursor: 'pointer' }}
              >
                <sup>{index + 1}</sup>
                {highlightSearchTerms(verse, query)}
                {speech.isSupported && (
                  <button
                    type="button"
                    className="bible-verse-speak-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isBeingRead) {
                        speech.stop();
                      } else {
                        handleSpeakSingleVerse(index);
                      }
                    }}
                    aria-label={isBeingRead ? 'Ferma lettura' : `Leggi versetto ${index + 1}`}
                    title={isBeingRead ? 'Ferma' : 'Leggi questo versetto'}
                  >
                    {isBeingRead ? <MicOff size={13} /> : <Volume2 size={13} />}
                  </button>
                )}
              </p>
            );
          })}
        </div>
      </article>

      <button
        type="button"
        onClick={() => goToChapter(-1)}
        disabled={selectedIndex <= 0}
        className="bible-app-float-nav bible-app-float-prev"
        aria-label="Capitolo precedente"
      >
        <ChevronLeft size={34} />
      </button>
      <button
        type="button"
        onClick={() => goToChapter(1)}
        disabled={selectedIndex >= chapters.length - 1}
        className="bible-app-float-nav bible-app-float-next"
        aria-label="Capitolo successivo"
      >
        <ChevronRight size={34} />
      </button>

      {/* Floating Audio Controls Bar */}
      {speech.isSupported && (
        <div className={`bible-audio-bar ${isReading ? 'is-active' : ''}`}>
          {isReading && (
            <div className="bible-audio-progress-track">
              <div 
                className="bible-audio-progress-fill" 
                style={{ width: `${readingProgress}%` }} 
              />
            </div>
          )}
          <div className="bible-audio-controls">
            <button
              type="button"
              className="bible-audio-btn bible-audio-btn-skip"
              onClick={handleSkipBack}
              disabled={!isReading || speech.currentVerseIndex <= 0}
              aria-label="Versetto precedente"
            >
              <SkipBack size={16} />
            </button>

            <button
              type="button"
              className="bible-audio-btn bible-audio-btn-play"
              onClick={handlePlayChapter}
              aria-label={speech.status === 'playing' ? 'Pausa' : 'Leggi capitolo'}
            >
              {speech.status === 'playing' ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              type="button"
              className="bible-audio-btn bible-audio-btn-stop"
              onClick={speech.stop}
              disabled={!isReading}
              aria-label="Stop"
            >
              <Square size={16} />
            </button>

            <button
              type="button"
              className="bible-audio-btn bible-audio-btn-skip"
              onClick={handleSkipForward}
              disabled={!isReading || speech.currentVerseIndex >= selectedChapter.verses.length - 1}
              aria-label="Versetto successivo"
            >
              <SkipForward size={16} />
            </button>

            <div className="bible-audio-info">
              {isReading ? (
                <>
                  <span className="bible-audio-verse-num">v.{speech.currentVerseIndex + 1}/{selectedChapter.verses.length}</span>
                  <span className="bible-audio-dot">·</span>
                </>
              ) : (
                <span className="bible-audio-label">Ascolta</span>
              )}
            </div>

            <button
              type="button"
              className="bible-audio-btn bible-audio-btn-speed"
              onClick={() => setShowSpeedPicker(!showSpeedPicker)}
              aria-label="Velocità"
            >
              {speechRate}×
            </button>

            {showSpeedPicker && (
              <div className="bible-speed-popup">
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`bible-speed-popup-btn ${speechRate === opt.value ? 'is-active' : ''}`}
                    onClick={() => {
                      setSpeechRate(opt.value);
                      setShowSpeedPicker(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Bible;
