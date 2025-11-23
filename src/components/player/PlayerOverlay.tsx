/**
 * PlayerOverlay Component
 * Info overlay showing channel name, current program, and next program info
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { usePlayerStore } from '@/stores';
import { useCurrentProgram, formatProgramTime } from '@/hooks/useEPG';
import { LazyImage } from '@/components/common';

// ============================================
// Types
// ============================================

interface PlayerOverlayProps {
  className?: string;
  autoHideDelay?: number;
}

// ============================================
// Constants
// ============================================

const DEFAULT_AUTO_HIDE_DELAY = 5000; // 5 seconds

// ============================================
// Component
// ============================================

export function PlayerOverlay({
  className,
  autoHideDelay = DEFAULT_AUTO_HIDE_DELAY,
}: PlayerOverlayProps) {
  // Local state
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastStreamIdRef = useRef<number | null>(null);

  // Store state
  const currentStream = usePlayerStore((state) => state.currentStream);

  // Get EPG data for current stream
  const streamId = currentStream?.type === 'live' && currentStream.id
    ? currentStream.id
    : null;

  const {
    currentProgram,
    nextProgram,
    progress: programProgress,
    isLoading: epgLoading,
  } = useCurrentProgram(streamId);

  // ============================================
  // Auto-hide Logic
  // ============================================

  const showOverlay = useCallback(() => {
    setIsVisible(true);

    // Clear existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    // Set new hide timeout
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);
  }, [autoHideDelay]);

  // Show overlay on channel change
  useEffect(() => {
    if (currentStream?.id !== lastStreamIdRef.current) {
      lastStreamIdRef.current = currentStream?.id ?? null;
      if (currentStream) {
        showOverlay();
      }
    }
  }, [currentStream, showOverlay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // ============================================
  // Helpers
  // ============================================

  const formatRemainingTime = (stopTimestamp: number): string => {
    const now = Date.now() / 1000;
    const remaining = Math.max(0, stopTimestamp - now);
    const minutes = Math.ceil(remaining / 60);

    if (minutes < 60) {
      return `${minutes} min remaining`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m remaining`;
  };

  // ============================================
  // Render
  // ============================================

  if (!currentStream) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute top-0 left-0 right-0',
        'bg-gradient-to-b from-black/80 via-black/40 to-transparent',
        'p-6 pb-12',
        'transition-all duration-500 ease-in-out',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4 pointer-events-none',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Channel Logo */}
        {currentStream.icon && (
          <div className="flex-shrink-0">
            <LazyImage
              src={currentStream.icon}
              alt={currentStream.name}
              className="w-16 h-16 rounded-lg object-contain bg-dark-700"
            />
          </div>
        )}

        {/* Channel & Program Info */}
        <div className="flex-1 min-w-0">
          {/* Channel Name */}
          <h2 className="text-white text-xl font-semibold truncate mb-1">
            {currentStream.name}
          </h2>

          {/* Live TV Info */}
          {currentStream.type === 'live' && (
            <div className="space-y-3">
              {/* Current Program */}
              {currentProgram && !epgLoading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-semibold',
                      'bg-red-600 text-white'
                    )}>
                      NOW
                    </span>
                    <span className="text-white/80 text-sm">
                      {formatProgramTime(currentProgram.start_timestamp)} - {formatProgramTime(currentProgram.stop_timestamp)}
                    </span>
                  </div>

                  <h3 className="text-white font-medium truncate">
                    {currentProgram.title}
                  </h3>

                  {currentProgram.description && (
                    <p className="text-white/60 text-sm line-clamp-2">
                      {currentProgram.description}
                    </p>
                  )}

                  {/* Program Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                        style={{ width: `${programProgress}%` }}
                      />
                    </div>
                    <span className="text-white/60 text-xs whitespace-nowrap">
                      {formatRemainingTime(currentProgram.stop_timestamp)}
                    </span>
                  </div>
                </div>
              )}

              {/* Next Program */}
              {nextProgram && !epgLoading && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-semibold',
                      'bg-dark-600 text-white/80'
                    )}>
                      NEXT
                    </span>
                    <span className="text-white/60 text-sm">
                      {formatProgramTime(nextProgram.start_timestamp)}
                    </span>
                  </div>

                  <h4 className="text-white/80 text-sm mt-1 truncate">
                    {nextProgram.title}
                  </h4>
                </div>
              )}

              {/* No EPG Available */}
              {!currentProgram && !epgLoading && streamId && (
                <p className="text-white/40 text-sm">
                  No program information available
                </p>
              )}

              {/* Loading EPG */}
              {epgLoading && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  <span className="text-white/40 text-sm">Loading program info...</span>
                </div>
              )}
            </div>
          )}

          {/* VOD Info */}
          {(currentStream.type === 'movie' || currentStream.type === 'series') && (
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <span className={cn(
                'px-1.5 py-0.5 rounded text-xs font-semibold uppercase',
                currentStream.type === 'movie' ? 'bg-purple-600' : 'bg-blue-600',
                'text-white'
              )}>
                {currentStream.type}
              </span>
            </div>
          )}
        </div>

        {/* Stream Type Badge */}
        <div className="flex-shrink-0">
          {currentStream.type === 'live' && (
            <span className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded',
              'bg-red-600/80 text-white text-xs font-semibold'
            )}>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerOverlay;
