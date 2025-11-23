/**
 * ChannelBrowser Component
 * Main channel browser page with sidebar, search, and grid/list views
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  SearchInput,
  EmptyState,
  NoConnection,
  NoFavorites,
  NoChannels,
  GenericError,
  SkeletonCard,
} from '@/components/common';
import { CategorySidebar, CategoryDrawer } from './CategorySidebar';
import { ChannelList } from './ChannelList';
import { ChannelGrid } from './ChannelGrid';
import { useLiveStreams, useInstantSearch } from '@/hooks';
import { useConnectionStore, useFavoritesStore, usePlayerStore } from '@/stores';
import type { LiveStream } from '@/services/xtream/types';

// ============================================
// Types
// ============================================

export type ViewMode = 'grid' | 'list';
export type SortOption = 'name' | 'recent' | 'number';

export interface ChannelBrowserProps {
  /** Initial view mode */
  defaultViewMode?: ViewMode;
  /** Initial sort option */
  defaultSort?: SortOption;
  /** Custom class name */
  className?: string;
  /** Callback when channel is played */
  onChannelPlay?: (channel: LiveStream) => void;
}

// ============================================
// Sub Components
// ============================================

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex bg-dark-700 rounded-lg p-0.5">
      <button
        className={cn(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          viewMode === 'grid'
            ? 'bg-dark-600 text-white'
            : 'text-gray-400 hover:text-white'
        )}
        onClick={() => onViewModeChange('grid')}
        aria-label="Grid view"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>
      <button
        className={cn(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          viewMode === 'list'
            ? 'bg-dark-600 text-white'
            : 'text-gray-400 hover:text-white'
        )}
        onClick={() => onViewModeChange('list')}
        aria-label="List view"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );
}

interface SortSelectProps {
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
}

function SortSelect({ sortOption, onSortChange }: SortSelectProps) {
  return (
    <select
      className={cn(
        'bg-dark-700 border border-dark-600 rounded-lg',
        'px-3 py-2 text-sm text-white',
        'focus:outline-none focus:ring-2 focus:ring-primary-500',
        'cursor-pointer'
      )}
      value={sortOption}
      onChange={(e) => onSortChange(e.target.value as SortOption)}
    >
      <option value="name">Sort by Name</option>
      <option value="recent">Recently Added</option>
      <option value="number">Channel Number</option>
    </select>
  );
}

interface MobileMenuButtonProps {
  onClick: () => void;
}

function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      className={cn(
        'lg:hidden p-2 rounded-lg',
        'bg-dark-700 text-gray-400 hover:text-white',
        'transition-colors'
      )}
      onClick={onClick}
      aria-label="Open categories menu"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}

interface ChannelCountProps {
  count: number;
  total?: number;
  isFiltered: boolean;
}

function ChannelCount({ count, total, isFiltered }: ChannelCountProps) {
  return (
    <p className="text-sm text-gray-400">
      {isFiltered ? (
        <>
          <span className="text-white font-medium">{count}</span> of{' '}
          <span>{total || 0}</span> channels
        </>
      ) : (
        <>
          <span className="text-white font-medium">{count}</span> channels
        </>
      )}
    </p>
  );
}

// ============================================
// Empty States
// ============================================

interface NoConnectionStateProps {
  onAddConnection: () => void;
}

function NoConnectionState({ onAddConnection }: NoConnectionStateProps) {
  return (
    <NoConnection
      className="h-full"
      title="No Connection"
      description="Connect to an IPTV provider to start browsing channels."
      action={{
        label: 'Add Connection',
        onClick: onAddConnection,
      }}
    />
  );
}

interface EmptyFavoritesStateProps {
  onBrowseChannels: () => void;
}

function EmptyFavoritesState({ onBrowseChannels }: EmptyFavoritesStateProps) {
  return (
    <NoFavorites
      className="h-full"
      title="No Favorite Channels"
      description="Click the star icon on any channel to save it here for quick access."
      action={{
        label: 'Browse All Channels',
        onClick: onBrowseChannels,
      }}
    />
  );
}

interface EmptyRecentStateProps {
  onBrowseChannels: () => void;
}

function EmptyRecentState({ onBrowseChannels }: EmptyRecentStateProps) {
  const historyIcon = (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <EmptyState
      icon={historyIcon}
      title="No Recent Channels"
      description="Start watching to build your channel history."
      action={{
        label: 'Browse Channels',
        onClick: onBrowseChannels,
      }}
      className="h-full"
    />
  );
}

