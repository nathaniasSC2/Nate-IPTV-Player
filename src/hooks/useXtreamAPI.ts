/**
 * Xtream API Hooks
 * TanStack Query hooks for fetching Xtream Codes data
 */

import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import {
  getLiveCategories,
  getLiveStreams,
  getVODCategories,
  getVODStreams,
  getVODInfo,
  getSeriesCategories,
  getSeries,
  getSeriesInfo,
} from '../services/xtream/client';
import type {
  LiveCategory,
  LiveStream,
  VODCategory,
  VODStream,
  VODInfo,
  SeriesCategory,
  Series,
  SeriesInfo,
} from '../services/xtream/types';
import { useConnectionStore } from '../stores/connectionStore';

// ============================================
// Query Keys
// ============================================

export const queryKeys = {
  // Live TV
  liveCategories: (connectionId: string) =>
    ['live', 'categories', connectionId] as const,
  liveStreams: (connectionId: string, categoryId?: string) =>
    ['live', 'streams', connectionId, categoryId] as const,
  allLiveStreams: (connectionId: string) =>
    ['live', 'streams', connectionId, 'all'] as const,

  // VOD
  vodCategories: (connectionId: string) =>
    ['vod', 'categories', connectionId] as const,
  vodStreams: (connectionId: string, categoryId?: string) =>
    ['vod', 'streams', connectionId, categoryId] as const,
  allVodStreams: (connectionId: string) =>
    ['vod', 'streams', connectionId, 'all'] as const,
  vodInfo: (connectionId: string, vodId: number) =>
    ['vod', 'info', connectionId, vodId] as const,

  // Series
  seriesCategories: (connectionId: string) =>
    ['series', 'categories', connectionId] as const,
  series: (connectionId: string, categoryId?: string) =>
    ['series', 'list', connectionId, categoryId] as const,
  allSeries: (connectionId: string) =>
    ['series', 'list', connectionId, 'all'] as const,
  seriesInfo: (connectionId: string, seriesId: number) =>
    ['series', 'info', connectionId, seriesId] as const,
};

// ============================================
// Cache Configuration
// ============================================

const STALE_TIME = {
  categories: 5 * 60 * 1000, // 5 minutes
  streams: 2 * 60 * 1000, // 2 minutes
  info: 10 * 60 * 1000, // 10 minutes
};

const CACHE_TIME = {
  categories: 30 * 60 * 1000, // 30 minutes
  streams: 15 * 60 * 1000, // 15 minutes
  info: 30 * 60 * 1000, // 30 minutes
};

// ============================================
// Helper Hook
// ============================================

function useActiveConnection() {
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  return activeConnection;
}

// ============================================
// Live TV Hooks
// ============================================

/**
 * Fetch live TV categories
 */
export function useLiveCategories(
  options?: Omit<
    UseQueryOptions<LiveCategory[], Error>,
    'queryKey' | 'queryFn'
  >
) {
  const connection = useActiveConnection();

  return useQuery<LiveCategory[], Error>({
    queryKey: queryKeys.liveCategories(connection?.id || ''),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      return getLiveCategories(connection);
    },
    enabled: !!connection,
    staleTime: STALE_TIME.categories,
    gcTime: CACHE_TIME.categories,
    ...options,
  });
}

/**
 * Fetch live streams for a category
 */
export function useLiveStreams(
  categoryId?: string,
  options?: Omit<
    UseQueryOptions<LiveStream[], Error>,
    'queryKey' | 'queryFn'
  >
) {
  const connection = useActiveConnection();

  return useQuery<LiveStream[], Error>({
    queryKey: queryKeys.liveStreams(connection?.id || '', categoryId),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      return getLiveStreams(connection, categoryId);
    },
    enabled: !!connection,
    staleTime: STALE_TIME.streams,
    gcTime: CACHE_TIME.streams,
    ...options,
  });
}

/**
 * Fetch all live streams (for search)
 */
export function useAllLiveStreams(
  options?: Omit<
    UseQueryOptions<LiveStream[], Error>,
    'queryKey' | 'queryFn'
  >
) {
  const connection = useActiveConnection();

  return useQuery<LiveStream[], Error>({
    queryKey: queryKeys.allLiveStreams(connection?.id || ''),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      return getLiveStreams(connection);
    },
    enabled: !!connection,
    staleTime: STALE_TIME.streams,
    gcTime: CACHE_TIME.streams,
    ...options,
  });
}

// ============================================
// VOD Hooks
// ============================================

/**
 * Fetch VOD categories
 */
export function useVODCategories(
  options?: Omit<
    UseQueryOptions<VODCategory[], Error>,
    'queryKey' | 'queryFn'
  >
) {
  const connection = useActiveConnection();

  return useQuery<VODCategory[], Error>({
    queryKey: queryKeys.vodCategories(connection?.id || ''),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      return getVODCategories(connection);
    },
    enabled: !!connection,
    staleTime: STALE_TIME.categories,
    gcTime: CACHE_TIME.categories,
    ...options,
  });
}

/**
 * Fetch VOD streams for a category
 */
export function useVODStreams(
  categoryId?: string,
  options?: Omit<
    UseQueryOptions<VODStream[], Error>,
    'queryKey' | 'queryFn'
  >
) {
  const connection = useActiveConnection();

  return useQuery<VODStream[], Error>({
    queryKey: queryKeys.vodStreams(connection?.id || '', categoryId),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      return getVODStreams(connection, categoryId);
    },
    enabled: !!connection,
    staleTime: STALE_TIME.streams,
    gcTime: CACHE_TIME.streams,
    ...options,
  });
}

/**
 * Fetch all VOD streams (for search)
 */
