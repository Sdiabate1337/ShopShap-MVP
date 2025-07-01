'use client';

import { useEffect, useState } from 'react';
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

const menuItems = [
  { label: 'Accueil', route: '/dashboard', icon: '🏠' },
  { label: 'Catalogue', route: '/products', icon: '📦', active: true },
  { label: 'Commandes', route: '/orders', icon: '📋' },
  { label: 'Profil', route: '/profile', icon: '👤' },
];

// ✅ Composant ultra-minimaliste pour l'URL de boutique
function ShopUrl({ shop }: { shop: Shop }) {
  const toast = useToasts();
  const [copied, setCopied] = useState(false);

  const shopUrl = shop.slug ? `/${shop.slug}` : `/shop/${shop.id}`;
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${shopUrl}` : shopUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Copié !', '');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erreur', '');
    }
  };

  return (
    <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-blue-400 text-xs font-medium">🔗 Boutique</p>
          <p className="text-white/80 font-mono text-xs truncate">{shopUrl}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? '✓' : 'Copier'}
          </button>
          <button
            onClick={() => window.open(fullUrl, '_blank')}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors"
          >
            Voir
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
  const [openMenu, setOpenMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'price'>('recent');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const router = useRouter();
  const toast = useToasts();

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

      // Récupérer le shop
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

      // Récupérer les produits
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        toast.error('Erreur', 'Impossible de charger les produits');
        return;
      }

      // Générer les URLs signées
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
                console.warn('Erreur photo:', err);
              }
            }

            if (product.video_url) {
              try {
                const { data } = await supabase.storage
                  .from('product-videos')
                  .createSignedUrl(product.video_url, 3600);
                result.signedVideoUrl = data?.signedUrl ?? null;
              } catch (err) {
                console.warn('Erreur vidéo:', err);
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
    if (!confirm(`Supprimer "${productName}" ?`)) return;

    setDeletingId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        toast.error('Erreur', 'Impossible de supprimer');
        return;
      }

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Supprimé', productName);
    } catch (error) {
      toast.error('Erreur', '');
    } finally {
      setDeletingId(null);
    }
  };

  const getFilteredProducts = () => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.price - a.price;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  const filteredProducts = getFilteredProducts();
  const lowStockCount = products.filter(p => p.stock !== null && p.stock <= 2 && p.stock > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-blue-950 pb-20 sm:pb-8">
      {/* Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        <div className="relative">
          <button
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2.5 rounded-full shadow-xl transition-transform hover:scale-110 active:scale-95"
            onClick={() => setOpenMenu(!openMenu)}
          >
            <svg 
              className={`w-5 h-5 transition-transform ${openMenu ? "rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth={2} 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          <div className={`bg-night-foreground/10 backdrop-blur-xl border-t border-night-foreground/20 transition-all duration-300 overflow-hidden ${
            openMenu ? "max-h-80 py-2" : "max-h-0 py-0"
          }`}>
            <div className="flex flex-col items-center space-y-1 px-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all w-full max-w-xs ${
                    item.active 
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30' 
                      : 'text-night-foreground hover:bg-night-foreground/10'
                  }`}
                  onClick={() => {
                    setOpenMenu(false);
                    router.push(item.route);
                  }}
                >
                  <span>{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
              
              <button
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/20 transition-all w-full max-w-xs mt-2 border-t border-night-foreground/20 pt-4"
                onClick={async () => {
                  setOpenMenu(false);
                  await supabase.auth.signOut();
                  router.replace('/login');
                }}
              >
                <span>🚪</span>
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Desktop */}
      <nav className="hidden sm:flex items-center justify-between p-4 max-w-6xl mx-auto">
        <div className="flex gap-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                item.active
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-night-foreground/10 text-night-foreground hover:bg-night-foreground/20'
              }`}
              onClick={() => router.push(item.route)}
            >
              <span>{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </div>
        
        <button
          className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }}
        >
          Déconnexion
        </button>
      </nav>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <header className="mb-6">
          <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl p-4">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  📦 Mon catalogue
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-night-foreground/80">
                  <span>📊 {products.length} produit(s)</span>
                  {lowStockCount > 0 && (
                    <span className="text-yellow-400">⚠️ {lowStockCount} stock faible</span>
                  )}
                  {shop?.slug && (
                    <span className="text-green-400">🔗 URL perso</span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => router.push('/products/add')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 text-sm"
              >
                + Ajouter
              </button>
            </div>
          </div>
        </header>

        {/* URL Boutique */}
        {shop && <ShopUrl shop={shop} />}

        {/* Filtres */}
        {products.length > 0 && (
          <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Recherche */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-2 text-white placeholder-night-foreground/50 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              
              {/* Tri */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="recent">Plus récents</option>
                <option value="name">Nom A-Z</option>
                <option value="price">Prix ↓</option>
              </select>
              
              {/* Compteur */}
              <div className="text-night-foreground/60 text-sm flex items-center px-2">
                {searchTerm ? `${filteredProducts.length}/${products.length}` : `${products.length} total`}
              </div>
            </div>
          </div>
        )}

        {/* Produits */}
        {products.length === 0 ? (
          <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Catalogue vide</h3>
            <p className="text-night-foreground/80 mb-6 max-w-md mx-auto">
              Commencez par ajouter vos premiers produits
            </p>
            <button
              onClick={() => router.push('/products/add')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
            >
              Ajouter mon premier produit
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl p-8 text-center">
            <span className="text-4xl mb-4 block">🔍</span>
            <h3 className="text-lg font-bold text-white mb-2">Aucun résultat</h3>
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-400 hover:text-blue-300 underline text-sm"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl overflow-hidden hover:scale-105 transition-all group"
              >
                {/* Image */}
                <div className="relative h-40">
                  {product.signedPhotoUrl ? (
                    <img 
                      src={product.signedPhotoUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-night-foreground/5 flex items-center justify-center">
                      <span className="text-night-foreground/30 text-2xl">📷</span>
                    </div>
                  )}
                  
                  {/* Badges */}
                  {product.stock !== null && product.stock <= 2 && product.stock > 0 && (
                    <div className="absolute top-2 left-2 bg-yellow-600/90 text-white px-2 py-1 rounded text-xs font-bold">
                      ⚠️ {product.stock}
                    </div>
                  )}
                  
                  {product.signedVideoUrl && (
                    <div className="absolute top-2 right-2 bg-purple-600/90 text-white px-2 py-1 rounded text-xs font-bold">
                      🎥
                    </div>
                  )}
                </div>
                
                {/* Contenu */}
                <div className="p-4">
                  <h2 className="font-bold text-white mb-2 line-clamp-2 text-sm">{product.name}</h2>
                  
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-lg font-bold text-blue-400">
                      {product.price.toLocaleString()} FCFA
                    </p>
                    {product.stock !== null && (
                      <span className="text-xs text-night-foreground/60 bg-night-foreground/5 px-2 py-1 rounded">
                        Stock: {product.stock}
                      </span>
                    )}
                  </div>
                  
                  {product.description && (
                    <p className="text-night-foreground/70 text-xs mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/products/${product.id}`} className="flex-1">
                      <button className="w-full bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground border border-night-foreground/30 py-2 rounded font-medium transition-all text-xs">
                        Voir
                      </button>
                    </Link>
                    <button
                      onClick={() => router.push(`/products/${product.id}/edit`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition-all text-xs"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={deletingId === product.id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white px-3 py-2 rounded transition-all"
                    >
                      {deletingId === product.id ? (
                        <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <span className="text-xs">🗑️</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 mt-8 border-t border-night-foreground/20">
          <div className="text-night-foreground/50 text-xs">
            <p>Connecté : <strong className="text-white">Sdiabate1337</strong></p>
            <p className="mt-1">2025-07-01 02:42:04 UTC</p>
          </div>
        </div>
      </div>
    </main>
  );
}