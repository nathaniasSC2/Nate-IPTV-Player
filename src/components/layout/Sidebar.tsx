/**
 * Sidebar Navigation Component
 * ============================
 * Main navigation sidebar with collapsible functionality,
 * active link highlighting, and mini player integration.
 *
 * Mobile Features:
 * - Swipe to close gesture
 * - Touch-friendly targets (min 44x44px)
 * - Full-screen drawer on mobile
 * - Improved touch scrolling
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Tv,
  Film,
  Clapperboard,
  Calendar,
  Star,
  History,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Play,
  Pause,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores/playerStore';
import { useConnectionStore } from '../../stores/connectionStore';
import {
  transitions,
  iconSizes,
  componentSpacing,
  focusStyles,
} from '../../styles/theme';

// ============================================
// Types
// ============================================

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiresConnection?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

// ============================================
// Navigation Items Configuration
// ============================================

const primaryNavItems: NavItem[] = [
  { to: '/live', icon: Tv, label: 'Live TV', requiresConnection: true },
  { to: '/movies', icon: Film, label: 'Movies', requiresConnection: true },
  { to: '/series', icon: Clapperboard, label: 'Series', requiresConnection: true },
  { to: '/guide', icon: Calendar, label: 'TV Guide', requiresConnection: true },
];

const secondaryNavItems: NavItem[] = [
  { to: '/favorites', icon: Star, label: 'Favorites', requiresConnection: true },
  { to: '/history', icon: History, label: 'History', requiresConnection: true },
  { to: '/search', icon: Search, label: 'Search', requiresConnection: true },
];

const bottomNavItems: NavItem[] = [
  { to: '/settings', icon: Settings, label: 'Settings', requiresConnection: false },
];

// ============================================
// NavLink Component
// ============================================

interface NavLinkItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isConnected: boolean;
  onClick?: () => void;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({
  item,
  isCollapsed,
  isConnected,
  onClick,
}) => {
  const location = useLocation();
  const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  const isDisabled = item.requiresConnection && !isConnected;

  if (isDisabled) {
    return (
      <div
        className={cn(
          'flex items-center',
          componentSpacing.gapLg,
          'rounded-lg',
          'text-dark-500 cursor-not-allowed',
          'select-none',
          // Mobile: Larger touch targets (min 44px height)
          'min-h-[44px] px-3 py-2',
          // Desktop collapsed: Centered icon
          isCollapsed && 'lg:justify-center lg:px-2'
        )}
        title={isCollapsed ? `${item.label} (requires connection)` : undefined}
      >
        <item.icon className={cn(iconSizes.md, 'flex-shrink-0')} />
        {!isCollapsed && (
          <span className="truncate text-sm">{item.label}</span>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={cn(
        'flex items-center',
        componentSpacing.gapLg,
        'rounded-lg',
        transitions.all,
        focusStyles.ring,
        'hover:bg-dark-800 hover:text-white',
        'active:bg-dark-700',
        'tap-highlight-transparent',
        // Mobile: Larger touch targets (min 44px height)
        'min-h-[44px] px-3 py-2',
        // Active state
        isActive
          ? 'bg-primary-500/10 text-primary-400 font-medium'
          : 'text-dark-300',
        // Desktop collapsed: Centered icon
        isCollapsed && 'lg:justify-center lg:px-2'
      )}
      title={isCollapsed ? item.label : undefined}
    >
      <item.icon
        className={cn(
          iconSizes.md,
          'flex-shrink-0',
          transitions.colors,
          isActive && 'text-primary-400'
        )}
      />
      {!isCollapsed && (
        <span className="truncate text-sm">{item.label}</span>
      )}
    </NavLink>
  );
};

// ============================================
// Mini Player Component
// ============================================

const SidebarMiniPlayer: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const currentStream = usePlayerStore((state) => state.currentStream);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const pause = usePlayerStore((state) => state.pause);
  const resume = usePlayerStore((state) => state.resume);

  if (!currentStream) {
    return null;
  }

  const handleTogglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  if (isCollapsed) {
    return (
      <div className="p-2">
        <button
          onClick={handleTogglePlay}
          className={cn(
            // Minimum 44x44px touch target
            'w-11 h-11 rounded-lg flex items-center justify-center',
            'bg-primary-500/10 text-primary-400',
            transitions.colors,
            'hover:bg-primary-500/20 active:bg-primary-500/30',
            focusStyles.ring,
            'tap-highlight-transparent'
          )}
          title={currentStream.name}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className={iconSizes.md} />
          ) : (
            <Play className={iconSizes.md} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={cn('p-3 border-t border-dark-800')}>
      <div className={cn('flex items-center', componentSpacing.gapLg)}>
        {/* Stream icon/thumbnail */}
        <div className={cn(
          'w-11 h-11',
          'rounded-lg bg-dark-800 flex items-center justify-center',
          'flex-shrink-0 overflow-hidden'
        )}>
          {currentStream.icon ? (
            <img
              src={currentStream.icon}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <Tv className={cn(iconSizes.md, 'text-dark-400')} />
          )}
        </div>

        {/* Stream info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate leading-snug">
            {currentStream.name}
          </p>
          <p className="text-xs text-dark-400 capitalize leading-snug">
            {currentStream.type === 'live' ? 'Live TV' : currentStream.type}
          </p>
        </div>

        {/* Play/Pause button - min 44x44px */}
        <button
          onClick={handleTogglePlay}
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center',
            'bg-primary-500 text-white',
            transitions.colors,
            'hover:bg-primary-600 active:bg-primary-700',
            focusStyles.ring,
            'tap-highlight-transparent'
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className={iconSizes.md} />
          ) : (
            <Play className={cn(iconSizes.md, 'ml-0.5')} />
          )}
        </button>
      </div>
    </div>
  );
};

