'use client';

import { memo, useRef, useState, useEffect } from 'react';

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  description?: string;
};

function useIntersectionObserver(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return { elementRef, isVisible };
}

// ✅ Section À propos optimisée pour le lazy loading
export const AboutSection = memo(function AboutSection({ 
  shop, 
  theme 
}: { 
  shop: Shop; 
  theme: any 
}) {
  const { elementRef, isVisible } = useIntersectionObserver();

  return (
    <section 
      id="about" 
      ref={elementRef}
      className="py-20"
      aria-labelledby="about-heading"
    >
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className={`${theme.card} backdrop-blur-xl border ${theme.border} rounded-3xl p-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 
            id="about-heading"
            className="text-4xl font-bold text-white mb-8"
          >
            À propos de notre boutique
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Qualité garantie</h3>
              <p className="text-white/70">Tous nos produits sont soigneusement sélectionnés</p>
            </div>
            
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Livraison rapide</h3>
              <p className="text-white/70">Service client réactif et livraison efficace</p>
            </div>
            
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Satisfaction client</h3>
              <p className="text-white/70">Votre satisfaction est notre priorité absolue</p>
            </div>
          </div>
          
          {shop.description && (
            <p className="text-xl text-white/80 leading-relaxed">
              {shop.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
});