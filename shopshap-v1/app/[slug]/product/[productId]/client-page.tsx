'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react'; // ✅ Import corrigé
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { generateWhatsAppLink, generateProductMessage } from '@/lib/whatsapp';

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
  shop_id: string;
};

// ✅ COPIE EXACTE de vos thèmes
const shopThemes = {
  elegant: {
    primary: 'from-slate-800 to-slate-900',
    accent: 'from-blue-600 to-indigo-600',
    card: 'bg-slate-800/50',
    border: 'border-slate-700/50'
  },
  warm: {
    primary: 'from-orange-800 to-red-900', 
    accent: 'from-orange-500 to-red-500',
    card: 'bg-orange-900/30',
    border: 'border-orange-700/50'
  },
  nature: {
    primary: 'from-green-800 to-emerald-900',
    accent: 'from-green-500 to-emerald-500',
    card: 'bg-green-900/30',
    border: 'border-green-700/50'
  },
  luxury: {
    primary: 'from-purple-800 to-violet-900',
    accent: 'from-purple-500 to-violet-500',
    card: 'bg-purple-900/30',
    border: 'border-purple-700/50'
  },
  modern: {
    primary: 'from-gray-800 to-gray-900',
    accent: 'from-cyan-500 to-blue-500',
    card: 'bg-gray-800/50',
    border: 'border-gray-700/50'
  },
  ocean: {
    primary: 'from-blue-900 to-teal-900',
    accent: 'from-blue-400 to-teal-400',
    card: 'bg-blue-900/30',
    border: 'border-blue-700/50'
  }
};

