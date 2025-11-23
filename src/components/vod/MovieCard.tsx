/**
 * MovieCard Component
 * Card-based display for a VOD movie with poster, rating, and controls
 */

import React, { useCallback, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import { LazyImage, Badge } from '@/components/common';
import { useConnectionStore, useFavoritesStore, usePlayerStore } from '@/stores';
import type { VODStream, CurrentStream } from '@/services/xtream/types';
import {
  transitions,
  iconSizes,
  componentSpacing,
  cardStyles,
  focusStyles,
  overlays,
  shadows,
} from '@/styles/theme';

// ============================================
// Types
// ============================================

export interface MovieCardProps {
  /** The movie/VOD stream data */
  movie: VODStream;
  /** Custom class name */
  className?: string;
  /** Whether the card is currently selected */
  isSelected?: boolean;
  /** Callback when card is clicked */
  onClick?: (movie: VODStream) => void;
  /** Callback when "More Info" is clicked */
  onMoreInfo?: (movie: VODStream) => void;
}

// ============================================
// Quality Detection
// ============================================

type QualityType = '4k' | 'fhd' | 'hd' | null;

function detectQuality(name: string): QualityType {
  const upperName = name.toUpperCase();

  if (
    upperName.includes('4K') ||
    upperName.includes('UHD') ||
    upperName.includes('2160P')
  ) {
    return '4k';
  }

  if (
    upperName.includes('FHD') ||
    upperName.includes('FULL HD') ||
    upperName.includes('1080P') ||
    upperName.includes('1080I')
  ) {
    return 'fhd';
  }

  if (
    upperName.includes(' HD') ||
    upperName.includes('HD ') ||
    upperName.includes('[HD]') ||
    upperName.includes('(HD)') ||
    upperName.includes('720P')
  ) {
    return 'hd';
  }

  return null;
}

// ============================================
// Year Extraction
// ============================================

function extractYear(name: string, added?: string): string | null {
  // Try to extract year from name (e.g., "Movie Name (2023)")
  const yearMatch = name.match(/\((\d{4})\)/);
  if (yearMatch) {
    return yearMatch[1];
  }

  // Try to extract from added timestamp
  if (added) {
    const timestamp = parseInt(added, 10);
    if (!isNaN(timestamp)) {
      const date = new Date(timestamp * 1000);
      return date.getFullYear().toString();
    }
  }

  return null;
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
          size === 'sm' ? iconSizes.xs : iconSizes.sm,
          isFilled ? 'text-yellow-400' : isHalf ? 'text-yellow-400/50' : 'text-gray-600',
          transitions.colors
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }

  return <div className={cn('flex items-center', componentSpacing.gapXs)}>{stars}</div>;
}

interface QualityBadgeDisplayProps {
  quality: QualityType;
}

function QualityBadgeDisplay({ quality }: QualityBadgeDisplayProps) {
  if (!quality) return null;

  const badgeProps = {
    '4k': { variant: '4k' as const, label: '4K' },
    'fhd': { variant: 'fhd' as const, label: 'FHD' },
    'hd': { variant: 'hd' as const, label: 'HD' },
  }[quality];

  return (
    <Badge variant={badgeProps.variant} size="xs">
      {badgeProps.label}
    </Badge>
  );
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
        transitions.all,
        focusStyles.ring,
        'backdrop-blur-sm',
        isFavorite
          ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
          : 'bg-dark-800/80 text-gray-400 hover:text-yellow-500 hover:bg-dark-700/90 hover:scale-110'
      )}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className={iconSizes.sm}
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
  onPlay: () => void;
  onMoreInfo: () => void;
}

