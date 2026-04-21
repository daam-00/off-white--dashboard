import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, MoreHorizontal, Search } from 'lucide-react';
import { BibleChapter, bibleLibrary } from '../data/bibleLibrary';

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
    const nextIndex = Math.min(Math.max(selectedIndex + direction, 0), chapters.length - 1);
    setSelectedChapterId(chapters[nextIndex].id);
    setSelectedVerseIndex(0);
  };

  const chooseBook = (book: string) => {
    const firstChapter = chapters.find((chapter) => chapter.book === book);
    if (firstChapter) {
      setSelectedChapterId(firstChapter.id);
      setSelectedVerseIndex(0);
    }
  };

  const chooseChapter = (chapterId: string) => {
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
          <button type="button" className="bible-app-icon-button" aria-label="Opzioni">
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

      <article className="bible-app-page">
        <div className="bible-app-status">
          <span>{selectedChapter.testament} Testamento</span>
          <span>{isLoadingBible ? 'Carico testo' : `${chapters.length} capitoli`}</span>
        </div>
        {bibleError ? <p className="bible-app-error">{bibleError}</p> : null}

        <h2>{selectedChapter.book} {selectedChapter.chapter}</h2>

        <div className="bible-app-verses">
          {selectedChapter.verses.map((verse, index) => {
            const verseId = `${selectedChapter.id}-${index}`;
            const isHighlighted = highlightedVerses.has(verseId);

            return (
              <p
                key={verseId}
                id={`${selectedChapter.id}-verse-${index + 1}`}
                className={`${index === selectedVerseIndex ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
                onClick={() => toggleHighlight(verseId)}
                style={{ cursor: 'pointer' }}
              >
                <sup>{index + 1}</sup>
                {highlightSearchTerms(verse, query)}
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
    </section>
  );
};

export default Bible;
