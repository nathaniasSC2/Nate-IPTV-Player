/**
 * VODBrowser Component
 * Main browser for VOD content with Movies/Series tabs and category sidebar
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  Tabs,
  TabList,
  Tab,
  SearchInput,
  Spinner,
  CountBadge,
  NoConnection,
} from '@/components/common';
import { MovieGrid } from './MovieGrid';
import { MovieModal } from './MovieModal';
import { SeriesList } from './SeriesList';
import { SeriesModal } from './SeriesModal';
import {
  useVODCategories,
  useSeriesCategories,
  useVODSearch,
  useSeriesSearch,
} from '@/hooks';
import { useConnectionStore, useFavoritesStore } from '@/stores';
import type { VODStream, Series } from '@/services/xtream/types';

// ============================================
// Types
// ============================================

export interface VODBrowserProps {
  /** Initial active tab */
  defaultTab?: 'movies' | 'series';
  /** Custom class name */
  className?: string;
  /** Whether sidebar is collapsed */
  sidebarCollapsed?: boolean;
  /** Callback when sidebar collapse changes */
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
}

type ContentType = 'movies' | 'series';
type SpecialCategory = 'all' | 'favorites' | 'recent';

// ============================================
// Icons
// ============================================

const icons = {
  all: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 10h16M4 14h16M4 18h16"
      />
    </svg>
  ),
  favorites: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  movies: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
      />
    </svg>
  ),
  series: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  ),
  category: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  ),
};

// ============================================
// Sidebar Components
// ============================================

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function SidebarHeader({ isCollapsed, onToggle }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
      {!isCollapsed && (
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
          Categories
        </h2>
      )}
      <button
        className={cn(
          'p-1.5 rounded-md',
          'text-gray-400 hover:text-white hover:bg-dark-700',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          isCollapsed && 'mx-auto'
        )}
        onClick={onToggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          className={cn('w-5 h-5 transition-transform duration-200', isCollapsed && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
          />
        </svg>
      </button>
    </div>
  );
}

interface CategoryItemProps {
  id: string | null;
  name: string;
  icon?: React.ReactNode;
  count?: number;
  isSelected: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

function CategoryItem({
  name,
  icon,
  count,
  isSelected,
  isCollapsed,
  onClick,
}: CategoryItemProps) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md',
        'text-left transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
        isSelected
          ? 'bg-primary-600 text-white'
          : 'text-gray-300 hover:bg-dark-700 hover:text-white',
        isCollapsed && 'justify-center px-2'
      )}
      onClick={onClick}
      title={isCollapsed ? name : undefined}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate text-sm">{name}</span>
          {count !== undefined && count > 0 && (
            <CountBadge
              count={count}
              variant={isSelected ? 'secondary' : 'default'}
              size="xs"
            />
          )}
        </>
      )}
    </button>
  );
}

function SectionDivider({ label, isCollapsed }: { label?: string; isCollapsed: boolean }) {
  if (isCollapsed) {
    return <div className="my-2 border-t border-dark-700" />;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 mt-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 border-t border-dark-700" />
    </div>
  );
}

// ============================================
// Empty & Error States
// ============================================

interface VODNoConnectionStateProps {
  onAddConnection: () => void;
}

function VODNoConnectionState({ onAddConnection }: VODNoConnectionStateProps) {
  return (
    <NoConnection
      className="h-full"
      title="No Connection"
      description="Connect to an IPTV provider to browse movies and series."
      action={{
        label: 'Add Connection',
        onClick: onAddConnection,
      }}
    />
  );
}

// ============================================
// Category Sidebar
// ============================================

interface VODCategorySidebarProps {
  contentType: ContentType;
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  className?: string;
}

