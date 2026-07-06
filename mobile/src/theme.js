// Charte AN Connect — jetons adaptés à React Native.
export const C = {
  blue900: '#001A4D', blue800: '#002B7F', blue600: '#1A4A9E', blue100: '#E8EFF8', blue50: '#F0F5FC',
  gold700: '#8B6914', gold600: '#B8860B', gold500: '#D4A843', gold200: '#F5E6B8', gold100: '#FBF3DC', gold50: '#FFFDF5',
  red700: '#B71C1C', red600: '#C62828', red100: '#FDECEA',
  green700: '#1B5E20', green600: '#2E7D32', green100: '#E8F5E9',
  ink: '#1A1A2E', text: '#4A4A5A', muted: '#9E9EB0', border: '#E8E8ED',
  bg: '#F7F7FA', surface: '#FFFFFF', white: '#FFFFFF',
};

// Familles injectées après chargement des polices (voir App.js). Repli système.
export const F = {
  serif: 'Cormorant', serifBold: 'CormorantBold',
  sans: 'DMSans', sansMed: 'DMSansMedium', sansBold: 'DMSansBold',
};

export const S = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 };
export const R = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 };

export const OMBRE = {
  shadowColor: '#002B7F', shadowOpacity: 0.08, shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 }, elevation: 2,
};

// Couleurs de badge par statut législatif / séance.
export const STATUT_COULEUR = {
  depose: { bg: C.blue100, fg: C.blue800 },
  en_commission: { bg: C.blue100, fg: C.blue800 },
  en_debat: { bg: C.blue100, fg: C.blue800 },
  au_vote: { bg: C.gold200, fg: C.gold700 },
  adopte: { bg: C.green100, fg: C.green700 },
  promulgue: { bg: C.green100, fg: C.green700 },
  rejete: { bg: C.red100, fg: C.red700 },
  retire: { bg: '#F2F2F5', fg: C.text },
  prevue: { bg: C.blue100, fg: C.blue800 },
  en_cours: { bg: C.green100, fg: C.green700 },
  terminee: { bg: '#F2F2F5', fg: C.text },
  annulee: { bg: C.red100, fg: C.red700 },
};
