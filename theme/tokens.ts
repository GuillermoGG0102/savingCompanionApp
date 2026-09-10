/**
 * Sistema de diseño. Colores tomados del mockup de Claude Design (tema claro,
 * el que arranca por defecto) más un tema oscuro con la misma paleta de acento.
 */

export type ThemeName = 'light' | 'dark';

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentStrong: string;
  onAccent: string;
  positive: string;
  negative: string;
  warning: string;
  cardGradientFrom: string;
  cardGradientTo: string;
}

const light: ColorTokens = {
  background: '#F4F1EA',
  surface: '#FFFDF8',
  surfaceRaised: '#FFFFFF',
  border: 'rgba(17,25,23,0.08)',
  textPrimary: '#111917',
  textSecondary: '#4A524F',
  textMuted: '#8A928E',
  accent: '#0E9E92',
  accentStrong: '#22D3C5',
  onAccent: '#F4F1EA',
  positive: '#0E9E92',
  negative: '#E0603C',
  warning: '#C9A227',
  cardGradientFrom: '#123B37',
  cardGradientTo: '#0B2A26',
};

const dark: ColorTokens = {
  background: '#0B120F',
  surface: '#111917',
  surfaceRaised: '#16211D',
  border: 'rgba(244,241,234,0.08)',
  textPrimary: '#F4F1EA',
  textSecondary: '#B9CBC6',
  textMuted: '#8A928E',
  accent: '#22D3C5',
  accentStrong: '#5FE9DC',
  onAccent: '#06231F',
  positive: '#22D3C5',
  negative: '#F0A08A',
  warning: '#C9A227',
  cardGradientFrom: '#123B37',
  cardGradientTo: '#06231F',
};

export const colors: Record<ThemeName, ColorTokens> = { light, dark };

export const typography = {
  fontDisplay: 'Space Grotesk',
  fontMono: 'IBM Plex Mono',
  size: {
    xs: 10.5,
    sm: 11.5,
    base: 13,
    md: 15,
    lg: 18,
    xl: 26,
    xxl: 40,
    display: 52,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

export const radius = {
  sm: 9,
  md: 14,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;
