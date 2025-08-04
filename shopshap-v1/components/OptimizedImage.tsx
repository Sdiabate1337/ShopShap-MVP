/**
 * OptimizedImage - Component d'image optimisé pour les utilisateurs mobiles africains
 * Features:
 * - Lazy loading intelligent avec placeholder animé
 * - Formats WebP/AVIF avec fallback
 * - Sizes responsives pour économiser la bande passante
 * - Préchargement des images critiques
 * - Gestion d'erreur avec image de fallback
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  sizes?: string;
  // African mobile optimizations
  lowDataMode?: boolean;
  criticalLoading?: boolean;
  fallbackSrc?: string;
  onLoadingComplete?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  priority = false,
  className = '',
  objectFit = 'cover',
  quality = 75, // Reduced for mobile data savings
  placeholder = 'empty',
  sizes,
  lowDataMode = false,
  criticalLoading = false,
  fallbackSrc = '/images/placeholder.jpg',
  onLoadingComplete,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority || criticalLoading);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || criticalLoading || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: lowDataMode ? '50px' : '200px', // Smaller margin for low data mode
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, criticalLoading, isVisible, lowDataMode]);

  // Generate optimized sizes for African mobile users
  const getOptimizedSizes = () => {
    if (sizes) return sizes;
    
    // Default responsive sizes optimized for mobile-first
    return lowDataMode 
      ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
      : '(max-width: 480px) 100vw, (max-width: 768px) 75vw, (max-width: 1200px) 50vw, 33vw';
  };

  // Adjust quality based on connection
  const getOptimizedQuality = () => {
    if (lowDataMode) return Math.max(40, quality - 25); // Much lower quality for data saving
    return quality;
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoadingComplete?.();
  };

  const handleError = () => {
    console.warn(`Failed to load image: ${currentSrc}`);
    setHasError(true);
    setIsLoading(false);
    
    // Try fallback image
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
    
    onError?.();
  };

  // Loading placeholder component
  const LoadingPlaceholder = () => (
    <div 
      className={`
        relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 
        ${className}
        animate-pulse
      `}
      style={{ width, height }}
      aria-label={`Chargement de ${alt}`}
    >
      {/* Animated loading background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      
      {/* Loading icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <svg 
            className="w-8 h-8 text-gray-600 animate-spin" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          
          {/* Connection indicator for low data mode */}
          {lowDataMode && (
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>
      
      {/* Data saving indicator */}
      {lowDataMode && (
        <div className="absolute bottom-2 left-2 bg-orange-500/90 text-white text-xs px-2 py-1 rounded">
          Mode économique
        </div>
      )}
    </div>
  );

  // Error placeholder component
  const ErrorPlaceholder = () => (
    <div 
      className={`
        relative overflow-hidden bg-gradient-to-br from-red-900/20 to-gray-900 
        border border-red-500/20 ${className}
      `}
      style={{ width, height }}
      aria-label={`Erreur de chargement pour ${alt}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400">
        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span className="text-xs text-center px-2">
          Image non disponible
        </span>
      </div>
    </div>
  );

  return (
    <div ref={imgRef} className="relative">
      {/* Show loading placeholder while image loads */}
      {isLoading && !hasError && <LoadingPlaceholder />}
      
      {/* Show error placeholder if image failed to load */}
      {hasError && <ErrorPlaceholder />}
      
      {/* Actual optimized image */}
      {isVisible && !hasError && (
        <Image
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority || criticalLoading}
          quality={getOptimizedQuality()}
          sizes={getOptimizedSizes()}
          className={`
            transition-opacity duration-500 
            ${isLoading ? 'opacity-0' : 'opacity-100'} 
            ${className}
          `}
          style={{ objectFit }}
          placeholder={placeholder}
          onLoad={handleLoad}
          onError={handleError}
          // Optimizations for African mobile users
          loading={priority || criticalLoading ? 'eager' : 'lazy'}
          decoding="async"
          // Add loading="lazy" and decoding="async" for better mobile performance
        />
      )}
      
      {/* Connection status indicator */}
      {lowDataMode && !isLoading && !hasError && (
        <div className="absolute top-2 right-2 bg-orange-500/90 text-white text-xs px-2 py-1 rounded-full">
          <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          3G
        </div>
      )}
    </div>
  );
}

// Hook for detecting connection quality
export function useConnectionQuality() {
  const [isLowData, setIsLowData] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for Network Information API (mainly on mobile)
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

    if (connection) {
      const updateConnection = () => {
        const type = connection.effectiveType || connection.type || 'unknown';
        setConnectionType(type);
        
        // Consider 2G, slow-2g, or specific conditions as low data
        const isLowDataConnection = [
          'slow-2g', '2g', 'cellular'
        ].includes(type) || connection.saveData === true;
        
        setIsLowData(isLowDataConnection);
      };

      updateConnection();
      connection.addEventListener('change', updateConnection);

      return () => {
        connection.removeEventListener('change', updateConnection);
      };
    }

    // Fallback: check for data saver API
    if ('connection' in navigator && 'saveData' in (navigator as any).connection) {
      setIsLowData((navigator as any).connection.saveData);
    }
  }, []);

  return { isLowData, connectionType };
}

// Utility function to preload critical images
export function preloadCriticalImages(imageSources: string[]) {
  if (typeof window === 'undefined') return;

  imageSources.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    // Add WebP support check
    if (supportsWebP()) {
      link.type = 'image/webp';
    }
    document.head.appendChild(link);
  });
}

// Check WebP support
function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}