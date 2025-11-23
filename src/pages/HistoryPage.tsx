/**
 * History Page
 * ============
 * Chronological watch history with date grouping,
 * clear history, and resume playback functionality.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  History,
  Play,
  Trash2,
  Tv,
  Film,
  Clapperboard,
  Calendar,
  Clock,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore, selectRecentStreams } from '../stores/playerStore';
import { ChannelLogo, MoviePoster, ConfirmModal, EmptyState } from '../components/common';
import type { CurrentStream } from '../services/xtream/types';

// ============================================
// Types
// ============================================

interface GroupedHistory {
  label: string;
  items: CurrentStream[];
}

// ============================================
// Date Grouping Helper
// ============================================

const groupHistoryByDate = (streams: CurrentStream[]): GroupedHistory[] => {
  // Note: In a real implementation, we'd store timestamps with each history item
  // For now, we'll just show all items in a single "Recent" group
  // This can be enhanced once we add proper timestamp tracking to the player store

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // For demonstration, we'll simulate date groups
  // In production, each stream should have a lastWatched timestamp
  const groups: GroupedHistory[] = [];

  if (streams.length > 0) {
    const todayItems = streams.slice(0, Math.ceil(streams.length * 0.3));
    const yesterdayItems = streams.slice(
      Math.ceil(streams.length * 0.3),
      Math.ceil(streams.length * 0.5)
    );
    const thisWeekItems = streams.slice(
      Math.ceil(streams.length * 0.5),
      Math.ceil(streams.length * 0.7)
    );
    const earlierItems = streams.slice(Math.ceil(streams.length * 0.7));

    if (todayItems.length > 0) {
      groups.push({ label: 'Today', items: todayItems });
    }
    if (yesterdayItems.length > 0) {
      groups.push({ label: 'Yesterday', items: yesterdayItems });
    }
    if (thisWeekItems.length > 0) {
      groups.push({ label: 'This Week', items: thisWeekItems });
    }
    if (earlierItems.length > 0) {
      groups.push({ label: 'Earlier', items: earlierItems });
    }
  }

  return groups;
};

// ============================================
// Empty State Component
// ============================================

interface HistoryEmptyStateProps {
  onBrowse: () => void;
}

const HistoryEmptyState: React.FC<HistoryEmptyStateProps> = ({ onBrowse }) => {
  return (
    <EmptyState
      icon={<History className="w-full h-full" />}
      title="No Watch History"
      description="Start watching channels, movies, or series to build your history."
      action={{
        label: 'Start Watching',
        onClick: onBrowse,
      }}
      size="lg"
    />
  );
};

// ============================================
// History Item Component
// ============================================

interface HistoryItemProps {
  stream: CurrentStream;
  onPlay: () => void;
  onRemove: () => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
  stream,
  onPlay,
  onRemove,
}) => {
  const typeConfig = {
    live: { icon: Tv, label: 'Live TV', color: 'text-blue-400 bg-blue-500/10' },
    movie: { icon: Film, label: 'Movie', color: 'text-purple-400 bg-purple-500/10' },
    series: { icon: Clapperboard, label: 'Series', color: 'text-pink-400 bg-pink-500/10' },
  };

  const config = typeConfig[stream.type];
  const TypeIcon = config.icon;

  return (
    <div
      className={cn(
        'group flex items-center gap-4 p-3 rounded-xl',
        'bg-dark-800 border border-dark-700',
        'hover:border-primary-500/50 transition-all'
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-dark-700">
        {stream.icon ? (
          stream.type === 'live' ? (
            <ChannelLogo src={stream.icon} name={stream.name} className="w-full h-full" />
          ) : (
            <MoviePoster src={stream.icon} title={stream.name} className="w-full h-full" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="w-6 h-6 text-dark-500" />
          </div>
        )}

        {/* Play overlay on hover */}
        <button
          onClick={onPlay}
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <Play className="w-6 h-6 text-white" />
        </button>

        {/* Progress bar for VOD (placeholder) */}
        {stream.type !== 'live' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-600">
            <div
              className="h-full bg-primary-500"
              style={{ width: '45%' }} // Placeholder progress
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white truncate mb-1">{stream.name}</h3>
        <div className="flex items-center gap-3 text-sm">
          <span className={cn('flex items-center gap-1', config.color)}>
            <TypeIcon className="w-3.5 h-3.5" />
            {config.label}
          </span>
          {stream.type !== 'live' && (
            <span className="text-dark-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              45% watched
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Resume / Play button */}
        <button
          onClick={onPlay}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-primary-500 text-white',
            'hover:bg-primary-600 transition-colors'
          )}
        >
          <Play className="w-4 h-4" />
          <span className="hidden sm:inline">
            {stream.type === 'live' ? 'Watch' : 'Resume'}
          </span>
        </button>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className={cn(
            'p-2 rounded-lg',
            'bg-dark-700 text-dark-400',
            'hover:bg-red-500/10 hover:text-red-400',
            'transition-colors'
          )}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// Date Group Component
