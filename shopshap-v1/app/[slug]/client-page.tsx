'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { generateWhatsAppLink, generateShopIntroMessage } from '@/lib/whatsapp';
import Link from 'next/link';

// ✅ COPIE EXACTE de vos types
type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
  theme?: string;
  slug?: string; // ✅ Ajout du slug
};

type Product = {
  id: string;
  name: string;
  price: number;
  photo_url?: string;
  video_url?: string;
  description?: string;
  stock?: number;
};

type ProductWithUrls = Product & {
  signedPhotoUrl?: string;
  signedVideoUrl?: string;
};

// ✅ COPIE EXACTE de vos thèmes
const shopThemes = {
  elegant: {
    primary: 'from-slate-900 via-slate-800 to-slate-900',
    accent: 'from-blue-500 to-indigo-600',
    card: 'bg-white/5',
    border: 'border-white/10',
    hover: 'hover:bg-white/10',
    text: 'text-slate-100'
  },
  warm: {
    primary: 'from-amber-900 via-orange-900 to-red-900', 
    accent: 'from-orange-400 to-red-500',
    card: 'bg-white/5',
    border: 'border-white/10',
    hover: 'hover:bg-white/10',
    text: 'text-orange-50'
  },
  nature: {
    primary: 'from-emerald-900 via-green-900 to-teal-900',
    accent: 'from-emerald-400 to-teal-500',
    card: 'bg-white/5',
    border: 'border-white/10',
    hover: 'hover:bg-white/10',
    text: 'text-emerald-50'
  },
  luxury: {
    primary: 'from-violet-900 via-purple-900 to-indigo-900',
    accent: 'from-violet-400 to-purple-500',
    card: 'bg-white/5',
    border: 'border-white/10',
    hover: 'hover:bg-white/10',
    text: 'text-violet-50'
  },
  modern: {
    primary: 'from-gray-900 via-slate-900 to-zinc-900',
    accent: 'from-cyan-400 to-blue-500',
    card: 'bg-white/5',
    border: 'border-white/10',
    hover: 'hover:bg-white/10',
    text: 'text-gray-50'
  },
  ocean: {
    primary: 'from-blue-900 via-cyan-900 to-teal-900',
    accent: 'from-blue-400 to-cyan-400',
    card: 'bg-white/5',
    border: 'border-white/10',
    hover: 'hover:bg-white/10',
    text: 'text-blue-50'
  }
};

