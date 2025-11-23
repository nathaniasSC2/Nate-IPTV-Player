import React, { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/utils/cn';

export interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Estimated height for each item (used for initial calculations) */
  itemHeight?: number;
  /** Direction of the list */
  direction?: 'vertical' | 'horizontal';
  /** Number of items to render outside visible area */
  overscan?: number;
  /** Custom class name for the container */
  className?: string;
  /** Custom class name for the scroll container */
  scrollClassName?: string;
  /** Gap between items in pixels */
  gap?: number;
  /** Callback when scroll reaches near the end */
  onEndReached?: () => void;
  /** Threshold for triggering onEndReached (in pixels) */
  endReachedThreshold?: number;
  /** Whether the list is loading more items */
  isLoading?: boolean;
  /** Loading indicator component */
  loadingComponent?: React.ReactNode;
  /** Empty state component */
  emptyComponent?: React.ReactNode;
  /** Get unique key for each item */
  getItemKey?: (index: number) => string | number;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight = 50,
  direction = 'vertical',
  overscan = 5,
  className,
  scrollClassName,
  gap = 0,
  onEndReached,
  endReachedThreshold = 200,
  isLoading = false,
  loadingComponent,
  emptyComponent,
  getItemKey,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const isHorizontal = direction === 'horizontal';

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => itemHeight + gap, [itemHeight, gap]),
    overscan,
    horizontal: isHorizontal,
    getItemKey: getItemKey,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Handle end reached
  const handleScroll = useCallback(() => {
    if (!onEndReached || isLoading) return;

    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = scrollElement;

    const scrollPosition = isHorizontal ? scrollLeft : scrollTop;
    const maxScroll = isHorizontal ? scrollWidth - clientWidth : scrollHeight - clientHeight;

    if (maxScroll - scrollPosition <= endReachedThreshold) {
      onEndReached();
    }
  }, [onEndReached, isLoading, isHorizontal, endReachedThreshold]);

  // Empty state
  if (items.length === 0 && !isLoading) {
    return emptyComponent ? (
      <div className={cn('flex items-center justify-center min-h-[200px]', className)}>
        {emptyComponent}
      </div>
    ) : null;
  }

  return (
    <div
      ref={parentRef}
      className={cn(
        'overflow-auto',
        isHorizontal ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden',
        scrollClassName
      )}
      onScroll={handleScroll}
    >
      <div
        className={cn('relative', className)}
        style={{
          [isHorizontal ? 'width' : 'height']: `${totalSize}px`,
          [isHorizontal ? 'height' : 'width']: '100%',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0"
              style={{
                [isHorizontal ? 'left' : 'top']: `${virtualItem.start}px`,
                [isHorizontal ? 'height' : 'width']: '100%',
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
      {isLoading && loadingComponent && (
        <div className="flex justify-center py-4">
          {loadingComponent}
        </div>
      )}
    </div>
  );
}

// Grid variant for virtualized grids
export interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns: number;
  rowHeight: number;
  gap?: number;
  className?: string;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  columns,
  rowHeight,
  gap = 16,
  className,
  overscan = 3,
  onEndReached,
  endReachedThreshold = 200,
  isLoading = false,
  loadingComponent,
  emptyComponent,
}: VirtualGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight + gap, [rowHeight, gap]),
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const handleScroll = useCallback(() => {
    if (!onEndReached || isLoading) return;

    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;

    if (scrollHeight - clientHeight - scrollTop <= endReachedThreshold) {
      onEndReached();
    }
  }, [onEndReached, isLoading, endReachedThreshold]);

  if (items.length === 0 && !isLoading) {
    return emptyComponent ? (
      <div className={cn('flex items-center justify-center min-h-[200px]', className)}>
        {emptyComponent}
      </div>
    ) : null;
  }

  return (
    <div
      ref={parentRef}
      className="overflow-auto h-full"
      onScroll={handleScroll}
    >
      <div
        className={cn('relative w-full', className)}
        style={{ height: `${totalSize}px` }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full"
              style={{
                top: `${virtualRow.start}px`,
                height: `${rowHeight}px`,
              }}
            >
              <div
                className="grid h-full"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  gap: `${gap}px`,
                }}
              >
                {rowItems.map((item, i) => (
                  <div key={startIndex + i} className="h-full">
                    {renderItem(item, startIndex + i)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {isLoading && loadingComponent && (
        <div className="flex justify-center py-4">
          {loadingComponent}
        </div>
      )}
    </div>
  );
}

export default VirtualList;
