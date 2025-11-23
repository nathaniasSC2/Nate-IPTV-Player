/**
 * EmptyState Component
 * ====================
 * Reusable empty state component with presets for common scenarios.
 * Features lucide-react icons, titles, descriptions, and optional action buttons.
 */

import { type ReactNode } from 'react';
import {
  Star,
  History,
  SearchX,
  WifiOff,
  Tv,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

// ============================================
// Types
// ============================================

export interface EmptyStateAction {
  /** Button label text */
  label: string;
  /** Click handler */
  onClick: () => void;
}

export interface EmptyStateProps {
  /** Icon to display (lucide-react icon or custom ReactNode) */
  icon?: ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button configuration */
  action?: EmptyStateAction;
  /** Visual variant */
  variant?: 'default' | 'card' | 'inline';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS class name */
  className?: string;
  /** Children to render below the content */
  children?: ReactNode;
}

// ============================================
// Size Configurations
// ============================================

const sizeConfig = {
  sm: {
    container: 'py-6 gap-2',
    icon: 'w-8 h-8',
    title: 'text-base',
    description: 'text-xs',
    buttonSize: 'sm' as const,
  },
  md: {
    container: 'py-10 gap-3',
    icon: 'w-12 h-12',
    title: 'text-lg',
    description: 'text-sm',
    buttonSize: 'md' as const,
  },
  lg: {
    container: 'py-16 gap-4',
    icon: 'w-16 h-16',
    title: 'text-xl',
    description: 'text-base',
    buttonSize: 'lg' as const,
  },
};

// ============================================
// Variant Configurations
// ============================================

const variantConfig = {
  default: '',
  card: 'bg-dark-800 rounded-lg border border-dark-700',
  inline: 'flex-row py-4 gap-4',
};

// ============================================
// Main EmptyState Component
// ============================================

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  size = 'md',
  className,
  children,
}: EmptyStateProps) {
  const sizes = sizeConfig[size];
  const variantStyles = variantConfig[variant];
  const isInline = variant === 'inline';

  return (
    <div
      className={cn(
        'flex items-center justify-center px-4',
        isInline ? 'flex-row text-left' : 'flex-col text-center',
        sizes.container,
        variantStyles,
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Icon */}
      {icon && (
        <div
          className={cn(
            'flex-shrink-0 text-gray-500',
            sizes.icon,
            isInline ? '' : 'mb-1'
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      {/* Content Container */}
      <div className={cn(isInline ? 'flex flex-col gap-1' : '')}>
        {/* Title */}
        <h3 className={cn('font-semibold text-white', sizes.title)}>
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p
            className={cn(
              'text-gray-400 max-w-md',
              sizes.description,
              !isInline && 'mt-1'
            )}
          >
            {description}
          </p>
        )}

        {/* Children */}
        {children}

        {/* Action Button */}
        {action && (
          <div className={cn(isInline ? 'mt-2' : 'mt-4')}>
            <Button
              variant="primary"
              size={sizes.buttonSize}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Preset Component Props
// ============================================

export interface PresetEmptyStateProps
  extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  /** Override the default title */
  title?: string;
  /** Override the default description */
  description?: string;
}

// ============================================
// Preset Components
// ============================================

/**
 * NoFavorites - Empty state for favorites section
 */
export function NoFavorites({
  title = 'No favorites yet',
  description = 'Add channels or movies to favorites for quick access',
  ...props
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={<Star className="w-full h-full" />}
      title={title}
      description={description}
      {...props}
    />
  );
}

/**
 * NoHistory - Empty state for watch history
 */
export function NoHistory({
  title = 'No watch history',
  description = 'Start watching to build your history',
  ...props
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={<History className="w-full h-full" />}
      title={title}
      description={description}
      {...props}
    />
  );
}

/**
 * NoResults - Empty state for search with no results
 */
export function NoResults({
  title = 'No results found',
  description = 'Try a different search term',
  ...props
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={<SearchX className="w-full h-full" />}
      title={title}
      description={description}
      {...props}
    />
  );
}

/**
 * NoConnection - Empty state when no IPTV connection is configured
 */
export function NoConnection({
  title = 'Not connected',
  description = 'Set up a connection to get started',
  ...props
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={<WifiOff className="w-full h-full" />}
      title={title}
      description={description}
      {...props}
    />
  );
}

/**
 * NoChannels - Empty state for empty channel list
 */
export function NoChannels({
  title = 'No channels',
  description = 'No channels available in this category',
  ...props
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={<Tv className="w-full h-full" />}
      title={title}
      description={description}
      {...props}
    />
  );
}

/**
 * NoEPG - Empty state when EPG data is not available
 */
export function NoEPG({
  title = 'No program info',
  description = 'EPG data not available',
  ...props
}: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={<Calendar className="w-full h-full" />}
      title={title}
      description={description}
      {...props}
    />
  );
}

/**
 * GenericError - Empty state for generic errors with retry button
 */
export interface GenericErrorProps extends PresetEmptyStateProps {
  /** Retry callback - if provided, shows a retry button */
  onRetry?: () => void;
  /** Custom retry button label */
  retryLabel?: string;
}

export function GenericError({
  title = 'Something went wrong',
  description = 'An unexpected error occurred',
  onRetry,
  retryLabel = 'Try again',
  action,
  ...props
}: GenericErrorProps) {
  // Use provided action or create retry action if onRetry is provided
  const finalAction = action ?? (onRetry ? { label: retryLabel, onClick: onRetry } : undefined);

  return (
    <EmptyState
      icon={<AlertTriangle className="w-full h-full" />}
      title={title}
      description={description}
      action={finalAction}
      {...props}
    />
  );
}

export default EmptyState;
