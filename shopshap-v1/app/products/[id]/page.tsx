'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';
import { useToasts } from '@/hooks/useToast';

type Product = {
  id: number;
  name: string;
  price: number;
  photo_url: string | null;
  video_url: string | null;
  description: string | null;
  stock: number | null;
  shop_id: string;
  created_at: string;
  category?: string;
};

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
  user_id: string;
  slug?: string;
};

// ✨ Enhanced Navigation Items with semantic colors
const navigationItems = [
  {
    label: 'Accueil',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6"></path>
      </svg>
    ),
    route: '/dashboard',
    color: 'blue',
  },
  {
    label: 'Catalogue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
      </svg>
    ),
    route: '/products',
    active: true,
    color: 'purple',
  },
  {
    label: 'Commandes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2"></path>
      </svg>
    ),
    route: '/orders',
    color: 'emerald',
  },
  {
    label: 'Profil',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
    ),
    route: '/profile',
    color: 'amber',
  },
];

// ✨ Enhanced Loading Skeleton
function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 space-y-8">
      {/* Header Skeleton */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded mb-4"></div>
        <div className="h-12 bg-slate-700/50 rounded w-2/3 mb-4"></div>
        <div className="flex gap-4">
          <div className="h-6 bg-slate-700/30 rounded w-32"></div>
          <div className="h-6 bg-slate-700/30 rounded w-24"></div>
        </div>
      </div>
      
      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 animate-pulse">
          <div className="h-80 bg-slate-700/50 rounded-xl"></div>
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 animate-pulse">
              <div className="h-6 bg-slate-700/50 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-700/30 rounded"></div>
                <div className="h-4 bg-slate-700/30 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ✨ Enhanced Image Component with Loading States
function ProductImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className={`bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center border-2 border-dashed border-slate-600/50 ${className}`}>
        <div className="text-center">
          <svg className="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p className="text-slate-500 font-medium">Aucune image disponible</p>
          <p className="text-slate-600 text-sm mt-1">Ajoutez une photo pour améliorer la présentation</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-slate-700/50 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        className={`w-full h-full object-cover transition-all duration-500 hover:scale-105 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
}

// ✨ Enhanced Stock Badge Component
function StockBadge({ stock }: { stock: number | null }) {
  if (stock === null) return null;

  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 2;
  const isInStock = stock > 2;

  return (
    <span className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 ${
      isOutOfStock ? 'bg-red-900/30 text-red-400 border border-red-500/30' :
      isLowStock ? 'bg-amber-900/30 text-amber-400 border border-amber-500/30' :
      'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        isOutOfStock ? 'bg-red-400' :
        isLowStock ? 'bg-amber-400 animate-pulse' :
        'bg-emerald-400'
      }`}></div>
      {isOutOfStock ? 'Rupture de stock' :
       isLowStock ? `Stock faible: ${stock}` :
       `En stock: ${stock}`}
    </span>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToasts();
  const id = params?.id;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('/products');

  // ✨ Enhanced logout with smooth transitions
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      toast.success('Déconnecté', 'À bientôt sur ShopShap !');
      router.replace('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur', 'Problème lors de la déconnexion');
    }
  }, [router, toast]);

  const handleLogoutWithConfirm = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      if (dataLoaded || !id) return;
      
      setLoading(true);
      console.log('🔍 Début du chargement du produit ID:', id);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Erreur session:', sessionError);
          toast.error('Session expirée', 'Veuillez vous reconnecter');
          router.replace('/login');
          return;
        }

        if (!session?.user) {
          console.log('❌ Pas de session utilisateur');
          toast.error('Session expirée', 'Veuillez vous reconnecter');
          router.replace('/login');
          return;
        }

        console.log('✅ Utilisateur connecté:', session.user.id);

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            shops!inner(
              id,
              name,
              activity,
              city,
              photo_url,
              description,
              slug,
              user_id
            )
          `)
          .eq('id', id)
          .eq('shops.user_id', session.user.id)
          .single();

        console.log('📦 Données produit récupérées:', productData);

        if (productError || !productData) {
          console.error('❌ Produit introuvable ou accès refusé:', productError);
          toast.error('Produit introuvable', 'Ce produit n\'existe pas ou vous n\'y avez pas accès');
          router.replace('/products');
          return;
        }

        const shopData = productData.shops;
        const productOnly = {
          id: productData.id,
          name: productData.name,
          price: productData.price,
          photo_url: productData.photo_url,
          video_url: productData.video_url,
          description: productData.description,
          stock: productData.stock,
          shop_id: productData.shop_id,
          created_at: productData.created_at,
          category: productData.category,
        };

        setProduct(productOnly as Product);
        setShop(shopData as Shop);

        console.log('✅ Produit défini:', productOnly);
        console.log('✅ Boutique définie:', shopData);

        // ✨ Enhanced media URL generation
        if (productData.photo_url) {
          console.log('📸 Génération signed URL photo...');
          try {
            const { data: photoData, error: photoError } = await supabase
              .storage
              .from('shop-photos')
              .createSignedUrl(productData.photo_url, 60 * 60);
            
            if (photoError) {
              console.error('❌ Erreur signed URL photo:', photoError);
            } else {
              setPhotoUrl(photoData?.signedUrl ?? null);
              console.log('✅ Photo URL générée');
            }
          } catch (photoErr) {
            console.error('💥 Erreur génération photo URL:', photoErr);
          }
        }

        if (productData.video_url) {
          console.log('🎥 Génération signed URL vidéo...');
          try {
            const { data: videoData, error: videoError } = await supabase
              .storage
              .from('product-videos')
              .createSignedUrl(productData.video_url, 60 * 60);
            
            if (videoError) {
              console.error('❌ Erreur signed URL vidéo:', videoError);
            } else {
              setVideoUrl(videoData?.signedUrl ?? null);
              console.log('✅ Vidéo URL générée');
            }
          } catch (videoErr) {
            console.error('💥 Erreur génération vidéo URL:', videoErr);
          }
        }

        // ✨ Enhanced contextual messages
        if (productData.stock !== null && productData.stock <= 2) {
          setTimeout(() => {
            if (productData.stock === 0) {
              toast.warning('Produit en rupture', 'Ce produit n\'est plus disponible');
            } else {
              toast.warning('Stock faible', `Plus que ${productData.stock} unité(s) disponible(s)`);
            }
          }, 1000);
        }

        setDataLoaded(true);
        console.log('✅ Chargement terminé avec succès');

      } catch (error) {
        console.error('💥 Erreur générale chargement produit:', error);
        toast.error('Erreur réseau', 'Vérifiez votre connexion internet');
        router.replace('/products');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id, dataLoaded, toast, router]);

  // ✨ Enhanced delete handler
  const handleDeleteProduct = async () => {
    if (!product) return;
    
    const confirmed = confirm(
      `⚠️ Confirmation de suppression\n\nÊtes-vous sûr de vouloir supprimer "${product.name}" ?\n\nCette action est irréversible et le produit sera définitivement supprimé de votre catalogue.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      console.log('🗑️ Suppression du produit:', product.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Session expirée', 'Veuillez vous reconnecter');
        router.replace('/login');
        return;
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)
        .eq('shop_id', shop?.id);

      if (error) {
        console.error('❌ Erreur suppression:', error);
        toast.error('Erreur suppression', 'Impossible de supprimer le produit');
        return;
      }

      console.log('✅ Produit supprimé avec succès');
      toast.success('Produit supprimé', `"${product.name}" a été retiré de votre catalogue`);
      
      // ✨ Smooth transition to products page
      setTimeout(() => {
        router.push('/products');
      }, 1500);

    } catch (error) {
      console.error('💥 Erreur générale suppression:', error);
      toast.error('Erreur inattendue', 'Une erreur est survenue lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  // ✨ Enhanced date formatting
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNavigation = (route: string) => {
    setActiveTab(route);
    router.push(route);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950 p-4">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Produit introuvable</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Ce produit n'existe pas ou vous n'y avez pas accès. Il a peut-être été supprimé ou vous n'en êtes pas le propriétaire.
          </p>
          <Link href="/products">
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/25 active:scale-95">
              Retour au catalogue
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-blue-950 pb-24 sm:pb-8">
      {/* ✨ Enhanced Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity duration-300"
            onClick={() => setShowLogoutConfirm(false)}
          />
          
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Déconnexion</h3>
              </div>
              
              <p className="text-slate-300 mb-6">
                Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à vos produits.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px]"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px]"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ✨ Enhanced Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 safe-area-bottom">
          <div className="flex items-center justify-around px-2 py-3">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.route)}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 min-w-[60px] min-h-[44px] ${
                  activeTab === item.route
                    ? `bg-${item.color}-600/20 text-${item.color}-400 scale-110`
                    : 'text-slate-400 hover:text-white hover:scale-105'
                } active:scale-95`}
              >
                <div className={`transition-all duration-300 ${activeTab === item.route ? 'scale-110' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-xs font-medium mt-1 transition-all duration-300">
                  {item.label}
                </span>
                {activeTab === item.route && (
                  <div className={`w-1 h-1 bg-${item.color}-400 rounded-full mt-1 animate-pulse`}></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ✨ Enhanced Desktop Navigation */}
      <nav className="hidden sm:flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex gap-2">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.route)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 min-h-[44px] ${
                activeTab === item.route
                  ? `bg-gradient-to-r from-${item.color}-600 to-${item.color}-700 text-white shadow-lg scale-105`
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:scale-105'
              } active:scale-95`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        
        <button
          onClick={handleLogoutWithConfirm}
          className="text-red-400 hover:text-red-300 transition-all duration-300 font-semibold flex items-center gap-2 px-4 py-2 hover:bg-red-900/20 rounded-xl min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"></path>
          </svg>
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </nav>

      {/* ✨ Enhanced Main Content */}
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* ✨ Enhanced Header */}
        <header>
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/30">
              <Link href="/products">
                <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 group">
                  <svg 
                    className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth={2} 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">Catalogue</span>
                </button>
              </Link>
              
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                </svg>
                <span className="text-purple-400 font-medium truncate max-w-xs">{product.name}</span>
              </div>
            </div>

            {/* Product Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
                    </svg>
                  </div>
                  <span className="line-clamp-2">{product.name}</span>
                </h1>
                
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                    {product.price.toLocaleString()} FCFA
                  </span>
                  
                  <StockBadge stock={product.stock} />
                  
                  {product.category && (
                    <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm font-medium border border-purple-500/30">
                      {product.category}
                    </span>
                  )}
                </div>
                
                <p className="text-slate-400 mt-3 text-sm">
                  Créé le {formatDate(product.created_at)}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {shop && (
                  <ShareButton
                    url={shop.slug ? `/${shop.slug}/product/${product.id}` : `/shop/${shop.id}/product/${product.id}`}
                    title={product.name}
                    description={`${product.price.toLocaleString()} FCFA ${product.description ? `- ${product.description.slice(0, 50)}...` : ''}`}
                    type="product"
                    variant="secondary"
                    size="md"
                    className="min-h-[44px]"
                    onClick={() => toast.success('Lien copié !', 'Prêt à partager sur TikTok et WhatsApp')}
                  />
                )}
                
                <Link href={`/products/${product.id}/edit`}>
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/25 active:scale-95 flex items-center gap-2 min-h-[44px]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Modifier
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ✨ Enhanced Product Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ✨ Enhanced Media Section */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              Médias du produit
            </h2>
            
            <div className="space-y-6">
              {/* Enhanced Photo Display */}
              <ProductImage 
                src={photoUrl} 
                alt={product.name} 
                className="w-full h-80 rounded-xl shadow-2xl" 
              />

              {/* Enhanced Video Display */}
              {videoUrl && (
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <span className="text-purple-400 font-semibold">Vidéo de présentation</span>
                    <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded-full">TikTok Ready</span>
                  </div>
                  <video 
                    src={videoUrl} 
                    controls 
                    className="w-full h-64 rounded-xl shadow-xl"
                    poster={photoUrl || undefined}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ✨ Enhanced Info Sections */}
          <div className="space-y-6">
            {/* ✨ Enhanced Description Section */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                Description
              </h2>
              
              {product.description ? (
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-slate-400 font-semibold mb-2">Aucune description</h3>
                  <p className="text-slate-500 text-sm mb-4">
                    Ajoutez une description pour renseigner vos clients sur ce produit
                  </p>
                  <Link href={`/products/${product.id}/edit`}>
                    <button className="text-blue-400 hover:text-blue-300 font-medium underline">
                      Ajouter une description
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* ✨ Enhanced Shop Info Section */}
            {shop && (
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                  Boutique
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-500 text-sm mb-1">Nom de la boutique</p>
                      <p className="text-white font-semibold">{shop.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm mb-1">Activité</p>
                      <p className="text-slate-300">{shop.activity}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-slate-500 text-sm mb-1">Localisation</p>
                    <p className="text-slate-300 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      {shop.city}
                    </p>
                  </div>

                  {shop.slug && (
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                        </svg>
                        URL personnalisée activée
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ✨ Enhanced Actions Section */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Actions rapides</h2>
              
              <div className="grid grid-cols-1 gap-4">
                <Link href={`/products/${product.id}/edit`}>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/25 active:scale-95 flex items-center justify-center gap-3 min-h-[56px]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Modifier le produit
                  </button>
                </Link>
                
                <button
                  onClick={handleDeleteProduct}
                  disabled={deleting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-600/25 active:scale-95 flex items-center justify-center gap-3 min-h-[56px]"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Suppression en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Supprimer le produit
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  <div>
                    <p className="text-amber-400 font-semibold text-sm">Attention</p>
                    <p className="text-amber-300 text-sm mt-1">
                      La suppression est définitive et ne peut pas être annulée. Toutes les données du produit seront perdues.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✨ Enhanced Footer */}
        <div className="text-center py-8 mt-12 border-t border-slate-700/50">
          <div className="text-slate-500 text-sm">
            <p>Connecté : <strong className="text-white">Sdiabate1337</strong></p>
            <p className="mt-1">2025-08-03 15:42:42 UTC</p>
            <p className="mt-2 text-xs text-slate-600">
              🚀 ShopShap v2.0 - Gestion avancée de produits TikTok & WhatsApp
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}