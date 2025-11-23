/**
 * ChannelGrid Component
 * =====================
 * Virtualized grid view for channels with responsive columns.
 *
 * Mobile Features:
 * - Responsive column counts for all breakpoints
 * - Touch-optimized card sizes
 * - Pull-to-refresh support
 * - Improved touch scrolling
 * - Smaller gaps on mobile for more content
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { VirtualGrid, Skeleton, Spinner } from '@/components/common';
import { ChannelCard } from './ChannelCard';
import type { LiveStream } from '@/services/xtream/types';

// ============================================
// Types
// ============================================

export interface ChannelGridProps {
  /** Array of channels to display */
  channels: LiveStream[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Whether initial data is being fetched */
  isInitialLoading?: boolean;
  /** Currently selected channel ID */
  selectedChannelId?: number;
  /** Callback when channel is clicked */
  onChannelClick?: (channel: LiveStream) => void;
  /** Callback when reaching end of grid (for infinite scroll) */
  onEndReached?: () => void;
  /** Callback for pull-to-refresh */
  onRefresh?: () => Promise<void>;
  /** Custom class name */
  className?: string;
  /** Minimum columns */
  minColumns?: number;
  /** Maximum columns */
  maxColumns?: number;
  /** Card height in pixels */
  cardHeight?: number;
  /** Gap between cards in pixels */
  gap?: number;
  /** Show EPG information on cards */
  showEPG?: boolean;
}

// ============================================
// Responsive Columns Hook
// ============================================

interface ResponsiveConfig {
  columns: number;
  gap: number;
  cardHeight: number;
}

function useResponsiveConfig(
  minCols: number,
  maxCols: number,
  baseGap: number,
  baseCardHeight: number
): ResponsiveConfig {
  const [config, setConfig] = useState<ResponsiveConfig>(() => {
    if (typeof window === 'undefined') {
      return { columns: minCols, gap: baseGap, cardHeight: baseCardHeight };
    }
    return calculateConfig(window.innerWidth, minCols, maxCols, baseGap, baseCardHeight);
  });

  useEffect(() => {
    function handleResize() {
      setConfig(calculateConfig(window.innerWidth, minCols, maxCols, baseGap, baseCardHeight));
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [minCols, maxCols, baseGap, baseCardHeight]);

  return config;
}

function calculateConfig(
  width: number,
  min: number,
  max: number,
  baseGap: number,
  baseCardHeight: number
): ResponsiveConfig {
  // Breakpoints: xs=0, sm=640, md=768, lg=1024, xl=1280, 2xl=1536
  if (width < 375) {
    // Extra small phones - single column list view
    return {
      columns: 1,
      gap: 8,
      cardHeight: Math.round(baseCardHeight * 0.6),
    };
  }
  if (width < 640) {
    // Small phones - 2 columns
    return {
      columns: Math.max(min, 2),
      gap: 10,
      cardHeight: Math.round(baseCardHeight * 0.85),
    };
  }
  if (width < 768) {
    // Large phones / small tablets - 3 columns
    return {
      columns: Math.min(Math.max(min, 3), max),
      gap: 12,
      cardHeight: Math.round(baseCardHeight * 0.9),
    };
  }
  if (width < 1024) {
    // Tablets - 4 columns
    return {
      columns: Math.min(Math.max(min, 4), max),
      gap: baseGap,
      cardHeight: baseCardHeight,
    };
  }
  if (width < 1280) {
    // Small desktops - 5 columns
    return {
      columns: Math.min(Math.max(min, 5), max),
      gap: baseGap,
      cardHeight: baseCardHeight,
    };
  }
  if (width < 1536) {
    // Large desktops - 6 columns
    return {
      columns: Math.min(Math.max(min, 6), max),
      gap: baseGap,
      cardHeight: baseCardHeight,
    };
  }
  // Extra large - max columns
  return {
    columns: max,
    gap: baseGap,
    cardHeight: baseCardHeight,
  };
}

// ============================================
// Pull to Refresh Hook
// ============================================

function usePullToRefresh(
  containerRef: React.RefObject<HTMLElement>,
  onRefresh?: () => Promise<void>
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onRefresh) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const delta = currentY - touchStartY.current;

      if (delta > 0 && container.scrollTop === 0) {
        const progress = Math.min(delta / 100, 1);
        setPullProgress(progress);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      if (pullProgress >= 1 && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setPullProgress(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, onRefresh, isRefreshing, pullProgress]);

  return { isRefreshing, pullProgress };
}

// ============================================
// Loading Skeleton Component
// ============================================

interface SkeletonGridProps {
  columns: number;
  rows?: number;
  gap: number;
  cardHeight: number;
}

function SkeletonGrid({ columns, rows = 3, gap, cardHeight }: SkeletonGridProps) {
  const skeletonCount = columns * rows;

  return (
    <div
      className="grid w-full p-4 sm:p-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap}px`,
        padding: columns === 1 ? '12px' : undefined,
      }}
    >
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <div
          key={index}
          className="bg-dark-800 rounded-lg overflow-hidden border border-dark-700"
          style={{ height: columns === 1 ? 'auto' : `${cardHeight}px` }}
        >
          {columns === 1 ? (
            // List view skeleton for single column
            <div className="flex items-center gap-3 p-3">
              <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton height="14px" className="w-3/4" />
                <Skeleton height="12px" className="w-1/2" />
              </div>
            </div>
          ) : (
            // Grid view skeleton
            <>
              <div className="aspect-square bg-dark-900 relative">
                <Skeleton className="absolute inset-0" />
              </div>
              <div className="p-3 space-y-2">
                <Skeleton height="14px" className="w-3/4" />
                <Skeleton height="12px" className="w-1/2" />
                <Skeleton height="4px" className="w-full mt-2" />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-gray-400">
      <svg
        className="w-16 h-16 sm:w-20 sm:h-20 mb-4 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <h3 className="text-base sm:text-lg font-medium text-white mb-1">No channels found</h3>
      <p className="text-xs sm:text-sm text-gray-500 text-center max-w-sm">
        No channels match your current filter. Try selecting a different category or adjusting
        your search.
      </p>
    </div>
  );
}

// ============================================
// Pull to Refresh Indicator
// ============================================

interface PullIndicatorProps {
  progress: number;
  isRefreshing: boolean;
}

function PullIndicator({ progress, isRefreshing }: PullIndicatorProps) {
  if (progress === 0 && !isRefreshing) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center py-3',
        'transition-all duration-200'
      )}
      style={{
        height: isRefreshing ? 48 : progress * 48,
        opacity: Math.min(progress * 2, 1),
      }}
    >
      {isRefreshing ? (
        <Spinner size="sm" variant="primary" />
      ) : (
        <div
          className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full"
          style={{
            transform: `rotate(${progress * 360}deg)`,
            opacity: progress,
          }}
        />
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ChannelGrid({
  channels,
  isLoading = false,
  isInitialLoading = false,
  selectedChannelId,
  onChannelClick,
  onEndReached,
  onRefresh,
  className,
  minColumns = 2,
  maxColumns = 6,
  cardHeight = 200,
  gap = 16,
  showEPG = true,
}: ChannelGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate responsive columns, gap, and card height
  const config = useResponsiveConfig(minColumns, maxColumns, gap, cardHeight);

  // Pull to refresh
  const { isRefreshing, pullProgress } = usePullToRefresh(
    containerRef as React.RefObject<HTMLElement>,
    onRefresh
  );

  // Determine if we're in list mode (single column)
  const isListMode = config.columns === 1;

  // Render a single channel card
  const renderChannel = useCallback(
    (channel: LiveStream) => (
      <ChannelCard
        channel={channel}
        isSelected={channel.stream_id === selectedChannelId}
        showEPG={showEPG && !isListMode}
        onClick={onChannelClick}
        className={cn(
          'h-full',
          // Touch-friendly: ensure minimum tap target size
          'min-h-[44px]'
        )}
      />
    ),
    [selectedChannelId, showEPG, onChannelClick, isListMode]
  );

  // Loading indicator for infinite scroll
  const loadingComponent = (
    <div className="flex items-center justify-center py-6">
      <Spinner size="md" variant="primary" />
      <span className="ml-3 text-xs sm:text-sm text-gray-400">Loading more channels...</span>
    </div>
  );

  // Show skeleton during initial load
  if (isInitialLoading) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'h-full bg-dark-900 overflow-auto',
          'overscroll-contain',
          className
        )}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <SkeletonGrid
          columns={config.columns}
          rows={4}
          gap={config.gap}
          cardHeight={config.cardHeight}
        />
      </div>
    );
  }

  // Show empty state if no channels
  if (!isLoading && channels.length === 0) {
    return (
      <div className={cn('h-full bg-dark-900', className)}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full bg-dark-900',
        'overscroll-contain',
        className
      )}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull to refresh indicator */}
      {onRefresh && (
        <PullIndicator progress={pullProgress} isRefreshing={isRefreshing} />
      )}

      <VirtualGrid
        items={channels}
        renderItem={renderChannel}
        columns={config.columns}
        rowHeight={config.cardHeight}
        gap={config.gap}
        className={cn(
          // Responsive padding
          'p-3 sm:p-4',
          // Add extra padding at bottom for mobile nav
          'pb-4 sm:pb-4'
        )}
        overscan={3}
        onEndReached={onEndReached}
        endReachedThreshold={400}
        isLoading={isLoading || isRefreshing}
        loadingComponent={loadingComponent}
        emptyComponent={<EmptyState />}
      />
    </div>
  );
}

