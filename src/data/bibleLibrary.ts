export type BibleChapter = {
  id: string;
  book: string;
  chapter: number;
  testament: 'Nuovo' | 'Antico';
  summary: string;
  verses: string[];
};

// Populated at runtime from /bible/italian_nr2006.xml
export const bibleLibrary: BibleChapter[] = [];
