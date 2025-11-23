/**
 * Tailwind CSS Class Merge Utility
 * Combines clsx and tailwind-merge for optimal class handling
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes intelligently
 *
 * Combines multiple class values and handles Tailwind CSS class conflicts
 * by keeping the last conflicting class.
 *
 * @example
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') // => 'text-blue-500' if condition is true
 * cn(['flex', 'items-center'], { 'justify-between': true })
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Conditionally apply classes based on a condition
 *
 * @example
 * cond(isActive, 'bg-blue-500', 'bg-gray-500')
 *
 * @param condition - Boolean condition
 * @param trueClasses - Classes to apply if condition is true
 * @param falseClasses - Classes to apply if condition is false (optional)
 * @returns Class string
 */
export function cond(
  condition: boolean,
  trueClasses: string,
  falseClasses: string = ''
): string {
  return condition ? trueClasses : falseClasses;
}

/**
 * Create a variant-based class generator
 *
 * @example
 * const buttonVariants = variants({
 *   base: 'px-4 py-2 rounded',
 *   variants: {
 *     variant: {
 *       primary: 'bg-blue-500 text-white',
 *       secondary: 'bg-gray-200 text-gray-800',
 *     },
 *     size: {
 *       sm: 'text-sm',
 *       md: 'text-base',
 *       lg: 'text-lg',
 *     },
 *   },
 *   defaultVariants: {
 *     variant: 'primary',
 *     size: 'md',
 *   },
 * });
 *
 * buttonVariants({ variant: 'secondary', size: 'lg' })
 */
export interface VariantsConfig<T extends Record<string, Record<string, string>>> {
  base?: string;
  variants: T;
  defaultVariants?: {
    [K in keyof T]?: keyof T[K];
  };
}

export function variants<T extends Record<string, Record<string, string>>>(
  config: VariantsConfig<T>
) {
  type VariantProps = {
    [K in keyof T]?: keyof T[K];
  };

  return (props?: VariantProps & { className?: string }): string => {
    const { className, ...variantProps } = props || {};

    const classes: string[] = [];

    // Add base classes
    if (config.base) {
      classes.push(config.base);
    }

    // Add variant classes
    for (const [variantKey, variantOptions] of Object.entries(config.variants)) {
      const selectedVariant =
        (variantProps as VariantProps)[variantKey as keyof T] ??
        config.defaultVariants?.[variantKey as keyof T];

      if (selectedVariant && variantOptions[selectedVariant as string]) {
        classes.push(variantOptions[selectedVariant as string]);
      }
    }

    // Add custom className
    if (className) {
      classes.push(className);
    }

    return cn(...classes);
  };
}

/**
 * Focus ring utility classes
 */
export const focusRing = cn(
  'focus:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-blue-500',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-white',
  'dark:focus-visible:ring-offset-gray-900'
);

/**
 * Common transition classes
 */
export const transitions = {
  default: 'transition-all duration-200 ease-in-out',
  fast: 'transition-all duration-100 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  opacity: 'transition-opacity duration-200 ease-in-out',
  transform: 'transition-transform duration-200 ease-in-out',
  none: 'transition-none',
};

/**
 * Scrollbar utility classes
 */
export const scrollbar = {
  thin: cn(
    'scrollbar-thin',
    'scrollbar-track-transparent',
    'scrollbar-thumb-gray-300',
    'dark:scrollbar-thumb-gray-700',
    'hover:scrollbar-thumb-gray-400',
    'dark:hover:scrollbar-thumb-gray-600'
  ),
  hidden: 'scrollbar-none',
  default: '',
};

/**
 * Truncate text with ellipsis
 */
export const truncate = {
  single: 'truncate',
  multiline: (lines: number) =>
    cn('overflow-hidden', 'text-ellipsis', `line-clamp-${lines}`),
};

/**
 * Card base styles
 */
export const card = cn(
  'bg-white',
  'dark:bg-gray-800',
  'rounded-lg',
  'border',
  'border-gray-200',
  'dark:border-gray-700',
  'shadow-sm'
);

/**
 * Interactive card styles (for clickable cards)
 */
export const interactiveCard = cn(
  card,
  transitions.default,
  'cursor-pointer',
  'hover:shadow-md',
  'hover:border-gray-300',
  'dark:hover:border-gray-600',
  focusRing
);

export default cn;
