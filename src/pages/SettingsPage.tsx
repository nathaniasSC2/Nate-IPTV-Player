/**
 * Settings Page
 * =============
 * Application settings including theme, player,
 * UI preferences, and connection management.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Play,
  Layout,
  Tv,
  Server,
  RotateCcw,
  ChevronRight,
  Check,
  LogOut,
  Info,
} from 'lucide-react';
import { cn } from '../utils/cn';
import {
  useSettingsStore,
  Theme,
  Language,
} from '../stores/settingsStore';
import { useConnectionStore, selectIsConnected } from '../stores/connectionStore';
import { ConfirmModal, Button } from '../components/common';
import type { StreamFormat } from '../services/xtream/types';

// ============================================
// Types
// ============================================

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

interface SettingsItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

// ============================================
// Settings Section Component
// ============================================

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  children,
}) => {
  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-dark-800">
        <span className="text-primary-400">{icon}</span>
        <div>
          <h2 className="font-semibold text-white">{title}</h2>
          {description && (
            <p className="text-sm text-dark-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-dark-800">{children}</div>
    </div>
  );
};

// ============================================
// Settings Item Component
// ============================================

const SettingsItem: React.FC<SettingsItemProps> = ({
  label,
  description,
  children,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-white font-medium">{label}</p>
        {description && (
          <p className="text-sm text-dark-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
};

// ============================================
// Toggle Switch Component
// ============================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900',
        checked ? 'bg-primary-500' : 'bg-dark-600',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
};

// ============================================
// Select Component
// ============================================

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg min-w-[140px]',
          'bg-dark-800 border border-dark-700',
          'text-white hover:border-dark-600',
          'transition-colors'
        )}
      >
        {selectedOption?.icon}
        <span className="flex-1 text-left">{selectedOption?.label}</span>
        <ChevronRight
          className={cn(
            'w-4 h-4 text-dark-400 transition-transform',
            isOpen && 'rotate-90'
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 text-left text-sm',
                  'hover:bg-dark-700 transition-colors',
                  value === option.value
                    ? 'text-primary-400'
                    : 'text-dark-300 hover:text-white'
                )}
              >
                {option.icon}
                <span className="flex-1">{option.label}</span>
                {value === option.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// Slider Component
// ============================================

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
}) => {
  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          'flex-1 h-2 rounded-full appearance-none cursor-pointer',
          'bg-dark-700',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-primary-500',
          '[&::-webkit-slider-thumb]:cursor-pointer'
        )}
      />
      <span className="text-sm text-dark-300 min-w-[50px] text-right">
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
  );
};

// ============================================
// Main Settings Page Component
// ============================================

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  // Settings store
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const defaultStreamFormat = useSettingsStore((state) => state.defaultStreamFormat);
  const player = useSettingsStore((state) => state.player);
  const ui = useSettingsStore((state) => state.ui);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setDefaultStreamFormat = useSettingsStore((state) => state.setDefaultStreamFormat);
  const updatePlayerSettings = useSettingsStore((state) => state.updatePlayerSettings);
  const updateUISettings = useSettingsStore((state) => state.updateUISettings);
  const resetSettings = useSettingsStore((state) => state.resetSettings);

  // Connection store
  const isConnected = useConnectionStore(selectIsConnected);
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const disconnect = useConnectionStore((state) => state.disconnect);

  // State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Theme options
  const themeOptions: SelectOption[] = [
    { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
  ];

  // Language options
  const languageOptions: SelectOption[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Espanol' },
    { value: 'fr', label: 'Francais' },
    { value: 'de', label: 'Deutsch' },
    { value: 'pt', label: 'Portugues' },
    { value: 'it', label: 'Italiano' },
  ];

  // Stream format options
  const formatOptions: SelectOption[] = [
    { value: 'm3u8', label: 'HLS (m3u8)' },
    { value: 'ts', label: 'MPEG-TS' },
    { value: 'rtmp', label: 'RTMP' },
  ];

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    disconnect();
    setShowDisconnectConfirm(false);
    navigate('/setup');
  }, [disconnect, navigate]);

  // Handle reset
  const handleReset = useCallback(() => {
    resetSettings();
    setShowResetConfirm(false);
  }, [resetSettings]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-dark-400">Configure your preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <SettingsSection
          title="Appearance"
          description="Customize the look and feel"
          icon={<Moon className="w-5 h-5" />}
        >
          <SettingsItem
            label="Theme"
            description="Choose your preferred color scheme"
          >
            <Select
              value={theme}
              options={themeOptions}
              onChange={(v) => setTheme(v as Theme)}
            />
          </SettingsItem>

          <SettingsItem
            label="Language"
            description="Select your preferred language"
          >
            <Select
              value={language}
              options={languageOptions}
              onChange={(v) => setLanguage(v as Language)}
            />
          </SettingsItem>
        </SettingsSection>

        {/* Player Section */}
        <SettingsSection
          title="Player"
          description="Video playback settings"
          icon={<Play className="w-5 h-5" />}
        >
          <SettingsItem
            label="Default Volume"
            description="Initial volume level when starting playback"
          >
            <Slider
              value={player.defaultVolume}
              min={0}
              max={1}
              step={0.1}
              onChange={(v) => updatePlayerSettings({ defaultVolume: v })}
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
          </SettingsItem>

          <SettingsItem
            label="Auto Play"
            description="Automatically start playback when selecting content"
          >
            <ToggleSwitch
              checked={player.autoPlay}
              onChange={(v) => updatePlayerSettings({ autoPlay: v })}
            />
          </SettingsItem>

          <SettingsItem
            label="Hardware Acceleration"
            description="Use GPU for video decoding when available"
          >
            <ToggleSwitch
              checked={player.hardwareAcceleration}
              onChange={(v) => updatePlayerSettings({ hardwareAcceleration: v })}
            />
          </SettingsItem>

          <SettingsItem
            label="Prefer HLS"
            description="Use HLS streaming format when available"
          >
            <ToggleSwitch
              checked={player.preferHLS}
              onChange={(v) => updatePlayerSettings({ preferHLS: v })}
            />
          </SettingsItem>

          <SettingsItem
            label="Buffer Length"
            description="Amount of video to buffer (in seconds)"
          >
            <Slider
              value={player.bufferLength}
              min={10}
              max={60}
              step={5}
              onChange={(v) => updatePlayerSettings({ bufferLength: v })}
              formatValue={(v) => `${v}s`}
            />
          </SettingsItem>
        </SettingsSection>

        {/* Stream Section */}
        <SettingsSection
          title="Stream"
          description="Streaming preferences"
          icon={<Tv className="w-5 h-5" />}
        >
          <SettingsItem
            label="Default Format"
            description="Preferred stream format for playback"
          >
            <Select
              value={defaultStreamFormat}
              options={formatOptions}
              onChange={(v) => setDefaultStreamFormat(v as StreamFormat)}
            />
          </SettingsItem>
        </SettingsSection>

        {/* UI Section */}
        <SettingsSection
          title="Interface"
          description="User interface preferences"
          icon={<Layout className="w-5 h-5" />}
        >
          <SettingsItem
            label="Show EPG"
            description="Display program guide information on channels"
          >
            <ToggleSwitch
              checked={ui.showEPG}
              onChange={(v) => updateUISettings({ showEPG: v })}
            />
          </SettingsItem>

          <SettingsItem
            label="Show Channel Numbers"
            description="Display channel numbers in the channel list"
          >
            <ToggleSwitch
              checked={ui.showChannelNumbers}
              onChange={(v) => updateUISettings({ showChannelNumbers: v })}
            />
          </SettingsItem>

          <SettingsItem
            label="Compact Mode"
            description="Use a more compact layout for lists"
          >
            <ToggleSwitch
              checked={ui.compactMode}
              onChange={(v) => updateUISettings({ compactMode: v })}
            />
          </SettingsItem>

          <SettingsItem
            label="Show Thumbnails"
            description="Display thumbnails for channels and content"
          >
            <ToggleSwitch
              checked={ui.showThumbnails}
              onChange={(v) => updateUISettings({ showThumbnails: v })}
            />
          </SettingsItem>
        </SettingsSection>

        {/* Connection Section */}
        {isConnected && activeConnection && (
          <SettingsSection
            title="Connection"
            description="Current connection settings"
            icon={<Server className="w-5 h-5" />}
          >
            <SettingsItem
              label="Connected to"
              description={activeConnection.serverUrl}
            >
              <span className="text-sm text-green-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Connected
              </span>
            </SettingsItem>

            <SettingsItem
              label="Username"
              description="Your account username"
            >
              <span className="text-sm text-dark-300">
                {activeConnection.username}
              </span>
            </SettingsItem>

            <div className="px-6 py-4">
              <Button
                variant="secondary"
                onClick={() => setShowDisconnectConfirm(true)}
                className="w-full justify-center text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
          </SettingsSection>
        )}

        {/* Danger Zone */}
        <SettingsSection
          title="Reset"
          description="Reset application settings"
          icon={<RotateCcw className="w-5 h-5" />}
        >
          <div className="px-6 py-4">
            <Button
              variant="secondary"
              onClick={() => setShowResetConfirm(true)}
              className="w-full justify-center"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All Settings
            </Button>
            <p className="text-xs text-dark-500 mt-2 text-center">
              This will reset all settings to their default values
            </p>
          </div>
        </SettingsSection>

        {/* About Section */}
        <SettingsSection
          title="About"
          description="Application information"
          icon={<Info className="w-5 h-5" />}
        >
          <SettingsItem label="Version" description="Current application version">
            <span className="text-sm text-dark-300">1.0.0</span>
          </SettingsItem>

          <SettingsItem label="Build" description="Build information">
            <span className="text-sm text-dark-300">Production</span>
          </SettingsItem>
        </SettingsSection>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Reset Settings"
        message="Are you sure you want to reset all settings to their default values? This cannot be undone."
        confirmText="Reset"
        variant="danger"
      />

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        onConfirm={handleDisconnect}
        title="Disconnect"
        message="Are you sure you want to disconnect from the current server?"
        confirmText="Disconnect"
        variant="danger"
      />
    </div>
  );
};

export default SettingsPage;
