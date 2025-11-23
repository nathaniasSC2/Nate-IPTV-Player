/**
 * Search Page
 * ===========
 * Global search with filter tabs for channels, movies, and series.
 * Includes recent searches and results grid.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  Tv,
  Film,
  Clapperboard,
  Clock,
  Trash2,
  Play,
  Star,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useConnectionStore } from '../stores/connectionStore';
import { usePlayerStore } from '../stores/playerStore';
import { useFavoritesStore, useToggleFavorite } from '../stores/favoritesStore';
import { useDebouncedSearch, type SearchResult } from '../hooks/useSearch';
import {
  Spinner,
  ChannelLogo,
  MoviePoster,
  Tabs,
  TabList,
  Tab,
  EmptyState,
} from '../components/common';

// ============================================
// Types
// ============================================

type SearchFilter = 'all' | 'live' | 'movie' | 'series';

interface RecentSearch {
  query: string;
  timestamp: number;
}

// ============================================
// Local Storage Keys
// ============================================

const RECENT_SEARCHES_KEY = 'nate-iptv-recent-searches';
const MAX_RECENT_SEARCHES = 10;

// ============================================
// Recent Searches Helper Functions
// ============================================

const getRecentSearches = (): RecentSearch[] => {
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (query: string): void => {
  const searches = getRecentSearches();
  const filtered = searches.filter((s) => s.query.toLowerCase() !== query.toLowerCase());
  const updated = [{ query, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
};

const clearRecentSearches = (): void => {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
};

// ============================================
// Search Input Component
// ============================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSubmit,
  onClear,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search channels, movies, series..."
        autoFocus
        className={cn(
          'w-full pl-12 pr-12 py-4 rounded-xl',
          'bg-dark-800 border border-dark-700',
          'text-white text-lg placeholder-dark-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'transition-all'
        )}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </form>
  );
};

// ============================================
// Recent Searches Component
// ============================================

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSelect: (query: string) => void;
  onClear: () => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({
  searches,
  onSelect,
  onClear,
}) => {
  if (searches.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-dark-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Recent Searches</span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-sm text-dark-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {searches.map((search) => (
          <button
            key={search.timestamp}
            onClick={() => onSelect(search.query)}
            className={cn(
              'px-4 py-2 rounded-lg',
              'bg-dark-800 text-dark-300',
              'hover:bg-dark-700 hover:text-white',
              'transition-colors'
            )}
          >
            {search.query}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// Search Result Card Component
// ============================================

interface SearchResultCardProps {
  result: SearchResult;
  onPlay: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  onPlay,
  isFavorite,
  onToggleFavorite,
}) => {
  const { name, type, icon } = result;

  const typeConfig = {
    live: { icon: Tv, label: 'Live', color: 'text-blue-400 bg-blue-500/10' },
    movie: { icon: Film, label: 'Movie', color: 'text-purple-400 bg-purple-500/10' },
    series: { icon: Clapperboard, label: 'Series', color: 'text-pink-400 bg-pink-500/10' },
  };

  const config = typeConfig[type];
  const TypeIcon = config.icon;

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden bg-dark-800',
        'border border-dark-700 hover:border-primary-500/50',
        'transition-all'
      )}
    >
      {/* Thumbnail / Icon */}
      <div className="relative aspect-video">
        {icon ? (
          type === 'live' ? (
            <ChannelLogo src={icon} name={name} className="w-full h-full" />
          ) : (
            <MoviePoster src={icon} title={name} className="w-full h-full" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-dark-700">
            <TypeIcon className="w-12 h-12 text-dark-500" />
          </div>
        )}

        {/* Play Overlay */}
        <button
          onClick={onPlay}
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 text-white ml-1" />
          </div>
        </button>

        {/* Type Badge */}
        <span
          className={cn(
            'absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium',
            config.color
          )}
        >
          {config.label}
        </span>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-lg',
            'bg-dark-900/80 backdrop-blur-sm',
            'transition-colors',
            isFavorite
              ? 'text-yellow-400'
              : 'text-dark-400 hover:text-yellow-400'
          )}
        >
          <Star className={cn('w-4 h-4', isFavorite && 'fill-yellow-400')} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-white truncate">{name}</h3>
      </div>
    </div>
  );
};

// ============================================
// Empty State Component
// ============================================

interface SearchEmptyStateProps {
  query: string;
  filter: SearchFilter;
  onClearFilter?: () => void;
}

const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({ query, filter, onClearFilter }) => {
  const filterLabel = filter === 'all' ? 'anything' : `${filter}s`;

  // Custom icon with search and question mark
  const noResultsIcon = (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01"
      />
    </svg>
  );

  return (
    <EmptyState
      icon={noResultsIcon}
      title="No Results Found"
      description={`We couldn't find ${filterLabel} matching "${query}". Try different keywords or remove filters.`}
      action={
        filter !== 'all' && onClearFilter
          ? {
              label: 'Clear Filter',
              onClick: onClearFilter,
            }
          : undefined
      }
      size="lg"
    />
  );
};

