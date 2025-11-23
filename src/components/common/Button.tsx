import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Spinner } from './LoadingStates';
import { VisuallyHidden } from './SkipLink';

// ============================================================================
// Button Component
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'link';
  /** Button size */
  size?: 'sm' | 'md' | 'lg' | 'icon';
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Loading text to display */
  loadingText?: string;
  /** Icon to display on the left */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right */
  rightIcon?: React.ReactNode;
  /** Whether the button should take full width */
  fullWidth?: boolean;
  /** Whether the button is active/selected */
  isActive?: boolean;
}

const buttonVariants = {
  primary: cn(
    'bg-primary-600 text-white',
    'hover:bg-primary-700',
    'focus:ring-primary-500',
    'disabled:bg-primary-600/50'
  ),
  secondary: cn(
    'bg-dark-700 text-gray-200',
    'hover:bg-dark-600',
    'focus:ring-dark-500',
    'disabled:bg-dark-700/50'
  ),
  ghost: cn(
    'bg-transparent text-gray-300',
    'hover:bg-dark-700 hover:text-white',
    'focus:ring-dark-500',
    'disabled:bg-transparent'
  ),
  danger: cn(
    'bg-red-600 text-white',
    'hover:bg-red-700',
    'focus:ring-red-500',
    'disabled:bg-red-600/50'
  ),
  outline: cn(
    'bg-transparent text-gray-300',
    'border border-dark-600',
    'hover:bg-dark-700 hover:text-white hover:border-dark-500',
    'focus:ring-dark-500',
    'disabled:bg-transparent disabled:border-dark-700'
  ),
  link: cn(
    'bg-transparent text-primary-500',
    'hover:text-primary-400 hover:underline',
    'focus:ring-primary-500',
    'disabled:text-primary-500/50',
    'p-0'
  ),
};

const buttonSizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
  icon: 'h-10 w-10 p-0',
};

const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  icon: 'w-5 h-5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      isActive = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'font-medium rounded-lg',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900',
          'disabled:cursor-not-allowed disabled:opacity-60',
          // Variant styles
          buttonVariants[variant],
          // Size styles
          buttonSizes[size],
          // Full width
          fullWidth && 'w-full',
          // Active state
          isActive && variant === 'ghost' && 'bg-dark-700 text-white',
          isActive && variant === 'secondary' && 'bg-dark-600',
          // Custom classes
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner
              size={size === 'lg' ? 'md' : 'sm'}
              variant={variant === 'ghost' || variant === 'outline' ? 'gray' : 'white'}
              aria-hidden="true"
            />
            {loadingText ? (
              <span>{loadingText}</span>
            ) : (
              <VisuallyHidden>Loading...</VisuallyHidden>
            )}
            {/* Live region announcement for screen readers */}
            <span
              role="status"
              aria-live="polite"
              className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)]"
            >
              {loadingText || 'Loading, please wait'}
            </span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className={cn('flex-shrink-0', iconSizes[size])} aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className={cn('flex-shrink-0', iconSizes[size])} aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// Icon Button Component
// ============================================================================

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  /** Icon to display */
  icon: React.ReactNode;
  /** Accessible label for the button */
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className, ...props }, ref) => {
    const iconButtonSizes = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      icon: 'h-10 w-10',
    };

    return (
      <Button
        ref={ref}
        size="icon"
        className={cn(iconButtonSizes[size], className)}
        {...props}
      >
        <span className={iconSizes[size]} aria-hidden="true">{icon}</span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ============================================================================
// Button Group Component
// ============================================================================

export interface ButtonGroupProps {
  /** Children buttons */
  children: React.ReactNode;
  /** Whether buttons should be attached */
  attached?: boolean;
  /** Size for all buttons */
  size?: ButtonProps['size'];
  /** Variant for all buttons */
  variant?: ButtonProps['variant'];
  /** Additional class name */
  className?: string;
}

export function ButtonGroup({
  children,
  attached = false,
  size,
  variant,
  className,
}: ButtonGroupProps) {
  const childrenWithProps = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;

    const isFirst = index === 0;
    const isLast = index === React.Children.count(children) - 1;

    return React.cloneElement(child as React.ReactElement<ButtonProps>, {
      size: size || (child.props as ButtonProps).size,
      variant: variant || (child.props as ButtonProps).variant,
      className: cn(
        (child.props as ButtonProps).className,
        attached && !isFirst && 'rounded-l-none border-l-0',
        attached && !isLast && 'rounded-r-none'
      ),
    });
  });

  return (
    <div className={cn('inline-flex', attached ? '' : 'gap-2', className)}>
      {childrenWithProps}
    </div>
  );
}

// ============================================================================
// Toggle Button Component
// ============================================================================

export interface ToggleButtonProps extends Omit<ButtonProps, 'isActive'> {
  /** Whether the toggle is on */
  isToggled: boolean;
  /** Callback when toggled */
  onToggle: (toggled: boolean) => void;
}

export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ isToggled, onToggle, variant = 'ghost', onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onToggle(!isToggled);
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        isActive={isToggled}
        onClick={handleClick}
        aria-pressed={isToggled}
        {...props}
      />
    );
  }
);

ToggleButton.displayName = 'ToggleButton';

// ============================================================================
// Close Button Component
// ============================================================================

export interface CloseButtonProps extends Omit<IconButtonProps, 'icon' | 'aria-label'> {
  /** Custom aria-label */
  'aria-label'?: string;
}

export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ 'aria-label': ariaLabel = 'Close', variant = 'ghost', size = 'sm', ...props }, ref) => {
    return (
      <IconButton
        ref={ref}
        variant={variant}
        size={size}
        aria-label={ariaLabel}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        }
        {...props}
      />
    );
  }
);

CloseButton.displayName = 'CloseButton';

export default Button;
