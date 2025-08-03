'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { generateWhatsAppLink, generateShopIntroMessage } from '@/lib/whatsapp';
import Link from 'next/link';
import Head from 'next/head';

// ✨ Enhanced Types
type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
  theme?: string;
  slug?: string;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  photo_url?: string;
  video_url?: string;
  description?: string;
  stock?: number;
  category?: string;
};

type ProductWithUrls = Product & {
  signedPhotoUrl: string | undefined;
  signedVideoUrl: string | undefined;
  viewCount: number;
  isPopular: boolean;
  isNew: boolean;
  discount?: number;
};

// ✨ Modern Enhanced Themes
const shopThemes = {
  elegant: {
    primary: 'from-slate-900 via-gray-900 to-black',
    secondary: 'from-slate-800 to-slate-900',
    accent: 'from-blue-500 to-indigo-600',
    highlight: 'from-blue-400 to-cyan-500',
    card: 'bg-white/[0.02] border-white/10',
    glass: 'bg-white/5 backdrop-blur-xl border-white/20',
    text: 'text-slate-100',
    overlay: 'bg-black/60',
  },
  warm: {
    primary: 'from-orange-900 via-red-900 to-amber-900',
    secondary: 'from-orange-800 to-red-800',
    accent: 'from-orange-400 to-red-500',
    highlight: 'from-yellow-400 to-orange-500',
    card: 'bg-orange-500/[0.02] border-orange-200/10',
    glass: 'bg-orange-500/5 backdrop-blur-xl border-orange-200/20',
    text: 'text-orange-50',
    overlay: 'bg-orange-900/60',
  },
  nature: {
    primary: 'from-emerald-900 via-green-900 to-teal-900',
    secondary: 'from-emerald-800 to-green-800',
    accent: 'from-emerald-400 to-teal-500',
    highlight: 'from-green-400 to-emerald-500',
    card: 'bg-green-500/[0.02] border-green-200/10',
    glass: 'bg-green-500/5 backdrop-blur-xl border-green-200/20',
    text: 'text-emerald-50',
    overlay: 'bg-green-900/60',
  },
  luxury: {
    primary: 'from-purple-900 via-violet-900 to-indigo-900',
    secondary: 'from-purple-800 to-violet-800',
    accent: 'from-violet-400 to-purple-500',
    highlight: 'from-pink-400 to-violet-500',
    card: 'bg-purple-500/[0.02] border-purple-200/10',
    glass: 'bg-purple-500/5 backdrop-blur-xl border-purple-200/20',
    text: 'text-violet-50',
    overlay: 'bg-purple-900/60',
  },
  modern: {
    primary: 'from-gray-900 via-slate-900 to-zinc-900',
    secondary: 'from-gray-800 to-slate-800',
    accent: 'from-cyan-400 to-blue-500',
    highlight: 'from-blue-400 to-cyan-400',
    card: 'bg-white/[0.02] border-gray-200/10',
    glass: 'bg-white/5 backdrop-blur-xl border-gray-200/20',
    text: 'text-gray-50',
    overlay: 'bg-gray-900/60',
  },
  ocean: {
    primary: 'from-blue-900 via-cyan-900 to-teal-900',
    secondary: 'from-blue-800 to-cyan-800',
    accent: 'from-blue-400 to-cyan-400',
    highlight: 'from-cyan-400 to-teal-400',
    card: 'bg-blue-500/[0.02] border-blue-200/10',
    glass: 'bg-blue-500/5 backdrop-blur-xl border-blue-200/20',
    text: 'text-blue-50',
    overlay: 'bg-blue-900/60',
  }
};

// Extend Window interface to include gtag and fbq
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

// ✨ Enhanced Analytics Hook
function useAnalytics() {
  const trackEvent = (eventName: string, properties: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      try {
        // Google Analytics 4
        if (window.gtag) {
          window.gtag('event', eventName, properties);
        }
        
        // Facebook Pixel
        if (window.fbq) {
          window.fbq('track', eventName, properties);
        }
        
        console.log('📊 Analytics:', eventName, properties);
      } catch (error) {
        console.warn('Analytics error:', error);
      }
    }
  };

  return {
    trackProductView: (product: ProductWithUrls, shop: Shop) => {
      trackEvent('view_item', {
        item_id: product.id,
        item_name: product.name,
        item_category: shop.activity,
        value: product.price,
        currency: 'XOF',
        shop_name: shop.name,
      });
    },
    trackShopVisit: (shop: Shop) => {
      trackEvent('page_view', {
        page_title: `${shop.name} - ${shop.activity}`,
        shop_id: shop.id,
        shop_name: shop.name,
      });
    },
    trackContactClick: (shop: Shop, source: string) => {
      trackEvent('contact_click', {
        shop_id: shop.id,
        source: source,
      });
    },
  };
}

