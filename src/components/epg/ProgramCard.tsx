/**
 * ProgramCard Component
 * Individual program block in the EPG grid
 */

import React, { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import type { EPGProgram } from '@/services/xtream/types';
import { getProgramProgress } from '@/hooks/useEPG';
import {
  transitions,
  focusStyles,
  borderRadius,
  shadows,
} from '@/styles/theme';

// ============================================================================
// Types
// ============================================================================

export interface ProgramCardProps {
  /** The EPG program data */
  program: EPGProgram;
  /** Width of a 30-minute slot in pixels */
  slotWidth?: number;
  /** Start time of the EPG window */
  windowStartTime: Date;
  /** Click handler */
  onClick?: (program: EPGProgram) => void;
  /** Whether this card is in compact mode */
  compact?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SLOT_WIDTH = 200;
const MINUTES_PER_SLOT = 30;

// ============================================================================
// Helper Functions
// ============================================================================

function getProgramStatus(program: EPGProgram): 'past' | 'current' | 'future' {
  const now = Date.now() / 1000;

  if (program.stop_timestamp <= now) {
    return 'past';
  }

  if (program.start_timestamp <= now && program.stop_timestamp > now) {
    return 'current';
  }

  return 'future';
}

function getProgramWidth(
  program: EPGProgram,
  windowStartTime: Date,
  windowEndTime: Date,
  slotWidth: number
): number {
  const windowStartTimestamp = windowStartTime.getTime() / 1000;
  const windowEndTimestamp = windowEndTime.getTime() / 1000;

  // Clamp program times to window boundaries
  const effectiveStart = Math.max(program.start_timestamp, windowStartTimestamp);
  const effectiveEnd = Math.min(program.stop_timestamp, windowEndTimestamp);

  const durationMinutes = (effectiveEnd - effectiveStart) / 60;

  return (durationMinutes / MINUTES_PER_SLOT) * slotWidth;
}

function getProgramPosition(
  program: EPGProgram,
  windowStartTime: Date,
  slotWidth: number
): number {
  const windowStartTimestamp = windowStartTime.getTime() / 1000;
  const effectiveStart = Math.max(program.start_timestamp, windowStartTimestamp);

  const minutesSinceWindowStart = (effectiveStart - windowStartTimestamp) / 60;

  return minutesSinceWindowStart * (slotWidth / MINUTES_PER_SLOT);
}

// ============================================================================
// Status Styles
// ============================================================================

const statusStyles = {
  past: cn(
    'bg-dark-800/60 border-dark-700',
    'text-gray-500',
    'opacity-70'
  ),
  current: cn(
    'bg-primary-900/50 border-primary-600',
    'text-white',
    'shadow-sm shadow-primary-900/30'
  ),
  future: cn(
    'bg-dark-700 border-dark-600',
    'text-gray-200'
  ),
};

const hoverStyles = {
  past: 'hover:bg-dark-700/60 hover:border-dark-600 hover:opacity-100',
  current: 'hover:bg-primary-800/50 hover:border-primary-500 hover:shadow-md',
  future: 'hover:bg-dark-600 hover:border-dark-500 hover:shadow-sm',
};

// ============================================================================
// ProgramCard Component
// ============================================================================

export function ProgramCard({
  program,
  slotWidth = DEFAULT_SLOT_WIDTH,
  windowStartTime,
  onClick,
  compact = false,
  className,
}: ProgramCardProps) {
  const status = useMemo(() => getProgramStatus(program), [program]);
  const progress = useMemo(
    () => (status === 'current' ? getProgramProgress(program) : 0),
    [program, status]
  );

  // Calculate window end time (6 hours from start)
  const windowEndTime = useMemo(() => {
    return new Date(windowStartTime.getTime() + 6 * 60 * 60 * 1000);
  }, [windowStartTime]);

  const width = useMemo(
    () => getProgramWidth(program, windowStartTime, windowEndTime, slotWidth),
    [program, windowStartTime, windowEndTime, slotWidth]
  );

  const position = useMemo(
    () => getProgramPosition(program, windowStartTime, slotWidth),
    [program, windowStartTime, slotWidth]
  );

  const startTime = useMemo(
    () => format(new Date(program.start_timestamp * 1000), 'HH:mm'),
    [program.start_timestamp]
  );

  const endTime = useMemo(
    () => format(new Date(program.stop_timestamp * 1000), 'HH:mm'),
    [program.stop_timestamp]
  );

  const durationMinutes = useMemo(
    () => Math.round((program.stop_timestamp - program.start_timestamp) / 60),
    [program]
  );

  const handleClick = useCallback(() => {
    onClick?.(program);
  }, [onClick, program]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(program);
      }
    },
    [onClick, program]
  );

  // Don't render if width is too small
  if (width < 2) return null;

  const isNarrow = width < 80;
  const isVeryNarrow = width < 40;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'absolute top-1 bottom-1',
        borderRadius.md,
        'border',
        'cursor-pointer',
        transitions.all,
        'overflow-hidden group',
        focusStyles.ringOffset,
        statusStyles[status],
        hoverStyles[status],
        className
      )}
      style={{
        left: `${position}px`,
        width: `${Math.max(width - 4, 1)}px`, // Account for gaps
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={`${program.title}\n${startTime} - ${endTime}`}
    >
      {/* Progress bar for current programs */}
      {status === 'current' && (
        <div
          className={cn(
            'absolute top-0 left-0 bottom-0 bg-primary-600/30',
            transitions.progress
          )}
          style={{ width: `${progress}%` }}
        />
      )}

      {/* Content */}
      <div className={cn('relative h-full px-2', compact ? 'py-0.5' : 'py-1.5')}>
        {/* Title */}
        <p
          className={cn(
            'font-medium truncate leading-snug',
            compact ? 'text-xs' : 'text-sm',
            status === 'past' && 'text-gray-500',
            status === 'current' && 'text-white',
            status === 'future' && 'text-gray-200'
          )}
        >
          {isVeryNarrow ? '' : program.title}
        </p>

        {/* Time info - only show if there's enough space */}
        {!isNarrow && !compact && (
          <p className="text-xs text-gray-400 truncate mt-0.5 leading-snug">
            {startTime} - {endTime}
          </p>
        )}

        {/* Duration badge - show on hover when narrow */}
        {isNarrow && !isVeryNarrow && (
          <span className="text-xs text-gray-500 leading-snug">{durationMinutes}m</span>
        )}
      </div>

      {/* Hover tooltip for narrow programs */}
      {isNarrow && (
        <div
          className={cn(
            'absolute z-50 bottom-full left-0 mb-2 px-3 py-2',
            borderRadius.lg,
            'bg-dark-900 border border-dark-600',
            shadows.dropdown,
            'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
            transitions.all,
            'whitespace-nowrap pointer-events-none',
            'min-w-[200px]'
          )}
        >
          <p className="font-medium text-white text-sm leading-snug">{program.title}</p>
          <p className="text-xs text-gray-400 mt-1 leading-snug">
            {startTime} - {endTime} ({durationMinutes}m)
          </p>
          {program.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 whitespace-normal leading-relaxed">
              {program.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Program Card List Item (for vertical lists)
// ============================================================================

export interface ProgramListItemProps {
  /** The EPG program data */
  program: EPGProgram;
  /** Click handler */
  onClick?: (program: EPGProgram) => void;
  /** Whether to show date (for multi-day lists) */
  showDate?: boolean;
  /** Additional class name */
  className?: string;
}

export function ProgramListItem({
  program,
  onClick,
  showDate = false,
  className,
}: ProgramListItemProps) {
  const status = useMemo(() => getProgramStatus(program), [program]);
  const progress = useMemo(
    () => (status === 'current' ? getProgramProgress(program) : 0),
    [program, status]
  );

  const startTime = useMemo(() => {
    const date = new Date(program.start_timestamp * 1000);
    return showDate
      ? format(date, 'MMM d, HH:mm')
      : format(date, 'HH:mm');
  }, [program.start_timestamp, showDate]);

  const endTime = useMemo(
    () => format(new Date(program.stop_timestamp * 1000), 'HH:mm'),
    [program.stop_timestamp]
  );

  const durationMinutes = useMemo(
    () => Math.round((program.stop_timestamp - program.start_timestamp) / 60),
    [program]
  );

  const handleClick = useCallback(() => {
    onClick?.(program);
  }, [onClick, program]);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'relative flex items-start gap-3 p-3',
        borderRadius.lg,
        'border',
        'cursor-pointer',
        transitions.all,
        focusStyles.ring,
        status === 'past' && 'bg-dark-800/40 border-dark-700 opacity-60',
        status === 'current' && 'bg-primary-900/30 border-primary-600 shadow-sm shadow-primary-900/20',
        status === 'future' && 'bg-dark-800 border-dark-700',
        status !== 'past' && 'hover:bg-dark-700 hover:border-dark-600',
        className
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Progress bar for current program */}
      {status === 'current' && (
        <div
          className={cn(
            'absolute top-0 left-0 bottom-0 bg-primary-600/20 rounded-l-lg',
            transitions.progress
          )}
          style={{ width: `${progress}%` }}
        />
      )}

      {/* Time */}
      <div className="relative flex-shrink-0 w-16 text-center">
        <p className={cn(
          'text-sm font-medium leading-snug',
          status === 'current' ? 'text-primary-400' : 'text-gray-400'
        )}>
          {startTime}
        </p>
        <p className="text-xs text-gray-500 leading-snug">{durationMinutes}m</p>
      </div>

      {/* Content */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            'font-medium truncate leading-snug',
            status === 'past' && 'text-gray-500',
            status === 'current' && 'text-white',
            status === 'future' && 'text-gray-200'
          )}>
            {program.title}
          </h4>
          {status === 'current' && (
            <span className={cn(
              'flex-shrink-0 px-2 py-0.5 text-xs font-medium',
              'bg-primary-600 text-white rounded-full',
              'animate-pulse'
            )}>
              LIVE
            </span>
          )}
        </div>
        {program.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {program.description}
          </p>
        )}
        <p className="text-xs text-gray-600 mt-1 leading-snug">
          {startTime} - {endTime}
        </p>
      </div>

      {/* Progress indicator for current */}
      {status === 'current' && (
        <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-dark-700"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
              className={cn('text-primary-500', transitions.progress)}
            />
          </svg>
          <span className="absolute text-xs font-medium text-primary-400">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default ProgramCard;
