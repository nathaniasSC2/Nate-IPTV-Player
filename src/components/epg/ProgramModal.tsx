/**
 * ProgramModal Component
 * Modal dialog showing detailed program information
 */

import React, { useMemo, useCallback } from 'react';
import { format, intervalToDuration } from 'date-fns';
import {
  Clock,
  Calendar,
  Play,
  Bell,
  BellOff,
  Tv,
  Info,
  Tag,
  Timer,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { EPGProgram, LiveStream } from '@/services/xtream/types';
import { getProgramProgress } from '@/hooks/useEPG';

// ============================================================================
// Types
// ============================================================================

export interface ProgramModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** The EPG program to display */
  program: EPGProgram | null;
  /** The channel info (optional) */
  channel?: LiveStream | null;
  /** Callback when "Watch Now" is clicked */
  onWatchNow?: (program: EPGProgram) => void;
  /** Callback when "Set Reminder" is clicked */
  onSetReminder?: (program: EPGProgram) => void;
  /** Callback when "Remove Reminder" is clicked */
  onRemoveReminder?: (program: EPGProgram) => void;
  /** Whether this program has a reminder set */
  hasReminder?: boolean;
  /** Additional class name */
  className?: string;
}

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

function formatProgramDuration(startTimestamp: number, stopTimestamp: number): string {
  const durationMs = (stopTimestamp - startTimestamp) * 1000;
  const duration = intervalToDuration({ start: 0, end: durationMs });

  const parts: string[] = [];
  if (duration.hours && duration.hours > 0) {
    parts.push(`${duration.hours}h`);
  }
  if (duration.minutes && duration.minutes > 0) {
    parts.push(`${duration.minutes}m`);
  }

  return parts.length > 0 ? parts.join(' ') : '0m';
}

function getTimeUntilStart(startTimestamp: number): string {
  const now = Date.now() / 1000;
  const secondsUntil = startTimestamp - now;

  if (secondsUntil <= 0) return 'Now';

  const hours = Math.floor(secondsUntil / 3600);
  const minutes = Math.floor((secondsUntil % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `In ${days} day${days > 1 ? 's' : ''}`;
  }

  if (hours > 0) {
    return `In ${hours}h ${minutes}m`;
  }

  return `In ${minutes}m`;
}

// ============================================================================
// Status Badge Component
// ============================================================================

interface StatusBadgeProps {
  status: 'past' | 'current' | 'future';
  progress?: number;
}

function StatusBadge({ status, progress = 0 }: StatusBadgeProps) {
  if (status === 'past') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-dark-700 text-gray-400">
        Ended
      </span>
    );
  }

  if (status === 'current') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        Live - {progress}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-dark-700 text-gray-300">
      Upcoming
    </span>
  );
}

// ============================================================================
// Progress Bar Component
// ============================================================================

interface ProgramProgressBarProps {
  progress: number;
  className?: string;
}

