import { cn } from '@/utils/cn';

// ============================================================================
// Spinner Component
// ============================================================================

export interface SpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'primary' | 'white' | 'gray';
  /** Additional class name */
  className?: string;
}

const spinnerSizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

const spinnerColors = {
  primary: 'border-primary-500 border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-400 border-t-transparent',
};

export function Spinner({ size = 'md', variant = 'primary', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        spinnerSizes[size],
        spinnerColors[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// ============================================================================
// Skeleton Components
// ============================================================================

export interface SkeletonProps {
  /** Width of the skeleton (CSS value or Tailwind class) */
  width?: string;
  /** Height of the skeleton (CSS value or Tailwind class) */
  height?: string;
  /** Whether to show as a circle */
  circle?: boolean;
  /** Additional class name */
  className?: string;
  /** Animation type */
  animation?: 'pulse' | 'shimmer' | 'none';
}

export function Skeleton({
  width,
  height,
  circle = false,
  className,
  animation = 'shimmer',
}: SkeletonProps) {
  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'skeleton-shimmer',
    none: '',
  };

  return (
    <>
      {animation === 'shimmer' && (
        <style>{`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          .skeleton-shimmer {
            background: linear-gradient(
              90deg,
              rgb(30 41 59) 0%,
              rgb(51 65 85) 50%,
              rgb(30 41 59) 100%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s ease-in-out infinite;
          }
        `}</style>
      )}
      <div
        className={cn(
          'bg-dark-700',
          circle ? 'rounded-full' : 'rounded-md',
          animationClasses[animation],
          className
        )}
        style={{
          width: width,
          height: height,
        }}
        role="presentation"
        aria-hidden="true"
      />
    </>
  );
}

// ============================================================================
// Skeleton Card Component
// ============================================================================

export interface SkeletonCardProps {
  /** Aspect ratio for the image placeholder */
  aspectRatio?: '1/1' | '2/3' | '16/9' | '4/3';
  /** Whether to show title skeleton */
  showTitle?: boolean;
  /** Whether to show subtitle skeleton */
  showSubtitle?: boolean;
  /** Whether to show badge skeleton */
  showBadge?: boolean;
  /** Additional class name */
  className?: string;
}

export function SkeletonCard({
  aspectRatio = '2/3',
  showTitle = true,
  showSubtitle = false,
  showBadge = false,
  className,
}: SkeletonCardProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Image skeleton */}
      <div
        className="relative overflow-hidden rounded-lg bg-dark-800"
        style={{ aspectRatio }}
      >
        <Skeleton className="absolute inset-0 rounded-lg" />
        {showBadge && (
          <div className="absolute top-2 right-2">
            <Skeleton width="32px" height="20px" className="rounded" />
          </div>
        )}
      </div>

      {/* Title skeleton */}
      {showTitle && (
        <Skeleton height="16px" className="w-3/4" />
      )}

      {/* Subtitle skeleton */}
      {showSubtitle && (
        <Skeleton height="14px" className="w-1/2" />
      )}
    </div>
  );
}

// ============================================================================
// Skeleton List Component
// ============================================================================

export interface SkeletonListProps {
  /** Number of skeleton items to show */
  count?: number;
  /** Type of skeleton items */
  variant?: 'card' | 'row' | 'channel';
  /** Number of columns (for grid layout) */
  columns?: number;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
}

const gapSizes = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

export function SkeletonList({
  count = 6,
  variant = 'card',
  columns = 4,
  gap = 'md',
  className,
}: SkeletonListProps) {
  const renderSkeletonItem = (index: number) => {
    switch (variant) {
      case 'card':
        return <SkeletonCard key={index} showTitle showBadge />;

      case 'row':
        return (
          <div key={index} className="flex items-center gap-4 p-3 bg-dark-800 rounded-lg">
            <Skeleton width="48px" height="48px" className="rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton height="16px" className="w-3/4" />
              <Skeleton height="14px" className="w-1/2" />
            </div>
          </div>
        );

      case 'channel':
        return (
          <div key={index} className="flex items-center gap-3 p-2 bg-dark-800 rounded-lg">
            <Skeleton width="40px" height="40px" circle />
            <Skeleton height="14px" className="flex-1" />
          </div>
        );

      default:
        return <SkeletonCard key={index} />;
    }
  };

  if (variant === 'row' || variant === 'channel') {
    return (
      <div className={cn('flex flex-col', gapSizes[gap], className)}>
        {Array.from({ length: count }).map((_, i) => renderSkeletonItem(i))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid',
        gapSizes[gap],
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: count }).map((_, i) => renderSkeletonItem(i))}
    </div>
  );
}

// ============================================================================
// Full Page Loader Component
// ============================================================================

export interface FullPageLoaderProps {
  /** Message to display below the spinner */
  message?: string;
  /** Size of the spinner */
  spinnerSize?: SpinnerProps['size'];
  /** Whether to show as an overlay */
  overlay?: boolean;
  /** Additional class name */
  className?: string;
}

export function FullPageLoader({
  message,
  spinnerSize = 'xl',
  overlay = false,
  className,
}: FullPageLoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        overlay
          ? 'fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-50'
          : 'w-full h-full min-h-[400px]',
        className
      )}
    >
      <Spinner size={spinnerSize} variant="primary" />
      {message && (
        <p className="mt-4 text-gray-400 text-sm animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Loading Overlay Component
// ============================================================================

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Message to display */
  message?: string;
  /** Additional class name */
  className?: string;
}

export function LoadingOverlay({ visible, message, className }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center',
        'bg-dark-900/70 backdrop-blur-sm z-10',
        'transition-opacity duration-200',
        className
      )}
    >
      <Spinner size="lg" variant="primary" />
      {message && (
        <p className="mt-3 text-gray-300 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Inline Loader Component
// ============================================================================

export interface InlineLoaderProps {
  /** Text to display next to the spinner */
  text?: string;
  /** Size of the spinner */
  size?: SpinnerProps['size'];
  /** Additional class name */
  className?: string;
}

export function InlineLoader({ text = 'Loading...', size = 'sm', className }: InlineLoaderProps) {
  return (
    <div className={cn('flex items-center gap-2 text-gray-400', className)}>
      <Spinner size={size} variant="gray" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// ============================================================================
// Progress Bar Component
// ============================================================================

export interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Whether to show the value label */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  /** Whether to animate the progress */
  animated?: boolean;
  /** Additional class name */
  className?: string;
}

const progressSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const progressColors = {
  primary: 'bg-primary-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

export function ProgressBar({
  value,
  showLabel = false,
  size = 'md',
  variant = 'primary',
  animated = true,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-400">Progress</span>
          <span className="text-sm text-gray-300">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-dark-700 rounded-full overflow-hidden', progressSizes[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            progressColors[variant],
            animated && 'animate-pulse-slow'
          )}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

export default {
  Spinner,
  Skeleton,
  SkeletonCard,
  SkeletonList,
  FullPageLoader,
  LoadingOverlay,
  InlineLoader,
  ProgressBar,
};
