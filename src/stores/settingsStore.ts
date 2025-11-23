/**
 * Settings Store
 * Manages application settings with localStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StreamFormat } from '../services/xtream/types';

// ============================================
// Types
// ============================================

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it';

interface PlayerSettings {
  defaultVolume: number;
  autoPlay: boolean;
  hardwareAcceleration: boolean;
  preferHLS: boolean;
  bufferLength: number; // in seconds
}

interface UISettings {
  showEPG: boolean;
  showChannelNumbers: boolean;
  compactMode: boolean;
  showThumbnails: boolean;
  channelsPerPage: number;
}

interface GeneralSettings {
  startMinimized: boolean;
  minimizeToTray: boolean;
  checkUpdates: boolean;
  confirmExit: boolean;
}

interface SettingsState {
  // Theme & Language
  theme: Theme;
  language: Language;

  // Stream Settings
  defaultStreamFormat: StreamFormat;

  // Player Settings
  player: PlayerSettings;

  // UI Settings
  ui: UISettings;

  // General Settings
  general: GeneralSettings;

  // Actions
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setDefaultStreamFormat: (format: StreamFormat) => void;

  // Player Settings Actions
  setAutoPlay: (autoPlay: boolean) => void;
  setDefaultVolume: (volume: number) => void;
  setHardwareAcceleration: (enabled: boolean) => void;
  setPreferHLS: (prefer: boolean) => void;
  setBufferLength: (length: number) => void;
  updatePlayerSettings: (settings: Partial<PlayerSettings>) => void;

  // UI Settings Actions
  setShowEPG: (show: boolean) => void;
  setShowChannelNumbers: (show: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  setShowThumbnails: (show: boolean) => void;
  setChannelsPerPage: (count: number) => void;
  updateUISettings: (settings: Partial<UISettings>) => void;

  // General Settings Actions
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;

  // Reset
  resetSettings: () => void;
}

// ============================================
// Default Values
// ============================================

const defaultPlayerSettings: PlayerSettings = {
  defaultVolume: 0.8,
  autoPlay: true,
  hardwareAcceleration: true,
  preferHLS: true,
  bufferLength: 30,
};

const defaultUISettings: UISettings = {
  showEPG: true,
  showChannelNumbers: true,
  compactMode: false,
  showThumbnails: true,
  channelsPerPage: 50,
};

const defaultGeneralSettings: GeneralSettings = {
  startMinimized: false,
  minimizeToTray: true,
  checkUpdates: true,
  confirmExit: false,
};

const defaultSettings = {
  theme: 'system' as Theme,
  language: 'en' as Language,
  defaultStreamFormat: 'm3u8' as StreamFormat,
  player: defaultPlayerSettings,
  ui: defaultUISettings,
  general: defaultGeneralSettings,
};

// ============================================
// Store
// ============================================

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial State
      ...defaultSettings,

      // Theme & Language
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        applyTheme(theme);
      },

      setLanguage: (language) => {
        set({ language });
      },

      setDefaultStreamFormat: (format) => {
        set({ defaultStreamFormat: format });
      },

      // Player Settings
      setAutoPlay: (autoPlay) => {
        set((state) => ({
          player: { ...state.player, autoPlay },
        }));
      },

      setDefaultVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set((state) => ({
          player: { ...state.player, defaultVolume: clampedVolume },
        }));
      },

      setHardwareAcceleration: (enabled) => {
        set((state) => ({
          player: { ...state.player, hardwareAcceleration: enabled },
        }));
      },

      setPreferHLS: (prefer) => {
        set((state) => ({
          player: { ...state.player, preferHLS: prefer },
        }));
      },

      setBufferLength: (length) => {
        set((state) => ({
          player: { ...state.player, bufferLength: length },
        }));
      },

      updatePlayerSettings: (settings) => {
        set((state) => ({
          player: { ...state.player, ...settings },
        }));
      },

      // UI Settings
      setShowEPG: (show) => {
        set((state) => ({
          ui: { ...state.ui, showEPG: show },
        }));
      },

      setShowChannelNumbers: (show) => {
        set((state) => ({
          ui: { ...state.ui, showChannelNumbers: show },
        }));
      },

      setCompactMode: (compact) => {
        set((state) => ({
          ui: { ...state.ui, compactMode: compact },
        }));
      },

      setShowThumbnails: (show) => {
        set((state) => ({
          ui: { ...state.ui, showThumbnails: show },
        }));
      },

      setChannelsPerPage: (count) => {
        set((state) => ({
          ui: { ...state.ui, channelsPerPage: count },
        }));
      },

      updateUISettings: (settings) => {
        set((state) => ({
          ui: { ...state.ui, ...settings },
        }));
      },

      // General Settings
      updateGeneralSettings: (settings) => {
        set((state) => ({
          general: { ...state.general, ...settings },
        }));
      },

      // Reset all settings
      resetSettings: () => {
        set(defaultSettings);
        applyTheme('system');
      },
    }),
    {
      name: 'nate-iptv-settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// ============================================
// Theme Utilities
// ============================================

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

/**
 * Listen for system theme changes
 */
export function initThemeListener(): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    const { theme } = useSettingsStore.getState();
    if (theme === 'system') {
      document.documentElement.classList.toggle('dark', e.matches);
    }
  };

  mediaQuery.addEventListener('change', handler);

  // Apply initial theme
  applyTheme(useSettingsStore.getState().theme);

  return () => mediaQuery.removeEventListener('change', handler);
}

// ============================================
// Selectors
// ============================================

export const selectTheme = (state: SettingsState) => state.theme;
export const selectLanguage = (state: SettingsState) => state.language;
export const selectDefaultStreamFormat = (state: SettingsState) => state.defaultStreamFormat;
export const selectPlayerSettings = (state: SettingsState) => state.player;
export const selectUISettings = (state: SettingsState) => state.ui;
export const selectGeneralSettings = (state: SettingsState) => state.general;

export const selectAutoPlay = (state: SettingsState) => state.player.autoPlay;
export const selectShowEPG = (state: SettingsState) => state.ui.showEPG;

// ============================================
// Computed Theme
// ============================================

/**
 * Get the actual theme (resolving 'system' to 'light' or 'dark')
 */
export const getComputedTheme = (): 'light' | 'dark' => {
  const { theme } = useSettingsStore.getState();

  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  return theme;
};