function ProgramProgressBar({ progress, className }: ProgramProgressBarProps) {
  return (
    <div className={cn('w-full bg-dark-700 rounded-full h-2', className)}>
      <div
        className="bg-primary-500 h-2 rounded-full transition-all duration-1000"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ============================================================================
// Info Row Component
// ============================================================================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}

function InfoRow({ icon, label, value, className }: InfoRowProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="flex-shrink-0 w-5 h-5 text-gray-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <div className="text-sm text-gray-200 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

// ============================================================================
// ProgramModal Component
// ============================================================================

export function ProgramModal({
  isOpen,
  onClose,
  program,
  channel,
  onWatchNow,
  onSetReminder,
  onRemoveReminder,
  hasReminder = false,
  className,
}: ProgramModalProps) {
  // Early return if no program
  if (!program) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Program Details">
        <p className="text-gray-400">No program selected</p>
      </Modal>
    );
  }

  const status = useMemo(() => getProgramStatus(program), [program]);
  const progress = useMemo(
    () => (status === 'current' ? getProgramProgress(program) : 0),
    [program, status]
  );

  const startDate = useMemo(
    () => new Date(program.start_timestamp * 1000),
    [program.start_timestamp]
  );
  const endDate = useMemo(
    () => new Date(program.stop_timestamp * 1000),
    [program.stop_timestamp]
  );

  const formattedDate = useMemo(
    () => format(startDate, 'EEEE, MMMM d, yyyy'),
    [startDate]
  );
  const formattedStartTime = useMemo(
    () => format(startDate, 'HH:mm'),
    [startDate]
  );
  const formattedEndTime = useMemo(
    () => format(endDate, 'HH:mm'),
    [endDate]
  );
  const duration = useMemo(
    () => formatProgramDuration(program.start_timestamp, program.stop_timestamp),
    [program]
  );

  const timeUntilStart = useMemo(
    () => (status === 'future' ? getTimeUntilStart(program.start_timestamp) : null),
    [program.start_timestamp, status]
  );

  const handleWatchNow = useCallback(() => {
    onWatchNow?.(program);
    onClose();
  }, [onWatchNow, program, onClose]);

  const handleToggleReminder = useCallback(() => {
    if (hasReminder) {
      onRemoveReminder?.(program);
    } else {
      onSetReminder?.(program);
    }
  }, [hasReminder, onSetReminder, onRemoveReminder, program]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={program.title}
      size="lg"
      className={className}
      footer={
        <div className="flex items-center gap-3">
          {/* Watch Now - only for current programs */}
          {status === 'current' && onWatchNow && (
            <Button
              variant="primary"
              onClick={handleWatchNow}
              leftIcon={<Play className="w-4 h-4" />}
            >
              Watch Now
            </Button>
          )}

          {/* Set Reminder - only for future programs */}
          {status === 'future' && (onSetReminder || onRemoveReminder) && (
            <Button
              variant={hasReminder ? 'outline' : 'secondary'}
              onClick={handleToggleReminder}
              leftIcon={
                hasReminder ? (
                  <BellOff className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )
              }
            >
              {hasReminder ? 'Remove Reminder' : 'Set Reminder'}
            </Button>
          )}

          {/* Close button */}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status and Progress */}
        <div className="flex items-center justify-between">
          <StatusBadge status={status} progress={progress} />
          {timeUntilStart && (
            <span className="text-sm text-gray-400">{timeUntilStart}</span>
          )}
        </div>

        {/* Progress bar for current programs */}
        {status === 'current' && (
          <div className="space-y-2">
            <ProgramProgressBar progress={progress} />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formattedStartTime}</span>
              <span>{formattedEndTime}</span>
            </div>
          </div>
        )}

        {/* Channel Info */}
        {channel && (
          <div className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg">
            {channel.stream_icon && (
              <img
                src={channel.stream_icon}
                alt={channel.name}
                className="w-12 h-12 rounded-lg object-contain bg-dark-700 p-1"
              />
            )}
            <div>
              <p className="font-medium text-white">{channel.name}</p>
              <p className="text-xs text-gray-500">Channel</p>
            </div>
          </div>
        )}

        {/* Program Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <InfoRow
            icon={<Calendar className="w-full h-full" />}
            label="Date"
            value={formattedDate}
          />
          <InfoRow
            icon={<Clock className="w-full h-full" />}
            label="Time"
            value={`${formattedStartTime} - ${formattedEndTime}`}
          />
          <InfoRow
            icon={<Timer className="w-full h-full" />}
            label="Duration"
            value={duration}
          />
          {program.lang && (
            <InfoRow
              icon={<Tag className="w-full h-full" />}
              label="Language"
              value={program.lang.toUpperCase()}
            />
          )}
        </div>

        {/* Description */}
        {program.description && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500">
              <Info className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Description</span>
            </div>
            <p className="text-gray-300 leading-relaxed">{program.description}</p>
          </div>
        )}

        {/* Archive availability */}
        {program.has_archive && status === 'past' && (
          <div className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg border border-dark-700">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary-600/20 rounded-lg">
              <Tv className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="font-medium text-white">Catchup Available</p>
              <p className="text-xs text-gray-500">
                This program is available in the TV archive
              </p>
            </div>
            {onWatchNow && (
              <Button
                variant="primary"
                size="sm"
                className="ml-auto"
                onClick={handleWatchNow}
              >
                Watch
              </Button>
            )}
          </div>
        )}

        {/* EPG ID for debugging (hidden in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="pt-4 border-t border-dark-700">
            <p className="text-xs text-gray-600">
              EPG ID: {program.epg_id} | Channel ID: {program.channel_id}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ============================================================================
// Quick Program Info (Tooltip/Popover version)
// ============================================================================

export interface QuickProgramInfoProps {
  program: EPGProgram;
  className?: string;
}

export function QuickProgramInfo({ program, className }: QuickProgramInfoProps) {
  const status = useMemo(() => getProgramStatus(program), [program]);
  const progress = useMemo(
    () => (status === 'current' ? getProgramProgress(program) : 0),
    [program, status]
  );

  const formattedStartTime = useMemo(
    () => format(new Date(program.start_timestamp * 1000), 'HH:mm'),
    [program.start_timestamp]
  );
  const formattedEndTime = useMemo(
    () => format(new Date(program.stop_timestamp * 1000), 'HH:mm'),
    [program.stop_timestamp]
  );

  return (
    <div className={cn('p-3 bg-dark-900 rounded-lg border border-dark-700 shadow-xl', className)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-white line-clamp-2">{program.title}</h4>
        <StatusBadge status={status} progress={progress} />
      </div>

      <p className="text-sm text-gray-400 mb-2">
        {formattedStartTime} - {formattedEndTime}
      </p>

      {status === 'current' && (
        <ProgramProgressBar progress={progress} className="mb-2" />
      )}

      {program.description && (
        <p className="text-sm text-gray-500 line-clamp-3">{program.description}</p>
      )}
    </div>
  );
}

export default ProgramModal;
