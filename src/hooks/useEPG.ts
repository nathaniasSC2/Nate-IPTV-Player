/**
 * EPG (Electronic Program Guide) Hooks
 * Hooks for fetching and managing EPG data
 */

import { useQuery, useQueries, UseQueryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getShortEPG,
  getEPGForChannel,
  getNowPlaying,
} from '../services/xtream/client';
import type { EPGProgram, XtreamConnection } from '../services/xtream/types';
import { useConnectionStore } from '../stores/connectionStore';

// ============================================
// Query Keys
// ============================================

export const epgQueryKeys = {
  shortEPG: (connectionId: string, streamId: number) =>
    ['epg', 'short', connectionId, streamId] as const,
  fullEPG: (connectionId: string, streamId: number) =>
    ['epg', 'full', connectionId, streamId] as const,
  nowPlaying: (connectionId: string, streamIds: number[]) =>
    ['epg', 'nowPlaying', connectionId, streamIds.join(',')] as const,
};

// ============================================
// Cache Configuration
// ============================================

const EPG_STALE_TIME = 60 * 1000; // 1 minute
const EPG_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const NOW_PLAYING_STALE_TIME = 30 * 1000; // 30 seconds
const NOW_PLAYING_REFETCH_INTERVAL = 60 * 1000; // 1 minute

// ============================================
// Helper Hook
// ============================================

function useActiveConnection(): XtreamConnection | null {
  return useConnectionStore((state) => state.activeConnection);
}

// ============================================
// Short EPG Hook
// ============================================

/**
 * Fetch short EPG (current + next programs) for a stream
 */
export function useShortEPG(
  streamId: number | null,
  limit: number = 4,
  options?: Omit<UseQueryOptions<EPGProgram[], Error>, 'queryKey' | 'queryFn'>
) {
  const connection = useActiveConnection();

  return useQuery<EPGProgram[], Error>({
    queryKey: epgQueryKeys.shortEPG(connection?.id || '', streamId || 0),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      if (!streamId) throw new Error('No stream ID provided');
      return getShortEPG(connection, streamId, limit);
    },
    enabled: !!connection && !!streamId,
    staleTime: EPG_STALE_TIME,
    gcTime: EPG_CACHE_TIME,
    ...options,
  });
}

// ============================================
// Full EPG Hook
// ============================================

/**
 * Fetch full EPG for a channel
 */
export function useEPGForChannel(
  streamId: number | null,
  options?: Omit<UseQueryOptions<EPGProgram[], Error>, 'queryKey' | 'queryFn'>
) {
  const connection = useActiveConnection();

  return useQuery<EPGProgram[], Error>({
    queryKey: epgQueryKeys.fullEPG(connection?.id || '', streamId || 0),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      if (!streamId) throw new Error('No stream ID provided');
      return getEPGForChannel(connection, streamId);
    },
    enabled: !!connection && !!streamId,
    staleTime: EPG_STALE_TIME,
    gcTime: EPG_CACHE_TIME,
    ...options,
  });
}

// ============================================
// Now Playing Hook (Batch)
// ============================================

/**
 * Batch fetch now playing for multiple streams
 * Useful for channel list views
 */
export function useNowPlaying(
  streamIds: number[],
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  const connection = useActiveConnection();
  const { enabled = true, refetchInterval = NOW_PLAYING_REFETCH_INTERVAL } = options || {};

  return useQuery<Map<number, EPGProgram | null>, Error>({
    queryKey: epgQueryKeys.nowPlaying(connection?.id || '', streamIds),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      if (streamIds.length === 0) return new Map();
      return getNowPlaying(connection, streamIds);
    },
    enabled: !!connection && streamIds.length > 0 && enabled,
    staleTime: NOW_PLAYING_STALE_TIME,
    gcTime: EPG_CACHE_TIME,
    refetchInterval,
  });
}

// ============================================
// Multiple Channels EPG Hook
// ============================================

/**
 * Fetch EPG for multiple channels in parallel
 */
