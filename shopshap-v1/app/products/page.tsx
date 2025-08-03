'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToasts } from '@/hooks/useToast';

type Product = {
  id: string;
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

type ProductWithUrls = Product & {
  signedPhotoUrl: string | null;
  signedVideoUrl: string | null;
};

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  slug?: string;
  user_id: string;
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

// ✨ Enhanced Skeleton Components
function ProductCardSkeleton() {
  return (
    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-700/50"></div>
      <div className="p-4">
        <div className="h-4 bg-slate-700/50 rounded mb-3"></div>
        <div className="h-6 bg-slate-700/50 rounded w-2/3 mb-3"></div>
        <div className="h-3 bg-slate-700/30 rounded mb-4"></div>
        <div className="flex gap-2">
          <div className="flex-1 h-8 bg-slate-700/30 rounded"></div>
          <div className="flex-1 h-8 bg-slate-700/30 rounded"></div>
          <div className="w-8 h-8 bg-slate-700/30 rounded"></div>
        </div>
      </div>
    </div>
  );
}

function CatalogueSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* Header Skeleton */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded mb-4"></div>
        <div className="h-4 bg-slate-700/30 rounded w-1/3"></div>
      </div>
      
      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ✨ Enhanced Shop URL Component
function ShopUrl({ shop }: { shop: Shop }) {
  const toast = useToasts();
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const shopUrl = shop.slug ? `/${shop.slug}` : `/shop/${shop.id}`;
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${shopUrl}` : shopUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setIsAnimating(true);
      toast.success('Lien copié !', 'Prêt à partager votre catalogue');
      
      setTimeout(() => {
        setCopied(false);
        setIsAnimating(false);
      }, 3000);
    } catch (err) {
      toast.error('Erreur', 'Impossible de copier le lien');
    }
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`🛍️ Découvrez mon catalogue ${shop.name} !\n\n${fullUrl}\n\n#${shop.activity} #Catalogue`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-emerald-900/20 border border-purple-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm group hover:border-purple-400/50 transition-all duration-300">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <p className="text-purple-400 font-semibold text-sm">🔗 Lien de votre catalogue</p>
            </div>
            <p className="text-white/90 font-mono text-sm bg-slate-800/30 px-3 py-2 rounded-lg truncate border border-slate-700/50" title={shopUrl}>
              {shopUrl}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 min-h-[44px] ${
              copied 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 scale-105' 
                : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg hover:shadow-purple-600/25 hover:scale-105 active:scale-95'
            } ${isAnimating ? 'animate-pulse' : ''}`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
                Copié !
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Copier le lien
              </>
            )}
          </button>
          
          <button
            onClick={() => window.open(fullUrl, '_blank')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 hover:scale-105 active:scale-95 min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
            Aperçu
          </button>
          
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/25 hover:scale-105 active:scale-95 min-h-[44px]"
            title="Partager sur WhatsApp"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ✨ Enhanced Product Card Component
function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onView, 
  isDeleting 
}: {
  product: ProductWithUrls;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  isDeleting: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isLowStock = product.stock !== null && product.stock <= 2 && product.stock > 0;
  const isOutOfStock = product.stock !== null && product.stock === 0;

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:scale-105 hover:shadow-xl hover:shadow-purple-600/10 transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {product.signedPhotoUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-slate-700/50 animate-pulse flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
            )}
            <img 
              src={product.signedPhotoUrl} 
              alt={product.name} 
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <p className="text-slate-500 text-xs">Pas d'image</p>
            </div>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isOutOfStock && (
            <div className="bg-red-600/95 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              ❌ Rupture
            </div>
          )}
          {isLowStock && (
            <div className="bg-amber-600/95 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              ⚠️ Stock: {product.stock}
            </div>
          )}
        </div>
        
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {product.signedVideoUrl && (
            <div className="bg-purple-600/95 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              🎥 Vidéo
            </div>
          )}
          {product.category && (
            <div className="bg-blue-600/95 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              {product.category}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h2 className="font-bold text-white mb-2 line-clamp-2 text-base group-hover:text-purple-300 transition-colors duration-300">
          {product.name}
        </h2>
        
        <div className="flex items-center justify-between mb-3">
          <p className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            {product.price.toLocaleString()} FCFA
          </p>
          {product.stock !== null && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              isOutOfStock ? 'bg-red-900/30 text-red-400' :
              isLowStock ? 'bg-amber-900/30 text-amber-400' :
              'bg-emerald-900/30 text-emerald-400'
            }`}>
              Stock: {product.stock}
            </span>
          )}
        </div>
        
        {product.description && (
          <p className="text-slate-400 text-sm mb-4 line-clamp-2 group-hover:text-slate-300 transition-colors duration-300">
            {product.description}
          </p>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 hover:border-slate-500 py-2.5 px-3 rounded-lg font-medium transition-all duration-300 text-sm flex items-center justify-center gap-2 min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            Voir
          </button>
          
          <button
            onClick={onEdit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-lg font-medium transition-all duration-300 text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-600/25 min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Modifier
          </button>
          
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white px-3 py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-600/25 min-h-[44px] flex items-center justify-center"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithUrls[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'price' | 'stock'>('recent');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('/products');
  
  const router = useRouter();
  const toast = useToasts();

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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/login');
        return;
      }

      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (shopError || !shopData) {
        router.replace('/onboarding');
        return;
      }

      setShop(shopData);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        toast.error('Erreur', 'Impossible de charger les produits');
        return;
      }

      if (productsData) {
        const productsWithUrls = await Promise.allSettled(
          productsData.map(async (product: Product) => {
            const result: ProductWithUrls = {
              ...product,
              signedPhotoUrl: null,
              signedVideoUrl: null,
            };

            if (product.photo_url) {
              try {
                const { data } = await supabase.storage
                  .from('shop-photos')
                  .createSignedUrl(product.photo_url, 3600);
                result.signedPhotoUrl = data?.signedUrl ?? null;
              } catch (err) {
                // Erreur silencieuse pour les URLs signées
              }
            }

            if (product.video_url) {
              try {
                const { data } = await supabase.storage
                  .from('product-videos')
                  .createSignedUrl(product.video_url, 3600);
                result.signedVideoUrl = data?.signedUrl ?? null;
              } catch (err) {
                // Erreur silencieuse pour les URLs signées
              }
            }

            return result;
          })
        );

        const successfulProducts = productsWithUrls
          .filter((result): result is PromiseFulfilledResult<ProductWithUrls> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value);

        setProducts(successfulProducts);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur', 'Problème de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" ?\n\nCette action est irréversible.`)) return;

    setDeletingId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        toast.error('Erreur', 'Impossible de supprimer le produit');
        return;
      }

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Produit supprimé', `"${productName}" a été retiré de votre catalogue`);
    } catch (error) {
      toast.error('Erreur', 'Problème lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const getFilteredProducts = () => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.price - a.price;
        case 'stock':
          const aStock = a.stock ?? 0;
          const bStock = b.stock ?? 0;
          return bStock - aStock;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  const handleNavigation = (route: string) => {
    setActiveTab(route);
    router.push(route);
  };

  const filteredProducts = getFilteredProducts();
  const lowStockCount = products.filter(p => p.stock !== null && p.stock <= 2 && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock !== null && p.stock === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950 p-4">
        <CatalogueSkeleton />
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
                Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre catalogue.
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
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* ✨ Enhanced Header */}
        <header>
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/30">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 group"
              >
                <svg 
                  className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth={2} 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                </svg>
                <span className="text-purple-400 font-medium">Catalogue</span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
                    </svg>
                  </div>
                  Mon catalogue
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>{products.length} produit{products.length > 1 ? 's' : ''}</span>
                  </div>
                  
                  {lowStockCount > 0 && (
                    <div className="flex items-center gap-2 text-amber-400">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                      <span>{lowStockCount} stock faible</span>
                    </div>
                  )}
                  
                  {outOfStockCount > 0 && (
                    <div className="flex items-center gap-2 text-red-400">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <span>{outOfStockCount} en rupture</span>
                    </div>
                  )}
                  
                  {shop?.slug && (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span>URL personnalisée</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => router.push('/products/add')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/25 active:scale-95 flex items-center gap-3 min-h-[44px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Ajouter un produit
              </button>
            </div>
          </div>
        </header>

        {/* ✨ Enhanced Shop URL */}
        {shop && <ShopUrl shop={shop} />}

        {/* ✨ Enhanced Filters */}
        {products.length > 0 && (
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700/30 border border-slate-600/50 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-700/30 border border-slate-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 min-w-[160px]"
              >
                <option value="recent">Plus récents</option>
                <option value="name">Nom A-Z</option>
                <option value="price">Prix ↓</option>
                <option value="stock">Stock ↓</option>
              </select>
              
              {/* Results counter */}
              <div className="flex items-center px-4 py-3 bg-slate-700/20 rounded-lg text-slate-400 text-sm font-medium whitespace-nowrap">
                {searchTerm 
                  ? `${filteredProducts.length}/${products.length} résultats` 
                  : `${products.length} produit${products.length > 1 ? 's' : ''}`
                }
              </div>
            </div>
          </div>
        )}

        {/* ✨ Enhanced Products Grid */}
        {products.length === 0 ? (
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Catalogue vide</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto text-lg">
              Commencez par ajouter vos premiers produits à votre catalogue pour commencer à vendre sur TikTok et WhatsApp
            </p>
            <button
              onClick={() => router.push('/products/add')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/25 active:scale-95 flex items-center gap-3 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Ajouter mon premier produit
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Aucun produit trouvé</h3>
            <p className="text-slate-400 mb-6">
              Essayez de modifier votre recherche ou vos filtres
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSortBy('recent');
              }}
              className="text-purple-400 hover:text-purple-300 underline font-medium transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fadeInUp"
              >
                <ProductCard
                  product={product}
                  onView={() => router.push(`/products/${product.id}`)}
                  onEdit={() => router.push(`/products/${product.id}/edit`)}
                  onDelete={() => handleDelete(product.id, product.name)}
                  isDeleting={deletingId === product.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* ✨ Enhanced Footer */}
        <div className="text-center py-8 mt-12 border-t border-slate-700/50">
          <div className="text-slate-500 text-sm">
            <p>Connecté : <strong className="text-white">Sdiabate1337</strong></p>
            <p className="mt-1">2025-08-03 15:14:40 UTC</p>
            <p className="mt-2 text-xs text-slate-600">
              🚀 ShopShap v2.0 - Catalogue moderne pour vendeurs TikTok & WhatsApp
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        
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