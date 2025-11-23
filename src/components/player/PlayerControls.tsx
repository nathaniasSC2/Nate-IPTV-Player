/**
 * PlayerControls Component
 * ========================
 * Playback controls overlay with play/pause, volume, progress, fullscreen.
 *
 * Mobile Features:
 * - Touch-friendly targets (min 44x44px)
 * - Touch event handlers for progress/volume
 * - Swipe to seek gesture
 * - Simplified mobile layout
 * - Always-visible volume on mobile (no hover)
 * - Larger hit areas for sliders
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { usePlayerStore, selectFormattedTime, selectProgress } from '@/stores';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Settings,
  ChevronUp,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { VisuallyHidden } from '@/components/common/SkipLink';

// ============================================
// Types
// ============================================

interface PlayerControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isVisible: boolean;
  onSeek: (time: number) => void;
  onToggleFullscreen: () => void;
  onQualityChange: (quality: string) => void;
}

// ============================================
// Hook: useIsMobile
// ============================================

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

// ============================================
// Component
// ============================================

export function PlayerControls({
  videoRef,
  isVisible,
  onSeek,
  onToggleFullscreen,
  onQualityChange,
}: PlayerControlsProps) {
  // Local state
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Refs
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  // Hook
  const isMobile = useIsMobile();

  // Store state
  const currentStream = usePlayerStore((state) => state.currentStream);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isFullscreen = usePlayerStore((state) => state.isFullscreen);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const volume = usePlayerStore((state) => state.volume);
  const playbackState = usePlayerStore((state) => state.playbackState);
  const currentQuality = usePlayerStore((state) => state.currentQuality);
  const availableQualities = usePlayerStore((state) => state.availableQualities);
  const formattedTime = usePlayerStore(selectFormattedTime);
  const progress = usePlayerStore(selectProgress);

  // Store actions
  const { resume, pause, setVolume, toggleMute } = usePlayerStore();

  // Derived state
  const isLive = currentStream?.type === 'live';
  const hasQualities = availableQualities.length > 1;

  // ============================================
  // Progress Bar Handlers (Mouse)
  // ============================================

  const calculateProgressFromEvent = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    if (!progressRef.current || !videoRef.current) return 0;

    const rect = progressRef.current.getBoundingClientRect();
    let clientX: number;

    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
    } else {
      clientX = e.clientX;
    }

    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return percent * (videoRef.current.duration || 0);
  }, [videoRef]);

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (isLive) return;

    const time = calculateProgressFromEvent(e);
    onSeek(time);
  }, [isLive, calculateProgressFromEvent, onSeek]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent) => {
    if (isLive) return;

    setIsDraggingProgress(true);
    const time = calculateProgressFromEvent(e);
    onSeek(time);
  }, [isLive, calculateProgressFromEvent, onSeek]);

  const handleProgressMouseMove = useCallback((e: React.MouseEvent) => {
    if (isLive || !progressRef.current || !videoRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = percent * (videoRef.current.duration || 0);
    setHoverProgress(time);
  }, [isLive, videoRef]);

  const handleProgressMouseLeave = useCallback(() => {
    setHoverProgress(null);
  }, []);

  // ============================================
  // Progress Bar Handlers (Touch)
  // ============================================

  const handleProgressTouchStart = useCallback((e: React.TouchEvent) => {
    if (isLive) return;

    setIsDraggingProgress(true);
    const time = calculateProgressFromEvent(e);
    onSeek(time);
  }, [isLive, calculateProgressFromEvent, onSeek]);

  const handleProgressTouchMove = useCallback((e: React.TouchEvent) => {
    if (isLive || !isDraggingProgress) return;

    const time = calculateProgressFromEvent(e);
    onSeek(time);
  }, [isLive, isDraggingProgress, calculateProgressFromEvent, onSeek]);

  const handleProgressTouchEnd = useCallback(() => {
    setIsDraggingProgress(false);
  }, []);

  // Global mouse handlers for dragging
  useEffect(() => {
    if (!isDraggingProgress) return;

    const handleMouseMove = (e: MouseEvent) => {
      const time = calculateProgressFromEvent(e);
      onSeek(time);
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const time = calculateProgressFromEvent(e);
      onSeek(time);
    };

    const handleTouchEnd = () => {
      setIsDraggingProgress(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingProgress, calculateProgressFromEvent, onSeek]);

  // ============================================
  // Volume Slider Handlers
  // ============================================

  const calculateVolumeFromEvent = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    if (!volumeRef.current) return 0;

    const rect = volumeRef.current.getBoundingClientRect();
    let clientX: number;

    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
    } else {
      clientX = e.clientX;
    }

    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handleVolumeClick = useCallback((e: React.MouseEvent) => {
    const newVolume = calculateVolumeFromEvent(e);
    setVolume(newVolume);
  }, [calculateVolumeFromEvent, setVolume]);

  const handleVolumeMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDraggingVolume(true);
    const newVolume = calculateVolumeFromEvent(e);
    setVolume(newVolume);
  }, [calculateVolumeFromEvent, setVolume]);

  const handleVolumeTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDraggingVolume(true);
    const newVolume = calculateVolumeFromEvent(e);
    setVolume(newVolume);
  }, [calculateVolumeFromEvent, setVolume]);

  const handleVolumeTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingVolume) return;
    const newVolume = calculateVolumeFromEvent(e);
    setVolume(newVolume);
  }, [isDraggingVolume, calculateVolumeFromEvent, setVolume]);

  // Global mouse handlers for volume dragging
  useEffect(() => {
    if (!isDraggingVolume) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newVolume = calculateVolumeFromEvent(e);
      setVolume(newVolume);
    };

    const handleMouseUp = () => {
      setIsDraggingVolume(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const newVolume = calculateVolumeFromEvent(e);
      setVolume(newVolume);
    };

    const handleTouchEnd = () => {
      setIsDraggingVolume(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingVolume, calculateVolumeFromEvent, setVolume]);

  // ============================================
  // Swipe to Seek Gesture
  // ============================================

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    if (isLive) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = playbackState.currentTime;
  }, [isLive, playbackState.currentTime]);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (isLive) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;

    // Swipe 100px = 10 seconds
    const seekAmount = (deltaX / 100) * 10;

    if (Math.abs(seekAmount) > 2) {
      const newTime = Math.max(0, Math.min(
        playbackState.duration,
        touchStartTime.current + seekAmount
      ));
      onSeek(newTime);
    }
  }, [isLive, playbackState.duration, onSeek]);

  // ============================================
  // Quality Menu Handlers
  // ============================================

  useEffect(() => {
    if (!showQualityMenu) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showQualityMenu]);

  // ============================================
  // Quick Seek Handlers
  // ============================================

  const handleSeekBack = useCallback(() => {
    onSeek(Math.max(0, playbackState.currentTime - 10));
  }, [onSeek, playbackState.currentTime]);

  const handleSeekForward = useCallback(() => {
    onSeek(Math.min(playbackState.duration, playbackState.currentTime + 10));
  }, [onSeek, playbackState.currentTime, playbackState.duration]);

  // ============================================
  // Helpers
  // ============================================

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '--:--';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // ============================================
  // Render
  // ============================================

  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0',
        'bg-gradient-to-t from-black/90 via-black/60 to-transparent',
        // More padding on mobile for touch
        'pt-16 pb-4 px-3 sm:px-4',
        'transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onTouchStart={!isLive ? handleSwipeStart : undefined}
      onTouchEnd={!isLive ? handleSwipeEnd : undefined}
    >
      {/* Progress Bar (VOD only) */}
      {!isLive && (
        <div className="mb-3 sm:mb-4">
          {/* Hover Time Preview */}
          {hoverProgress !== null && !isMobile && (
            <div
              className="absolute bottom-24 px-2 py-1 bg-dark-800 rounded text-xs text-white transform -translate-x-1/2 pointer-events-none"
              style={{
                left: `${((hoverProgress / (playbackState.duration || 1)) * 100)}%`,
              }}
            >
              {formatTime(hoverProgress)}
            </div>
          )}

          {/* Progress Track - Larger touch area on mobile */}
          <div
            ref={progressRef}
            className={cn(
              'relative rounded-full cursor-pointer',
              // Larger touch target on mobile
              'h-2 sm:h-1',
              'bg-white/30',
              'hover:h-2 sm:hover:h-1.5',
              'transition-all group/progress',
              // Add padding for easier touch
              'py-2 -my-2'
            )}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={`${formattedTime.current} of ${formattedTime.duration}`}
            tabIndex={0}
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={handleProgressMouseLeave}
            onTouchStart={handleProgressTouchStart}
            onTouchMove={handleProgressTouchMove}
            onTouchEnd={handleProgressTouchEnd}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                onSeek(playbackState.currentTime + 5);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onSeek(playbackState.currentTime - 5);
              }
            }}
          >
            {/* Track background */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 sm:h-1 bg-white/30 rounded-full" />

            {/* Buffered */}
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 h-1 sm:h-1 bg-white/40 rounded-full"
              style={{
                width: `${playbackState.duration > 0 ? (playbackState.buffered / playbackState.duration) * 100 : 0}%`,
              }}
            />

            {/* Progress */}
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 h-1 sm:h-1 bg-primary-500 rounded-full"
              style={{ width: `${progress}%` }}
            />

            {/* Thumb - Always visible on mobile */}
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
                // Larger thumb on mobile
                'w-4 h-4 sm:w-3 sm:h-3',
                'bg-primary-500 rounded-full',
                'shadow-lg',
                // Always visible on mobile, hover on desktop
                isMobile ? 'opacity-100' : 'opacity-0 group-hover/progress:opacity-100',
                'transition-opacity',
                isDraggingProgress && 'opacity-100 scale-125'
              )}
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Controls Row */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Seek Back Button (Mobile) */}
        {isMobile && !isLive && (
          <button
            onClick={handleSeekBack}
            className={cn(
              'flex items-center justify-center',
              // Min 44x44 touch target
              'w-11 h-11 rounded-full',
              'bg-white/10 active:bg-white/20',
              'transition-colors',
              'tap-highlight-transparent'
            )}
            aria-label="Seek back 10 seconds"
          >
            <SkipBack className="w-5 h-5 text-white" aria-hidden="true" />
          </button>
        )}

        {/* Play/Pause Button */}
        <button
          onClick={() => isPlaying ? pause() : resume()}
          className={cn(
            'flex items-center justify-center',
            // Min 44x44 touch target
            'w-11 h-11 sm:w-10 sm:h-10 rounded-full',
            'bg-white/10 hover:bg-white/20 active:bg-white/30',
            'transition-colors',
            'tap-highlight-transparent',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-black'
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          aria-pressed={isPlaying}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" aria-hidden="true" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" aria-hidden="true" />
          )}
          <VisuallyHidden>{isPlaying ? 'Pause' : 'Play'}</VisuallyHidden>
        </button>

        {/* Seek Forward Button (Mobile) */}
        {isMobile && !isLive && (
          <button
            onClick={handleSeekForward}
            className={cn(
              'flex items-center justify-center',
              // Min 44x44 touch target
              'w-11 h-11 rounded-full',
              'bg-white/10 active:bg-white/20',
              'transition-colors',
              'tap-highlight-transparent'
            )}
            aria-label="Seek forward 10 seconds"
          >
            <SkipForward className="w-5 h-5 text-white" aria-hidden="true" />
          </button>
        )}

        {/* Volume Control */}
        <div
          className={cn(
            'flex items-center gap-2',
            isMobile ? '' : 'group/volume'
          )}
          role="group"
          aria-label="Volume controls"
        >
          <button
            onClick={() => {
              if (isMobile) {
                setShowVolumeSlider(!showVolumeSlider);
              } else {
                toggleMute();
              }
            }}
            className={cn(
              'flex items-center justify-center',
              // Min 44x44 touch target
              'w-11 h-11 sm:w-8 sm:h-8 rounded-full',
              'hover:bg-white/10 active:bg-white/20',
              'transition-colors',
              'tap-highlight-transparent',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-black'
            )}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            aria-pressed={isMuted}
          >
            <VolumeIcon className="w-5 h-5 text-white" aria-hidden="true" />
            <VisuallyHidden>{isMuted ? 'Unmute' : 'Mute'}</VisuallyHidden>
          </button>

          {/* Volume Slider */}
          <div
            ref={volumeRef}
            className={cn(
              'overflow-hidden transition-all duration-200',
              // On mobile: toggle visibility, on desktop: hover
              isMobile
                ? showVolumeSlider ? 'w-24' : 'w-0'
                : 'w-0 group-hover/volume:w-20 focus-within:w-20'
            )}
          >
            <div
              className={cn(
                'relative rounded-full cursor-pointer',
                // Larger touch target
                'h-2 sm:h-1',
                'bg-white/30',
                // Add padding for easier touch
                'py-2 -my-2'
              )}
              role="slider"
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
              aria-valuetext={`${Math.round((isMuted ? 0 : volume) * 100)}%`}
              tabIndex={0}
              onClick={handleVolumeClick}
              onMouseDown={handleVolumeMouseDown}
              onTouchStart={handleVolumeTouchStart}
              onTouchMove={handleVolumeTouchMove}
              onTouchEnd={() => setIsDraggingVolume(false)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  setVolume(Math.min(1, volume + 0.1));
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  setVolume(Math.max(0, volume - 0.1));
                }
              }}
            >
              {/* Track background */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-white/30 rounded-full" />

              {/* Volume level */}
              <div
                className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-white rounded-full"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />

              {/* Thumb */}
              <div
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
                  'w-3 h-3 sm:w-2.5 sm:h-2.5 bg-white rounded-full',
                  isMobile ? 'opacity-100' : 'opacity-0 group-hover/volume:opacity-100',
                  'transition-opacity',
                  isDraggingVolume && 'opacity-100'
                )}
                style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Time Display / Live Badge */}
        <div className={cn(
          'flex items-center gap-1 sm:gap-2',
          'text-xs sm:text-sm text-white',
          // Hide on very small screens when not enough space
          'hidden xs:flex'
        )}>
          {isLive ? (
            <span className={cn(
              'flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded',
              'bg-red-600 text-white text-[10px] sm:text-xs font-semibold uppercase'
            )}>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Live
            </span>
          ) : (
            <>
              <span className="tabular-nums">{formattedTime.current}</span>
              <span className="text-white/50">/</span>
              <span className="tabular-nums text-white/70">{formattedTime.duration}</span>
            </>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Quality Selector */}
        {hasQualities && (
          <div className="relative" ref={qualityMenuRef}>
            <button
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded',
                'text-xs sm:text-sm text-white',
                'hover:bg-white/10 active:bg-white/20',
                'transition-colors',
                // Min touch target
                'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
                'tap-highlight-transparent',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-black'
              )}
              aria-label={`Quality settings, current: ${currentQuality || 'Auto'}`}
              aria-haspopup="listbox"
              aria-expanded={showQualityMenu}
            >
              <Settings className="w-4 h-4 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{currentQuality || 'Auto'}</span>
              <ChevronUp className={cn(
                'w-3 h-3 sm:w-4 sm:h-4 transition-transform hidden sm:block',
                showQualityMenu && 'rotate-180'
              )} aria-hidden="true" />
            </button>

            {/* Quality Menu */}
            {showQualityMenu && (
              <div
                className={cn(
                  'absolute bottom-full right-0 mb-2',
                  'bg-dark-800/95 backdrop-blur-sm rounded-lg',
                  'border border-dark-600',
                  'py-2 min-w-32',
                  'shadow-xl'
                )}
                role="listbox"
                aria-label="Video quality options"
              >
                <div className="px-3 py-1 text-xs text-gray-400 font-medium" id="quality-label">
                  Quality
                </div>
                {availableQualities.map((quality, index) => (
                  <button
                    key={quality}
                    onClick={() => {
                      onQualityChange(quality);
                      setShowQualityMenu(false);
                    }}
                    className={cn(
                      'w-full px-3 text-left text-sm',
                      // Min touch target height
                      'min-h-[44px] flex items-center',
                      'hover:bg-white/10 active:bg-white/20 transition-colors',
                      'focus:outline-none focus:bg-white/10',
                      'tap-highlight-transparent',
                      quality === currentQuality
                        ? 'text-primary-400 font-medium'
                        : 'text-white'
                    )}
                    role="option"
                    aria-selected={quality === currentQuality}
                    tabIndex={showQualityMenu ? 0 : -1}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowQualityMenu(false);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const next = e.currentTarget.nextElementSibling as HTMLButtonElement;
                        next?.focus();
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prev = e.currentTarget.previousElementSibling as HTMLButtonElement;
                        if (prev?.tagName === 'BUTTON') prev.focus();
                      }
                    }}
                    autoFocus={index === 0 && showQualityMenu}
                  >
                    {quality}
                    {quality === currentQuality && (
                      <VisuallyHidden> (currently selected)</VisuallyHidden>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          className={cn(
            'flex items-center justify-center',
            // Min 44x44 touch target
            'w-11 h-11 sm:w-8 sm:h-8 rounded-full',
            'hover:bg-white/10 active:bg-white/20',
            'transition-colors',
            'tap-highlight-transparent',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-black'
          )}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-pressed={isFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5 text-white" aria-hidden="true" />
          ) : (
            <Maximize className="w-5 h-5 text-white" aria-hidden="true" />
          )}
          <VisuallyHidden>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</VisuallyHidden>
        </button>
      </div>

      {/* Center Play Button (Large) - Touch-friendly */}
      {!isPlaying && isVisible && (
        <button
          onClick={() => resume()}
          className={cn(
            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'flex items-center justify-center',
            // Larger on mobile
            'w-16 h-16 sm:w-20 sm:h-20 rounded-full',
            'bg-white/20 backdrop-blur-sm',
            'hover:bg-white/30 active:bg-white/40',
            'hover:scale-105 active:scale-95',
            'transition-all duration-200',
            'tap-highlight-transparent',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-4 focus:ring-offset-black/50'
          )}
          aria-label="Play video"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" aria-hidden="true" />
          <VisuallyHidden>Play video</VisuallyHidden>
        </button>
      )}
    </div>
  );
}

export default PlayerControls;
