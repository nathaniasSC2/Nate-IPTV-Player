/**
 * MovieGrid Component
 * Grid display of movies with virtualization, filtering, and sorting
 */

import React, { useMemo, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { VirtualGrid, SkeletonList, Spinner } from '@/components/common';
import { MovieCard } from './MovieCard';
import { useVODStreams, useVODCategories } from '@/hooks';
import type { VODStream, VODCategory } from '@/services/xtream/types';

// ============================================
// Types
// ============================================

export type SortOption = 'name' | 'name_desc' | 'rating' | 'rating_desc' | 'year' | 'year_desc' | 'added' | 'added_desc';

export interface MovieGridProps {
  /** Category ID to filter movies (null for all) */
  categoryId?: string | null;
  /** Search query to filter movies */
  searchQuery?: string;
  /** Sort option */
  sortBy?: SortOption;
  /** Callback when a movie is clicked */
  onMovieClick?: (movie: VODStream) => void;
  /** Callback when "More Info" is clicked */
  onMovieMoreInfo?: (movie: VODStream) => void;
  /** Custom class name */
  className?: string;
  /** Number of columns (responsive handled internally if not provided) */
  columns?: number;
  /** Show loading state externally controlled */
  isLoading?: boolean;
  /** External movies data (if provided, ignores internal fetch) */
  movies?: VODStream[];
  /** Show category filter dropdown */
  showCategoryFilter?: boolean;
  /** Show sort dropdown */
  showSortOptions?: boolean;
}

// ============================================
// Sort Functions
// ============================================

function sortMovies(movies: VODStream[], sortBy: SortOption): VODStream[] {
  const sorted = [...movies];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'rating':
      return sorted.sort((a, b) => (a.rating_5based || 0) - (b.rating_5based || 0));
    case 'rating_desc':
      return sorted.sort((a, b) => (b.rating_5based || 0) - (a.rating_5based || 0));
    case 'year':
      return sorted.sort((a, b) => {
        const yearA = extractYearFromName(a.name) || 0;
        const yearB = extractYearFromName(b.name) || 0;
        return yearA - yearB;
      });
    case 'year_desc':
      return sorted.sort((a, b) => {
        const yearA = extractYearFromName(a.name) || 0;
        const yearB = extractYearFromName(b.name) || 0;
        return yearB - yearA;
      });
    case 'added':
      return sorted.sort((a, b) => {
        const addedA = parseInt(a.added, 10) || 0;
        const addedB = parseInt(b.added, 10) || 0;
        return addedA - addedB;
      });
    case 'added_desc':
      return sorted.sort((a, b) => {
        const addedA = parseInt(a.added, 10) || 0;
        const addedB = parseInt(b.added, 10) || 0;
        return addedB - addedA;
      });
    default:
      return sorted;
  }
}

function extractYearFromName(name: string): number | null {
  const match = name.match(/\((\d{4})\)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

function filterMovies(movies: VODStream[], searchQuery?: string): VODStream[] {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return movies;
  }

  const query = searchQuery.toLowerCase().trim();
  return movies.filter((movie) =>
    movie.name.toLowerCase().includes(query)
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
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

function SortSelect({ value, onChange, className }: SortSelectProps) {
  const options: { value: SortOption; label: string }[] = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'rating_desc', label: 'Rating (High-Low)' },
    { value: 'rating', label: 'Rating (Low-High)' },
    { value: 'year_desc', label: 'Year (Newest)' },
    { value: 'year', label: 'Year (Oldest)' },
    { value: 'added_desc', label: 'Recently Added' },
    { value: 'added', label: 'Oldest Added' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
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
  categories: VODCategory[];
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

function EmptyState({ message = 'No movies found' }: EmptyStateProps) {
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
          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
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

export function MovieGrid({
  categoryId,
  searchQuery,
  sortBy: externalSortBy,
  onMovieClick,
  onMovieMoreInfo,
  className,
  columns: customColumns,
  isLoading: externalLoading,
  movies: externalMovies,
  showCategoryFilter = false,
  showSortOptions = true,
}: MovieGridProps) {
  // Internal state
  const [internalSortBy, setInternalSortBy] = useState<SortOption>('name');
  const [internalCategoryId, setInternalCategoryId] = useState<string | null>(categoryId || null);

  const sortBy = externalSortBy ?? internalSortBy;
  const activeCategoryId = categoryId ?? internalCategoryId;

  // Data fetching
  const { data: fetchedMovies, isLoading: moviesLoading } = useVODStreams(
    activeCategoryId || undefined,
    { enabled: !externalMovies }
  );
  const { data: categories } = useVODCategories({
    enabled: showCategoryFilter,
  });

  // Responsive columns
  const columns = useResponsiveColumns(customColumns);

  // Calculate row height based on aspect ratio + content
  const rowHeight = useMemo(() => {
    // Card width (approximate) based on columns and gaps
    // Using poster aspect ratio of 2/3, plus ~80px for content
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const sidebarWidth = 256; // Approximate sidebar width
    const padding = 32; // Container padding
    const gapSize = 16;
    const availableWidth = containerWidth - sidebarWidth - padding;
    const cardWidth = (availableWidth - (columns - 1) * gapSize) / columns;
    const posterHeight = cardWidth * 1.5; // 2:3 aspect ratio
    return posterHeight + 100; // Content area
  }, [columns]);

  // Process movies
  const movies = externalMovies ?? fetchedMovies ?? [];
  const processedMovies = useMemo(() => {
    const filtered = filterMovies(movies, searchQuery);
    return sortMovies(filtered, sortBy);
  }, [movies, searchQuery, sortBy]);

  // Loading state
  const isLoading = externalLoading ?? moviesLoading;

  // Handlers
  const handleSortChange = useCallback((newSort: SortOption) => {
    setInternalSortBy(newSort);
  }, []);

  const handleCategoryChange = useCallback((newCategory: string | null) => {
    setInternalCategoryId(newCategory);
  }, []);

  // Render item
  const renderMovie = useCallback(
    (movie: VODStream) => (
      <MovieCard
        movie={movie}
        onClick={onMovieClick}
        onMoreInfo={onMovieMoreInfo}
        className="h-full"
      />
    ),
    [onMovieClick, onMovieMoreInfo]
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

          {/* Movie count */}
          <span className="text-sm text-gray-400">
            {processedMovies.length} {processedMovies.length === 1 ? 'movie' : 'movies'}
          </span>
        </div>
      )}

      {/* Movie Grid */}
      {processedMovies.length === 0 ? (
        <EmptyState
          message={searchQuery ? `No movies matching "${searchQuery}"` : 'No movies available'}
        />
      ) : (
        <div className="flex-1 min-h-0">
          <VirtualGrid
            items={processedMovies}
            renderItem={renderMovie}
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

export interface SimpleMovieGridProps {
  movies: VODStream[];
  columns?: number;
  onMovieClick?: (movie: VODStream) => void;
  onMovieMoreInfo?: (movie: VODStream) => void;
  className?: string;
}

export function SimpleMovieGrid({
  movies,
  columns = 4,
  onMovieClick,
  onMovieMoreInfo,
  className,
}: SimpleMovieGridProps) {
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {movies.map((movie) => (
        <MovieCard
          key={movie.stream_id}
          movie={movie}
          onClick={onMovieClick}
          onMoreInfo={onMovieMoreInfo}
        />
      ))}
    </div>
  );
}

export default MovieGrid;
