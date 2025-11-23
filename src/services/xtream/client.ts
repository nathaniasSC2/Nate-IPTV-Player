/**
 * Xtream API Client
 * Handles all communication with Tauri backend for Xtream Codes API
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  XtreamConnection,
  XtreamAuth,
  LiveCategory,
  LiveStream,
  VODCategory,
  VODStream,
  VODInfo,
  SeriesCategory,
  Series,
  SeriesInfo,
  EPGProgram,
  StreamType,
  StreamUrlParams,
  ShortEPGResponse,
} from './types';

// ============================================
// Error Handling
// ============================================

export class XtreamApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'XtreamApiError';
  }
}

function handleError(error: unknown, context: string): never {
  console.error(`[XtreamClient] ${context}:`, error);

  if (error instanceof Error) {
    throw new XtreamApiError(
      `${context}: ${error.message}`,
      'API_ERROR',
      error
    );
  }

  throw new XtreamApiError(
    `${context}: Unknown error occurred`,
    'UNKNOWN_ERROR',
    error
  );
}

// ============================================
// Authentication
// ============================================

/**
 * Authenticate with an Xtream Codes server
 */
export async function authenticate(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>
): Promise<XtreamAuth> {
  try {
    const result = await invoke<XtreamAuth>('xtream_authenticate', {
      serverUrl: connection.serverUrl,
      username: connection.username,
      password: connection.password,
    });
    return result;
  } catch (error) {
    handleError(error, 'Authentication failed');
  }
}

/**
 * Validate if authentication is still valid
 */
export async function validateAuth(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>
): Promise<boolean> {
  try {
    const auth = await authenticate(connection);
    return auth.user_info.auth === 1;
  } catch {
    return false;
  }
}

// ============================================
// Live TV
// ============================================

/**
 * Get all live TV categories
 */
export async function getLiveCategories(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>
): Promise<LiveCategory[]> {
  try {
    const result = await invoke<LiveCategory[]>('xtream_get_live_categories', {
      serverUrl: connection.serverUrl,
      username: connection.username,
      password: connection.password,
    });
    return result;
  } catch (error) {
    handleError(error, 'Failed to fetch live categories');
  }
}

/**
 * Get live streams, optionally filtered by category
 */
export async function getLiveStreams(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>,
  categoryId?: string
): Promise<LiveStream[]> {
  try {
    const result = await invoke<LiveStream[]>('xtream_get_live_streams', {
      serverUrl: connection.serverUrl,
      username: connection.username,
      password: connection.password,
      categoryId: categoryId || null,
    });
    return result;
  } catch (error) {
    handleError(error, 'Failed to fetch live streams');
  }
}

// ============================================
// VOD (Video on Demand)
// ============================================

/**
 * Get all VOD categories
 */
export async function getVODCategories(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>
): Promise<VODCategory[]> {
  try {
    const result = await invoke<VODCategory[]>('xtream_get_vod_categories', {
      serverUrl: connection.serverUrl,
      username: connection.username,
      password: connection.password,
    });
    return result;
  } catch (error) {
    handleError(error, 'Failed to fetch VOD categories');
  }
}

/**
 * Get VOD streams, optionally filtered by category
 */
export async function getVODStreams(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>,
  categoryId?: string
): Promise<VODStream[]> {
  try {
    const result = await invoke<VODStream[]>('xtream_get_vod_streams', {
      serverUrl: connection.serverUrl,
      username: connection.username,
      password: connection.password,
      categoryId: categoryId || null,
    });
    return result;
  } catch (error) {
    handleError(error, 'Failed to fetch VOD streams');
  }
}

/**
 * Get detailed VOD info
 */
export async function getVODInfo(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>,
  vodId: number
): Promise<VODInfo> {
  try {
    const result = await invoke<VODInfo>('xtream_get_vod_info', {
      serverUrl: connection.serverUrl,
      username: connection.username,
      password: connection.password,
      vodId,
    });
    return result;
  } catch (error) {
    handleError(error, 'Failed to fetch VOD info');
  }
}

// ============================================
// Series
// ============================================

/**
 * Get all series categories
 */
export async function getSeriesCategories(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>
): Promise<SeriesCategory[]> {
  try {
    const result = await invoke<SeriesCategory[]>('xtream_get_series_categories', {
      serverUrl: connection.serverUrl,
      username: connection.username,
      password: connection.password,
    });
    return result;
  } catch (error) {
    handleError(error, 'Failed to fetch series categories');
  }
}

/**
 * Get series, optionally filtered by category
 */
export async function getSeries(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>,
  categoryId?: string
): Promise<Series[]> {
  try {
    const result = await invoke<Series[]>('xtream_get_series', {
      serverUrl: connection.serverUrl,
      username: connection.username,
      password: connection.password,
      categoryId: categoryId || null,
    });
    return result;
  } catch (error) {
    handleError(error, 'Failed to fetch series');
  }
}

/**
 * Get detailed series info including episodes
 */
export async function getSeriesInfo(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>,
  seriesId: number
): Promise<SeriesInfo> {
  try {
    const result = await invoke<SeriesInfo>('xtream_get_series_info', {
      serverUrl: connection.serverUrl,
      username: connection.username,
      password: connection.password,
      seriesId,
    });
    return result;
  } catch (error) {
    handleError(error, 'Failed to fetch series info');
  }
}

// ============================================
// EPG (Electronic Program Guide)
// ============================================

/**
 * Get short EPG for a specific stream (current + next few programs)
 */