// ============================================
// Logo Component
// ============================================

const SidebarLogo: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  return (
    <NavLink
      to="/"
      className={cn(
        'flex items-center',
        componentSpacing.gapLg,
        'px-3 py-4 mb-2',
        transitions.all,
        focusStyles.ring,
        'rounded-lg',
        'tap-highlight-transparent'
      )}
    >
      <div className={cn(
        iconSizes['2xl'],
        'rounded-xl bg-gradient-to-br from-primary-500 to-primary-700',
        'flex items-center justify-center flex-shrink-0',
        'shadow-lg shadow-primary-900/30'
      )}>
        <Tv className={cn(iconSizes.md, 'text-white')} />
      </div>
      {!isCollapsed && (
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white leading-tight">Nate</span>
          <span className="text-xs text-dark-400 leading-tight">IPTV Player</span>
        </div>
      )}
    </NavLink>
  );
};

// ============================================
// Main Sidebar Component
// ============================================

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onClose,
}) => {
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const authInfo = useConnectionStore((state) => state.authInfo);
  const isConnected = activeConnection !== null && authInfo !== null;

  // Ref for swipe gesture
  const sidebarRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Swipe to close gesture handler
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current) return;
    touchCurrentX.current = e.touches[0].clientX;

    // Optional: Add visual feedback during swipe
    const sidebar = sidebarRef.current;
    if (sidebar) {
      const deltaX = touchCurrentX.current - touchStartX.current;
      if (deltaX < 0) {
        // Only allow swiping left (to close)
        sidebar.style.transform = `translateX(${Math.max(deltaX, -100)}px)`;
        sidebar.style.transition = 'none';
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const sidebar = sidebarRef.current;
    if (sidebar) {
      // Reset transform
      sidebar.style.transform = '';
      sidebar.style.transition = '';
    }

    const deltaX = touchCurrentX.current - touchStartX.current;
    const threshold = -50; // Swipe 50px left to close

    if (deltaX < threshold) {
      onClose();
    }
  }, [onClose]);

  // Attach touch event listeners
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar || !isOpen) return;

    sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: true });
    sidebar.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchmove', handleTouchMove);
      sidebar.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className={cn(
            'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden',
            'transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-dark-900 border-r border-dark-800',
          'flex flex-col',
          'transition-transform duration-300 ease-out',
          // Desktop: always visible, can be collapsed
          'lg:translate-x-0',
          isCollapsed ? 'lg:w-16' : 'lg:w-64',
          // Mobile: full-width drawer (up to 280px)
          'w-[280px] max-w-[85vw]',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Touch optimization
          'touch-pan-y'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Mobile Close Button - Larger touch target */}
        <button
          onClick={onClose}
          className={cn(
            'absolute top-3 right-3',
            // Minimum 44x44px touch target
            'w-11 h-11 rounded-lg',
            'flex items-center justify-center',
            'text-dark-400 hover:text-white hover:bg-dark-800',
            'active:bg-dark-700',
            transitions.colors,
            focusStyles.ring,
            'tap-highlight-transparent',
            'lg:hidden'
          )}
          aria-label="Close menu"
        >
          <X className={iconSizes.md} />
        </button>

        {/* Logo */}
        <SidebarLogo isCollapsed={isCollapsed} />

        {/* Primary Navigation */}
        <nav
          className={cn(
            'flex-1 px-3 space-y-1 overflow-y-auto',
            // Improved touch scrolling
            'overscroll-contain',
            'scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent'
          )}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Primary Nav */}
          <div className="space-y-1">
            {primaryNavItems.map((item) => (
              <NavLinkItem
                key={item.to}
                item={item}
                isCollapsed={isCollapsed}
                isConnected={isConnected}
                onClick={onClose}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-dark-800" />

          {/* Secondary Nav */}
          <div className="space-y-1">
            {secondaryNavItems.map((item) => (
              <NavLinkItem
                key={item.to}
                item={item}
                isCollapsed={isCollapsed}
                isConnected={isConnected}
                onClick={onClose}
              />
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto">
          {/* Settings */}
          <div className="px-3 pb-2">
            {bottomNavItems.map((item) => (
              <NavLinkItem
                key={item.to}
                item={item}
                isCollapsed={isCollapsed}
                isConnected={isConnected}
                onClick={onClose}
              />
            ))}
          </div>

          {/* Mini Player */}
          <SidebarMiniPlayer isCollapsed={isCollapsed} />

          {/* Collapse Toggle (Desktop only) */}
          <div className="hidden lg:block p-3 border-t border-dark-800">
            <button
              onClick={onToggleCollapse}
              className={cn(
                'w-full flex items-center justify-center',
                componentSpacing.gapMd,
                // Minimum 44px height touch target
                'min-h-[44px] px-3 py-2 rounded-lg',
                'text-dark-400 hover:text-white hover:bg-dark-800',
                'active:bg-dark-700',
                transitions.all,
                focusStyles.ring
              )}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className={iconSizes.md} />
              ) : (
                <>
                  <ChevronLeft className={iconSizes.md} />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

// ============================================
// Mobile Menu Button Component
// ============================================

export const MobileMenuButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Minimum 44x44px touch target
        'w-11 h-11 rounded-lg',
        'flex items-center justify-center',
        'text-dark-400 hover:text-white hover:bg-dark-800',
        'active:bg-dark-700',
        transitions.colors,
        focusStyles.ring,
        'tap-highlight-transparent',
        'lg:hidden'
      )}
      aria-label="Open menu"
    >
      <Menu className={iconSizes.lg} />
    </button>
  );
};

export default Sidebar;
