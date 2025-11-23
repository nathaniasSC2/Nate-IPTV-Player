/**
 * Home Page / Dashboard
 * =====================
 * Landing page with continue watching, recently added,
 * now playing highlights, and quick access to favorites.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Tv,
  Film,
  Clock,
  Star,
  TrendingUp,
  ChevronRight,
  Wifi,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useConnectionStore, selectIsConnected } from '../stores/connectionStore';
import { usePlayerStore } from '../stores/playerStore';
import { useFavoritesStore } from '../stores/favoritesStore';
import { ChannelLogo } from '../components/common';

// ============================================
// Section Header Component
// ============================================

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary-400">{icon}</span>}
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-sm text-dark-400 hover:text-primary-400 transition-colors"
        >
          {actionLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// ============================================
// Welcome Card Component
// ============================================

const WelcomeCard: React.FC = () => {
  const navigate = useNavigate();
  const isConnected = useConnectionStore(selectIsConnected);

  if (isConnected) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 p-8 mb-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome to Nate IPTV</h1>
            <p className="text-primary-200">Your premium streaming experience</p>
          </div>
        </div>

        <p className="text-primary-100 mb-6 max-w-lg">
          Connect to your IPTV provider to access live TV channels, movies, and series.
          Get started by adding your connection details.
        </p>

        <button
          onClick={() => navigate('/setup')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
        >
          <Wifi className="w-5 h-5" />
          Connect Now
        </button>
      </div>
    </div>
  );
};

// ============================================
// Continue Watching Section
// ============================================

const ContinueWatchingSection: React.FC = () => {
  const navigate = useNavigate();
  const recentStreams = usePlayerStore((state) => state.recentStreams);
  const play = usePlayerStore((state) => state.play);

  if (recentStreams.length === 0) {
    return null;
  }

  // Show only the most recent 6 items
  const displayStreams = recentStreams.slice(0, 6);

  return (
    <section className="mb-8">
      <SectionHeader
        title="Continue Watching"
        icon={<Clock className="w-5 h-5" />}
        actionLabel="View History"
        onAction={() => navigate('/history')}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayStreams.map((stream) => (
          <button
            key={`${stream.type}-${stream.id}`}
            onClick={() => play(stream)}
            className={cn(
              'group relative rounded-lg overflow-hidden bg-dark-800',
              'hover:ring-2 hover:ring-primary-500 transition-all'
            )}
          >
            {/* Thumbnail */}
            <div className="aspect-video relative">
              {stream.icon ? (
                <img
                  src={stream.icon}
                  alt={stream.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-dark-700">
                  {stream.type === 'live' ? (
                    <Tv className="w-8 h-8 text-dark-500" />
                  ) : (
                    <Film className="w-8 h-8 text-dark-500" />
                  )}
                </div>
              )}

              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>

              {/* Type Badge */}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium bg-dark-900/80 text-white capitalize">
                {stream.type === 'live' ? 'Live' : stream.type}
              </span>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="text-sm font-medium text-white truncate">{stream.name}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

// ============================================
// Quick Access Section
// ============================================

const QuickAccessSection: React.FC = () => {
  const navigate = useNavigate();

  const quickAccessItems = [
    {
      icon: Tv,
      label: 'Live TV',
      description: 'Watch live channels',
      color: 'from-blue-500 to-blue-700',
      path: '/live',
    },
    {
      icon: Film,
      label: 'Movies',
      description: 'Browse VOD movies',
      color: 'from-purple-500 to-purple-700',
      path: '/movies',
    },
    {
      icon: TrendingUp,
      label: 'Series',
      description: 'Watch TV series',
      color: 'from-pink-500 to-pink-700',
      path: '/series',
    },
    {
      icon: Star,
      label: 'Favorites',
      description: 'Your saved content',
      color: 'from-yellow-500 to-orange-600',
      path: '/favorites',
    },
  ];

  return (
    <section className="mb-8">
      <SectionHeader title="Quick Access" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickAccessItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'relative overflow-hidden rounded-xl p-6',
              'bg-gradient-to-br',
              item.color,
              'hover:scale-[1.02] transition-transform'
            )}
          >
            <div className="relative z-10">
              <item.icon className="w-8 h-8 text-white/90 mb-3" />
              <h3 className="text-lg font-semibold text-white">{item.label}</h3>
              <p className="text-sm text-white/70">{item.description}</p>
            </div>

            {/* Background Icon */}
            <item.icon className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" />
          </button>
        ))}
      </div>
    </section>
  );
};

