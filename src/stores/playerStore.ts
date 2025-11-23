/**
 * Player Store
 * Manages video player state and controls
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CurrentStream } from '../services/xtream/types';

// ============================================
// Types
// ============================================

interface PlaybackState {
  currentTime: number;
  duration: number;
  buffered: number;
  playbackRate: number;
}

interface PlayerState {
  // Current Stream
  currentStream: CurrentStream | null;

  // Playback State
  isPlaying: boolean;
  isFullscreen: boolean;
  isPiP: boolean; // Picture-in-Picture
  isMuted: boolean;
  volume: number;

  // Playback Details
  playbackState: PlaybackState;

  // Loading & Error States
  isLoading: boolean;
  isBuffering: boolean;
  error: string | null;

  // Quality & Settings
  currentQuality: string | null;
  availableQualities: string[];
  subtitleTrack: number | null;
  audioTrack: number | null;

  // History
  recentStreams: CurrentStream[];

  // Actions
  play: (stream: CurrentStream) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  togglePiP: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;

  // State Updates
  updatePlaybackState: (state: Partial<PlaybackState>) => void;
  setLoading: (loading: boolean) => void;
  setBuffering: (buffering: boolean) => void;
  setError: (error: string | null) => void;
  setQualities: (qualities: string[], current?: string) => void;
  setQuality: (quality: string) => void;
  setSubtitleTrack: (track: number | null) => void;
  setAudioTrack: (track: number | null) => void;

  // Fullscreen State
  setFullscreen: (fullscreen: boolean) => void;
  setPiP: (pip: boolean) => void;
}

// ============================================
// Constants
// ============================================

const MAX_RECENT_STREAMS = 20;
const DEFAULT_VOLUME = 0.8;

// ============================================
// Store
// ============================================

export const usePlayerStore = create<PlayerState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    currentStream: null,
    isPlaying: false,
    isFullscreen: false,
    isPiP: false,
    isMuted: false,
    volume: DEFAULT_VOLUME,

    playbackState: {
      currentTime: 0,
      duration: 0,
      buffered: 0,
      playbackRate: 1,
    },

    isLoading: false,
    isBuffering: false,
    error: null,

    currentQuality: null,
    availableQualities: [],
    subtitleTrack: null,
    audioTrack: null,

    recentStreams: [],

    // Play a stream
    play: (stream) => {
      const { recentStreams } = get();

      // Add to recent streams (remove duplicate if exists)
      const filteredRecent = recentStreams.filter(
        (s) => !(s.id === stream.id && s.type === stream.type)
      );
      const updatedRecent = [stream, ...filteredRecent].slice(0, MAX_RECENT_STREAMS);

      set({
        currentStream: stream,
        isPlaying: true,
        isLoading: true,
        error: null,
        playbackState: {
          currentTime: 0,
          duration: 0,
          buffered: 0,
          playbackRate: 1,
        },
        recentStreams: updatedRecent,
      });
    },

    // Pause playback
    pause: () => {
      set({ isPlaying: false });
    },

    // Resume playback
    resume: () => {
      const { currentStream, error } = get();
      if (currentStream && !error) {
        set({ isPlaying: true });
      }
    },

    // Stop playback completely
    stop: () => {
      set({
        currentStream: null,
        isPlaying: false,
        isLoading: false,
        isBuffering: false,
        error: null,
        playbackState: {
          currentTime: 0,
          duration: 0,
          buffered: 0,
          playbackRate: 1,
        },
        currentQuality: null,
        availableQualities: [],
      });
    },

    // Set volume (0-1)
    setVolume: (volume) => {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      set({
        volume: clampedVolume,
        isMuted: clampedVolume === 0,
      });
    },

    // Toggle mute
    toggleMute: () => {
      const { isMuted, volume } = get();
      set({ isMuted: !isMuted });
      // If unmuting and volume is 0, set to default
      if (isMuted && volume === 0) {
        set({ volume: DEFAULT_VOLUME });
      }
    },

    // Toggle fullscreen
    toggleFullscreen: () => {
      const { isFullscreen } = get();
      set({ isFullscreen: !isFullscreen });
      // Note: Actual fullscreen toggle should be handled by the video player component
    },

    // Toggle Picture-in-Picture
    togglePiP: () => {
      const { isPiP } = get();
      set({ isPiP: !isPiP });
    },

    // Seek to specific time
    seek: (time) => {
      const { playbackState } = get();
      const clampedTime = Math.max(0, Math.min(time, playbackState.duration));
      set({
        playbackState: {
          ...playbackState,
          currentTime: clampedTime,
        },
      });
    },

    // Set playback rate
    setPlaybackRate: (rate) => {
      const { playbackState } = get();
      set({
        playbackState: {
          ...playbackState,
          playbackRate: rate,
        },
      });
    },

    // Update playback state (called by video player)
    updatePlaybackState: (state) => {
      const { playbackState } = get();
      set({
        playbackState: {
          ...playbackState,
          ...state,
        },
      });
    },

    // Set loading state
    setLoading: (loading) => {
      set({ isLoading: loading });
    },

    // Set buffering state
    setBuffering: (buffering) => {
      set({ isBuffering: buffering });
    },

    // Set error
    setError: (error) => {
      set({
        error,
        isPlaying: error ? false : get().isPlaying,
        isLoading: false,
      });
    },

    // Set available qualities
    setQualities: (qualities, current) => {
      set({
        availableQualities: qualities,
        currentQuality: current || qualities[0] || null,
      });
    },

    // Set current quality
    setQuality: (quality) => {
      set({ currentQuality: quality });
    },

    // Set subtitle track
    setSubtitleTrack: (track) => {
      set({ subtitleTrack: track });
    },

    // Set audio track
    setAudioTrack: (track) => {
      set({ audioTrack: track });
    },

    // Set fullscreen state (for external updates)
    setFullscreen: (fullscreen) => {
      set({ isFullscreen: fullscreen });
    },

    // Set PiP state (for external updates)
    setPiP: (pip) => {
      set({ isPiP: pip });
    },
  }))
);

// ============================================
// Selectors
// ============================================

export const selectCurrentStream = (state: PlayerState) => state.currentStream;
export const selectIsPlaying = (state: PlayerState) => state.isPlaying;
export const selectIsFullscreen = (state: PlayerState) => state.isFullscreen;
export const selectVolume = (state: PlayerState) => state.volume;
export const selectIsMuted = (state: PlayerState) => state.isMuted;
export const selectIsLoading = (state: PlayerState) => state.isLoading;
export const selectIsBuffering = (state: PlayerState) => state.isBuffering;
export const selectError = (state: PlayerState) => state.error;
export const selectPlaybackState = (state: PlayerState) => state.playbackState;
export const selectRecentStreams = (state: PlayerState) => state.recentStreams;

export const selectProgress = (state: PlayerState) => {
  const { currentTime, duration } = state.playbackState;
  return duration > 0 ? (currentTime / duration) * 100 : 0;
};

export const selectFormattedTime = (state: PlayerState) => {
  const { currentTime, duration } = state.playbackState;

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return {
    current: formatTime(currentTime),
    duration: formatTime(duration),
    remaining: formatTime(duration - currentTime),
  };
};

// ============================================
// Derived Hooks
// ============================================

/**
 * Subscribe to player state changes
 * Useful for integrating with external video player libraries
 */
export const subscribeToPlayerState = (
  callback: (state: PlayerState) => void
) => {
  return usePlayerStore.subscribe(callback);
};

/**
 * Get effective volume (considering mute state)
 */
export const selectEffectiveVolume = (state: PlayerState) =>
  state.isMuted ? 0 : state.volume;
