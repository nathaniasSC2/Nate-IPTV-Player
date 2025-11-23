/**
 * ChannelSwitcher Component
 * Overlay for switching channels with up/down arrows
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { usePlayerStore } from '@/stores';
import { useCurrentProgram, formatProgramTime } from '@/hooks/useEPG';
import { LazyImage } from '@/components/common';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { LiveStream, CurrentStream } from '@/services/xtream/types';

// ============================================
// Types
// ============================================

interface ChannelSwitcherProps {
  onClose: () => void;
  channels?: LiveStream[];
  className?: string;
}

interface ChannelPreviewProps {
  channel: LiveStream | null;
  direction: 'previous' | 'next';
  isActive: boolean;
}

// ============================================
// Constants
// ============================================

const SWITCH_DELAY = 2000; // 2 seconds
const DISMISS_DELAY = 3000; // 3 seconds without activity

// ============================================
// Channel Preview Component
// ============================================

function ChannelPreview({ channel, direction, isActive }: ChannelPreviewProps) {
  // Get EPG data for preview
  const streamId = channel?.stream_id ?? null;
  const { currentProgram } = useCurrentProgram(streamId);

  if (!channel) {
    return (
      <div className={cn(
        'flex items-center gap-4 p-4 rounded-lg',
        'bg-dark-800/50',
        'opacity-50'
      )}>
        <div className="w-12 h-12 rounded bg-dark-700 flex items-center justify-center">
          {direction === 'previous' ? (
            <ChevronUp className="w-6 h-6 text-gray-500" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-500" />
          )}
        </div>
        <div>
          <p className="text-gray-500 text-sm">
            No {direction} channel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-lg',
      'transition-all duration-300',
      isActive
        ? 'bg-primary-600/30 border border-primary-500'
        : 'bg-dark-800/50 border border-transparent',
    )}>
      {/* Direction Icon */}
      <div className={cn(
        'flex-shrink-0 w-6 flex items-center justify-center',
        isActive ? 'text-primary-400' : 'text-gray-500'
      )}>
        {direction === 'previous' ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </div>

      {/* Channel Logo */}
      {channel.stream_icon ? (
        <LazyImage
          src={channel.stream_icon}
          alt={channel.name}
          className="w-12 h-12 rounded object-contain bg-dark-700 flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-dark-700 flex items-center justify-center flex-shrink-0">
          <span className="text-gray-500 text-lg font-bold">
            {channel.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Channel Info */}
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          'font-medium truncate',
          isActive ? 'text-white' : 'text-gray-300'
        )}>
          {channel.name}
        </h3>

        {currentProgram && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-gray-500 text-xs">
              {formatProgramTime(currentProgram.start_timestamp)}
            </span>
            <span className={cn(
              'text-sm truncate',
              isActive ? 'text-gray-300' : 'text-gray-500'
            )}>
              {currentProgram.title}
            </span>
          </div>
        )}
      </div>

      {/* Channel Number */}
      <div className={cn(
        'flex-shrink-0 text-lg font-mono',
        isActive ? 'text-primary-400' : 'text-gray-600'
      )}>
        {channel.num}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ChannelSwitcher({
  onClose,
  channels = [],
  className,
}: ChannelSwitcherProps) {
  // Store state
  const currentStream = usePlayerStore((state) => state.currentStream);
  const play = usePlayerStore((state) => state.play);

  // Local state
  const [selectedDirection, setSelectedDirection] = useState<'previous' | 'next' | null>(null);
  const [countdown, setCountdown] = useState<number>(SWITCH_DELAY / 1000);

  // Refs
  const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // Find Adjacent Channels
  // ============================================

  const findAdjacentChannels = useCallback(() => {
    if (!currentStream || channels.length === 0) {
      return { previous: null, next: null, currentIndex: -1 };
    }

    const currentIndex = channels.findIndex(
      (ch) => ch.stream_id === currentStream.id
    );

    if (currentIndex === -1) {
      return { previous: null, next: null, currentIndex: -1 };
    }

    const previousChannel = currentIndex > 0 ? channels[currentIndex - 1] : null;
    const nextChannel = currentIndex < channels.length - 1 ? channels[currentIndex + 1] : null;

    return { previous: previousChannel, next: nextChannel, currentIndex };
  }, [currentStream, channels]);

  const { previous: previousChannel, next: nextChannel } = findAdjacentChannels();

  // ============================================
  // Switch Channel
  // ============================================

  const switchToChannel = useCallback((channel: LiveStream | null) => {
    if (!channel) return;

    const newStream: CurrentStream = {
      id: channel.stream_id,
      name: channel.name,
      url: '', // URL will be constructed by the player
      type: 'live',
      icon: channel.stream_icon,
      categoryId: channel.category_id,
      epgChannelId: channel.epg_channel_id,
    };

    play(newStream);
    onClose();
  }, [play, onClose]);

  // ============================================
  // Selection Handler
  // ============================================

  const selectChannel = useCallback((direction: 'previous' | 'next') => {
    // Clear existing timeouts
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    const channel = direction === 'previous' ? previousChannel : nextChannel;

    if (!channel) {
      setSelectedDirection(null);
      return;
    }

    setSelectedDirection(direction);
    setCountdown(SWITCH_DELAY / 1000);

    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 0.1));
    }, 100);

    // Switch after delay
    switchTimeoutRef.current = setTimeout(() => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      switchToChannel(channel);
    }, SWITCH_DELAY);
  }, [previousChannel, nextChannel, switchToChannel]);

  // ============================================
  // Cancel Selection
  // ============================================

  const cancelSelection = useCallback(() => {
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setSelectedDirection(null);
    setCountdown(SWITCH_DELAY / 1000);
  }, []);

  // ============================================
  // Confirm Selection
  // ============================================

  const confirmSelection = useCallback(() => {
    if (!selectedDirection) return;

    // Clear timeouts
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const channel = selectedDirection === 'previous' ? previousChannel : nextChannel;
    switchToChannel(channel);
  }, [selectedDirection, previousChannel, nextChannel, switchToChannel]);

  // ============================================
  // Keyboard Handlers
  // ============================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Reset dismiss timeout on any key
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          selectChannel('previous');
          break;

        case 'ArrowDown':
          e.preventDefault();
          selectChannel('next');
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedDirection) {
            confirmSelection();
          }
          break;

        case 'Escape':
          e.preventDefault();
          cancelSelection();
          onClose();
          break;

        default:
          break;
      }

      // Set new dismiss timeout
      dismissTimeoutRef.current = setTimeout(() => {
        onClose();
      }, DISMISS_DELAY);
    };

    document.addEventListener('keydown', handleKeyDown);

    // Initial dismiss timeout
    dismissTimeoutRef.current = setTimeout(() => {
      onClose();
    }, DISMISS_DELAY);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
      }
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [selectChannel, cancelSelection, confirmSelection, onClose, selectedDirection]);

  // ============================================
  // Render
  // ============================================

  return (
    <div
      className={cn(
        'absolute inset-0',
        'flex items-center justify-center',
        'bg-black/60 backdrop-blur-sm',
        'transition-opacity duration-300',
        className
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md mx-4 space-y-2">
        {/* Previous Channel */}
        <ChannelPreview
          channel={previousChannel}
          direction="previous"
          isActive={selectedDirection === 'previous'}
        />

        {/* Current Channel Indicator */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-dark-700 border border-dark-600">
          {/* Current indicator */}
          <div className="flex-shrink-0 w-6 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          </div>

          {/* Channel Logo */}
          {currentStream?.icon ? (
            <LazyImage
              src={currentStream.icon}
              alt={currentStream.name}
              className="w-12 h-12 rounded object-contain bg-dark-800 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-dark-800 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-400 text-lg font-bold">
                {currentStream?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}

          {/* Channel Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">
              {currentStream?.name || 'Unknown Channel'}
            </h3>
            <span className="text-xs text-primary-400">
              Currently watching
            </span>
          </div>
        </div>

        {/* Next Channel */}
        <ChannelPreview
          channel={nextChannel}
          direction="next"
          isActive={selectedDirection === 'next'}
        />

        {/* Countdown & Instructions */}
        <div className="mt-4 text-center">
          {selectedDirection ? (
            <div className="space-y-2">
              {/* Progress Bar */}
              <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-100"
                  style={{ width: `${(countdown / (SWITCH_DELAY / 1000)) * 100}%` }}
                />
              </div>

              <p className="text-white/80 text-sm">
                Switching in {countdown.toFixed(1)}s...
              </p>
              <p className="text-white/50 text-xs">
                Press <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-white/70">Enter</kbd> to switch now or <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-white/70">Esc</kbd> to cancel
              </p>
            </div>
          ) : (
            <p className="text-white/50 text-sm">
              Use <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-white/70">Up</kbd> / <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-white/70">Down</kbd> arrows to select a channel
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChannelSwitcher;
