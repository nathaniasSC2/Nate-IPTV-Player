/**
 * SeriesList Component
 * Grid/List display of series with virtualization, filtering, and sorting
 */

import React, { useMemo, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { VirtualGrid, SkeletonList, Spinner } from '@/components/common';
import { SeriesCard } from './SeriesCard';
import { useSeries, useSeriesCategories } from '@/hooks';
import type { Series, SeriesCategory } from '@/services/xtream/types';

// ============================================
// Types
// ============================================

export type SeriesSortOption = 'name' | 'name_desc' | 'rating' | 'rating_desc' | 'updated' | 'updated_desc';

export interface SeriesListProps {
  /** Category ID to filter series (null for all) */
  categoryId?: string | null;
  /** Search query to filter series */
  searchQuery?: string;
  /** Sort option */
  sortBy?: SeriesSortOption;
  /** Callback when a series is clicked */
  onSeriesClick?: (series: Series) => void;
  /** Callback when "View Series" is clicked */
  onViewSeries?: (series: Series) => void;
  /** Custom class name */
  className?: string;
  /** Number of columns (responsive handled internally if not provided) */
  columns?: number;
  /** Show loading state externally controlled */
  isLoading?: boolean;
  /** External series data (if provided, ignores internal fetch) */
  seriesList?: Series[];
  /** Show category filter dropdown */
  showCategoryFilter?: boolean;
  /** Show sort dropdown */
  showSortOptions?: boolean;
}

// ============================================
// Sort Functions
// ============================================

function sortSeries(series: Series[], sortBy: SeriesSortOption): Series[] {
  const sorted = [...series];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'rating':
      return sorted.sort((a, b) => (a.rating_5based || 0) - (b.rating_5based || 0));
    case 'rating_desc':
      return sorted.sort((a, b) => (b.rating_5based || 0) - (a.rating_5based || 0));
    case 'updated':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.last_modified || 0).getTime();
        const dateB = new Date(b.last_modified || 0).getTime();
        return dateA - dateB;
      });
    case 'updated_desc':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.last_modified || 0).getTime();
        const dateB = new Date(b.last_modified || 0).getTime();
        return dateB - dateA;
      });
    default:
      return sorted;
  }
}

function filterSeries(series: Series[], searchQuery?: string): Series[] {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return series;
  }

  const query = searchQuery.toLowerCase().trim();
  return series.filter((s) =>
    s.name.toLowerCase().includes(query)
  );
}

// ============================================
// Responsive Columns Hook
// ============================================

