/**
 * ChannelEPG Component
 * EPG view for a single channel - used in channel detail views
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  isSameDay,
} from 'date-fns';
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Play,
  Tv,
  Info,
  Timer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useEPGForChannel, getProgramProgress } from '@/hooks/useEPG';
import { VirtualList, Skeleton, Button, IconButton } from '@/components/common';
import { ProgramListItem } from './ProgramCard';
import { ProgramModal } from './ProgramModal';
import type { EPGProgram, LiveStream } from '@/services/xtream/types';

// ============================================================================
// Types
// ============================================================================

export interface ChannelEPGProps {
  /** The channel to show EPG for */
  channel: LiveStream;
  /** Callback when a program is clicked */
  onProgramClick?: (program: EPGProgram) => void;
  /** Callback when "Watch Now" is clicked */
  onWatchNow?: (program: EPGProgram) => void;
  /** Callback to set a reminder */
  onSetReminder?: (program: EPGProgram) => void;
  /** Set of program IDs that have reminders */
  reminders?: Set<string>;
  /** Whether to show past programs */
  showPastPrograms?: boolean;
  /** Whether to collapse past programs by default */
  collapsePastPrograms?: boolean;
  /** Maximum height for the component */
  maxHeight?: string;
  /** Whether to use virtual list for performance */
  virtualized?: boolean;
  /** Additional class name */
  className?: string;
}

export interface DateFilterProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

function filterProgramsByDate(
  programs: EPGProgram[],
  date: Date
): EPGProgram[] {
  const dayStart = startOfDay(date).getTime() / 1000;
  const dayEnd = endOfDay(date).getTime() / 1000;

  return programs.filter(
    (p) => p.start_timestamp >= dayStart && p.start_timestamp < dayEnd
  );
}

function splitProgramsByTime(programs: EPGProgram[]): {
  past: EPGProgram[];
  current: EPGProgram | null;
  upcoming: EPGProgram[];
} {
  const now = Date.now() / 1000;
  const past: EPGProgram[] = [];
  const upcoming: EPGProgram[] = [];
  let current: EPGProgram | null = null;

  programs.forEach((program) => {
    if (program.stop_timestamp <= now) {
      past.push(program);
    } else if (program.start_timestamp <= now && program.stop_timestamp > now) {
      current = program;
    } else {
      upcoming.push(program);
    }
  });

  return { past, current, upcoming };
}

// ============================================================================
// DateFilter Component
// ============================================================================

function DateFilter({ selectedDate, onDateChange, className }: DateFilterProps) {
  const dates = useMemo(() => {
    const today = new Date();
    return [
      subDays(today, 1), // Yesterday
      today, // Today
      addDays(today, 1), // Tomorrow
      addDays(today, 2),
      addDays(today, 3),
    ];
  }, []);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronLeft className="w-4 h-4" />}
        aria-label="Previous day"
        onClick={() => onDateChange(subDays(selectedDate, 1))}
      />

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateChange(date)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap',
                'transition-colors duration-200',
                isSelected
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-gray-300'
              )}
            >
              {formatDateLabel(date)}
            </button>
          );
        })}
      </div>

      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronRight className="w-4 h-4" />}
        aria-label="Next day"
        onClick={() => onDateChange(addDays(selectedDate, 1))}
      />
    </div>
  );
}

// ============================================================================
// CurrentProgramBanner Component
// ============================================================================

interface CurrentProgramBannerProps {
  program: EPGProgram;
  onWatchNow?: () => void;
  onShowDetails?: () => void;
  className?: string;
}

