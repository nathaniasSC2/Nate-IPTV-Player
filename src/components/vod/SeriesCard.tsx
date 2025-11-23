/**
 * SeriesCard Component
 * Card-based display for a TV series with cover, rating, and season/episode info
 */

import React, { useCallback, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import { LazyImage, Badge, BadgeGroup } from '@/components/common';
import { useConnectionStore, useFavoritesStore } from '@/stores';
import type { Series } from '@/services/xtream/types';

// ============================================
// Types
// ============================================

export interface SeriesCardProps {
  /** The series data */
  series: Series;
  /** Custom class name */
  className?: string;
  /** Whether the card is currently selected */
  isSelected?: boolean;
  /** Callback when card is clicked */
  onClick?: (series: Series) => void;
  /** Callback when "View Series" is clicked */
  onViewSeries?: (series: Series) => void;
}

// ============================================
// Helper Functions
// ============================================

function formatLastModified(timestamp?: string): string {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `Updated ${Math.floor(diffDays / 30)} months ago`;
  return `Updated ${Math.floor(diffDays / 365)} years ago`;
}

// ============================================
// Sub Components
// ============================================

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md';
}

function StarRating({ rating, maxRating = 5, size = 'sm' }: StarRatingProps) {
  const stars = [];
  const normalizedRating = Math.min(rating, maxRating);

  for (let i = 1; i <= maxRating; i++) {
    const isFilled = i <= Math.floor(normalizedRating);
    const isHalf = !isFilled && i === Math.ceil(normalizedRating) && normalizedRating % 1 >= 0.5;

    stars.push(
      <svg
        key={i}
        className={cn(
          size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
          isFilled ? 'text-yellow-400' : isHalf ? 'text-yellow-400/50' : 'text-gray-600'
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }

  return <div className="flex items-center gap-0.5">{stars}</div>;
}

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function FavoriteButton({ isFavorite, onClick }: FavoriteButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'absolute top-2 left-2 z-10',
        'w-7 h-7 rounded-full',
        'flex items-center justify-center',
        'transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        isFavorite
          ? 'bg-yellow-500 text-white'
          : 'bg-dark-800/80 text-gray-400 hover:text-yellow-500 hover:bg-dark-700/90'
      )}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className="w-4 h-4"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    </button>
  );
}

interface HoverOverlayProps {
  isVisible: boolean;
  onViewSeries: () => void;
}

function HoverOverlay({ isVisible, onViewSeries }: HoverOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-3',
        'bg-dark-900/80 transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* View Series Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewSeries();
        }}
        className={cn(
          'px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium',
          'flex items-center gap-2',
          'shadow-lg transform transition-all duration-200',
          'hover:scale-105 hover:bg-primary-500',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400'
        )}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        View Series
      </button>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function SeriesCard({
  series,
  className,
  isSelected = false,
  onClick,
  onViewSeries,
}: SeriesCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Store hooks
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const isFavorite = useFavoritesStore((state) =>
    activeConnection
      ? state.isFavorite(activeConnection.id, series.series_id, 'series')
      : false
  );
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);

  // Derived data
  const rating = series.rating_5based || 0;
  const lastUpdated = useMemo(() => formatLastModified(series.last_modified), [series.last_modified]);
  const releaseYear = useMemo(() => {
    if (series.release_date) {
      const match = series.release_date.match(/\d{4}/);
      if (match) return match[0];
    }
    return null;
  }, [series.release_date]);

  // Handlers
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(series);
    } else if (onViewSeries) {
      onViewSeries(series);
    }
  }, [series, onClick, onViewSeries]);

  const handleViewSeries = useCallback(() => {
    if (onViewSeries) {
      onViewSeries(series);
    }
  }, [series, onViewSeries]);

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!activeConnection) return;

      if (isFavorite) {
        removeFavorite(activeConnection.id, series.series_id, 'series');
      } else {
        addFavorite(activeConnection.id, {
          streamId: series.series_id,
          streamType: 'series',
          name: series.name,
          icon: series.cover,
          categoryId: series.category_id,
        });
      }
    },
    [activeConnection, series, isFavorite, addFavorite, removeFavorite]
  );

  return (
    <div
      className={cn(
        'group relative flex flex-col',
        'bg-dark-800 rounded-lg overflow-hidden',
        'border border-dark-700',
        'transition-all duration-200',
        'cursor-pointer',
        'hover:border-dark-600 hover:shadow-lg hover:shadow-dark-900/50',
        isSelected && 'ring-2 ring-primary-500 border-primary-500',
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`View ${series.name}`}
    >
      {/* Cover Container */}
      <div className="relative aspect-[2/3] bg-dark-900">
        <LazyImage
          src={series.cover}
          alt={series.name}
          className="object-cover"
          containerClassName="w-full h-full"
          fallbackBgColor="bg-dark-700"
        />

        {/* Favorite Button */}
        <FavoriteButton isFavorite={isFavorite} onClick={handleFavoriteClick} />

        {/* Hover Overlay */}
        <HoverOverlay isVisible={isHovered} onViewSeries={handleViewSeries} />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        {/* Series Title */}
        <h3 className="text-sm font-medium text-white truncate" title={series.name}>
          {series.name}
        </h3>

        {/* Rating and Year Row */}
        <div className="flex items-center justify-between gap-2">
          {rating > 0 ? (
            <div className="flex items-center gap-1">
              <StarRating rating={rating} size="sm" />
              <span className="text-xs text-gray-400">{rating.toFixed(1)}</span>
            </div>
          ) : (
            <span />
          )}

          {/* Year */}
          {releaseYear && (
            <span className="text-xs text-gray-500">{releaseYear}</span>
          )}
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <span className="text-xs text-gray-500 mt-0.5">{lastUpdated}</span>
        )}

        {/* Genre Badges */}
        {series.genre && (
          <BadgeGroup gap="xs" className="mt-1.5">
            {series.genre.split(/[,/]/).slice(0, 2).map((g, i) => (
              <Badge key={i} variant="secondary" size="xs">
                {g.trim()}
              </Badge>
            ))}
          </BadgeGroup>
        )}
      </div>
    </div>
  );
}

// ============================================
// Compact Series Card Variant
// ============================================

export interface SeriesCardCompactProps {
  series: Series;
  className?: string;
  isSelected?: boolean;
  onClick?: (series: Series) => void;
}

export function SeriesCardCompact({
  series,
  className,
  isSelected = false,
  onClick,
}: SeriesCardCompactProps) {
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const isFavorite = useFavoritesStore((state) =>
    activeConnection
      ? state.isFavorite(activeConnection.id, series.series_id, 'series')
      : false
  );

  const rating = series.rating_5based || 0;

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(series);
    }
  }, [series, onClick]);

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 p-2',
        'bg-dark-800 rounded-lg',
        'border border-dark-700',
        'transition-all duration-200',
        'cursor-pointer',
        'hover:border-dark-600 hover:bg-dark-750',
        isSelected && 'ring-2 ring-primary-500 border-primary-500',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Cover Thumbnail */}
      <div className="relative w-12 h-16 flex-shrink-0">
        <LazyImage
          src={series.cover}
          alt={series.name}
          className="object-cover rounded"
          containerClassName="w-full h-full rounded bg-dark-700"
          fallbackBgColor="bg-dark-700"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white truncate block">{series.name}</span>
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <StarRating rating={rating} size="sm" />
            <span className="text-xs text-gray-400">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Favorite Icon */}
      {isFavorite && (
        <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )}
    </div>
  );
}

export default SeriesCard;
