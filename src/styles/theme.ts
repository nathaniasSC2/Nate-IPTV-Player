/**
 * Design Tokens and Theme Constants
 * ==================================
 * Centralized design system tokens for consistent styling across the application.
 * Import these values instead of hardcoding Tailwind classes.
 */

// ============================================================================
// Color Palette
// ============================================================================

/**
 * Primary color palette - Sky blue theme
 * Used for interactive elements, active states, and emphasis
 */
export const colors = {
  // Primary colors (sky blue)
  primary: {
    50: 'primary-50',
    100: 'primary-100',
    200: 'primary-200',
    300: 'primary-300',
    400: 'primary-400',   // Light interactive elements
    500: 'primary-500',   // Default primary
    600: 'primary-600',   // Hover state
    700: 'primary-700',   // Active/pressed state
    800: 'primary-800',
    900: 'primary-900',   // Background accent
    950: 'primary-950',
  },

  // Dark theme surface colors
  dark: {
    50: 'dark-50',
    100: 'dark-100',
    200: 'dark-200',
    300: 'dark-300',      // Tertiary text
    400: 'dark-400',      // Secondary text
    500: 'dark-500',      // Disabled text
    600: 'dark-600',      // Lighter borders
    700: 'dark-700',      // Default borders
    750: 'dark-750',      // Intermediate surface (custom)
    800: 'dark-800',      // Card backgrounds
    900: 'dark-900',      // Page backgrounds
    950: 'dark-950',      // Deepest background
  },

  // Gray scale for text
  gray: {
    200: 'gray-200',      // Primary text (headings)
    300: 'gray-300',      // Secondary text
    400: 'gray-400',      // Tertiary text / labels
    500: 'gray-500',      // Muted text
    600: 'gray-600',      // Disabled / very muted
  },

  // Semantic colors
  success: 'green-500',
  warning: 'yellow-500',
  error: 'red-500',
  info: 'blue-500',
} as const;

// ============================================================================
// Text Color Hierarchy
// ============================================================================

/**
 * Text colors for consistent typography hierarchy
 * - primary: Main headings and important text (white)
 * - secondary: Body text and descriptions (gray-300)
 * - tertiary: Labels and less important info (gray-400)
 * - muted: Placeholder text and disabled states (gray-500)
 * - disabled: Inactive elements (dark-500)
 */
export const textColors = {
  primary: 'text-white',
  secondary: 'text-gray-300',
  tertiary: 'text-gray-400',
  muted: 'text-gray-500',
  disabled: 'text-dark-500',
  link: 'text-primary-400',
  linkHover: 'text-primary-300',
} as const;

// ============================================================================
// Spacing Scale
// ============================================================================

/**
 * Consistent spacing values based on 4px base unit
 * Use these for padding, margins, and gaps
 */
export const spacing = {
  // Atomic spacing
  px: '1px',
  0: '0',
  0.5: '0.5',   // 2px
  1: '1',       // 4px
  1.5: '1.5',   // 6px
  2: '2',       // 8px
  2.5: '2.5',   // 10px
  3: '3',       // 12px
  4: '4',       // 16px
  5: '5',       // 20px
  6: '6',       // 24px
  8: '8',       // 32px
  10: '10',     // 40px
  12: '12',     // 48px

  // Semantic spacing
  xs: '1',      // 4px - Tight spacing between inline elements
  sm: '2',      // 8px - Default gap in compact layouts
  md: '3',      // 12px - Standard component padding
  lg: '4',      // 16px - Card padding, section gaps
  xl: '6',      // 24px - Large section padding
  '2xl': '8',   // 32px - Major section separation
} as const;

/**
 * Component-specific spacing patterns
 */
export const componentSpacing = {
  // Card internal padding
  cardPadding: 'p-3',
  cardPaddingX: 'px-3',
  cardPaddingY: 'py-3',

  // List item padding
  listItemPadding: 'p-2.5',
  listItemPaddingX: 'px-3',
  listItemPaddingY: 'py-2.5',

  // Navigation item padding
  navItemPadding: 'px-3 py-2.5',

  // Section padding
  sectionPadding: 'p-6',
  sectionPaddingX: 'px-6',
  sectionPaddingY: 'py-4',

  // Gap sizes
  gapXs: 'gap-1',
  gapSm: 'gap-1.5',
  gapMd: 'gap-2',
  gapLg: 'gap-3',
  gapXl: 'gap-4',
} as const;

