# Nate IPTV Player - Architecture & Implementation Plan

A lightweight, open-source IPTV player with Xtream API support, designed as a proof of concept for AI-assisted application development.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Core Architecture](#core-architecture)
4. [Xtream API Integration](#xtream-api-integration)
5. [EPG/TV Guide System](#epgtv-guide-system)
6. [Performance Optimizations](#performance-optimizations)
7. [UI/UX Design](#uiux-design)
8. [Data Storage](#data-storage)
9. [Build & Distribution](#build--distribution)
10. [Implementation Phases](#implementation-phases)

---

## Technology Stack

### Frontend Framework: **Tauri v2 + React + TypeScript**

**Why Tauri over Electron:**
| Aspect | Tauri | Electron |
|--------|-------|----------|
| Bundle Size | ~10-15 MB | 150-200 MB |
| Memory Usage | 50-100 MB | 300-500 MB |
| Startup Time | <1 second | 2-5 seconds |
| Backend | Rust (native) | Node.js |
| Security | Sandboxed by default | Full Node access |

**Core Dependencies:**

```
Frontend (Web):
├── React 18 (UI library)
├── TypeScript 5 (type safety)
├── TanStack Query (data fetching/caching)
├── Zustand (lightweight state management)
├── TanStack Virtual (list virtualization)
├── Video.js + hls.js (HLS playback)
├── Tailwind CSS (styling)
└── date-fns (date handling for EPG)

Backend (Rust):
├── Tauri v2 (framework)
├── Serde (serialization)
├── Reqwest (HTTP client)
├── SQLite via rusqlite (local storage)
├── Tokio (async runtime)
└── quick-xml (EPG parsing)
```

### Video Playback Strategy

**Hybrid Approach:**
1. **Primary:** HTML5 Video + hls.js for HLS/M3U8 streams (most providers support this)
2. **Fallback:** External mpv launch for MPEG-TS direct streams
3. **Optional:** Bundle mpv for all-in-one experience

```
Stream URL Detection:
├── .m3u8 / HLS → Video.js + hls.js (in-app)
├── .ts direct → Convert to HLS if possible, else external mpv
└── RTMP → External player required
```

---

## Project Structure

```
nate-iptv-player/
├── src/                          # React frontend
│   ├── components/
│   │   ├── player/               # Video player components
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── PlayerControls.tsx
│   │   │   └── MiniPlayer.tsx
│   │   ├── channels/             # Channel browsing
│   │   │   ├── ChannelList.tsx
│   │   │   ├── ChannelCard.tsx
│   │   │   ├── CategorySidebar.tsx
│   │   │   └── ChannelGrid.tsx
│   │   ├── epg/                  # TV Guide components
│   │   │   ├── EPGGrid.tsx
│   │   │   ├── EPGTimeline.tsx
│   │   │   ├── ProgramCard.tsx
│   │   │   └── NowPlaying.tsx
│   │   ├── vod/                  # VOD components
│   │   │   ├── MovieGrid.tsx
│   │   │   ├── MovieCard.tsx
│   │   │   ├── SeriesList.tsx
│   │   │   └── EpisodeList.tsx
│   │   ├── search/               # Search functionality
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   └── FilterPanel.tsx
│   │   ├── settings/             # Settings & config
│   │   │   ├── ConnectionSetup.tsx
│   │   │   ├── Preferences.tsx
│   │   │   └── AccountInfo.tsx
│   │   └── common/               # Shared components
│   │       ├── VirtualList.tsx
│   │       ├── LazyImage.tsx
│   │       ├── LoadingStates.tsx
│   │       └── ErrorBoundary.tsx
│   ├── hooks/                    # Custom React hooks
│   │   ├── useXtreamAPI.ts
│   │   ├── useEPG.ts
│   │   ├── usePlayer.ts
│   │   ├── useFavorites.ts
│   │   └── useSearch.ts
│   ├── services/                 # Business logic
│   │   ├── xtream/
│   │   │   ├── client.ts         # API client
│   │   │   ├── types.ts          # TypeScript types
│   │   │   └── parser.ts         # Response parsing
│   │   ├── epg/
│   │   │   ├── processor.ts      # EPG data processing
│   │   │   └── scheduler.ts      # Background refresh
│   │   └── storage/
│   │       └── db.ts             # IndexedDB wrapper
│   ├── stores/                   # Zustand stores
│   │   ├── connectionStore.ts
│   │   ├── playerStore.ts
│   │   ├── favoritesStore.ts
│   │   └── settingsStore.ts
│   ├── utils/                    # Utilities
│   │   ├── streamUrl.ts          # URL construction
│   │   ├── imageProxy.ts         # Logo caching
│   │   └── debounce.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── commands/             # Tauri commands
│   │   │   ├── mod.rs
│   │   │   ├── xtream.rs         # API proxy commands
│   │   │   ├── epg.rs            # EPG processing
│   │   │   ├── storage.rs        # Database operations
│   │   │   └── player.rs         # External player launch
│   │   ├── services/
│   │   │   ├── http_client.rs    # Reqwest client
│   │   │   ├── cache.rs          # Response caching
│   │   │   └── epg_parser.rs     # XMLTV parsing
│   │   └── db/
│   │       ├── mod.rs
│   │       ├── schema.rs         # SQLite schema
│   │       └── migrations.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## Core Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Tauri Window                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Frontend                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Channels │ │   EPG    │ │   VOD    │ │ Settings │   │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │   │
│  │       │            │            │            │          │   │
│  │  ┌────┴────────────┴────────────┴────────────┴────┐    │   │
│  │  │              Zustand State Stores               │    │   │
│  │  └────────────────────┬───────────────────────────┘    │   │
│  │                       │                                 │   │
│  │  ┌────────────────────┴───────────────────────────┐    │   │
│  │  │            TanStack Query Cache                 │    │   │
│  │  └────────────────────┬───────────────────────────┘    │   │
│  └───────────────────────┼─────────────────────────────────┘   │
│                          │ Tauri IPC                            │
├──────────────────────────┼──────────────────────────────────────┤
│  ┌───────────────────────┴───────────────────────────────────┐ │
│  │                    Rust Backend                            │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │ │
│  │  │ HTTP Client │ │ EPG Parser  │ │  SQLite Database    │ │ │
│  │  │  (reqwest)  │ │ (quick-xml) │ │   (rusqlite)        │ │ │
│  │  └──────┬──────┘ └──────┬──────┘ └──────────┬──────────┘ │ │
│  │         │               │                    │            │ │
│  │  ┌──────┴───────────────┴────────────────────┴──────────┐│ │
│  │  │                  Cache Layer                          ││ │
│  │  │   (In-memory + Disk for EPG/Logos/Responses)         ││ │
│  │  └───────────────────────────────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Xtream Server  │
                    │   (External)    │
                    └─────────────────┘
```

### Data Flow

```
User Action → React Component → Hook → TanStack Query
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                              │
                    ▼ (Cache Hit)                    ▼ (Cache Miss)
              Return Data                      Tauri Command
                                                    │
                                                    ▼
                                            Rust HTTP Client
                                                    │
                                                    ▼
                                            Xtream API Server
                                                    │
                                                    ▼
                                            Parse Response
                                                    │
                                                    ▼
                                            Cache in SQLite
                                                    │
                                                    ▼
                                            Return to Frontend
```

---

## Xtream API Integration

### API Client Design

```typescript
// src/services/xtream/types.ts

interface XtreamConnection {
  serverUrl: string;
  username: string;
  password: string;
}

interface XtreamAuth {
  user_info: {
    username: string;
    status: string;
    exp_date: string;
    is_trial: string;
    active_cons: string;
    created_at: string;
    max_connections: string;
  };
  server_info: {
    url: string;
    port: string;
    https_port: string;
    server_protocol: string;
    time_now: string;
    timezone: string;
  };
}

interface LiveCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

interface LiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

interface VODStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

interface Series {
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
}

interface EPGProgram {
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
}
```

### API Endpoints Implementation

```typescript
// src/services/xtream/client.ts

class XtreamClient {
  private baseUrl: string;
  private username: string;
  private password: string;

  // Authentication & Info
  async authenticate(): Promise<XtreamAuth>;

  // Live TV
  async getLiveCategories(): Promise<LiveCategory[]>;
  async getLiveStreams(categoryId?: string): Promise<LiveStream[]>;
  async getLiveStreamUrl(streamId: number, format: 'ts' | 'm3u8'): string;

  // VOD
  async getVODCategories(): Promise<VODCategory[]>;
  async getVODStreams(categoryId?: string): Promise<VODStream[]>;
  async getVODInfo(vodId: number): Promise<VODInfo>;
  async getVODStreamUrl(streamId: number, extension: string): string;

  // Series
  async getSeriesCategories(): Promise<SeriesCategory[]>;
  async getSeries(categoryId?: string): Promise<Series[]>;
  async getSeriesInfo(seriesId: number): Promise<SeriesInfo>;

  // EPG
  async getShortEPG(streamId: number, limit?: number): Promise<EPGProgram[]>;
  async getFullEPG(streamId: number): Promise<EPGProgram[]>;
  async getXMLTVEPG(): Promise<string>; // Full XMLTV file URL
}
```

### URL Construction

```typescript
// Stream URL patterns
const buildStreamUrl = (connection: XtreamConnection, type: 'live' | 'vod' | 'series', streamId: number, extension: string) => {
  const { serverUrl, username, password } = connection;

  switch (type) {
    case 'live':
      // http://server:port/live/username/password/streamId.ts
      // http://server:port/live/username/password/streamId.m3u8
      return `${serverUrl}/live/${username}/${password}/${streamId}.${extension}`;

    case 'vod':
      // http://server:port/movie/username/password/streamId.mkv
      return `${serverUrl}/movie/${username}/${password}/${streamId}.${extension}`;

    case 'series':
      // http://server:port/series/username/password/streamId.mkv
      return `${serverUrl}/series/${username}/${password}/${streamId}.${extension}`;
  }
};
```

---

## EPG/TV Guide System

### EPG Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EPG System                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  Short EPG API  │    │  XMLTV Parser   │    │  EPG Cache  │ │
│  │  (per channel)  │    │  (full guide)   │    │  (SQLite)   │ │
│  └────────┬────────┘    └────────┬────────┘    └──────┬──────┘ │
│           │                      │                     │        │
│           └──────────────────────┼─────────────────────┘        │
│                                  │                               │
│                      ┌───────────┴───────────┐                  │
│                      │    EPG Processor      │                  │
│                      │  - Deduplication      │                  │
│                      │  - Time normalization │                  │
│                      │  - Channel mapping    │                  │
│                      └───────────┬───────────┘                  │
│                                  │                               │
│              ┌───────────────────┼───────────────────┐          │
│              │                   │                   │          │
│              ▼                   ▼                   ▼          │
│     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│     │  Now Playing   │ │  Grid View     │ │  Channel EPG   │   │
│     │  Widget        │ │  (Timeline)    │ │  Preview       │   │
│     └────────────────┘ └────────────────┘ └────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### EPG Data Model

```typescript
// EPG Database Schema
interface EPGEntry {
  id: string;              // Unique ID
  channel_id: string;      // Maps to stream's epg_channel_id
  stream_id: number;       // Reference to live stream
  title: string;
  description: string;
  start_time: number;      // Unix timestamp
  end_time: number;        // Unix timestamp
  category: string;
  icon: string;
  cached_at: number;       // When this data was fetched
}

// Current program lookup - optimized query
interface CurrentProgram {
  stream_id: number;
  title: string;
  progress: number;        // 0-100 percentage
  remaining_minutes: number;
  next_program?: string;
}
```

### EPG Update Strategy

```
Initial Load:
1. Fetch channel list
2. For visible channels, fetch short EPG (next 2-3 programs)
3. Background: Download full XMLTV if available
4. Parse and cache in SQLite

Refresh Strategy:
├── On app start: Refresh if cache > 1 hour old
├── Hourly: Background refresh for subscribed channels
├── On scroll: Lazy-load EPG for newly visible channels
└── On demand: User manual refresh
```

### "Now Playing" Implementation

```typescript
// Efficiently show what's on across all channels

const useNowPlaying = (streamIds: number[]) => {
  const now = Date.now() / 1000;

  // Query: SELECT * FROM epg
  //        WHERE stream_id IN (...)
  //        AND start_time <= now
  //        AND end_time > now

  return useQuery({
    queryKey: ['nowPlaying', streamIds],
    queryFn: () => invoke('get_now_playing', { streamIds }),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
};
```

---

## Performance Optimizations

### 1. List Virtualization (Critical for Large Playlists)

```typescript
// Using TanStack Virtual for 10,000+ channel lists

import { useVirtualizer } from '@tanstack/react-virtual';

const ChannelList = ({ channels }: { channels: Channel[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: channels.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Row height
    overscan: 10, // Render 10 extra items for smooth scrolling
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <ChannelRow
            key={virtualItem.key}
            channel={channels[virtualItem.index]}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### 2. Lazy Loading & Pagination

```typescript
// Load categories first, then streams on-demand

const useLiveStreams = (categoryId: string | null) => {
  return useInfiniteQuery({
    queryKey: ['liveStreams', categoryId],
    queryFn: ({ pageParam = 0 }) =>
      invoke('get_live_streams_paginated', {
        categoryId,
        offset: pageParam,
        limit: 100
      }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length * 100 : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### 3. Image Optimization

```typescript
// Lazy image loading with placeholder and error handling

const LazyChannelLogo = ({ src, name }: { src: string; name: string }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Intersection Observer for lazy loading
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} className="w-12 h-12 rounded bg-gray-800">
      {inView && !error && (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "w-full h-full object-contain transition-opacity",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      {(error || !inView) && (
        <div className="w-full h-full flex items-center justify-center text-xs">
          {name.substring(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
};
```

### 4. Response Caching Strategy

```rust
// Rust backend caching

pub struct CacheConfig {
    // API Response caching
    auth_ttl: Duration,           // 1 hour
    categories_ttl: Duration,     // 24 hours
    streams_ttl: Duration,        // 1 hour
    epg_short_ttl: Duration,      // 5 minutes
    epg_full_ttl: Duration,       // 6 hours

    // Image caching
    logo_cache_size: usize,       // 500 logos in memory
    logo_disk_cache: bool,        // Persist to disk
}

// SQLite cache table
CREATE TABLE cache (
    key TEXT PRIMARY KEY,
    value BLOB,
    expires_at INTEGER,
    created_at INTEGER
);

CREATE INDEX idx_cache_expires ON cache(expires_at);
```

### 5. Search Optimization

```typescript
// Client-side fuzzy search with debouncing

import Fuse from 'fuse.js';

const useChannelSearch = (channels: Channel[]) => {
  const fuse = useMemo(() => new Fuse(channels, {
    keys: ['name', 'epg_channel_id'],
    threshold: 0.3,
    ignoreLocation: true,
  }), [channels]);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);

  const results = useMemo(() => {
    if (!debouncedQuery) return channels;
    return fuse.search(debouncedQuery).map(r => r.item);
  }, [fuse, debouncedQuery]);

  return { query, setQuery, results };
};
```

### 6. Memory Management

```typescript
// Cleanup unused data when switching categories

const useCleanupOnCategoryChange = (categoryId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      // When leaving category, remove from cache after delay
      const timeout = setTimeout(() => {
        queryClient.removeQueries({
          queryKey: ['streams', categoryId],
          exact: true,
        });
      }, 60000); // Keep for 1 minute after leaving

      return () => clearTimeout(timeout);
    };
  }, [categoryId]);
};
```

---

## UI/UX Design

### Layout Structure

```
┌────────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌────────────────────────────────────────────┐  │
│  │             │  │  Search                              🔍     │  │
│  │   LOGO      │  └────────────────────────────────────────────┘  │
│  │             │                                                   │
│  ├─────────────┤  ┌────────────────────────────────────────────┐  │
│  │             │  │                                            │  │
│  │  📺 Live TV │  │                                            │  │
│  │             │  │                                            │  │
│  │  🎬 Movies  │  │             Content Area                   │  │
│  │             │  │        (Channel Grid/List,                 │  │
│  │  📺 Series  │  │         VOD Grid, EPG Grid,                │  │
│  │             │  │         Video Player)                      │  │
│  │  📅 Guide   │  │                                            │  │
│  │             │  │                                            │  │
│  │  ⭐ Fav     │  │                                            │  │
│  │             │  │                                            │  │
│  │  ⚙️ Settings│  │                                            │  │
│  │             │  └────────────────────────────────────────────┘  │
│  └─────────────┘                                                   │
└────────────────────────────────────────────────────────────────────┘
```

### Channel Card Design

```
┌──────────────────────────────────────────────┐
│  ┌────┐                                      │
│  │LOGO│  Channel Name                    HD  │
│  └────┘  ▶ Currently Playing Program         │
│          ████████████░░░░ 75%  15 min left   │
└──────────────────────────────────────────────┘
```

### EPG Grid View

```
           NOW      30m      1h       1:30h     2h
          ─────────────────────────────────────────
Channel 1 │ Show A ████████│ Show B ██████████│
          ─────────────────────────────────────────
Channel 2 │ Movie Title ██████████████████████│
          ─────────────────────────────────────────
Channel 3 │ News ████│ Sports █████│ Drama ███│
          ─────────────────────────────────────────
```

### Smart Organization Features

1. **Auto-categorization:**
   - Parse channel names for country flags, quality indicators (HD/4K/FHD)
   - Group by detected language
   - Separate sports, news, movies, kids content

2. **Favorites System:**
   - Quick add/remove
   - Custom ordering
   - Multiple favorite lists

3. **Recently Watched:**
   - Track viewing history
   - Quick access to recent channels
   - Resume VOD playback

4. **Smart Search:**
   - Fuzzy matching
   - Search across channels, VOD, series
   - Filter by category, quality, language

---

## Data Storage

### SQLite Schema

```sql
-- Connection profiles
CREATE TABLE connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    server_url TEXT NOT NULL,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    last_used INTEGER,
    is_active INTEGER DEFAULT 0
);

-- Cached categories
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    connection_id TEXT,
    type TEXT, -- 'live', 'vod', 'series'
    name TEXT,
    parent_id INTEGER,
    cached_at INTEGER,
    FOREIGN KEY (connection_id) REFERENCES connections(id)
);

-- Cached streams
CREATE TABLE streams (
    id INTEGER PRIMARY KEY,
    connection_id TEXT,
    type TEXT,
    name TEXT,
    category_id TEXT,
    icon_url TEXT,
    epg_channel_id TEXT,
    added INTEGER,
    rating REAL,
    container_extension TEXT,
    cached_at INTEGER,
    FOREIGN KEY (connection_id) REFERENCES connections(id)
);

CREATE INDEX idx_streams_category ON streams(category_id);
CREATE INDEX idx_streams_name ON streams(name);

-- EPG data
CREATE TABLE epg (
    id TEXT PRIMARY KEY,
    stream_id INTEGER,
    channel_id TEXT,
    title TEXT,
    description TEXT,
    start_time INTEGER,
    end_time INTEGER,
    cached_at INTEGER
);

CREATE INDEX idx_epg_stream ON epg(stream_id);
CREATE INDEX idx_epg_time ON epg(start_time, end_time);

-- Favorites
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id TEXT,
    stream_id INTEGER,
    stream_type TEXT,
    list_name TEXT DEFAULT 'default',
    position INTEGER,
    added_at INTEGER,
    UNIQUE(connection_id, stream_id, list_name)
);

-- Watch history
CREATE TABLE history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id TEXT,
    stream_id INTEGER,
    stream_type TEXT,
    stream_name TEXT,
    watched_at INTEGER,
    duration INTEGER, -- seconds watched
    position INTEGER  -- resume position for VOD
);

CREATE INDEX idx_history_time ON history(watched_at DESC);

-- Settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

---

## Build & Distribution

### Development Setup

```bash
# Prerequisites
- Node.js 18+
- Rust 1.70+
- pnpm (recommended) or npm

# Clone and setup
git clone https://github.com/user/nate-iptv-player
cd nate-iptv-player
pnpm install

# Development
pnpm tauri dev

# Build
pnpm tauri build
```

### Windows Build Pipeline

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm tauri build

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: windows-build
          path: src-tauri/target/release/bundle/msi/*.msi
```

### Tauri Configuration

```json
// src-tauri/tauri.conf.json
{
  "build": {
    "beforeBuildCommand": "pnpm build",
    "beforeDevCommand": "pnpm dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Nate IPTV Player",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "open": true,
        "execute": true,
        "sidecar": true
      },
      "http": {
        "all": true,
        "request": true,
        "scope": ["http://**", "https://**"]
      },
      "fs": {
        "all": true,
        "scope": ["$APP/*", "$RESOURCE/*"]
      },
      "path": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.ico"
      ],
      "identifier": "com.nate.iptv-player",
      "targets": ["msi", "nsis"],
      "windows": {
        "wix": {
          "language": "en-US"
        }
      }
    },
    "windows": [
      {
        "title": "Nate IPTV Player",
        "width": 1280,
        "height": 720,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (MVP)
**Goal: Basic playable IPTV client**

- [ ] Project setup (Tauri + React + TypeScript)
- [ ] Connection setup wizard
- [ ] Xtream API authentication
- [ ] Live category & channel fetching
- [ ] Basic channel list with virtualization
- [ ] HLS video playback
- [ ] Basic search functionality

### Phase 2: Enhanced Viewing
**Goal: Full viewing experience**

- [ ] EPG integration (short EPG per channel)
- [ ] "Now Playing" display on channel cards
- [ ] VOD categories and playback
- [ ] Series support with episode listing
- [ ] Favorites system
- [ ] Watch history

### Phase 3: TV Guide
**Goal: Complete EPG experience**

- [ ] Full EPG grid view
- [ ] Timeline navigation
- [ ] Program details modal
- [ ] EPG background refresh
- [ ] XMLTV parser for full guide

### Phase 4: Polish & Performance
**Goal: Production-ready**

- [ ] Image caching & optimization
- [ ] Offline mode support
- [ ] Multiple connection profiles
- [ ] Settings & preferences
- [ ] Keyboard shortcuts
- [ ] Error handling & recovery
- [ ] Windows installer & auto-update

### Phase 5: Advanced Features
**Goal: Power user features**

- [ ] Smart categorization
- [ ] Multi-language support
- [ ] External player integration
- [ ] Catchup/Timeshift support
- [ ] Recording (if supported by provider)
- [ ] Parental controls

---

## Security Considerations

1. **Credential Storage:** Encrypt passwords using OS keychain (via Tauri's secure storage)
2. **No Credential Logging:** Never log sensitive connection info
3. **HTTPS Preferred:** Upgrade HTTP connections when possible
4. **Input Validation:** Sanitize all user inputs and API responses
5. **CSP Headers:** Strict Content Security Policy for webview

---

## File Size Targets

| Component | Target Size |
|-----------|-------------|
| Windows Installer | < 20 MB |
| Installed Size | < 50 MB |
| Memory Usage (idle) | < 100 MB |
| Memory Usage (playing) | < 200 MB |

---

## References

- [Xtream Codes API Documentation](https://github.com/zaclimon/xipl/wiki/Xtream-Codes-API)
- [Tauri v2 Documentation](https://v2.tauri.app)
- [TanStack Virtual](https://tanstack.com/virtual)
- [Video.js](https://videojs.com)
- [hls.js](https://github.com/video-dev/hls.js)
