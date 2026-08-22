/**
 * Theme registry for the palette switcher.
 *
 * Each id must match a `[data-theme='<id>']` block in app/themes.css. The
 * switcher (components/navigation/ThemeSwitcher) cycles through this list and
 * sets `data-theme` on <html>; every colour on the page follows from there.
 * `dark` is the default and maps to :root, so it needs no attribute.
 */
export interface ThemeDef {
  id: string;
  label: string;
}

export const THEMES: ThemeDef[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

export const DEFAULT_THEME = 'dark';
export const THEME_STORAGE_KEY = 'rasid-theme';
