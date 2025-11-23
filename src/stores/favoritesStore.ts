/**
 * Favorites Store
 * Manages user favorites across connections
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Favorite, FavoritesMap, StreamType } from '../services/xtream/types';
import { saveFavorites, getFavorites } from '../services/xtream/client';

// ============================================
// Types
// ============================================

interface FavoritesState {
  // Data
  favorites: FavoritesMap;

  // Loading State
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  loadFavorites: (connectionId: string) => Promise<void>;
  addFavorite: (
    connectionId: string,
    favorite: Omit<Favorite, 'addedAt'>
  ) => Promise<void>;
  removeFavorite: (
    connectionId: string,
    streamId: number,
    streamType: StreamType
  ) => Promise<void>;
  isFavorite: (
    connectionId: string,
    streamId: number,
    streamType: StreamType
  ) => boolean;
  getFavoritesForConnection: (connectionId: string) => Favorite[];
  getFavoritesByType: (
    connectionId: string,
    streamType: StreamType
  ) => Favorite[];
  clearFavorites: (connectionId: string) => Promise<void>;
  syncFavorites: (connectionId: string) => Promise<void>;
}

// ============================================
// Store
// ============================================

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      // Initial State
      favorites: {},
      isLoading: false,
      isSyncing: false,

      // Load favorites from backend for a specific connection
      loadFavorites: async (connectionId) => {
        set({ isLoading: true });

        try {
          const favorites = await getFavorites(connectionId);

          set((state) => ({
            favorites: {
              ...state.favorites,
              [connectionId]: favorites,
            },
            isLoading: false,
          }));
        } catch (error) {
          console.error('[FavoritesStore] Failed to load favorites:', error);
          // Initialize empty array if load fails
          set((state) => ({
            favorites: {
              ...state.favorites,
              [connectionId]: state.favorites[connectionId] || [],
            },
            isLoading: false,
          }));
        }
      },

      // Add a favorite
      addFavorite: async (connectionId, favorite) => {
        const { favorites } = get();
        const connectionFavorites = favorites[connectionId] || [];

        // Check if already a favorite
        const exists = connectionFavorites.some(
          (f) =>
            f.streamId === favorite.streamId &&
            f.streamType === favorite.streamType
        );

        if (exists) {
          console.warn('[FavoritesStore] Item already in favorites');
          return;
        }

        const newFavorite: Favorite = {
          ...favorite,
          addedAt: Date.now(),
        };

        const updatedFavorites = [...connectionFavorites, newFavorite];

        set((state) => ({
          favorites: {
            ...state.favorites,
            [connectionId]: updatedFavorites,
          },
        }));

        // Sync with backend
        try {
          await saveFavorites(connectionId, updatedFavorites);
        } catch (error) {
          console.error('[FavoritesStore] Failed to sync favorites:', error);
        }
      },

      // Remove a favorite
      removeFavorite: async (connectionId, streamId, streamType) => {
        const { favorites } = get();
        const connectionFavorites = favorites[connectionId] || [];

        const updatedFavorites = connectionFavorites.filter(
          (f) =>
            !(f.streamId === streamId && f.streamType === streamType)
        );

        set((state) => ({
          favorites: {
            ...state.favorites,
            [connectionId]: updatedFavorites,
          },
        }));

        // Sync with backend
        try {
          await saveFavorites(connectionId, updatedFavorites);
        } catch (error) {
          console.error('[FavoritesStore] Failed to sync favorites:', error);
        }
      },

      // Check if an item is a favorite
      isFavorite: (connectionId, streamId, streamType) => {
        const { favorites } = get();
        const connectionFavorites = favorites[connectionId] || [];

        return connectionFavorites.some(
          (f) =>
            f.streamId === streamId && f.streamType === streamType
        );
      },

      // Get all favorites for a connection
      getFavoritesForConnection: (connectionId) => {
        const { favorites } = get();
        return favorites[connectionId] || [];
      },

      // Get favorites by stream type
      getFavoritesByType: (connectionId, streamType) => {
        const { favorites } = get();
        const connectionFavorites = favorites[connectionId] || [];

        return connectionFavorites.filter((f) => f.streamType === streamType);
      },

      // Clear all favorites for a connection
      clearFavorites: async (connectionId) => {
        set((state) => ({
          favorites: {
            ...state.favorites,
            [connectionId]: [],
          },
        }));

        // Sync with backend
        try {
          await saveFavorites(connectionId, []);
        } catch (error) {
          console.error('[FavoritesStore] Failed to clear favorites:', error);
        }
      },

      // Sync favorites with backend
      syncFavorites: async (connectionId) => {
        const { favorites } = get();
        const connectionFavorites = favorites[connectionId] || [];

        set({ isSyncing: true });

        try {
          await saveFavorites(connectionId, connectionFavorites);
        } catch (error) {
          console.error('[FavoritesStore] Failed to sync favorites:', error);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'nate-iptv-favorites',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favorites: state.favorites,
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const selectFavorites = (state: FavoritesState) => state.favorites;
export const selectIsLoading = (state: FavoritesState) => state.isLoading;
export const selectIsSyncing = (state: FavoritesState) => state.isSyncing;

// ============================================
// Hooks
// ============================================

/**
 * Hook to toggle favorite status
 */
export const useToggleFavorite = () => {
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);

  return async (
    connectionId: string,
    item: {
      streamId: number;
      streamType: StreamType;
      name: string;
      icon?: string;
      categoryId?: string;
    }
  ) => {
    const isCurrentlyFavorite = isFavorite(
      connectionId,
      item.streamId,
      item.streamType
    );

    if (isCurrentlyFavorite) {
      await removeFavorite(connectionId, item.streamId, item.streamType);
    } else {
      await addFavorite(connectionId, item);
    }

    return !isCurrentlyFavorite;
  };
};

/**
 * Hook to get favorite count
 */
export const useFavoriteCount = (connectionId: string) => {
  return useFavoritesStore(
    (state) => state.favorites[connectionId]?.length || 0
  );
};

/**
 * Hook to get favorite count by type
 */
export const useFavoriteCountByType = (
  connectionId: string,
  streamType: StreamType
) => {
  return useFavoritesStore(
    (state) =>
      state.favorites[connectionId]?.filter((f) => f.streamType === streamType)
        .length || 0
  );
};
