'use client';

import { useState, useRef, useEffect, memo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

// Optimized Image Component with progressive loading and blur placeholders
const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  placeholder = 'blur',
  blurDataURL,
  sizes,
  quality = 85,
  onLoad,
  onError,
  fallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [loading]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error with fallback
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
      onError?.();
    }
  };

  // Generate blur placeholder
  const getBlurPlaceholder = () => {
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple blur placeholder
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
        <circle cx="50%" cy="40%" r="15%" fill="#d1d5db" opacity="0.5" />
        <rect x="20%" y="65%" width="60%" height="8%" fill="#d1d5db" opacity="0.3" rx="4" />
        <rect x="20%" y="75%" width="40%" height="6%" fill="#d1d5db" opacity="0.2" rx="3" />
      </svg>
    `)}`;
  };

  // Optimize image URL (add compression parameters if Supabase)
  const getOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc || hasError) return fallbackSrc;
    
    // If it's a Supabase signed URL, add optimization parameters
    if (originalSrc.includes('supabase.co') && originalSrc.includes('/storage/v1/object/sign/')) {
      const url = new URL(originalSrc);
      
      // Add image optimization parameters
      if (width) url.searchParams.set('width', width.toString());
      if (height) url.searchParams.set('height', height.toString());
      if (quality) url.searchParams.set('quality', quality.toString());
      url.searchParams.set('format', 'webp');
      
      return url.toString();
    }
    
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(currentSrc);
  const showPlaceholder = placeholder === 'blur' && !isLoaded && !hasError;

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Blur Placeholder */}
      {showPlaceholder && (
        <img
          src={getBlurPlaceholder()}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 transition-opacity duration-300"
          style={{
            opacity: isLoaded ? 0 : 1,
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      )}

      {/* Main Image */}
      {(isInView || loading === 'eager') && (
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          sizes={sizes}
          loading={loading}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            aspectRatio: width && height ? `${width} / ${height}` : undefined,
          }}
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-500">
          <svg className="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM17 13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 17.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"/>
          </svg>
          <span className="text-xs text-center">Image non disponible</span>
        </div>
      )}

      {/* Loading Progress Indicator */}
      {!isLoaded && !hasError && isInView && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="h-1 bg-gray-300 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  );
});

// Hook for optimized image preloading
export function useImagePreloader(sources: string[]) {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const preloadImage = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setPreloadedImages(prev => new Set([...prev, src]));
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    };

    // Preload images with staggered delay to avoid overwhelming the browser
    sources.forEach((src, index) => {
      setTimeout(() => {
        preloadImage(src).catch(() => {
          // Silent fail for preloading
        });
      }, index * 100);
    });
  }, [sources]);

  return preloadedImages;
}

// Progressive Image Gallery Component
export const ProgressiveImageGallery = memo(function ProgressiveImageGallery({
  images,
  className = '',
  imageClassName = '',
  columns = 3,
  gap = 4
}: {
  images: Array<{ src: string; alt: string; width?: number; height?: number }>;
  className?: string;
  imageClassName?: string;
  columns?: number;
  gap?: number;
}) {
  const preloadedImages = useImagePreloader(images.slice(0, 6).map(img => img.src));

  return (
    <div 
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`
      }}
    >
      {images.map((image, index) => (
        <OptimizedImage
          key={`${image.src}-${index}`}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className={imageClassName}
          loading={index < 6 ? 'eager' : 'lazy'}
          placeholder="blur"
          sizes={`(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${100 / columns}vw`}
        />
      ))}
    </div>
  );
});

export default OptimizedImage;