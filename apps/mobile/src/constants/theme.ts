/**
 * App colors for light and dark mode. Primary/status colors mirror the web app's
 * tokens (apps/web/src/app/globals.css) so both clients feel like one product.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111827',
    background: '#F3F4F7',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8E9EE',
    textSecondary: '#6B7280',
    border: '#E2E4E9',
    primary: '#4D4FEF',
    onPrimary: '#FFFFFF',
    danger: '#EF4444',
    success: '#16A34A',
    warning: '#D97706',
  },
  dark: {
    text: '#F8FAFC',
    background: '#020817',
    backgroundElement: '#0F172A',
    backgroundSelected: '#1E293B',
    textSecondary: '#94A3B8',
    border: '#1E293B',
    primary: '#3B82F6',
    onPrimary: '#FFFFFF',
    danger: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