// ============================================
// Favorites Preview Section
// ============================================

const FavoritesPreviewSection: React.FC = () => {
  const navigate = useNavigate();
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const getFavoritesForConnection = useFavoritesStore(
    (state) => state.getFavoritesForConnection
  );
  const play = usePlayerStore((state) => state.play);

  if (!activeConnection) {
    return null;
  }

  const favorites = getFavoritesForConnection(activeConnection.id);

  if (favorites.length === 0) {
    return (
      <section className="mb-8">
        <SectionHeader
          title="Favorites"
          icon={<Star className="w-5 h-5" />}
        />

        <div className="bg-dark-900 rounded-xl p-8 text-center">
          <Star className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Favorites Yet</h3>
          <p className="text-dark-400 mb-4">
            Start adding your favorite channels, movies, and series for quick access.
          </p>
          <button
            onClick={() => navigate('/live')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Browse Content
          </button>
        </div>
      </section>
    );
  }

  // Show only first 6 favorites
  const displayFavorites = favorites.slice(0, 6);

  return (
    <section className="mb-8">
      <SectionHeader
        title="Favorites"
        icon={<Star className="w-5 h-5" />}
        actionLabel="View All"
        onAction={() => navigate('/favorites')}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayFavorites.map((favorite) => (
          <button
            key={`${favorite.streamType}-${favorite.streamId}`}
            onClick={() =>
              play({
                id: favorite.streamId,
                name: favorite.name,
                url: '', // URL will be generated when playing
                type: favorite.streamType,
                icon: favorite.icon,
                categoryId: favorite.categoryId,
              })
            }
            className={cn(
              'group relative rounded-lg overflow-hidden bg-dark-800',
              'hover:ring-2 hover:ring-primary-500 transition-all'
            )}
          >
            <div className="aspect-square relative">
              {favorite.icon ? (
                <ChannelLogo
                  src={favorite.icon}
                  name={favorite.name}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-dark-700">
                  {favorite.streamType === 'live' ? (
                    <Tv className="w-8 h-8 text-dark-500" />
                  ) : (
                    <Film className="w-8 h-8 text-dark-500" />
                  )}
                </div>
              )}

              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </div>
              </div>

              {/* Favorite Star */}
              <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>

            <div className="p-2">
              <p className="text-xs font-medium text-white truncate">{favorite.name}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

// ============================================
// Stats Overview Section
// ============================================

const StatsOverview: React.FC = () => {
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const authInfo = useConnectionStore((state) => state.authInfo);
  const getFavoritesForConnection = useFavoritesStore(
    (state) => state.getFavoritesForConnection
  );
  const recentStreams = usePlayerStore((state) => state.recentStreams);

  if (!activeConnection || !authInfo) {
    return null;
  }

  const favorites = getFavoritesForConnection(activeConnection.id);
  const userInfo = authInfo.user_info;

  const stats = [
    {
      label: 'Status',
      value: userInfo.status,
      color: userInfo.status === 'Active' ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Favorites',
      value: favorites.length.toString(),
      color: 'text-yellow-400',
    },
    {
      label: 'Watch History',
      value: recentStreams.length.toString(),
      color: 'text-blue-400',
    },
    {
      label: 'Max Connections',
      value: userInfo.max_connections,
      color: 'text-purple-400',
    },
  ];

  return (
    <section className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-dark-900 rounded-xl p-4 border border-dark-800"
          >
            <p className="text-sm text-dark-400 mb-1">{stat.label}</p>
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// ============================================
// Main Home Page Component
// ============================================

const HomePage: React.FC = () => {
  const isConnected = useConnectionStore(selectIsConnected);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Card (shown when not connected) */}
      <WelcomeCard />

      {isConnected && (
        <>
          {/* Stats Overview */}
          <StatsOverview />

          {/* Continue Watching */}
          <ContinueWatchingSection />

          {/* Favorites Preview */}
          <FavoritesPreviewSection />
        </>
      )}

      {/* Quick Access (always shown) */}
      <QuickAccessSection />
    </div>
  );
};

export default HomePage;
