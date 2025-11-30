/**
 * Common CSS class combinations used across the application
 * Centralized to ensure consistency and reduce duplication
 */

/**
 * Card component styles - dark theme with backdrop blur
 */
export const cardStyles = {
  base: 'bg-slate-800/50 border-slate-700/50 backdrop-blur-sm',
  hover: 'hover:bg-slate-700/50 transition-colors',
  interactive: 'bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-700/50 transition-colors',
} as const

/**
 * Input field styles
 */
export const inputStyles = {
  base: 'bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400',
  focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  error: 'border-red-500',
  disabled: 'opacity-50 cursor-not-allowed',
} as const

/**
 * Button styles by variant
 */
export const buttonStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
  outline: 'border border-slate-600 hover:bg-slate-700/50 text-slate-300',
  ghost: 'hover:bg-slate-700/50 text-slate-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
} as const

/**
 * Text color styles
 */
export const textStyles = {
  primary: 'text-white',
  secondary: 'text-slate-300',
  muted: 'text-slate-400',
  disabled: 'text-slate-500',
  error: 'text-red-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
} as const

/**
 * Container styles
 */
export const containerStyles = {
  page: 'max-w-4xl mx-auto space-y-6',
  section: 'space-y-4',
  centered: 'flex items-center justify-center',
} as const

/**
 * Utility to combine card styles with custom classes
 */
export function getCardClasses(variant: keyof typeof cardStyles = 'base', customClasses?: string) {
  return `${cardStyles[variant]}${customClasses ? ` ${customClasses}` : ''}`
}

/**
 * Utility to combine input styles
 */
export function getInputClasses(options?: {
  hasError?: boolean
  disabled?: boolean
  customClasses?: string
}) {
  const classes: string[] = [inputStyles.base, inputStyles.focus]

  if (options?.hasError) classes.push(inputStyles.error)
  if (options?.disabled) classes.push(inputStyles.disabled)
  if (options?.customClasses) classes.push(options.customClasses)

  return classes.join(' ')
}
