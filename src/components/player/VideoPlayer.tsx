/**
 * VideoPlayer Component
 * Main video player with HLS.js support for live streams
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import Hls from 'hls.js';
import { cn } from '@/utils/cn';
import { usePlayerStore } from '@/stores';
import { PlayerControls } from './PlayerControls';
import { PlayerOverlay } from './PlayerOverlay';
import { ChannelSwitcher } from './ChannelSwitcher';
import { Loader2, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { LiveRegion, KeyboardShortcutsHelp, VisuallyHidden } from '@/components/common/SkipLink';

// ============================================
// Types
// ============================================

interface VideoPlayerProps {
  className?: string;
  showControls?: boolean;
  showOverlay?: boolean;
  autoPlay?: boolean;
  onClose?: () => void;
}

interface HlsQualityLevel {
  height: number;
  width: number;
  bitrate: number;
  name?: string;
}

// ============================================
// Constants
// ============================================

const SEEK_STEP = 10; // seconds
const VOLUME_STEP = 0.1;

// Keyboard shortcuts documentation for screen reader users
const KEYBOARD_SHORTCUTS = [
  { key: 'Space', description: 'Play/Pause' },
  { key: 'K', description: 'Play/Pause' },
  { key: 'F', description: 'Toggle fullscreen' },
  { key: 'M', description: 'Toggle mute' },
  { key: 'Arrow Left', description: 'Seek backward 10s (VOD)' },
  { key: 'Arrow Right', description: 'Seek forward 10s (VOD)' },
  { key: 'Arrow Up', description: 'Volume up / Channel switcher (Live)' },
  { key: 'Arrow Down', description: 'Volume down / Channel switcher (Live)' },
  { key: '0-9', description: 'Seek to percentage (VOD)' },
  { key: 'Escape', description: 'Exit fullscreen / Close channel switcher' },
  { key: '?', description: 'Toggle keyboard shortcuts help' },
];

// ============================================
// Component
// ============================================

export function VideoPlayer({
  className,
  showControls = true,
  showOverlay = true,
  autoPlay = true,
  onClose,
}: VideoPlayerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);

  // Local state
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [showChannelSwitcher, setShowChannelSwitcher] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');

  // Store state
  const currentStream = usePlayerStore((state) => state.currentStream);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isFullscreen = usePlayerStore((state) => state.isFullscreen);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const volume = usePlayerStore((state) => state.volume);
  const isLoading = usePlayerStore((state) => state.isLoading);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const error = usePlayerStore((state) => state.error);
  const currentQuality = usePlayerStore((state) => state.currentQuality);

  // Store actions
  const {
    pause,
    resume,
    setVolume,
    toggleMute,
    setFullscreen,
    setLoading,
    setBuffering,
    setError,
    setQualities,
    setQuality,
    updatePlaybackState,
    stop,
  } = usePlayerStore();

  // ============================================
  // HLS Initialization
  // ============================================

  const initializeHls = useCallback((url: string, video: HTMLVideoElement) => {
    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if URL is HLS
    const isHls = url.endsWith('.m3u8') || url.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        startLevel: -1, // Auto quality
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        testBandwidth: true,
      });

      hlsRef.current = hls;

      // Event handlers
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(url);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setLoading(false);
        retryCountRef.current = 0;

        // Extract quality levels
        const qualities = data.levels.map((level: HlsQualityLevel, index: number) => ({
          index,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)}kbps`,
        }));

        if (qualities.length > 0) {
          const qualityLabels = ['Auto', ...qualities.map((q: { label: string }) => q.label)];
          setQualities(qualityLabels, 'Auto');
        }

        if (autoPlay) {
          video.play().catch((err) => {
            console.warn('Autoplay prevented:', err);
            // If autoplay is blocked, pause the player state
            pause();
          });
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const level = hls.levels[data.level];
        if (level) {
          const label = level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)}kbps`;
          setQuality(hls.autoLevelEnabled ? 'Auto' : label);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS Error:', data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover from network error
              if (retryCountRef.current < 3) {
                retryCountRef.current++;
                console.log(`Network error, attempting recovery (${retryCountRef.current}/3)...`);
                hls.startLoad();
              } else {
                setError('Network error: Unable to load stream. Please check your connection.');
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              setError(`Playback error: ${data.details || 'Unknown error occurred'}`);
              hls.destroy();
              break;
          }
        }
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        setBuffering(false);
      });

      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = url;
      setLoading(false);

      if (autoPlay) {
        video.play().catch((err) => {
          console.warn('Autoplay prevented:', err);
          pause();
        });
      }
    } else {
      // For .ts streams or other formats, use direct source
      video.src = url;
      setLoading(false);
      setQualities([], undefined);

      if (autoPlay) {
        video.play().catch((err) => {
          console.warn('Autoplay prevented:', err);
          pause();
        });
      }
    }
  }, [autoPlay, pause, setBuffering, setError, setLoading, setQualities, setQuality]);

  // ============================================
  // Quality Change Handler
  // ============================================

  const handleQualityChange = useCallback((quality: string) => {
    if (!hlsRef.current) return;

    if (quality === 'Auto') {
      hlsRef.current.currentLevel = -1; // Auto
    } else {
      const levelIndex = hlsRef.current.levels.findIndex((level) => {
        const label = level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)}kbps`;
        return label === quality;
      });
      if (levelIndex >= 0) {
        hlsRef.current.currentLevel = levelIndex;
      }
    }
    setQuality(quality);
  }, [setQuality]);

  // ============================================
  // Video Event Handlers
  // ============================================

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    updatePlaybackState({
      currentTime: video.currentTime,
      duration: video.duration || 0,
      buffered: video.buffered.length > 0
        ? video.buffered.end(video.buffered.length - 1)
        : 0,
    });
  }, [updatePlaybackState]);

  const handlePlay = useCallback(() => {
    if (!isPlaying) resume();
  }, [isPlaying, resume]);

  const handlePause = useCallback(() => {
    if (isPlaying) pause();
  }, [isPlaying, pause]);

  const handleWaiting = useCallback(() => {
    setBuffering(true);
  }, [setBuffering]);

  const handlePlaying = useCallback(() => {
    setBuffering(false);
    setLoading(false);
  }, [setBuffering, setLoading]);

  const handleEnded = useCallback(() => {
    pause();
    updatePlaybackState({ currentTime: 0 });
  }, [pause, updatePlaybackState]);

  const handleError = useCallback(() => {
    const video = videoRef.current;
    if (!video?.error) return;

    const errorMessages: Record<number, string> = {
      1: 'Video loading aborted',
      2: 'Network error while loading video',
      3: 'Video decoding error',
      4: 'Video format not supported',
    };

    setError(errorMessages[video.error.code] || 'Unknown video error');
  }, [setError]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    updatePlaybackState({
      duration: video.duration || 0,
    });
  }, [updatePlaybackState]);

  // ============================================
  // Retry Handler
  // ============================================

  const handleRetry = useCallback(() => {
    if (!currentStream || !videoRef.current) return;

    setError(null);
    setLoading(true);
    retryCountRef.current = 0;
    initializeHls(currentStream.url, videoRef.current);
  }, [currentStream, initializeHls, setError, setLoading]);

  // ============================================
  // Seek Handler
  // ============================================

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, Math.min(time, video.duration || 0));
    video.currentTime = newTime;
    updatePlaybackState({ currentTime: newTime });
  }, [updatePlaybackState]);

  // ============================================
  // Fullscreen Handler
  // ============================================

  const handleToggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [setFullscreen]);

  // ============================================
  // Keyboard Handlers
  // ============================================

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const video = videoRef.current;
    if (!video) return;

    // Ignore if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case ' ':
      case 'k':
        e.preventDefault();
        if (isPlaying) {
          video.pause();
        } else {
          video.play();
        }
        break;

      case 'f':
        e.preventDefault();
        handleToggleFullscreen();
        break;

      case 'm':
        e.preventDefault();
        toggleMute();
        break;

      case 'arrowleft':
        e.preventDefault();
        if (currentStream?.type !== 'live') {
          handleSeek(video.currentTime - SEEK_STEP);
        }
        break;

      case 'arrowright':
        e.preventDefault();
        if (currentStream?.type !== 'live') {
          handleSeek(video.currentTime + SEEK_STEP);
        }
        break;

      case 'arrowup':
        e.preventDefault();
        if (currentStream?.type === 'live') {
          setShowChannelSwitcher(true);
        } else {
          setVolume(Math.min(1, volume + VOLUME_STEP));
        }
        break;

      case 'arrowdown':
        e.preventDefault();
        if (currentStream?.type === 'live') {
          setShowChannelSwitcher(true);
        } else {
          setVolume(Math.max(0, volume - VOLUME_STEP));
        }
        break;

      case 'escape':
        e.preventDefault();
        if (showKeyboardHelp) {
          setShowKeyboardHelp(false);
        } else if (showChannelSwitcher) {
          setShowChannelSwitcher(false);
        } else if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        break;

      case '?':
        e.preventDefault();
        setShowKeyboardHelp((prev) => !prev);
        break;

      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        e.preventDefault();
        if (currentStream?.type !== 'live' && video.duration) {
          const percent = parseInt(e.key) * 10;
          handleSeek((percent / 100) * video.duration);
        }
        break;

      default:
        break;
    }
  }, [
    isPlaying,
    currentStream,
    volume,
    showChannelSwitcher,
    showKeyboardHelp,
    handleToggleFullscreen,
    handleSeek,
    toggleMute,
    setVolume,
  ]);

  // ============================================
  // Effects
  // ============================================

  // Initialize player when stream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentStream) return;

    setLoading(true);
    setError(null);
    retryCountRef.current = 0;
    initializeHls(currentStream.url, video);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentStream, initializeHls, setError, setLoading]);

  // Sync play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) {
      video.play().catch(() => {
        pause();
      });
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying, pause]);

  // Sync volume
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = isMuted ? 0 : volume;
    video.muted = isMuted;
  }, [volume, isMuted]);

  // Handle quality change from store
  useEffect(() => {
    if (currentQuality) {
      handleQualityChange(currentQuality);
    }
  }, [currentQuality, handleQualityChange]);

  // Keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [setFullscreen]);

  // Announce status changes for screen readers
  useEffect(() => {
    if (isLoading) {
      setStatusAnnouncement('Loading stream...');
    } else if (isBuffering) {
      setStatusAnnouncement('Buffering...');
    } else if (error) {
      setStatusAnnouncement(`Playback error: ${error}`);
    } else if (isPlaying) {
      setStatusAnnouncement('Playing');
    } else {
      setStatusAnnouncement('Paused');
    }
  }, [isLoading, isBuffering, error, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // ============================================
  // Mouse Activity Handlers
  // ============================================

  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = useCallback(() => {
    setShowControlsOverlay(true);

    if (mouseTimeoutRef.current) {
      clearTimeout(mouseTimeoutRef.current);
    }

    mouseTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControlsOverlay(false);
      }
    }, 3000);
  }, [isPlaying]);

  const handleMouseLeave = useCallback(() => {
    if (mouseTimeoutRef.current) {
      clearTimeout(mouseTimeoutRef.current);
    }
    if (isPlaying) {
      setShowControlsOverlay(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };
  }, []);

  // ============================================
  // Render
  // ============================================

  if (!currentStream) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-dark-900',
        'text-gray-400',
        className
      )}>
        <p>No stream selected</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black overflow-hidden',
        'group',
        isFullscreen && 'fixed inset-0 z-50',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label={`Video player: ${currentStream?.name || 'No stream selected'}`}
    >
      {/* Screen Reader Live Region for Status Announcements */}
      <LiveRegion politeness="polite" aria-atomic={true}>
        {statusAnnouncement}
      </LiveRegion>

      {/* Screen Reader Description */}
      <VisuallyHidden>
        Press question mark for keyboard shortcuts.
        {currentStream?.type === 'live' ? 'Live stream.' : 'Video on demand.'}
        {isPlaying ? 'Currently playing.' : 'Currently paused.'}
      </VisuallyHidden>

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        aria-label={currentStream?.name || 'Video player'}
        onClick={() => {
          if (isPlaying) {
            videoRef.current?.pause();
          } else {
            videoRef.current?.play();
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onEnded={handleEnded}
        onError={handleError}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Loading Spinner */}
      {(isLoading || isBuffering) && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            <span className="text-white text-sm">
              {isLoading ? 'Loading stream...' : 'Buffering...'}
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h3 className="text-white text-lg font-semibold">Playback Error</h3>
            <p className="text-gray-400 text-sm">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-primary-600 text-white',
                  'hover:bg-primary-700 transition-colors'
                )}
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              {onClose && (
                <button
                  onClick={() => {
                    stop();
                    onClose();
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg',
                    'bg-dark-700 text-gray-300',
                    'hover:bg-dark-600 transition-colors'
                  )}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Player Overlay (Channel Info) */}
      {showOverlay && !error && (
        <PlayerOverlay />
      )}

      {/* Player Controls */}
      {showControls && !error && (
        <PlayerControls
          videoRef={videoRef}
          isVisible={showControlsOverlay || !isPlaying}
          onSeek={handleSeek}
          onToggleFullscreen={handleToggleFullscreen}
          onQualityChange={handleQualityChange}
        />
      )}

      {/* Channel Switcher */}
      {showChannelSwitcher && currentStream?.type === 'live' && (
        <ChannelSwitcher
          onClose={() => setShowChannelSwitcher(false)}
        />
      )}

      {/* Keyboard Shortcuts Help Button */}
      <button
        onClick={() => setShowKeyboardHelp((prev) => !prev)}
        className={cn(
          'absolute top-4 right-4 z-20',
          'flex items-center justify-center',
          'w-8 h-8 rounded-full',
          'bg-dark-800/80 hover:bg-dark-700',
          'text-gray-400 hover:text-white',
          'transition-all duration-200',
          'opacity-0 group-hover:opacity-100',
          'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500'
        )}
        aria-label="Show keyboard shortcuts help"
        aria-expanded={showKeyboardHelp}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Keyboard Shortcuts Help Panel */}
      {showKeyboardHelp && (
        <div
          className={cn(
            'absolute top-14 right-4 z-30',
            'animate-fade-in'
          )}
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <KeyboardShortcutsHelp
            shortcuts={KEYBOARD_SHORTCUTS}
            title="Keyboard Shortcuts"
            className="max-w-xs shadow-xl"
          />
          <button
            onClick={() => setShowKeyboardHelp(false)}
            className={cn(
              'absolute -top-2 -right-2',
              'w-6 h-6 rounded-full',
              'bg-dark-700 hover:bg-dark-600',
              'text-gray-400 hover:text-white',
              'flex items-center justify-center',
              'transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
            aria-label="Close keyboard shortcuts help"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