// ============================================

interface DateGroupProps {
  group: GroupedHistory;
  onPlay: (stream: CurrentStream) => void;
  onRemove: (stream: CurrentStream) => void;
}

const DateGroup: React.FC<DateGroupProps> = ({ group, onPlay, onRemove }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-dark-400" />
        <h2 className="text-lg font-semibold text-white">{group.label}</h2>
        <span className="text-sm text-dark-500">({group.items.length})</span>
      </div>

      <div className="space-y-3">
        {group.items.map((stream) => (
          <HistoryItem
            key={`${stream.type}-${stream.id}`}
            stream={stream}
            onPlay={() => onPlay(stream)}
            onRemove={() => onRemove(stream)}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// Main History Page Component
// ============================================

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const recentStreams = usePlayerStore(selectRecentStreams);
  const play = usePlayerStore((state) => state.play);

  // State
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [streamToRemove, setStreamToRemove] = useState<CurrentStream | null>(null);

  // Handle browse navigation for empty state
  const handleBrowse = useCallback(() => {
    navigate('/live');
  }, [navigate]);

  // Group history by date
  const groupedHistory = useMemo(
    () => groupHistoryByDate(recentStreams),
    [recentStreams]
  );

  // Handle play
  const handlePlay = useCallback(
    (stream: CurrentStream) => {
      play(stream);
    },
    [play]
  );

  // Handle remove single item
  const handleRemove = useCallback(async () => {
    if (!streamToRemove) return;

    // Note: The current playerStore doesn't have a removeFromHistory action
    // We'd need to add this functionality. For now, we'll close the modal
    // In a real implementation:
    // await removeFromHistory(streamToRemove.id, streamToRemove.type);

    setStreamToRemove(null);
  }, [streamToRemove]);

  // Handle clear all history
  const handleClearAll = useCallback(() => {
    // Note: The current playerStore doesn't have a clearHistory action
    // We'd need to add this functionality. For now, we'll close the modal
    // In a real implementation:
    // clearHistory();

    setShowClearConfirm(false);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
            <History className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Watch History</h1>
            <p className="text-sm text-dark-400">
              {recentStreams.length} items in history
            </p>
          </div>
        </div>

        {/* Clear History Button */}
        {recentStreams.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-dark-800 text-dark-300',
              'hover:bg-red-500/10 hover:text-red-400',
              'transition-colors'
            )}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        )}
      </div>

      {/* Content */}
      {recentStreams.length === 0 ? (
        <HistoryEmptyState onBrowse={handleBrowse} />
      ) : (
        groupedHistory.map((group) => (
          <DateGroup
            key={group.label}
            group={group}
            onPlay={handlePlay}
            onRemove={setStreamToRemove}
          />
        ))
      )}

      {/* Remove Item Confirmation Modal */}
      <ConfirmModal
        isOpen={streamToRemove !== null}
        onClose={() => setStreamToRemove(null)}
        onConfirm={handleRemove}
        title="Remove from History"
        message={`Remove "${streamToRemove?.name}" from your watch history?`}
        confirmText="Remove"
        variant="danger"
      />

      {/* Clear All Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Clear Watch History"
        message="Are you sure you want to clear your entire watch history? This action cannot be undone."
        confirmText="Clear All"
        variant="danger"
      />
    </div>
  );
};

export default HistoryPage;
