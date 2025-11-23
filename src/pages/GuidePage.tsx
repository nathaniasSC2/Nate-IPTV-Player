/**
 * TV Guide Page
 * =============
 * EPG (Electronic Program Guide) with timeline view
 * and program details.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Tv,
} from 'lucide-react';
import { format, addDays, subDays, startOfDay, isToday } from 'date-fns';
import { cn } from '../utils/cn';
import { useConnectionStore } from '../stores/connectionStore';
import { usePlayerStore } from '../stores/playerStore';
import { useAllLiveStreams } from '../hooks/useXtreamAPI';
import { EPGGrid } from '../components/epg';
import { Button, Spinner } from '../components/common';
import type { LiveStream } from '../services/xtream/types';

// ============================================
// Date Selector Component
// ============================================

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const dates = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Previous Day */}
      <button
        onClick={() => onDateChange(subDays(selectedDate, 1))}
        disabled={isToday(selectedDate)}
        className={cn(
          'p-2 rounded-lg',
          'bg-dark-800 text-dark-400',
          'hover:text-white hover:bg-dark-700',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors'
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Date Pills */}
      <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1">
        {dates.map((date) => {
          const isSelected =
            format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isTodayDate = isToday(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateChange(date)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium',
                'transition-colors',
                isSelected
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700'
              )}
            >
              {isTodayDate ? 'Today' : format(date, 'EEE d')}
            </button>
          );
        })}
      </div>

      {/* Next Day */}
      <button
        onClick={() => onDateChange(addDays(selectedDate, 1))}
        className={cn(
          'p-2 rounded-lg',
          'bg-dark-800 text-dark-400',
          'hover:text-white hover:bg-dark-700',
          'transition-colors'
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// ============================================
// Now Playing Banner Component
// ============================================

const NowPlayingBanner: React.FC = () => {
  const navigate = useNavigate();
  const currentStream = usePlayerStore((state) => state.currentStream);

  if (!currentStream || currentStream.type !== 'live') {
    return null;
  }

  return (
    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Live Indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-medium text-red-400">LIVE</span>
          </div>

          {/* Channel Info */}
          <div>
            <p className="font-medium text-white">{currentStream.name}</p>
            <p className="text-sm text-dark-400">Currently playing</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/live')}
          >
            <Tv className="w-4 h-4" />
            View Channel
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Empty State Component
// ============================================

const EmptyState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-16">
      <Calendar className="w-16 h-16 text-dark-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">No EPG Data</h3>
      <p className="text-dark-400 mb-6">
        Program guide information is not available for your channels.
      </p>
      <Button variant="primary" onClick={() => navigate('/live')}>
        <Tv className="w-4 h-4" />
        Browse Channels
      </Button>
    </div>
  );
};

// ============================================
// Main Guide Page Component
// ============================================

const GuidePage: React.FC = () => {
  const navigate = useNavigate();
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const authInfo = useConnectionStore((state) => state.authInfo);
  const play = usePlayerStore((state) => state.play);

  // State
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

  // Fetch all live channels
  const { data: channels = [], isLoading: channelsLoading } = useAllLiveStreams();

  const isConnected = activeConnection !== null && authInfo !== null;

  // Handle channel play
  const handleChannelPlay = (channel: LiveStream) => {
    play({
      id: channel.stream_id,
      name: channel.name,
      url: '', // Will be generated by player
      type: 'live',
      icon: channel.stream_icon,
      categoryId: channel.category_id,
    });
    navigate('/live');
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">TV Guide</h1>
            <p className="text-sm text-dark-400">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      {/* Now Playing Banner */}
      <NowPlayingBanner />

      {/* EPG Content */}
      {isConnected ? (
        <div className="flex-1 min-h-0">
          {channelsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : channels.length > 0 ? (
            <EPGGrid
              channels={channels}
              initialStartTime={selectedDate}
              onChannelPlay={handleChannelPlay}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

export default GuidePage;
