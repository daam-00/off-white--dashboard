export type DailyVerse = {
  reference: string;
  text: string;
};

export const dailyVerses: DailyVerse[] = [
  {
    reference: 'Salmo 23:1',
    text: 'Il SIGNORE è il mio pastore: nulla mi manca.',
  },
  {
    reference: 'Salmo 27:1',
    text: 'Il SIGNORE è la mia luce e la mia salvezza; di chi temerò?',
  },
  {
    reference: 'Salmo 34:8',
    text: "Provate e vedrete quanto il SIGNORE è buono! Beato l'uomo che confida in lui.",
  },
  {
    reference: 'Salmo 46:1',
    text: 'Dio è per noi un rifugio e una forza, un aiuto sempre pronto nelle difficoltà.',
  },
  {
    reference: 'Salmo 91:1',
    text: "Chi abita al riparo dell'Altissimo riposa all'ombra dell'Onnipotente.",
  },
  {
    reference: 'Salmo 119:105',
    text: 'La tua parola è una lampada al mio piede e una luce sul mio sentiero.',
  },
  {
    reference: 'Proverbi 3:5',
    text: 'Confida nel SIGNORE con tutto il cuore e non ti appoggiare sul tuo discernimento.',
  },
  {
    reference: 'Proverbi 16:3',
    text: 'Affida al SIGNORE le tue opere, e i tuoi progetti avranno successo.',
  },
  {
    reference: 'Isaia 40:31',
    text: 'Quelli che sperano nel SIGNORE acquistano nuove forze, si alzano a volo come aquile.',
  },
  {
    reference: 'Isaia 41:10',
    text: 'Non temere, perché io sono con te; non ti smarrire, perché io sono il tuo Dio.',
  },
  {
    reference: 'Isaia 43:2',
    text: 'Quando dovrai attraversare le acque, io sarò con te.',
  },
  {
    reference: 'Geremia 29:11',
    text: 'Pensieri di pace e non di male, per darvi un avvenire e una speranza.',
  },
  {
    reference: 'Matteo 5:14',
    text: 'Voi siete la luce del mondo. Una città posta sopra un monte non può rimanere nascosta.',
  },
  {
    reference: 'Matteo 6:33',
    text: 'Cercate prima il regno e la giustizia di Dio, e tutte queste cose vi saranno date in più.',
  },
  {
    reference: 'Matteo 11:28',
    text: 'Venite a me, voi tutti che siete affaticati e oppressi, e io vi darò riposo.',
  },
  {
    reference: 'Matteo 28:20',
    text: "Io sono con voi tutti i giorni, sino alla fine dell'età presente.",
  },
  {
    reference: 'Giovanni 3:16',
    text: 'Dio ha tanto amato il mondo, che ha dato il suo unigenito Figlio.',
  },
  {
    reference: 'Giovanni 8:12',
    text: 'Io sono la luce del mondo; chi mi segue non camminerà nelle tenebre.',
  },
  {
    reference: 'Giovanni 14:27',
    text: 'Vi lascio pace; vi do la mia pace. Il vostro cuore non sia turbato.',
  },
  {
    reference: 'Giovanni 15:5',
    text: 'Io sono la vite, voi siete i tralci. Colui che dimora in me porta molto frutto.',
  },
  {
    reference: 'Romani 8:28',
    text: 'Tutte le cose cooperano al bene di quelli che amano Dio.',
  },
  {
    reference: 'Romani 12:2',
    text: 'Siate trasformati mediante il rinnovamento della vostra mente.',
  },
  {
    reference: '1 Corinzi 13:4',
    text: "L'amore è paziente, è benevolo; l'amore non invidia.",
  },
  {
    reference: '2 Corinzi 5:17',
    text: 'Se dunque uno è in Cristo, egli è una nuova creatura.',
  },
  {
    reference: 'Galati 5:22',
    text: 'Il frutto dello Spirito invece è amore, gioia, pace, pazienza, benevolenza, bontà.',
  },
  {
    reference: 'Efesini 2:10',
    text: 'Siamo opera sua, creati in Cristo Gesù per fare le opere buone.',
  },
  {
    reference: 'Efesini 6:10',
    text: 'Fortificatevi nel Signore e nella forza della sua potenza.',
  },
  {
    reference: 'Filippesi 4:4',
    text: 'Rallegratevi sempre nel Signore. Ripeto: rallegratevi.',
  },
  {
    reference: 'Filippesi 4:6',
    text: 'Non angustiatevi di nulla, ma in ogni cosa fate conoscere le vostre richieste a Dio.',
  },
  {
    reference: 'Filippesi 4:13',
    text: 'Io posso ogni cosa in colui che mi fortifica.',
  },
  {
    reference: 'Colossesi 3:23',
    text: 'Qualunque cosa facciate, fatela di buon animo, come per il Signore.',
  },
  {
    reference: '1 Tessalonicesi 5:16',
    text: 'Abbiate sempre gioia.',
  },
  {
    reference: '2 Timoteo 1:7',
    text: "Dio infatti ci ha dato uno spirito di forza, d'amore e di autocontrollo.",
  },
  {
    reference: 'Ebrei 11:1',
    text: 'La fede è certezza di cose che si sperano, dimostrazione di realtà che non si vedono.',
  },
  {
    reference: 'Ebrei 12:1',
    text: 'Corriamo con perseveranza la gara che ci è proposta.',
  },
  {
    reference: 'Giacomo 1:5',
    text: 'Se qualcuno di voi manca di saggezza, la chieda a Dio che dona a tutti generosamente.',
  },
  {
    reference: '1 Pietro 5:7',
    text: 'Gettando su di lui ogni vostra preoccupazione, perché egli ha cura di voi.',
  },
  {
    reference: '1 Giovanni 4:18',
    text: "Nell'amore non c'è paura; anzi, l'amore perfetto caccia via la paura.",
  },
  {
    reference: 'Apocalisse 21:4',
    text: 'Egli asciugherà ogni lacrima dai loro occhi e non ci sarà più la morte.',
  },
  {
    reference: 'Numeri 6:24',
    text: 'Il SIGNORE ti benedica e ti protegga!',
  },
];

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60_000;
  return Math.floor(diff / 86_400_000);
}

export function getDailyVerse(date = new Date()) {
  return dailyVerses[getDayOfYear(date) % dailyVerses.length];
}
