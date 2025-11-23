/**
 * Layout Component
 * ================
 * Main page layout wrapper with sidebar, header, bottom navigation,
 * and responsive behavior. Includes player overlay when video is playing.
 *
 * Mobile Features:
 * - Bottom navigation bar for quick access
 * - Collapsible sidebar drawer
 * - Safe area handling for notched devices
 * - Content adaptation for different screen sizes
 */

import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav, useIsMobile, useSwipeGesture } from './MobileNav';
import { usePlayerStore } from '../../stores/playerStore';

// ============================================
// Types
// ============================================

interface LayoutProps {
  children?: React.ReactNode;
}

// ============================================
// Player Overlay Component
// ============================================

const PlayerOverlay: React.FC = () => {
  const currentStream = usePlayerStore((state) => state.currentStream);
  const isFullscreen = usePlayerStore((state) => state.isFullscreen);

  if (!currentStream || !isFullscreen) {
    return null;
  }

  // When fullscreen, the player takes over the entire viewport
  // This overlay provides a backdrop for the fullscreen player
  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* The actual player component will portal its fullscreen content here */}
      <div id="fullscreen-player-container" className="w-full h-full" />
    </div>
  );
};

// ============================================
// Local Storage Keys
// ============================================

const SIDEBAR_COLLAPSED_KEY = 'nate-iptv-sidebar-collapsed';

// ============================================
// Main Layout Component
// ============================================

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });

  // Player state
  const currentStream = usePlayerStore((state) => state.currentStream);
  const isFullscreen = usePlayerStore((state) => state.isFullscreen);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Save sidebar collapsed state
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Handle keyboard shortcut to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
      // Escape to close mobile sidebar
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Swipe gesture to open sidebar on mobile
  useSwipeGesture(mainRef, {
    onSwipeRight: () => {
      if (isMobile) {
        setIsSidebarOpen(true);
      }
    },
  });

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isMobile]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        onClose={handleCloseSidebar}
      />

      {/* Main Content Area */}
      <div
        ref={mainRef}
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          // Adjust margin based on sidebar state (desktop only)
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64',
          // Add bottom padding for mobile nav
          'pb-[72px] lg:pb-0'
        )}
      >
        {/* Header */}
        <Header onMenuClick={handleToggleSidebar} />

        {/* Page Content */}
        <main
          className={cn(
            'flex-1 overflow-x-hidden',
            // Touch-friendly scrolling
            'overscroll-contain',
            // Safe area handling for content
            'px-safe'
          )}
        >
          {children || <Outlet />}
        </main>

        {/* Mini Player Bar (when playing and not fullscreen) - Desktop only */}
        {currentStream && !isFullscreen && !isMobile && (
          <MiniPlayerBar />
        )}
      </div>

      {/* Mobile Mini Player (above bottom nav) */}
      {currentStream && !isFullscreen && isMobile && (
        <MobileMiniPlayerBar />
      )}

      {/* Mobile Bottom Navigation */}
      <MobileNav onMenuClick={handleToggleSidebar} />

      {/* Fullscreen Player Overlay */}
      <PlayerOverlay />
    </div>
  );
};

// ============================================
// Mini Player Bar Component (Desktop)
// ============================================

const MiniPlayerBar: React.FC = () => {
  const currentStream = usePlayerStore((state) => state.currentStream);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const pause = usePlayerStore((state) => state.pause);
  const resume = usePlayerStore((state) => state.resume);
  const stop = usePlayerStore((state) => state.stop);
  const toggleFullscreen = usePlayerStore((state) => state.toggleFullscreen);

  if (!currentStream) {
    return null;
  }

  return (
    <div className="sticky bottom-0 z-20 bg-dark-900/95 backdrop-blur-sm border-t border-dark-800 hidden lg:block">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg bg-dark-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {currentStream.icon ? (
            <img
              src={currentStream.icon}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 text-dark-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Stream Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {currentStream.name}
          </p>
          <p className="text-xs text-dark-400 capitalize">
            {currentStream.type === 'live' ? 'Live TV' : currentStream.type}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-lg bg-dark-800 text-dark-300 flex items-center justify-center hover:text-white hover:bg-dark-700 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>

          {/* Close */}
          <button
            onClick={stop}
            className="w-10 h-10 rounded-lg bg-dark-800 text-dark-300 flex items-center justify-center hover:text-white hover:bg-dark-700 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Mobile Mini Player Bar Component
// ============================================

const MobileMiniPlayerBar: React.FC = () => {
  const currentStream = usePlayerStore((state) => state.currentStream);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const pause = usePlayerStore((state) => state.pause);
  const resume = usePlayerStore((state) => state.resume);
  const stop = usePlayerStore((state) => state.stop);
  const toggleFullscreen = usePlayerStore((state) => state.toggleFullscreen);

  if (!currentStream) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-30',
        // Position above bottom nav (56px nav + 16px margin)
        'bottom-[72px]',
        'bg-dark-900/95 backdrop-blur-md',
        'border-t border-b border-dark-800',
        'lg:hidden'
      )}
    >
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Thumbnail */}
        <div
          className="w-11 h-11 rounded-lg bg-dark-800 flex items-center justify-center flex-shrink-0 overflow-hidden"
          onClick={toggleFullscreen}
        >
          {currentStream.icon ? (
            <img
              src={currentStream.icon}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 text-dark-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Stream Info - Tap to expand */}
        <div
          className="flex-1 min-w-0"
          onClick={toggleFullscreen}
        >
          <p className="text-sm font-medium text-white truncate">
            {currentStream.name}
          </p>
          <p className="text-xs text-dark-400 capitalize">
            {currentStream.type === 'live' ? 'Live TV' : currentStream.type}
          </p>
        </div>

        {/* Controls - 44x44px touch targets */}
        <div className="flex items-center gap-1">
          {/* Play/Pause */}
          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className={cn(
              'w-11 h-11 rounded-full bg-primary-500 text-white',
              'flex items-center justify-center',
              'hover:bg-primary-600 active:bg-primary-700',
              'transition-colors',
              'tap-highlight-transparent'
            )}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Close */}
          <button
            onClick={stop}
            className={cn(
              'w-11 h-11 rounded-lg',
              'text-dark-300 flex items-center justify-center',
              'hover:text-white active:bg-dark-700',
              'transition-colors',
              'tap-highlight-transparent'
            )}
            aria-label="Close player"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Layout;
