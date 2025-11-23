/**
 * ChannelCard Component
 * Card-based display for a single channel with logo, EPG info, and controls
 */

import React, { useCallback, useMemo, useId } from 'react';
import { cn } from '@/utils/cn';
import { LazyImage, ProgressBar } from '@/components/common';
import { Badge } from '@/components/common';
import { useCurrentProgram } from '@/hooks';
import { useConnectionStore, useFavoritesStore, usePlayerStore } from '@/stores';
import type { LiveStream, CurrentStream } from '@/services/xtream/types';
import { VisuallyHidden } from '@/components/common/SkipLink';
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

export interface ChannelCardProps {
  /** The channel/stream data */
  channel: LiveStream;
  /** Custom class name */
  className?: string;
  /** Whether the card is currently selected */
  isSelected?: boolean;
  /** Show EPG information */
  showEPG?: boolean;
  /** Callback when card is clicked */
  onClick?: (channel: LiveStream) => void;
}

// ============================================
// Quality Detection
// ============================================

type QualityType = '4k' | 'fhd' | 'hd' | null;

function detectQuality(name: string): QualityType {
  const upperName = name.toUpperCase();

  // Check for 4K/UHD indicators
  if (
    upperName.includes('4K') ||
    upperName.includes('UHD') ||
    upperName.includes('2160P')
  ) {
    return '4k';
  }

  // Check for FHD/1080p indicators
  if (
    upperName.includes('FHD') ||
    upperName.includes('FULL HD') ||
    upperName.includes('1080P') ||
    upperName.includes('1080I')
  ) {
    return 'fhd';
  }

  // Check for HD/720p indicators
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
// Sub Components
// ============================================

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
    <Badge variant={badgeProps.variant} size="xs" className="absolute top-2 right-2">
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
      aria-pressed={isFavorite}
    >
      <svg
        className={iconSizes.sm}
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
      <VisuallyHidden>{isFavorite ? 'Favorite' : 'Not favorite'}</VisuallyHidden>
    </button>
  );
}

interface PlayOverlayProps {
  isHovered: boolean;
}

function PlayOverlay({ isHovered }: PlayOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        overlays.medium,
        transitions.opacity,
        isHovered ? 'opacity-100' : 'opacity-0'
      )}
      aria-hidden="true"
    >
      <div className={cn(
        iconSizes['3xl'],
        'rounded-full bg-primary-600 flex items-center justify-center',
        shadows.card,
        transitions.transform,
        isHovered && 'scale-110'
      )}>
        <svg className={cn(iconSizes.lg, 'text-white ml-1')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ChannelCard({
  channel,
  className,
  isSelected = false,
  showEPG = true,
  onClick,
}: ChannelCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const programId = useId();

  // Store hooks
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const isFavorite = useFavoritesStore((state) =>
    activeConnection
      ? state.isFavorite(activeConnection.id, channel.stream_id, 'live')
      : false
  );
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const play = usePlayerStore((state) => state.play);

  // EPG data
  const { currentProgram, progress } = useCurrentProgram(
    showEPG ? channel.stream_id : null
  );

  // Quality detection
  const quality = useMemo(() => detectQuality(channel.name), [channel.name]);

  // Handlers
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(channel);
    } else if (activeConnection) {
      // Default: play the channel
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
  }, [channel, activeConnection, onClick, play]);

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!activeConnection) return;

      if (isFavorite) {
        removeFavorite(activeConnection.id, channel.stream_id, 'live');
      } else {
        addFavorite(activeConnection.id, {
          streamId: channel.stream_id,
          streamType: 'live',
          name: channel.name,
          icon: channel.stream_icon,
          categoryId: channel.category_id,
        });
      }
    },
    [activeConnection, channel, isFavorite, addFavorite, removeFavorite]
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
      aria-label={`Play ${channel.name}${quality ? `, ${quality.toUpperCase()} quality` : ''}${isFavorite ? ', favorite' : ''}`}
      aria-describedby={showEPG && currentProgram ? programId : undefined}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-dark-900">
        <LazyImage
          src={channel.stream_icon}
          alt={channel.name}
          className="object-contain p-2"
          containerClassName="w-full h-full"
          fallbackBgColor="bg-dark-700"
        />

        {/* Quality Badge */}
        <QualityBadgeDisplay quality={quality} />

        {/* Favorite Button */}
        <FavoriteButton isFavorite={isFavorite} onClick={handleFavoriteClick} />

        {/* Play Overlay on Hover */}
        <PlayOverlay isHovered={isHovered} />
      </div>

      {/* Content */}
      <div className={cn('flex flex-col flex-1', componentSpacing.cardPadding, componentSpacing.gapSm)}>
        {/* Channel Name */}
        <h3 className="text-sm font-medium text-white truncate leading-snug" title={channel.name}>
          {channel.name}
        </h3>

        {/* Current Program */}
        {showEPG && currentProgram && (
          <p id={programId} className="text-xs text-gray-400 truncate leading-snug" title={currentProgram.title}>
            Now playing: {currentProgram.title}
          </p>
        )}

        {/* No EPG placeholder */}
        {showEPG && !currentProgram && (
          <p className="text-xs text-gray-500 italic leading-snug">No program info</p>
        )}

        {/* Progress Bar */}
        {showEPG && currentProgram && (
          <div className="mt-auto pt-1">
            <ProgressBar value={progress} size="sm" variant="primary" animated={false} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Compact Channel Card Variant
// ============================================

export interface ChannelCardCompactProps {
  channel: LiveStream;
  className?: string;
  isSelected?: boolean;
  onClick?: (channel: LiveStream) => void;
}

export function ChannelCardCompact({
  channel,
  className,
  isSelected = false,
  onClick,
}: ChannelCardCompactProps) {
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const isFavorite = useFavoritesStore((state) =>
    activeConnection
      ? state.isFavorite(activeConnection.id, channel.stream_id, 'live')
      : false
  );
  const play = usePlayerStore((state) => state.play);

  const quality = useMemo(() => detectQuality(channel.name), [channel.name]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(channel);
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
  }, [channel, activeConnection, onClick, play]);

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
      aria-label={`Play ${channel.name}${quality ? `, ${quality.toUpperCase()} quality` : ''}${isFavorite ? ', favorite' : ''}`}
    >
      {/* Logo */}
      <div className={cn('relative flex-shrink-0', iconSizes['2xl'])}>
        <LazyImage
          src={channel.stream_icon}
          alt=""
          className="object-contain rounded"
          containerClassName="w-full h-full rounded bg-dark-700"
          fallbackBgColor="bg-dark-700"
        />
      </div>

      {/* Name */}
      <span className="flex-1 text-sm text-white truncate leading-snug">{channel.name}</span>

      {/* Badges */}
      <div className={cn('flex items-center flex-shrink-0', componentSpacing.gapSm)} aria-hidden="true">
        {isFavorite && (
          <svg className={cn(iconSizes.sm, 'text-yellow-500')} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

export default ChannelCard;
