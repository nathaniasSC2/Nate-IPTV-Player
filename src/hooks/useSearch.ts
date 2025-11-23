/**
 * Search Hooks
 * Fuzzy search functionality using Fuse.js
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';
import { useAllLiveStreams, useAllVODStreams, useAllSeries } from './useXtreamAPI';
import type {
  LiveStream,
  VODStream,
  Series,
  StreamType,
} from '../services/xtream/types';

// ============================================
// Types
// ============================================

export interface SearchResult {
  id: number;
  name: string;
  type: StreamType;
  icon?: string;
  categoryId?: string;
  score: number;
  // Original item for additional data
  item: LiveStream | VODStream | Series;
}

export interface SearchOptions {
  types?: StreamType[];
  categoryId?: string;
  limit?: number;
  threshold?: number;
}

// ============================================
// Fuse.js Configuration
// ============================================

const defaultFuseOptions: IFuseOptions<SearchResult> = {
  keys: [
    { name: 'name', weight: 1 },
  ],
  threshold: 0.3, // Lower = more strict matching
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
  shouldSort: true,
};

// ============================================
// Debounce Hook
// ============================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// Search State Hook
// ============================================

export function useSearchState(debounceMs: number = 300) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedQuery = useDebounce(query, debounceMs);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setIsSearching(newQuery.length > 0);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setIsSearching(false);
  }, []);

  return {
    query,
    debouncedQuery,
    isSearching,
    setQuery: handleQueryChange,
    clearSearch,
  };
}

// ============================================
// Main Search Hook
// ============================================

export function useSearch(options: SearchOptions = {}) {
  const {
    types = ['live', 'movie', 'series'],
    categoryId,
    limit = 50,
    threshold = 0.3,
  } = options;

  // Fetch all content
  const { data: liveStreams, isLoading: loadingLive } = useAllLiveStreams({
    enabled: types.includes('live'),
  });
  const { data: vodStreams, isLoading: loadingVod } = useAllVODStreams({
    enabled: types.includes('movie'),
  });
  const { data: series, isLoading: loadingSeries } = useAllSeries({
    enabled: types.includes('series'),
  });

  const isLoading = loadingLive || loadingVod || loadingSeries;

  // Build search index
  const searchIndex = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];

    if (types.includes('live') && liveStreams) {
      liveStreams.forEach((stream) => {
        if (!categoryId || stream.category_id === categoryId) {
          results.push({
            id: stream.stream_id,
            name: stream.name,
            type: 'live',
            icon: stream.stream_icon,
            categoryId: stream.category_id,
            score: 0,
            item: stream,
          });
        }
      });
    }

    if (types.includes('movie') && vodStreams) {
      vodStreams.forEach((stream) => {
        if (!categoryId || stream.category_id === categoryId) {
          results.push({
            id: stream.stream_id,
            name: stream.name,
            type: 'movie',
            icon: stream.stream_icon,
            categoryId: stream.category_id,
            score: 0,
            item: stream,
          });
        }
      });
    }

    if (types.includes('series') && series) {
      series.forEach((s) => {
        if (!categoryId || s.category_id === categoryId) {
          results.push({
            id: s.series_id,
            name: s.name,
            type: 'series',
            icon: s.cover,
            categoryId: s.category_id,
            score: 0,
            item: s,
          });
        }
      });
    }

    return results;
  }, [liveStreams, vodStreams, series, types, categoryId]);

  // Create Fuse instance
  const fuse = useMemo(() => {
    return new Fuse(searchIndex, {
      ...defaultFuseOptions,
      threshold,
    });
  }, [searchIndex, threshold]);

  // Search function
  const search = useCallback(
    (query: string): SearchResult[] => {
      if (!query || query.length < 2) {
        return [];
      }

      const results = fuse.search(query, { limit });

      return results.map((result: FuseResult<SearchResult>) => ({
        ...result.item,
        score: result.score || 0,
      }));
    },
    [fuse, limit]
  );

  return {
    search,
    isLoading,
    totalItems: searchIndex.length,
  };
}

// ============================================
// Combined Search Hook with Debounce
// ============================================

export function useDebouncedSearch(options: SearchOptions & { debounceMs?: number } = {}) {
  const { debounceMs = 300, ...searchOptions } = options;
  const { query, debouncedQuery, isSearching, setQuery, clearSearch } =
    useSearchState(debounceMs);
  const { search, isLoading, totalItems } = useSearch(searchOptions);

  const results = useMemo(() => {
    if (!debouncedQuery) return [];
    return search(debouncedQuery);
  }, [search, debouncedQuery]);

  return {
    query,
    setQuery,
    clearSearch,
    results,
    isSearching: isSearching && debouncedQuery !== query,
    isLoading,
    totalItems,
  };
}

// ============================================
// Category-Specific Search Hooks
// ============================================

export function useLiveSearch(categoryId?: string) {
  return useDebouncedSearch({
    types: ['live'],
    categoryId,
  });
}

export function useVODSearch(categoryId?: string) {
  return useDebouncedSearch({
    types: ['movie'],
    categoryId,
  });
}

export function useSeriesSearch(categoryId?: string) {
  return useDebouncedSearch({
    types: ['series'],
    categoryId,
  });
}

// ============================================
// Instant Search Hook (for search-as-you-type)
// ============================================

export function useInstantSearch<T extends { name: string }>(
  items: T[],
  options?: {
    keys?: string[];
    threshold?: number;
    limit?: number;
  }
) {
  const { keys = ['name'], threshold = 0.3, limit = 20 } = options || {};

  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys,
      threshold,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }, [items, keys, threshold]);

  const search = useCallback(
    (query: string): Array<T & { score: number }> => {
      if (!query) return [];

      const results = fuse.search(query, { limit });
      return results.map((r) => ({
        ...r.item,
        score: r.score || 0,
      }));
    },
    [fuse, limit]
  );

  return search;
}

// ============================================
// Search History Hook
// ============================================

const SEARCH_HISTORY_KEY = 'nate-iptv-search-history';
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((query: string) => {
    if (!query || query.length < 2) return;

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== query.toLowerCase()
      );
      // Add to beginning
      const updated = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS);

      // Persist
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }

      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const updated = prev.filter(
        (item) => item.toLowerCase() !== query.toLowerCase()
      );

      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }

      return updated;
    });
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}

// ============================================
// Combined Search with History
// ============================================

export function useSearchWithHistory(options: SearchOptions = {}) {
  const searchState = useDebouncedSearch(options);
  const { history, addToHistory, clearHistory, removeFromHistory } =
    useSearchHistory();

  const handleSearch = useCallback(
    (query: string) => {
      searchState.setQuery(query);
    },
    [searchState]
  );

  const submitSearch = useCallback(
    (query: string) => {
      if (query && query.length >= 2) {
        addToHistory(query);
      }
    },
    [addToHistory]
  );

  return {
    ...searchState,
    handleSearch,
    submitSearch,
    history,
    clearHistory,
    removeFromHistory,
  };
}

// ============================================
// Recent Searches Suggestions
// ============================================

export function useSearchSuggestions(query: string, limit: number = 5) {
  const { history } = useSearchHistory();

  const suggestions = useMemo(() => {
    if (!query) return history.slice(0, limit);

    const lowerQuery = query.toLowerCase();
    return history
      .filter((item) => item.toLowerCase().includes(lowerQuery))
      .slice(0, limit);
  }, [query, history, limit]);

  return suggestions;
}
