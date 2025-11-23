/**
 * EPG (Electronic Program Guide) Components
 *
 * Complete TV Guide functionality for the IPTV Player including:
 * - Full grid EPG view with timeline
 * - Individual channel EPG view
 * - Now Playing widgets
 * - Program details modals
 */

// ============================================================================
// Main EPG Grid
// ============================================================================

export {
  EPGGrid,
  MiniEPGGrid,
  type EPGGridProps,
  type MiniEPGGridProps,
} from './EPGGrid';

// ============================================================================
// EPG Timeline
// ============================================================================

export {
  EPGTimeline,
  CurrentTimeIndicator,
  StandaloneTimeline,
  type EPGTimelineProps,
  type StandaloneTimelineProps,
} from './EPGTimeline';

// ============================================================================
// Program Cards
// ============================================================================

export {
  ProgramCard,
  ProgramListItem,
  type ProgramCardProps,
  type ProgramListItemProps,
} from './ProgramCard';

// ============================================================================
// Program Modal
// ============================================================================

export {
  ProgramModal,
  QuickProgramInfo,
  type ProgramModalProps,
  type QuickProgramInfoProps,
} from './ProgramModal';

// ============================================================================
// Now Playing Widgets
// ============================================================================

export {
  NowPlaying,
  NowPlayingCompact,
  NowPlayingItem,
  type NowPlayingProps,
  type NowPlayingCompactProps,
  type NowPlayingItemProps,
} from './NowPlaying';

// ============================================================================
// Channel EPG (Single Channel View)
// ============================================================================

export {
  ChannelEPG,
  ChannelEPGCompact,
  type ChannelEPGProps,
  type ChannelEPGCompactProps,
} from './ChannelEPG';

// ============================================================================
// Re-export EPG hooks and utilities for convenience
// ============================================================================

export {
  // Hooks
  useShortEPG,
  useEPGForChannel,
  useNowPlaying,
  useMultipleEPG,
  useCurrentProgram,
  useEPGTimeline,
  // Utilities
  getCurrentProgram,
  getNextProgram,
  getProgramProgress,
  formatProgramTime,
  formatProgramDuration,
  // Query keys
  epgQueryKeys,
} from '@/hooks/useEPG';
