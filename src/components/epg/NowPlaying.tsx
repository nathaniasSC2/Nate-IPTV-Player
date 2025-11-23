/**
 * NowPlaying Component
 * "What's On Now" widget showing currently playing programs
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import {
  Play,
  Tv,
  Film,
  Newspaper,
  Trophy,
  Music,
  Clapperboard,
  Gamepad2,
  GraduationCap,
  Baby,
  RefreshCw,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useNowPlaying, getProgramProgress } from '@/hooks/useEPG';
import { ChannelLogo, Skeleton } from '@/components/common';
import type { EPGProgram, LiveStream } from '@/services/xtream/types';

// ============================================================================
// Types
// ============================================================================

export interface NowPlayingProps {
  /** List of channels to show */
  channels: LiveStream[];
  /** Callback when a channel is clicked to play */
  onChannelPlay?: (channel: LiveStream) => void;
  /** Callback when a program is clicked for details */
  onProgramClick?: (program: EPGProgram, channel: LiveStream) => void;
  /** Whether to group by category */
  groupByCategory?: boolean;
  /** Maximum items to show per category (when grouped) */
  maxPerCategory?: number;
  /** Maximum total items to show */
  maxItems?: number;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Whether to auto-refresh */
  autoRefresh?: boolean;
  /** Additional class name */
  className?: string;
}