function CurrentProgramBanner({
  program,
  onWatchNow,
  onShowDetails,
  className,
}: CurrentProgramBannerProps) {
  const [progress, setProgress] = useState(getProgramProgress(program));

  // Update progress every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(getProgramProgress(program));
    }, 60000);

    return () => clearInterval(interval);
  }, [program]);

  const startTime = format(new Date(program.start_timestamp * 1000), 'HH:mm');
  const endTime = format(new Date(program.stop_timestamp * 1000), 'HH:mm');

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        'bg-gradient-to-r from-primary-900/50 to-primary-800/30',
        'border border-primary-700',
        className
      )}
    >
      {/* Progress bar background */}
      <div
        className="absolute inset-0 bg-primary-600/10"
        style={{ width: `${progress}%` }}
      />

      {/* Content */}
      <div className="relative p-4">
        {/* Live badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE NOW
          </span>
          <span className="text-xs text-gray-400">
            {startTime} - {endTime}
          </span>
        </div>

        {/* Title and description */}
        <h3 className="text-lg font-semibold text-white mb-1">{program.title}</h3>
        {program.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
            {program.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-3">
          <div className="w-full bg-dark-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{progress}% complete</span>
            <span>{Math.round((program.stop_timestamp - Date.now() / 1000) / 60)}m remaining</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onWatchNow && (
            <Button
              variant="primary"
              size="sm"
              onClick={onWatchNow}
              leftIcon={<Play className="w-4 h-4" />}
            >
              Watch Now
            </Button>
          )}
          {onShowDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowDetails}
              leftIcon={<Info className="w-4 h-4" />}
            >
              Details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ProgramSection Component
// ============================================================================

interface ProgramSectionProps {
  title: string;
  icon: React.ReactNode;
  programs: EPGProgram[];
  onProgramClick?: (program: EPGProgram) => void;
  defaultCollapsed?: boolean;
  emptyMessage?: string;
  className?: string;
}

function ProgramSection({
  title,
  icon,
  programs,
  onProgramClick,
  defaultCollapsed = false,
  className,
}: ProgramSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  if (programs.length === 0) {
    return null;
  }

  return (
    <div className={cn('', className)}>
      {/* Section header */}
      <button
        onClick={toggleCollapse}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg',
          'bg-dark-800 hover:bg-dark-700 transition-colors',
          'text-left'
        )}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-300">{title}</span>
          <span className="text-xs text-gray-500">({programs.length})</span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Programs list */}
      {!isCollapsed && (
        <div className="mt-2 space-y-2">
          {programs.map((program) => (
            <ProgramListItem
              key={program.id || `${program.start_timestamp}-${program.title}`}
              program={program}
              onClick={() => onProgramClick?.(program)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ChannelEPG Component
// ============================================================================

export function ChannelEPG({
  channel,
  onProgramClick,
  onWatchNow,
  onSetReminder,
  reminders = new Set(),
  showPastPrograms = true,
  collapsePastPrograms = true,
  maxHeight = '600px',
  virtualized = false,
  className,
}: ChannelEPGProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProgram, setSelectedProgram] = useState<EPGProgram | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch EPG data
  const {
    data: allPrograms,
    isLoading,
    isError,
  } = useEPGForChannel(channel.stream_id);

  // Filter programs for selected date
  const programs = useMemo(() => {
    if (!allPrograms) return [];
    return filterProgramsByDate(allPrograms, selectedDate);
  }, [allPrograms, selectedDate]);

  // Split programs into past, current, upcoming
  const { past, current, upcoming } = useMemo(
    () => splitProgramsByTime(programs),
    [programs]
  );

  // Handle program click
  const handleProgramClick = useCallback(
    (program: EPGProgram) => {
      setSelectedProgram(program);
      setIsModalOpen(true);
      onProgramClick?.(program);
    },
    [onProgramClick]
  );

  // Handle watch now
  const handleWatchNow = useCallback(
    (program: EPGProgram) => {
      onWatchNow?.(program);
    },
    [onWatchNow]
  );

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProgram(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('p-4 space-y-4', className)}>
        <Skeleton className="h-8 w-64" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-16 h-10" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <Tv className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 mb-2">Unable to load program guide</p>
        <p className="text-sm text-gray-500">Please try again later</p>
      </div>
    );
  }

  // No programs state
  if (programs.length === 0) {
    return (
      <div className={cn('', className)}>
        <DateFilter
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          className="mb-4"
        />
        <div className="p-6 text-center bg-dark-800 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No programs available</p>
          <p className="text-sm text-gray-500">
            Program data not available for {formatDateLabel(selectedDate)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* Date filter */}
      <DateFilter
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        className="mb-4"
      />

      {/* Current program banner */}
      {current && isToday(selectedDate) && (
        <CurrentProgramBanner
          program={current}
          onWatchNow={() => handleWatchNow(current)}
          onShowDetails={() => handleProgramClick(current)}
          className="mb-4"
        />
      )}

      {/* Programs list */}
      <div
        className="space-y-4 overflow-y-auto"
        style={{ maxHeight }}
      >
        {/* Past programs */}
        {showPastPrograms && past.length > 0 && (
          <ProgramSection
            title="Earlier"
            icon={<Clock className="w-4 h-4 text-gray-500" />}
            programs={past}
            onProgramClick={handleProgramClick}
            defaultCollapsed={collapsePastPrograms}
          />
        )}

        {/* Upcoming programs */}
        {upcoming.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Timer className="w-4 h-4 text-primary-500" />
              <span className="font-medium text-gray-300">Coming Up</span>
              <span className="text-xs text-gray-500">({upcoming.length})</span>
            </div>
            {virtualized ? (
              <VirtualList
                items={upcoming}
                renderItem={(program) => (
                  <ProgramListItem
                    program={program}
                    onClick={() => handleProgramClick(program)}
                  />
                )}
                itemHeight={88}
                gap={8}
                className="h-full"
                scrollClassName="max-h-[400px]"
              />
            ) : (
              <div className="space-y-2">
                {upcoming.map((program) => (
                  <ProgramListItem
                    key={program.id || `${program.start_timestamp}-${program.title}`}
                    program={program}
                    onClick={() => handleProgramClick(program)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Program modal */}
      <ProgramModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        program={selectedProgram}
        channel={channel}
        onWatchNow={handleWatchNow}
        onSetReminder={onSetReminder}
        hasReminder={selectedProgram ? reminders.has(selectedProgram.id) : false}
      />
    </div>
  );
}

// ============================================================================
// ChannelEPGCompact (Simplified version for sidebars)
// ============================================================================

export interface ChannelEPGCompactProps {
  channel: LiveStream;
  maxPrograms?: number;
  onProgramClick?: (program: EPGProgram) => void;
  onWatchNow?: () => void;
  className?: string;
}

export function ChannelEPGCompact({
  channel,
  maxPrograms = 5,
  onProgramClick,
  onWatchNow,
  className,
}: ChannelEPGCompactProps) {
  const { data: allPrograms, isLoading } = useEPGForChannel(channel.stream_id);

  // Get current and upcoming programs
  const { current, upcoming } = useMemo(() => {
    if (!allPrograms) return { current: null, upcoming: [] };
    return splitProgramsByTime(allPrograms);
  }, [allPrograms]);

  const displayPrograms = upcoming.slice(0, maxPrograms);

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-12 h-8" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* Current program */}
      {current && (
        <div className="mb-3 p-3 bg-primary-900/30 rounded-lg border border-primary-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-primary-400 font-medium">NOW</span>
            <span className="text-xs text-gray-500">
              {format(new Date(current.start_timestamp * 1000), 'HH:mm')}
            </span>
          </div>
          <p className="font-medium text-white text-sm truncate">{current.title}</p>
          {onWatchNow && (
            <Button
              variant="primary"
              size="sm"
              className="mt-2 w-full"
              onClick={onWatchNow}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Watch
            </Button>
          )}
        </div>
      )}

      {/* Upcoming */}
      {displayPrograms.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Next Up</p>
          <div className="space-y-1">
            {displayPrograms.map((program) => (
              <button
                key={program.id || `${program.start_timestamp}-${program.title}`}
                onClick={() => onProgramClick?.(program)}
                className={cn(
                  'w-full flex items-center gap-2 p-2 rounded-lg text-left',
                  'hover:bg-dark-700 transition-colors'
                )}
              >
                <span className="text-xs text-gray-500 w-10 flex-shrink-0">
                  {format(new Date(program.start_timestamp * 1000), 'HH:mm')}
                </span>
                <span className="text-sm text-gray-300 truncate">{program.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!current && displayPrograms.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No program data available
        </p>
      )}
    </div>
  );
}

export default ChannelEPG;
