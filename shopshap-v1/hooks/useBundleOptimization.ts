'use client';

import { useCallback, useRef } from 'react';

interface BundleInfo {
  totalSize: number;
  gzippedSize: number;
  chunkCount: number;
  duplicates: string[];
  largeChunks: Array<{ name: string; size: number }>;
}

// ✅ Analyse de la taille du bundle
export function useBundleAnalysis() {
  const analyzeBundle = useCallback((): BundleInfo => {
    if (typeof window === 'undefined') {
      return {
        totalSize: 0,
        gzippedSize: 0,
        chunkCount: 0,
        duplicates: [],
        largeChunks: []
      };
    }

    // Analyser les chunks webpack/nextjs
    const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
    const chunks = scripts
      .filter(script => script.src.includes('/_next/static/'))
      .map(script => ({
        name: script.src.split('/').pop() || 'unknown',
        url: script.src,
        async: script.async,
        defer: script.defer
      }));

    console.log('📦 Detected chunks:', chunks);

    return {
      totalSize: 0, // Serait calculé avec une vraie API
      gzippedSize: 0,
      chunkCount: chunks.length,
      duplicates: [],
      largeChunks: chunks.map(chunk => ({ name: chunk.name, size: 0 }))
    };
  }, []);

  return { analyzeBundle };
}

// ✅ Détection des dépendances inutilisées
export function useUnusedDependencies() {
  const checkUnusedModules = useCallback(() => {
    // Cette fonction serait plus utile côté build
    // Ici on peut détecter certains patterns côté client
    
    const unusedPatterns = [
      // Détecter des bibliothèques chargées mais non utilisées
      { name: 'moment', detector: () => typeof window !== 'undefined' && !(window as any).moment },
      { name: 'lodash', detector: () => typeof window !== 'undefined' && !(window as any)._ },
      { name: 'jquery', detector: () => typeof window !== 'undefined' && !(window as any).$ }
    ];

    const unused = unusedPatterns.filter(pattern => {
      try {
        return pattern.detector();
      } catch {
        return false;
      }
    });

    if (unused.length > 0) {
      console.warn('📦 Potentially unused dependencies detected:', unused.map(u => u.name));
    }

    return unused;
  }, []);

  return { checkUnusedModules };
}

// ✅ Tree shaking analyzer
export function useTreeShakingAnalysis() {
  const analyzeTreeShaking = useCallback(() => {
    // Vérifier les imports qui pourraient être optimisés
    const recommendations = [];

    // Vérifier si toute la bibliothèque lodash est importée
    if (typeof window !== 'undefined' && (window as any)._) {
      recommendations.push({
        type: 'lodash',
        issue: 'Full lodash import detected',
        solution: 'Import specific functions: import { debounce } from "lodash/debounce"'
      });
    }

    // Vérifier les icônes qui pourraient être optimisées
    const iconElements = document.querySelectorAll('svg');
    if (iconElements.length > 20) {
      recommendations.push({
        type: 'icons',
        issue: `${iconElements.length} SVG icons detected`,
        solution: 'Consider using an icon system or sprite'
      });
    }

    console.log('🌳 Tree shaking recommendations:', recommendations);
    return recommendations;
  }, []);

  return { analyzeTreeShaking };
}

// ✅ Memory usage tracking
export function useMemoryTracking() {
  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      const memoryInfo = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };

      // Avertir si l'utilisation mémoire est élevée
      if (memoryInfo.usagePercentage > 70) {
        console.warn('🧠 High memory usage detected:', {
          used: `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          percentage: `${memoryInfo.usagePercentage.toFixed(1)}%`
        });
      }

      return memoryInfo;
    }

    return null;
  }, []);

  const detectMemoryLeaks = useCallback(() => {
    let previousUsage = 0;
    let checkCount = 0;
    
    return setInterval(() => {
      const current = trackMemoryUsage();
      if (current) {
        const growth = current.usedJSHeapSize - previousUsage;
        checkCount++;
        
        // Si la mémoire augmente constamment pendant 5 checks
        if (growth > 0 && checkCount > 5) {
          console.warn('🔍 Potential memory leak detected:', {
            growth: `+${(growth / 1024 / 1024).toFixed(2)} MB`,
            total: `${(current.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
          });
        }
        
        previousUsage = current.usedJSHeapSize;
      }
    }, 5000);
  }, [trackMemoryUsage]);

  return { trackMemoryUsage, detectMemoryLeaks };
}