export interface NowPlayingItemProps {
  channel: LiveStream;
  program: EPGProgram | null;
  onPlay?: () => void;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// Category Configuration
// ============================================================================

interface CategoryConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const categoryConfigs: Record<string, CategoryConfig> = {
  sports: {
    name: 'Sports',
    icon: Trophy,
    keywords: ['sport', 'football', 'soccer', 'basketball', 'tennis', 'f1', 'racing', 'nfl', 'nba', 'mlb', 'nhl'],
  },
  news: {
    name: 'News',
    icon: Newspaper,
    keywords: ['news', 'cnn', 'bbc', 'fox', 'msnbc', 'abc news', 'sky news'],
  },
  movies: {
    name: 'Movies',
    icon: Film,
    keywords: ['movie', 'film', 'cinema', 'hbo', 'showtime', 'starz'],
  },
  entertainment: {
    name: 'Entertainment',
    icon: Clapperboard,
    keywords: ['entertainment', 'comedy', 'drama', 'reality', 'talk show'],
  },
  music: {
    name: 'Music',
    icon: Music,
    keywords: ['music', 'mtv', 'vh1', 'concert'],
  },
  kids: {
    name: 'Kids',
    icon: Baby,
    keywords: ['kids', 'children', 'cartoon', 'disney', 'nick', 'pbs kids'],
  },
  documentary: {
    name: 'Documentary',
    icon: GraduationCap,
    keywords: ['documentary', 'discovery', 'national geographic', 'history'],
  },
  gaming: {
    name: 'Gaming',
    icon: Gamepad2,
    keywords: ['gaming', 'esports', 'twitch'],
  },
  other: {
    name: 'Other',
    icon: Tv,
    keywords: [],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function categorizeChannel(channel: LiveStream): string {
  const nameLower = channel.name.toLowerCase();

  for (const [category, config] of Object.entries(categoryConfigs)) {
    if (category === 'other') continue;

    if (config.keywords.some((keyword) => nameLower.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

function groupChannelsByCategory(
  channels: LiveStream[]
): Map<string, LiveStream[]> {
  const groups = new Map<string, LiveStream[]>();

  // Initialize all categories
  Object.keys(categoryConfigs).forEach((category) => {
    groups.set(category, []);
  });

  // Group channels
  channels.forEach((channel) => {
    const category = categorizeChannel(channel);
    const group = groups.get(category) || [];
    group.push(channel);
    groups.set(category, group);
  });

  // Remove empty categories
  groups.forEach((channels, category) => {
    if (channels.length === 0) {
      groups.delete(category);
    }
  });

  return groups;
}

// ============================================================================
// NowPlayingItem Component
// ============================================================================

export function NowPlayingItem({
  channel,
  program,
  onPlay,
  onClick,
  compact = false,
  className,
}: NowPlayingItemProps) {
  const [progress, setProgress] = useState(
    program ? getProgramProgress(program) : 0
  );

  // Update progress every minute
  useEffect(() => {
    if (!program) return;

    const interval = setInterval(() => {
      setProgress(getProgramProgress(program));
    }, 60000);

    return () => clearInterval(interval);
  }, [program]);

  const handleClick = useCallback(() => {
    if (program) {
      onClick?.();
    }
  }, [program, onClick]);

  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPlay?.();
    },
    [onPlay]
  );

  const timeRemaining = useMemo(() => {
    if (!program) return null;

    const endTime = new Date(program.stop_timestamp * 1000);
    const minutesRemaining = differenceInMinutes(endTime, new Date());

    if (minutesRemaining <= 0) return 'Ending';
    if (minutesRemaining < 60) return `${minutesRemaining}m left`;

    const hours = Math.floor(minutesRemaining / 60);
    const mins = minutesRemaining % 60;
    return `${hours}h ${mins}m left`;
  }, [program]);

  if (compact) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg',
          'hover:bg-dark-700 cursor-pointer transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          className
        )}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Channel logo */}
        <div className="flex-shrink-0 w-8 h-8">
          {channel.stream_icon ? (
            <ChannelLogo
              src={channel.stream_icon}
              name={channel.name}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full rounded bg-dark-600 flex items-center justify-center">
              <Tv className="w-4 h-4 text-gray-500" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">
            {program?.title || 'No program info'}
          </p>
          <p className="text-xs text-gray-500 truncate">{channel.name}</p>
        </div>

        {/* Play button */}
        <button
          onClick={handlePlay}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600 hover:bg-primary-500 flex items-center justify-center transition-colors"
          aria-label={`Play ${channel.name}`}
        >
          <Play className="w-3.5 h-3.5 text-white fill-current" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg',
        'bg-dark-800 border border-dark-700',
        'hover:bg-dark-700 hover:border-dark-600 cursor-pointer transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary-500',
        className
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Channel logo */}
      <div className="flex-shrink-0 w-12 h-12">
        {channel.stream_icon ? (
          <ChannelLogo
            src={channel.stream_icon}
            name={channel.name}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-dark-600 flex items-center justify-center">
            <Tv className="w-6 h-6 text-gray-500" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Channel name */}
        <p className="text-xs text-gray-500 mb-0.5">{channel.name}</p>

        {/* Program title */}
        <p className="font-medium text-gray-200 truncate">
          {program?.title || 'No program information'}
        </p>

        {/* Progress bar */}
        {program && (
          <div className="mt-2">
            <div className="w-full bg-dark-600 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                {format(new Date(program.start_timestamp * 1000), 'HH:mm')}
              </span>
              {timeRemaining && (
                <span className="text-xs text-gray-500">{timeRemaining}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Play button */}
      <button
        onClick={handlePlay}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-500 flex items-center justify-center transition-colors"
        aria-label={`Play ${channel.name}`}
      >
        <Play className="w-5 h-5 text-white fill-current" />
      </button>
    </div>
  );
}

// ============================================================================
// CategorySection Component
// ============================================================================

interface CategorySectionProps {
  category: string;
  channels: LiveStream[];
  epgData: Map<number, EPGProgram | null>;
  maxItems?: number;
  onChannelPlay?: (channel: LiveStream) => void;
  onProgramClick?: (program: EPGProgram, channel: LiveStream) => void;
  className?: string;
}

function CategorySection({
  category,
  channels,
  epgData,
  maxItems = 5,
  onChannelPlay,
  onProgramClick,
  className,
}: CategorySectionProps) {
  const config = categoryConfigs[category] || categoryConfigs.other;
  const Icon = config.icon;

  const displayChannels = channels.slice(0, maxItems);
  const hasMore = channels.length > maxItems;

  return (
    <div className={cn('', className)}>
      {/* Category header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-500" />
        <h4 className="font-medium text-gray-300">{config.name}</h4>
        <span className="text-xs text-gray-600">({channels.length})</span>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {displayChannels.map((channel) => {
          const program = epgData.get(channel.stream_id) || null;
          return (
            <NowPlayingItem
              key={channel.stream_id}
              channel={channel}
              program={program}
              onPlay={() => onChannelPlay?.(channel)}
              onClick={() => program && onProgramClick?.(program, channel)}
              compact
            />
          );
        })}
      </div>

      {/* Show more */}
      {hasMore && (
        <button className="mt-2 text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1">
          +{channels.length - maxItems} more
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// NowPlaying Component
// ============================================================================

export function NowPlaying({
  channels,
  onChannelPlay,
  onProgramClick,
  groupByCategory = true,
  maxPerCategory = 5,
  maxItems = 20,
  refreshInterval = 60000,
  autoRefresh = true,
  className,
}: NowPlayingProps) {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Get stream IDs for now playing data
  const streamIds = useMemo(
    () => channels.slice(0, maxItems).map((c) => c.stream_id),
    [channels, maxItems]
  );

  // Fetch now playing data
  const { data: epgData, isLoading, refetch } = useNowPlaying(streamIds, {
    enabled: channels.length > 0,
    refetchInterval: autoRefresh ? refreshInterval : undefined,
  });

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    refetch();
    setLastRefresh(new Date());
  }, [refetch]);

  // Group channels by category
  const groupedChannels = useMemo(() => {
    if (!groupByCategory) return null;
    return groupChannelsByCategory(channels.slice(0, maxItems));
  }, [channels, maxItems, groupByCategory]);

  // Flat list of channels with programs
  const channelsWithPrograms = useMemo(() => {
    if (groupByCategory) return null;

    return channels.slice(0, maxItems).map((channel) => ({
      channel,
      program: epgData?.get(channel.stream_id) || null,
    }));
  }, [channels, maxItems, groupByCategory, epgData]);

  // Empty state
  if (channels.length === 0) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <Tv className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No channels available</p>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-white">What's On Now</h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Updated {format(lastRefresh, 'HH:mm')}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={cn(
              'p-1.5 rounded-lg hover:bg-dark-700 transition-colors',
              isLoading && 'animate-spin'
            )}
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !epgData && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grouped view */}
      {groupByCategory && groupedChannels && !isLoading && (
        <div className="space-y-6">
          {Array.from(groupedChannels.entries())
            .filter(([_, channelList]) => channelList.length > 0)
            .map(([category, channelList]) => (
              <CategorySection
                key={category}
                category={category}
                channels={channelList}
                epgData={epgData || new Map()}
                maxItems={maxPerCategory}
                onChannelPlay={onChannelPlay}
                onProgramClick={onProgramClick}
              />
            ))}
        </div>
      )}

      {/* Flat view */}
      {!groupByCategory && channelsWithPrograms && !isLoading && (
        <div className="space-y-3">
          {channelsWithPrograms.map(({ channel, program }) => (
            <NowPlayingItem
              key={channel.stream_id}
              channel={channel}
              program={program}
              onPlay={() => onChannelPlay?.(channel)}
              onClick={() => program && onProgramClick?.(program, channel)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// NowPlayingCompact (Minimal widget version)
// ============================================================================

export interface NowPlayingCompactProps {
  channels: LiveStream[];
  maxItems?: number;
  onChannelPlay?: (channel: LiveStream) => void;
  onViewAll?: () => void;
  className?: string;
}

export function NowPlayingCompact({
  channels,
  maxItems = 5,
  onChannelPlay,
  onViewAll,
  className,
}: NowPlayingCompactProps) {
  const streamIds = useMemo(
    () => channels.slice(0, maxItems).map((c) => c.stream_id),
    [channels, maxItems]
  );

  const { data: epgData, isLoading } = useNowPlaying(streamIds);

  return (
    <div className={cn('bg-dark-800 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <h3 className="font-medium text-white text-sm">Live Now</h3>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary-500 hover:text-primary-400"
          >
            View All
          </button>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-dark-700">
        {isLoading
          ? Array.from({ length: maxItems }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-8 h-8 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
          : channels.slice(0, maxItems).map((channel) => {
              const program = epgData?.get(channel.stream_id) || null;
              return (
                <NowPlayingItem
                  key={channel.stream_id}
                  channel={channel}
                  program={program}
                  onPlay={() => onChannelPlay?.(channel)}
                  compact
                />
              );
            })}
      </div>

      {/* Footer */}
      {channels.length > maxItems && (
        <div className="px-4 py-2 border-t border-dark-700 text-center">
          <span className="text-xs text-gray-500">
            +{channels.length - maxItems} more channels
          </span>
        </div>
      )}
    </div>
  );
}

export default NowPlaying;
