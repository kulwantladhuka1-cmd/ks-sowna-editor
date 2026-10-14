export type StickerItem = {
  id: string;
  name: string;
  namePa: string;
  category: 'crown' | 'royal' | 'punjabi' | 'badge' | 'decor';
  viewBox: string;
  path: string;
  defaultColor: string;
};

export const STICKERS: StickerItem[] = [
  // CROWNS
  {
    id: 'crown-royal',
    name: 'Imperial Crown',
    namePa: 'ਸ਼ਾਹੀ ਤਾਜ',
    category: 'crown',
    viewBox: '0 0 24 24',
    path: 'M2 19h20v2H2v-2zm1-2l2.5-9 4.5 4.5L12 4l2 8.5 4.5-4.5L21 17H3zm9-11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-7 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm14 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
    defaultColor: '#D4AF37',
  },
  {
    id: 'crown-classic',
    name: 'Classic King Crown',
    namePa: 'ਰਾਜਾ ਤਾਜ',
    category: 'crown',
    viewBox: '0 0 24 24',
    path: 'M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z',
    defaultColor: '#F3E5AB',
  },
  {
    id: 'crown-tiara',
    name: 'Queen Coronet',
    namePa: 'ਮਹਾਰਾਣੀ ਤਾਜ',
    category: 'crown',
    viewBox: '0 0 24 24',
    path: 'M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 14.1l-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 2zm-8 17h16v2H4v-2z',
    defaultColor: '#D4AF37',
  },

  // PUNJABI / SARDARI SYMBOLS
  {
    id: 'punjabi-khanda',
    name: 'Khanda Sahib',
    namePa: 'ਖੰਡਾ ਸਾਹਿਬ',
    category: 'punjabi',
    viewBox: '0 0 100 100',
    path: 'M48 5 L52 5 L52 35 A20 20 0 0 1 52 65 L52 95 L48 95 L48 65 A20 20 0 0 1 48 35 Z M50 35 A15 15 0 1 0 50 65 A15 15 0 1 0 50 35 Z M20 25 C10 45 10 65 25 80 C18 68 18 45 32 35 C28 30 24 27 20 25 Z M80 25 C90 45 90 65 75 80 C82 68 82 45 68 35 C72 30 76 27 80 25 Z',
    defaultColor: '#FF9900',
  },
  {
    id: 'punjabi-muchh',
    name: 'Royal Moustache / Muchh',
    namePa: 'ਸ਼ਾਨਦਾਰ ਮੁੱਛ',
    category: 'punjabi',
    viewBox: '0 0 100 50',
    path: 'M50 25 C40 10 20 5 5 15 C-2 20 2 28 10 25 C25 20 40 28 50 38 C60 28 75 20 90 25 C98 28 102 20 95 15 C80 5 60 10 50 25 Z',
    defaultColor: '#D4AF37',
  },
  {
    id: 'punjabi-pagri',
    name: 'Royal Turban Silhouette',
    namePa: 'ਰਾਇਲ ਦਸਤਾਰ / ਪੱਗ',
    category: 'punjabi',
    viewBox: '0 0 100 80',
    path: 'M50 5 C35 5 18 15 12 30 C8 40 10 55 18 65 C25 72 35 75 50 75 C65 75 75 72 82 65 C90 55 92 40 88 30 C82 15 65 5 50 5 Z M30 35 C40 25 60 25 70 35 C60 45 40 45 30 35 Z M25 50 C40 42 60 42 75 50 C65 60 35 60 25 50 Z',
    defaultColor: '#D4AF37',
  },
  {
    id: 'royal-lion',
    name: 'Sher / Royal Lion Crest',
    namePa: 'ਬੱਬਰ ਸ਼ੇਰ ਮਾਰਕਾ',
    category: 'royal',
    viewBox: '0 0 24 24',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3 0 .83-.34 1.58-.88 2.12l-1.41 1.41c-.45.45-.71 1.06-.71 1.7V14h-2v-.77c0-.64-.26-1.25-.71-1.7L7.88 10.12C7.34 9.58 7 8.83 7 8c0-1.66 1.34-3 3-3zm-2 13v-2h4v2h-4z',
    defaultColor: '#D4AF37',
  },

  // BADGES & LAURELS
  {
    id: 'laurel-wreath',
    name: 'Golden Laurel Wreath',
    namePa: 'ਗੋਲਡਨ ਲਾਰਲ ਵਿਜੇਤਾ',
    category: 'badge',
    viewBox: '0 0 100 100',
    path: 'M50 85 C30 85 15 70 15 45 C15 35 20 20 30 10 C28 20 32 35 40 42 C30 45 25 55 28 65 C32 75 42 80 50 80 C58 80 68 75 72 65 C75 55 70 45 60 42 C68 35 72 20 70 10 C80 20 85 35 85 45 C85 70 70 85 50 85 Z',
    defaultColor: '#D4AF37',
  },
  {
    id: 'vip-badge',
    name: 'Royal VIP Seal',
    namePa: 'ਵੀ.ਆਈ.ਪੀ. ਸੀਲ',
    category: 'badge',
    viewBox: '0 0 24 24',
    path: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
    defaultColor: '#D4AF37',
  },
  {
    id: 'verified-tick',
    name: 'Verified Star Badge',
    namePa: 'ਵੈਰੀਫਾਈਡ ਬੈਜ',
    category: 'badge',
    viewBox: '0 0 24 24',
    path: 'M12 2l2.4 2.1 3.2-.4 1.4 2.9 3 .9-.3 3.2 2.1 2.4-2.1 2.4.3 3.2-3 .9-1.4 2.9-3.2-.4L12 22l-2.4-2.1-3.2.4-1.4-2.9-3-.9.3-3.2-2.1-2.4 2.1-2.4-.3-3.2 3-.9 1.4-2.9 3.2.4L12 2zm-1.5 13.5l6-6-1.4-1.4-4.6 4.6-2.1-2.1-1.4 1.4 3.5 3.5z',
    defaultColor: '#00E5FF',
  },
  {
    id: 'star-burst',
    name: 'Golden Sparkle Star',
    namePa: 'ਚਮਕਦਾ ਤਾਰਾ',
    category: 'decor',
    viewBox: '0 0 24 24',
    path: 'M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z',
    defaultColor: '#FFF6CA',
  },
  {
    id: 'wings-emblem',
    name: 'Royal Wings',
    namePa: 'ਸ਼ਾਹੀ ਖੰਭ',
    category: 'royal',
    viewBox: '0 0 100 50',
    path: 'M50 25 C40 15 25 5 0 10 C5 22 18 35 35 38 C25 40 15 36 10 32 C20 45 35 48 48 40 L50 42 L52 40 C65 48 80 45 90 32 C85 36 75 40 65 38 C82 35 95 22 100 10 C75 5 60 15 50 25 Z',
    defaultColor: '#D4AF37',
  },
  {
    id: 'ribbon-banner',
    name: 'Golden Ribbon',
    namePa: 'ਸੋਨਹਿਰੀ ਰਿਬਨ',
    category: 'badge',
    viewBox: '0 0 100 40',
    path: 'M15 10 L85 10 L95 20 L85 30 L15 30 L5 20 Z M5 20 L0 35 L15 30 Z M95 20 L100 35 L85 30 Z',
    defaultColor: '#D4AF37',
  },
  {
    id: 'luxury-diamond',
    name: 'Luxury Gem',
    namePa: 'ਕੀਮਤੀ ਹੀਰਾ',
    category: 'decor',
    viewBox: '0 0 24 24',
    path: 'M6 2l-4 6 10 14 10-14-4-6H6zm1.6 2h8.8l2.7 4H4.9l2.7-4zM12 18.2L5.8 10h12.4L12 18.2z',
    defaultColor: '#00E5FF',
  },
];