export async function getShortEPG(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>,
  streamId: number,
  limit: number = 4
): Promise<EPGProgram[]> {
  try {
    const result = await invoke<ShortEPGResponse>('xtream_get_short_epg', {
      serverUrl: connection.serverUrl,
      username: connection.username,
      password: connection.password,
      streamId,
      limit,
    });
    return result.epg_listings || [];
  } catch (error) {
    // EPG might not be available for all channels, return empty array
    console.warn(`[XtreamClient] EPG not available for stream ${streamId}`);
    return [];
  }
}

/**
 * Get EPG for a specific stream and date range
 */
export async function getEPGForChannel(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>,
  streamId: number
): Promise<EPGProgram[]> {
  try {
    const result = await invoke<ShortEPGResponse>('xtream_get_epg', {
      serverUrl: connection.serverUrl,
      username: connection.username,
      password: connection.password,
      streamId,
    });
    return result.epg_listings || [];
  } catch (error) {
    console.warn(`[XtreamClient] Full EPG not available for stream ${streamId}`);
    return [];
  }
}

/**
 * Batch fetch now playing for multiple streams
 */
export async function getNowPlaying(
  connection: Pick<XtreamConnection, 'serverUrl' | 'username' | 'password'>,
  streamIds: number[]
): Promise<Map<number, EPGProgram | null>> {
  const results = new Map<number, EPGProgram | null>();

  // Fetch in parallel with limited concurrency
  const concurrencyLimit = 10;
  const chunks: number[][] = [];

  for (let i = 0; i < streamIds.length; i += concurrencyLimit) {
    chunks.push(streamIds.slice(i, i + concurrencyLimit));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (streamId) => {
      try {
        const epg = await getShortEPG(connection, streamId, 1);
        const now = Date.now() / 1000;
        const currentProgram = epg.find(
          (p) => p.start_timestamp <= now && p.stop_timestamp > now
        );
        results.set(streamId, currentProgram || null);
      } catch {
        results.set(streamId, null);
      }
    });

    await Promise.all(promises);
  }

  return results;
}

// ============================================
// Stream URL Builder
// ============================================

/**
 * Build a playback URL for a stream
 */
export function buildStreamUrl(params: StreamUrlParams): string {
  const { connection, streamId, streamType, format = 'm3u8', containerExtension } = params;

  // Normalize server URL
  let baseUrl = connection.serverUrl.replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }

  const { username, password } = connection;

  switch (streamType) {
    case 'live':
      // Live streams: http://server:port/live/username/password/streamId.m3u8
      return `${baseUrl}/live/${username}/${password}/${streamId}.${format}`;

    case 'movie':
      // VOD: http://server:port/movie/username/password/streamId.extension
      const vodExtension = containerExtension || 'mp4';
      return `${baseUrl}/movie/${username}/${password}/${streamId}.${vodExtension}`;

    case 'series':
      // Series: http://server:port/series/username/password/streamId.extension
      const seriesExtension = containerExtension || 'mp4';
      return `${baseUrl}/series/${username}/${password}/${streamId}.${seriesExtension}`;

    default:
      throw new XtreamApiError(`Unknown stream type: ${streamType}`, 'INVALID_STREAM_TYPE');
  }
}

/**
 * Build a timeshift URL for catchup/archive content
 */
export function buildTimeshiftUrl(
  connection: XtreamConnection,
  streamId: number,
  start: Date,
  duration: number // in minutes
): string {
  let baseUrl = connection.serverUrl.replace(/\/+$/, '');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }

  const { username, password } = connection;
  const startTime = Math.floor(start.getTime() / 1000);

  // Timeshift URL format varies by server, this is a common format
  return `${baseUrl}/timeshift/${username}/${password}/${duration}/${startTime}/${streamId}.ts`;
}

// ============================================
// Connection Storage
// ============================================

/**
 * Save connection to persistent storage
 */
export async function saveConnection(connection: XtreamConnection): Promise<void> {
  try {
    await invoke('storage_save_connection', { connection });
  } catch (error) {
    handleError(error, 'Failed to save connection');
  }
}

/**
 * Get all saved connections
 */
export async function getConnections(): Promise<XtreamConnection[]> {
  try {
    const result = await invoke<XtreamConnection[]>('storage_get_connections');
    return result;
  } catch (error) {
    handleError(error, 'Failed to get connections');
  }
}

/**
 * Delete a connection from storage
 */
export async function deleteConnection(connectionId: string): Promise<void> {
  try {
    await invoke('storage_delete_connection', { connectionId });
  } catch (error) {
    handleError(error, 'Failed to delete connection');
  }
}

// ============================================
// Favorites Storage
// ============================================

/**
 * Save favorites to persistent storage
 */
export async function saveFavorites(
  connectionId: string,
  favorites: { streamId: number; streamType: StreamType; name: string; icon?: string; categoryId?: string; addedAt: number }[]
): Promise<void> {
  try {
    await invoke('storage_save_favorites', { connectionId, favorites });
  } catch (error) {
    handleError(error, 'Failed to save favorites');
  }
}

/**
 * Get favorites for a connection
 */
export async function getFavorites(
  connectionId: string
): Promise<{ streamId: number; streamType: StreamType; name: string; icon?: string; categoryId?: string; addedAt: number }[]> {
  try {
    const result = await invoke<{ streamId: number; streamType: StreamType; name: string; icon?: string; categoryId?: string; addedAt: number }[]>(
      'storage_get_favorites',
      { connectionId }
    );
    return result;
  } catch (error) {
    // Return empty array if favorites don't exist yet
    console.warn('[XtreamClient] No favorites found for connection');
    return [];
  }
}

// ============================================
// Export all types
// ============================================

export * from './types';
