/**
 * EPGGrid Component
 * =================
 * Main TV Guide grid with channels, programs, and timeline.
 *
 * Mobile Features:
 * - Simplified mobile list view for small screens
 * - Responsive slot and column widths
 * - Touch-friendly row heights (min 56px)
 * - Swipe navigation for timeline
 * - Full-screen program modal on mobile
 */

import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  addMinutes,
  addHours,
  startOfHour,
  format,
} from 'date-fns';
import { Play, Tv, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useMultipleEPG } from '@/hooks/useEPG';
import { ProgramCard } from './ProgramCard';
import { ProgramModal } from './ProgramModal';
import { EPGTimeline, CurrentTimeIndicator } from './EPGTimeline';
import { ChannelLogo, Skeleton } from '@/components/common';
import type { EPGProgram, LiveStream } from '@/services/xtream/types';

// ============================================================================
// Types
// ============================================================================

export interface EPGGridProps {
  /** List of channels to display */
  channels: LiveStream[];
  /** Callback when a channel is clicked (to play) */
  onChannelPlay?: (channel: LiveStream) => void;
  /** Callback when a program is clicked */
  onProgramClick?: (program: EPGProgram, channel: LiveStream) => void;
  /** Initial start time for the grid (defaults to current hour) */
  initialStartTime?: Date;
  /** Duration of the EPG window in hours */
  windowDurationHours?: number;
  /** Width of each 30-minute slot in pixels */
  slotWidth?: number;
  /** Width of the channel column in pixels */
  channelColumnWidth?: number;
  /** Height of each channel row in pixels */
  rowHeight?: number;
  /** Whether to show the timeline header */
  showTimeline?: boolean;
  /** Whether to show the current time indicator */
  showCurrentTimeIndicator?: boolean;
  /** Additional class name */
  className?: string;
}

