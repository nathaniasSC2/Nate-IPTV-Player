/**
 * EPGTimeline Component
 * Timeline header for the EPG grid with time slots and date navigation
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  format,
  addMinutes,
  addDays,
  subDays,
  startOfHour,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  differenceInMinutes,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button, IconButton } from '@/components/common/Button';

// ============================================================================
// Types
// ============================================================================

export interface EPGTimelineProps {
  /** Start time of the timeline window */
  windowStartTime: Date;
  /** Callback when window start time changes */
  onWindowStartTimeChange: (date: Date) => void;
  /** Duration of the window in hours */
  windowDurationHours?: number;
  /** Width of each 30-minute slot in pixels */
  slotWidth?: number;
  /** Offset for the channel list column */
  channelColumnWidth?: number;
  /** Current scroll position */
  scrollLeft?: number;
  /** Whether to show the date selector */
  showDateSelector?: boolean;
  /** Whether the timeline header is sticky */
  sticky?: boolean;
  /** Additional class name */
  className?: string;
}

export interface TimeSlot {
  time: Date;
  label: string;
  isHour: boolean;
  isCurrentHour: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SLOT_WIDTH = 200;
const DEFAULT_WINDOW_DURATION_HOURS = 6;
const DEFAULT_CHANNEL_COLUMN_WIDTH = 200;
const MINUTES_PER_SLOT = 30;

// ============================================================================
// Helper Functions
// ============================================================================

function generateTimeSlots(
  startTime: Date,
  durationHours: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const currentHour = startOfHour(now);

  const totalSlots = (durationHours * 60) / MINUTES_PER_SLOT;

  for (let i = 0; i < totalSlots; i++) {
    const slotTime = addMinutes(startTime, i * MINUTES_PER_SLOT);
    const isHour = slotTime.getMinutes() === 0;
    const isCurrentHour = isSameDay(slotTime, currentHour) &&
      slotTime.getHours() === currentHour.getHours();

    slots.push({
      time: slotTime,
      label: format(slotTime, isHour ? 'HH:mm' : 'HH:mm'),
      isHour,
      isCurrentHour,
    });
  }

  return slots;
}

function formatDayLabel(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'EEEE, MMM d');
}

// ============================================================================
// DateSelector Component
// ============================================================================

interface DateSelectorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

function DateSelector({ currentDate, onDateChange, className }: DateSelectorProps) {
  const handlePreviousDay = useCallback(() => {
    onDateChange(subDays(currentDate, 1));
  }, [currentDate, onDateChange]);

  const handleNextDay = useCallback(() => {
    onDateChange(addDays(currentDate, 1));
  }, [currentDate, onDateChange]);

  const handleToday = useCallback(() => {
    const now = new Date();
    const todayStart = startOfHour(now);
    onDateChange(todayStart);
  }, [onDateChange]);

  const dayLabel = formatDayLabel(currentDate);
  const isCurrentlyToday = isToday(currentDate);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronLeft className="w-4 h-4" />}
        aria-label="Previous day"
        onClick={handlePreviousDay}
      />

      <div className="flex items-center gap-2 min-w-[160px] justify-center">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-200">{dayLabel}</span>
      </div>

      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronRight className="w-4 h-4" />}
        aria-label="Next day"
        onClick={handleNextDay}
      />

      {!isCurrentlyToday && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToday}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="ml-2"
        >
          Today
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// NowButton Component
// ============================================================================

interface NowButtonProps {
  onClick: () => void;
  className?: string;
}

function NowButton({ onClick, className }: NowButtonProps) {
  return (
    <Button
      variant="primary"
      size="sm"
      onClick={onClick}
      leftIcon={<Clock className="w-3.5 h-3.5" />}
      className={className}
    >
      Now
    </Button>
  );
}

// ============================================================================
// TimeSlotHeader Component
// ============================================================================

