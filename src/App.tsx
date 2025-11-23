/**
 * Nate IPTV Player - Main Application
 * ====================================
 * React Router setup with protected routes,
 * TanStack Query provider, and global error boundary.
 */

import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout';
import { ErrorBoundary, FullPageLoader } from './components/common';
import { useConnectionStore, selectIsConnected } from './stores/connectionStore';

// ============================================
// Lazy-loaded Page Components
// ============================================

const HomePage = React.lazy(() => import('./pages/HomePage'));
const SetupPage = React.lazy(() => import('./pages/SetupPage'));
const LiveTVPage = React.lazy(() => import('./pages/LiveTVPage'));
const MoviesPage = React.lazy(() => import('./pages/MoviesPage'));
const SeriesPage = React.lazy(() => import('./pages/SeriesPage'));
const GuidePage = React.lazy(() => import('./pages/GuidePage'));
const FavoritesPage = React.lazy(() => import('./pages/FavoritesPage'));
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));

// ============================================
// Query Client Configuration
// ============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ============================================
// Protected Route Component
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isConnected = useConnectionStore(selectIsConnected);
  const location = useLocation();

  if (!isConnected) {
    // Redirect to setup page, preserving the intended destination
    return <Navigate to="/setup" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// ============================================
// Route Redirect Component
// ============================================

const HomeRedirect: React.FC = () => {
  const isConnected = useConnectionStore(selectIsConnected);

  // If connected, redirect to live TV; otherwise show home page
  if (isConnected) {
    return <Navigate to="/live" replace />;
  }

  return (
    <Suspense fallback={<FullPageLoader message="Loading..." />}>
      <HomePage />
    </Suspense>
  );
};

// ============================================
// Setup Route Guard
// ============================================

const SetupRouteGuard: React.FC = () => {
  const isConnected = useConnectionStore(selectIsConnected);
  const location = useLocation();

  // If already connected, redirect to the intended destination or live TV
  if (isConnected) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/live';
    return <Navigate to={from} replace />;
  }

  return (
    <Suspense fallback={<FullPageLoader message="Loading..." />}>
      <SetupPage />
    </Suspense>
  );
};

// ============================================
// Loading Fallback Component
// ============================================

const PageLoadingFallback: React.FC = () => {
  return <FullPageLoader message="Loading page..." />;
};

// ============================================
// Connection Initializer
// ============================================

const ConnectionInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadConnections = useConnectionStore((state) => state.loadConnections);

  useEffect(() => {
    // Load saved connections on app start
    loadConnections();
  }, [loadConnections]);

  return <>{children}</>;
};

// ============================================
// App Error Fallback
// ============================================

const AppErrorFallback = (error: Error, reset: () => void) => {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-900 rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
        <p className="text-dark-400 mb-6">{error.message || 'An unexpected error occurred'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              reset();
              window.location.href = '/';
            }}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main App Component
// ============================================

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={AppErrorFallback}>
        <ConnectionInitializer>
          <Routes>
            {/* Setup page - no layout */}
            <Route path="/setup" element={<SetupRouteGuard />} />

            {/* Main app with layout */}
            <Route element={<Layout />}>
              {/* Home / Dashboard */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Protected Routes - require connection */}
              <Route
                path="/live"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <LiveTVPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/movies"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <MoviesPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/series"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <SeriesPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guide"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <GuidePage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <FavoritesPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <HistoryPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <SearchPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Settings - accessible without connection */}
              <Route
                path="/settings"
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <SettingsPage />
                  </Suspense>
                }
              />

              {/* 404 - Catch all */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ConnectionInitializer>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

// ============================================
// 404 Not Found Component
// ============================================

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-dark-600 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-dark-400 mb-6">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default App;
