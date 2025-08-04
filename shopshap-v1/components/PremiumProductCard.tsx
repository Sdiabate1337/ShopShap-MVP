'use client';

import { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import Link from 'next/link';

// Types pour éviter la duplication
type ProductWithUrls = {
  id: string;
  name: string;
  price: number;
  photo_url?: string;
  video_url?: string;
  description?: string;
  stock?: number;
  signedPhotoUrl: string | undefined;
  signedVideoUrl: string | undefined;
  viewCount: number;
  isPopular: boolean;
};

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
  theme?: string;
  slug?: string;
};

// Hooks et utilitaires (à importer depuis client-page.tsx)
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

function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shopshap_favorites');
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          console.warn('Erreur lecture favoris:', e);
        }
      }
    }
  }, []);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('shopshap_favorites', JSON.stringify(newFavorites));
      }
      
      return newFavorites;
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  return { favorites, toggleFavorite, isFavorite };
}

function useAnalytics() {
  const trackProductView = (product: ProductWithUrls, shop: Shop) => {
    // Analytics implementation
  };

  return { trackProductView };
}

// Thèmes (simplifié)
const shopThemes = {
  elegant: {
    primary: 'from-slate-900 via-slate-800 to-slate-900',
    accent: 'from-blue-500 to-indigo-600',
    card: 'bg-white/5',
    border: 'border-white/10',
  },
  // Autres thèmes...
};

// ✅ Carte produit optimisée pour le lazy loading
export const PremiumProductCard = memo(function PremiumProductCard({ 
  product, 
  shop, 
  onContact 
}: { 
  product: ProductWithUrls; 
  shop: Shop; 
  onContact: (product: ProductWithUrls) => void;
}) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { elementRef, isVisible } = useIntersectionObserver();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { trackProductView } = useAnalytics();
  
  // ✅ useMemo pour éviter de recalculer le thème à chaque render
  const theme = useMemo(() => 
    shopThemes[shop.theme as keyof typeof shopThemes] || shopThemes.elegant, 
    [shop.theme]
  );

  // ✅ useCallback pour les handlers d'événements
  const handleMouseEnter = useCallback(() => {
    if (product.signedVideoUrl) {
      setShowVideo(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
          setIsVideoPlaying(true);
        }
      }, 300);
    }
  }, [product.signedVideoUrl]);

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
    setTimeout(() => setShowVideo(false), 200);
  }, []);

  useEffect(() => {
    if (isVisible) {
      trackProductView(product, shop);
    }
  }, [isVisible, product, shop, trackProductView]);

  // ✅ useMemo pour éviter de recalculer les badges à chaque render
  const scarcityBadge = useMemo(() => {
    if (product.stock && product.stock <= 3 && product.stock > 0) {
      return (
        <div className="absolute top-4 left-4 bg-orange-500/90 text-white px-3 py-2 rounded-full text-xs font-bold border border-orange-400/50 animate-pulse">
          ⚡ Plus que {product.stock} !
        </div>
      );
    }
    return null;
  }, [product.stock]);

  const viewCountDisplay = useMemo(() => (
    <div className="text-white/60 text-xs flex items-center gap-1 mb-2">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
      </svg>
      <span>Vu par {product.viewCount} personnes aujourd'hui</span>
    </div>
  ), [product.viewCount]);

  return (
    <article 
      ref={elementRef}
      className={`group relative overflow-hidden rounded-3xl ${theme.card} backdrop-blur-xl border ${theme.border} transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="article"
      aria-labelledby={`product-${product.id}-title`}
    >
      <div className="relative h-80 overflow-hidden">
        {product.signedPhotoUrl ? (
          <img
            src={product.signedPhotoUrl}
            alt={`Image de ${product.name}`}
            className={`w-full h-full object-cover transition-all duration-700 ${
              showVideo ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
            }`}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {product.signedVideoUrl && (
          <video
            ref={videoRef}
            src={product.signedVideoUrl}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
              showVideo ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            }`}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`Vidéo de démonstration de ${product.name}`}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" aria-hidden="true" />
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} aria-hidden="true" />

        {scarcityBadge}

        {product.stock !== undefined && product.stock !== null && (
          <div className={`absolute bottom-4 right-4 px-3 py-2 rounded-full text-xs font-bold backdrop-blur-sm ${
            product.stock > 0 
              ? 'bg-green-500/90 text-white border border-green-400/50' 
              : 'bg-red-500/90 text-white border border-red-400/50'
          }`}>
            {product.stock > 0 ? `${product.stock} en stock` : 'Épuisé'}
          </div>
        )}

        <div className="absolute bottom-4 left-4">
          <div className={`bg-gradient-to-r ${theme.accent} text-white px-6 py-3 rounded-2xl font-black text-xl shadow-2xl backdrop-blur-sm border border-white/20`}>
            {product.price.toLocaleString()} <span className="text-sm font-medium">FCFA</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {viewCountDisplay}

        <h3 
          id={`product-${product.id}-title`}
          className="text-2xl font-bold text-white mb-4 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-gray-300 transition-all duration-300"
        >
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-white/70 leading-relaxed mb-6 line-clamp-3">
            {product.description}
          </p>
        )}

        <div className="flex gap-4">
          <Link 
            href={shop.slug ? `/${shop.slug}/product/${product.id}` : `/shop/${shop.id}/product/${product.id}`}
            className="flex-1 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white text-center py-4 px-6 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 font-semibold hover:scale-105 hover:shadow-lg group"
            aria-label={`Voir les détails de ${product.name}`}
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              Voir détails
            </div>
          </Link>
          
          <button
            onClick={() => onContact(product)}
            disabled={product.stock === 0}
            className={`flex-1 text-white py-4 px-6 rounded-2xl transition-all duration-300 font-bold hover:scale-105 hover:shadow-xl group ${
              product.stock === 0 
                ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                : `bg-gradient-to-r ${theme.accent} hover:shadow-green-500/25`
            }`}
            aria-label={product.stock === 0 ? 'Produit épuisé' : `Commander ${product.name}`}
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              {product.stock === 0 ? 'Épuisé' : 'Commander'}
            </div>
          </button>
        </div>
      </div>
    </article>
  );
});