interface TimeSlotHeaderProps {
  slots: TimeSlot[];
  slotWidth: number;
  className?: string;
}

function TimeSlotHeader({ slots, slotWidth, className }: TimeSlotHeaderProps) {
  return (
    <div className={cn('flex', className)}>
      {slots.map((slot) => (
        <div
          key={slot.time.toISOString()}
          className={cn(
            'flex-shrink-0 border-l border-dark-700',
            'flex items-center justify-start px-2',
            slot.isHour && 'border-l-dark-600',
            slot.isCurrentHour && 'bg-primary-900/20'
          )}
          style={{ width: `${slotWidth}px` }}
        >
          <span
            className={cn(
              'text-xs font-medium',
              slot.isHour ? 'text-gray-300' : 'text-gray-500',
              slot.isCurrentHour && 'text-primary-400'
            )}
          >
            {slot.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// CurrentTimeIndicator Component
// ============================================================================

interface CurrentTimeIndicatorProps {
  windowStartTime: Date;
  slotWidth: number;
  channelColumnWidth: number;
  height?: string;
  className?: string;
}

export function CurrentTimeIndicator({
  windowStartTime,
  slotWidth,
  channelColumnWidth,
  height = '100%',
  className,
}: CurrentTimeIndicatorProps) {
  const now = new Date();
  const minutesSinceWindowStart = differenceInMinutes(now, windowStartTime);

  // Don't show if current time is outside the window
  if (minutesSinceWindowStart < 0) {
    return null;
  }

  const position =
    channelColumnWidth + minutesSinceWindowStart * (slotWidth / MINUTES_PER_SLOT);

  return (
    <div
      className={cn(
        'absolute top-0 z-20 pointer-events-none',
        className
      )}
      style={{
        left: `${position}px`,
        height,
      }}
    >
      {/* Red line */}
      <div className="w-0.5 h-full bg-red-500" />
      {/* Time bubble */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-red-500 text-white text-xs font-medium whitespace-nowrap">
        {format(now, 'HH:mm')}
      </div>
    </div>
  );
}

// ============================================================================
// EPGTimeline Component
// ============================================================================

export function EPGTimeline({
  windowStartTime,
  onWindowStartTimeChange,
  windowDurationHours = DEFAULT_WINDOW_DURATION_HOURS,
  slotWidth = DEFAULT_SLOT_WIDTH,
  channelColumnWidth = DEFAULT_CHANNEL_COLUMN_WIDTH,
  scrollLeft = 0,
  showDateSelector = true,
  sticky = true,
  className,
}: EPGTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  const slots = useMemo(
    () => generateTimeSlots(windowStartTime, windowDurationHours),
    [windowStartTime, windowDurationHours]
  );

  const totalWidth = slots.length * slotWidth;

  const handleJumpToNow = useCallback(() => {
    const now = new Date();
    // Round down to the nearest 30 minutes
    const minutes = now.getMinutes();
    const roundedMinutes = Math.floor(minutes / 30) * 30;
    const roundedTime = new Date(now);
    roundedTime.setMinutes(roundedMinutes);
    roundedTime.setSeconds(0);
    roundedTime.setMilliseconds(0);

    // Go back 30 minutes so current time is visible
    const startTime = addMinutes(roundedTime, -30);
    onWindowStartTimeChange(startTime);
  }, [onWindowStartTimeChange]);

  const handleDateChange = useCallback(
    (date: Date) => {
      // Keep the same time of day but change the date
      const newStart = new Date(date);
      newStart.setHours(windowStartTime.getHours());
      newStart.setMinutes(windowStartTime.getMinutes());
      newStart.setSeconds(0);
      newStart.setMilliseconds(0);
      onWindowStartTimeChange(newStart);
    },
    [windowStartTime, onWindowStartTimeChange]
  );

  const handleScrollLeft = useCallback(() => {
    const newStart = addMinutes(windowStartTime, -30);
    onWindowStartTimeChange(newStart);
  }, [windowStartTime, onWindowStartTimeChange]);

  const handleScrollRight = useCallback(() => {
    const newStart = addMinutes(windowStartTime, 30);
    onWindowStartTimeChange(newStart);
  }, [windowStartTime, onWindowStartTimeChange]);

  // Update current time indicator every minute
  const [, forceUpdate] = React.useState({});
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={timelineRef}
      className={cn(
        'bg-dark-900 border-b border-dark-700',
        sticky && 'sticky top-0 z-30',
        className
      )}
    >
      {/* Controls Row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-800">
        <div className="flex items-center gap-4">
          {/* Time navigation */}
          <div className="flex items-center gap-1">
            <IconButton
              variant="ghost"
              size="sm"
              icon={<ChevronLeft className="w-4 h-4" />}
              aria-label="Go back 30 minutes"
              onClick={handleScrollLeft}
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<ChevronRight className="w-4 h-4" />}
              aria-label="Go forward 30 minutes"
              onClick={handleScrollRight}
            />
          </div>

          {/* Date selector */}
          {showDateSelector && (
            <DateSelector
              currentDate={windowStartTime}
              onDateChange={handleDateChange}
            />
          )}
        </div>

        {/* Jump to now button */}
        <NowButton onClick={handleJumpToNow} />
      </div>

      {/* Timeline header */}
      <div className="flex">
        {/* Channel column header */}
        <div
          className={cn(
            'flex-shrink-0 flex items-center justify-center',
            'bg-dark-900 border-r border-dark-700',
            'text-sm font-medium text-gray-400'
          )}
          style={{ width: `${channelColumnWidth}px` }}
        >
          <span>Channels</span>
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-hidden">
          <div
            className="transition-transform duration-200"
            style={{
              width: `${totalWidth}px`,
              transform: `translateX(-${scrollLeft}px)`,
            }}
          >
            <TimeSlotHeader
              slots={slots}
              slotWidth={slotWidth}
              className="h-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Standalone Timeline (for use outside EPGGrid)
// ============================================================================

export interface StandaloneTimelineProps {
  startTime: Date;
  endTime: Date;
  currentTime?: Date;
  slotWidth?: number;
  className?: string;
}

export function StandaloneTimeline({
  startTime,
  endTime,
  currentTime = new Date(),
  slotWidth = DEFAULT_SLOT_WIDTH,
  className,
}: StandaloneTimelineProps) {
  const durationHours = differenceInMinutes(endTime, startTime) / 60;
  const slots = useMemo(
    () => generateTimeSlots(startTime, durationHours),
    [startTime, durationHours]
  );

  const totalWidth = slots.length * slotWidth;
  const currentTimePosition = useMemo(() => {
    const minutesSinceStart = differenceInMinutes(currentTime, startTime);
    if (minutesSinceStart < 0 || minutesSinceStart > durationHours * 60) {
      return null;
    }
    return minutesSinceStart * (slotWidth / MINUTES_PER_SLOT);
  }, [currentTime, startTime, durationHours, slotWidth]);

  return (
    <div className={cn('relative', className)}>
      <div className="flex overflow-x-auto" style={{ width: `${totalWidth}px` }}>
        {slots.map((slot) => (
          <div
            key={slot.time.toISOString()}
            className={cn(
              'flex-shrink-0 border-l border-dark-700 px-2 py-1',
              slot.isHour && 'border-l-dark-600'
            )}
            style={{ width: `${slotWidth}px` }}
          >
            <span
              className={cn(
                'text-xs',
                slot.isHour ? 'text-gray-300 font-medium' : 'text-gray-500'
              )}
            >
              {slot.label}
            </span>
          </div>
        ))}
      </div>

      {/* Current time indicator */}
      {currentTimePosition !== null && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${currentTimePosition}px` }}
        />
      )}
    </div>
  );
}

export default EPGTimeline;
