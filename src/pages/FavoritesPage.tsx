/**
 * Favorites Page
 * ==============
 * Displays all favorites organized by type with tabs,
 * grid view, and remove functionality.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Tv,
  Film,
  Clapperboard,
  Play,
  Trash2,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useConnectionStore } from '../stores/connectionStore';
import { useFavoritesStore } from '../stores/favoritesStore';
import { usePlayerStore } from '../stores/playerStore';
import {
  SimpleTabs,
  ChannelLogo,
  MoviePoster,
  ConfirmModal,
  EmptyState,
} from '../components/common';
import type { Favorite } from '../services/xtream/types';

// ============================================
// Types
// ============================================

type FavoriteFilter = 'all' | 'live' | 'movie' | 'series';
type SortOrder = 'newest' | 'oldest' | 'name-asc' | 'name-desc';
type ViewMode = 'grid' | 'list';

// ============================================
// Empty State Component
// ============================================

interface FavoritesEmptyStateProps {
  filter: FavoriteFilter;
  onBrowse: () => void;
}

const FavoritesEmptyState: React.FC<FavoritesEmptyStateProps> = ({ filter, onBrowse }) => {
  const titleMap = {
    all: 'No Favorites Yet',
    live: 'No Favorite Channels',
    movie: 'No Favorite Movies',
    series: 'No Favorite Series',
  };

  const descriptionMap = {
    all: "You haven't added any favorites yet. Start exploring and add items you love!",
    live: "You haven't favorited any channels yet. Browse channels and click the star to save them here.",
    movie: "You haven't favorited any movies yet. Browse movies and click the star to save them here.",
    series: "You haven't favorited any series yet. Browse series and click the star to save them here.",
  };

  const browseLabels = {
    all: 'Browse Content',
    live: 'Browse Channels',
    movie: 'Browse Movies',
    series: 'Browse Series',
  };

  const iconMap = {
    all: <Star className="w-full h-full" />,
    live: <Tv className="w-full h-full" />,
    movie: <Film className="w-full h-full" />,
    series: <Clapperboard className="w-full h-full" />,
  };

  return (
    <EmptyState
      icon={iconMap[filter]}
      title={titleMap[filter]}
      description={descriptionMap[filter]}
      action={{
        label: browseLabels[filter],
        onClick: onBrowse,
      }}
      size="lg"
    />
  );
};

// ============================================
// Favorite Card Component (Grid View)
// ============================================

interface FavoriteCardProps {
  favorite: Favorite;
  onPlay: () => void;
  onRemove: () => void;
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({
  favorite,
  onPlay,
  onRemove,
}) => {
  const typeConfig = {
    live: { icon: Tv, label: 'Channel', color: 'text-blue-400 bg-blue-500/10' },
    movie: { icon: Film, label: 'Movie', color: 'text-purple-400 bg-purple-500/10' },
    series: { icon: Clapperboard, label: 'Series', color: 'text-pink-400 bg-pink-500/10' },
  };

  const config = typeConfig[favorite.streamType];
  const TypeIcon = config.icon;

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden bg-dark-800',
        'border border-dark-700 hover:border-primary-500/50',
        'transition-all'
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video">
        {favorite.icon ? (
          favorite.streamType === 'live' ? (
            <ChannelLogo src={favorite.icon} name={favorite.name} className="w-full h-full" />
          ) : (
            <MoviePoster src={favorite.icon} title={favorite.name} className="w-full h-full" />
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

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-lg',
            'bg-dark-900/80 backdrop-blur-sm',
            'text-dark-400 hover:text-red-400',
            'opacity-0 group-hover:opacity-100',
            'transition-all'
          )}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Favorite Star */}
        <Star className="absolute bottom-2 right-2 w-4 h-4 text-yellow-400 fill-yellow-400" />
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-white truncate">{favorite.name}</h3>
        <p className="text-xs text-dark-500 mt-1">
          Added {new Date(favorite.addedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

// ============================================
// Favorite List Item Component (List View)
// ============================================

const FavoriteListItem: React.FC<FavoriteCardProps> = ({
  favorite,
  onPlay,
  onRemove,
}) => {
  const typeConfig = {
    live: { icon: Tv, label: 'Channel', color: 'text-blue-400' },
    movie: { icon: Film, label: 'Movie', color: 'text-purple-400' },
    series: { icon: Clapperboard, label: 'Series', color: 'text-pink-400' },
  };

  const config = typeConfig[favorite.streamType];
  const TypeIcon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-xl',
        'bg-dark-800 border border-dark-700',
        'hover:border-primary-500/50 transition-all'
      )}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        {favorite.icon ? (
          favorite.streamType === 'live' ? (
            <ChannelLogo src={favorite.icon} name={favorite.name} className="w-full h-full" />
          ) : (
            <MoviePoster src={favorite.icon} title={favorite.name} className="w-full h-full" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-dark-700">
            <TypeIcon className="w-6 h-6 text-dark-500" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
          <h3 className="font-medium text-white truncate">{favorite.name}</h3>
        </div>
        <div className="flex items-center gap-3 text-sm text-dark-400">
          <span className={cn('flex items-center gap-1', config.color)}>
            <TypeIcon className="w-3.5 h-3.5" />
            {config.label}
          </span>
          <span>Added {new Date(favorite.addedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPlay}
          className={cn(
            'p-2.5 rounded-lg',
            'bg-primary-500 text-white',
            'hover:bg-primary-600 transition-colors'
          )}
        >
          <Play className="w-5 h-5" />
        </button>
        <button
          onClick={onRemove}
          className={cn(
            'p-2.5 rounded-lg',
            'bg-dark-700 text-dark-400',
            'hover:bg-red-500/10 hover:text-red-400',
            'transition-colors'
          )}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// Sort Menu Component
// ============================================

interface SortMenuProps {
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
}

const SortMenu: React.FC<SortMenuProps> = ({ sortOrder, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions: { value: SortOrder; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
  ];

  const currentLabel = sortOptions.find((o) => o.value === sortOrder)?.label;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-dark-800 text-dark-300',
          'hover:text-white transition-colors'
        )}
      >
        {sortOrder.startsWith('name') ? (
          sortOrder === 'name-asc' ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )
        ) : (
          <SortAsc className="w-4 h-4" />
        )}
        <span className="text-sm hidden sm:inline">{currentLabel}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-40 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 py-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm',
                  'hover:bg-dark-700 transition-colors',
                  sortOrder === option.value
                    ? 'text-primary-400'
                    : 'text-dark-300 hover:text-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// Main Favorites Page Component
// ============================================

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const getFavoritesForConnection = useFavoritesStore(
    (state) => state.getFavoritesForConnection
  );
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const play = usePlayerStore((state) => state.play);

  // State
  const [filter, setFilter] = useState<FavoriteFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [favoriteToRemove, setFavoriteToRemove] = useState<Favorite | null>(null);

  // Get favorites
  const allFavorites = activeConnection
    ? getFavoritesForConnection(activeConnection.id)
    : [];

  // Filtered favorites
  const filteredFavorites = useMemo(() => {
    let result = [...allFavorites];

    // Filter by type
    if (filter !== 'all') {
      result = result.filter((f) => f.streamType === filter);
    }

    // Sort
    switch (sortOrder) {
      case 'newest':
        result.sort((a, b) => b.addedAt - a.addedAt);
        break;
      case 'oldest':
        result.sort((a, b) => a.addedAt - b.addedAt);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return result;
  }, [allFavorites, filter, sortOrder]);

  // Counts by type
  const counts = useMemo(() => {
    return {
      all: allFavorites.length,
      live: allFavorites.filter((f) => f.streamType === 'live').length,
      movie: allFavorites.filter((f) => f.streamType === 'movie').length,
      series: allFavorites.filter((f) => f.streamType === 'series').length,
    };
  }, [allFavorites]);

  // Handle play
  const handlePlay = useCallback(
    (favorite: Favorite) => {
      play({
        id: favorite.streamId,
        name: favorite.name,
        url: '', // Will be generated
        type: favorite.streamType,
        icon: favorite.icon,
        categoryId: favorite.categoryId,
      });
    },
    [play]
  );

  // Handle remove confirmation
  const handleRemoveConfirm = useCallback(async () => {
    if (!activeConnection || !favoriteToRemove) return;

    await removeFavorite(
      activeConnection.id,
      favoriteToRemove.streamId,
      favoriteToRemove.streamType
    );
    setFavoriteToRemove(null);
  }, [activeConnection, favoriteToRemove, removeFavorite]);

  // Handle browse
  const handleBrowse = useCallback(() => {
    const routes = {
      all: '/live',
      live: '/live',
      movie: '/movies',
      series: '/series',
    };
    navigate(routes[filter]);
  }, [filter, navigate]);

  // Tabs - SimpleTabs requires value and content
  const tabs = [
    { value: 'all', label: `All (${counts.all})`, content: null },
    { value: 'live', label: `Channels (${counts.live})`, content: null },
    { value: 'movie', label: `Movies (${counts.movie})`, content: null },
    { value: 'series', label: `Series (${counts.series})`, content: null },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Favorites</h1>
            <p className="text-sm text-dark-400">{counts.all} items saved</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <SimpleTabs
          tabs={tabs}
          value={filter}
          onChange={(tab) => setFilter(tab as FavoriteFilter)}
          variant="pills"
        />

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <SortMenu sortOrder={sortOrder} onSortChange={setSortOrder} />

          {/* View Mode Toggle */}
          <div className="flex items-center bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-dark-700 text-white'
                  : 'text-dark-400 hover:text-white'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-dark-700 text-white'
                  : 'text-dark-400 hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredFavorites.length === 0 ? (
        <FavoritesEmptyState filter={filter} onBrowse={handleBrowse} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredFavorites.map((favorite) => (
            <FavoriteCard
              key={`${favorite.streamType}-${favorite.streamId}`}
              favorite={favorite}
              onPlay={() => handlePlay(favorite)}
              onRemove={() => setFavoriteToRemove(favorite)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFavorites.map((favorite) => (
            <FavoriteListItem
              key={`${favorite.streamType}-${favorite.streamId}`}
              favorite={favorite}
              onPlay={() => handlePlay(favorite)}
              onRemove={() => setFavoriteToRemove(favorite)}
            />
          ))}
        </div>
      )}

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={favoriteToRemove !== null}
        onClose={() => setFavoriteToRemove(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove from Favorites"
        message={`Are you sure you want to remove "${favoriteToRemove?.name}" from your favorites?`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};

export default FavoritesPage;
