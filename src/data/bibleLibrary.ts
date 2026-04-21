export type BibleChapter = {
  id: string;
  book: string;
  chapter: number;
  testament: 'Antico' | 'Nuovo';
  summary: string;
  verses: string[];
};

export const bibleLibrary: BibleChapter[] = [
  {
    id: 'genesi-1',
    book: 'Genesi',
    chapter: 1,
    testament: 'Antico',
    summary: 'Creazione, ordine, luce e vita.',
    verses: [
      'Nel principio Iddio creò il cielo e la terra.',
      'E la terra era informe e vuota; e le tenebre erano sopra la faccia dell abisso.',
      'E lo Spirito di Dio si moveva sopra la faccia delle acque.',
      'E Dio disse: Sia la luce. E la luce fu.',
      'E Dio vide che la luce era buona; e Dio separò la luce dalle tenebre.',
    ],
  },
  {
    id: 'salmo-23',
    book: 'Salmi',
    chapter: 23,
    testament: 'Antico',
    summary: 'Fiducia, cura e riposo.',
    verses: [
      'Il Signore è il mio pastore, nulla mi mancherà.',
      'Egli mi fa giacere in paschi erbosi, mi guida lungo le acque chete.',
      'Egli mi ristora l anima, mi conduce per sentieri di giustizia.',
      'Quand anche camminassi nella valle dell ombra della morte, io non temerei alcun male.',
      'Certo, beni e benignità m accompagneranno tutti i giorni della mia vita.',
    ],
  },
  {
    id: 'proverbi-3',
    book: 'Proverbi',
    chapter: 3,
    testament: 'Antico',
    summary: 'Sapienza pratica e fiducia.',
    verses: [
      'Figliuol mio, non dimenticare la mia legge; e il tuo cuore guardi i miei comandamenti.',
      'Confidati nel Signore con tutto il cuor tuo, e non appoggiarti sopra il tuo senno.',
      'Riconoscilo in tutte le tue vie, ed egli addirizzerà i tuoi sentieri.',
      'Non reputarti savio appo te stesso; temi il Signore, e ritratti dal male.',
      'Onora il Signore con la tua sostanza, e con le primizie d ogni tua rendita.',
    ],
  },
  {
    id: 'matteo-5',
    book: 'Matteo',
    chapter: 5,
    testament: 'Nuovo',
    summary: 'Beatitudini e luce del mondo.',
    verses: [
      'Beati i poveri in ispirito, perciocché il regno de cieli è loro.',
      'Beati coloro che fanno cordoglio, perciocché saranno consolati.',
      'Beati i mansueti, perciocché erediteranno la terra.',
      'Voi siete la luce del mondo; la città posta sopra un monte non può esser nascosta.',
      'Così risplenda la vostra luce nel cospetto degli uomini.',
    ],
  },
  {
    id: 'giovanni-1',
    book: 'Giovanni',
    chapter: 1,
    testament: 'Nuovo',
    summary: 'Parola, luce e vita.',
    verses: [
      'Nel principio era la Parola, e la Parola era appo Dio, e la Parola era Dio.',
      'Essa era nel principio appo Dio.',
      'Ogni cosa è stata fatta per mezzo d essa; e senz essa niuna cosa fatta è stata fatta.',
      'In lei era la vita, e la vita era la luce degli uomini.',
      'E la luce riluce nelle tenebre, e le tenebre non l hanno compresa.',
    ],
  },
  {
    id: 'romani-8',
    book: 'Romani',
    chapter: 8,
    testament: 'Nuovo',
    summary: 'Speranza, Spirito e perseveranza.',
    verses: [
      'Ora dunque non vi è alcuna condannazione per coloro che sono in Cristo Gesù.',
      'La legge dello Spirito della vita in Cristo Gesù mi ha francato dalla legge del peccato.',
      'Noi sappiamo che tutte le cose cooperano al bene di coloro che amano Iddio.',
      'Se Iddio è per noi, chi sarà contro a noi?',
      'In tutte queste cose noi siamo più che vincitori, per colui che ci ha amati.',
    ],
  },
];