function useResponsiveColumns(customColumns?: number): number {
  const [columns, setColumns] = useState(customColumns || 4);

  React.useEffect(() => {
    if (customColumns) {
      setColumns(customColumns);
      return;
    }

    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(2);
      } else if (width < 768) {
        setColumns(3);
      } else if (width < 1024) {
        setColumns(4);
      } else if (width < 1280) {
        setColumns(5);
      } else {
        setColumns(6);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [customColumns]);

  return columns;
}

// ============================================
// Sub Components
// ============================================

interface SortSelectProps {
  value: SeriesSortOption;
  onChange: (value: SeriesSortOption) => void;
  className?: string;
}

function SortSelect({ value, onChange, className }: SortSelectProps) {
  const options: { value: SeriesSortOption; label: string }[] = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'rating_desc', label: 'Rating (High-Low)' },
    { value: 'rating', label: 'Rating (Low-High)' },
    { value: 'updated_desc', label: 'Recently Updated' },
    { value: 'updated', label: 'Oldest Updated' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SeriesSortOption)}
      className={cn(
        'bg-dark-700 text-gray-200 text-sm',
        'border border-dark-600 rounded-lg',
        'px-3 py-2',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'cursor-pointer',
        className
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface CategorySelectProps {
  categories: SeriesCategory[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

function CategorySelect({ categories, value, onChange, className }: CategorySelectProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={cn(
        'bg-dark-700 text-gray-200 text-sm',
        'border border-dark-600 rounded-lg',
        'px-3 py-2',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'cursor-pointer',
        className
      )}
    >
      <option value="">All Categories</option>
      {categories.map((category) => (
        <option key={category.category_id} value={category.category_id}>
          {category.category_name}
        </option>
      ))}
    </select>
  );
}

interface EmptyStateProps {
  message?: string;
}

function EmptyState({ message = 'No series found' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        className="w-16 h-16 text-gray-600 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
      <p className="text-gray-400 text-lg font-medium">{message}</p>
      <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search</p>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function SeriesList({
  categoryId,
  searchQuery,
  sortBy: externalSortBy,
  onSeriesClick,
  onViewSeries,
  className,
  columns: customColumns,
  isLoading: externalLoading,
  seriesList: externalSeriesList,
  showCategoryFilter = false,
  showSortOptions = true,
}: SeriesListProps) {
  // Internal state
  const [internalSortBy, setInternalSortBy] = useState<SeriesSortOption>('name');
  const [internalCategoryId, setInternalCategoryId] = useState<string | null>(categoryId || null);

  const sortBy = externalSortBy ?? internalSortBy;
  const activeCategoryId = categoryId ?? internalCategoryId;

  // Data fetching
  const { data: fetchedSeries, isLoading: seriesLoading } = useSeries(
    activeCategoryId || undefined,
    { enabled: !externalSeriesList }
  );
  const { data: categories } = useSeriesCategories({
    enabled: showCategoryFilter,
  });

  // Responsive columns
  const columns = useResponsiveColumns(customColumns);

  // Calculate row height based on aspect ratio + content
  const rowHeight = useMemo(() => {
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const sidebarWidth = 256;
    const padding = 32;
    const gapSize = 16;
    const availableWidth = containerWidth - sidebarWidth - padding;
    const cardWidth = (availableWidth - (columns - 1) * gapSize) / columns;
    const posterHeight = cardWidth * 1.5; // 2:3 aspect ratio
    return posterHeight + 120; // Content area (more for series info)
  }, [columns]);

  // Process series
  const seriesList = externalSeriesList ?? fetchedSeries ?? [];
  const processedSeries = useMemo(() => {
    const filtered = filterSeries(seriesList, searchQuery);
    return sortSeries(filtered, sortBy);
  }, [seriesList, searchQuery, sortBy]);

  // Loading state
  const isLoading = externalLoading ?? seriesLoading;

  // Handlers
  const handleSortChange = useCallback((newSort: SeriesSortOption) => {
    setInternalSortBy(newSort);
  }, []);

  const handleCategoryChange = useCallback((newCategory: string | null) => {
    setInternalCategoryId(newCategory);
  }, []);

  // Render item
  const renderSeries = useCallback(
    (series: Series) => (
      <SeriesCard
        series={series}
        onClick={onSeriesClick}
        onViewSeries={onViewSeries}
        className="h-full"
      />
    ),
    [onSeriesClick, onViewSeries]
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        {/* Filter bar skeleton */}
        {(showCategoryFilter || showSortOptions) && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {showCategoryFilter && (
                <div className="w-48 h-10 bg-dark-700 rounded-lg animate-pulse" />
              )}
              {showSortOptions && (
                <div className="w-40 h-10 bg-dark-700 rounded-lg animate-pulse" />
              )}
            </div>
            <div className="w-24 h-5 bg-dark-700 rounded animate-pulse" />
          </div>
        )}

        <SkeletonList
          count={columns * 3}
          variant="card"
          columns={columns}
          gap="md"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Filter Bar */}
      {(showCategoryFilter || showSortOptions) && (
        <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            {showCategoryFilter && categories && (
              <CategorySelect
                categories={categories}
                value={activeCategoryId}
                onChange={handleCategoryChange}
              />
            )}
            {showSortOptions && (
              <SortSelect value={sortBy} onChange={handleSortChange} />
            )}
          </div>

          {/* Series count */}
          <span className="text-sm text-gray-400">
            {processedSeries.length} {processedSeries.length === 1 ? 'series' : 'series'}
          </span>
        </div>
      )}

      {/* Series Grid */}
      {processedSeries.length === 0 ? (
        <EmptyState
          message={searchQuery ? `No series matching "${searchQuery}"` : 'No series available'}
        />
      ) : (
        <div className="flex-1 min-h-0">
          <VirtualGrid
            items={processedSeries}
            renderItem={renderSeries}
            columns={columns}
            rowHeight={rowHeight}
            gap={16}
            overscan={2}
            emptyComponent={<EmptyState />}
            loadingComponent={<Spinner size="lg" />}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// Simple Non-Virtualized Grid (for smaller lists)
// ============================================

export interface SimpleSeriesListProps {
  seriesList: Series[];
  columns?: number;
  onSeriesClick?: (series: Series) => void;
  onViewSeries?: (series: Series) => void;
  className?: string;
}

export function SimpleSeriesList({
  seriesList,
  columns = 4,
  onSeriesClick,
  onViewSeries,
  className,
}: SimpleSeriesListProps) {
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {seriesList.map((series) => (
        <SeriesCard
          key={series.series_id}
          series={series}
          onClick={onSeriesClick}
          onViewSeries={onViewSeries}
        />
      ))}
    </div>
  );
}

export default SeriesList;