export interface ChannelRowProps {
  channel: LiveStream;
  programs: EPGProgram[];
  windowStartTime: Date;
  windowDurationHours: number;
  slotWidth: number;
  channelColumnWidth: number;
  onChannelPlay?: (channel: LiveStream) => void;
  onProgramClick?: (program: EPGProgram) => void;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SLOT_WIDTH = 200;
const DEFAULT_CHANNEL_COLUMN_WIDTH = 200;
const DEFAULT_ROW_HEIGHT = 64;
const DEFAULT_WINDOW_DURATION_HOURS = 6;
const MINUTES_PER_SLOT = 30;

// Mobile constants
const MOBILE_SLOT_WIDTH = 120;
const MOBILE_CHANNEL_COLUMN_WIDTH = 100;
const MOBILE_ROW_HEIGHT = 56;
const MOBILE_WINDOW_DURATION_HOURS = 3;

// ============================================================================
// Responsive Config Hook
// ============================================================================

interface ResponsiveEPGConfig {
  slotWidth: number;
  channelColumnWidth: number;
  rowHeight: number;
  windowDurationHours: number;
  isMobile: boolean;
  isTablet: boolean;
}

function useResponsiveEPGConfig(
  baseSlotWidth: number,
  baseChannelWidth: number,
  baseRowHeight: number,
  baseWindowHours: number
): ResponsiveEPGConfig {
  const [config, setConfig] = useState<ResponsiveEPGConfig>(() => {
    if (typeof window === 'undefined') {
      return {
        slotWidth: baseSlotWidth,
        channelColumnWidth: baseChannelWidth,
        rowHeight: baseRowHeight,
        windowDurationHours: baseWindowHours,
        isMobile: false,
        isTablet: false,
      };
    }
    return calculateEPGConfig(window.innerWidth, baseSlotWidth, baseChannelWidth, baseRowHeight, baseWindowHours);
  });

  useEffect(() => {
    function handleResize() {
      setConfig(calculateEPGConfig(
        window.innerWidth,
        baseSlotWidth,
        baseChannelWidth,
        baseRowHeight,
        baseWindowHours
      ));
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [baseSlotWidth, baseChannelWidth, baseRowHeight, baseWindowHours]);

  return config;
}

function calculateEPGConfig(
  width: number,
  baseSlotWidth: number,
  baseChannelWidth: number,
  baseRowHeight: number,
  baseWindowHours: number
): ResponsiveEPGConfig {
  if (width < 640) {
    // Mobile
    return {
      slotWidth: MOBILE_SLOT_WIDTH,
      channelColumnWidth: MOBILE_CHANNEL_COLUMN_WIDTH,
      rowHeight: MOBILE_ROW_HEIGHT,
      windowDurationHours: MOBILE_WINDOW_DURATION_HOURS,
      isMobile: true,
      isTablet: false,
    };
  }
  if (width < 1024) {
    // Tablet
    return {
      slotWidth: Math.round(baseSlotWidth * 0.75),
      channelColumnWidth: Math.round(baseChannelWidth * 0.8),
      rowHeight: Math.max(baseRowHeight, 56),
      windowDurationHours: Math.min(baseWindowHours, 4),
      isMobile: false,
      isTablet: true,
    };
  }
  // Desktop
  return {
    slotWidth: baseSlotWidth,
    channelColumnWidth: baseChannelWidth,
    rowHeight: baseRowHeight,
    windowDurationHours: baseWindowHours,
    isMobile: false,
    isTablet: false,
  };
}

// ============================================================================
// ChannelInfo Component
// ============================================================================

interface ChannelInfoProps {
  channel: LiveStream;
  onPlay?: () => void;
  className?: string;
  compact?: boolean;
}

function ChannelInfo({ channel, onPlay, className, compact = false }: ChannelInfoProps) {
  const handleClick = useCallback(() => {
    onPlay?.();
  }, [onPlay]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPlay?.();
      }
    },
    [onPlay]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex items-center h-full',
        'cursor-pointer group',
        'hover:bg-dark-700 active:bg-dark-600',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500',
        'tap-highlight-transparent',
        // Touch-friendly padding
        compact ? 'gap-2 px-2' : 'gap-3 px-3',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={`Play ${channel.name}`}
    >
      {/* Channel logo - min 40x40 for touch */}
      <div className={cn('flex-shrink-0', compact ? 'w-8 h-8' : 'w-10 h-10')}>
        {channel.stream_icon ? (
          <ChannelLogo
            src={channel.stream_icon}
            name={channel.name}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-dark-700 flex items-center justify-center">
            <Tv className={cn(compact ? 'w-4 h-4' : 'w-5 h-5', 'text-gray-500')} />
          </div>
        )}
      </div>

      {/* Channel name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-gray-200 truncate',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {channel.name}
        </p>
        {!compact && channel.num && (
          <p className="text-xs text-gray-500">Ch. {channel.num}</p>
        )}
      </div>

      {/* Play button - always visible on mobile for better UX */}
      <div className={cn(
        'flex-shrink-0 transition-opacity duration-200',
        'sm:opacity-0 sm:group-hover:opacity-100',
        'opacity-100'
      )}>
        <div className={cn(
          'rounded-full bg-primary-600 flex items-center justify-center',
          // Min 44px touch target
          compact ? 'w-7 h-7' : 'w-8 h-8 sm:w-8 sm:h-8'
        )}>
          <Play className={cn(compact ? 'w-3 h-3' : 'w-4 h-4', 'text-white fill-current')} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ChannelRow Component
// ============================================================================

function ChannelRow({
  channel,
  programs,
  windowStartTime,
  windowDurationHours,
  slotWidth,
  channelColumnWidth,
  onChannelPlay,
  onProgramClick,
  isLoading = false,
  className,
}: ChannelRowProps) {
  const windowEndTime = useMemo(
    () => addHours(windowStartTime, windowDurationHours),
    [windowStartTime, windowDurationHours]
  );

  const totalWidth = (windowDurationHours * 60 / MINUTES_PER_SLOT) * slotWidth;
  const isCompact = channelColumnWidth < 150;

  // Filter programs within the window
  const visiblePrograms = useMemo(() => {
    const windowStartTimestamp = windowStartTime.getTime() / 1000;
    const windowEndTimestamp = windowEndTime.getTime() / 1000;

    return programs.filter(
      (p) =>
        p.stop_timestamp > windowStartTimestamp &&
        p.start_timestamp < windowEndTimestamp
    );
  }, [programs, windowStartTime, windowEndTime]);

  const handleChannelPlay = useCallback(() => {
    onChannelPlay?.(channel);
  }, [onChannelPlay, channel]);

  return (
    <div className={cn('flex h-full border-b border-dark-800', className)}>
      {/* Channel info column */}
      <div
        className="flex-shrink-0 border-r border-dark-700 bg-dark-900"
        style={{ width: `${channelColumnWidth}px` }}
      >
        <ChannelInfo channel={channel} onPlay={handleChannelPlay} compact={isCompact} />
      </div>

      {/* Programs grid */}
      <div
        className="relative flex-1 bg-dark-900"
        style={{ width: `${totalWidth}px` }}
      >
        {isLoading ? (
          // Loading skeleton
          <div className="flex items-center gap-2 h-full px-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24 sm:w-32" />
          </div>
        ) : visiblePrograms.length === 0 ? (
          // No programs
          <div className="flex items-center justify-center h-full text-gray-600 text-xs sm:text-sm">
            No program data
          </div>
        ) : (
          // Program cards
          visiblePrograms.map((program) => (
            <ProgramCard
              key={program.id || `${program.start_timestamp}-${program.title}`}
              program={program}
              windowStartTime={windowStartTime}
              slotWidth={slotWidth}
              onClick={() => onProgramClick?.(program)}
            />
          ))
        )}

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: windowDurationHours * 2 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'absolute top-0 bottom-0 border-l',
                i % 2 === 0 ? 'border-dark-700' : 'border-dark-800'
              )}
              style={{ left: `${i * slotWidth}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Mobile EPG List View
// ============================================================================

interface MobileEPGListProps {
  channels: LiveStream[];
  onChannelPlay?: (channel: LiveStream) => void;
  onProgramClick?: (program: EPGProgram, channel: LiveStream) => void;
  className?: string;
}

function MobileEPGList({
  channels,
  onChannelPlay,
  onProgramClick,
  className,
}: MobileEPGListProps) {
  const streamIds = useMemo(() => channels.map((c) => c.stream_id), [channels]);
  const { data: epgData, isLoading } = useMultipleEPG(streamIds, {
    enabled: channels.length > 0,
  });

  const now = Date.now() / 1000;

  const containerRef = useRef<HTMLDivElement>(null);

  // Virtual list
  const rowVirtualizer = useVirtualizer({
    count: channels.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full overflow-auto bg-dark-900',
        'overscroll-contain',
        className
      )}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        className="relative"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const channel = channels[virtualRow.index];
          const programs = epgData.get(channel.stream_id) || [];
          const currentProgram = programs.find(
            (p) => p.start_timestamp <= now && p.stop_timestamp > now
          );
          const nextProgram = programs.find(
            (p) => p.start_timestamp > now
          );

          return (
            <div
              key={channel.stream_id}
              className="absolute left-0 right-0 border-b border-dark-800"
              style={{
                top: `${virtualRow.start}px`,
                height: `${virtualRow.size}px`,
              }}
            >
              <div
                className={cn(
                  'flex items-center gap-3 p-3 h-full',
                  'hover:bg-dark-800 active:bg-dark-700',
                  'transition-colors cursor-pointer',
                  'tap-highlight-transparent'
                )}
                onClick={() => onChannelPlay?.(channel)}
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
                    <div className="w-full h-full rounded-lg bg-dark-700 flex items-center justify-center">
                      <Tv className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Channel and program info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-200 text-sm truncate">
                    {channel.name}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-3 w-32 mt-1" />
                  ) : currentProgram ? (
                    <div
                      className="mt-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProgramClick?.(currentProgram, channel);
                      }}
                    >
                      <p className="text-xs text-primary-400 truncate">
                        {currentProgram.title}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(new Date(currentProgram.start_timestamp * 1000), 'HH:mm')} -
                          {format(new Date(currentProgram.stop_timestamp * 1000), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  ) : nextProgram ? (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      Next: {nextProgram.title}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 mt-0.5">No program info</p>
                  )}
                </div>

                {/* Play button */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// EPGGrid Component
// ============================================================================

export function EPGGrid({
  channels,
  onChannelPlay,
  onProgramClick,
  initialStartTime,
  windowDurationHours = DEFAULT_WINDOW_DURATION_HOURS,
  slotWidth = DEFAULT_SLOT_WIDTH,
  channelColumnWidth = DEFAULT_CHANNEL_COLUMN_WIDTH,
  rowHeight = DEFAULT_ROW_HEIGHT,
  showTimeline = true,
  showCurrentTimeIndicator = true,
  className,
}: EPGGridProps) {
  // Responsive configuration
  const config = useResponsiveEPGConfig(slotWidth, channelColumnWidth, rowHeight, windowDurationHours);

  // State for window start time
  const [windowStartTime, setWindowStartTime] = useState<Date>(() => {
    if (initialStartTime) {
      return initialStartTime;
    }
    // Default to current hour minus 30 minutes
    const now = new Date();
    const hourStart = startOfHour(now);
    return addMinutes(hourStart, -30);
  });

  // State for selected program modal
  const [selectedProgram, setSelectedProgram] = useState<EPGProgram | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<LiveStream | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Get stream IDs for EPG data fetch
  const streamIds = useMemo(
    () => channels.map((c) => c.stream_id),
    [channels]
  );

  // Fetch EPG data for all channels
  const { data: epgData, isLoading: isEPGLoading } = useMultipleEPG(streamIds, {
    enabled: channels.length > 0,
  });

  // Calculate total grid width
  const totalWidth =
    config.channelColumnWidth +
    (config.windowDurationHours * 60 / MINUTES_PER_SLOT) * config.slotWidth;

  // Virtual list for rows
  const rowVirtualizer = useVirtualizer({
    count: channels.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => config.rowHeight,
    overscan: 5,
  });

  // Handle horizontal scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollLeft(target.scrollLeft);
  }, []);

  // Handle program click
  const handleProgramClick = useCallback(
    (program: EPGProgram, channel: LiveStream) => {
      setSelectedProgram(program);
      setSelectedChannel(channel);
      setIsModalOpen(true);
      onProgramClick?.(program, channel);
    },
    [onProgramClick]
  );

  // Handle watch now from modal
  const handleWatchNow = useCallback(
    (_program: EPGProgram) => {
      if (selectedChannel) {
        onChannelPlay?.(selectedChannel);
      }
    },
    [selectedChannel, onChannelPlay]
  );

  // Close modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProgram(null);
    setSelectedChannel(null);
  }, []);

  // Update current time indicator every minute
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Check if current time is visible in the window
  const isCurrentTimeVisible = useMemo(() => {
    const windowEnd = addHours(windowStartTime, config.windowDurationHours);
    return currentTime >= windowStartTime && currentTime <= windowEnd;
  }, [currentTime, windowStartTime, config.windowDurationHours]);

  // Navigation handlers for mobile
  const handleNavigateBack = useCallback(() => {
    setWindowStartTime((prev) => addHours(prev, -config.windowDurationHours));
  }, [config.windowDurationHours]);

  const handleNavigateForward = useCallback(() => {
    setWindowStartTime((prev) => addHours(prev, config.windowDurationHours));
  }, [config.windowDurationHours]);

  // Empty state
  if (channels.length === 0) {
    return (
      <div className={cn('flex flex-col h-full bg-dark-900', className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <Tv className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-400 mb-2">
              No Channels Available
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Add a connection to see the TV Guide
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Use simplified list view on very small screens
  if (config.isMobile && window.innerWidth < 480) {
    return (
      <div className={cn('flex flex-col h-full bg-dark-900', className)}>
        {/* Mobile header with navigation */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-dark-800 bg-dark-900/95 backdrop-blur-sm sticky top-0 z-10">
          <button
            onClick={handleNavigateBack}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-800 active:bg-dark-700 tap-highlight-transparent"
            aria-label="Previous time"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-300">
            {format(windowStartTime, 'EEE, MMM d')}
          </span>
          <button
            onClick={handleNavigateForward}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-800 active:bg-dark-700 tap-highlight-transparent"
            aria-label="Next time"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <MobileEPGList
          channels={channels}
          onChannelPlay={onChannelPlay}
          onProgramClick={handleProgramClick}
          className="flex-1"
        />

        {/* Program details modal - full screen on mobile */}
        <ProgramModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          program={selectedProgram}
          channel={selectedChannel}
          onWatchNow={handleWatchNow}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-dark-900', className)}>
      {/* Timeline header */}
      {showTimeline && (
        <EPGTimeline
          windowStartTime={windowStartTime}
          onWindowStartTimeChange={setWindowStartTime}
          windowDurationHours={config.windowDurationHours}
          slotWidth={config.slotWidth}
          channelColumnWidth={config.channelColumnWidth}
          scrollLeft={scrollLeft}
          showDateSelector={true}
          sticky={true}
        />
      )}

      {/* Grid container */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 overflow-auto',
          'overscroll-contain'
        )}
        onScroll={handleScroll}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          ref={gridRef}
          className="relative"
          style={{
            width: `${totalWidth}px`,
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {/* Current time indicator */}
          {showCurrentTimeIndicator && isCurrentTimeVisible && (
            <CurrentTimeIndicator
              windowStartTime={windowStartTime}
              slotWidth={config.slotWidth}
              channelColumnWidth={config.channelColumnWidth}
              height={`${rowVirtualizer.getTotalSize()}px`}
            />
          )}

          {/* Virtual rows */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const channel = channels[virtualRow.index];
            const programs = epgData.get(channel.stream_id) || [];

            return (
              <div
                key={channel.stream_id}
                className="absolute left-0 w-full"
                style={{
                  top: `${virtualRow.start}px`,
                  height: `${config.rowHeight}px`,
                }}
              >
                <ChannelRow
                  channel={channel}
                  programs={programs}
                  windowStartTime={windowStartTime}
                  windowDurationHours={config.windowDurationHours}
                  slotWidth={config.slotWidth}
                  channelColumnWidth={config.channelColumnWidth}
                  onChannelPlay={onChannelPlay}
                  onProgramClick={(program) =>
                    handleProgramClick(program, channel)
                  }
                  isLoading={isEPGLoading}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Program details modal */}
      <ProgramModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        program={selectedProgram}
        channel={selectedChannel}
        onWatchNow={handleWatchNow}
      />
    </div>
  );
}

// ============================================================================
// Mini EPG Grid (for compact views)
// ============================================================================

export interface MiniEPGGridProps {
  channels: LiveStream[];
  maxChannels?: number;
  onChannelClick?: (channel: LiveStream) => void;
  onViewAll?: () => void;
  className?: string;
}

export function MiniEPGGrid({
  channels,
  maxChannels = 5,
  onChannelClick,
  onViewAll,
  className,
}: MiniEPGGridProps) {
  const displayChannels = channels.slice(0, maxChannels);
  const streamIds = displayChannels.map((c) => c.stream_id);
  const { data: epgData, isLoading } = useMultipleEPG(streamIds);

  const now = Date.now() / 1000;

  return (
    <div className={cn('bg-dark-800 rounded-lg overflow-hidden', className)}>
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-dark-700 flex items-center justify-between">
        <h3 className="font-medium text-white text-sm sm:text-base">TV Guide</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className={cn(
              'text-xs sm:text-sm text-primary-500 hover:text-primary-400',
              'flex items-center gap-1',
              'min-h-[44px] px-2',
              'tap-highlight-transparent'
            )}
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="divide-y divide-dark-700">
        {displayChannels.map((channel) => {
          const programs = epgData.get(channel.stream_id) || [];
          const currentProgram = programs.find(
            (p) => p.start_timestamp <= now && p.stop_timestamp > now
          );

          return (
            <div
              key={channel.stream_id}
              role="button"
              tabIndex={0}
              className={cn(
                'flex items-center gap-3 p-3',
                'hover:bg-dark-700 active:bg-dark-600',
                'cursor-pointer transition-colors',
                'min-h-[56px]',
                'tap-highlight-transparent'
              )}
              onClick={() => onChannelClick?.(channel)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChannelClick?.(channel);
                }
              }}
            >
              {/* Channel logo */}
              <div className="flex-shrink-0 w-10 h-10">
                {channel.stream_icon ? (
                  <ChannelLogo
                    src={channel.stream_icon}
                    name={channel.name}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-lg bg-dark-600 flex items-center justify-center">
                    <Tv className="w-5 h-5 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Channel and program info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-200 text-sm truncate">
                  {channel.name}
                </p>
                {isLoading ? (
                  <Skeleton className="h-3 w-32 mt-1" />
                ) : currentProgram ? (
                  <p className="text-xs text-gray-500 truncate">
                    {currentProgram.title}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">No program info</p>
                )}
              </div>

              {/* Play icon */}
              <Play className="w-5 h-5 text-gray-500 flex-shrink-0" />
            </div>
          );
        })}
      </div>

      {channels.length > maxChannels && (
        <div className="px-4 py-2 border-t border-dark-700 text-center">
          <span className="text-xs text-gray-500">
            +{channels.length - maxChannels} more channels
          </span>
        </div>
      )}
    </div>
  );
}

export default EPGGrid;
