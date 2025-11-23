/**
 * Movies Page
 * ===========
 * VOD movies browser with category filtering,
 * search, and movie details modal.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Film,
  Search,
  ChevronDown,
  Play,
  Star,
  Info,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useConnectionStore } from '../stores/connectionStore';
import { usePlayerStore } from '../stores/playerStore';
import { useFavoritesStore, useToggleFavorite } from '../stores/favoritesStore';
import { useVODCategories, useVODStreams } from '../hooks/useXtreamAPI';
import {
  MoviePoster,
  Spinner,
} from '../components/common';

// ============================================
// Category Selector Component
// ============================================

interface CategorySelectorProps {
  categories: Array<{ category_id: string; category_name: string }>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isLoading: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedId,
  onSelect,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategory = categories.find((c) => c.category_id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg',
          'bg-dark-800 border border-dark-700',
          'text-white hover:border-dark-600',
          'transition-colors min-w-[200px]'
        )}
      >
        <Film className="w-4 h-4 text-dark-400" />
        <span className="flex-1 text-left truncate">
          {selectedCategory?.category_name || 'All Categories'}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-dark-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 w-64 max-h-80 overflow-y-auto bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 py-1 scrollbar-thin">
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-4 py-2 text-left text-sm',
                'hover:bg-dark-700 transition-colors',
                selectedId === null
                  ? 'text-primary-400 bg-primary-500/10'
                  : 'text-dark-300 hover:text-white'
              )}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.category_id}
                onClick={() => {
                  onSelect(category.category_id);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm',
                  'hover:bg-dark-700 transition-colors',
                  selectedId === category.category_id
                    ? 'text-primary-400 bg-primary-500/10'
                    : 'text-dark-300 hover:text-white'
                )}
              >
                {category.category_name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// Movie Card Component
// ============================================

interface MovieCardProps {
  movie: {
    stream_id: number;
    name: string;
    stream_icon: string;
    rating: string;
    rating_5based: number;
  };
  onPlay: () => void;
  onInfo: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPlay,
  onInfo,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden bg-dark-800',
        'border border-dark-700 hover:border-primary-500/50',
        'transition-all'
      )}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3]">
        <MoviePoster
          src={movie.stream_icon}
          title={movie.name}
          className="w-full h-full"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <button
              onClick={onPlay}
              className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform"
            >
              <Play className="w-5 h-5 text-white ml-0.5" />
            </button>
            <button
              onClick={onInfo}
              className="w-10 h-10 rounded-full bg-dark-800/80 flex items-center justify-center"
            >
              <Info className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Rating Badge */}
        {movie.rating_5based > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-dark-900/80 text-yellow-400 text-xs font-medium">
            <Star className="w-3 h-3 fill-yellow-400" />
            {movie.rating_5based.toFixed(1)}
          </div>
        )}

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
        <h3 className="font-medium text-white truncate">{movie.name}</h3>
      </div>
    </div>
  );
};

// ============================================
// Empty State Component
// ============================================

const EmptyState: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="text-center py-16">
      <Film className="w-16 h-16 text-dark-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">No Movies Found</h3>
      <p className="text-dark-400">{message}</p>
    </div>
  );
};

// ============================================
// Main Movies Page Component
// ============================================

const MoviesPage: React.FC = () => {
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const play = usePlayerStore((state) => state.play);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);
  const toggleFavorite = useToggleFavorite();

  // State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const { data: categories = [], isLoading: categoriesLoading } = useVODCategories();
  const { data: movies = [], isLoading: moviesLoading } = useVODStreams(
    selectedCategory || undefined
  );

  // Filter movies by search
  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies;
    const query = searchQuery.toLowerCase();
    return movies.filter((movie) =>
      movie.name.toLowerCase().includes(query)
    );
  }, [movies, searchQuery]);

  // Handle play
  const handlePlay = useCallback(
    (movie: typeof movies[0]) => {
      play({
        id: movie.stream_id,
        name: movie.name,
        url: '', // URL will be generated
        type: 'movie',
        icon: movie.stream_icon,
        categoryId: movie.category_id,
      });
    },
    [play]
  );

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(
    async (movie: typeof movies[0]) => {
      if (!activeConnection) return;
      await toggleFavorite(activeConnection.id, {
        streamId: movie.stream_id,
        streamType: 'movie',
        name: movie.name,
        icon: movie.stream_icon,
        categoryId: movie.category_id,
      });
    },
    [activeConnection, toggleFavorite]
  );

  const isLoading = categoriesLoading || moviesLoading;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Film className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Movies</h1>
            <p className="text-sm text-dark-400">
              {filteredMovies.length} movies available
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies..."
              className={cn(
                'w-full pl-9 pr-4 py-2 rounded-lg',
                'bg-dark-800 border border-dark-700',
                'text-white placeholder-dark-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
            />
          </div>

          {/* Category Selector */}
          <CategorySelector
            categories={categories}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
            isLoading={categoriesLoading}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : filteredMovies.length === 0 ? (
        <EmptyState
          message={
            searchQuery
              ? `No movies match "${searchQuery}"`
              : 'No movies in this category'
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.stream_id}
              movie={movie}
              onPlay={() => handlePlay(movie)}
              onInfo={() => {}} // TODO: Implement movie info modal
              isFavorite={
                activeConnection
                  ? isFavorite(activeConnection.id, movie.stream_id, 'movie')
                  : false
              }
              onToggleFavorite={() => handleToggleFavorite(movie)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MoviesPage;