// ✨ Enhanced Intersection Observer Hook
function useIntersectionObserver(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px',
      ...options
    });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return { elementRef, isVisible };
}

// ✨ Enhanced Favorites Hook
function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shopshap_favorites');
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          console.warn('Error loading favorites:', e);
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

// ✨ Modern Loading Component
function ModernLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      <div className="relative">
        {/* Animated rings */}
        <div className="w-32 h-32 border-4 border-blue-200/20 rounded-full animate-pulse"></div>
        <div className="absolute inset-2 w-28 h-28 border-4 border-blue-400/40 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-6 w-20 h-20 border-4 border-purple-400/40 border-t-purple-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '2s'}}></div>
        
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
        <p className="text-white/90 text-xl font-semibold">Chargement de la boutique</p>
        <p className="text-white/60 text-sm">Préparation de votre expérience shopping...</p>
      </div>
    </div>
  );
}

// ✨ Ultra Modern Sticky Navigation
function UltraModernNavBar({ shop, theme, onContact }: { shop: Shop; theme: any; onContact: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
        isScrolled 
          ? `${theme.overlay} backdrop-blur-2xl border-b border-white/10 py-3 shadow-2xl` 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className={`relative group cursor-pointer`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${theme.accent} rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className={`relative w-14 h-14 bg-gradient-to-r ${theme.accent} rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-transform duration-300`}>
                <span className="text-white font-black text-xl">
                  {shop.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-xl tracking-tight">{shop.name}</h1>
              <p className="text-white/70 text-sm font-medium">{shop.activity} • {shop.city}</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a 
              href="#catalog" 
              className="text-white/80 hover:text-white transition-all duration-300 font-medium hover:scale-105"
            >
              Catalogue
            </a>
            <a 
              href="#about" 
              className="text-white/80 hover:text-white transition-all duration-300 font-medium hover:scale-105"
            >
              À propos
            </a>
            <button
              onClick={onContact}
              className={`relative group bg-gradient-to-r ${theme.accent} hover:shadow-2xl hover:shadow-green-500/25 text-white px-8 py-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="relative flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span>Contacter</span>
              </div>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-3 rounded-xl bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 transition-all duration-300"
          >
            <svg className={`w-6 h-6 transition-transform duration-300 ${isMenuOpen ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ease-out ${
          isMenuOpen ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'
        }`}>
          <div className={`${theme.glass} rounded-2xl p-6 space-y-4`}>
            <a 
              href="#catalog" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-white/80 hover:text-white transition-colors py-3 border-b border-white/10"
            >
              📦 Catalogue
            </a>
            <a 
              href="#about" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-white/80 hover:text-white transition-colors py-3 border-b border-white/10"
            >
              ℹ️ À propos
            </a>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onContact();
              }}
              className={`w-full bg-gradient-to-r ${theme.accent} text-white py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95`}
            >
              💬 Nous contacter
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ✨ Ultra Modern Hero Section
function UltraModernHero({ shop, shopPhotoUrl, theme, onContact }: { 
  shop: Shop; 
  shopPhotoUrl: string | null; 
  theme: any; 
  onContact: () => void;
}) {
  const [scrollY, setScrollY] = useState(0);
  const { elementRef, isVisible } = useIntersectionObserver();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section 
      ref={elementRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated Background */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${theme.primary}`}
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      />
      
      {/* Geometric Patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-40 w-48 h-48 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/3 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/30 rounded-full animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-blue-400/30 rounded-full animate-float-delayed"></div>
        <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-purple-400/30 rounded-full animate-float-slow"></div>
      </div>
      
      <div className={`relative z-10 max-w-6xl mx-auto px-4 py-32 text-center transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        {/* Shop Photo */}
        {shopPhotoUrl && (
          <div className="relative inline-block mb-12 group">
            <div className={`absolute -inset-4 bg-gradient-to-r ${theme.accent} rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500`}></div>
            <div className="relative">
              <img
                src={shopPhotoUrl}
                alt={`${shop.name} - Boutique`}
                className="w-40 h-40 lg:w-48 lg:h-48 rounded-full object-cover shadow-2xl border-4 border-white/20 group-hover:scale-110 transition-transform duration-500"
                loading="eager"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/30"></div>
            </div>
          </div>
        )}
        
        {/* Hero Text */}
        <div className="space-y-8">
          <h1 className={`text-6xl lg:text-8xl font-black tracking-tight transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <span className={`bg-gradient-to-r ${theme.highlight} bg-clip-text text-transparent drop-shadow-2xl`}>
              {shop.name}
            </span>
          </h1>
          
          <p className={`text-3xl lg:text-4xl font-light text-white/90 mb-6 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {shop.activity}
          </p>
          
          <div className={`flex items-center justify-center gap-4 text-white/80 mb-12 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span className="text-2xl font-semibold">{shop.city}</span>
            </div>
          </div>
          
          {shop.description && (
            <p className={`text-xl lg:text-2xl text-white/80 leading-relaxed max-w-4xl mx-auto mb-16 transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              {shop.description}
            </p>
          )}
          
          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center transition-all duration-1000 delay-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <button
              onClick={onContact}
              className={`group relative bg-gradient-to-r ${theme.accent} hover:shadow-2xl hover:shadow-green-500/25 text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="relative flex items-center gap-4">
                <svg className="w-7 h-7 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span>Contacter maintenant</span>
              </div>
            </button>
            
            <a 
              href="#catalog"
              className="group text-white/90 hover:text-white px-10 py-6 rounded-2xl border-2 border-white/20 hover:border-white/50 font-bold text-xl transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-xl bg-white/5 hover:bg-white/10"
            >
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 group-hover:translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
                <span>Découvrir le catalogue</span>
              </div>
            </a>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}

// ✨ Ultra Modern Product Card
function UltraModernProductCard({ product, shop, onContact }: { 
  product: ProductWithUrls; 
  shop: Shop; 
  onContact: (product: ProductWithUrls) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { elementRef, isVisible } = useIntersectionObserver();
  const { toggleFavorite, isFavorite } = useFavorites();
  const theme = shopThemes[shop.theme as keyof typeof shopThemes] || shopThemes.elegant;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (product.signedVideoUrl) {
      setShowVideo(true);
      setTimeout(() => {
        videoRef.current?.play().catch(() => {});
      }, 200);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setTimeout(() => setShowVideo(false), 200);
  };

  return (
    <article 
      ref={elementRef}
      className={`group relative overflow-hidden rounded-3xl ${theme.card} backdrop-blur-xl border transition-all duration-700 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/25 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Container */}
      <div className="relative h-80 overflow-hidden">
        {/* Main Image */}
        {product.signedPhotoUrl ? (
          <img
            src={product.signedPhotoUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-700 ${
              showVideo ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
            } ${isHovered ? 'scale-110' : 'scale-100'}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Video Overlay */}
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
          />
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className={`w-12 h-12 rounded-2xl backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
              isFavorite(product.id) 
                ? 'bg-red-500/90 text-white' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <svg className="w-5 h-5" fill={isFavorite(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </button>
          
          <button 
            className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (navigator.share) {
                navigator.share({
                  title: product.name,
                  text: `Découvrez ${product.name} - ${product.price.toLocaleString()} FCFA`,
                  url: window.location.href
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
            </svg>
          </button>
        </div>

        {/* Badges */}
        {product.isNew && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-pulse">
            ✨ Nouveau
          </div>
        )}

        {product.stock && product.stock <= 3 && product.stock > 0 && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-pulse">
            ⚡ Plus que {product.stock} !
          </div>
        )}

        {product.signedVideoUrl && (
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-xl text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${showVideo ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>{showVideo ? 'EN LECTURE' : 'VIDÉO'}</span>
          </div>
        )}

        {/* Stock Status */}
        {product.stock !== undefined && product.stock !== null && (
          <div className={`absolute bottom-4 right-4 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-xl border ${
            product.stock > 0 
              ? 'bg-green-500/90 text-white border-green-400/50' 
              : 'bg-red-500/90 text-white border-red-400/50'
          }`}>
            {product.stock > 0 ? `${product.stock} en stock` : 'Épuisé'}
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute bottom-4 left-4">
          <div className={`bg-gradient-to-r ${theme.accent} text-white px-6 py-3 rounded-2xl font-black text-xl shadow-2xl backdrop-blur-xl border border-white/20 group-hover:scale-110 transition-transform duration-300`}>
            {product.price.toLocaleString()} <span className="text-sm font-medium">FCFA</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* View Count */}
        <div className="text-white/60 text-xs flex items-center gap-2 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          <span>Vu {product.viewCount} fois aujourd'hui</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-4 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-gray-100 group-hover:to-white group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
          {product.name}
        </h3>
        
        {/* Description */}
        {product.description && (
          <p className="text-white/70 leading-relaxed mb-6 line-clamp-3">
            {product.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link 
            href={shop.slug ? `/${shop.slug}/product/${product.id}` : `/shop/${shop.id}/product/${product.id}`}
            className="flex-1 bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white text-center py-4 px-6 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 font-semibold hover:scale-105 active:scale-95 group/link"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 group-hover/link:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              <span>Voir détails</span>
            </div>
          </Link>
          
          <button
            onClick={() => onContact(product)}
            disabled={product.stock === 0}
            className={`flex-1 text-white py-4 px-6 rounded-2xl transition-all duration-300 font-bold hover:scale-105 active:scale-95 group/btn disabled:opacity-50 disabled:cursor-not-allowed ${
              product.stock === 0 
                ? 'bg-gray-600' 
                : `bg-gradient-to-r ${theme.accent} hover:shadow-xl hover:shadow-green-500/25`
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span>{product.stock === 0 ? 'Épuisé' : 'Commander'}</span>
            </div>
          </button>
        </div>
      </div>
    </article>
  );
}

// ✨ Modern Search & Filter Bar
function ModernSearchFilters({ theme, onFilter, onSort, onSearch, productCount }: { 
  theme: any; 
  onFilter: (filter: string) => void;
  onSort: (sort: string) => void;
  onSearch: (search: string) => void;
  productCount: number;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');

  const filters = [
    { id: 'all', label: 'Tous', icon: '🛍️', count: productCount },
    { id: 'available', label: 'Disponibles', icon: '✅' },
    { id: 'popular', label: 'Populaires', icon: '🔥' },
    { id: 'lowstock', label: 'Stock limité', icon: '⚠️' },
  ];

  const sorts = [
    { id: 'newest', label: 'Plus récents', icon: '🆕' },
    { id: 'price-low', label: 'Prix ↗', icon: '💰' },
    { id: 'price-high', label: 'Prix ↘', icon: '💎' },
    { id: 'name', label: 'A → Z', icon: '🔤' },
    { id: 'popularity', label: 'Populaires', icon: '⭐' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  return (
    <div className={`${theme.glass} rounded-3xl p-8 mb-12 shadow-2xl`}>
      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input
          type="search"
          placeholder="Rechercher un produit, une catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border-2 border-white/20 focus:border-white/40 rounded-2xl pl-16 pr-6 py-4 text-white placeholder-white/50 focus:outline-none transition-all duration-300 text-lg"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Filters */}
        <div className="flex-1">
          <h3 className="text-white font-bold mb-4 text-lg">Filtrer par :</h3>
          <div className="flex gap-3 flex-wrap">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => {
                  setActiveFilter(filter.id);
                  onFilter(filter.id);
                }}
                className={`group px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 hover:scale-105 active:scale-95 ${
                  activeFilter === filter.id
                    ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg shadow-blue-500/25`
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/20'
                }`}
              >
                <span className="text-lg">{filter.icon}</span>
                <span>{filter.label}</span>
                {filter.count && activeFilter === filter.id && (
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Sort */}
        <div className="xl:w-80">
          <h3 className="text-white font-bold mb-4 text-lg">Trier par :</h3>
          <div className="relative">
            <select
              value={activeSort}
              onChange={(e) => {
                setActiveSort(e.target.value);
                onSort(e.target.value);
              }}
              className="w-full bg-white/5 border-2 border-white/20 focus:border-white/40 rounded-2xl px-6 py-4 text-white focus:outline-none transition-all duration-300 appearance-none cursor-pointer text-lg"
            >
              {sorts.map(sort => (
                <option key={sort.id} value={sort.id} className="bg-gray-900 text-white">
                  {sort.icon} {sort.label}
                </option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✨ Main Component
export default function UltraModernShopPage({ slug }: { slug: string }) {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopPhotoUrl, setShopPhotoUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductWithUrls[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { trackShopVisit, trackContactClick } = useAnalytics();
  const theme = shopThemes[shop?.theme as keyof typeof shopThemes] || shopThemes.elegant;

  useEffect(() => {
    if (shop) {
      trackShopVisit(shop);
    }
  }, [shop, trackShopVisit]);

  useEffect(() => {
    fetchShopBySlug();
  }, [slug]);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm]);

  const applyFilters = () => {
    let filtered = [...products];
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredProducts(filtered);
  };

  async function fetchShopBySlug() {
    setLoading(true);
    try {
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single();

      if (shopError || !shopData) {
        notFound();
        return;
      }

      setShop(shopData);

      if (shopData.photo_url) {
        const { data: urlData } = await supabase.storage
          .from('shop-photos')
          .createSignedUrl(shopData.photo_url, 60 * 60);
        setShopPhotoUrl(urlData?.signedUrl ?? null);
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error loading products:', productsError);
        return;
      }

      if (productsData) {
        const productsWithUrls = await Promise.allSettled(
          productsData.map(async (product: Product): Promise<ProductWithUrls> => {
            let signedPhotoUrl: string | undefined = undefined;
            let signedVideoUrl: string | undefined = undefined;

            if (product.photo_url) {
              try {
                const { data: photoData } = await supabase.storage
                  .from('shop-photos')
                  .createSignedUrl(product.photo_url, 60 * 60);
                signedPhotoUrl = photoData?.signedUrl ?? undefined;
              } catch (e) {
                console.warn('Photo URL error:', e);
              }
            }

            if (product.video_url) {
              try {
                const { data: videoData } = await supabase.storage
                  .from('product-videos')
                  .createSignedUrl(product.video_url, 60 * 60);
                signedVideoUrl = videoData?.signedUrl ?? undefined;
              } catch (e) {
                console.warn('Video URL error:', e);
              }
            }

            return {
              ...product,
              signedPhotoUrl,
              signedVideoUrl,
              viewCount: Math.floor(Math.random() * 100) + 10,
              isPopular: product.price > 50000,
              isNew: new Date(product.id).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000),
            };
          })
        );

        const successfulProducts = productsWithUrls
          .filter((result): result is PromiseFulfilledResult<ProductWithUrls> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value);

        setProducts(successfulProducts);
      }

    } catch (err) {
      console.error('Error loading shop:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleContactShop(source: string = 'general') {
    if (!shop || typeof window === 'undefined') return;

    trackContactClick(shop, source);

    const message = generateShopIntroMessage({
      shopName: shop.name,
      activity: shop.activity,
      city: shop.city,
      description: shop.description,
      catalogUrl: window.location.href,
    });

    const whatsappUrl = generateWhatsAppLink('', message);
    window.open(whatsappUrl, '_blank');
  }

  function handleContactForProduct(product: ProductWithUrls) {
    if (!shop || typeof window === 'undefined') return;

    trackContactClick(shop, 'product');

    const message = `🛍️ *${product.name}*\n\n💰 Prix: *${product.price.toLocaleString()} FCFA*\n\n${product.description ? `📝 ${product.description}\n\n` : ''}🏪 Boutique: *${shop.name}*\n📍 ${shop.city}\n\n✨ Je suis intéressé(e) par cet article !\n\n👉 Voir le produit: ${window.location.origin}/${shop.slug}/product/${product.id}`;

    const whatsappUrl = generateWhatsAppLink('', message);
    window.open(whatsappUrl, '_blank');
  }

  function handleFilter(filter: string) {
    let filtered = [...products];
    
    switch (filter) {
      case 'available':
        filtered = products.filter(p => (p.stock ?? 0) > 0);
        break;
      case 'popular':
        filtered = products.filter(p => p.isPopular);
        break;
      case 'lowstock':
        filtered = products.filter(p => p.stock && p.stock <= 3 && p.stock > 0);
        break;
      default:
        filtered = products;
    }
    
    setFilteredProducts(filtered);
  }

  function handleSort(sort: string) {
    let sorted = [...filteredProducts];
    
    switch (sort) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popularity':
        sorted.sort((a, b) => b.viewCount - a.viewCount);
        break;
      default:
        sorted.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
    }
    
    setFilteredProducts(sorted);
  }

  function handleSearch(search: string) {
    setSearchTerm(search);
  }

  if (loading) {
    return <ModernLoader />;
  }

  if (!shop) {
    notFound();
  }

  return (
    <>
      <Head>
        <title>{shop.name} - {shop.activity} à {shop.city} | ShopShap</title>
        <meta name="description" content={shop.description || `Découvrez ${shop.name}, spécialiste en ${shop.activity} à ${shop.city}. Commandez facilement via WhatsApp.`} />
        <meta name="keywords" content={`${shop.activity}, ${shop.city}, boutique en ligne, WhatsApp, ${shop.name}, e-commerce, Afrique`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${shop.name} - ${shop.activity}`} />
        <meta property="og:description" content={shop.description || `Boutique ${shop.activity} à ${shop.city} - Commandez via WhatsApp`} />
        <meta property="og:image" content={shopPhotoUrl || '/default-shop-og.jpg'} />
        <meta property="og:url" content={`https://shopshap.com/${shop.slug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ShopShap" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${shop.name} - ${shop.activity}`} />
        <meta name="twitter:description" content={shop.description || `Boutique ${shop.activity} à ${shop.city}`} />
        <meta name="twitter:image" content={shopPhotoUrl || '/default-shop-twitter.jpg'} />
        
        {/* Additional SEO */}
        <link rel="canonical" href={`https://shopshap.com/${shop.slug}`} />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1e293b" />
        
        {/* Preload critical resources */}
        {shopPhotoUrl && <link rel="preload" as="image" href={shopPhotoUrl} />}
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            "name": shop.name,
            "description": shop.description,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": shop.city
            },
            "url": `https://shopshap.com/${shop.slug}`,
            "image": shopPhotoUrl,
            "priceRange": "$$",
            "currenciesAccepted": "XOF",
            "paymentAccepted": "WhatsApp"
          })}
        </script>
      </Head>

      <div className={`min-h-screen bg-gradient-to-br ${theme.primary} font-sans relative overflow-x-hidden`}>
        {/* Ultra Modern Navigation */}
        <UltraModernNavBar shop={shop} theme={theme} onContact={() => handleContactShop('navbar')} />
        
        {/* Ultra Modern Hero */}
        <UltraModernHero shop={shop} shopPhotoUrl={shopPhotoUrl} theme={theme} onContact={() => handleContactShop('hero')} />

        {/* Modern Catalog Section */}
        <section id="catalog" className="py-24 relative">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent"></div>
          
          <div className="relative max-w-7xl mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-20">
              <div className="inline-block mb-6">
                <div className={`w-16 h-16 bg-gradient-to-r ${theme.accent} rounded-2xl flex items-center justify-center shadow-2xl`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
              </div>
              <h2 className="text-6xl lg:text-7xl font-black text-white mb-8 tracking-tight">
                Notre <span className={`bg-gradient-to-r ${theme.highlight} bg-clip-text text-transparent`}>Catalogue</span>
              </h2>
              <p className="text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                Découvrez notre sélection exceptionnelle de produits de qualité, choisis avec soin pour vous offrir le meilleur
              </p>
            </div>

            {/* Search & Filters */}
            {products.length > 0 && (
              <ModernSearchFilters 
                theme={theme} 
                onFilter={handleFilter} 
                onSort={handleSort} 
                onSearch={handleSearch}
                productCount={products.length}
              />
            )}

            {/* Product Grid or Empty State */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24">
                <div className="relative inline-block mb-12">
                  <div className={`absolute inset-0 bg-gradient-to-r ${theme.accent} rounded-full blur-3xl opacity-20 animate-pulse`}></div>
                  <div className="relative text-white/20">
                    <svg className="w-48 h-48 mx-auto" fill="none" stroke="currentColor" strokeWidth={0.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <h3 className="text-4xl lg:text-5xl font-bold text-white">
                    {searchTerm ? 'Aucun résultat trouvé' : 'Catalogue en préparation'}
                  </h3>
                  
                  <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                    {searchTerm 
                      ? `Aucun produit ne correspond à "${searchTerm}". Essayez d'autres mots-clés ou contactez-nous directement.`
                      : 'Notre équipe met à jour le catalogue avec de nouveaux produits exceptionnels. Contactez-nous pour découvrir nos dernières offres !'
                    }
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
                      >
                        🔍 Effacer la recherche
                      </button>
                    )}
                    <button
                      onClick={() => handleContactShop('empty-catalog')}
                      className={`bg-gradient-to-r ${theme.accent} hover:shadow-2xl hover:shadow-green-500/25 text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 active:scale-95`}
                    >
                      💬 Nous contacter
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Search Results Info */}
                {searchTerm && (
                  <div className="text-center mb-12">
                    <div className={`inline-flex items-center gap-3 px-8 py-4 ${theme.glass} rounded-2xl border border-white/20`}>
                      <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                      <span className="text-white text-lg">
                        <span className="font-bold text-2xl">{filteredProducts.length}</span> résultat{filteredProducts.length > 1 ? 's' : ''} pour 
                        <span className={`mx-2 px-4 py-2 rounded-full bg-gradient-to-r ${theme.accent} text-white font-bold`}>
                          "{searchTerm}"
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Enhanced Stats Bar */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                  <div className={`${theme.glass} rounded-2xl p-6 text-center border border-white/10`}>
                    <div className="text-4xl font-black text-white mb-2">{filteredProducts.length}</div>
                    <div className="text-white/70 font-medium">Produit{filteredProducts.length > 1 ? 's' : ''}</div>
                  </div>
                  <div className={`${theme.glass} rounded-2xl p-6 text-center border border-white/10`}>
                    <div className="text-4xl font-black text-emerald-400 mb-2">
                      {filteredProducts.filter(p => (p.stock ?? 0) > 0).length}
                    </div>
                    <div className="text-white/70 font-medium">Disponible{filteredProducts.filter(p => (p.stock ?? 0) > 0).length > 1 ? 's' : ''}</div>
                  </div>
                  <div className={`${theme.glass} rounded-2xl p-6 text-center border border-white/10`}>
                    <div className="text-4xl font-black text-blue-400 mb-2">
                      {filteredProducts.length > 0 ? (Math.min(...filteredProducts.map(p => p.price)) / 1000).toFixed(0) + 'K' : '0'}
                    </div>
                    <div className="text-white/70 font-medium">Prix min. (FCFA)</div>
                  </div>
                  <div className={`${theme.glass} rounded-2xl p-6 text-center border border-white/10`}>
                    <div className="text-4xl font-black text-orange-400 mb-2">
                      {filteredProducts.filter(p => p.stock && p.stock <= 3 && p.stock > 0).length}
                    </div>
                    <div className="text-white/70 font-medium">Stock limité</div>
                  </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      className="animate-fade-in-up"
                    >
                      <UltraModernProductCard
                        product={product}
                        shop={shop}
                        onContact={handleContactForProduct}
                      />
                    </div>
                  ))}
                </div>

                {/* Load More / Pagination */}
                {filteredProducts.length > 8 && (
                  <div className="text-center mt-16">
                    <div className={`inline-flex items-center gap-4 px-8 py-4 ${theme.glass} rounded-2xl border border-white/20`}>
                      <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                      </svg>
                      <span className="text-white/80">
                        Affichage de <strong className="text-white">{Math.min(8, filteredProducts.length)}</strong> sur <strong className="text-white">{filteredProducts.length}</strong> produits
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
          
          <div className="relative max-w-6xl mx-auto px-4">
            <div className={`${theme.glass} rounded-3xl p-12 lg:p-16 border border-white/10`}>
              <div className="text-center mb-16">
                <h2 className="text-5xl font-black text-white mb-6">
                  À propos de <span className={`bg-gradient-to-r ${theme.highlight} bg-clip-text text-transparent`}>{shop.name}</span>
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
                <div className="text-center group">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Qualité Garantie</h3>
                  <p className="text-white/70 leading-relaxed">Chaque produit est soigneusement sélectionné et testé pour vous garantir la meilleure qualité possible.</p>
                </div>
                
                <div className="text-center group">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Livraison Rapide</h3>
                  <p className="text-white/70 leading-relaxed">Service client réactif et livraison efficace dans toute la région pour votre satisfaction.</p>
                </div>
                
                <div className="text-center group">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Satisfaction Client</h3>
                  <p className="text-white/70 leading-relaxed">Votre satisfaction est notre priorité absolue. Nous sommes là pour vous accompagner.</p>
                </div>
              </div>
              
              {shop.description && (
                <div className="text-center">
                  <p className="text-2xl text-white/90 leading-relaxed max-w-4xl mx-auto">
                    {shop.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-black text-white mb-6">
                Ce que disent nos <span className={`bg-gradient-to-r ${theme.highlight} bg-clip-text text-transparent`}>clients</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Découvrez les témoignages de nos clients satisfaits qui nous font confiance
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  name: "Amadou D.", 
                  location: "Dakar", 
                  text: "Service exceptionnel et produits de qualité ! Je recommande vivement cette boutique pour son professionnalisme.", 
                  rating: 5,
                  avatar: "👨🏿‍💼"
                },
                { 
                  name: "Fatou S.", 
                  location: "Abidjan", 
                  text: "Livraison rapide et excellent accueil. L'équipe est très réactive sur WhatsApp, parfait pour mes commandes.", 
                  rating: 5,
                  avatar: "👩🏿‍💼"
                },
                { 
                  name: "Moussa K.", 
                  location: "Bamako", 
                  text: "Je commande régulièrement, toujours satisfait ! Produits conformes et service client au top.", 
                  rating: 5,
                  avatar: "👨🏿"
                }
              ].map((testimonial, index) => (
                <div key={index} className={`${theme.glass} rounded-3xl p-8 border border-white/10 hover:scale-105 transition-transform duration-300`}>
                  {/* Stars */}
                  <div className="flex justify-center mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-6 h-6 text-yellow-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20" style={{animationDelay: `${i * 0.1}s`}}>
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <blockquote className="text-white/90 italic text-lg leading-relaxed mb-8 text-center">
                    "{testimonial.text}"
                  </blockquote>
                  
                  {/* Author */}
                  <div className="text-center">
                    <div className="text-4xl mb-3">{testimonial.avatar}</div>
                    <div className="text-white font-bold text-lg">{testimonial.name}</div>
                    <div className="text-white/60 text-sm">{testimonial.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ultra Modern Footer */}
        <footer className="relative py-24">
          <div className={`absolute inset-0 bg-gradient-to-t ${theme.secondary} opacity-20`}></div>
          
          <div className="relative max-w-6xl mx-auto px-4">
            <div className={`${theme.glass} rounded-3xl p-16 text-center border border-white/10`}>
              {/* Logo & Title */}
              <div className="mb-12">
                <div className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r ${theme.accent} rounded-3xl shadow-2xl mb-6`}>
                  <span className="text-white font-black text-3xl">
                    {shop.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-4xl font-black text-white mb-3">{shop.name}</h3>
                <p className="text-2xl text-white/80">{shop.activity} • {shop.city}</p>
              </div>
              
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center shadow-xl`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Localisation</h4>
                  <p className="text-white/70">{shop.city}</p>
                </div>
                
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center shadow-xl`}>
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">WhatsApp</h4>
                  <p className="text-white/70">Commande directe</p>
                </div>
                
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center shadow-xl`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Horaires</h4>
                  <p className="text-white/70">7j/7 - 24h/24</p>
                </div>
              </div>
              
              {/* Final CTA */}
              <div className="border-t border-white/20 pt-12">
                <button
                  onClick={() => handleContactShop('footer')}
                  className={`bg-gradient-to-r ${theme.accent} hover:shadow-2xl hover:shadow-green-500/25 text-white px-16 py-6 rounded-3xl font-black text-2xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl`}
                >
                  💬 Commencer à discuter
                </button>
                <p className="text-white/60 mt-6 text-lg">
                  Rejoignez des milliers de clients satisfaits • Livraison dans toute l'Afrique
                </p>
              </div>
            </div>
            
            {/* Copyright */}
            <div className="text-center mt-12">
              <p className="text-white/40 text-sm">
                © 2025 {shop.name} - Propulsé par <span className="font-bold text-white/60">ShopShap</span>
              </p>
              <p className="text-white/30 text-xs mt-2">
                Dernière mise à jour: 2025-08-03 17:14:28 UTC - Développé pour l'excellence africaine
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-180deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  );
}