// ✅ COPIE EXACTE de MediaGallery
function MediaGallery({ productPhotoUrl, productVideoUrl, productName, theme }: {
  productPhotoUrl: string | null;
  productVideoUrl: string | null;
  productName: string;
  theme: any;
}) {
  const [activeMedia, setActiveMedia] = useState<'photo' | 'video'>('photo');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className={`relative overflow-hidden rounded-2xl ${theme.border} border-2 aspect-square group`}>
          {productPhotoUrl ? (
            <img
              src={productPhotoUrl}
              alt={productName}
              className={`w-full h-full object-cover transition-all duration-700 ${
                activeMedia === 'video' && productVideoUrl ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
              }`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {productVideoUrl && (
            <video
              ref={videoRef}
              src={productVideoUrl}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                activeMedia === 'video' ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
              controls
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {productVideoUrl && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setActiveMedia('photo')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                activeMedia === 'photo'
                  ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg`
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              📸 Photo
            </button>
            <button
              onClick={() => setActiveMedia('video')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                activeMedia === 'video'
                  ? `bg-gradient-to-r ${theme.accent} text-white shadow-lg`
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              🎥 Vidéo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductClientPage({ 
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
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  const theme = shopThemes[shop?.theme as keyof typeof shopThemes] || shopThemes.elegant;

  useEffect(() => {
    fetchProductData();
  }, [slug, productId]);

  // ✅ NOUVELLE FONCTION : Recherche par slug + productId
  async function fetchProductData() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Chargement produit avec slug:', { slug, productId });

      // ✅ 1. D'abord récupérer la boutique par slug
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single();

      console.log('🏪 Boutique récupérée:', shopData);
      console.log('❌ Erreur boutique:', shopError);

      if (shopError || !shopData) {
        console.error('❌ Erreur détaillée boutique:', shopError);
        notFound();
        return;
      }

      setShop(shopData);

      // ✅ 2. Ensuite récupérer le produit avec l'ID de la boutique
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('shop_id', shopData.id) // ✅ Utiliser l'ID de la boutique récupérée
        .single();

      console.log('📦 Produit récupéré:', productData);
      console.log('❌ Erreur produit:', productError);

      if (productError) {
        console.error('❌ Erreur détaillée produit:', productError);
        if (productError.code === 'PGRST116') {
          setError('Produit introuvable dans cette boutique');
        } else {
          setError('Erreur lors de la récupération du produit');
        }
        return;
      }

      if (!productData) {
        console.error('❌ Aucune donnée produit trouvée');
        setError('Produit introuvable');
        return;
      }

      setProduct(productData);
      console.log('✅ Produit défini:', productData);

      // ✅ 3. Générer les signed URLs (identique à votre code)
      console.log('🔗 Génération des signed URLs...');

      // Photo du produit
      if (productData.photo_url) {
        console.log('📸 Génération URL photo produit:', productData.photo_url);
        try {
          const { data: photoData, error: photoError } = await supabase.storage
            .from('shop-photos')
            .createSignedUrl(productData.photo_url, 60 * 60);
          
          if (photoError) {
            console.error('❌ Erreur signed URL photo:', photoError);
          } else {
            setProductPhotoUrl(photoData?.signedUrl ?? null);
            console.log('✅ Photo URL générée');
          }
        } catch (photoErr) {
          console.error('💥 Erreur génération photo URL:', photoErr);
        }
      }

      // Vidéo du produit
      if (productData.video_url) {
        console.log('🎥 Génération URL vidéo produit:', productData.video_url);
        try {
          const { data: videoData, error: videoError } = await supabase.storage
            .from('product-videos')
            .createSignedUrl(productData.video_url, 60 * 60);
          
          if (videoError) {
            console.error('❌ Erreur signed URL vidéo:', videoError);
          } else {
            setProductVideoUrl(videoData?.signedUrl ?? null);
            console.log('✅ Vidéo URL générée');
          }
        } catch (videoErr) {
          console.error('💥 Erreur génération vidéo URL:', videoErr);
        }
      }

      // Photo de la boutique
      if (shopData.photo_url) {
        console.log('🏪 Génération URL photo boutique:', shopData.photo_url);
        try {
          const { data: shopPhotoData, error: shopPhotoError } = await supabase.storage
            .from('shop-photos')
            .createSignedUrl(shopData.photo_url, 60 * 60);
          
          if (shopPhotoError) {
            console.error('❌ Erreur signed URL photo boutique:', shopPhotoError);
          } else {
            setShopPhotoUrl(shopPhotoData?.signedUrl ?? null);
            console.log('✅ Photo boutique URL générée');
          }
        } catch (shopPhotoErr) {
          console.error('💥 Erreur génération photo boutique URL:', shopPhotoErr);
        }
      }

      console.log('✅ Chargement terminé avec succès');

    } catch (err) {
      console.error('💥 Erreur générale chargement produit:', err);
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
          text: `Découvrez ${product?.name} - ${product?.price.toLocaleString()} FCFA`,
          url: window.location.href,
        }).catch(err => console.log('Erreur partage:', err));
      } else {
        navigator.clipboard.writeText(window.location.href);
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 3000);
      }
    }
  }

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-br ${theme.primary}`}>
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        <p className="text-white/80 mt-4 text-lg">Chargement du produit...</p>
      </div>
    );
  }

  if (error || !product || !shop) {
    notFound();
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.primary} font-sans`}>
      {/* ✅ Enhanced Header avec breadcrumb mis à jour */}
      <header className="relative">
        <div className={`absolute inset-0 bg-gradient-to-r ${theme.accent} opacity-10`} />
        <div className="relative backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Breadcrumb avec nouveau lien */}
            <nav className="flex items-center space-x-3 text-sm text-white/70 mb-6">
              <button
                onClick={() => router.push(`/${slug}`)} 
                className="hover:text-white transition-colors duration-200 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                {shop.name}
              </button>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
              </svg>
              <span className="text-white font-medium">{product.name}</span>
            </nav>
            
            {/* ✅ Indicateur de slug */}
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-1 text-white text-xs font-medium">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                <span>/{slug}/product/{productId}</span>
              </div>
            </div>
            
            {/* Info boutique reste identique */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {shopPhotoUrl && (
                  <div className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} rounded-full blur-lg opacity-40`} />
                    <img
                      src={shopPhotoUrl}
                      alt={shop.name}
                      className="relative w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-xl"
                    />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{shop.name}</h2>
                <p className="text-white/80">{shop.activity} • {shop.city}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ COPIE EXACTE de votre Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Enhanced Media Gallery */}
          <div>
            <MediaGallery 
              productPhotoUrl={productPhotoUrl}
              productVideoUrl={productVideoUrl}
              productName={product.name}
              theme={theme}
            />
          </div>

          {/* Enhanced Product Information */}
          <div className="space-y-8">
            {/* Titre et prix */}
            <div className={`${theme.card} backdrop-blur-sm border ${theme.border} rounded-2xl p-8 shadow-xl`}>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
                {product.name}
              </h1>
              
              <div className={`text-4xl lg:text-5xl font-bold bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent mb-6`}>
                {product.price.toLocaleString()} FCFA
              </div>
              
              {/* Badge stock */}
              {product.stock !== undefined && product.stock !== null && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${
                  product.stock > 0 
                    ? 'bg-green-600/20 text-green-400 border-green-600/50' 
                    : 'bg-red-600/20 text-red-400 border-red-600/50'
                }`}>
                  {product.stock > 0 ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {product.stock} disponible{product.stock > 1 ? 's' : ''}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      Rupture de stock
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Description reste identique */}
            {product.description && (
              <div className={`${theme.card} backdrop-blur-sm border ${theme.border} rounded-2xl p-8 shadow-xl`}>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Description
                </h3>
                <p className="text-white/90 leading-relaxed whitespace-pre-line text-lg">
                  {product.description}
                </p>
              </div>
            )}

            {/* Actions principales reste identique */}
            <div className="space-y-4">
              <button
                onClick={handleOrderProduct}
                disabled={product.stock === 0}
                className={`w-full py-6 px-8 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                  product.stock === 0
                    ? 'bg-gray-600 cursor-not-allowed opacity-50 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 hover:shadow-green-500/25'
                }`}
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                {product.stock === 0 ? 'Produit épuisé' : 'Commander sur WhatsApp'}
              </button>

              {/* Actions secondaires avec lien mis à jour */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push(`/${slug}`)} 
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white py-4 px-6 rounded-xl font-bold border border-white/20 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  Voir la boutique
                </button>
                <button
                  onClick={handleShareProduct}
                  className={`bg-gradient-to-r ${theme.accent} hover:opacity-90 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 relative`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                  </svg>
                  Partager
                  {showShareSuccess && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium animate-pulse">
                      Lien copié !
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* ✅ COPIE EXACTE du reste de votre code - Info boutique détaillée, etc. */}
            <div className={`${theme.card} backdrop-blur-sm border ${theme.border} rounded-2xl p-8 shadow-xl`}>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                À propos de la boutique
              </h3>
              
              <div className="flex items-start gap-6">
                <div className="relative flex-shrink-0">
                  {shopPhotoUrl && (
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} rounded-full blur-lg opacity-30`} />
                      <img
                        src={shopPhotoUrl}
                        alt={shop.name}
                        className="relative w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-xl"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-white mb-2">{shop.name}</h4>
                  <p className={`text-lg font-semibold bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent mb-2`}>
                    {shop.activity}
                  </p>
                  <p className="text-white/80 flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {shop.city}
                  </p>
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

      {/* ✅ COPIE EXACTE du Footer */}
      <footer className="relative mt-20">
        <div className={`absolute inset-0 bg-gradient-to-t ${theme.accent} opacity-5`} />
        <div className="relative backdrop-blur-sm border-t border-white/10 py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold mb-3 text-white">{shop.name}</h3>
            <p className="text-white/80 mb-6 text-lg">{shop.activity} • {shop.city}</p>
            <button
              onClick={handleOrderProduct}
              disabled={product.stock === 0}
              className={`py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl flex items-center gap-3 mx-auto ${
                product.stock === 0
                  ? 'bg-gray-600 cursor-not-allowed opacity-50 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 hover:shadow-green-500/25'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              {product.stock === 0 ? 'Produit épuisé' : 'Commander sur WhatsApp'}
            </button>
            <div className="mt-8 pt-8 border-t border-white/10 text-sm text-white/50">
              <p>Boutique en ligne propulsée par <span className="font-semibold">ShopShap</span></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}