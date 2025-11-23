/**
 * MovieModal Component
 * Detailed movie information modal with play and trailer options
 */

import { useCallback, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Modal, LazyImage, Badge, BadgeGroup, Spinner } from '@/components/common';
import { useVODInfo } from '@/hooks';
import { useConnectionStore, useFavoritesStore, usePlayerStore } from '@/stores';
import type { VODStream, CurrentStream } from '@/services/xtream/types';

// ============================================
// Types
// ============================================

export interface MovieModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** The movie to display (basic info) */
  movie: VODStream | null;
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

function extractYear(releaseDate?: string, name?: string): string | null {
  if (releaseDate) {
    const match = releaseDate.match(/\d{4}/);
    if (match) return match[0];
  }

  if (name) {
    const match = name.match(/\((\d{4})\)/);
    if (match) return match[1];
  }

  return null;
}

function getYoutubeVideoId(url?: string): string | null {
  if (!url) return null;

  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// ============================================
// Star Rating Component
// ============================================

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

function StarRating({ rating, maxRating = 5, size = 'md', showValue = true }: StarRatingProps) {
  const stars = [];
  const normalizedRating = Math.min(rating, maxRating);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  for (let i = 1; i <= maxRating; i++) {
    const isFilled = i <= Math.floor(normalizedRating);
    const isHalf = !isFilled && i === Math.ceil(normalizedRating) && normalizedRating % 1 >= 0.5;

    stars.push(
      <svg
        key={i}
        className={cn(
          sizeClasses[size],
          isFilled ? 'text-yellow-400' : isHalf ? 'text-yellow-400/50' : 'text-gray-600'
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">{stars}</div>
      {showValue && (
        <span className="text-gray-400 text-sm">{normalizedRating.toFixed(1)}</span>
      )}
    </div>
  );
}

// ============================================
// Info Row Component
// ============================================

interface InfoRowProps {
  label: string;
  value: string | undefined;
}

function InfoRow({ label, value }: InfoRowProps) {
  if (!value) return null;

  return (
    <div className="flex gap-2">
      <span className="text-gray-500 font-medium min-w-[80px]">{label}:</span>
      <span className="text-gray-300 flex-1">{value}</span>
    </div>
  );
}

// ============================================
// Loading State Component
// ============================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner size="xl" />
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function MovieModal({ isOpen, onClose, movie }: MovieModalProps) {
  // Store hooks
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const isFavorite = useFavoritesStore((state) =>
    activeConnection && movie
      ? state.isFavorite(activeConnection.id, movie.stream_id, 'movie')
      : false
  );
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const play = usePlayerStore((state) => state.play);

  // Fetch detailed movie info
  const { data: movieInfo, isLoading } = useVODInfo(
    isOpen && movie ? movie.stream_id : null
  );

  // Derived data
  const info = movieInfo?.info;
  const movieData = movieInfo?.movie_data;

  const year = useMemo(() => {
    return extractYear(info?.release_date, movie?.name);
  }, [info?.release_date, movie?.name]);

  const duration = useMemo(() => {
    return formatDuration(info?.duration_secs, info?.duration);
  }, [info?.duration_secs, info?.duration]);

  const rating = movie?.rating_5based || 0;

  const youtubeVideoId = useMemo(() => {
    return getYoutubeVideoId(info?.youtube_trailer);
  }, [info?.youtube_trailer]);

  const posterUrl = info?.cover_big || info?.movie_image || movie?.stream_icon || '';
  const title = info?.name || movie?.name || '';
  const plot = info?.plot || info?.description || '';
  const genre = info?.genre || '';
  const director = info?.director || '';
  const cast = info?.cast || info?.actors || '';
  const country = info?.country || '';

  // Video quality detection
  const videoQuality = useMemo(() => {
    if (info?.video?.height) {
      const height = info.video.height;
      if (height >= 2160) return '4K';
      if (height >= 1080) return 'FHD';
      if (height >= 720) return 'HD';
      return 'SD';
    }
    return null;
  }, [info?.video?.height]);

  // Handlers
  const handlePlay = useCallback(() => {
    if (!activeConnection || !movie) return;

    const extension = movieData?.container_extension || movie.container_extension || 'mp4';
    const stream: CurrentStream = {
      id: movie.stream_id,
      name: title,
      url: `${activeConnection.serverUrl}/movie/${activeConnection.username}/${activeConnection.password}/${movie.stream_id}.${extension}`,
      type: 'movie',
      icon: posterUrl,
      categoryId: movie.category_id,
    };
    play(stream);
    onClose();
  }, [activeConnection, movie, movieData, title, posterUrl, play, onClose]);

  const handleToggleFavorite = useCallback(() => {
    if (!activeConnection || !movie) return;

    if (isFavorite) {
      removeFavorite(activeConnection.id, movie.stream_id, 'movie');
    } else {
      addFavorite(activeConnection.id, {
        streamId: movie.stream_id,
        streamType: 'movie',
        name: title,
        icon: posterUrl,
        categoryId: movie.category_id,
      });
    }
  }, [activeConnection, movie, isFavorite, title, posterUrl, addFavorite, removeFavorite]);

  const handleWatchTrailer = useCallback(() => {
    if (youtubeVideoId) {
      window.open(`https://www.youtube.com/watch?v=${youtubeVideoId}`, '_blank');
    }
  }, [youtubeVideoId]);

  if (!movie) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showHeader={false}
      className="max-w-4xl"
    >
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster Section */}
          <div className="flex-shrink-0 w-full md:w-72">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-dark-700">
              <LazyImage
                src={posterUrl}
                alt={title}
                className="object-cover"
                containerClassName="w-full h-full"
                fallbackBgColor="bg-dark-700"
              />

              {/* Quality Badge */}
              {videoQuality && (
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={videoQuality === '4K' ? '4k' : videoQuality === 'FHD' ? 'fhd' : 'hd'}
                    size="sm"
                  >
                    {videoQuality}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>

              {/* Meta info row */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                {year && <span className="text-gray-400">{year}</span>}
                {duration && (
                  <>
                    <span className="text-gray-600">|</span>
                    <span className="text-gray-400">{duration}</span>
                  </>
                )}
                {rating > 0 && (
                  <>
                    <span className="text-gray-600">|</span>
                    <StarRating rating={rating} size="sm" />
                  </>
                )}
              </div>
            </div>

            {/* Genre Badges */}
            {genre && (
              <BadgeGroup gap="sm">
                {genre.split(/[,/]/).map((g, i) => (
                  <Badge key={i} variant="secondary" size="sm">
                    {g.trim()}
                  </Badge>
                ))}
              </BadgeGroup>
            )}

            {/* Plot/Description */}
            {plot && (
              <div className="text-gray-300 text-sm leading-relaxed">
                {plot}
              </div>
            )}

            {/* Additional Info */}
            <div className="space-y-2 text-sm">
              <InfoRow label="Director" value={director} />
              <InfoRow label="Cast" value={cast} />
              <InfoRow label="Country" value={country} />
            </div>

            {/* Video/Audio Info */}
            {info?.video && (
              <div className="text-xs text-gray-500 mt-2">
                <span>
                  Video: {info.video.codec_name?.toUpperCase()} {info.video.width}x{info.video.height}
                </span>
                {info.audio && (
                  <span className="ml-4">
                    Audio: {info.audio.codec_name?.toUpperCase()} {info.audio.channels}ch
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-auto pt-4">
              {/* Play Button */}
              <button
                onClick={handlePlay}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-lg',
                  'bg-primary-600 hover:bg-primary-500 text-white',
                  'font-semibold text-base',
                  'transition-colors duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400'
                )}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play
              </button>

              {/* Favorite Button */}
              <button
                onClick={handleToggleFavorite}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-lg',
                  'border transition-colors duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
                  isFavorite
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                    : 'bg-dark-700 border-dark-600 text-gray-300 hover:border-dark-500 hover:text-white'
                )}
              >
                <svg
                  className="w-5 h-5"
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
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </button>

              {/* Trailer Button */}
              {youtubeVideoId && (
                <button
                  onClick={handleWatchTrailer}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-lg',
                    'bg-red-600 hover:bg-red-500 text-white',
                    'transition-colors duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400'
                  )}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                  Trailer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default MovieModal;
