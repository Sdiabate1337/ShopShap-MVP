'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';
import { useToasts } from '@/hooks/useToast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
};

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
  user_id: string;
};

const bottomMenuItems = [
  {
    label: 'Accueil',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6"></path>
      </svg>
    ),
    route: '/dashboard',
  },
  {
    label: 'Catalogue',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
      </svg>
    ),
    route: '/products',
    active: true,
  },
  {
    label: 'Commandes',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2"></path>
      </svg>
    ),
    route: '/orders',
  },
  {
    label: 'Profil',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
    ),
    route: '/profile',
  },
];

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
  const [openMenu, setOpenMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // ✅ Flag pour éviter les boucles

  useEffect(() => {
    async function fetchProduct() {
      // ✅ Éviter de refaire l'appel si déjà chargé
      if (dataLoaded || !id) return;
      
      setLoading(true);
      console.log('🔍 Début du chargement du produit ID:', id);

      try {
        // ✅ 1. Vérifier l'authentification
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Erreur session:', sessionError);
          toast.auth.sessionExpired();
          router.replace('/login');
          return;
        }

        if (!session?.user) {
          console.log('❌ Pas de session utilisateur');
          toast.auth.sessionExpired();
          router.replace('/login');
          return;
        }

        console.log('✅ Utilisateur connecté:', session.user.id);

        // ✅ 2. Récupérer le produit avec vérification de propriété via JOIN
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

        // ✅ 3. Extraire les données
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
        };

        setProduct(productOnly as Product);
        setShop(shopData as Shop);

        console.log('✅ Produit défini:', productOnly);
        console.log('✅ Boutique définie:', shopData);

        // ✅ 4. Générer les signed URLs pour les médias
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

        // ✅ 5. Message contextuel pour stock faible (une seule fois)
        if (productData.stock !== null && productData.stock <= 2) {
          setTimeout(() => {
            toast.product.stockLow(productData.name, productData.stock);
          }, 1000);
        }

        // ✅ Marquer comme chargé
        setDataLoaded(true);
        console.log('✅ Chargement terminé avec succès');

      } catch (error) {
        console.error('💥 Erreur générale chargement produit:', error);
        toast.system.networkError();
        router.replace('/products');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id, dataLoaded]); // ✅ Dépendances réduites et contrôlées

  const handleDeleteProduct = async () => {
    if (!product) return;
    
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      console.log('🗑️ Suppression du produit:', product.id);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.auth.sessionExpired();
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
        toast.system.serverError();
        return;
      }

      console.log('✅ Produit supprimé avec succès');
      toast.product.deleted(product.name);
      router.push('/products');
    } catch (error) {
      console.error('💥 Erreur générale suppression:', error);
      toast.system.networkError();
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night ${theme.primary}`}">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        <p className="text-night-foreground mt-4 text-lg">Chargement du produit...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Produit introuvable</h2>
          <p className="text-night-foreground/70 mb-8">Ce produit n'existe pas ou vous n'y avez pas accès.</p>
          <Link href="/products">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105">
              Retour au catalogue
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-blue-950 pb-20 sm:pb-8">
      {/* Enhanced Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden">
        <div className="relative">
          <button
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-full shadow-2xl border-2 border-night-foreground/20 backdrop-blur-xl transition-all duration-300 hover:scale-110"
            onClick={() => setOpenMenu(!openMenu)}
            aria-label="Ouvrir le menu"
          >
            <svg 
              className={`w-6 h-6 transition-transform duration-300 ${openMenu ? "rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth={2} 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          <div className={`bg-night-foreground/10 backdrop-blur-xl border-t border-night-foreground/20 transition-all duration-300 ${
            openMenu ? "h-64 py-4" : "h-0 py-0 overflow-hidden"
          }`}>
            <div className="flex flex-col items-center space-y-2">
              {bottomMenuItems.map((item) => (
                <button
                  key={item.label}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-200 w-64 ${
                    item.active 
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400' 
                      : 'text-night-foreground hover:bg-night-foreground/10'
                  }`}
                  onClick={() => {
                    setOpenMenu(false);
                    router.push(item.route);
                  }}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              
              <button
                className="flex items-center gap-3 px-6 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition-all duration-200 w-64 mt-4 border-t border-night-foreground/20 pt-6"
                onClick={async () => {
                  setOpenMenu(false);
                  toast.auth.logoutSuccess();
                  setTimeout(async () => {
                    await supabase.auth.signOut();
                    router.replace('/login');
                  }, 1000);
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"></path>
                </svg>
                <span className="font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Desktop Navigation */}
      <nav className="hidden sm:flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex gap-2">
          {bottomMenuItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                item.active
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
                  : 'bg-night-foreground/10 text-night-foreground hover:bg-night-foreground/20'
              }`}
              onClick={() => router.push(item.route)}
            >
              {item.icon}
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </div>
        
        <button
          className="text-red-400 hover:text-red-300 font-medium transition-colors"
          onClick={async () => {
            toast.auth.logoutSuccess();
            setTimeout(async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }, 1000);
          }}
        >
          Déconnexion
        </button>
      </nav>

      {/* Enhanced Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Enhanced Header */}
        <header className="mb-8">
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <Link href="/products">
                <button className="flex items-center gap-3 text-night-foreground/80 hover:text-night-foreground transition-all duration-200 bg-night-foreground/10 hover:bg-night-foreground/20 px-4 py-2 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  <span className="font-medium">Retour au catalogue</span>
                </button>
              </Link>
              
              <div className="flex gap-3">
                {shop && (
                  <ShareButton
                    url={`/shop/${shop.id}/product/${product.id}`}
                    title={product.name}
                    description={`${product.price.toLocaleString()} FCFA ${product.description ? `- ${product.description.slice(0, 50)}...` : ''}`}
                    type="product"
                    variant="secondary"
                    size="md"
                    onClick={() => toast.shop.linkShared()}
                  />
                )}
                
                <Link href={`/products/${product.id}/edit`}>
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Modifier
                  </button>
                </Link>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-xl opacity-50"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
                  </svg>
                </div>
              </div>
              {product.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 mt-4 text-night-foreground/80">
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {product.price.toLocaleString()} FCFA
              </span>
              
              {product.stock !== null && (
                <span className={`px-4 py-2 rounded-full font-medium ${
                  product.stock <= 2 
                    ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/50' 
                    : 'bg-green-900/20 text-green-400 border border-green-800/50'
                }`}>
                  Stock: {product.stock} {product.stock <= 2 && '⚠️'}
                </span>
              )}
              
              <span className="text-night-foreground/60">
                Ajouté le {formatDate(product.created_at)}
              </span>
            </div>
          </div>
        </header>

        {/* Enhanced Product Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Media Section */}
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              Médias du produit
            </h2>
            
            <div className="space-y-6">
              {/* Photo */}
              {photoUrl ? (
                <div className="relative group">
                  <img 
                    src={photoUrl} 
                    alt={product.name} 
                    className="w-full h-80 object-cover rounded-xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl"></div>
                </div>
              ) : (
                <div className="w-full h-80 bg-night-foreground/10 rounded-xl flex items-center justify-center border-2 border-dashed border-night-foreground/30">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-night-foreground/30 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <p className="text-night-foreground/50 font-medium">Aucune photo disponible</p>
                    <p className="text-night-foreground/40 text-sm mt-1">Ajoutez une photo pour améliorer la présentation</p>
                  </div>
                </div>
              )}

              {/* Video */}
              {videoUrl && (
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <span className="text-purple-400 font-medium">Vidéo de présentation</span>
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

          {/* Product Info Section */}
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                Description
              </h2>
              
              {product.description ? (
                <div className="prose prose-invert max-w-none">
                  <p className="text-night-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-night-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-night-foreground/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <p className="text-night-foreground/50 font-medium">Aucune description</p>
                  <p className="text-night-foreground/40 text-sm mt-1">Ajoutez une description pour renseigner vos clients</p>
                </div>
              )}
            </div>

            {/* Shop Info */}
            {shop && (
              <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-8 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                  Boutique
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-night-foreground/60 text-sm mb-1">Nom de la boutique</p>
                    <p className="text-white font-semibold text-lg">{shop.name}</p>
                  </div>
                  <div>
                    <p className="text-night-foreground/60 text-sm mb-1">Activité</p>
                    <p className="text-night-foreground/80">{shop.activity}</p>
                  </div>
                  <div>
                    <p className="text-night-foreground/60 text-sm mb-1">Localisation</p>
                    <p className="text-night-foreground/80 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      {shop.city}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6">Actions</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href={`/products/${product.id}/edit`}>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Modifier
                  </button>
                </Link>
                
                <button
                  onClick={handleDeleteProduct}
                  disabled={deleting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Suppression...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}