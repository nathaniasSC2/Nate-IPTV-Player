/**
 * Xtream API TypeScript Types
 * Complete type definitions for Xtream Codes API responses
 */

// ============================================
// Connection & Authentication Types
// ============================================

export interface XtreamConnection {
  id: string;
  name: string;
  serverUrl: string;
  username: string;
  password: string;
  createdAt: number;
  lastUsed?: number;
}

export interface XtreamUserInfo {
  username: string;
  password: string;
  message: string;
  auth: number;
  status: string;
  exp_date: string;
  is_trial: string;
  active_cons: string;
  created_at: string;
  max_connections: string;
  allowed_output_formats: string[];
}

export interface XtreamServerInfo {
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  rtmp_port: string;
  timezone: string;
  timestamp_now: number;
  time_now: string;
  process: boolean;
}

export interface XtreamAuth {
  user_info: XtreamUserInfo;
  server_info: XtreamServerInfo;
}

// ============================================
// Live TV Types
// ============================================

export interface LiveCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface LiveStream {
  num: number;
  name: string;
  stream_type: 'live';
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string | null;
  added: string;
  is_adult: string;
  category_id: string;
  category_ids: number[];
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

// ============================================
// VOD (Video on Demand) Types
// ============================================

export interface VODCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface VODStream {
  num: number;
  name: string;
  stream_type: 'movie';
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  is_adult: string;
  category_id: string;
  category_ids: number[];
  container_extension: string;
  custom_sid: string | null;
  direct_source: string;
}

export interface VODInfo {
  info: {
    tmdb_id?: string;
    name: string;
    o_name?: string;
    cover_big?: string;
    movie_image?: string;
    release_date?: string;
    episode_run_time?: string;
    youtube_trailer?: string;
    director?: string;
    actors?: string;
    cast?: string;
    description?: string;
    plot?: string;
    age?: string;
    mpaa_rating?: string;
    rating_count_kinopoisk?: number;
    country?: string;
    genre?: string;
    duration_secs?: number;
    duration?: string;
    bitrate?: number;
    video?: {
      index: number;
      codec_name: string;
      codec_long_name: string;
      width: number;
      height: number;
    };
    audio?: {
      index: number;
      codec_name: string;
      codec_long_name: string;
      channels: number;
      sample_rate: string;
    };
  };
  movie_data: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
    custom_sid: string | null;
    direct_source: string;
  };
}

// ============================================
// Series Types
// ============================================

export interface SeriesCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface Series {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  release_date: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
  category_ids: number[];
}

export interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: {
    tmdb_id?: string;
    release_date?: string;
    plot?: string;
    duration_secs?: number;
    duration?: string;
    movie_image?: string;
    bitrate?: number;
    rating?: string;
    season?: number;
    cover_big?: string;
  };
  custom_sid: string;
  added: string;
  season: number;
  direct_source: string;
}

export interface Season {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  season_number: number;
  cover: string;
  cover_big: string;
}

export interface SeriesInfo {
  seasons: Season[];
  info: {
    name: string;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    release_date: string;
    last_modified: string;
    rating: string;
    rating_5based: number;
    backdrop_path: string[];
    youtube_trailer: string;
    episode_run_time: string;
    category_id: string;
    category_ids: number[];
  };
  episodes: {
    [seasonNumber: string]: Episode[];
  };
}

// ============================================
// EPG (Electronic Program Guide) Types
// ============================================

export interface EPGProgram {
  id: string;
  epg_id: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channel_id: string;
  start_timestamp: number;
  stop_timestamp: number;
  now_playing?: boolean;
  has_archive?: boolean;
}

export interface ShortEPGResponse {
  epg_listings: EPGProgram[];
}

// ============================================
// Stream URL Types
// ============================================

export type StreamType = 'live' | 'movie' | 'series';
export type StreamFormat = 'ts' | 'm3u8' | 'rtmp';

export interface StreamUrlParams {
  connection: XtreamConnection;
  streamId: number;
  streamType: StreamType;
  format?: StreamFormat;
  // For series episodes
  containerExtension?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Current Stream Types (for player)
// ============================================

export interface CurrentStream {
  id: number;
  name: string;
  url: string;
  type: StreamType;
  icon?: string;
  categoryId?: string;
  epgChannelId?: string | null;
}

// ============================================
// Favorite Types
// ============================================

export interface Favorite {
  streamId: number;
  streamType: StreamType;
  name: string;
  icon?: string;
  categoryId?: string;
  addedAt: number;
}

export interface FavoritesMap {
  [connectionId: string]: Favorite[];
}
