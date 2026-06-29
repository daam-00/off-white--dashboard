export type AvatarRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ProfileAvatar {
  id: string;
  name: string;
  series: string;
  imageUrl: string;
  cost: number;
  rarity: AvatarRarity;
  bgColor: string;
}

// Real character images from Fandom/Wikia CDN + official renders
export const PROFILE_AVATARS: ProfileAvatar[] = [

  /* ── BETTER ME (default, free) ───────────────────────────────── */
  {
    id: 'default-bot',
    name: 'Bot Hero',
    series: 'Better Me',
    imageUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=betterme2049&backgroundColor=ff5c00&radius=50',
    cost: 0,
    rarity: 'common',
    bgColor: '#FF5C00',
  },
  {
    id: 'pixel-rookie',
    name: 'Pixel Rookie',
    series: 'Better Me',
    imageUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=rookie99&backgroundColor=1a1a2e&radius=50',
    cost: 150,
    rarity: 'common',
    bgColor: '#1a1a2e',
  },

  /* ── INVINCIBLE ───────────────────────────────────────────────── */
  {
    id: 'invincible-mark',
    name: 'Mark Grayson',
    series: 'Invincible',
    imageUrl: '/themes/invincible/mark-grayson-s3.png',
    cost: 1000,
    rarity: 'epic',
    bgColor: '#1e3a8a',
  },
  {
    id: 'invincible-omni',
    name: 'Omni-Man',
    series: 'Invincible',
    imageUrl: '/themes/invincible/omni-man-s1.png',
    cost: 1500,
    rarity: 'legendary',
    bgColor: '#8b0000',
  },
  {
    id: 'invincible-eve',
    name: 'Atom Eve',
    series: 'Invincible',
    imageUrl: '/themes/invincible/atom-eve-s1.png',
    cost: 1200,
    rarity: 'epic',
    bgColor: '#db2777',
  },
  {
    id: 'invincible-battlebeast',
    name: 'Battle Beast',
    series: 'Invincible',
    imageUrl: '/themes/invincible/battle-beast-s1.png',
    cost: 2000,
    rarity: 'legendary',
    bgColor: '#0f172a',
  },

  /* ── MARVEL ───────────────────────────────────────────────────── */
  {
    id: 'spidey-peter',
    name: 'Spider-Man',
    series: 'Marvel',
    // PS4 Spiderman wiki render — Peter Parker
    imageUrl: 'https://static.wikia.nocookie.net/spidermanps4/images/c/ca/Peter_Parker_from_MM_render.png/revision/latest/scale-to-width-down/200?cb=20201117041928',
    cost: 600,
    rarity: 'rare',
    bgColor: '#cc0000',
  },
  {
    id: 'spidey-miles',
    name: 'Miles Morales',
    series: 'Marvel',
    // PS4 Miles Morales 2020 Suit render
    imageUrl: 'https://static.wikia.nocookie.net/spidermanps4/images/8/80/Miles_Morales_2020_Suit_from_MM_render.png/revision/latest/scale-to-width-down/200?cb=20201201192456',
    cost: 650,
    rarity: 'rare',
    bgColor: '#1a0033',
  },
  {
    id: 'iron-hero',
    name: 'Iron Man',
    series: 'Marvel',
    imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ironman3000&backgroundColor=b71c1c&radius=50',
    cost: 700,
    rarity: 'rare',
    bgColor: '#b71c1c',
  },
  {
    id: 'black-panther',
    name: 'Black Panther',
    series: 'Marvel',
    imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=blackpanther77&backgroundColor=0d0d0d&radius=50',
    cost: 700,
    rarity: 'rare',
    bgColor: '#0d0d0d',
  },

  /* ── TEEN TITANS ─────────────────────────────────────────────── */
  {
    id: 'titans-robin',
    name: 'Robin',
    series: 'Teen Titans',
    // BTAS Robin official wiki PNG
    imageUrl: 'https://static.wikia.nocookie.net/dcanimated/images/6/61/Robin_%28BTAS%29.png/revision/latest/scale-to-width-down/200?cb=20191120193609',
    cost: 500,
    rarity: 'rare',
    bgColor: '#1a0a00',
  },
  {
    id: 'titans-raven',
    name: 'Raven',
    series: 'Teen Titans',
    // Teen Titans Go wiki profile card PNG
    imageUrl: 'https://static.wikia.nocookie.net/teen-titans-go/images/7/7a/Raven_profile_card.png/revision/latest/scale-to-width-down/200?cb=20191124061255',
    cost: 500,
    rarity: 'rare',
    bgColor: '#2d0057',
  },
  {
    id: 'titans-starfire',
    name: 'Starfire',
    series: 'Teen Titans',
    // Teen Titans Go wiki profile card PNG
    imageUrl: 'https://static.wikia.nocookie.net/teen-titans-go/images/4/46/Starfire_profile_card.png/revision/latest/scale-to-width-down/200?cb=20191124061145',
    cost: 500,
    rarity: 'rare',
    bgColor: '#7d1a6b',
  },
  {
    id: 'titans-beastboy',
    name: 'Beast Boy',
    series: 'Teen Titans',
    imageUrl: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=beastboy22&backgroundColor=2d5a27&radius=50',
    cost: 450,
    rarity: 'rare',
    bgColor: '#2d5a27',
  },

  /* ── DISNEY ──────────────────────────────────────────────────── */
  {
    id: 'disney-sorcerer',
    name: 'Apprendista',
    series: 'Disney',
    imageUrl: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=sorcererapprentice&backgroundColor=003087&radius=50',
    cost: 400,
    rarity: 'common',
    bgColor: '#003087',
  },
  {
    id: 'disney-simba',
    name: 'Re Simba',
    series: 'Disney',
    imageUrl: 'https://api.dicebear.com/7.x/croodles/svg?seed=simbalionking&backgroundColor=c8860a&radius=50',
    cost: 450,
    rarity: 'common',
    bgColor: '#c8860a',
  },

  /* ── ORIGINALI ───────────────────────────────────────────────── */
  {
    id: 'neon-ghost',
    name: 'Neon Ghost',
    series: 'Originali',
    imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=neonghost2099&backgroundColor=0d0d0d&radius=50',
    cost: 300,
    rarity: 'common',
    bgColor: '#0d0d0d',
  },
  {
    id: 'cyber-samurai',
    name: 'Cyber Samurai',
    series: 'Originali',
    imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cybersamurai88&backgroundColor=1a1a2e&radius=50',
    cost: 400,
    rarity: 'common',
    bgColor: '#1a1a2e',
  },
  {
    id: 'gold-titan',
    name: 'Gold Titan',
    series: 'Originali',
    imageUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=goldtitanlegend&backgroundColor=b8860b&radius=50',
    cost: 2000,
    rarity: 'legendary',
    bgColor: '#b8860b',
  },
];

export const RARITY_LABEL: Record<AvatarRarity, string> = {
  common: 'Comune',
  rare: 'Raro',
  epic: 'Epico',
  legendary: 'Leggendario',
};

export const RARITY_COLOR: Record<AvatarRarity, string> = {
  common: '#6b7280',
  rare: '#2563eb',
  epic: '#9333ea',
  legendary: '#d97706',
};
