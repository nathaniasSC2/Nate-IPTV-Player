/**
 * CategorySidebar Component
 * Navigation sidebar for channel categories with favorites and recent sections
 */

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Spinner, CountBadge } from '@/components/common';
import { useLiveCategories } from '@/hooks';
import { useConnectionStore, useFavoritesStore, usePlayerStore } from '@/stores';

// ============================================
// Types
// ============================================

export interface CategorySidebarProps {
  /** Currently selected category ID (null for all channels) */
  selectedCategoryId: string | null;
  /** Callback when category is selected */
  onCategorySelect: (categoryId: string | null) => void;
  /** Whether to show favorites section */
  showFavorites?: boolean;
  /** Whether to show recently watched section */
  showRecent?: boolean;
  /** Custom class name */
  className?: string;
  /** Whether sidebar is collapsed (mobile) */
  isCollapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
}

// ============================================
// Special Category Types
// ============================================

type SpecialCategory = 'all' | 'favorites' | 'recent';

// ============================================
// Sub Components
// ============================================

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function SidebarHeader({ isCollapsed, onToggle }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
      {!isCollapsed && (
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
          Categories
        </h2>
      )}
      <button
        className={cn(
          'p-1.5 rounded-md',
          'text-gray-400 hover:text-white hover:bg-dark-700',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          isCollapsed && 'mx-auto'
        )}
        onClick={onToggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          className={cn('w-5 h-5 transition-transform duration-200', isCollapsed && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
          />
        </svg>
      </button>
    </div>
  );
}

interface CategoryItemProps {
  id: string | null;
  name: string;
  icon?: React.ReactNode;
  count?: number;
  isSelected: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const CategoryItem = React.memo<CategoryItemProps>(function CategoryItem({
  name,
  icon,
  count,
  isSelected,
  isCollapsed,
  onClick,
}) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md',
        'text-left transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset',
        isSelected
          ? 'bg-primary-600 text-white'
          : 'text-gray-300 hover:bg-dark-700 hover:text-white',
        isCollapsed && 'justify-center px-2'
      )}
      onClick={onClick}
      title={isCollapsed ? name : undefined}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate text-sm">{name}</span>
          {count !== undefined && count > 0 && (
            <CountBadge
              count={count}
              variant={isSelected ? 'secondary' : 'default'}
              size="xs"
            />
          )}
        </>
      )}
    </button>
  );
});

interface SectionDividerProps {
  label?: string;
  isCollapsed: boolean;
}

function SectionDivider({ label, isCollapsed }: SectionDividerProps) {
  if (isCollapsed) {
    return <div className="my-2 border-t border-dark-700" />;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 mt-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 border-t border-dark-700" />
    </div>
  );
}

// ============================================
// Icons
// ============================================

const icons = {
  all: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 10h16M4 14h16M4 18h16"
      />
    </svg>
  ),
  favorites: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  recent: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  category: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  ),
};

// ============================================
// Main Component
// ============================================