interface ChannelErrorStateProps {
  onRetry: () => void;
  errorMessage?: string;
}

function ChannelErrorState({ onRetry, errorMessage }: ChannelErrorStateProps) {
  return (
    <GenericError
      className="h-full"
      title="Unable to Load Channels"
      description={errorMessage || "We couldn't load your channels. Please check your connection and try again."}
      onRetry={onRetry}
    />
  );
}

interface NoSearchResultsStateProps {
  query: string;
  onClearSearch: () => void;
}

function NoSearchResultsState({ query, onClearSearch }: NoSearchResultsStateProps) {
  const searchIcon = (
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
      icon={searchIcon}
      title="No Channels Found"
      description={`No channels match "${query}". Try a different search term.`}
      action={{
        label: 'Clear Search',
        onClick: onClearSearch,
      }}
      className="h-full"
    />
  );
}

// ============================================
// Loading Skeleton
// ============================================

function ChannelGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonCard key={i} aspectRatio="16/9" />
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ChannelBrowser({
  defaultViewMode = 'grid',
  defaultSort = 'name',
  className,
  onChannelPlay,
}: ChannelBrowserProps) {
  const navigate = useNavigate();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [sortOption, setSortOption] = useState<SortOption>(defaultSort);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Store hooks
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const favoritesForConnection = useFavoritesStore((state) =>
    activeConnection ? state.getFavoritesForConnection(activeConnection.id) : []
  );
  const recentStreams = usePlayerStore((state) => state.recentStreams);
  const play = usePlayerStore((state) => state.play);

  // Navigation handlers
  const handleAddConnection = useCallback(() => {
    navigate('/settings/connections');
  }, [navigate]);

  const handleBrowseAllChannels = useCallback(() => {
    setSelectedCategoryId(null);
    setSearchQuery('');
  }, []);

  // Determine the actual category to fetch
  const categoryToFetch = useMemo(() => {
    if (
      selectedCategoryId === '__favorites__' ||
      selectedCategoryId === '__recent__'
    ) {
      return undefined; // Will handle these separately
    }
    return selectedCategoryId || undefined;
  }, [selectedCategoryId]);

  // Fetch channels
  const {
    data: channels,
    isLoading,
    isError,
    error,
    refetch,
  } = useLiveStreams(categoryToFetch);

  // Handle retry for error state
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Build instant search function
  const searchFn = useInstantSearch(channels || [], {
    keys: ['name'],
    threshold: 0.3,
    limit: 100,
  });

  // Process channels based on special categories
  const processedChannels = useMemo<LiveStream[]>(() => {
    // Handle favorites
    if (selectedCategoryId === '__favorites__') {
      const favoriteIds = new Set(
        favoritesForConnection
          .filter((f) => f.streamType === 'live')
          .map((f) => f.streamId)
      );

      if (!channels) return [];
      return channels.filter((c) => favoriteIds.has(c.stream_id));
    }

    // Handle recent
    if (selectedCategoryId === '__recent__') {
      const recentIds = recentStreams
        .filter((s) => s.type === 'live')
        .map((s) => s.id);

      if (!channels) return [];
      return channels.filter((c) => recentIds.includes(c.stream_id));
    }

    return channels || [];
  }, [channels, selectedCategoryId, favoritesForConnection, recentStreams]);

  // Apply search filter
  const filteredChannels = useMemo<LiveStream[]>(() => {
    if (!searchQuery.trim()) {
      return processedChannels;
    }

    const searchResults = searchFn(searchQuery);
    return searchResults as LiveStream[];
  }, [processedChannels, searchQuery, searchFn]);

  // Apply sorting
  const sortedChannels = useMemo<LiveStream[]>(() => {
    const sorted = [...filteredChannels];

    switch (sortOption) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        sorted.sort((a, b) => {
          const aAdded = parseInt(a.added) || 0;
          const bAdded = parseInt(b.added) || 0;
          return bAdded - aAdded;
        });
        break;
      case 'number':
        sorted.sort((a, b) => a.num - b.num);
        break;
    }

    return sorted;
  }, [filteredChannels, sortOption]);

  // Handle channel click
  const handleChannelClick = useCallback(
    (channel: LiveStream) => {
      if (onChannelPlay) {
        onChannelPlay(channel);
      } else if (activeConnection) {
        play({
          id: channel.stream_id,
          name: channel.name,
          url: `${activeConnection.serverUrl}/live/${activeConnection.username}/${activeConnection.password}/${channel.stream_id}.m3u8`,
          type: 'live',
          icon: channel.stream_icon,
          categoryId: channel.category_id,
          epgChannelId: channel.epg_channel_id,
        });
      }
    },
    [activeConnection, onChannelPlay, play]
  );

  // Handle search
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle category change
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setSearchQuery(''); // Clear search when changing category
  }, []);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // No connection state
  if (!activeConnection) {
    return (
      <div className={cn('flex h-full bg-dark-900', className)}>
        <NoConnectionState onAddConnection={handleAddConnection} />
      </div>
    );
  }

  // Determine if showing special empty states
  const showFavoritesEmpty =
    selectedCategoryId === '__favorites__' && sortedChannels.length === 0 && !isLoading;
  const showRecentEmpty =
    selectedCategoryId === '__recent__' && sortedChannels.length === 0 && !isLoading;

  return (
    <div className={cn('flex h-full bg-dark-900', className)}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CategorySidebar
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={handleCategorySelect}
          isCollapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          className="h-full"
        />
      </div>

      {/* Mobile Category Drawer */}
      <CategoryDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header / Toolbar */}
        <div className="flex-shrink-0 border-b border-dark-700 bg-dark-800">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Mobile Menu Button */}
            <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)} />

            {/* Search */}
            <div className="flex-1 max-w-md">
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                onClear={handleClearSearch}
                placeholder="Search channels..."
                size="md"
              />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Channel Count */}
            <div className="hidden sm:block">
              <ChannelCount
                count={sortedChannels.length}
                total={processedChannels.length}
                isFiltered={searchQuery.length > 0}
              />
            </div>

            {/* Sort */}
            <div className="hidden md:block">
              <SortSelect sortOption={sortOption} onSortChange={setSortOption} />
            </div>

            {/* View Toggle */}
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>

          {/* Mobile Sort (second row) */}
          <div className="flex md:hidden items-center gap-3 px-4 pb-3">
            <SortSelect sortOption={sortOption} onSortChange={setSortOption} />
            <ChannelCount
              count={sortedChannels.length}
              total={processedChannels.length}
              isFiltered={searchQuery.length > 0}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Loading State with Skeleton */}
          {isLoading && sortedChannels.length === 0 && (
            <ChannelGridSkeleton />
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <ChannelErrorState
              onRetry={handleRetry}
              errorMessage={
                error instanceof Error
                  ? error.message
                  : "We couldn't load your channels. Please check your connection and try again."
              }
            />
          )}

          {/* Special Empty States */}
          {showFavoritesEmpty && (
            <EmptyFavoritesState onBrowseChannels={handleBrowseAllChannels} />
          )}
          {showRecentEmpty && (
            <EmptyRecentState onBrowseChannels={handleBrowseAllChannels} />
          )}

          {/* No Search Results State */}
          {!isLoading &&
            !isError &&
            !showFavoritesEmpty &&
            !showRecentEmpty &&
            searchQuery.trim() &&
            sortedChannels.length === 0 && (
              <NoSearchResultsState
                query={searchQuery}
                onClearSearch={handleClearSearch}
              />
            )}

          {/* Channel Content */}
          {!isLoading &&
            !isError &&
            !showFavoritesEmpty &&
            !showRecentEmpty &&
            (sortedChannels.length > 0 || !searchQuery.trim()) && (
              <>
                {sortedChannels.length === 0 && !searchQuery.trim() ? (
                  <NoChannels
                    className="h-full"
                    description="No channels available. Try selecting a different category."
                  />
                ) : viewMode === 'grid' ? (
                  <ChannelGrid
                    channels={sortedChannels}
                    isLoading={isLoading}
                    onChannelClick={handleChannelClick}
                    showEPG={true}
                  />
                ) : (
                  <ChannelList
                    channels={sortedChannels}
                    isLoading={isLoading}
                    onChannelClick={handleChannelClick}
                    showEPG={true}
                    showNumbers={sortOption === 'number'}
                  />
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}

export default ChannelBrowser;