function VODCategorySidebar({
  contentType,
  selectedCategoryId,
  onCategorySelect,
  isCollapsed,
  onCollapsedChange,
  className,
}: VODCategorySidebarProps) {
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const favoritesForConnection = useFavoritesStore((state) =>
    activeConnection ? state.getFavoritesForConnection(activeConnection.id) : []
  );

  // Fetch categories based on content type
  const { data: vodCategories, isLoading: vodLoading } = useVODCategories({
    enabled: contentType === 'movies',
  });
  const { data: seriesCategories, isLoading: seriesLoading } = useSeriesCategories({
    enabled: contentType === 'series',
  });

  const categories = contentType === 'movies' ? vodCategories : seriesCategories;
  const isLoading = contentType === 'movies' ? vodLoading : seriesLoading;

  // Count favorites by type
  const favoritesCount = useMemo(() => {
    const streamType = contentType === 'movies' ? 'movie' : 'series';
    return favoritesForConnection.filter((f) => f.streamType === streamType).length;
  }, [favoritesForConnection, contentType]);

  // Determine special category
  const selectedSpecial: SpecialCategory | null = useMemo(() => {
    if (selectedCategoryId === null) return 'all';
    if (selectedCategoryId === '__favorites__') return 'favorites';
    return null;
  }, [selectedCategoryId]);

  return (
    <aside
      className={cn(
        'flex flex-col bg-dark-800 border-r border-dark-700',
        'transition-all duration-200',
        isCollapsed ? 'w-14' : 'w-64',
        className
      )}
    >
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggle={() => onCollapsedChange(!isCollapsed)}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-dark-600 py-2">
        {/* Special Categories */}
        <div className="px-2 space-y-1">
          <CategoryItem
            id={null}
            name={contentType === 'movies' ? 'All Movies' : 'All Series'}
            icon={icons.all}
            isSelected={selectedSpecial === 'all'}
            isCollapsed={isCollapsed}
            onClick={() => onCategorySelect(null)}
          />

          <CategoryItem
            id="__favorites__"
            name="Favorites"
            icon={icons.favorites}
            count={favoritesCount}
            isSelected={selectedSpecial === 'favorites'}
            isCollapsed={isCollapsed}
            onClick={() => onCategorySelect('__favorites__')}
          />
        </div>

        <SectionDivider label="Categories" isCollapsed={isCollapsed} />

        {/* Categories List */}
        <div className="px-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" variant="gray" />
            </div>
          ) : categories && categories.length > 0 ? (
            categories.map((category) => (
              <CategoryItem
                key={category.category_id}
                id={category.category_id}
                name={category.category_name}
                icon={icons.category}
                isSelected={selectedCategoryId === category.category_id}
                isCollapsed={isCollapsed}
                onClick={() => onCategorySelect(category.category_id)}
              />
            ))
          ) : (
            !isCollapsed && (
              <p className="text-sm text-gray-500 text-center py-4">
                No categories available
              </p>
            )
          )}
        </div>
      </div>

      {/* Footer */}
      {!isCollapsed && activeConnection && (
        <div className="px-3 py-2 border-t border-dark-700">
          <p className="text-xs text-gray-500 truncate" title={activeConnection.name}>
            {activeConnection.name}
          </p>
        </div>
      )}
    </aside>
  );
}

// ============================================
// Main VOD Browser Component
// ============================================

