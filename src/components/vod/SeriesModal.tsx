/**
 * SeriesModal Component
 * Detailed series information modal with season tabs and episode list
 */

import React, { useCallback, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import { Modal, LazyImage, Badge, BadgeGroup, Spinner, Tabs, TabList, Tab, TabPanel, TabPanels } from '@/components/common';
import { EpisodeList } from './EpisodeList';
import { useSeriesInfo } from '@/hooks';
import { useConnectionStore, useFavoritesStore, usePlayerStore } from '@/stores';
import type { Series, Episode, CurrentStream } from '@/services/xtream/types';

// ============================================
// Types
// ============================================

export interface SeriesModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** The series to display (basic info) */
  series: Series | null;
}

// ============================================
// Helper Functions
// ============================================

function getYoutubeVideoId(url?: string): string | null {
  if (!url) return null;

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

function getTotalEpisodeCount(episodes: { [seasonNumber: string]: Episode[] }): number {
  return Object.values(episodes).reduce((total, eps) => total + eps.length, 0);
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

export function SeriesModal({ isOpen, onClose, series }: SeriesModalProps) {
  const [selectedSeason, setSelectedSeason] = useState<string>('1');

  // Store hooks
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const isFavorite = useFavoritesStore((state) =>
    activeConnection && series
      ? state.isFavorite(activeConnection.id, series.series_id, 'series')
      : false
  );
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const play = usePlayerStore((state) => state.play);

  // Fetch detailed series info
  const { data: seriesInfo, isLoading } = useSeriesInfo(
    isOpen && series ? series.series_id : null
  );

  // Derived data
  const info = seriesInfo?.info;
  const seasons = seriesInfo?.seasons || [];
  const episodes = seriesInfo?.episodes || {};

  const rating = info?.rating_5based || series?.rating_5based || 0;
  const coverUrl = info?.cover || series?.cover || '';
  const backdropUrl = info?.backdrop_path?.[0] || '';
  const title = info?.name || series?.name || '';
  const plot = info?.plot || series?.plot || '';
  const genre = info?.genre || series?.genre || '';
  const director = info?.director || series?.director || '';
  const cast = info?.cast || series?.cast || '';
  const releaseDate = info?.release_date || series?.release_date || '';
  const episodeRunTime = info?.episode_run_time || series?.episode_run_time || '';

  const totalEpisodes = useMemo(() => getTotalEpisodeCount(episodes), [episodes]);
  const seasonCount = seasons.length || Object.keys(episodes).length;

  const youtubeVideoId = useMemo(() => {
    return getYoutubeVideoId(info?.youtube_trailer || series?.youtube_trailer);
  }, [info?.youtube_trailer, series?.youtube_trailer]);

  const releaseYear = useMemo(() => {
    if (releaseDate) {
      const match = releaseDate.match(/\d{4}/);
      if (match) return match[0];
    }
    return null;
  }, [releaseDate]);

  // Get season keys sorted
  const seasonKeys = useMemo(() => {
    const keys = Object.keys(episodes);
    return keys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [episodes]);

  // Select first season when data loads
  React.useEffect(() => {
    if (seasonKeys.length > 0 && !seasonKeys.includes(selectedSeason)) {
      setSelectedSeason(seasonKeys[0]);
    }
  }, [seasonKeys, selectedSeason]);

  // Handlers
  const handleToggleFavorite = useCallback(() => {
    if (!activeConnection || !series) return;

    if (isFavorite) {
      removeFavorite(activeConnection.id, series.series_id, 'series');
    } else {
      addFavorite(activeConnection.id, {
        streamId: series.series_id,
        streamType: 'series',
        name: title,
        icon: coverUrl,
        categoryId: series.category_id,
      });
    }
  }, [activeConnection, series, isFavorite, title, coverUrl, addFavorite, removeFavorite]);

  const handleWatchTrailer = useCallback(() => {
    if (youtubeVideoId) {
      window.open(`https://www.youtube.com/watch?v=${youtubeVideoId}`, '_blank');
    }
  }, [youtubeVideoId]);

  const handlePlayEpisode = useCallback((episode: Episode) => {
    if (!activeConnection || !series) return;

    const stream: CurrentStream = {
      id: parseInt(episode.id, 10),
      name: `${title} - S${episode.season}E${episode.episode_num} - ${episode.title}`,
      url: `${activeConnection.serverUrl}/series/${activeConnection.username}/${activeConnection.password}/${episode.id}.${episode.container_extension}`,
      type: 'series',
      icon: episode.info?.movie_image || episode.info?.cover_big || coverUrl,
      categoryId: series.category_id,
    };
    play(stream);
  }, [activeConnection, series, title, coverUrl, play]);

  const handleSeasonChange = useCallback((seasonNumber: string) => {
    setSelectedSeason(seasonNumber);
  }, []);

  if (!series) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showHeader={false}
      className="max-w-5xl max-h-[90vh] overflow-hidden"
    >
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header Section with Backdrop */}
          <div className="relative flex-shrink-0">
            {/* Backdrop Image */}
            {backdropUrl && (
              <div className="absolute inset-0 h-48 overflow-hidden">
                <LazyImage
                  src={backdropUrl}
                  alt=""
                  className="object-cover opacity-30"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-800 to-transparent" />
              </div>
            )}

            {/* Series Info */}
            <div className="relative flex gap-6 p-6 pb-4">
              {/* Cover Poster */}
              <div className="flex-shrink-0 w-40 md:w-48">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-dark-700 shadow-xl">
                  <LazyImage
                    src={coverUrl}
                    alt={title}
                    className="object-cover"
                    containerClassName="w-full h-full"
                    fallbackBgColor="bg-dark-700"
                  />
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>

                {/* Meta info row */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {releaseYear && <span className="text-gray-400">{releaseYear}</span>}
                  {seasonCount > 0 && (
                    <>
                      <span className="text-gray-600">|</span>
                      <span className="text-gray-400">{seasonCount} {seasonCount === 1 ? 'Season' : 'Seasons'}</span>
                    </>
                  )}
                  {totalEpisodes > 0 && (
                    <>
                      <span className="text-gray-600">|</span>
                      <span className="text-gray-400">{totalEpisodes} Episodes</span>
                    </>
                  )}
                  {episodeRunTime && (
                    <>
                      <span className="text-gray-600">|</span>
                      <span className="text-gray-400">{episodeRunTime} min/ep</span>
                    </>
                  )}
                  {rating > 0 && (
                    <>
                      <span className="text-gray-600">|</span>
                      <StarRating rating={rating} size="sm" />
                    </>
                  )}
                </div>

                {/* Genre Badges */}
                {genre && (
                  <BadgeGroup gap="sm">
                    {genre.split(/[,/]/).slice(0, 4).map((g, i) => (
                      <Badge key={i} variant="secondary" size="sm">
                        {g.trim()}
                      </Badge>
                    ))}
                  </BadgeGroup>
                )}

                {/* Plot/Description */}
                {plot && (
                  <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                    {plot}
                  </p>
                )}

                {/* Additional Info */}
                <div className="space-y-1 text-sm">
                  <InfoRow label="Director" value={director} />
                  <InfoRow label="Cast" value={cast} />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 mt-auto">
                  {/* Favorite Button */}
                  <button
                    onClick={handleToggleFavorite}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg',
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
                    {isFavorite ? 'Favorited' : 'Favorite'}
                  </button>

                  {/* Trailer Button */}
                  {youtubeVideoId && (
                    <button
                      onClick={handleWatchTrailer}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg',
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
          </div>

          {/* Episodes Section with Tabs */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-dark-700">
            {seasonKeys.length > 0 ? (
              <Tabs value={selectedSeason} onChange={handleSeasonChange}>
                {/* Season Tabs */}
                <div className="flex-shrink-0 px-6 pt-4 bg-dark-800">
                  <TabList variant="pills" className="flex-wrap gap-2">
                    {seasonKeys.map((seasonNum) => {
                      const episodeCount = episodes[seasonNum]?.length || 0;
                      const seasonInfo = seasons.find(s => s.season_number === parseInt(seasonNum, 10));
                      const seasonName = seasonInfo?.name || `Season ${seasonNum}`;

                      return (
                        <Tab key={seasonNum} value={seasonNum} variant="pills">
                          <span>{seasonName}</span>
                          <span className="ml-1.5 text-xs opacity-70">({episodeCount})</span>
                        </Tab>
                      );
                    })}
                  </TabList>
                </div>

                {/* Episode List */}
                <TabPanels className="flex-1 min-h-0 overflow-hidden">
                  {seasonKeys.map((seasonNum) => (
                    <TabPanel key={seasonNum} value={seasonNum} className="h-full">
                      <div className="h-full overflow-y-auto px-6 pb-6">
                        <EpisodeList
                          episodes={episodes[seasonNum] || []}
                          onPlayEpisode={handlePlayEpisode}
                          seriesTitle={title}
                        />
                      </div>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center py-12 text-gray-500">
                No episodes available
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default SeriesModal;
