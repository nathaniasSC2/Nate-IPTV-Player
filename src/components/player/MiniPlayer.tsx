/**
 * MiniPlayer Component
 * Picture-in-picture mini player with drag and resize functionality
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Hls from 'hls.js';
import { cn } from '@/utils/cn';
import { usePlayerStore } from '@/stores';
import {
  Play,
  Pause,
  X,
  Maximize2,
  GripHorizontal,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface MiniPlayerProps {
  onExpand: () => void;
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

// ============================================
// Constants
// ============================================

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 180;
const MIN_WIDTH = 240;
const MIN_HEIGHT = 135;
const MAX_WIDTH = 480;
const MAX_HEIGHT = 270;
const EDGE_PADDING = 16;

// ============================================
// Component
// ============================================

export function MiniPlayer({ onExpand, className }: MiniPlayerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Local state
  const [position, setPosition] = useState<Position>({
    x: window.innerWidth - DEFAULT_WIDTH - EDGE_PADDING,
    y: window.innerHeight - DEFAULT_HEIGHT - EDGE_PADDING,
  });
  const [size, setSize] = useState<Size>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  // Store state
  const currentStream = usePlayerStore((state) => state.currentStream);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isPiP = usePlayerStore((state) => state.isPiP);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const volume = usePlayerStore((state) => state.volume);

  // Store actions
  const { resume, pause, stop, setPiP } = usePlayerStore();

  // ============================================
  // HLS Initialization
  // ============================================

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentStream) return;

    const url = currentStream.url;
    const isHls = url.endsWith('.m3u8') || url.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 10,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying) {
          video.play().catch(console.warn);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      if (isPlaying) {
        video.play().catch(console.warn);
      }
    } else {
      video.src = url;
      if (isPlaying) {
        video.play().catch(console.warn);
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentStream, isPlaying]);

  // Sync play state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) {
      video.play().catch(console.warn);
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = isMuted ? 0 : volume;
    video.muted = isMuted;
  }, [volume, isMuted]);

  // ============================================
  // Drag Handlers
  // ============================================

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(
        EDGE_PADDING,
        Math.min(
          window.innerWidth - size.width - EDGE_PADDING,
          e.clientX - dragOffset.x
        )
      );
      const newY = Math.max(
        EDGE_PADDING,
        Math.min(
          window.innerHeight - size.height - EDGE_PADDING,
          e.clientY - dragOffset.y
        )
      );

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, size]);

  // ============================================
  // Resize Handlers
  // ============================================

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, e.clientX - position.x)
      );
      const newHeight = Math.max(
        MIN_HEIGHT,
        Math.min(MAX_HEIGHT, (newWidth / 16) * 9) // Maintain 16:9 aspect ratio
      );

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, position]);

  // ============================================
  // Window Resize Handler
  // ============================================

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - size.width - EDGE_PADDING),
        y: Math.min(prev.y, window.innerHeight - size.height - EDGE_PADDING),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [size]);

  // ============================================
  // Close Handler
  // ============================================

  const handleClose = useCallback(() => {
    setPiP(false);
    stop();
  }, [setPiP, stop]);

  // ============================================
  // Render
  // ============================================

  if (!isPiP || !currentStream) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed z-50 rounded-lg overflow-hidden',
        'shadow-2xl border border-dark-600',
        'bg-black',
        isDragging && 'cursor-grabbing',
        !isDragging && 'cursor-grab',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        playsInline
        onClick={() => isPlaying ? pause() : resume()}
      />

      {/* Drag Handle */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-8',
          'bg-gradient-to-b from-black/80 to-transparent',
          'flex items-center justify-center',
          'cursor-grab',
          isDragging && 'cursor-grabbing'
        )}
        onMouseDown={handleDragStart}
      >
        <GripHorizontal
          className={cn(
            'w-5 h-5 text-white/50',
            'transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      {/* Controls Overlay */}
      <div
        className={cn(
          'absolute inset-0',
          'flex items-center justify-center',
          'bg-black/40',
          'transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Play/Pause Button */}
        <button
          onClick={() => isPlaying ? pause() : resume()}
          className={cn(
            'flex items-center justify-center',
            'w-12 h-12 rounded-full',
            'bg-white/20 backdrop-blur-sm',
            'hover:bg-white/30',
            'transition-colors'
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-0.5" />
          )}
        </button>
      </div>

      {/* Top Right Controls */}
      <div
        className={cn(
          'absolute top-2 right-2',
          'flex items-center gap-1',
          'transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Expand Button */}
        <button
          onClick={onExpand}
          className={cn(
            'flex items-center justify-center',
            'w-7 h-7 rounded',
            'bg-black/60 hover:bg-black/80',
            'transition-colors'
          )}
          aria-label="Expand to full player"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={cn(
            'flex items-center justify-center',
            'w-7 h-7 rounded',
            'bg-black/60 hover:bg-red-600',
            'transition-colors'
          )}
          aria-label="Close mini player"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Channel Name */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0',
          'bg-gradient-to-t from-black/80 to-transparent',
          'px-3 py-2',
          'transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        <p className="text-white text-sm font-medium truncate">
          {currentStream.name}
        </p>
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          'absolute bottom-0 right-0',
          'w-6 h-6',
          'cursor-se-resize',
          'transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
        onMouseDown={handleResizeStart}
      >
        <svg
          className="w-full h-full text-white/50"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
        </svg>
      </div>
    </div>
  );
}

export default MiniPlayer;