// ============================================
// Compact Grid Variant
// ============================================

export interface ChannelGridCompactProps {
  channels: LiveStream[];
  isLoading?: boolean;
  selectedChannelId?: number;
  onChannelClick?: (channel: LiveStream) => void;
  className?: string;
  columns?: number;
}

export function ChannelGridCompact({
  channels,
  isLoading = false,
  selectedChannelId,
  onChannelClick,
  className,
  columns = 4,
}: ChannelGridCompactProps) {
  // Responsive columns for compact grid
  const [responsiveColumns, setResponsiveColumns] = useState(columns);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 375) setResponsiveColumns(2);
      else if (width < 640) setResponsiveColumns(Math.min(columns, 3));
      else setResponsiveColumns(columns);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [columns]);

  if (isLoading) {
    return (
      <div
        className={cn('grid gap-2 sm:gap-3 p-2 sm:p-3', className)}
        style={{ gridTemplateColumns: `repeat(${responsiveColumns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: responsiveColumns * 2 }).map((_, i) => (
          <div key={i} className="aspect-square bg-dark-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8 text-gray-500 text-sm', className)}>
        No channels
      </div>
    );
  }

  return (
    <div
      className={cn('grid gap-2 sm:gap-3 p-2 sm:p-3', className)}
      style={{ gridTemplateColumns: `repeat(${responsiveColumns}, minmax(0, 1fr))` }}
    >
      {channels.map((channel) => (
        <ChannelCard
          key={channel.stream_id}
          channel={channel}
          isSelected={channel.stream_id === selectedChannelId}
          showEPG={false}
          onClick={onChannelClick}
          className="min-h-[44px]"
        />
      ))}
    </div>
  );
}

export default ChannelGrid;
