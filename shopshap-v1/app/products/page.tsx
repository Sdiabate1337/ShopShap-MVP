'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ShareButton from '@/components/ShareButton';
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
};

type ProductWithSignedUrls = Product & {
  signedPhotoUrl: string | null;
  signedVideoUrl: string | null;
};

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z"></path>
      </svg>
    ),
    route: '/profile',
  },
];

export default function ProductsListPage() {
  const toast = useToasts(); // ✅ Hook unifié
  const router = useRouter();
  
  const [products, setProducts] = useState<ProductWithSignedUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'price'>('recent');
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [router]);

  useEffect(() => {
    // Messages contextuels après chargement
    if (!loading && products.length > 0) {
      const lowStockProducts = products.filter(p => p.stock !== null && p.stock <= 2 && p.stock > 0);
      
      if (lowStockProducts.length > 0) {
        setTimeout(() => {
          lowStockProducts.forEach(product => {
            toast.product.stockLow(product.name, product.stock || 0);
          });
        }, 1000);
      }

      // Conseil pour les produits sans photo
      const noPhotoProducts = products.filter(p => !p.photo_url);
      if (noPhotoProducts.length > 0 && noPhotoProducts.length <= 3) {
        setTimeout(() => {
          toast.system.tip(`${noPhotoProducts.length} produit(s) sans photo. Ajoutez des images pour augmenter vos ventes`);
        }, 3000);
      }
    }
  }, [loading, products, toast]);

  async function fetchProducts() {
    setLoading(true);
    try {
      // 1. Vérification utilisateur connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/login');
        return;
      }

      // 2. Récupérer le shop ET ses infos
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (shopError || !shopData) {
        console.error('Erreur shop ou shop introuvable:', shopError);
        router.replace('/onboarding');
        return;
      }
      
      setShop(shopData);

      // 3. Récupération des produits avec tri
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error);
        toast.system.serverError();
        setProducts([]);
        return;
      }

      // 4. Génération des signed URLs
      if (data) {
        const productsWithSignedUrls = await Promise.all(
          data.map(async (product: Product) => {
            let signedPhotoUrl: string | null = null;
            let signedVideoUrl: string | null = null;

            if (product.photo_url) {
              // ✅ Correction : utiliser le bon bucket 'shop-photos'
              const { data: signedData, error } = await supabase
                .storage
                .from('shop-photos')  // ✅ Bon bucket pour les produits
                .createSignedUrl(product.photo_url, 60 * 60);
              if (error) console.error('Erreur signedUrl photo:', error);
              signedPhotoUrl = signedData?.signedUrl ?? null;
            }

            if (product.video_url) {
              const { data: signedData, error } = await supabase
                .storage
                .from('product-videos')
                .createSignedUrl(product.video_url, 60 * 60);
              if (error) console.error('Erreur signedUrl video:', error);
              signedVideoUrl = signedData?.signedUrl ?? null;
            }

            return {
              ...product,
              signedPhotoUrl,
              signedVideoUrl,
            };
          })
        );
        setProducts(productsWithSignedUrls);
        
        // Message de succès personnalisé
        if (productsWithSignedUrls.length === 0) {
          setTimeout(() => {
            toast.system.tip('Créez votre premier produit pour commencer à vendre');
          }, 500);
        }
      }
    } catch (err) {
      console.error('Erreur générale:', err);
      toast.system.networkError();
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct(productId: string, productName: string) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" ?`)) {
      return;
    }

    setDeletingId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Erreur suppression:', error);
        toast.system.serverError();
        return;
      }

      // Mettre à jour la liste localement
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.product.deleted(productName);

      // Conseil après suppression
      setTimeout(() => {
        toast.system.tip('Pensez à informer vos clients si ce produit était populaire');
      }, 2000);

    } catch (error) {
      console.error('Erreur suppression produit:', error);
      toast.system.networkError();
    } finally {
      setDeletingId(null);
    }
  }

  function getSortedProducts() {
    const filtered = showLowStock 
      ? products.filter(p => p.stock !== null && p.stock <= 2)
      : products;

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.price - a.price;
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }

  const sortedProducts = getSortedProducts();
  const lowStockCount = products.filter(p => p.stock !== null && p.stock <= 2 && p.stock > 0).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <span className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mb-4"></span>
        <p>Chargement du catalogue…</p>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen bg-night text-night-foreground pb-20 sm:pb-8 font-sans">
      {/* MENU BOTTOM NAV MOBILE */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden">
        <div className="relative w-full">
          <button
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-night-foreground/80 text-night px-4 py-2 rounded-full shadow-lg border border-night-foreground"
            onClick={() => setOpenMenu((v) => !v)}
            aria-label="Ouvrir le menu"
          >
            <svg className={`w-6 h-6 transition-transform duration-200 ${openMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div className={`flex flex-col items-center bg-night border-t border-night-foreground w-full transition-all duration-200 ${openMenu ? "h-52 py-4" : "h-0 py-0 overflow-hidden"}`}>
            {bottomMenuItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-2 text-night-foreground py-2 w-full justify-center hover:bg-night-foreground/10 transition"
                onClick={() => {
                  setOpenMenu(false);
                  router.push(item.route);
                }}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
            <button
              className="flex items-center gap-2 text-red-400 py-2 w-full justify-center hover:bg-red-800/10 transition mt-2"
              onClick={async () => {
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
              <span className="text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </nav>

      {/* DESKTOP MENU */}
      <nav className="hidden sm:flex gap-4 mb-6 pt-8 px-4 max-w-6xl mx-auto">
        {bottomMenuItems.map((item) => (
          <button
            key={item.label}
            className="bg-night-foreground/10 text-night-foreground rounded px-3 py-1 hover:bg-night-foreground/20 transition-colors"
            onClick={() => router.push(item.route)}
          >
            {item.label}
          </button>
        ))}
        <button
          className="ml-auto text-red-400 hover:underline"
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

      {/* CONTENT */}
      <section className="max-w-6xl mx-auto pt-6 px-4">
        {/* Header avec stats */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Mon catalogue</h1>
            <div className="flex items-center gap-4 text-sm text-night-foreground/70">
              <span>{products.length} produit(s)</span>
              {lowStockCount > 0 && (
                <span className="text-yellow-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  {lowStockCount} stock faible
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {/* Bouton lien pro du catalogue */}
            {shop && (
              <ShareButton
                url={`/shop/${shop.id}`}
                title={`Catalogue ${shop.name}`}
                description={`Découvrez tous mes produits - ${shop.activity} à ${shop.city}`}
                type="shop"
                variant="secondary"
                size="md"
                onClick={() => toast.shop.linkShared()}
              />
            )}
            <button
              onClick={() => {
                toast.system.tip('Ajoutez des photos de qualité pour attirer plus de clients');
                setTimeout(() => router.push('/products/add'), 1000);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Ajouter un produit
            </button>
          </div>
        </div>

        {/* Filtres et tri */}
        {products.length > 0 && (
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-night-foreground/10 border border-night-foreground/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recent">Plus récents</option>
                  <option value="name">Nom A-Z</option>
                  <option value="price">Prix décroissant</option>
                </select>

                {lowStockCount > 0 && (
                  <button
                    onClick={() => setShowLowStock(!showLowStock)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showLowStock 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-night-foreground/10 text-night-foreground hover:bg-night-foreground/20'
                    }`}
                  >
                    {showLowStock ? '✓ ' : ''}Stock faible ({lowStockCount})
                  </button>
                )}
              </div>

              <div className="text-sm text-night-foreground/60">
                {showLowStock ? `${sortedProducts.length} produit(s) affiché(s)` : `${sortedProducts.length} produit(s) au total`}
              </div>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-blue-400">Votre catalogue est vide !</h3>
            <p className="text-night-foreground/70 mb-6">
              Commencez par ajouter vos premiers produits pour créer votre boutique en ligne
            </p>
            <button
              onClick={() => {
                toast.system.tip('Conseil : ajoutez des photos attrayantes et des descriptions détaillées');
                setTimeout(() => router.push('/products/add'), 1000);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Ajouter mon premier produit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map(product => (
              <div key={product.id} className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 group">
                {/* Image du produit */}
                <div className="relative">
                  {product.signedPhotoUrl ? (
                    <img 
                      src={product.signedPhotoUrl} 
                      alt={product.name} 
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-night-foreground/10 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-night-foreground/30 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span className="text-night-foreground/50 text-xs">Pas d'image</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Badge stock faible */}
                  {product.stock !== null && product.stock <= 2 && product.stock > 0 && (
                    <div className="absolute top-2 left-2 bg-yellow-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                      {product.stock} restant
                    </div>
                  )}

                  {/* Badge vidéo */}
                  {product.signedVideoUrl && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                      Vidéo
                    </div>
                  )}
                </div>
                
                {/* Contenu */}
                <div className="p-4">
                  <h2 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h2>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-blue-400 font-bold text-xl">{product.price.toLocaleString()} FCFA</p>
                    {product.stock !== null && (
                      <span className="text-xs text-night-foreground/60">
                        Stock: {product.stock}
                      </span>
                    )}
                  </div>
                  
                  {product.description && (
                    <p className="text-night-foreground/70 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/products/${product.id}`} className="flex-1">
                      <button className="w-full bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground py-2 rounded-lg text-sm font-medium transition-colors">
                        Voir
                      </button>
                    </Link>
                    <button
                      onClick={() => router.push(`/products/${product.id}/edit`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      disabled={deletingId === product.id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      {deletingId === product.id ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      )}
                    </button>
                    
                    {/* Bouton partage produit individuel */}
                    {shop && (
                      <ShareButton
                        url={`/shop/${shop.id}/product/${product.id}`}
                        title={product.name}
                        description={`${product.price.toLocaleString()} FCFA ${product.description ? `- ${product.description.slice(0, 50)}...` : ''}`}
                        type="product"
                        variant="minimal"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => toast.shop.linkShared()}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}