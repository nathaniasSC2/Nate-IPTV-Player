import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { cn } from '@/utils/cn';

// ============================================================================
// Tab Context
// ============================================================================

interface TabContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  registerTab: (value: string) => void;
  indicatorStyle: React.CSSProperties;
  updateIndicator: (element: HTMLButtonElement | null, value: string) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

function useTabContext() {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component');
  }
  return context;
}

// ============================================================================
// Tabs Root Component
// ============================================================================

export interface TabsProps {
  /** Default active tab value (uncontrolled) */
  defaultValue?: string;
  /** Active tab value (controlled) */
  value?: string;
  /** Callback when tab changes */
  onChange?: (value: string) => void;
  /** Children (TabList and TabPanels) */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Orientation of the tabs */
  orientation?: 'horizontal' | 'vertical';
}

export function Tabs({
  defaultValue,
  value,
  onChange,
  children,
  className,
  orientation = 'horizontal',
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalValue;

  const setActiveTab = useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [isControlled, onChange]
  );

  const registerTab = useCallback((tabValue: string) => {
    // Auto-select first tab if no default
    setInternalValue((prev) => prev || tabValue);
  }, []);

  const updateIndicator = useCallback(
    (element: HTMLButtonElement | null, tabValue: string) => {
      if (element) {
        tabRefs.current.set(tabValue, element);
      }

      const activeElement = tabRefs.current.get(activeTab);
      if (activeElement) {
        if (orientation === 'horizontal') {
          setIndicatorStyle({
            width: `${activeElement.offsetWidth}px`,
            transform: `translateX(${activeElement.offsetLeft}px)`,
          });
        } else {
          setIndicatorStyle({
            height: `${activeElement.offsetHeight}px`,
            transform: `translateY(${activeElement.offsetTop}px)`,
          });
        }
      }
    },
    [activeTab, orientation]
  );

  const contextValue = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      registerTab,
      indicatorStyle,
      updateIndicator,
    }),
    [activeTab, setActiveTab, registerTab, indicatorStyle, updateIndicator]
  );

  return (
    <TabContext.Provider value={contextValue}>
      <div
        className={cn(
          orientation === 'vertical' && 'flex gap-4',
          className
        )}
        data-orientation={orientation}
      >
        {children}
      </div>
    </TabContext.Provider>
  );
}

// ============================================================================
// TabList Component
// ============================================================================

export interface TabListProps {
  /** Children (Tab components) */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Whether to show the animated indicator */
  showIndicator?: boolean;
  /** Variant style */
  variant?: 'line' | 'pills' | 'enclosed';
}

export function TabList({
  children,
  className,
  showIndicator = true,
  variant = 'line',
}: TabListProps) {
  const { indicatorStyle } = useTabContext();
  const listRef = useRef<HTMLDivElement>(null);

  const variantStyles = {
    line: 'border-b border-dark-700',
    pills: 'bg-dark-800 p-1 rounded-lg',
    enclosed: 'border border-dark-700 rounded-lg p-1',
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn(
        'relative flex',
        variantStyles[variant],
        className
      )}
    >
      {children}

      {/* Animated Indicator */}
      {showIndicator && variant === 'line' && (
        <div
          className={cn(
            'absolute bottom-0 left-0 h-0.5 bg-primary-500',
            'transition-all duration-200 ease-out'
          )}
          style={indicatorStyle}
        />
      )}
    </div>
  );
}

// ============================================================================
// Tab Component
// ============================================================================

export interface TabProps {
  /** Unique value for the tab */
  value: string;
  /** Tab content (usually text) */
  children: React.ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Icon to display before the text */
  icon?: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Variant style (should match TabList) */
  variant?: 'line' | 'pills' | 'enclosed';
}

export function Tab({
  value,
  children,
  disabled = false,
  icon,
  className,
  variant = 'line',
}: TabProps) {
  const { activeTab, setActiveTab, registerTab, updateIndicator } = useTabContext();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isActive = activeTab === value;

  // Register tab on mount
  useEffect(() => {
    registerTab(value);
  }, [registerTab, value]);

  // Update indicator when active
  useEffect(() => {
    if (isActive) {
      updateIndicator(buttonRef.current, value);
    }
  }, [isActive, updateIndicator, value]);

  // Also update on ref mount
  useEffect(() => {
    updateIndicator(buttonRef.current, value);
  }, [updateIndicator, value]);

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  const baseStyles = cn(
    'flex items-center gap-2 font-medium',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

  const variantStyles = {
    line: cn(
      'px-4 py-3 -mb-px text-sm',
      isActive ? 'text-primary-500' : 'text-gray-400 hover:text-gray-300'
    ),
    pills: cn(
      'px-4 py-2 rounded-md text-sm',
      isActive
        ? 'bg-primary-600 text-white'
        : 'text-gray-400 hover:text-gray-300 hover:bg-dark-700'
    ),
    enclosed: cn(
      'px-4 py-2 rounded-md text-sm',
      isActive
        ? 'bg-dark-700 text-white'
        : 'text-gray-400 hover:text-gray-300 hover:bg-dark-700/50'
    ),
  };

  return (
    <button
      ref={buttonRef}
      role="tab"
      type="button"
      id={`tab-${value}`}
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      className={cn(baseStyles, variantStyles[variant], className)}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}

// ============================================================================
// TabPanel Component
// ============================================================================

export interface TabPanelProps {
  /** Value matching the corresponding Tab */
  value: string;
  /** Panel content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Whether to keep panel mounted when inactive */
  keepMounted?: boolean;
}

export function TabPanel({
  value,
  children,
  className,
  keepMounted = false,
}: TabPanelProps) {
  const { activeTab } = useTabContext();
  const isActive = activeTab === value;

  if (!isActive && !keepMounted) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!isActive}
      className={cn(
        'focus:outline-none',
        isActive ? 'animate-fade-in' : '',
        className
      )}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

// ============================================================================
// TabPanels Container Component
// ============================================================================

export interface TabPanelsProps {
  /** TabPanel children */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

export function TabPanels({ children, className }: TabPanelsProps) {
  return <div className={cn('mt-4', className)}>{children}</div>;
}

// ============================================================================
// Convenience Component - All in one
// ============================================================================

export interface SimpleTabsProps {
  /** Tab configuration */
  tabs: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    content: React.ReactNode;
  }>;
  /** Default active tab */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Tab list variant */
  variant?: 'line' | 'pills' | 'enclosed';
  /** Additional class name */
  className?: string;
  /** Tab list class name */
  tabListClassName?: string;
  /** Tab panel class name */
  tabPanelClassName?: string;
}

export function SimpleTabs({
  tabs,
  defaultValue,
  value,
  onChange,
  variant = 'line',
  className,
  tabListClassName,
  tabPanelClassName,
}: SimpleTabsProps) {
  const firstTab = tabs[0]?.value;

  return (
    <Tabs
      defaultValue={defaultValue || firstTab}
      value={value}
      onChange={onChange}
      className={className}
    >
      <TabList variant={variant} className={tabListClassName}>
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            icon={tab.icon}
            disabled={tab.disabled}
            variant={variant}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>

      <TabPanels className={tabPanelClassName}>
        {tabs.map((tab) => (
          <TabPanel key={tab.value} value={tab.value}>
            {tab.content}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}

export default Tabs;
