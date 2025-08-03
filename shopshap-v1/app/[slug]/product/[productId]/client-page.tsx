'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { generateWhatsAppLink, generateProductMessage } from '@/lib/whatsapp';
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
  shop_id: string;
  category?: string;
  features?: string[];
  specifications?: Record<string, string>;
};

// ✨ Enhanced Modern Themes
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

// ✨ Ultra Modern Loading Component
function UltraModernLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      <div className="relative">
        {/* Animated rings */}
        <div className="w-32 h-32 border-4 border-blue-200/20 rounded-full animate-pulse"></div>
        <div className="absolute inset-2 w-28 h-28 border-4 border-blue-400/40 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-6 w-20 h-20 border-4 border-purple-400/40 border-t-purple-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '2s'}}></div>
        
        {/* Center product icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
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
        <p className="text-white/90 text-xl font-semibold">Chargement du produit</p>
        <p className="text-white/60 text-sm">Préparation des détails...</p>
      </div>
    </div>
  );
}

// ✨ Ultra Modern Media Gallery
function UltraModernMediaGallery({ productPhotoUrl, productVideoUrl, productName, theme }: {
  productPhotoUrl: string | null;
  productVideoUrl: string | null;
  productName: string;
  theme: any;
}) {
  const [activeMedia, setActiveMedia] = useState<'photo' | 'video'>('photo');
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <div className="space-y-6">
      {/* Main Media Display */}
      <div className="relative group">
        <div 
          className={`relative overflow-hidden rounded-3xl border-2 ${theme.glass} aspect-square transition-all duration-700 hover:scale-[1.02]`}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20"></div>
          
          {/* Photo Display */}
          {productPhotoUrl ? (
            <img
              src={productPhotoUrl}
              alt={productName}
              className={`w-full h-full object-cover transition-all duration-700 ${
                activeMedia === 'video' && productVideoUrl ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
              } ${isZoomed ? 'scale-110' : 'scale-100'}`}
              style={isZoomed ? {
                transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`
              } : {}}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Image du produit</p>
              </div>
            </div>
          )}

          {/* Video Overlay */}
          {productVideoUrl && (
            <video
              ref={videoRef}
              src={productVideoUrl}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                activeMedia === 'video' ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
              controls={activeMedia === 'video'}
              playsInline
              preload="metadata"
            />
          )}

          {/* Overlay Effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Zoom Indicator */}
          {isZoomed && activeMedia === 'photo' && (
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl text-white px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Zoom actif
            </div>
          )}
        </div>

        {/* Media Type Switcher */}
        {productVideoUrl && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveMedia('photo')}
              className={`flex-1 py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                activeMedia === 'photo'
                  ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg shadow-blue-500/25 scale-105`
                  : `${theme.glass} text-white/70 hover:bg-white/10 hover:text-white hover:scale-105`
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>Photo HD</span>
            </button>
            <button
              onClick={() => setActiveMedia('video')}
              className={`flex-1 py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                activeMedia === 'video'
                  ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg shadow-blue-500/25 scale-105`
                  : `${theme.glass} text-white/70 hover:bg-white/10 hover:text-white hover:scale-105`
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 4a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h14z"></path>
              </svg>
              <span>Vidéo</span>
            </button>
          </div>
        )}
      </div>

      {/* Media Info Bar */}
      <div className={`${theme.glass} rounded-2xl p-4`}>
        <div className="flex items-center justify-between text-sm text-white/70">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Image haute qualité</span>
          </div>
          <div className="flex items-center gap-4">
            {productVideoUrl && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                <span>Avec vidéo</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <span>Zoom disponible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✨ Enhanced Breadcrumb Navigation
function EnhancedBreadcrumb({ shop, product, theme, onNavigate }: {
  shop: Shop;
  product: Product;
  theme: any;
  onNavigate: (path: string) => void;
}) {
  return (
    <nav className="flex items-center space-x-3 text-sm mb-8">
      <button
        onClick={() => onNavigate(`/${shop.slug}`)}
        className={`group flex items-center gap-2 px-4 py-2 ${theme.glass} rounded-xl hover:scale-105 transition-all duration-300`}
      >
        <div className={`w-8 h-8 bg-gradient-to-r ${theme.accent} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <span className="text-white font-bold text-sm">
            {shop.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-white/80 group-hover:text-white font-medium">{shop.name}</span>
      </button>
      
      <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
      </svg>
      
      <div className={`px-4 py-2 ${theme.glass} rounded-xl`}>
        <span className="text-white font-semibold">{product.name}</span>
      </div>
    </nav>
  );
}

// ✨ Enhanced Product Actions
function EnhancedProductActions({ product, shop, theme, onOrder, onShare, onViewShop }: {
  product: Product;
  shop: Shop;
  theme: any;
  onOrder: () => void;
  onShare: () => void;
  onViewShop: () => void;
}) {
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  const handleShare = () => {
    onShare();
    setShowShareSuccess(true);
    setTimeout(() => setShowShareSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Primary Action */}
      <button
        onClick={onOrder}
        disabled={product.stock === 0}
        className={`group relative w-full py-6 px-8 rounded-3xl font-bold text-xl overflow-hidden transition-all duration-300 shadow-2xl ${
          product.stock === 0
            ? 'bg-gray-600 cursor-not-allowed opacity-50 text-white'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105 hover:shadow-green-500/25'
        }`}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        
        <div className="relative flex items-center justify-center gap-4">
          <svg className="w-7 h-7 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
          <span>{product.stock === 0 ? 'Produit épuisé' : 'Commander sur WhatsApp'}</span>
        </div>
      </button>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onViewShop}
          className={`group ${theme.glass} hover:bg-white/10 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3`}
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <span>Voir la boutique</span>
        </button>
        
        <button
          onClick={handleShare}
          className={`group relative bg-gradient-to-r ${theme.accent} hover:opacity-90 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 overflow-hidden`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          <div className="relative flex items-center gap-3">
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
            </svg>
            <span>Partager</span>
          </div>
          
          {showShareSuccess && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-xl animate-bounce">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
                Lien copié !
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

// ✨ Main Product Page Component
export default function UltraModernProductPage({ 
  slug, 
  productId 
}: { 
  slug: string; 
  productId: string; 
}) {
  const router = useRouter();
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [shopPhotoUrl, setShopPhotoUrl] = useState<string | null>(null);
  const [productPhotoUrl, setProductPhotoUrl] = useState<string | null>(null);
  const [productVideoUrl, setProductVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = shopThemes[shop?.theme as keyof typeof shopThemes] || shopThemes.elegant;

  useEffect(() => {
    fetchProductData();
  }, [slug, productId]);

  async function fetchProductData() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading product:', { slug, productId });

      // Get shop by slug
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single();

      if (shopError || !shopData) {
        console.error('❌ Shop error:', shopError);
        notFound();
        return;
      }

      setShop(shopData);

      // Get product by ID and shop_id
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('shop_id', shopData.id)
        .single();

      if (productError || !productData) {
        console.error('❌ Product error:', productError);
        notFound();
        return;
      }

      setProduct(productData);

      // Generate signed URLs
      if (productData.photo_url) {
        try {
          const { data: photoData } = await supabase.storage
            .from('shop-photos')
            .createSignedUrl(productData.photo_url, 60 * 60);
          setProductPhotoUrl(photoData?.signedUrl ?? null);
        } catch (err) {
          console.warn('Photo URL error:', err);
        }
      }

      if (productData.video_url) {
        try {
          const { data: videoData } = await supabase.storage
            .from('product-videos')
            .createSignedUrl(productData.video_url, 60 * 60);
          setProductVideoUrl(videoData?.signedUrl ?? null);
        } catch (err) {
          console.warn('Video URL error:', err);
        }
      }

      if (shopData.photo_url) {
        try {
          const { data: shopPhotoData } = await supabase.storage
            .from('shop-photos')
            .createSignedUrl(shopData.photo_url, 60 * 60);
          setShopPhotoUrl(shopPhotoData?.signedUrl ?? null);
        } catch (err) {
          console.warn('Shop photo URL error:', err);
        }
      }

    } catch (err) {
      console.error('💥 General error:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function handleOrderProduct() {
    if (!shop || !product) return;

    const message = generateProductMessage({
      productName: product.name,
      price: product.price,
      description: product.description,
      shopName: shop.name,
      productUrl: window.location.href,
    });

    const whatsappUrl = generateWhatsAppLink('', message);
    window.open(whatsappUrl, '_blank');
  }

  function handleShareProduct() {
    if (typeof window !== 'undefined') {
      if (navigator.share && 'share' in navigator) {
        navigator.share({
          title: product?.name,
          text: `Découvrez ${product?.name} - ${product?.price.toLocaleString()} FCFA chez ${shop?.name}`,
          url: window.location.href,
        }).catch(err => console.log('Share error:', err));
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    }
  }

  if (loading) {
    return <UltraModernLoader />;
  }

  if (error || !product || !shop) {
    notFound();
  }

  return (
    <>
      <Head>
        <title>{product.name} - {shop.name} | ShopShap</title>
        <meta name="description" content={product.description || `${product.name} - ${product.price.toLocaleString()} FCFA chez ${shop.name} à ${shop.city}`} />
        <meta name="keywords" content={`${product.name}, ${shop.activity}, ${shop.city}, ${shop.name}, acheter, whatsapp, e-commerce`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${product.name} - ${shop.name}`} />
        <meta property="og:description" content={product.description || `${product.name} - ${product.price.toLocaleString()} FCFA`} />
        <meta property="og:image" content={productPhotoUrl || shopPhotoUrl || '/default-product-og.jpg'} />
        <meta property="og:url" content={`https://shopshap.com/${shop.slug}/product/${product.id}`} />
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={product.price.toString()} />
        <meta property="product:price:currency" content="XOF" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} - ${shop.name}`} />
        <meta name="twitter:description" content={product.description || `${product.price.toLocaleString()} FCFA`} />
        <meta name="twitter:image" content={productPhotoUrl || shopPhotoUrl || '/default-product-twitter.jpg'} />
        
        {/* SEO */}
        <link rel="canonical" href={`https://shopshap.com/${shop.slug}/product/${product.id}`} />
        <meta name="robots" content="index, follow" />
        
        {/* Preload */}
        {productPhotoUrl && <link rel="preload" as="image" href={productPhotoUrl} />}
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "image": productPhotoUrl,
            "sku": product.id,
            "offers": {
              "@type": "Offer",
              "price": product.price,
              "priceCurrency": "XOF",
              "availability": product.stock && product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "seller": {
                "@type": "Organization",
                "name": shop.name,
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": shop.city
                }
              }
            },
            "brand": {
              "@type": "Brand",
              "name": shop.name
            }
          })}
        </script>
      </Head>

      <div className={`min-h-screen bg-gradient-to-br ${theme.primary} font-sans relative overflow-x-hidden`}>
        {/* Floating Background Elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        {/* Header */}
        <header className="relative z-10">
          <div className={`${theme.overlay} backdrop-blur-2xl border-b border-white/10`}>
            <div className="max-w-7xl mx-auto px-4 py-8">
              <EnhancedBreadcrumb 
                shop={shop} 
                product={product} 
                theme={theme} 
                onNavigate={(path) => router.push(path)} 
              />
              
              {/* Shop Info Bar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {shopPhotoUrl && (
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} rounded-2xl blur-xl opacity-40 scale-110`}></div>
                      <img
                        src={shopPhotoUrl}
                        alt={shop.name}
                        className="relative w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-2xl"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{shop.name}</h2>
                  <p className={`text-lg bg-gradient-to-r ${theme.highlight} bg-clip-text text-transparent font-semibold`}>
                    {shop.activity}
                  </p>
                  <div className="flex items-center gap-2 text-white/70 mt-1">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    </svg>
                    <span>{shop.city}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
            {/* Media Gallery */}
            <div>
              <UltraModernMediaGallery 
                productPhotoUrl={productPhotoUrl}
                productVideoUrl={productVideoUrl}
                productName={product.name}
                theme={theme}
              />
            </div>

            {/* Product Information */}
            <div className="space-y-8">
              {/* Product Header */}
              <div className={`${theme.glass} rounded-3xl p-8 backdrop-blur-xl shadow-2xl`}>
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                  {product.name}
                </h1>
                
                <div className={`text-5xl lg:text-6xl font-black bg-gradient-to-r ${theme.highlight} bg-clip-text text-transparent mb-8`}>
                  {product.price.toLocaleString()} <span className="text-2xl">FCFA</span>
                </div>
                
                {/* Stock Status */}
                {product.stock !== undefined && product.stock !== null && (
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold border-2 ${
                      product.stock > 0 
                        ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                        : 'bg-red-500/20 text-red-400 border-red-500/50'
                    }`}>
                      {product.stock > 0 ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <span>{product.stock} disponible{product.stock > 1 ? 's' : ''}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                          <span>Rupture de stock</span>
                        </>
                      )}
                    </div>
                    
                    {product.stock && product.stock <= 3 && product.stock > 0 && (
                      <div className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-xl font-bold text-sm border border-orange-500/50 animate-pulse">
                        ⚡ Stock limité !
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product Description */}
              {product.description && (
                <div className={`${theme.glass} rounded-3xl p-8 backdrop-blur-xl shadow-2xl`}>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${theme.accent} rounded-xl flex items-center justify-center`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                    Description détaillée
                  </h3>
                  <div className="prose prose-lg prose-invert max-w-none">
                    <p className="text-white/90 leading-relaxed whitespace-pre-line text-lg">
                      {product.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Product Actions */}
              <EnhancedProductActions
                product={product}
                shop={shop}
                theme={theme}
                onOrder={handleOrderProduct}
                onShare={handleShareProduct}
                onViewShop={() => router.push(`/${slug}`)}
              />

              {/* Shop Information */}
              <div className={`${theme.glass} rounded-3xl p-8 backdrop-blur-xl shadow-2xl`}>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${theme.accent} rounded-xl flex items-center justify-center`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                  À propos de {shop.name}
                </h3>
                
                <div className="flex items-start gap-6">
                  <div className="relative flex-shrink-0">
                    {shopPhotoUrl && (
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} rounded-2xl blur-lg opacity-40 scale-110`}></div>
                        <img
                          src={shopPhotoUrl}
                          alt={shop.name}
                          className="relative w-24 h-24 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">{shop.name}</h4>
                    <p className={`text-lg font-semibold bg-gradient-to-r ${theme.highlight} bg-clip-text text-transparent mb-3`}>
                      {shop.activity}
                    </p>
                    <div className="flex items-center gap-2 text-white/80 mb-4">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span className="font-medium">{shop.city}</span>
                    </div>
                    {shop.description && (
                      <p className="text-white/90 leading-relaxed">
                        {shop.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Enhanced Footer */}
        <footer className="relative z-10 mt-24">
          <div className={`${theme.overlay} backdrop-blur-2xl border-t border-white/10`}>
            <div className="max-w-6xl mx-auto px-4 py-16">
              <div className={`${theme.glass} rounded-3xl p-12 text-center backdrop-blur-xl shadow-2xl`}>
                <div className="mb-8">
                  <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${theme.accent} rounded-3xl shadow-2xl mb-6`}>
                    <span className="text-white font-black text-2xl">
                      {shop.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2">{shop.name}</h3>
                  <p className="text-xl text-white/80">{shop.activity} • {shop.city}</p>
                </div>
                
                <button
                  onClick={handleOrderProduct}
                  disabled={product.stock === 0}
                  className={`group relative py-6 px-12 rounded-3xl font-black text-xl overflow-hidden transition-all duration-300 shadow-2xl ${
                    product.stock === 0
                      ? 'bg-gray-600 cursor-not-allowed opacity-50 text-white'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-110 hover:shadow-green-500/25'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  
                  <div className="relative flex items-center gap-4">
                    <svg className="w-6 h-6 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <span>{product.stock === 0 ? 'Produit épuisé' : 'Commander maintenant'}</span>
                  </div>
                </button>
                
                <div className="mt-12 pt-8 border-t border-white/20 text-sm text-white/50">
                  <p>Boutique en ligne propulsée par <span className="font-bold text-white/70">ShopShap</span></p>
                  <p className="mt-2 text-xs">Dernière mise à jour: 2025-08-03 17:31:20 UTC</p>
                </div>
              </div>
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
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .prose h1, .prose h2, .prose h3 {
          color: white;
        }
        
        .prose p {
          color: rgba(255, 255, 255, 0.9);
        }
      `}</style>
    </>
  );
}