// ============================================================================
// Common UI Components - Nate IPTV Player
// ============================================================================

// Virtual List Components
export {
  VirtualList,
  VirtualGrid,
  type VirtualListProps,
  type VirtualGridProps,
} from './VirtualList';

// Lazy Image Components
export {
  LazyImage,
  ChannelLogo,
  MoviePoster,
  SeriesPoster,
  Thumbnail,
  type LazyImageProps,
} from './LazyImage';

// Loading State Components
export {
  Spinner,
  Skeleton,
  SkeletonCard,
  SkeletonList,
  FullPageLoader,
  LoadingOverlay,
  InlineLoader,
  ProgressBar,
  type SpinnerProps,
  type SkeletonProps,
  type SkeletonCardProps,
  type SkeletonListProps,
  type FullPageLoaderProps,
  type LoadingOverlayProps,
  type InlineLoaderProps,
  type ProgressBarProps,
} from './LoadingStates';

// Error Boundary Components
export {
  ErrorBoundary,
  ErrorFallback,
  ErrorMessage,
  NotFound,
  type ErrorBoundaryProps,
  type ErrorFallbackProps,
  type ErrorMessageProps,
  type NotFoundProps,
} from './ErrorBoundary';

// Modal Components
export {
  Modal,
  ConfirmModal,
  AlertModal,
  Drawer,
  type ModalProps,
  type ConfirmModalProps,
  type AlertModalProps,
  type DrawerProps,
} from './Modal';

// Button Components
export {
  Button,
  IconButton,
  ButtonGroup,
  ToggleButton,
  CloseButton,
  type ButtonProps,
  type IconButtonProps,
  type ButtonGroupProps,
  type ToggleButtonProps,
  type CloseButtonProps,
} from './Button';

// Input Components
export {
  Input,
  PasswordInput,
  SearchInput,
  Textarea,
  FormField,
  type InputProps,
  type PasswordInputProps,
  type SearchInputProps,
  type TextareaProps,
  type FormFieldProps,
} from './Input';

// Tab Components
export {
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  SimpleTabs,
  type TabsProps,
  type TabListProps,
  type TabProps,
  type TabPanelProps,
  type TabPanelsProps,
  type SimpleTabsProps,
} from './Tabs';

// Badge Components
export {
  Badge,
  QualityBadge,
  LiveBadge,
  StatusBadge,
  CategoryBadge,
  CountBadge,
  BadgeGroup,
  type BadgeProps,
  type QualityBadgeProps,
  type LiveBadgeProps,
  type StatusBadgeProps,
  type CategoryBadgeProps,
  type CountBadgeProps,
  type BadgeGroupProps,
} from './Badge';

// Empty State Components
export {
  EmptyState,
  NoFavorites,
  NoHistory,
  NoResults,
  NoConnection,
  NoChannels,
  NoEPG,
  GenericError,
  type EmptyStateProps,
  type EmptyStateAction,
  type PresetEmptyStateProps,
  type GenericErrorProps,
} from './EmptyState';

// Accessibility Components
export {
  SkipLink,
  SkipLinks,
  VisuallyHidden,
  LiveRegion,
  KeyboardShortcutsHelp,
  useFocusTrap,
  type SkipLinkProps,
  type SkipLinksProps,
  type VisuallyHiddenProps,
  type LiveRegionProps,
  type KeyboardShortcut,
  type KeyboardShortcutsHelpProps,
} from './SkipLink';