// ============================================
// Initial State Component
// ============================================

const InitialState: React.FC = () => {
  // Custom search prompt icon
  const searchPromptIcon = (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );

  return (
    <EmptyState
      icon={searchPromptIcon}
      title="Search for Content"
      description="Find your favorite channels, movies, and series. Enter at least 2 characters to start."
      size="lg"
    >
      <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-md">
        <span className="px-3 py-1.5 rounded-full bg-dark-700 text-dark-300 text-sm">
          <Tv className="w-3.5 h-3.5 inline mr-1.5" />
          Live Channels
        </span>
        <span className="px-3 py-1.5 rounded-full bg-dark-700 text-dark-300 text-sm">
          <Film className="w-3.5 h-3.5 inline mr-1.5" />
          Movies
        </span>
        <span className="px-3 py-1.5 rounded-full bg-dark-700 text-dark-300 text-sm">
          <Clapperboard className="w-3.5 h-3.5 inline mr-1.5" />
          Series
        </span>
      </div>
    </EmptyState>
  );
};

// ============================================
// Main Search Page Component
// ============================================

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const play = usePlayerStore((state) => state.play);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);
  const toggleFavorite = useToggleFavorite();

  // State
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Sync query with URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  // Use the search hook
  const { results, isSearching } = useDebouncedSearch({
    debounceMs: 300,
  });

  // Update search query when URL changes
  useEffect(() => {
    if (query.trim().length >= 2) {
      // The useDebouncedSearch hook manages its own query
    }
  }, [query]);

  // Filter results based on selected filter
  const filteredResults = useMemo(() => {
    if (filter === 'all') return results;
    return results.filter((r) => r.type === filter);
  }, [results, filter]);

  // Count by type
  const counts = useMemo(() => {
    return {
      all: results.length,
      live: results.filter((r) => r.type === 'live').length,
      movie: results.filter((r) => r.type === 'movie').length,
      series: results.filter((r) => r.type === 'series').length,
    };
  }, [results]);

  // Handle search submit
  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
      setSearchParams({ q: query.trim() });
    }
  }, [query, setSearchParams]);

  // Handle clear
  const handleClear = useCallback(() => {
    setQuery('');
    setSearchParams({});
  }, [setSearchParams]);

  // Handle recent search select
  const handleRecentSelect = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
      setSearchParams({ q: searchQuery });
    },
    [setSearchParams]
  );

  // Handle clear recent searches
  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  // Handle clear filter
  const handleClearFilter = useCallback(() => {
    setFilter('all');
  }, []);

  // Handle play
  const handlePlay = useCallback(
    (item: typeof results[0]) => {
      play({
        id: item.id,
        name: item.name,
        url: '', // Will be generated
        type: item.type,
        icon: item.icon,
        categoryId: item.categoryId,
      });
    },
    [play]
  );

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(
    async (item: typeof results[0]) => {
      if (!activeConnection) return;
      await toggleFavorite(activeConnection.id, {
        streamId: item.id,
        streamType: item.type,
        name: item.name,
        icon: item.icon,
        categoryId: item.categoryId,
      });
    },
    [activeConnection, toggleFavorite]
  );

  // Filter tabs configuration
  const tabsConfig = [
    { value: 'all', label: `All (${counts.all})` },
    { value: 'live', label: `Channels (${counts.live})` },
    { value: 'movie', label: `Movies (${counts.movie})` },
    { value: 'series', label: `Series (${counts.series})` },
  ];

  const hasQuery = query.trim().length >= 2;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-6">Search</h1>
        <SearchInput
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          onClear={handleClear}
        />
      </div>

      {/* Recent Searches (shown when no query) */}
      {!hasQuery && (
        <RecentSearches
          searches={recentSearches}
          onSelect={handleRecentSelect}
          onClear={handleClearRecent}
        />
      )}

      {/* Filter Tabs (shown when has query) */}
      {hasQuery && (
        <div className="mb-6">
          <Tabs value={filter} onChange={(tab) => setFilter(tab as SearchFilter)}>
            <TabList variant="pills">
              {tabsConfig.map((tab) => (
                <Tab key={tab.value} value={tab.value} variant="pills">
                  {tab.label}
                </Tab>
              ))}
            </TabList>
          </Tabs>
        </div>
      )}

      {/* Results */}
      {isSearching ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : hasQuery ? (
        filteredResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredResults.map((item) => (
              <SearchResultCard
                key={`${item.type}-${item.id}`}
                result={item}
                onPlay={() => handlePlay(item)}
                isFavorite={
                  activeConnection
                    ? isFavorite(activeConnection.id, item.id, item.type)
                    : false
                }
                onToggleFavorite={() => handleToggleFavorite(item)}
              />
            ))}
          </div>
        ) : (
          <SearchEmptyState query={query} filter={filter} onClearFilter={handleClearFilter} />
        )
      ) : (
        <InitialState />
      )}
    </div>
  );
};

export default SearchPage;