export function useMultipleEPG(
  streamIds: number[],
  options?: {
    enabled?: boolean;
  }
) {
  const connection = useActiveConnection();
  const { enabled = true } = options || {};

  const queries = useQueries({
    queries: streamIds.map((streamId) => ({
      queryKey: epgQueryKeys.shortEPG(connection?.id || '', streamId),
      queryFn: async () => {
        if (!connection) throw new Error('No active connection');
        return {
          streamId,
          programs: await getShortEPG(connection, streamId, 4),
        };
      },
      enabled: !!connection && enabled,
      staleTime: EPG_STALE_TIME,
      gcTime: EPG_CACHE_TIME,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const data = useMemo(() => {
    const map = new Map<number, EPGProgram[]>();
    queries.forEach((query) => {
      if (query.data) {
        map.set(query.data.streamId, query.data.programs);
      }
    });
    return map;
  }, [queries]);

  return {
    data,
    isLoading,
    isError,
    queries,
  };
}

// ============================================
// EPG Utilities
// ============================================

/**
 * Get current program from EPG list
 */
export function getCurrentProgram(
  programs: EPGProgram[]
): EPGProgram | undefined {
  const now = Date.now() / 1000;
  return programs.find(
    (p) => p.start_timestamp <= now && p.stop_timestamp > now
  );
}

/**
 * Get next program from EPG list
 */
export function getNextProgram(programs: EPGProgram[]): EPGProgram | undefined {
  const now = Date.now() / 1000;
  const currentIndex = programs.findIndex(
    (p) => p.start_timestamp <= now && p.stop_timestamp > now
  );

  if (currentIndex >= 0 && currentIndex < programs.length - 1) {
    return programs[currentIndex + 1];
  }

  // If no current program, find the next upcoming one
  return programs.find((p) => p.start_timestamp > now);
}

/**
 * Calculate program progress percentage
 */
export function getProgramProgress(program: EPGProgram): number {
  const now = Date.now() / 1000;
  const duration = program.stop_timestamp - program.start_timestamp;

  if (duration <= 0) return 0;
  if (now < program.start_timestamp) return 0;
  if (now > program.stop_timestamp) return 100;

  const elapsed = now - program.start_timestamp;
  return Math.round((elapsed / duration) * 100);
}

/**
 * Format program time
 */
export function formatProgramTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format program duration
 */
export function formatProgramDuration(
  startTimestamp: number,
  stopTimestamp: number
): string {
  const durationMinutes = Math.round(
    (stopTimestamp - startTimestamp) / 60
  );

  if (durationMinutes < 60) {
    return `${durationMinutes}m`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

// ============================================
// Custom Hook for Current Program
// ============================================

/**
 * Hook that returns the current program and updates automatically
 */
export function useCurrentProgram(streamId: number | null) {
  const { data: programs, isLoading, isError } = useShortEPG(streamId, 2, {
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const currentProgram = useMemo(() => {
    if (!programs || programs.length === 0) return null;
    return getCurrentProgram(programs) || null;
  }, [programs]);

  const nextProgram = useMemo(() => {
    if (!programs || programs.length === 0) return null;
    return getNextProgram(programs) || null;
  }, [programs]);

  const progress = useMemo(() => {
    if (!currentProgram) return 0;
    return getProgramProgress(currentProgram);
  }, [currentProgram]);

  return {
    currentProgram,
    nextProgram,
    progress,
    isLoading,
    isError,
  };
}

// ============================================
// EPG Timeline Hook
// ============================================

/**
 * Get EPG programs organized by time slots for a grid view
 */
export function useEPGTimeline(
  streamId: number | null,
  options?: {
    startTime?: Date;
    endTime?: Date;
  }
) {
  const { data: programs, isLoading, isError } = useEPGForChannel(streamId);

  const timeline = useMemo(() => {
    if (!programs || programs.length === 0) return [];

    const { startTime, endTime } = options || {};
    let filteredPrograms = programs;

    if (startTime || endTime) {
      const startTimestamp = startTime
        ? Math.floor(startTime.getTime() / 1000)
        : 0;
      const endTimestamp = endTime
        ? Math.floor(endTime.getTime() / 1000)
        : Infinity;

      filteredPrograms = programs.filter(
        (p) =>
          p.stop_timestamp > startTimestamp && p.start_timestamp < endTimestamp
      );
    }

    return filteredPrograms.sort((a, b) => a.start_timestamp - b.start_timestamp);
  }, [programs, options]);

  return {
    timeline,
    isLoading,
    isError,
  };
}