export function VODBrowser({
  defaultTab = 'movies',
  className,
  sidebarCollapsed: controlledCollapsed,
  onSidebarCollapsedChange,
}: VODBrowserProps) {
  const navigate = useNavigate();
  const activeConnection = useConnectionStore((state) => state.activeConnection);

  // State
  const [activeTab, setActiveTab] = useState<ContentType>(defaultTab);
  const [movieCategoryId, setMovieCategoryId] = useState<string | null>(null);
  const [seriesCategoryId, setSeriesCategoryId] = useState<string | null>(null);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Movie modal state
  const [selectedMovie, setSelectedMovie] = useState<VODStream | null>(null);
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);

  // Series modal state
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);

  // Sidebar collapse state
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = useCallback(
    (collapsed: boolean) => {
      if (onSidebarCollapsedChange) {
        onSidebarCollapsedChange(collapsed);
      } else {
        setInternalCollapsed(collapsed);
      }
    },
    [onSidebarCollapsedChange]
  );

  // Navigation handlers
  const handleAddConnection = useCallback(() => {
    navigate('/settings/connections');
  }, [navigate]);

  // Search hooks
  const movieSearch = useVODSearch(
    movieCategoryId && movieCategoryId !== '__favorites__' ? movieCategoryId : undefined
  );
  const seriesSearch = useSeriesSearch(
    seriesCategoryId && seriesCategoryId !== '__favorites__' ? seriesCategoryId : undefined
  );

  // Active search based on tab
  const activeSearch = activeTab === 'movies' ? movieSearch : seriesSearch;

  // Handlers
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as ContentType);
    setSearchQuery('');
  }, []);

  const handleMovieCategorySelect = useCallback((categoryId: string | null) => {
    setMovieCategoryId(categoryId);
  }, []);

  const handleSeriesCategorySelect = useCallback((categoryId: string | null) => {
    setSeriesCategoryId(categoryId);
  }, []);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      activeSearch.setQuery(query);
    },
    [activeSearch]
  );

  const handleMovieClick = useCallback((movie: VODStream) => {
    setSelectedMovie(movie);
    setIsMovieModalOpen(true);
  }, []);

  const handleSeriesClick = useCallback((series: Series) => {
    setSelectedSeries(series);
    setIsSeriesModalOpen(true);
  }, []);

  const handleCloseMovieModal = useCallback(() => {
    setIsMovieModalOpen(false);
    setSelectedMovie(null);
  }, []);

  const handleCloseSeriesModal = useCallback(() => {
    setIsSeriesModalOpen(false);
    setSelectedSeries(null);
  }, []);

  // Current category and search results
  const currentCategoryId = activeTab === 'movies' ? movieCategoryId : seriesCategoryId;
  const handleCategorySelect = activeTab === 'movies' ? handleMovieCategorySelect : handleSeriesCategorySelect;

  // No connection state
  if (!activeConnection) {
    return (
      <div className={cn('flex h-full bg-dark-900', className)}>
        <VODNoConnectionState onAddConnection={handleAddConnection} />
      </div>
    );
  }

  return (
    <div className={cn('flex h-full bg-dark-900', className)}>
      {/* Category Sidebar */}
      <VODCategorySidebar
        contentType={activeTab}
        selectedCategoryId={currentCategoryId}
        onCategorySelect={handleCategorySelect}
        isCollapsed={isCollapsed}
        onCollapsedChange={setCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with Tabs and Search */}
        <div className="flex-shrink-0 bg-dark-800 border-b border-dark-700 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Tabs */}
            <Tabs value={activeTab} onChange={handleTabChange}>
              <TabList variant="pills" className="gap-2">
                <Tab value="movies" variant="pills" icon={icons.movies}>
                  Movies
                </Tab>
                <Tab value="series" variant="pills" icon={icons.series}>
                  Series
                </Tab>
              </TabList>
            </Tabs>

            {/* Search */}
            <div className="w-80">
              <SearchInput
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={`Search ${activeTab === 'movies' ? 'movies' : 'series'}...`}
                onClear={() => handleSearchChange('')}
              />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-hidden p-6">
          {activeTab === 'movies' ? (
            <MovieGrid
              categoryId={movieCategoryId !== '__favorites__' ? movieCategoryId : undefined}
              searchQuery={searchQuery}
              onMovieClick={handleMovieClick}
              onMovieMoreInfo={handleMovieClick}
              showCategoryFilter={false}
              showSortOptions={true}
              className="h-full"
            />
          ) : (
            <SeriesList
              categoryId={seriesCategoryId !== '__favorites__' ? seriesCategoryId : undefined}
              searchQuery={searchQuery}
              onSeriesClick={handleSeriesClick}
              onViewSeries={handleSeriesClick}
              showCategoryFilter={false}
              showSortOptions={true}
              className="h-full"
            />
          )}
        </div>
      </div>

      {/* Movie Modal */}
      <MovieModal
        isOpen={isMovieModalOpen}
        onClose={handleCloseMovieModal}
        movie={selectedMovie}
      />

      {/* Series Modal */}
      <SeriesModal
        isOpen={isSeriesModalOpen}
        onClose={handleCloseSeriesModal}
        series={selectedSeries}
      />
    </div>
  );
}

// ============================================
// Simple VOD Page Component
// ============================================

export interface SimpleVODPageProps {
  type: 'movies' | 'series';
  categoryId?: string;
  className?: string;
}

export function SimpleVODPage({ type, categoryId, className }: SimpleVODPageProps) {
  const [selectedMovie, setSelectedMovie] = useState<VODStream | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  if (type === 'movies') {
    return (
      <div className={cn('p-6', className)}>
        <MovieGrid
          categoryId={categoryId}
          onMovieClick={setSelectedMovie}
          onMovieMoreInfo={setSelectedMovie}
          showCategoryFilter={true}
          showSortOptions={true}
        />
        <MovieModal
          isOpen={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          movie={selectedMovie}
        />
      </div>
    );
  }

  return (
    <div className={cn('p-6', className)}>
      <SeriesList
        categoryId={categoryId}
        onSeriesClick={setSelectedSeries}
        onViewSeries={setSelectedSeries}
        showCategoryFilter={true}
        showSortOptions={true}
      />
      <SeriesModal
        isOpen={!!selectedSeries}
        onClose={() => setSelectedSeries(null)}
        series={selectedSeries}
      />
    </div>
  );
}

export default VODBrowser;
