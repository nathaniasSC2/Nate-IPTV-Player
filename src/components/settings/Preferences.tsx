/**
 * Preferences Component
 * Application settings and preferences management
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/Modal';
import { useSettingsStore, type Theme, type Language } from '@/stores/settingsStore';
import type { StreamFormat } from '@/services/xtream/types';
import {
  Sun,
  Moon,
  Monitor,
  Trash2,
  RotateCcw,
  Check,
  Info,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface PreferencesProps {
  /** Additional class name */
  className?: string;
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

interface OptionButtonProps {
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  description?: string;
  disabled?: boolean;
}

// ============================================================================
// Setting Row Component
// ============================================================================

function SettingRow({ label, description, children, className }: SettingRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-4 border-b border-dark-700 last:border-b-0',
        className
      )}
    >
      <div className="flex-1 pr-4">
        <div className="text-sm font-medium text-white">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ============================================================================
// Toggle Switch Component
// ============================================================================

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ isOn, onToggle, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      disabled={disabled}
      onClick={() => onToggle(!isOn)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900',
        isOn ? 'bg-primary-600' : 'bg-dark-600',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
          isOn ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// ============================================================================
// Option Button Component
// ============================================================================

function OptionButton({
  isSelected,
  onClick,
  icon,
  label,
  description,
  disabled,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900',
        isSelected
          ? 'bg-primary-600/20 border-2 border-primary-500 text-primary-400'
          : 'bg-dark-700 border-2 border-transparent text-gray-400 hover:bg-dark-600 hover:text-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      <span className="text-xs font-medium">{label}</span>
      {description && <span className="text-xs text-gray-500">{description}</span>}
    </button>
  );
}

// ============================================================================
// Select Component
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
}

function Select({ value, onChange, options, disabled }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        'hover:border-dark-500 transition-colors duration-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// ============================================================================
// Section Component
// ============================================================================

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function Section({ title, description, children, className }: SectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>
      <div className="bg-dark-800 rounded-lg border border-dark-700 px-4">{children}</div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const themeOptions: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun className="w-5 h-5" />, label: 'Light' },
  { value: 'dark', icon: <Moon className="w-5 h-5" />, label: 'Dark' },
  { value: 'system', icon: <Monitor className="w-5 h-5" />, label: 'System' },
];

const formatOptions: { value: StreamFormat; label: string; description: string }[] = [
  { value: 'm3u8', label: 'HLS (m3u8)', description: 'Recommended for most users' },
  { value: 'ts', label: 'TS', description: 'Lower latency' },
];

const languageOptions: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol' },
  { value: 'fr', label: 'Francais' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Portugues' },
  { value: 'it', label: 'Italiano' },
];

export function Preferences({ className }: PreferencesProps) {
  const {
    theme,
    language,
    defaultStreamFormat,
    player,
    ui,
    setTheme,
    setLanguage,
    setDefaultStreamFormat,
    setAutoPlay,
    setShowEPG,
    setCompactMode,
    resetSettings,
  } = useSettingsStore();

  // Modal states
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Clear cache handler
  const handleClearCache = useCallback(async () => {
    setIsClearingCache(true);
    try {
      // Clear localStorage cache (keep settings)
      const settingsKey = 'nate-iptv-settings';
      const connectionsKey = 'nate-iptv-connections';
      const settingsData = localStorage.getItem(settingsKey);
      const connectionsData = localStorage.getItem(connectionsKey);

      // Clear all local storage
      localStorage.clear();

      // Restore settings and connections
      if (settingsData) localStorage.setItem(settingsKey, settingsData);
      if (connectionsData) localStorage.setItem(connectionsKey, connectionsData);

      // Clear session storage
      sessionStorage.clear();

      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearingCache(false);
      setShowClearCacheModal(false);
    }
  }, []);

  // Reset settings handler
  const handleResetSettings = useCallback(() => {
    resetSettings();
    setShowResetModal(false);
  }, [resetSettings]);

  return (
    <div className={cn('space-y-8', className)}>
      {/* Theme Section */}
      <Section title="Appearance" description="Customize how the app looks">
        <SettingRow label="Theme" description="Choose your preferred color theme">
          <div className="flex gap-2">
            {themeOptions.map((option) => (
              <OptionButton
                key={option.value}
                isSelected={theme === option.value}
                onClick={() => setTheme(option.value)}
                icon={option.icon}
                label={option.label}
              />
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Compact Mode" description="Show more content in less space">
          <ToggleSwitch isOn={ui.compactMode} onToggle={setCompactMode} />
        </SettingRow>
      </Section>

      {/* Playback Section */}
      <Section title="Playback" description="Configure playback preferences">
        <SettingRow
          label="Default Stream Format"
          description="Preferred format for live streams"
        >
          <div className="flex gap-2">
            {formatOptions.map((option) => (
              <OptionButton
                key={option.value}
                isSelected={defaultStreamFormat === option.value}
                onClick={() => setDefaultStreamFormat(option.value)}
                label={option.label}
              />
            ))}
          </div>
        </SettingRow>

        <SettingRow
          label="Auto-play on Channel Select"
          description="Automatically start playing when selecting a channel"
        >
          <ToggleSwitch isOn={player.autoPlay} onToggle={setAutoPlay} />
        </SettingRow>
      </Section>

      {/* Display Section */}
      <Section title="Display" description="Channel list display options">
        <SettingRow
          label="Show EPG on Channel List"
          description="Display current program info in channel cards"
        >
          <ToggleSwitch isOn={ui.showEPG} onToggle={setShowEPG} />
        </SettingRow>
      </Section>

      {/* Language Section */}
      <Section title="Language" description="Choose your preferred language">
        <SettingRow label="Interface Language" description="Language for menus and buttons">
          <Select
            value={language}
            onChange={(value) => setLanguage(value as Language)}
            options={languageOptions}
          />
        </SettingRow>
      </Section>

      {/* Data Management Section */}
      <Section title="Data Management" description="Manage app data and cache">
        <SettingRow
          label="Clear Cache"
          description="Remove cached data to free up space"
        >
          <div className="flex items-center gap-2">
            {cacheCleared && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check className="w-3 h-3" />
                Cleared
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearCacheModal(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Clear Cache
            </Button>
          </div>
        </SettingRow>

        <SettingRow
          label="Reset to Defaults"
          description="Restore all settings to their default values"
        >
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowResetModal(true)}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset Settings
          </Button>
        </SettingRow>
      </Section>

      {/* Info Section */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-dark-800 border border-dark-700">
        <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-400">
          <p>
            Settings are automatically saved and will persist across sessions. Some settings may
            require a restart to take effect.
          </p>
        </div>
      </div>

      {/* Clear Cache Modal */}
      <ConfirmModal
        isOpen={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        onConfirm={handleClearCache}
        title="Clear Cache"
        message="This will remove all cached data including thumbnails and temporary files. Your connections and settings will be preserved. Continue?"
        confirmText="Clear Cache"
        cancelText="Cancel"
        variant="primary"
        isLoading={isClearingCache}
      />

      {/* Reset Settings Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetSettings}
        title="Reset Settings"
        message="This will reset all preferences to their default values. Your saved connections will not be affected. This action cannot be undone."
        confirmText="Reset Settings"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default Preferences;
