/**
 * MobileNav Component
 * ===================
 * Bottom navigation bar for mobile devices with 5 main tabs.
 * Hidden when player is fullscreen or on desktop.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Tv, Film, Clapperboard, Calendar, Menu } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores/playerStore';
import { useConnectionStore } from '../../stores/connectionStore';

// ============================================
// Types
// ============================================

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiresConnection?: boolean;
}

interface MobileNavProps {
  onMenuClick: () => void;
  className?: string;
}

// ============================================
// Navigation Items
// ============================================

const navItems: NavItem[] = [
  { to: '/live', icon: Tv, label: 'Live', requiresConnection: true },
  { to: '/movies', icon: Film, label: 'Movies', requiresConnection: true },
  { to: '/series', icon: Clapperboard, label: 'Series', requiresConnection: true },
  { to: '/guide', icon: Calendar, label: 'Guide', requiresConnection: true },
];

// ============================================
// MobileNavItem Component
// ============================================

interface MobileNavItemProps {
  item: NavItem;
  isConnected: boolean;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({ item, isConnected }) => {
  const location = useLocation();
  const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  const isDisabled = item.requiresConnection && !isConnected;

  if (isDisabled) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'min-w-[64px] min-h-[56px] px-3 py-2',
          'text-dark-500 cursor-not-allowed'
        )}
      >
        <item.icon className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">{item.label}</span>
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={cn(
        'flex flex-col items-center justify-center',
        'min-w-[64px] min-h-[56px] px-3 py-2',
        'transition-colors duration-200',
        'tap-highlight-transparent',
        'active:scale-95 transform',
        isActive
          ? 'text-primary-400'
          : 'text-dark-400 hover:text-dark-200'
      )}
    >
      {/* Active indicator */}
      <div className="relative">
        <item.icon className={cn('w-6 h-6', isActive && 'text-primary-400')} />
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-400 rounded-full" />
        )}
      </div>
      <span className={cn(
        'text-[10px] font-medium mt-1',
        isActive && 'text-primary-400'
      )}>
        {item.label}
      </span>
    </NavLink>
  );
};

// ============================================
// Main MobileNav Component
// ============================================

export const MobileNav: React.FC<MobileNavProps> = ({ onMenuClick, className }) => {
  const isFullscreen = usePlayerStore((state) => state.isFullscreen);
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const authInfo = useConnectionStore((state) => state.authInfo);
  const isConnected = activeConnection !== null && authInfo !== null;

  // Hide when player is fullscreen
  if (isFullscreen) {
    return null;
  }

  return (
    <nav
      className={cn(
        // Only show on mobile
        'lg:hidden',
        // Fixed at bottom
        'fixed bottom-0 left-0 right-0 z-40',
        // Styling
        'bg-dark-900/95 backdrop-blur-md',
        'border-t border-dark-800',
        // Safe area padding for notched devices
        'pb-safe',
        className
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around">
        {/* Main navigation items */}
        {navItems.map((item) => (
          <MobileNavItem
            key={item.to}
            item={item}
            isConnected={isConnected}
          />
        ))}

        {/* Menu button */}
        <button
          onClick={onMenuClick}
          className={cn(
            'flex flex-col items-center justify-center',
            'min-w-[64px] min-h-[56px] px-3 py-2',
            'text-dark-400 hover:text-dark-200',
            'transition-colors duration-200',
            'tap-highlight-transparent',
            'active:scale-95 transform'
          )}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Menu</span>
        </button>
      </div>
    </nav>
  );
};

// ============================================
// Hook: useIsMobile
// ============================================

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024; // lg breakpoint
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

// ============================================
// Hook: useSwipeGesture
// ============================================

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipeGesture(
  ref: React.RefObject<HTMLElement>,
  options: SwipeGestureOptions
) {
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = options;

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine if swipe is horizontal or vertical
      if (absX > absY && absX > threshold) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else if (absY > absX && absY > threshold) {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);
}

// ============================================
// Hook: usePullToRefresh
// ============================================

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh(
  ref: React.RefObject<HTMLElement>,
  options: PullToRefreshOptions
) {
  const { onRefresh, threshold = 80 } = options;
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start pull if at top of scroll container
      if (element.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);

      // Apply resistance
      const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
      setPullDistance(resistedDistance);
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      isPulling = false;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, threshold, onRefresh, isRefreshing, pullDistance]);

  return { isRefreshing, pullDistance };
}

export default MobileNav;
