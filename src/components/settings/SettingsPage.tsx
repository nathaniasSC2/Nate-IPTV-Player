/**
 * SettingsPage Component
 * Main settings page with tabbed navigation
 */

import { useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { Tabs, TabList, Tab, TabPanel, TabPanels } from '@/components/common/Tabs';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConnectionSetup } from './ConnectionSetup';
import { ConnectionList } from './ConnectionList';
import { AccountInfo } from './AccountInfo';
import { Preferences } from './Preferences';
import type { XtreamConnection } from '@/services/xtream/types';
import {
  Wifi,
  User,
  Settings,
  Info,
  Github,
  ExternalLink,
  Heart,
  Code,
  MessageSquare,
  X,
} from 'lucide-react';
import {
  transitions,
  iconSizes,
  componentSpacing,
  cardStyles,
  focusStyles,
  borderRadius,
  shadows,
  typography,
} from '@/styles/theme';

// ============================================================================
// Types
// ============================================================================

export interface SettingsPageProps {
  /** Initial active tab */
  defaultTab?: string;
  /** Callback when settings page should close */
  onClose?: () => void;
  /** Additional class name */
  className?: string;
}

type SettingsView = 'list' | 'add' | 'edit';

// ============================================================================
// About Tab Component
// ============================================================================

function AboutTab() {
  const appVersion = '1.0.0';
  const buildDate = new Date().toLocaleDateString();

  return (
    <div className="space-y-6">
      {/* App Info Card */}
      <div className={cn(
        borderRadius.lg,
        'bg-gradient-to-br from-primary-600/20 to-dark-800',
        'border border-primary-500/20',
        componentSpacing.sectionPadding,
        'text-center'
      )}>
        <div className={cn(
          'w-20 h-20 mx-auto',
          borderRadius['2xl'],
          'bg-primary-600/20 flex items-center justify-center mb-4'
        )}>
          <svg
            viewBox="0 0 24 24"
            className={cn(iconSizes['2xl'], 'text-primary-400')}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <h2 className={cn(typography.h1, 'text-white')}>Nate IPTV Player</h2>
        <p className="text-gray-400 mt-2 leading-relaxed">Lightweight IPTV player with Xtream API support</p>
        <div className={cn('flex items-center justify-center mt-4 text-sm text-gray-500', componentSpacing.gapXl)}>
          <span>Version {appVersion}</span>
          <span>|</span>
          <span>Built {buildDate}</span>
        </div>
      </div>

      {/* Features */}
      <div className={cn(cardStyles.base, componentSpacing.sectionPadding)}>
        <h3 className={cn(typography.h3, 'text-white mb-4')}>Features</h3>
        <ul className="space-y-3">
          {[
            'Xtream Codes API support',
            'Live TV, Movies, and Series',
            'Electronic Program Guide (EPG)',
            'Multi-connection support',
            'HLS and TS streaming',
            'Cross-platform (Windows, macOS, Linux)',
            'Dark and Light themes',
            'Favorites and history',
          ].map((feature, index) => (
            <li key={index} className={cn('flex items-center text-sm text-gray-300 leading-snug', componentSpacing.gapLg)}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Links */}
      <div className={cn(cardStyles.base, componentSpacing.sectionPadding)}>
        <h3 className={cn(typography.h3, 'text-white mb-4')}>Links</h3>
        <div className={cn('grid grid-cols-2', componentSpacing.gapXl)}>
          <a
            href="https://github.com/nate-iptv/player"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center p-4',
              componentSpacing.gapLg,
              borderRadius.lg,
              'bg-dark-700',
              transitions.all,
              focusStyles.ring,
              'hover:bg-dark-600',
              'text-gray-300 hover:text-white'
            )}
          >
            <Github className={iconSizes.md} />
            <div className="flex-1">
              <div className="text-sm font-medium leading-snug">GitHub Repository</div>
              <div className="text-xs text-gray-500 leading-snug">View source code</div>
            </div>
            <ExternalLink className={cn(iconSizes.sm, 'text-gray-500')} />
          </a>

          <a
            href="https://github.com/nate-iptv/player/issues"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center p-4',
              componentSpacing.gapLg,
              borderRadius.lg,
              'bg-dark-700',
              transitions.all,
              focusStyles.ring,
              'hover:bg-dark-600',
              'text-gray-300 hover:text-white'
            )}
          >
            <MessageSquare className={iconSizes.md} />
            <div className="flex-1">
              <div className="text-sm font-medium leading-snug">Report Issue</div>
              <div className="text-xs text-gray-500 leading-snug">Found a bug?</div>
            </div>
            <ExternalLink className={cn(iconSizes.sm, 'text-gray-500')} />
          </a>
        </div>
      </div>

      {/* Credits */}
      <div className={cn(cardStyles.base, componentSpacing.sectionPadding)}>
        <h3 className={cn(typography.h3, 'text-white mb-4')}>Credits</h3>
        <div className="space-y-4">
          <div className={cn('flex items-start', componentSpacing.gapLg)}>
            <Code className={cn(iconSizes.md, 'text-primary-400 mt-0.5 flex-shrink-0')} />
            <div>
              <div className="text-sm font-medium text-white leading-snug">Built with</div>
              <div className="text-sm text-gray-400 mt-1 leading-relaxed">
                React, TypeScript, Tauri, Tailwind CSS, Zustand, React Query
              </div>
            </div>
          </div>
          <div className={cn('flex items-start', componentSpacing.gapLg)}>
            <Heart className={cn(iconSizes.md, 'text-red-400 mt-0.5 flex-shrink-0')} />
            <div>
              <div className="text-sm font-medium text-white leading-snug">Special Thanks</div>
              <div className="text-sm text-gray-400 mt-1 leading-relaxed">
                Open source community and all contributors
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* License */}
      <div className="text-center text-xs text-gray-500 leading-relaxed">
        <p>Nate IPTV Player is open source software.</p>
        <p className="mt-1">
          This application does not provide any content. Users are responsible for ensuring they
          have proper authorization to access any content through their IPTV provider.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Connections Tab Component
