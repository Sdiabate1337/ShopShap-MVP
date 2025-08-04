'use client';

import { useEffect, useCallback, useRef } from 'react';

// Types pour les métriques de performance
interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  loadTime?: number;
  domContentLoaded?: number;
}

// Interface pour les événements analytics
interface AnalyticsEvent {
  name: string;
  data: Record<string, any>;
  timestamp: number;
  url: string;
  userAgent: string;
}

// ✅ Hook pour le monitoring des Core Web Vitals
export function usePerformanceMonitoring() {
  const metricsRef = useRef<PerformanceMetrics>({});
  const isMonitoringRef = useRef(false);

  // Envoyer les métriques vers analytics
  const sendMetrics = useCallback((metrics: PerformanceMetrics) => {
    // Service Worker message pour analytics
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ANALYTICS_EVENT',
        data: {
          type: 'performance',
          metrics,
          url: window.location.href,
          timestamp: Date.now()
        }
      });
    }

    // Console log pour development
    console.log('📊 Performance Metrics:', metrics);
  }, []);

  // Observer pour les métriques Web Vitals
  const observeWebVitals = useCallback(() => {
    // FCP - First Contentful Paint
    const observeFCP = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              metricsRef.current.fcp = entry.startTime;
              console.log('🎨 FCP:', entry.startTime.toFixed(2), 'ms');
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        console.warn('FCP observer not supported');
      }
    };

    // LCP - Largest Contentful Paint
    const observeLCP = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            metricsRef.current.lcp = lastEntry.startTime;
            console.log('🖼️ LCP:', lastEntry.startTime.toFixed(2), 'ms');
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP observer not supported');
      }
    };

    // FID - First Input Delay
    const observeFID = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              const fid = (entry as any).processingStart - entry.startTime;
              metricsRef.current.fid = fid;
              console.log('👆 FID:', fid.toFixed(2), 'ms');
            }
          }
        });
        observer.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('FID observer not supported');
      }
    };

    // CLS - Cumulative Layout Shift
    const observeCLS = () => {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          metricsRef.current.cls = clsValue;
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('CLS observer not supported');
      }
    };

    observeFCP();
    observeLCP();
    observeFID();
    observeCLS();
  }, []);

  // Métriques de navigation
  const observeNavigationMetrics = useCallback(() => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        
        metricsRef.current.ttfb = nav.responseStart - nav.requestStart;
        metricsRef.current.domContentLoaded = nav.domContentLoadedEventEnd - nav.navigationStart;
        metricsRef.current.loadTime = nav.loadEventEnd - nav.navigationStart;

        console.log('⚡ TTFB:', metricsRef.current.ttfb?.toFixed(2), 'ms');
        console.log('📄 DOM Ready:', metricsRef.current.domContentLoaded?.toFixed(2), 'ms');
        console.log('✅ Load Complete:', metricsRef.current.loadTime?.toFixed(2), 'ms');
      }
    }
  }, []);

  // Démarrer le monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoringRef.current || typeof window === 'undefined') return;
    
    isMonitoringRef.current = true;
    
    // Observer les Web Vitals
    observeWebVitals();
    
    // Observer les métriques de navigation après le chargement
    if (document.readyState === 'complete') {
      observeNavigationMetrics();
    } else {
      window.addEventListener('load', observeNavigationMetrics);
    }

    // Envoyer les métriques après 5 secondes
    setTimeout(() => {
      sendMetrics(metricsRef.current);
    }, 5000);
  }, [observeWebVitals, observeNavigationMetrics, sendMetrics]);

  // Arrêter le monitoring
  const stopMonitoring = useCallback(() => {
    isMonitoringRef.current = false;
  }, []);

  return { startMonitoring, stopMonitoring, metrics: metricsRef.current };
}

// ✅ Hook pour tracker les interactions utilisateur
export function useUserInteractionTracking() {
  const clickCountRef = useRef(0);
  const scrollDepthRef = useRef(0);
  const timeOnPageRef = useRef(Date.now());

  const trackClick = useCallback((element: string, action: string) => {
    clickCountRef.current++;
    
    const event: AnalyticsEvent = {
      name: 'user_interaction',
      data: {
        type: 'click',
        element,
        action,
        clickCount: clickCountRef.current,
        timeOnPage: Date.now() - timeOnPageRef.current
      },
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Envoyer au service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ANALYTICS_EVENT',
        data: event
      });
    }
  }, []);

  const trackScroll = useCallback(() => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    
    if (scrollPercent > scrollDepthRef.current) {
      scrollDepthRef.current = scrollPercent;
      
      // Envoyer des events à des seuils spécifiques
      if ([25, 50, 75, 90].includes(scrollPercent)) {
        const event: AnalyticsEvent = {
          name: 'scroll_depth',
          data: {
            depth: scrollPercent,
            timeOnPage: Date.now() - timeOnPageRef.current
          },
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        };

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'ANALYTICS_EVENT',
            data: event
          });
        }
      }
    }
  }, []);

  const startTracking = useCallback(() => {
    // Écouter les scroll avec throttling
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          trackScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [trackScroll]);

  return { trackClick, startTracking, scrollDepth: scrollDepthRef.current };
}

// ✅ Hook pour optimiser les re-renders avec performance
export function useRenderOptimization(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderRef.current;
    lastRenderRef.current = now;

    // Log des re-renders fréquents pour debug
    if (process.env.NODE_ENV === 'development' && timeSinceLastRender < 50) {
      console.warn(`⚠️ Frequent re-render detected in ${componentName}:`, {
        renderCount: renderCountRef.current,
        timeSinceLastRender: `${timeSinceLastRender}ms`
      });
    }
  });

  return {
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderRef.current
  };
}

// ✅ Hook pour mesurer les temps de chargement des ressources
export function useResourceTiming() {
  const measureResourceTiming = useCallback(() => {
    if ('performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const resourceMetrics = resources.reduce((acc, resource) => {
        const type = resource.initiatorType;
        if (!acc[type]) acc[type] = [];
        
        acc[type].push({
          name: resource.name,
          duration: resource.duration,
          transferSize: (resource as any).transferSize || 0,
          size: (resource as any).decodedBodySize || 0
        });
        
        return acc;
      }, {} as Record<string, any[]>);

      // Log des ressources lentes
      Object.entries(resourceMetrics).forEach(([type, items]) => {
        const slowResources = items.filter(item => item.duration > 500);
        if (slowResources.length > 0) {
          console.warn(`🐌 Slow ${type} resources:`, slowResources);
        }
      });

      return resourceMetrics;
    }
    return {};
  }, []);

  return { measureResourceTiming };
}

// ✅ Composant pour afficher les métriques en développement
export function PerformanceDebugger() {
  const { startMonitoring, metrics } = usePerformanceMonitoring();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      startMonitoring();
    }
  }, [startMonitoring]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <h4 className="font-bold mb-2">🔬 Performance</h4>
      <div className="space-y-1">
        <div>FCP: {metrics.fcp?.toFixed(0)}ms</div>
        <div>LCP: {metrics.lcp?.toFixed(0)}ms</div>
        <div>FID: {metrics.fid?.toFixed(0)}ms</div>
        <div>CLS: {metrics.cls?.toFixed(3)}</div>
        <div>TTFB: {metrics.ttfb?.toFixed(0)}ms</div>
      </div>
    </div>
  );
}