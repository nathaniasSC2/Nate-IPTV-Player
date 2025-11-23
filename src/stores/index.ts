/**
 * Zustand Stores
 * Re-exports all stores for convenient imports
 */

// Connection Store
export {
  useConnectionStore,
  selectConnections,
  selectActiveConnection,
  selectAuthInfo,
  selectIsConnecting,
  selectConnectionError,
  selectIsConnected,
  selectAccountInfo,
} from './connectionStore';

// Player Store
export {
  usePlayerStore,
  selectCurrentStream,
  selectIsPlaying,
  selectIsFullscreen,
  selectVolume,
  selectIsMuted,
  selectIsLoading as selectPlayerIsLoading,
  selectIsBuffering,
  selectError as selectPlayerError,
  selectPlaybackState,
  selectRecentStreams,
  selectProgress,
  selectFormattedTime,
  subscribeToPlayerState,
  selectEffectiveVolume,
} from './playerStore';

// Favorites Store
export {
  useFavoritesStore,
  selectFavorites,
  selectIsLoading as selectFavoritesIsLoading,
  selectIsSyncing,
  useToggleFavorite,
  useFavoriteCount,
  useFavoriteCountByType,
} from './favoritesStore';

// Settings Store
export {
  useSettingsStore,
  selectTheme,
  selectLanguage,
  selectDefaultStreamFormat,
  selectPlayerSettings,
  selectUISettings,
  selectGeneralSettings,
  selectAutoPlay,
  selectShowEPG,
  initThemeListener,
  getComputedTheme,
} from './settingsStore';

// Re-export types
export type { Theme, Language } from './settingsStore';