// ✅ Component render optimization analyzer
export function useRenderOptimizationAnalyzer() {
  const componentRenders = useRef<Map<string, number>>(new Map());
  const renderTimes = useRef<Map<string, number[]>>(new Map());

  const trackComponentRender = useCallback((componentName: string, renderTime?: number) => {
    // Incrémenter le compteur de renders
    const currentCount = componentRenders.current.get(componentName) || 0;
    componentRenders.current.set(componentName, currentCount + 1);

    // Tracker les temps de render si fourni
    if (renderTime !== undefined) {
      const times = renderTimes.current.get(componentName) || [];
      times.push(renderTime);
      // Garder seulement les 10 derniers renders
      if (times.length > 10) times.shift();
      renderTimes.current.set(componentName, times);
    }

    // Alerter pour les re-renders excessifs
    if (currentCount > 10) {
      console.warn(`⚠️ Component "${componentName}" has rendered ${currentCount} times`);
    }
  }, []);

  const getOptimizationReport = useCallback(() => {
    const report = Array.from(componentRenders.current.entries()).map(([name, count]) => {
      const times = renderTimes.current.get(name) || [];
      const avgRenderTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      
      return {
        component: name,
        renderCount: count,
        avgRenderTime: avgRenderTime.toFixed(2),
        suggestion: count > 5 ? 'Consider using React.memo or useMemo' : 'Optimized'
      };
    });

    console.table(report);
    return report;
  }, []);

  return { trackComponentRender, getOptimizationReport };
}

// ✅ Critical resource prioritization
export function useCriticalResourcePriority() {
  const prioritizeResources = useCallback(() => {
    // Ajouter des hints de préchargement pour les ressources critiques
    const criticalResources = [
      '/manifest.json',
      '/_next/static/css/', // CSS critiques
      '/api/shops/', // API critiques
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.includes('.css')) {
        link.as = 'style';
      } else if (resource.includes('/api/')) {
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });

    console.log('🚀 Critical resources prioritized');
  }, []);

  const preloadNextPageResources = useCallback((nextPath: string) => {
    // Précharger les ressources de la page suivante
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = nextPath;
    document.head.appendChild(link);
    
    console.log(`🔮 Prefetching resources for: ${nextPath}`);
  }, []);

  return { prioritizeResources, preloadNextPageResources };
}

// ✅ Composant de debug pour l'optimisation
export function OptimizationDebugger() {
  const { analyzeBundle } = useBundleAnalysis();
  const { checkUnusedModules } = useUnusedDependencies();
  const { analyzeTreeShaking } = useTreeShakingAnalysis();
  const { trackMemoryUsage } = useMemoryTracking();
  const { getOptimizationReport } = useRenderOptimizationAnalyzer();

  const runCompleteAnalysis = useCallback(() => {
    console.group('🔬 ShopShap Optimization Analysis');
    
    const bundleInfo = analyzeBundle();
    const unusedModules = checkUnusedModules();
    const treeShakingRecs = analyzeTreeShaking();
    const memoryInfo = trackMemoryUsage();
    const renderReport = getOptimizationReport();
    
    console.log('📦 Bundle:', bundleInfo);
    console.log('🗑️ Unused:', unusedModules);
    console.log('🌳 Tree Shaking:', treeShakingRecs);
    console.log('🧠 Memory:', memoryInfo);
    console.log('🔄 Renders:', renderReport);
    
    console.groupEnd();
  }, [analyzeBundle, checkUnusedModules, analyzeTreeShaking, trackMemoryUsage, getOptimizationReport]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-3 rounded-lg text-xs z-50">
      <button
        onClick={runCompleteAnalysis}
        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
      >
        🔬 Analyze Performance
      </button>
    </div>
  );
}