// ============================================================================
// Typography Scale
// ============================================================================

/**
 * Font size scale with corresponding line heights
 */
export const typography = {
  // Size classes
  xs: 'text-xs',      // 12px
  sm: 'text-sm',      // 14px
  base: 'text-base',  // 16px
  lg: 'text-lg',      // 18px
  xl: 'text-xl',      // 20px
  '2xl': 'text-2xl',  // 24px
  '3xl': 'text-3xl',  // 30px

  // Heading styles
  h1: 'text-2xl font-bold',
  h2: 'text-xl font-semibold',
  h3: 'text-lg font-semibold',
  h4: 'text-base font-medium',

  // Body styles
  body: 'text-sm',
  bodyLarge: 'text-base',
  caption: 'text-xs',

  // Font weights
  weightNormal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',

  // Line heights
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',

  // Text truncation
  truncate: 'truncate',
  lineClamp2: 'line-clamp-2',
  lineClamp3: 'line-clamp-3',
} as const;

// ============================================================================
// Animation & Transitions
// ============================================================================

/**
 * Transition durations for consistent animation timing
 */
export const durations = {
  instant: '0ms',
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '1000ms',
} as const;

/**
 * Transition presets for common interactions
 */
export const transitions = {
  // Base transitions
  none: 'transition-none',
  all: 'transition-all duration-200',
  allFast: 'transition-all duration-100',
  allSlow: 'transition-all duration-300',

  // Property-specific transitions
  colors: 'transition-colors duration-200',
  opacity: 'transition-opacity duration-200',
  transform: 'transition-transform duration-200',
  shadow: 'transition-shadow duration-200',

  // Interactive element transitions
  button: 'transition-all duration-200 ease-out',
  card: 'transition-all duration-200',
  hover: 'transition-all duration-200',
  modal: 'transition-all duration-300 ease-out',

  // Progress animations
  progress: 'transition-all duration-1000',
} as const;

/**
 * Animation classes for enter/exit animations
 */
export const animations = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  zoomIn: 'animate-zoom-in',
  zoomOut: 'animate-zoom-out',
  slideInRight: 'animate-slide-in-right',
  slideOutRight: 'animate-slide-out-right',
  slideInLeft: 'animate-slide-in-left',
  slideOutLeft: 'animate-slide-out-left',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  pulseSlow: 'animate-pulse-slow',
} as const;

// ============================================================================
// Shadow Definitions
// ============================================================================

/**
 * Box shadow presets for elevation and depth
 */
export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  default: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',

  // Custom dark theme shadows
  card: 'shadow-lg shadow-dark-900/50',
  cardHover: 'shadow-xl shadow-dark-900/60',
  dropdown: 'shadow-xl shadow-dark-950/50',
  modal: 'shadow-2xl shadow-dark-950/70',

  // Inner shadows
  inner: 'shadow-inner',
} as const;

// ============================================================================
// Border Radius
// ============================================================================

/**
 * Border radius scale for consistent roundness
 */
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  default: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

// ============================================================================
// Border Styles
// ============================================================================

/**
 * Border color and style presets
 */
export const borders = {
  // Default border
  default: 'border border-dark-700',
  light: 'border border-dark-600',
  transparent: 'border border-transparent',

  // Active/focus states
  primary: 'border border-primary-500',
  primaryLight: 'border border-primary-500/50',

  // Hover states
  hoverLight: 'hover:border-dark-600',
  hoverPrimary: 'hover:border-primary-500',

  // Dividers
  divider: 'border-t border-dark-700',
  dividerLight: 'border-t border-dark-800',
} as const;

// ============================================================================
// Icon Sizes
// ============================================================================

/**
 * Consistent icon sizing based on use case
 */
export const iconSizes = {
  xs: 'w-3 h-3',      // 12px - Inline with small text
  sm: 'w-4 h-4',      // 16px - Default inline icons
  md: 'w-5 h-5',      // 20px - Navigation, buttons
  lg: 'w-6 h-6',      // 24px - Headers, emphasis
  xl: 'w-8 h-8',      // 32px - Feature icons
  '2xl': 'w-10 h-10', // 40px - Large feature icons
  '3xl': 'w-12 h-12', // 48px - Hero icons
} as const;

// ============================================================================
// Component Presets
// ============================================================================

