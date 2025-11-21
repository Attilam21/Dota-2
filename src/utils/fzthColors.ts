/**
 * FZTH Brand Colors Palette
 *
 * Palette colori ufficiale FZTH per dashboard Dota 2
 * Utilizzata per coerenza visuale e branding light
 */

export const FZTH_COLORS = {
  // Primary - Teal/Verde Acqua
  teal: {
    primary: '#14b8a6', // Verde acqua (success, positive, team)
    dark: '#0d9488', // Blu petrolio (info, background)
  },

  // Accents
  orange: '#f97316', // Arancione (warning, neutral)
  red: '#ef4444', // Rosso (error, negative, enemy)

  // Neutral - Tailwind neutral palette
  neutral: {
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
} as const

/**
 * Helper per ottenere colori FZTH con opacità
 */
export function fzthColorWithOpacity(color: string, opacity: number): string {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  return color
}

/**
 * Mapping uso colori FZTH
 */
export const FZTH_COLOR_USAGE = {
  // Success/Positive/Team
  success: FZTH_COLORS.teal.primary,
  positive: FZTH_COLORS.teal.primary,
  team: FZTH_COLORS.teal.primary,

  // Info/Background
  info: FZTH_COLORS.teal.dark,
  background: FZTH_COLORS.teal.dark,

  // Warning/Neutral
  warning: FZTH_COLORS.orange,
  neutral: FZTH_COLORS.orange,

  // Error/Negative/Enemy
  error: FZTH_COLORS.red,
  negative: FZTH_COLORS.red,
  enemy: FZTH_COLORS.red,
} as const
