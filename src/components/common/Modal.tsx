import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';
import { useFocusTrap, VisuallyHidden } from './SkipLink';

// ============================================================================
// Modal Component
// ============================================================================

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Footer content (buttons, etc.) */
  footer?: React.ReactNode;
  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the modal */
  closeOnEscape?: boolean;
  /** Additional class name for the modal content */
  className?: string;
  /** Additional class name for the backdrop */
  backdropClassName?: string;
  /** Whether to center the modal vertically */
  centered?: boolean;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Description for screen readers */
  ariaDescription?: string;
  /** ID for external aria-describedby reference */
  ariaDescribedBy?: string;
}

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[90vw] max-h-[90vh]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  backdropClassName,
  centered = true,
  showHeader = true,
  ariaDescription,
  ariaDescribedBy,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const descriptionId = ariaDescribedBy || (ariaDescription ? 'modal-description' : undefined);

  // Use focus trap hook
  useFocusTrap(modalRef, isOpen);

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  // Focus management and scroll lock
  useEffect(() => {
    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the first focusable element or the modal itself
      requestAnimationFrame(() => {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current?.focus();
        }
      });

      // Add escape key listener
      document.addEventListener('keydown', handleKeyDown);

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;

        // Restore focus to previous element
        requestAnimationFrame(() => {
          previousActiveElement.current?.focus();
        });
      };
    }
  }, [isOpen, handleKeyDown]);

  // Don't render if not open
  if (!isOpen) return null;

  // Portal target
  const portalTarget = document.body;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 overflow-y-auto',
        'animate-fade-in'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={descriptionId}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm',
          'transition-opacity duration-200',
          backdropClassName
        )}
        onClick={handleBackdropClick}
      />

      {/* Modal Container */}
      <div
        className={cn(
          'fixed inset-0 overflow-y-auto',
          'flex min-h-full p-4',
          centered ? 'items-center justify-center' : 'items-start justify-center pt-16'
        )}
        onClick={handleBackdropClick}
      >
        {/* Modal Content */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className={cn(
            'relative w-full',
            'bg-dark-800 rounded-xl shadow-2xl',
            'transform transition-all duration-200',
            'animate-zoom-in',
            modalSizes[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {showHeader && (title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-white"
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={cn(
                    'p-1.5 rounded-lg',
                    'text-gray-400 hover:text-white',
                    'hover:bg-dark-700',
                    'transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    !title && 'ml-auto'
                  )}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Screen Reader Description */}
          {ariaDescription && !ariaDescribedBy && (
            <VisuallyHidden id="modal-description">
              {ariaDescription}
            </VisuallyHidden>
          )}

          {/* Body */}
          <div className="px-6 py-4 text-gray-300">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-700">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    portalTarget
  );
}

// ============================================================================
// Confirm Modal Component
// ============================================================================

export interface ConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Modal title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Variant for the confirm button */
  variant?: 'primary' | 'danger';
  /** Whether the confirm action is loading */
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmModalProps) {
  const confirmButtonClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 rounded-lg',
              'bg-dark-700 hover:bg-dark-600 text-gray-300',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 rounded-lg',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              confirmButtonClasses[variant]
            )}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </>
      }
    >
      <p className="text-gray-400">{message}</p>
    </Modal>
  );
}

// ============================================================================
// Alert Modal Component
// ============================================================================

export interface AlertModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Alert message */
  message: string;
  /** Button text */
  buttonText?: string;
  /** Alert type */
  type?: 'info' | 'success' | 'warning' | 'error';
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'OK',
  type = 'info',
}: AlertModalProps) {
  const typeColors = {
    info: 'text-primary-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <button
          onClick={onClose}
          className={cn(
            'px-4 py-2 rounded-lg',
            'bg-primary-600 hover:bg-primary-700 text-white',
            'transition-colors duration-200'
          )}
        >
          {buttonText}
        </button>
      }
    >
      <p className={cn('text-gray-400', typeColors[type])}>{message}</p>
    </Modal>
  );
}

// ============================================================================
// Drawer Component (Side Modal)
// ============================================================================

export interface DrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when the drawer should close */
  onClose: () => void;
  /** Drawer title */
  title?: string;
  /** Drawer content */
  children: React.ReactNode;
  /** Position of the drawer */
  position?: 'left' | 'right';
  /** Width of the drawer */
  width?: string;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Additional class name */
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  width = '320px',
  showCloseButton = true,
  className,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Use focus trap
  useFocusTrap(drawerRef, isOpen);

  // Handle escape key and focus management
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus first focusable element
      requestAnimationFrame(() => {
        const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      });

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';

      // Restore focus
      if (isOpen) {
        requestAnimationFrame(() => {
          previousActiveElement.current?.focus();
        });
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 bottom-0 h-full bg-dark-800 shadow-2xl',
          'transform transition-transform duration-300 ease-out',
          'flex flex-col',
          position === 'left' ? 'left-0' : 'right-0',
          isOpen
            ? 'translate-x-0'
            : position === 'left'
            ? '-translate-x-full'
            : 'translate-x-full',
          className
        )}
        style={{ width }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
            {title && (
              <h2 id="drawer-title" className="text-lg font-semibold text-white">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'p-1.5 rounded-lg',
                  'text-gray-400 hover:text-white',
                  'hover:bg-dark-700',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  !title && 'ml-auto'
                )}
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
