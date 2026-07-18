/** Ramp-inspired design tokens + Reality Cup category accents */
export interface CategoryTheme {
  id: string;
  name: string;
  primary: string;
  primarySoft: string;
  primaryMuted: string;
  real: string;
  fake: string;
  heroBg: string;
}

export const ramp = {
  lime: '#E4FF1A',
  limeSoft: '#F0FFB8',
  limeMuted: '#F7FFDE',
  black: '#1A1919',
  white: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray400: '#A1A1AA',
  gray600: '#52525B',
  gray900: '#18181B',
  closing: '#7C3AED',
  closingSoft: '#F3E8FF',
};

export const categoryThemes: Record<string, CategoryTheme> = {
  'cat-nature': {
    id: 'cat-nature',
    name: 'Nature',
    primary: ramp.black,
    primarySoft: ramp.gray600,
    primaryMuted: ramp.limeMuted,
    real: '#16A34A',
    fake: ramp.black,
    heroBg: ramp.white,
  },
  'cat-people': {
    id: 'cat-people',
    name: 'People',
    primary: ramp.black,
    primarySoft: ramp.gray600,
    primaryMuted: ramp.limeMuted,
    real: '#16A34A',
    fake: ramp.black,
    heroBg: ramp.white,
  },
  'cat-animals': {
    id: 'cat-animals',
    name: 'Wildlife',
    primary: ramp.black,
    primarySoft: ramp.gray600,
    primaryMuted: ramp.limeMuted,
    real: '#16A34A',
    fake: ramp.black,
    heroBg: ramp.white,
  },
  'cat-architecture': {
    id: 'cat-architecture',
    name: 'Architecture',
    primary: ramp.black,
    primarySoft: ramp.gray600,
    primaryMuted: ramp.limeMuted,
    real: '#16A34A',
    fake: ramp.black,
    heroBg: ramp.white,
  },
  'cat-food': {
    id: 'cat-food',
    name: 'Food',
    primary: ramp.black,
    primarySoft: ramp.gray600,
    primaryMuted: ramp.limeMuted,
    real: '#16A34A',
    fake: ramp.black,
    heroBg: ramp.white,
  },
};

export const defaultCategoryTheme: CategoryTheme = {
  id: 'default',
  name: 'Default',
  primary: ramp.black,
  primarySoft: ramp.gray600,
  primaryMuted: ramp.limeMuted,
  real: '#16A34A',
  fake: ramp.black,
  heroBg: ramp.white,
};

export function getCategoryTheme(categoryId: string): CategoryTheme {
  return categoryThemes[categoryId] ?? defaultCategoryTheme;
}

export const theme = {
  ramp,
  colors: {
    bg: ramp.gray50,
    surface: ramp.white,
    surfaceAlt: ramp.gray100,
    border: ramp.gray200,
    borderStrong: ramp.gray400,
    text: ramp.black,
    textSecondary: ramp.gray600,
    textMuted: ramp.gray400,
    textInverse: ramp.white,
    accent: ramp.lime,
    accentMuted: ramp.limeMuted,
    accentText: ramp.black,
    success: '#16A34A',
    successMuted: ramp.limeMuted,
    warning: '#D97706',
    warningMuted: '#FEF3C7',
    danger: '#DC2626',
    dangerMuted: '#FEE2E2',
    closing: ramp.closing,
    closingMuted: ramp.closingSoft,
    overlay: 'rgba(26, 25, 25, 0.45)',
    oddsBox: ramp.lime,
    sliderFill: ramp.lime,
    sliderTrack: ramp.gray200,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
  },
  shadow: {
    sm: {
      shadowColor: ramp.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: ramp.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
    },
  },
  font: {
    mono: 'monospace' as const,
  },
};

export const colors = theme.colors;
