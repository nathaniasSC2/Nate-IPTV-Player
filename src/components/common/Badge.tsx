import React from 'react';
import { cn } from '@/utils/cn';

// ============================================================================
// Badge Component
// ============================================================================

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Badge variant */
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'hd'
    | '4k'
    | 'fhd'
    | 'live'
    | 'new'
    | 'premium';
  /** Badge size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether the badge is outlined */
  outline?: boolean;
  /** Whether the badge should pulse (for live indicators) */
  pulse?: boolean;
  /** Whether to show a dot indicator */
  dot?: boolean;
  /** Additional class name */
  className?: string;
}

const badgeVariants = {
  default: {
    solid: 'bg-dark-600 text-gray-300',
    outline: 'border-dark-600 text-gray-300',
  },
  primary: {
    solid: 'bg-primary-600 text-white',
    outline: 'border-primary-500 text-primary-400',
  },
  secondary: {
    solid: 'bg-dark-700 text-gray-200',
    outline: 'border-dark-500 text-gray-300',
  },
  success: {
    solid: 'bg-green-600 text-white',
    outline: 'border-green-500 text-green-400',
  },
  warning: {
    solid: 'bg-yellow-600 text-white',
    outline: 'border-yellow-500 text-yellow-400',
  },
  danger: {
    solid: 'bg-red-600 text-white',
    outline: 'border-red-500 text-red-400',
  },
  info: {
    solid: 'bg-blue-600 text-white',
    outline: 'border-blue-500 text-blue-400',
  },
  // Quality badges
  hd: {
    solid: 'bg-blue-600 text-white',
    outline: 'border-blue-500 text-blue-400',
  },
  '4k': {
    solid: 'bg-purple-600 text-white',
    outline: 'border-purple-500 text-purple-400',
  },
  fhd: {
    solid: 'bg-cyan-600 text-white',
    outline: 'border-cyan-500 text-cyan-400',
  },
  // Status badges
  live: {
    solid: 'bg-red-600 text-white',
    outline: 'border-red-500 text-red-400',
  },
  new: {
    solid: 'bg-green-600 text-white',
    outline: 'border-green-500 text-green-400',
  },
  premium: {
    solid: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white',
    outline: 'border-yellow-500 text-yellow-400',
  },
};

const badgeSizes = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  outline = false,
  pulse = false,
  dot = false,
  className,
}: BadgeProps) {
  const variantStyles = badgeVariants[variant];
  const style = outline ? variantStyles.outline : variantStyles.solid;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'font-semibold uppercase tracking-wide',
        'rounded',
        outline && 'border bg-transparent',
        badgeSizes[size],
        style,
        pulse && 'animate-pulse',
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            variant === 'live' && 'bg-white animate-pulse',
            variant === 'success' && 'bg-white',
            variant === 'danger' && 'bg-white',
            variant === 'default' && 'bg-current'
          )}
        />
      )}
      {children}
    </span>
  );
}

// ============================================================================
// Quality Badge Component
// ============================================================================

export interface QualityBadgeProps {
  /** Quality type */
  quality: 'sd' | 'hd' | 'fhd' | '4k' | 'uhd' | string;
  /** Badge size */
  size?: BadgeProps['size'];
  /** Additional class name */
  className?: string;
}

const qualityConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  sd: { label: 'SD', variant: 'default' },
  hd: { label: 'HD', variant: 'hd' },
  fhd: { label: 'FHD', variant: 'fhd' },
  '1080p': { label: 'FHD', variant: 'fhd' },
  '4k': { label: '4K', variant: '4k' },
  uhd: { label: 'UHD', variant: '4k' },
  '2160p': { label: '4K', variant: '4k' },
};

export function QualityBadge({ quality, size = 'xs', className }: QualityBadgeProps) {
  const config = qualityConfig[quality.toLowerCase()] || {
    label: quality.toUpperCase(),
    variant: 'default' as const,
  };

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}

// ============================================================================
// Live Badge Component
// ============================================================================