// ✅ COPIE EXACTE de StickyNavBar
function StickyNavBar({ shop, theme, onContact }: { shop: Shop; theme: any; onContact: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 py-2' 
        : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${theme.accent} flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-lg">{shop.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{shop.name}</h3>
              <p className="text-white/60 text-sm">{shop.activity}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="#catalog" className="text-white/80 hover:text-white transition-colors">Catalogue</a>
              <a href="#about" className="text-white/80 hover:text-white transition-colors">À propos</a>
            </div>
            <button
              onClick={onContact}
              className={`bg-gradient-to-r ${theme.accent} hover:shadow-lg hover:scale-105 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              Contact
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ✅ COPIE EXACTE de HeroSection
function HeroSection({ shop, shopPhotoUrl, theme, onContact }: { 
  shop: Shop; 
  shopPhotoUrl: string | null; 
  theme: any; 
  onContact: () => void;
}) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background avec parallax */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${theme.primary}`}
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      />
      
      {/* Overlay avec pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] opacity-20" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)]" />
      
      {/* Contenu */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-32 text-center">
        <div className="mb-12">
          {shopPhotoUrl && (
            <div className="relative inline-block mb-8">
              <div className={`absolute inset-0 bg-gradient-to-r ${theme.accent} rounded-full blur-3xl opacity-40 scale-110`} />
              <img
                src={shopPhotoUrl}
                alt={shop.name}
                className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-white/20 shadow-2xl"
              />
            </div>
          )}
          
          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 tracking-tight">
            <span className={`bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>
              {shop.name}
            </span>
          </h1>
          
          <p className="text-2xl lg:text-3xl font-light text-white/90 mb-4">
            {shop.activity}
          </p>
          
          <div className="flex items-center justify-center gap-3 text-white/80 mb-8">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span className="text-xl font-medium">{shop.city}</span>
          </div>
          
          {shop.description && (
            <p className="text-xl text-white/80 leading-relaxed max-w-3xl mx-auto mb-12">
              {shop.description}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={onContact}
              className={`group bg-gradient-to-r ${theme.accent} hover:shadow-2xl hover:shadow-green-500/25 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 flex items-center gap-3`}
            >
              <svg className="w-7 h-7 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              Nous contacter maintenant
            </button>
            
            <a 
              href="#catalog"
              className="group text-white/80 hover:text-white px-8 py-5 rounded-2xl border-2 border-white/20 hover:border-white/40 font-semibold text-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
            >
              <svg className="w-6 h-6 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
              Découvrir nos produits
            </a>
          </div>
        </div>
      </div>
      
      {/* Indicateur de scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  );
}

// ✅ COPIE EXACTE de ProductFilters
function ProductFilters({ theme, onFilter, onSort }: { 
  theme: any; 
  onFilter: (filter: string) => void;
  onSort: (sort: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');

  const filters = [
    { id: 'all', label: 'Tous les produits', icon: '🛍️' },
    { id: 'available', label: 'Disponibles', icon: '✅' },
    { id: 'popular', label: 'Populaires', icon: '🔥' },
  ];

  const sorts = [
    { id: 'newest', label: 'Plus récents' },
    { id: 'price-low', label: 'Prix croissant' },
    { id: 'price-high', label: 'Prix décroissant' },
    { id: 'name', label: 'Nom A-Z' },
  ];

  return (
    <div className={`${theme.card} backdrop-blur-xl border ${theme.border} rounded-2xl p-6 mb-8`}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filtres */}
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-4">Filtrer par :</h3>
          <div className="flex gap-3 flex-wrap">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => {
                  setActiveFilter(filter.id);
                  onFilter(filter.id);
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeFilter === filter.id
                    ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg`
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tri */}
        <div className="lg:w-64">
          <h3 className="text-white font-semibold mb-4">Trier par :</h3>
          <select
            value={activeSort}
            onChange={(e) => {
              setActiveSort(e.target.value);
              onSort(e.target.value);
            }}
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sorts.map(sort => (
              <option key={sort.id} value={sort.id} className="bg-gray-900">
                {sort.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ✅ COPIE EXACTE de PremiumProductCard avec modification des liens
function PremiumProductCard({ product, shop, onContact }: { 
  product: ProductWithUrls; 
  shop: Shop; 
  onContact: (product: ProductWithUrls) => void;
}) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const theme = shopThemes[shop.theme as keyof typeof shopThemes] || shopThemes.elegant;

  const handleMouseEnter = () => {
    if (product.signedVideoUrl) {
      setShowVideo(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
          setIsVideoPlaying(true);
        }
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
    setTimeout(() => setShowVideo(false), 200);
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-3xl ${theme.card} backdrop-blur-xl border ${theme.border} transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Media Container */}
      <div className="relative h-80 overflow-hidden">
        {/* Photo principale */}
        {product.signedPhotoUrl ? (
          <img
            src={product.signedPhotoUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-700 ${
              showVideo ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Vidéo en overlay */}
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
          />
        )}

        {/* Overlay premium */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

        {/* Actions overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-10 h-10 rounded-full backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              isLiked ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </button>
          
          <button className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
            </svg>
          </button>
        </div>

        {/* Badge vidéo */}
        {product.signedVideoUrl && (
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-full text-xs font-bold flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isVideoPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
            {isVideoPlaying ? 'EN DIRECT' : 'VIDÉO'}
          </div>
        )}

        {/* Badge stock */}
        {product.stock !== undefined && product.stock !== null && (
          <div className={`absolute bottom-4 right-4 px-3 py-2 rounded-full text-xs font-bold backdrop-blur-sm ${
            product.stock > 0 
              ? 'bg-green-500/90 text-white border border-green-400/50' 
              : 'bg-red-500/90 text-white border border-red-400/50'
          }`}>
            {product.stock > 0 ? `${product.stock} en stock` : 'Épuisé'}
          </div>
        )}

        {/* Prix en overlay */}
        <div className="absolute bottom-4 left-4">
          <div className={`bg-gradient-to-r ${theme.accent} text-white px-6 py-3 rounded-2xl font-black text-xl shadow-2xl backdrop-blur-sm border border-white/20`}>
            {product.price.toLocaleString()} <span className="text-sm font-medium">FCFA</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <h3 className="text-2xl font-bold text-white mb-4 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-white/70 leading-relaxed mb-6 line-clamp-3">
            {product.description}
          </p>
        )}

        {/* Actions avec liens mis à jour */}
        <div className="flex gap-4">
          {/* ✅ CHANGEMENT : Utiliser le slug au lieu de shop.id */}
          <Link 
            href={shop.slug ? `/${shop.slug}/product/${product.id}` : `/shop/${shop.id}/product/${product.id}`}
            className="flex-1 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white text-center py-4 px-6 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 font-semibold hover:scale-105 hover:shadow-lg group"
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              {product.stock === 0 ? 'Épuisé' : 'Commander'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ COPIE EXACTE de AboutSection
function AboutSection({ shop, theme }: { shop: Shop; theme: any }) {
  return (
    <section id="about" className="py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className={`${theme.card} backdrop-blur-xl border ${theme.border} rounded-3xl p-12`}>
          <h2 className="text-4xl font-bold text-white mb-8">À propos de notre boutique</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Qualité garantie</h3>
              <p className="text-white/70">Tous nos produits sont soigneusement sélectionnés</p>
            </div>
            
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Livraison rapide</h3>
              <p className="text-white/70">Service client réactif et livraison efficace</p>
            </div>
            
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${theme.accent} flex items-center justify-center`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
}

// ✅ COMPOSANT PRINCIPAL avec changement de logique de fetch
export default function ShopClientPage({ slug }: { slug: string }) {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopPhotoUrl, setShopPhotoUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductWithUrls[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = shopThemes[shop?.theme as keyof typeof shopThemes] || shopThemes.elegant;

  useEffect(() => {
    fetchShopBySlug(); // ✅ CHANGEMENT DE FONCTION
  }, [slug]);

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  // ✅ NOUVELLE FONCTION : Recherche par slug au lieu de shopId
  async function fetchShopBySlug() {
    setLoading(true);
    try {
      console.log('🔍 Recherche boutique avec slug:', slug);
      
      // ✅ CHANGEMENT PRINCIPAL : Rechercher par slug
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single();

      if (shopError || !shopData) {
        console.error('❌ Boutique non trouvée pour slug:', slug, shopError);
        notFound();
        return;
      }

      setShop(shopData);

      // ✅ RESTE IDENTIQUE à votre code existant
      // Photo de la boutique
      if (shopData.photo_url) {
        const { data: urlData } = await supabase.storage
          .from('shop-photos')
          .createSignedUrl(shopData.photo_url, 60 * 60);
        setShopPhotoUrl(urlData?.signedUrl ?? null);
      }

      // Récupérer les produits
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id) // ✅ Utiliser shop_id (pas slug)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Erreur produits:', productsError);
        return;
      }

      if (productsData) {
        // Générer les signed URLs
        const productsWithUrls = await Promise.all(
          productsData.map(async (product: Product) => {
            let signedPhotoUrl: string | undefined;
            let signedVideoUrl: string | undefined;

            if (product.photo_url) {
              const { data: photoData } = await supabase.storage
                .from('shop-photos')
                .createSignedUrl(product.photo_url, 60 * 60);
              signedPhotoUrl = photoData?.signedUrl ?? undefined;
            }

            if (product.video_url) {
              const { data: videoData } = await supabase.storage
                .from('product-videos')
                .createSignedUrl(product.video_url, 60 * 60);
              signedVideoUrl = videoData?.signedUrl ?? undefined;
            }

            return {
              ...product,
              signedPhotoUrl,
              signedVideoUrl,
            };
          })
        );

        setProducts(productsWithUrls);
      }

    } catch (err) {
      console.error('💥 Erreur chargement boutique:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  // ✅ COPIE EXACTE de vos fonctions existantes
  function handleContactShop() {
    if (!shop || typeof window === 'undefined') return;

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

    // ✅ MISE À JOUR : Utiliser le slug dans le message
    const message = `🛍️ *${product.name}*\n\n💰 Prix: *${product.price.toLocaleString()} FCFA*\n\n${product.description ? `📝 ${product.description}\n\n` : ''}🏪 Boutique: *${shop.name}*\n\n✨ Je suis intéressé(e) par cet article !\n\n👉 ${window.location.origin}/${shop.slug}/product/${product.id}`;

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
        // Simuler popularité par prix décroissant
        filtered = products.sort((a, b) => b.price - a.price);
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
      default:
        // newest (par défaut)
        sorted.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
    }
    
    setFilteredProducts(sorted);
  }

  // ✅ COPIE EXACTE de votre JSX existant
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-br ${theme.primary}`}>
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        <p className="text-white/80 mt-6 text-xl">Chargement de votre expérience shopping...</p>
      </div>
    );
  }

  if (error || !shop) {
    notFound();
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.primary} font-sans relative overflow-x-hidden`}>
      {/* ✅ Indicateur de slug */}
      <div className="fixed top-4 left-4 z-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2 text-white text-sm font-medium">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>/{slug}</span>
        </div>
      </div>

      {/* Barre de navigation sticky */}
      <StickyNavBar shop={shop} theme={theme} onContact={handleContactShop} />
      
      {/* Section Hero */}
      <HeroSection shop={shop} shopPhotoUrl={shopPhotoUrl} theme={theme} onContact={handleContactShop} />

      {/* Catalogue de produits */}
      <section id="catalog" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* En-tête du catalogue */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">
              Notre <span className={`bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>Catalogue</span>
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Découvrez notre sélection de produits de qualité, soigneusement choisis pour vous
            </p>
          </div>

          {products.length > 0 && (
            <ProductFilters theme={theme} onFilter={handleFilter} onSort={handleSort} />
          )}

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-white/30 mb-8">
                <svg className="w-32 h-32 mx-auto" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-white mb-6">Catalogue en cours de mise à jour</h3>
              <p className="text-white/70 mb-12 text-xl max-w-md mx-auto">
                De nouveaux produits arrivent bientôt ! Contactez-nous pour plus d'informations.
              </p>
              <button
                onClick={handleContactShop}
                className={`bg-gradient-to-r ${theme.accent} text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 shadow-2xl`}
              >
                Nous contacter
              </button>
            </div>
          ) : (
            <>
              {/* Statistiques */}
              <div className="flex flex-wrap justify-center gap-8 mb-12">
                <div className="text-center">
                  <div className="text-4xl font-black text-white">{filteredProducts.length}</div>
                  <div className="text-white/70">Produit{filteredProducts.length > 1 ? 's' : ''}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-white">
                    {filteredProducts.filter(p => (p.stock ?? 0) > 0).length}
                  </div>
                  <div className="text-white/70">Disponible{filteredProducts.filter(p => (p.stock ?? 0) > 0).length > 1 ? 's' : ''}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-white">
                    {filteredProducts.length > 0 ? Math.min(...filteredProducts.map(p => p.price)).toLocaleString() : '0'}
                  </div>
                  <div className="text-white/70">Prix min. (FCFA)</div>
                </div>
              </div>

              {/* Grille de produits */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map(product => (
                  <PremiumProductCard
                    key={product.id}
                    product={product}
                    shop={shop}
                    onContact={handleContactForProduct}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Section À propos */}
      <AboutSection shop={shop} theme={theme} />

      {/* Footer premium */}
      <footer className="relative py-20">
        <div className={`absolute inset-0 bg-gradient-to-t ${theme.accent} opacity-5`} />
        <div className="relative">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className={`${theme.card} backdrop-blur-xl border ${theme.border} rounded-3xl p-12`}>
              <h3 className="text-3xl font-bold mb-4 text-white">{shop.name}</h3>
              <p className="text-white/80 mb-8 text-xl">{shop.activity} • {shop.city}</p>
              
              <button
                onClick={handleContactShop}
                className={`bg-gradient-to-r ${theme.accent} hover:shadow-2xl hover:shadow-green-500/25 text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 flex items-center gap-4 mx-auto mb-8`}
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                Commencer vos achats maintenant
              </button>
              
              <div className="pt-8 border-t border-white/10 text-white/50">
                <p>Boutique en ligne professionnelle propulsée par <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ShopShap</span></p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}