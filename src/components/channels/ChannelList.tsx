/**
 * ChannelList Component
 * Virtualized list view for channels optimized for 10,000+ items
 */

import React, { useCallback, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { VirtualList, LazyImage, ProgressBar, Spinner } from '@/components/common';
import { Badge } from '@/components/common';
import { useNowPlaying, getProgramProgress } from '@/hooks';
import { useConnectionStore, useFavoritesStore, usePlayerStore } from '@/stores';
import type { LiveStream, CurrentStream, EPGProgram } from '@/services/xtream/types';

// ============================================
// Types
// ============================================

export interface ChannelListProps {
  /** Array of channels to display */
  channels: LiveStream[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Currently selected channel ID */
  selectedChannelId?: number;
  /** Callback when channel is clicked */
  onChannelClick?: (channel: LiveStream) => void;
  /** Callback when reaching end of list (for infinite scroll) */
  onEndReached?: () => void;
  /** Custom class name */
  className?: string;
  /** Row height in pixels */
  rowHeight?: number;
  /** Show EPG information */
  showEPG?: boolean;
  /** Show channel numbers */
  showNumbers?: boolean;
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
// Channel Row Component
// ============================================

interface ChannelRowProps {
  channel: LiveStream;
  index: number;
  isSelected: boolean;
  isFavorite: boolean;
  currentProgram?: EPGProgram | null;
  nextProgram?: EPGProgram | null;
  progress: number;
  showEPG: boolean;
  showNumbers: boolean;
  onClick: () => void;
  onFavoriteToggle: () => void;
}

const ChannelRow = React.memo<ChannelRowProps>(function ChannelRow({
  channel,
  index,
  isSelected,
  isFavorite,
  currentProgram,
  nextProgram,
  progress,
  showEPG,
  showNumbers,
  onClick,
  onFavoriteToggle,
}) {
  const quality = useMemo(() => detectQuality(channel.name), [channel.name]);

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onFavoriteToggle();
    },
    [onFavoriteToggle]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 h-full',
        'bg-dark-800 border-b border-dark-700',
        'transition-colors duration-150',
        'cursor-pointer select-none',
        'hover:bg-dark-750',
        isSelected && 'bg-dark-700 border-l-2 border-l-primary-500'
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
    >
      {/* Channel Number */}
      {showNumbers && (
        <span className="w-8 text-xs text-gray-500 text-right flex-shrink-0">
          {index + 1}
        </span>
      )}

      {/* Logo */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <LazyImage
          src={channel.stream_icon}
          alt={channel.name}
          className="object-contain rounded"
          containerClassName="w-full h-full rounded bg-dark-700"
          fallbackBgColor="bg-dark-700"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        {/* Channel Name Row */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate flex-1">
            {channel.name}
          </span>

          {/* Quality Badge */}
          {quality && (
            <Badge
              variant={quality === '4k' ? '4k' : quality === 'fhd' ? 'fhd' : 'hd'}
              size="xs"
              className="flex-shrink-0"
            >
              {quality.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* EPG Info Row */}
        {showEPG && (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {currentProgram ? (
                <p className="text-xs text-gray-400 truncate">
                  <span className="text-primary-400">Now:</span> {currentProgram.title}
                </p>
              ) : (
                <p className="text-xs text-gray-500 italic">No program info</p>
              )}
            </div>

            {nextProgram && (
              <div className="hidden sm:block flex-1 min-w-0">
                <p className="text-xs text-gray-500 truncate">
                  <span className="text-gray-400">Next:</span> {nextProgram.title}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {showEPG && currentProgram && (
          <div className="w-full max-w-xs">
            <ProgressBar value={progress} size="sm" variant="primary" animated={false} />
          </div>
        )}
      </div>

      {/* Favorite Button */}
      <button
        className={cn(
          'p-1.5 rounded-full flex-shrink-0',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          isFavorite
            ? 'text-yellow-500 hover:text-yellow-400'
            : 'text-gray-500 hover:text-yellow-500'
        )}
        onClick={handleFavoriteClick}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
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
      </button>

      {/* Play Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full',
          'flex items-center justify-center',
          'bg-dark-700 text-gray-400',
          'group-hover:bg-primary-600 group-hover:text-white',
          'transition-colors duration-150'
        )}
      >
        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
});

// ============================================
// Main Component
// ============================================

export function ChannelList({
  channels,
  isLoading = false,
  selectedChannelId,
  onChannelClick,
  onEndReached,
  className,
  rowHeight = 72,
  showEPG = true,
  showNumbers = true,
}: ChannelListProps) {
  // Store hooks
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const favoritesState = useFavoritesStore();
  const play = usePlayerStore((state) => state.play);

  // Get visible channel IDs for EPG batch fetch
  const channelIds = useMemo(
    () => channels.map((c) => c.stream_id),
    [channels]
  );

  // Fetch EPG for all visible channels
  const { data: nowPlayingMap } = useNowPlaying(showEPG ? channelIds.slice(0, 100) : [], {
    enabled: showEPG && channelIds.length > 0,
  });

  // Handle channel click
  const handleChannelClick = useCallback(
    (channel: LiveStream) => {
      if (onChannelClick) {
        onChannelClick(channel);
      } else if (activeConnection) {
        const stream: CurrentStream = {
          id: channel.stream_id,
          name: channel.name,
          url: `${activeConnection.serverUrl}/live/${activeConnection.username}/${activeConnection.password}/${channel.stream_id}.m3u8`,
          type: 'live',
          icon: channel.stream_icon,
          categoryId: channel.category_id,
          epgChannelId: channel.epg_channel_id,
        };
        play(stream);
      }
    },
    [activeConnection, onChannelClick, play]
  );

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(
    (channel: LiveStream) => {
      if (!activeConnection) return;

      const isFav = favoritesState.isFavorite(
        activeConnection.id,
        channel.stream_id,
        'live'
      );

      if (isFav) {
        favoritesState.removeFavorite(activeConnection.id, channel.stream_id, 'live');
      } else {
        favoritesState.addFavorite(activeConnection.id, {
          streamId: channel.stream_id,
          streamType: 'live',
          name: channel.name,
          icon: channel.stream_icon,
          categoryId: channel.category_id,
        });
      }
    },
    [activeConnection, favoritesState]
  );

  // Render a single channel row
  const renderChannel = useCallback(
    (channel: LiveStream, index: number) => {
      const isSelected = channel.stream_id === selectedChannelId;
      const isFavorite = activeConnection
        ? favoritesState.isFavorite(activeConnection.id, channel.stream_id, 'live')
        : false;

      // Get EPG data for this channel
      const epgProgram = nowPlayingMap?.get(channel.stream_id);
      const currentProgramData = epgProgram || null;
      const progress = currentProgramData ? getProgramProgress(currentProgramData) : 0;

      return (
        <ChannelRow
          key={channel.stream_id}
          channel={channel}
          index={index}
          isSelected={isSelected}
          isFavorite={isFavorite}
          currentProgram={currentProgramData}
          nextProgram={null}
          progress={progress}
          showEPG={showEPG}
          showNumbers={showNumbers}
          onClick={() => handleChannelClick(channel)}
          onFavoriteToggle={() => handleFavoriteToggle(channel)}
        />
      );
    },
    [
      selectedChannelId,
      activeConnection,
      favoritesState,
      nowPlayingMap,
      showEPG,
      showNumbers,
      handleChannelClick,
      handleFavoriteToggle,
    ]
  );

  // Empty state component
  const emptyComponent = (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <p className="text-lg font-medium">No channels found</p>
      <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter</p>
    </div>
  );

  // Loading component
  const loadingComponent = (
    <div className="flex items-center justify-center py-4">
      <Spinner size="md" variant="primary" />
    </div>
  );

  return (
    <div className={cn('h-full bg-dark-900', className)}>
      <VirtualList
        items={channels}
        renderItem={renderChannel}
        itemHeight={rowHeight}
        overscan={10}
        gap={0}
        scrollClassName="h-full"
        onEndReached={onEndReached}
        endReachedThreshold={300}
        isLoading={isLoading}
        loadingComponent={loadingComponent}
        emptyComponent={emptyComponent}
        getItemKey={(index) => channels[index]?.stream_id || index}
      />
    </div>
  );
}

export default ChannelList;
