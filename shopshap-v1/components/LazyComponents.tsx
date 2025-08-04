'use client';

import { memo, lazy, Suspense } from 'react';

// ✅ Lazy loading des composants lourds pour le code splitting
const LazyProductFilters = lazy(() => 
  import('./ProductFilters').then(module => ({ default: module.ProductFilters }))
);

const LazyPremiumProductCard = lazy(() => 
  import('./PremiumProductCard').then(module => ({ default: module.PremiumProductCard }))
);

const LazyAboutSection = lazy(() => 
  import('./AboutSection').then(module => ({ default: module.AboutSection }))
);

// ✅ Composants de chargement optimisés
const ProductFiltersLoading = memo(() => (
  <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-2xl p-6 mb-8 animate-pulse">
    <div className="mb-6">
      <div className="h-12 bg-night-foreground/5 rounded-xl max-w-md mx-auto"></div>
    </div>
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div className="h-6 bg-night-foreground/5 rounded mb-4 w-24"></div>
        <div className="flex gap-3 flex-wrap">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-night-foreground/5 rounded-xl w-32"></div>
          ))}
        </div>
      </div>
      <div className="lg:w-64">
        <div className="h-6 bg-night-foreground/5 rounded mb-4 w-20"></div>
        <div className="h-12 bg-night-foreground/5 rounded-xl"></div>
      </div>
    </div>
  </div>
));

const ProductCardLoading = memo(() => (
  <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-3xl overflow-hidden animate-pulse">
    <div className="h-80 bg-night-foreground/5"></div>
    <div className="p-8">
      <div className="h-4 bg-night-foreground/5 rounded mb-2 w-full"></div>
      <div className="h-6 bg-night-foreground/5 rounded mb-4 w-3/4"></div>
      <div className="h-4 bg-night-foreground/5 rounded mb-6 w-1/2"></div>
      <div className="flex gap-2">
        <div className="flex-1 h-12 bg-night-foreground/5 rounded-2xl"></div>
        <div className="flex-1 h-12 bg-night-foreground/5 rounded-2xl"></div>
        <div className="h-12 w-12 bg-night-foreground/5 rounded"></div>
      </div>
    </div>
  </div>
));

const AboutSectionLoading = memo(() => (
  <div className="py-20 animate-pulse">
    <div className="max-w-4xl mx-auto px-4 text-center">
      <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-3xl p-12">
        <div className="h-8 bg-night-foreground/5 rounded mb-8 w-64 mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[1, 2, 3].map(i => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-night-foreground/5"></div>
              <div className="h-6 bg-night-foreground/5 rounded mb-2 w-32 mx-auto"></div>
              <div className="h-4 bg-night-foreground/5 rounded w-40 mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="h-6 bg-night-foreground/5 rounded w-full max-w-2xl mx-auto"></div>
      </div>
    </div>
  </div>
));

// ✅ Wrapper pour les composants lazy avec error boundary
const LazyComponentWrapper = memo(({ 
  children, 
  fallback, 
  errorFallback 
}: { 
  children: React.ReactNode;
  fallback: React.ReactNode;
  errorFallback?: React.ReactNode;
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
));

export {
  LazyProductFilters,
  LazyPremiumProductCard,
  LazyAboutSection,
  ProductFiltersLoading,
  ProductCardLoading,
  AboutSectionLoading,
  LazyComponentWrapper
};