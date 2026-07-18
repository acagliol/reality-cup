import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { defaultCategoryTheme, getCategoryTheme, type CategoryTheme } from '../lib/theme';

const CategoryThemeContext = createContext<CategoryTheme>(defaultCategoryTheme);

export function CategoryThemeProvider({
  categoryId,
  children,
}: {
  categoryId?: string | null;
  children: ReactNode;
}) {
  const value = useMemo(
    () => (categoryId ? getCategoryTheme(categoryId) : defaultCategoryTheme),
    [categoryId],
  );
  return (
    <CategoryThemeContext.Provider value={value}>{children}</CategoryThemeContext.Provider>
  );
}

export function useCategoryTheme(): CategoryTheme {
  return useContext(CategoryThemeContext);
}
