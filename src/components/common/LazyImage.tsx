import React, { useState, useCallback, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/utils/cn';

export interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  /** Image source URL */
  src: string;
  /** Alt text for the image */
  alt: string;
  /** Custom placeholder component or element */
  placeholder?: React.ReactNode;
  /** Custom fallback component or element */
  fallback?: React.ReactNode;
  /** Background color for fallback (defaults to primary) */
  fallbackBgColor?: string;
  /** Text color for fallback initials */
  fallbackTextColor?: string;
  /** Class name for the container */
  containerClassName?: string;
  /** Aspect ratio (e.g., "16/9", "1/1", "4/3") */
  aspectRatio?: string;
  /** Whether to show a blur placeholder */
  blur?: boolean;
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
}

type ImageState = 'idle' | 'loading' | 'loaded' | 'error';

export function LazyImage({
  src,
  alt,
  placeholder,
  fallback,
  fallbackBgColor = 'bg-primary-600',
  fallbackTextColor = 'text-white',
  containerClassName,
  aspectRatio,
  blur = true,
  threshold = 0.1,
  rootMargin = '100px',
  className,
  onLoad,
  onError,
  ...imgProps
}: LazyImageProps) {
  const [imageState, setImageState] = useState<ImageState>('idle');

  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  const handleLoad = useCallback(() => {
    setImageState('loaded');
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageState('error');
    onError?.();
  }, [onError]);

  // Generate initials from alt text (first 2 letters)
  const initials = useMemo(() => {
    if (!alt) return '??';
    const words = alt.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return alt.slice(0, 2).toUpperCase();
  }, [alt]);

  // Start loading when in view
  const shouldLoad = inView && imageState === 'idle';
  if (shouldLoad) {
    setImageState('loading');
  }

  const isLoading = imageState === 'idle' || imageState === 'loading';
  const hasError = imageState === 'error';
  const isLoaded = imageState === 'loaded';

  // Render fallback with initials
  const renderFallback = () => {
    if (fallback) {
      return fallback;
    }

    return (
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          fallbackBgColor,
          fallbackTextColor
        )}
      >
        <span className="text-lg font-semibold select-none">
          {initials}
        </span>
      </div>
    );
  };

  // Render placeholder
  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <div
        className={cn(
          'absolute inset-0 bg-dark-700 animate-pulse',
          blur && 'backdrop-blur-sm'
        )}
      />
    );
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden bg-dark-800',
        aspectRatio && `aspect-[${aspectRatio}]`,
        containerClassName
      )}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Placeholder - shown while loading */}
      {isLoading && renderPlaceholder()}

      {/* Error fallback - shown on error */}
      {hasError && renderFallback()}

      {/* Image - hidden until loaded */}
      {(inView || imageState !== 'idle') && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading="lazy"
          decoding="async"
          {...imgProps}
        />
      )}
    </div>
  );
}

// Presets for common use cases
export function ChannelLogo({
  src,
  name,
  className,
  ...props
}: {
  src: string;
  name: string;
  className?: string;
} & Omit<LazyImageProps, 'alt' | 'src'>) {
  return (
    <LazyImage
      src={src}
      alt={name}
      aspectRatio="1/1"
      containerClassName={cn('rounded-lg', className)}
      className="object-contain p-1"
      fallbackBgColor="bg-dark-700"
      {...props}
    />
  );
}

export function MoviePoster({
  src,
  title,
  className,
  ...props
}: {
  src: string;
  title: string;
  className?: string;
} & Omit<LazyImageProps, 'alt' | 'src'>) {
  return (
    <LazyImage
      src={src}
      alt={title}
      aspectRatio="2/3"
      containerClassName={cn('rounded-lg', className)}
      {...props}
    />
  );
}

export function SeriesPoster({
  src,
  title,
  className,
  ...props
}: {
  src: string;
  title: string;
  className?: string;
} & Omit<LazyImageProps, 'alt' | 'src'>) {
  return (
    <LazyImage
      src={src}
      alt={title}
      aspectRatio="2/3"
      containerClassName={cn('rounded-lg', className)}
      {...props}
    />
  );
}

export function Thumbnail({
  src,
  title,
  className,
  ...props
}: {
  src: string;
  title: string;
  className?: string;
} & Omit<LazyImageProps, 'alt' | 'src'>) {
  return (
    <LazyImage
      src={src}
      alt={title}
      aspectRatio="16/9"
      containerClassName={cn('rounded-lg', className)}
      {...props}
    />
  );
}

export default LazyImage;
