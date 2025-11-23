/**
 * EpisodeList Component
 * List of episodes for a season with thumbnails, info, and play controls
 */

import React, { useCallback, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { LazyImage, ProgressBar } from '@/components/common';
import type { Episode } from '@/services/xtream/types';

// ============================================
// Types
// ============================================

export interface EpisodeListProps {
  /** Array of episodes to display */
  episodes: Episode[];
  /** Callback when play button is clicked */
  onPlayEpisode: (episode: Episode) => void;
  /** Series title for display */
  seriesTitle?: string;
  /** Watch progress map (episodeId -> progress 0-100) */
  watchProgress?: { [episodeId: string]: number };
  /** Custom class name */
  className?: string;
}

export interface EpisodeItemProps {
  /** Episode data */
  episode: Episode;
  /** Episode index (for display) */
  index: number;
  /** Callback when play button is clicked */
  onPlay: (episode: Episode) => void;
  /** Series title */
  seriesTitle?: string;
  /** Watch progress (0-100) */
  progress?: number;
  /** Custom class name */
  className?: string;
}

// ============================================
// Helper Functions
// ============================================

function formatDuration(durationSecs?: number, durationStr?: string): string {
  if (durationStr) {
    return durationStr;
  }

  if (durationSecs) {
    const hours = Math.floor(durationSecs / 3600);
    const minutes = Math.floor((durationSecs % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  return '';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncatePlot(plot: string, maxLength: number = 150): string {
  if (!plot || plot.length <= maxLength) return plot;
  return plot.substring(0, maxLength).trim() + '...';
}

// ============================================
// Episode Item Component
// ============================================

export function EpisodeItem({
  episode,
  index,
  onPlay,
  seriesTitle,
  progress,
  className,
}: EpisodeItemProps) {
  const handleClick = useCallback(() => {
    onPlay(episode);
  }, [episode, onPlay]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPlay(episode);
      }
    },
    [episode, onPlay]
  );

  // Episode info
  const episodeNum = episode.episode_num || index + 1;
  const title = episode.title || `Episode ${episodeNum}`;
  const plot = episode.info?.plot || '';
  const thumbnail = episode.info?.movie_image || episode.info?.cover_big || '';
  const duration = formatDuration(episode.info?.duration_secs, episode.info?.duration);
  const airDate = formatDate(episode.info?.release_date);
  const rating = episode.info?.rating;
  const seasonNum = episode.season;

  const hasWatched = progress !== undefined && progress >= 90;
  const isPartiallyWatched = progress !== undefined && progress > 0 && progress < 90;

  return (
    <div
      className={cn(
        'group flex gap-4 p-3',
        'bg-dark-800 rounded-lg',
        'border border-dark-700',
        'transition-all duration-200',
        'cursor-pointer',
        'hover:border-dark-600 hover:bg-dark-750',
        hasWatched && 'opacity-75',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Play ${seriesTitle ? `${seriesTitle} - ` : ''}S${seasonNum}E${episodeNum} - ${title}`}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-40 md:w-48">
        <div className="relative aspect-video rounded-md overflow-hidden bg-dark-700">
          {thumbnail ? (
            <LazyImage
              src={thumbnail}
              alt={title}
              className="object-cover"
              containerClassName="w-full h-full"
              fallbackBgColor="bg-dark-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark-700">
              <svg
                className="w-8 h-8 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Play overlay */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-dark-900/60 transition-opacity duration-200',
              'opacity-0 group-hover:opacity-100'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-dark-900/80 text-xs text-gray-300">
              {duration}
            </div>
          )}

          {/* Watch progress indicator */}
          {isPartiallyWatched && progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0">
              <ProgressBar value={progress} size="sm" variant="primary" animated={false} />
            </div>
          )}

          {/* Watched checkmark */}
          {hasWatched && (
            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Episode Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Episode number and title */}
        <div className="flex items-start gap-2">
          <span className="text-primary-500 font-semibold text-sm flex-shrink-0">
            {episodeNum}.
          </span>
          <h4 className="text-white font-medium text-sm line-clamp-1 flex-1">
            {title}
          </h4>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {airDate && <span>{airDate}</span>}
          {rating && (
            <>
              {airDate && <span className="text-gray-700">|</span>}
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {rating}
              </span>
            </>
          )}
        </div>

        {/* Plot snippet */}
        {plot && (
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mt-1">
            {truncatePlot(plot, 200)}
          </p>
        )}
      </div>

      {/* Play button (visible on hover) */}
      <div className="flex-shrink-0 flex items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(episode);
          }}
          className={cn(
            'p-2 rounded-full',
            'bg-dark-700 text-gray-400',
            'opacity-0 group-hover:opacity-100',
            'transition-all duration-200',
            'hover:bg-primary-600 hover:text-white',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
          )}
          aria-label={`Play episode ${episodeNum}`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Episode List Component
// ============================================

export function EpisodeList({
  episodes,
  onPlayEpisode,
  seriesTitle,
  watchProgress = {},
  className,
}: EpisodeListProps) {
  // Sort episodes by episode number
  const sortedEpisodes = useMemo(() => {
    return [...episodes].sort((a, b) => (a.episode_num || 0) - (b.episode_num || 0));
  }, [episodes]);

  if (episodes.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <svg
          className="w-12 h-12 text-gray-600 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p className="text-gray-400 font-medium">No episodes available</p>
        <p className="text-gray-500 text-sm mt-1">Check back later for new episodes</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Episode Count Header */}
      <div className="flex items-center justify-between py-2">
        <h3 className="text-sm font-medium text-gray-400">
          {sortedEpisodes.length} {sortedEpisodes.length === 1 ? 'Episode' : 'Episodes'}
        </h3>
      </div>

      {/* Episode Items */}
      {sortedEpisodes.map((episode, index) => (
        <EpisodeItem
          key={episode.id || index}
          episode={episode}
          index={index}
          onPlay={onPlayEpisode}
          seriesTitle={seriesTitle}
          progress={watchProgress[episode.id]}
        />
      ))}
    </div>
  );
}

// ============================================
// Compact Episode List Variant
// ============================================

export interface CompactEpisodeListProps {
  episodes: Episode[];
  onPlayEpisode: (episode: Episode) => void;
  className?: string;
}

export function CompactEpisodeList({
  episodes,
  onPlayEpisode,
  className,
}: CompactEpisodeListProps) {
  const sortedEpisodes = useMemo(() => {
    return [...episodes].sort((a, b) => (a.episode_num || 0) - (b.episode_num || 0));
  }, [episodes]);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {sortedEpisodes.map((episode, index) => {
        const episodeNum = episode.episode_num || index + 1;
        const title = episode.title || `Episode ${episodeNum}`;
        const duration = formatDuration(episode.info?.duration_secs, episode.info?.duration);

        return (
          <button
            key={episode.id || index}
            onClick={() => onPlayEpisode(episode)}
            className={cn(
              'flex items-center gap-3 px-3 py-2',
              'text-left',
              'rounded-md',
              'transition-colors duration-200',
              'hover:bg-dark-700',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset'
            )}
          >
            <span className="text-primary-500 font-medium text-sm w-8">
              {episodeNum}
            </span>
            <span className="flex-1 text-gray-200 text-sm truncate">
              {title}
            </span>
            {duration && (
              <span className="text-gray-500 text-xs flex-shrink-0">
                {duration}
              </span>
            )}
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default EpisodeList;