function HoverOverlay({ isVisible, onPlay, onMoreInfo }: HoverOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center',
        componentSpacing.gapLg,
        overlays.dark,
        transitions.opacity,
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Play Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        className={cn(
          'w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center',
          shadows.card,
          transitions.all,
          'hover:scale-110 hover:bg-primary-500',
          focusStyles.ring
        )}
        aria-label="Play movie"
      >
        <svg className={cn('w-7 h-7 text-white ml-1')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      {/* More Info Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMoreInfo();
        }}
        className={cn(
          'px-4 py-1.5 rounded-full bg-dark-700/80 text-white text-sm font-medium',
          'border border-gray-600',
          'backdrop-blur-sm',
          transitions.all,
          'hover:bg-dark-600 hover:border-gray-500',
          focusStyles.ring
        )}
      >
        More Info
      </button>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function MovieCard({
  movie,
  className,
  isSelected = false,
  onClick,
  onMoreInfo,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Store hooks
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const isFavorite = useFavoritesStore((state) =>
    activeConnection
      ? state.isFavorite(activeConnection.id, movie.stream_id, 'movie')
      : false
  );
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const play = usePlayerStore((state) => state.play);

  // Derived data
  const quality = useMemo(() => detectQuality(movie.name), [movie.name]);
  const year = useMemo(() => extractYear(movie.name, movie.added), [movie.name, movie.added]);
  const rating = movie.rating_5based || 0;

  // Handlers
  const handlePlay = useCallback(() => {
    if (!activeConnection) return;

    const stream: CurrentStream = {
      id: movie.stream_id,
      name: movie.name,
      url: `${activeConnection.serverUrl}/movie/${activeConnection.username}/${activeConnection.password}/${movie.stream_id}.${movie.container_extension}`,
      type: 'movie',
      icon: movie.stream_icon,
      categoryId: movie.category_id,
    };
    play(stream);
  }, [movie, activeConnection, play]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(movie);
    } else {
      handlePlay();
    }
  }, [movie, onClick, handlePlay]);

  const handleMoreInfo = useCallback(() => {
    if (onMoreInfo) {
      onMoreInfo(movie);
    }
  }, [movie, onMoreInfo]);

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!activeConnection) return;

      if (isFavorite) {
        removeFavorite(activeConnection.id, movie.stream_id, 'movie');
      } else {
        addFavorite(activeConnection.id, {
          streamId: movie.stream_id,
          streamType: 'movie',
          name: movie.name,
          icon: movie.stream_icon,
          categoryId: movie.category_id,
        });
      }
    },
    [activeConnection, movie, isFavorite, addFavorite, removeFavorite]
  );

  return (
    <div
      className={cn(
        'group relative flex flex-col',
        cardStyles.interactive,
        'overflow-hidden',
        focusStyles.ringOffset,
        'hover:translate-y-[-2px]',
        isSelected && cardStyles.selected,
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
      aria-label={`Play ${movie.name}`}
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] bg-dark-900">
        <LazyImage
          src={movie.stream_icon}
          alt={movie.name}
          className="object-cover"
          containerClassName="w-full h-full"
          fallbackBgColor="bg-dark-700"
        />

        {/* Quality Badge */}
        {quality && (
          <div className="absolute top-2 right-2">
            <QualityBadgeDisplay quality={quality} />
          </div>
        )}

        {/* Favorite Button */}
        <FavoriteButton isFavorite={isFavorite} onClick={handleFavoriteClick} />

        {/* Hover Overlay */}
        <HoverOverlay
          isVisible={isHovered}
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
        />
      </div>

      {/* Content */}
      <div className={cn('flex flex-col flex-1', componentSpacing.cardPadding, componentSpacing.gapSm)}>
        {/* Movie Title */}
        <h3 className="text-sm font-medium text-white truncate leading-snug" title={movie.name}>
          {movie.name}
        </h3>

        {/* Rating and Year Row */}
        <div className={cn('flex items-center justify-between', componentSpacing.gapMd)}>
          <div className={cn('flex items-center', componentSpacing.gapMd)}>
            {rating > 0 && (
              <div className={cn('flex items-center', componentSpacing.gapXs)}>
                <StarRating rating={rating} size="sm" />
                <span className="text-xs text-gray-400 leading-snug">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Year */}
          {year && (
            <span className="text-xs text-gray-500 leading-snug">{year}</span>
          )}
        </div>

        {/* Badges - Hidden to avoid duplication (quality badge is on poster) */}
      </div>
    </div>
  );
}

// ============================================
// Compact Movie Card Variant
// ============================================

export interface MovieCardCompactProps {
  movie: VODStream;
  className?: string;
  isSelected?: boolean;
  onClick?: (movie: VODStream) => void;
}

export function MovieCardCompact({
  movie,
  className,
  isSelected = false,
  onClick,
}: MovieCardCompactProps) {
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const isFavorite = useFavoritesStore((state) =>
    activeConnection
      ? state.isFavorite(activeConnection.id, movie.stream_id, 'movie')
      : false
  );
  const play = usePlayerStore((state) => state.play);

  const quality = useMemo(() => detectQuality(movie.name), [movie.name]);
  const rating = movie.rating_5based || 0;

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(movie);
    } else if (activeConnection) {
      const stream: CurrentStream = {
        id: movie.stream_id,
        name: movie.name,
        url: `${activeConnection.serverUrl}/movie/${activeConnection.username}/${activeConnection.password}/${movie.stream_id}.${movie.container_extension}`,
        type: 'movie',
        icon: movie.stream_icon,
        categoryId: movie.category_id,
      };
      play(stream);
    }
  }, [movie, activeConnection, onClick, play]);

  return (
    <div
      className={cn(
        'group relative flex items-center',
        componentSpacing.gapLg,
        'p-2.5',
        cardStyles.base,
        transitions.all,
        'cursor-pointer',
        focusStyles.ring,
        'hover:border-dark-600 hover:bg-dark-750',
        isSelected && cardStyles.selected,
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
      {/* Poster Thumbnail */}
      <div className="relative w-12 h-16 flex-shrink-0">
        <LazyImage
          src={movie.stream_icon}
          alt={movie.name}
          className="object-cover rounded"
          containerClassName="w-full h-full rounded bg-dark-700"
          fallbackBgColor="bg-dark-700"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white truncate block leading-snug">{movie.name}</span>
        {rating > 0 && (
          <div className={cn('flex items-center mt-0.5', componentSpacing.gapXs)}>
            <StarRating rating={rating} size="sm" />
            <span className="text-xs text-gray-400 leading-snug">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className={cn('flex items-center flex-shrink-0', componentSpacing.gapSm)}>
        {isFavorite && (
          <svg className={cn(iconSizes.sm, 'text-yellow-500')} fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        )}
        {quality && (
          <Badge
            variant={quality === '4k' ? '4k' : quality === 'fhd' ? 'fhd' : 'hd'}
            size="xs"
          >
            {quality.toUpperCase()}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default MovieCard;