/**
 * Card style presets for consistent card appearances
 */
export const cardStyles = {
  // Base card
  base: 'bg-dark-800 rounded-lg border border-dark-700',

  // Interactive card (clickable)
  interactive: [
    'bg-dark-800 rounded-lg border border-dark-700',
    'cursor-pointer transition-all duration-200',
    'hover:border-dark-600 hover:shadow-lg hover:shadow-dark-900/50',
  ].join(' '),

  // Selected card
  selected: 'ring-2 ring-primary-500 border-primary-500',

  // Elevated card
  elevated: 'bg-dark-800 rounded-lg border border-dark-700 shadow-lg shadow-dark-900/50',
} as const;

/**
 * Button style presets
 */
export const buttonStyles = {
  // Base button
  base: [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
  ].join(' '),

  // Primary button
  primary: 'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700',

  // Secondary button
  secondary: 'bg-dark-700 text-white hover:bg-dark-600 active:bg-dark-800',

  // Ghost button
  ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-dark-800',

  // Icon button sizes
  iconSm: 'w-8 h-8',
  iconMd: 'w-10 h-10',
  iconLg: 'w-12 h-12',
} as const;

/**
 * Navigation item presets
 */
export const navStyles = {
  // Default nav item
  item: [
    'flex items-center gap-3',
    'px-3 py-2.5 rounded-lg',
    'text-dark-300',
    'transition-all duration-200',
    'hover:bg-dark-800 hover:text-white',
  ].join(' '),

  // Active nav item
  itemActive: 'bg-primary-500/10 text-primary-400 font-medium',

  // Disabled nav item
  itemDisabled: 'text-dark-500 cursor-not-allowed',

  // Collapsed nav item
  itemCollapsed: 'justify-center px-2',
} as const;

/**
 * Focus ring styles for accessibility
 */
export const focusStyles = {
  // Default focus ring
  ring: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',

  // With offset
  ringOffset: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 focus-visible:ring-offset-dark-900',
} as const;

// ============================================================================
// Overlay & Backdrop Styles
// ============================================================================

/**
 * Overlay and backdrop presets
 */
export const overlays = {
  // Modal backdrop
  backdrop: 'bg-black/60 backdrop-blur-sm',

  // Light overlay
  light: 'bg-dark-900/40',

  // Medium overlay
  medium: 'bg-dark-900/60',

  // Dark overlay
  dark: 'bg-dark-900/80',

  // Gradient overlay (for images)
  gradient: 'bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent',
} as const;

// ============================================================================
// Z-Index Scale
// ============================================================================

/**
 * Z-index scale for consistent layering
 */
export const zIndex = {
  base: 'z-0',
  above: 'z-10',
  dropdown: 'z-20',
  sticky: 'z-30',
  overlay: 'z-40',
  modal: 'z-50',
  toast: 'z-60',
  tooltip: 'z-70',
} as const;

// ============================================================================
// Composite Style Functions
// ============================================================================

/**
 * Get consistent hover state classes for interactive elements
 */
export function getHoverClasses(variant: 'card' | 'button' | 'nav' = 'card'): string {
  switch (variant) {
    case 'card':
      return 'hover:border-dark-600 hover:shadow-lg hover:shadow-dark-900/50';
    case 'button':
      return 'hover:bg-dark-700';
    case 'nav':
      return 'hover:bg-dark-800 hover:text-white';
    default:
      return '';
  }
}

/**
 * Get status-based colors for program cards, badges, etc.
 */
export function getStatusColors(status: 'past' | 'current' | 'future' | 'live'): string {
  switch (status) {
    case 'past':
      return 'bg-dark-800/60 border-dark-700 text-gray-500';
    case 'current':
    case 'live':
      return 'bg-primary-900/50 border-primary-600 text-white';
    case 'future':
      return 'bg-dark-700 border-dark-600 text-gray-200';
    default:
      return '';
  }
}

// ============================================================================
// Export All
// ============================================================================

export const theme = {
  colors,
  textColors,
  spacing,
  componentSpacing,
  typography,
  durations,
  transitions,
  animations,
  shadows,
  borderRadius,
  borders,
  iconSizes,
  cardStyles,
  buttonStyles,
  navStyles,
  focusStyles,
  overlays,
  zIndex,
  getHoverClasses,
  getStatusColors,
} as const;

export default theme;
