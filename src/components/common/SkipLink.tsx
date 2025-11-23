/**
 * SkipLink Component
 * Provides skip navigation links for keyboard and screen reader users
 * to bypass repetitive navigation and jump to main content areas.
 */

import React from 'react';
import { cn } from '@/utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface SkipLinkProps {
  /** Target element ID to skip to (without #) */
  targetId: string;
  /** Link text */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

export interface SkipLinksProps {
  /** Array of skip link targets */
  links?: Array<{
    targetId: string;
    label: string;
  }>;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// SkipLink Component
// ============================================================================

export function SkipLink({ targetId, children, className }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      // Set focus to the target element
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Remove tabindex after blur to avoid interfering with normal tab order
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex');
      }, { once: true });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // Position off-screen by default
        'absolute -top-full left-0 z-[100]',
        // Styling
        'px-4 py-2 bg-primary-600 text-white font-medium rounded-br-lg',
        'transition-all duration-200',
        // Show on focus
        'focus:top-0 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-dark-900',
        // Animation
        'transform -translate-y-full focus:translate-y-0',
        className
      )}
    >
      {children}
    </a>
  );
}

// ============================================================================
// SkipLinks Container Component
// ============================================================================

const defaultLinks = [
  { targetId: 'main-content', label: 'Skip to main content' },
  { targetId: 'main-navigation', label: 'Skip to navigation' },
];

export function SkipLinks({ links = defaultLinks, className }: SkipLinksProps) {
  return (
    <nav
      aria-label="Skip links"
      className={cn('skip-links', className)}
    >
      {links.map((link, index) => (
        <SkipLink
          key={link.targetId}
          targetId={link.targetId}
          className={cn(
            // Stack multiple links
            index > 0 && 'focus:left-[200px]'
          )}
        >
          {link.label}
        </SkipLink>
      ))}
    </nav>
  );
}

// ============================================================================
// VisuallyHidden Component (sr-only)
// ============================================================================

export interface VisuallyHiddenProps {
  /** Content only visible to screen readers */
  children: React.ReactNode;
  /** HTML element to render */
  as?: keyof JSX.IntrinsicElements;
  /** Additional class name */
  className?: string;
  /** Optional ID for aria-describedby references */
  id?: string;
}

export function VisuallyHidden({
  children,
  as: Component = 'span',
  className,
  id,
}: VisuallyHiddenProps) {
  return (
    <Component
      id={id}
      className={cn(
        'sr-only',
        // Fallback styles if sr-only isn't defined in Tailwind
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        '[clip:rect(0,0,0,0)]',
        className
      )}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// LiveRegion Component for Dynamic Announcements
// ============================================================================

export interface LiveRegionProps {
  /** Content to announce */
  children: React.ReactNode;
  /** Politeness level */
  politeness?: 'polite' | 'assertive' | 'off';
  /** Whether to announce atomic updates */
  atomic?: boolean;
  /** Relevant changes to announce */
  relevant?: 'additions' | 'removals' | 'text' | 'all' | 'additions text';
  /** Additional class name */
  className?: string;
  /** Whether to make the region visible */
  visible?: boolean;
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text',
  className,
  visible = false,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn(
        !visible && 'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)]',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Keyboard Shortcuts Help Component
// ============================================================================

export interface KeyboardShortcut {
  key: string;
  description: string;
  modifier?: 'Ctrl' | 'Alt' | 'Shift' | 'Cmd';
}

export interface KeyboardShortcutsHelpProps {
  /** List of keyboard shortcuts */
  shortcuts: KeyboardShortcut[];
  /** Title for the help section */
  title?: string;
  /** Additional class name */
  className?: string;
}

export function KeyboardShortcutsHelp({
  shortcuts,
  title = 'Keyboard Shortcuts',
  className,
}: KeyboardShortcutsHelpProps) {
  return (
    <div
      className={cn(
        'bg-dark-800 rounded-lg p-4 border border-dark-700',
        className
      )}
      role="region"
      aria-label={title}
    >
      <h3 className="text-white font-semibold mb-3 text-sm">{title}</h3>
      <dl className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <dt className="text-gray-400">{shortcut.description}</dt>
            <dd className="flex items-center gap-1">
              {shortcut.modifier && (
                <kbd className="px-2 py-0.5 bg-dark-700 rounded text-xs text-gray-300 font-mono">
                  {shortcut.modifier}
                </kbd>
              )}
              {shortcut.modifier && <span className="text-gray-500">+</span>}
              <kbd className="px-2 py-0.5 bg-dark-700 rounded text-xs text-gray-300 font-mono min-w-[28px] text-center">
                {shortcut.key}
              </kbd>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ============================================================================
// FocusTrap Hook
// ============================================================================

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean = true
) {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Get all focusable elements
    const getFocusableElements = () => {
      const focusableSelectors = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];
      return container.querySelectorAll<HTMLElement>(focusableSelectors.join(','));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
}

export default SkipLink;
