/**
 * Header Component
 * ================
 * Top header bar with search, connection status,
 * notifications, and account dropdown menu.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Wifi,
  WifiOff,
  Settings,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useConnectionStore, selectIsConnected, selectAccountInfo } from '../../stores/connectionStore';
import { MobileMenuButton } from './Sidebar';

// ============================================
// Types
// ============================================

interface HeaderProps {
  onMenuClick: () => void;
}

// ============================================
// Search Bar Component
// ============================================

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isConnected = useConnectionStore(selectIsConnected);

  // Extract current search query from URL if on search page
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const q = params.get('q') || '';
      setQuery(q);
    }
  }, [location]);

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = () => {
    if (!query) {
      setIsExpanded(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && isConnected) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setIsExpanded(false);
      inputRef.current?.blur();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative flex items-center transition-all duration-300',
        isExpanded ? 'w-80' : 'w-64'
      )}
    >
      <Search
        className={cn(
          'absolute left-3 w-5 h-5 transition-colors',
          isExpanded ? 'text-primary-400' : 'text-dark-400'
        )}
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={isConnected ? 'Search channels, movies, series...' : 'Connect to search...'}
        disabled={!isConnected}
        className={cn(
          'w-full pl-10 pr-10 py-2 rounded-lg',
          'bg-dark-800 border border-dark-700',
          'text-white placeholder-dark-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'transition-all duration-200',
          !isConnected && 'cursor-not-allowed opacity-50'
        )}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 text-dark-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  );
};

// ============================================
// Connection Status Indicator
// ============================================

const ConnectionStatus: React.FC = () => {
  const isConnected = useConnectionStore(selectIsConnected);
  const isConnecting = useConnectionStore((state) => state.isConnecting);
  const activeConnection = useConnectionStore((state) => state.activeConnection);

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800">
        <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
        <span className="text-sm text-dark-300">Connecting...</span>
      </div>
    );
  }

  if (isConnected && activeConnection) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10">
        <Wifi className="w-4 h-4 text-green-400" />
        <span className="text-sm text-green-400 hidden sm:inline truncate max-w-[120px]">
          {activeConnection.name}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800">
      <WifiOff className="w-4 h-4 text-dark-400" />
      <span className="text-sm text-dark-400 hidden sm:inline">Not connected</span>
    </div>
  );
};

// ============================================
// Notifications Bell
// ============================================

const NotificationsBell: React.FC = () => {
  const [hasNotifications] = useState(false);

  return (
    <button
      className={cn(
        'relative p-2 rounded-lg text-dark-400',
        'hover:text-white hover:bg-dark-800',
        'transition-colors'
      )}
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5" />
      {hasNotifications && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500" />
      )}
    </button>
  );
};

// ============================================
// Account Dropdown
// ============================================

const AccountDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isConnected = useConnectionStore(selectIsConnected);
  const accountInfo = useConnectionStore(selectAccountInfo);
  const disconnect = useConnectionStore((state) => state.disconnect);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
    navigate('/setup');
  };

  const handleSettings = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'text-dark-300 hover:text-white hover:bg-dark-800',
          'transition-colors',
          isOpen && 'bg-dark-800 text-white'
        )}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-64',
            'bg-dark-800 border border-dark-700 rounded-lg',
            'shadow-xl shadow-black/30',
            'py-2 z-50',
            'animate-fade-in'
          )}
        >
          {/* Account Info */}
          {isConnected && accountInfo && (
            <div className="px-4 py-3 border-b border-dark-700">
              <p className="text-sm font-medium text-white">{accountInfo.username}</p>
              <p className="text-xs text-dark-400 mt-0.5">
                Status: <span className={accountInfo.status === 'Active' ? 'text-green-400' : 'text-red-400'}>
                  {accountInfo.status}
                </span>
              </p>
              {accountInfo.expirationDate && (
                <p className="text-xs text-dark-400 mt-0.5">
                  Expires: {accountInfo.expirationDate.toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            {isConnected && (
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-dark-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            )}

            {!isConnected && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/setup');
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-primary-400 hover:text-primary-300 hover:bg-dark-700 transition-colors"
              >
                <Wifi className="w-4 h-4" />
                <span>Connect</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Main Header Component
// ============================================

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <MobileMenuButton onClick={onMenuClick} />

          {/* Search Bar (hidden on small screens) */}
          <div className="hidden md:block">
            <SearchBar />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Search Button */}
          <button
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 md:hidden"
            onClick={() => {
              const isConnected = useConnectionStore.getState().activeConnection !== null;
              if (isConnected) {
                // Could open a mobile search modal here
              }
            }}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Connection Status */}
          <ConnectionStatus />

          {/* Notifications */}
          <NotificationsBell />

          {/* Account Dropdown */}
          <AccountDropdown />
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-4 pb-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
};

export default Header;