export interface LiveBadgeProps {
  /** Badge size */
  size?: BadgeProps['size'];
  /** Whether to show the pulsing dot */
  showDot?: boolean;
  /** Additional class name */
  className?: string;
}

export function LiveBadge({ size = 'xs', showDot = true, className }: LiveBadgeProps) {
  return (
    <Badge variant="live" size={size} dot={showDot} className={className}>
      LIVE
    </Badge>
  );
}

// ============================================================================
// Status Badge Component
// ============================================================================

export interface StatusBadgeProps {
  /** Status type */
  status: 'online' | 'offline' | 'away' | 'busy' | 'active' | 'inactive' | 'pending';
  /** Whether to show label text */
  showLabel?: boolean;
  /** Badge size */
  size?: BadgeProps['size'];
  /** Additional class name */
  className?: string;
}

const statusConfig: Record<
  StatusBadgeProps['status'],
  { label: string; variant: BadgeProps['variant']; dotColor: string }
> = {
  online: { label: 'Online', variant: 'success', dotColor: 'bg-green-500' },
  offline: { label: 'Offline', variant: 'default', dotColor: 'bg-gray-500' },
  away: { label: 'Away', variant: 'warning', dotColor: 'bg-yellow-500' },
  busy: { label: 'Busy', variant: 'danger', dotColor: 'bg-red-500' },
  active: { label: 'Active', variant: 'success', dotColor: 'bg-green-500' },
  inactive: { label: 'Inactive', variant: 'default', dotColor: 'bg-gray-500' },
  pending: { label: 'Pending', variant: 'warning', dotColor: 'bg-yellow-500' },
};

export function StatusBadge({
  status,
  showLabel = true,
  size = 'sm',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!showLabel) {
    return (
      <span
        className={cn(
          'inline-block w-2 h-2 rounded-full',
          config.dotColor,
          status === 'online' && 'animate-pulse',
          className
        )}
        title={config.label}
      />
    );
  }

  return (
    <Badge variant={config.variant} size={size} dot className={className}>
      {config.label}
    </Badge>
  );
}

// ============================================================================
// Category Badge Component
// ============================================================================

export interface CategoryBadgeProps {
  /** Category name */
  category: string;
  /** Badge size */
  size?: BadgeProps['size'];
  /** Badge variant */
  variant?: BadgeProps['variant'];
  /** Additional class name */
  className?: string;
}

export function CategoryBadge({
  category,
  size = 'sm',
  variant = 'secondary',
  className,
}: CategoryBadgeProps) {
  return (
    <Badge variant={variant} size={size} className={className}>
      {category}
    </Badge>
  );
}

// ============================================================================
// Count Badge Component
// ============================================================================

export interface CountBadgeProps {
  /** Count value */
  count: number;
  /** Maximum count to display (shows "max+" after) */
  max?: number;
  /** Badge variant */
  variant?: BadgeProps['variant'];
  /** Badge size */
  size?: BadgeProps['size'];
  /** Whether to show zero */
  showZero?: boolean;
  /** Additional class name */
  className?: string;
}

export function CountBadge({
  count,
  max = 99,
  variant = 'primary',
  size = 'xs',
  showZero = false,
  className,
}: CountBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      variant={variant}
      size={size}
      className={cn('min-w-[20px] rounded-full', className)}
    >
      {displayCount}
    </Badge>
  );
}

// ============================================================================
// Badge Group Component
// ============================================================================

export interface BadgeGroupProps {
  /** Children badges */
  children: React.ReactNode;
  /** Gap between badges */
  gap?: 'xs' | 'sm' | 'md';
  /** Additional class name */
  className?: string;
}

const badgeGaps = {
  xs: 'gap-1',
  sm: 'gap-1.5',
  md: 'gap-2',
};

export function BadgeGroup({ children, gap = 'sm', className }: BadgeGroupProps) {
  return (
    <div className={cn('inline-flex flex-wrap items-center', badgeGaps[gap], className)}>
      {children}
    </div>
  );
}

export default Badge;