export function useAllVODStreams(
  options?: Omit<
    UseQueryOptions<VODStream[], Error>,
    'queryKey' | 'queryFn'
  >
) {
  const connection = useActiveConnection();

  return useQuery<VODStream[], Error>({
    queryKey: queryKeys.allVodStreams(connection?.id || ''),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      return getVODStreams(connection);
    },
    enabled: !!connection,
    staleTime: STALE_TIME.streams,
    gcTime: CACHE_TIME.streams,
    ...options,
  });
}

/**
 * Fetch detailed VOD info
 */
export function useVODInfo(
  vodId: number | null,
  options?: Omit<
    UseQueryOptions<VODInfo, Error>,
    'queryKey' | 'queryFn'
  >
) {
  const connection = useActiveConnection();

  return useQuery<VODInfo, Error>({
    queryKey: queryKeys.vodInfo(connection?.id || '', vodId || 0),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      if (!vodId) throw new Error('No VOD ID provided');
      return getVODInfo(connection, vodId);
    },
    enabled: !!connection && !!vodId,
    staleTime: STALE_TIME.info,
    gcTime: CACHE_TIME.info,
    ...options,
  });
}

// ============================================
// Series Hooks
// ============================================

/**
 * Fetch series categories
 */
export function useSeriesCategories(
  options?: Omit<
    UseQueryOptions<SeriesCategory[], Error>,
    'queryKey' | 'queryFn'
  >
) {
  const connection = useActiveConnection();

  return useQuery<SeriesCategory[], Error>({
    queryKey: queryKeys.seriesCategories(connection?.id || ''),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      return getSeriesCategories(connection);
    },
    enabled: !!connection,
    staleTime: STALE_TIME.categories,
    gcTime: CACHE_TIME.categories,
    ...options,
  });
}

/**
 * Fetch series for a category
 */
export function useSeries(
  categoryId?: string,
  options?: Omit<
    UseQueryOptions<Series[], Error>,
    'queryKey' | 'queryFn'
  >
) {
  const connection = useActiveConnection();

  return useQuery<Series[], Error>({
    queryKey: queryKeys.series(connection?.id || '', categoryId),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      return getSeries(connection, categoryId);
    },
    enabled: !!connection,
    staleTime: STALE_TIME.streams,
    gcTime: CACHE_TIME.streams,
    ...options,
  });
}

/**
 * Fetch all series (for search)
 */
export function useAllSeries(
  options?: Omit<
    UseQueryOptions<Series[], Error>,
    'queryKey' | 'queryFn'
  >
) {
  const connection = useActiveConnection();

  return useQuery<Series[], Error>({
    queryKey: queryKeys.allSeries(connection?.id || ''),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      return getSeries(connection);
    },
    enabled: !!connection,
    staleTime: STALE_TIME.streams,
    gcTime: CACHE_TIME.streams,
    ...options,
  });
}

/**
 * Fetch detailed series info
 */
export function useSeriesInfo(
  seriesId: number | null,
  options?: Omit<
    UseQueryOptions<SeriesInfo, Error>,
    'queryKey' | 'queryFn'
  >
) {
  const connection = useActiveConnection();

  return useQuery<SeriesInfo, Error>({
    queryKey: queryKeys.seriesInfo(connection?.id || '', seriesId || 0),
    queryFn: async () => {
      if (!connection) throw new Error('No active connection');
      if (!seriesId) throw new Error('No series ID provided');
      return getSeriesInfo(connection, seriesId);
    },
    enabled: !!connection && !!seriesId,
    staleTime: STALE_TIME.info,
    gcTime: CACHE_TIME.info,
    ...options,
  });
}

// ============================================
// Prefetch Utilities
// ============================================

/**
 * Prefetch categories for all content types
 */
export function usePrefetchCategories() {
  const queryClient = useQueryClient();
  const connection = useActiveConnection();

  return async () => {
    if (!connection) return;

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.liveCategories(connection.id),
        queryFn: () => getLiveCategories(connection),
        staleTime: STALE_TIME.categories,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.vodCategories(connection.id),
        queryFn: () => getVODCategories(connection),
        staleTime: STALE_TIME.categories,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.seriesCategories(connection.id),
        queryFn: () => getSeriesCategories(connection),
        staleTime: STALE_TIME.categories,
      }),
    ]);
  };
}

/**
 * Prefetch streams for a specific category
 */
export function usePrefetchStreams() {
  const queryClient = useQueryClient();
  const connection = useActiveConnection();

  return {
    prefetchLiveStreams: async (categoryId?: string) => {
      if (!connection) return;

      await queryClient.prefetchQuery({
        queryKey: queryKeys.liveStreams(connection.id, categoryId),
        queryFn: () => getLiveStreams(connection, categoryId),
        staleTime: STALE_TIME.streams,
      });
    },
    prefetchVODStreams: async (categoryId?: string) => {
      if (!connection) return;

      await queryClient.prefetchQuery({
        queryKey: queryKeys.vodStreams(connection.id, categoryId),
        queryFn: () => getVODStreams(connection, categoryId),
        staleTime: STALE_TIME.streams,
      });
    },
    prefetchSeries: async (categoryId?: string) => {
      if (!connection) return;

      await queryClient.prefetchQuery({
        queryKey: queryKeys.series(connection.id, categoryId),
        queryFn: () => getSeries(connection, categoryId),
        staleTime: STALE_TIME.streams,
      });
    },
  };
}

// ============================================
// Invalidation Utilities
// ============================================

/**
 * Invalidate all cached data for current connection
 */
export function useInvalidateConnection() {
  const queryClient = useQueryClient();
  const connection = useActiveConnection();

  return () => {
    if (!connection) return;

    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key.includes(connection.id);
      },
    });
  };
}

/**
 * Clear all query cache
 */
export function useClearCache() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.clear();
  };
}