export function CategorySidebar({
  selectedCategoryId,
  onCategorySelect,
  showFavorites = true,
  showRecent = true,
  className,
  isCollapsed: controlledCollapsed,
  onCollapsedChange,
}: CategorySidebarProps) {
  // Internal collapsed state (if not controlled)
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;

  // Store hooks
  const activeConnection = useConnectionStore((state) => state.activeConnection);
  const favoritesForConnection = useFavoritesStore((state) =>
    activeConnection ? state.getFavoritesForConnection(activeConnection.id) : []
  );
  const recentStreams = usePlayerStore((state) => state.recentStreams);

  // Fetch categories
  const { data: categories, isLoading } = useLiveCategories();

  // Count favorites (live only)
  const favoritesCount = useMemo(
    () => favoritesForConnection.filter((f) => f.streamType === 'live').length,
    [favoritesForConnection]
  );

  // Count recent (live only)
  const recentCount = useMemo(
    () => recentStreams.filter((s) => s.type === 'live').length,
    [recentStreams]
  );

  // Determine if a special category is selected
  const selectedSpecial: SpecialCategory | null = useMemo(() => {
    if (selectedCategoryId === null) return 'all';
    if (selectedCategoryId === '__favorites__') return 'favorites';
    if (selectedCategoryId === '__recent__') return 'recent';
    return null;
  }, [selectedCategoryId]);

  // Handle toggle
  const handleToggle = useCallback(() => {
    const newCollapsed = !isCollapsed;
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  }, [isCollapsed, onCollapsedChange]);

  // Handle category selection
  const handleSelectAll = useCallback(() => {
    onCategorySelect(null);
  }, [onCategorySelect]);

  const handleSelectFavorites = useCallback(() => {
    onCategorySelect('__favorites__');
  }, [onCategorySelect]);

  const handleSelectRecent = useCallback(() => {
    onCategorySelect('__recent__');
  }, [onCategorySelect]);

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      onCategorySelect(categoryId);
    },
    [onCategorySelect]
  );

  return (
    <aside
      className={cn(
        'flex flex-col bg-dark-800 border-r border-dark-700',
        'transition-all duration-200',
        isCollapsed ? 'w-14' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} onToggle={handleToggle} />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-dark-600 py-2">
        {/* Special Categories */}
        <div className="px-2 space-y-1">
          {/* All Channels */}
          <CategoryItem
            id={null}
            name="All Channels"
            icon={icons.all}
            isSelected={selectedSpecial === 'all'}
            isCollapsed={isCollapsed}
            onClick={handleSelectAll}
          />

          {/* Favorites */}
          {showFavorites && (
            <CategoryItem
              id="__favorites__"
              name="Favorites"
              icon={icons.favorites}
              count={favoritesCount}
              isSelected={selectedSpecial === 'favorites'}
              isCollapsed={isCollapsed}
              onClick={handleSelectFavorites}
            />
          )}

          {/* Recently Watched */}
          {showRecent && (
            <CategoryItem
              id="__recent__"
              name="Recently Watched"
              icon={icons.recent}
              count={recentCount}
              isSelected={selectedSpecial === 'recent'}
              isCollapsed={isCollapsed}
              onClick={handleSelectRecent}
            />
          )}
        </div>

        {/* Divider */}
        <SectionDivider label="Categories" isCollapsed={isCollapsed} />

        {/* Categories List */}
        <div className="px-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" variant="gray" />
            </div>
          ) : categories && categories.length > 0 ? (
            categories.map((category) => (
              <CategoryItem
                key={category.category_id}
                id={category.category_id}
                name={category.category_name}
                icon={icons.category}
                isSelected={selectedCategoryId === category.category_id}
                isCollapsed={isCollapsed}
                onClick={() => handleSelectCategory(category.category_id)}
              />
            ))
          ) : (
            !isCollapsed && (
              <p className="text-sm text-gray-500 text-center py-4">
                No categories available
              </p>
            )
          )}
        </div>
      </div>

      {/* Footer (optional: connection info) */}
      {!isCollapsed && activeConnection && (
        <div className="px-3 py-2 border-t border-dark-700">
          <p className="text-xs text-gray-500 truncate" title={activeConnection.name}>
            {activeConnection.name}
          </p>
        </div>
      )}
    </aside>
  );
}

// ============================================
// Mobile Category Drawer
// ============================================

export interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export function CategoryDrawer({
  isOpen,
  onClose,
  selectedCategoryId,
  onCategorySelect,
}: CategoryDrawerProps) {
  const handleCategorySelect = useCallback(
    (categoryId: string | null) => {
      onCategorySelect(categoryId);
      onClose();
    },
    [onCategorySelect, onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50',
          'w-72 bg-dark-800',
          'transform transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">Categories</h2>
          <button
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-700"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <CategorySidebar
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={handleCategorySelect}
          className="border-r-0"
        />
      </div>
    </>
  );
}

export default CategorySidebar;
