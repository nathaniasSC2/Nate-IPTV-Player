import React, { forwardRef, useState, useId } from 'react';
import { cn } from '@/utils/cn';
import { Eye, EyeOff, Search, X } from 'lucide-react';

// ============================================================================
// Input Component
// ============================================================================

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Error message (shows error state when present) */
  error?: string;
  /** Icon to display at the start */
  leftIcon?: React.ReactNode;
  /** Icon to display at the end */
  rightIcon?: React.ReactNode;
  /** Input size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Input variant */
  variant?: 'default' | 'filled' | 'flushed';
  /** Whether the input takes full width */
  fullWidth?: boolean;
  /** Container class name */
  containerClassName?: string;
  /** Label class name */
  labelClassName?: string;
}

const inputSizes = {
  sm: 'h-8 text-xs px-3',
  md: 'h-10 text-sm px-4',
  lg: 'h-12 text-base px-4',
};

const inputVariants = {
  default: cn(
    'bg-dark-800 border border-dark-600',
    'focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
    'hover:border-dark-500'
  ),
  filled: cn(
    'bg-dark-700 border border-transparent',
    'focus:bg-dark-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
    'hover:bg-dark-600'
  ),
  flushed: cn(
    'bg-transparent border-b border-dark-600 rounded-none px-0',
    'focus:border-primary-500',
    'hover:border-dark-500'
  ),
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      size = 'md',
      variant = 'default',
      fullWidth = false,
      containerClassName,
      labelClassName,
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = !!error;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium text-gray-300',
              disabled && 'opacity-50',
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              // Base styles
              'w-full rounded-lg outline-none',
              'text-white placeholder:text-gray-500',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Size
              inputSizes[size],
              // Variant
              inputVariants[variant],
              // Error state
              hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              // Icons padding
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// Password Input Component
// ============================================================================

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  /** Custom show password icon */
  showIcon?: React.ReactNode;
  /** Custom hide password icon */
  hideIcon?: React.ReactNode;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showIcon, hideIcon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => setShowPassword(!showPassword);

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            onClick={toggleVisibility}
            className="text-gray-400 hover:text-gray-300 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword
              ? hideIcon || <EyeOff className="w-4 h-4" />
              : showIcon || <Eye className="w-4 h-4" />}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

// ============================================================================
// Search Input Component
// ============================================================================

export interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  /** Callback when the clear button is clicked */
  onClear?: () => void;
  /** Whether to show the clear button */
  showClearButton?: boolean;
  /** Custom search icon */
  searchIcon?: React.ReactNode;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { onClear, showClearButton = true, searchIcon, value, onChange, ...props },
    ref
  ) => {
    const hasValue = value !== undefined && value !== '';

    const handleClear = () => {
      onClear?.();
      // Create a synthetic event to clear the input
      if (onChange) {
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={onChange}
        leftIcon={searchIcon || <Search className="w-4 h-4" />}
        rightIcon={
          showClearButton && hasValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-300 transition-colors"
              tabIndex={-1}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : undefined
        }
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ============================================================================
// Textarea Component
// ============================================================================

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Textarea label */
  label?: string;
  /** Helper text below the textarea */
  helperText?: string;
  /** Error message (shows error state when present) */
  error?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the textarea takes full width */
  fullWidth?: boolean;
  /** Whether to auto-resize based on content */
  autoResize?: boolean;
  /** Container class name */
  containerClassName?: string;
  /** Label class name */
  labelClassName?: string;
}

const textareaSizes = {
  sm: 'text-xs p-3 min-h-[80px]',
  md: 'text-sm p-4 min-h-[100px]',
  lg: 'text-base p-4 min-h-[120px]',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      size = 'md',
      fullWidth = false,
      autoResize = false,
      containerClassName,
      labelClassName,
      className,
      disabled,
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const hasError = !!error;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
      onChange?.(e);
    };

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'text-sm font-medium text-gray-300',
              disabled && 'opacity-50',
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          onChange={handleChange}
          className={cn(
            // Base styles
            'w-full rounded-lg outline-none resize-y',
            'bg-dark-800 border border-dark-600',
            'text-white placeholder:text-gray-500',
            'transition-all duration-200',
            'focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
            'hover:border-dark-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Size
            textareaSizes[size],
            // Error state
            hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            // Auto resize
            autoResize && 'resize-none overflow-hidden',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />

        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================================================
// Form Field Wrapper Component
// ============================================================================

export interface FormFieldProps {
  /** Field label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Children input element */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

export function FormField({
  label,
  helperText,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}

export default Input;
