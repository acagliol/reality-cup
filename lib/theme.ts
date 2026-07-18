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

export const categoryThemes: Record<string, CategoryTheme> = {
  'cat-nature': {
    id: 'cat-nature',
    name: 'Nature',
    primary: '#0D9488',
    primarySoft: '#14B8A6',
    primaryMuted: '#CCFBF1',
    real: '#059669',
    fake: '#EA580C',
    heroBg: '#F0FDFA',
  },
  'cat-people': {
    id: 'cat-people',
    name: 'People',
    primary: '#7C3AED',
    primarySoft: '#8B5CF6',
    primaryMuted: '#EDE9FE',
    real: '#0D9488',
    fake: '#DB2777',
    heroBg: '#F5F3FF',
  },
  'cat-animals': {
    id: 'cat-animals',
    name: 'Wildlife',
    primary: '#D97706',
    primarySoft: '#F59E0B',
    primaryMuted: '#FEF3C7',
    real: '#16A34A',
    fake: '#DC2626',
    heroBg: '#FFFBEB',
  },
  'cat-architecture': {
    id: 'cat-architecture',
    name: 'Architecture',
    primary: '#475569',
    primarySoft: '#64748B',
    primaryMuted: '#F1F5F9',
    real: '#0284C7',
    fake: '#9333EA',
    heroBg: '#F8FAFC',
  },
  'cat-food': {
    id: 'cat-food',
    name: 'Food',
    primary: '#EA580C',
    primarySoft: '#F97316',
    primaryMuted: '#FFEDD5',
    real: '#65A30D',
    fake: '#E11D48',
    heroBg: '#FFF7ED',
  },
};

export const defaultCategoryTheme: CategoryTheme = {
  id: 'default',
  name: 'Default',
  primary: '#1D4ED8',
  primarySoft: '#3B82F6',
  primaryMuted: '#DBEAFE',
  real: '#059669',
  fake: '#DC2626',
  heroBg: '#F8FAFC',
};

export function getCategoryTheme(categoryId: string): CategoryTheme {
  return categoryThemes[categoryId] ?? defaultCategoryTheme;
}

export const theme = {
  colors: {
    bg: '#FAFBFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    text: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    textInverse: '#FFFFFF',
    success: '#059669',
    successMuted: '#D1FAE5',
    warning: '#D97706',
    warningMuted: '#FEF3C7',
    danger: '#DC2626',
    dangerMuted: '#FEE2E2',
    overlay: 'rgba(15, 23, 42, 0.5)',
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
    full: 999,
  },
  shadow: {
    sm: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  font: {
    mono: 'monospace' as const,
  },
};

export const colors = theme.colors;
