import React, { Component, ErrorInfo, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

// ============================================================================
// Error Boundary Component
// ============================================================================

export interface ErrorBoundaryProps {
  /** Children to render */
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to reset on route change (requires key prop update) */
  resetOnRouteChange?: boolean;
  /** Key to trigger reset when changed */
  resetKey?: string | number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state when resetKey changes (e.g., on route change)
    if (
      this.state.hasError &&
      this.props.resetKey !== undefined &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Custom fallback as ReactNode
      if (fallback && typeof fallback !== 'function') {
        return fallback;
      }

      // Custom fallback as render function
      if (typeof fallback === 'function') {
        return fallback(error, this.resetError);
      }

      // Default fallback
      return (
        <ErrorFallback
          error={error}
          errorInfo={this.state.errorInfo}
          onReset={this.resetError}
        />
      );
    }

    return children;
  }
}

// ============================================================================
// Error Fallback Component
// ============================================================================

export interface ErrorFallbackProps {
  /** The error that was thrown */
  error: Error;
  /** Error information from React */
  errorInfo?: ErrorInfo | null;
  /** Callback to reset the error state */
  onReset?: () => void;
  /** Callback to navigate home */
  onGoHome?: () => void;
  /** Title to display */
  title?: string;
  /** Description to display */
  description?: string;
  /** Whether to show error details */
  showDetails?: boolean;
  /** Additional class name */
  className?: string;
}

export function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onGoHome,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  showDetails = true,
  className,
}: ErrorFallbackProps) {
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      // Default behavior: navigate to home
      window.location.href = '/';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] p-8',
        'bg-dark-900 text-white',
        className
      )}
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>

      {/* Description */}
      <p className="text-gray-400 text-center max-w-md mb-6">{description}</p>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mb-6">
        {onReset && (
          <button
            onClick={onReset}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg',
              'bg-primary-600 hover:bg-primary-700 text-white',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
        <button
          onClick={handleGoHome}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg',
            'bg-dark-700 hover:bg-dark-600 text-gray-300',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-dark-900'
          )}
        >
          <Home className="w-4 h-4" />
          Go Home
        </button>
      </div>

      {/* Error Details (Collapsible) */}
      {showDetails && (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className={cn(
              'flex items-center justify-center gap-2 w-full py-2',
              'text-sm text-gray-500 hover:text-gray-400',
              'transition-colors duration-200'
            )}
          >
            {detailsOpen ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide error details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show error details
              </>
            )}
          </button>

          {detailsOpen && (
            <div className="mt-4 p-4 bg-dark-800 rounded-lg overflow-auto">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-red-400 mb-1">Error Message</h3>
                <p className="text-sm text-gray-300 font-mono">{error.message}</p>
              </div>

              {error.stack && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-1">Stack Trace</h3>
                  <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap overflow-x-auto">
                    {error.stack}
                  </pre>
                </div>
              )}

              {errorInfo?.componentStack && (
                <div>
                  <h3 className="text-sm font-semibold text-red-400 mb-1">Component Stack</h3>
                  <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap overflow-x-auto">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Error Message Component (Inline errors)
// ============================================================================

export interface ErrorMessageProps {
  /** Error message to display */
  message: string;
  /** Title for the error */
  title?: string;
  /** Callback to retry */
  onRetry?: () => void;
  /** Additional class name */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const errorSizes = {
  sm: {
    container: 'p-3',
    icon: 'w-4 h-4',
    title: 'text-sm',
    message: 'text-xs',
    button: 'text-xs px-2 py-1',
  },
  md: {
    container: 'p-4',
    icon: 'w-5 h-5',
    title: 'text-base',
    message: 'text-sm',
    button: 'text-sm px-3 py-1.5',
  },
  lg: {
    container: 'p-6',
    icon: 'w-6 h-6',
    title: 'text-lg',
    message: 'text-base',
    button: 'text-base px-4 py-2',
  },
};

export function ErrorMessage({
  message,
  title,
  onRetry,
  className,
  size = 'md',
}: ErrorMessageProps) {
  const sizeStyles = errorSizes[size];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg',
        'bg-red-500/10 border border-red-500/20',
        sizeStyles.container,
        className
      )}
      role="alert"
    >
      <AlertTriangle className={cn('text-red-500 flex-shrink-0 mt-0.5', sizeStyles.icon)} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn('font-semibold text-red-400 mb-1', sizeStyles.title)}>
            {title}
          </h4>
        )}
        <p className={cn('text-red-300/80', sizeStyles.message)}>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'mt-2 rounded flex items-center gap-1',
              'bg-red-500/20 hover:bg-red-500/30 text-red-400',
              'transition-colors duration-200',
              sizeStyles.button
            )}
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Not Found Component
// ============================================================================

export interface NotFoundProps {
  /** Title to display */
  title?: string;
  /** Description to display */
  description?: string;
  /** Callback to go back */
  onGoBack?: () => void;
  /** Callback to go home */
  onGoHome?: () => void;
  /** Additional class name */
  className?: string;
}

export function NotFound({
  title = 'Page Not Found',
  description = 'The page you are looking for does not exist or has been moved.',
  onGoBack,
  onGoHome,
  className,
}: NotFoundProps) {
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] p-8',
        'bg-dark-900 text-white',
        className
      )}
    >
      {/* 404 Text */}
      <div className="text-8xl font-bold text-primary-500/30 mb-4">404</div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>

      {/* Description */}
      <p className="text-gray-400 text-center max-w-md mb-6">{description}</p>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGoBack}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg',
            'bg-dark-700 hover:bg-dark-600 text-gray-300',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-dark-900'
          )}
        >
          Go Back
        </button>
        <button
          onClick={handleGoHome}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg',
            'bg-primary-600 hover:bg-primary-700 text-white',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900'
          )}
        >
          <Home className="w-4 h-4" />
          Go Home
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