// ============================================================================

interface ConnectionsTabProps {
  view: SettingsView;
  editingConnection: XtreamConnection | null;
  onViewChange: (view: SettingsView) => void;
  onEditConnection: (connection: XtreamConnection | null) => void;
}

function ConnectionsTab({
  view,
  editingConnection,
  onViewChange,
  onEditConnection,
}: ConnectionsTabProps) {
  const handleAddNew = useCallback(() => {
    onEditConnection(null);
    onViewChange('add');
  }, [onEditConnection, onViewChange]);

  const handleEdit = useCallback(
    (connection: XtreamConnection) => {
      onEditConnection(connection);
      onViewChange('edit');
    },
    [onEditConnection, onViewChange]
  );

  const handleSave = useCallback(() => {
    onEditConnection(null);
    onViewChange('list');
  }, [onEditConnection, onViewChange]);

  const handleCancel = useCallback(() => {
    onEditConnection(null);
    onViewChange('list');
  }, [onEditConnection, onViewChange]);

  if (view === 'add' || view === 'edit') {
    return (
      <ConnectionSetup
        connection={editingConnection}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return <ConnectionList onAddNew={handleAddNew} onEdit={handleEdit} />;
}

// ============================================================================
// Main Component
// ============================================================================

export function SettingsPage({ defaultTab = 'connections', onClose, className }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [connectionView, setConnectionView] = useState<SettingsView>('list');
  const [editingConnection, setEditingConnection] = useState<XtreamConnection | null>(null);

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    // Reset connection view when switching tabs
    if (tab !== 'connections') {
      setConnectionView('list');
      setEditingConnection(null);
    }
  }, []);

  // Tab configuration
  const tabs = [
    {
      value: 'connections',
      label: 'Connections',
      icon: <Wifi className={iconSizes.sm} />,
    },
    {
      value: 'account',
      label: 'Account',
      icon: <User className={iconSizes.sm} />,
    },
    {
      value: 'preferences',
      label: 'Preferences',
      icon: <Settings className={iconSizes.sm} />,
    },
    {
      value: 'about',
      label: 'About',
      icon: <Info className={iconSizes.sm} />,
    },
  ];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between',
        componentSpacing.sectionPaddingX,
        componentSpacing.sectionPaddingY,
        'border-b border-dark-700'
      )}>
        <h1 className={cn(typography.h2, 'text-white')}>Settings</h1>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={cn('w-9 h-9', transitions.colors, focusStyles.ring)}
            aria-label="Close settings"
          >
            <X className={iconSizes.md} />
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
        <TabList variant="line" className={cn(componentSpacing.sectionPaddingX, 'flex-shrink-0')}>
          {tabs.map((tab) => (
            <Tab key={tab.value} value={tab.value} icon={tab.icon}>
              {tab.label}
            </Tab>
          ))}
        </TabList>

        <TabPanels className={cn(
          'flex-1 overflow-y-auto',
          componentSpacing.sectionPaddingX,
          'pb-6',
          'scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent'
        )}>
          <TabPanel value="connections">
            <ConnectionsTab
              view={connectionView}
              editingConnection={editingConnection}
              onViewChange={setConnectionView}
              onEditConnection={setEditingConnection}
            />
          </TabPanel>

          <TabPanel value="account">
            <AccountInfo />
          </TabPanel>

          <TabPanel value="preferences">
            <Preferences />
          </TabPanel>

          <TabPanel value="about">
            <AboutTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Settings Modal Component
// ============================================================================

export interface SettingsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Initial active tab */
  defaultTab?: string;
}

export function SettingsModal({ isOpen, onClose, defaultTab }: SettingsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showHeader={false}
      className={cn(
        'h-[80vh] max-h-[800px] flex flex-col',
        borderRadius.xl,
        shadows.modal
      )}
    >
      <SettingsPage defaultTab={defaultTab} onClose={onClose} className="flex-1 min-h-0" />
    </Modal>
  );
}

export default SettingsPage;
