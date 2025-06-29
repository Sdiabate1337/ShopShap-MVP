'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';  // Utilise ton client existant
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  price: number;
  photo_url: string | null;
  video_url: string | null;
  description: string | null;
  shop_id: string;
};

type ProductWithSignedUrls = Product & {
  signedPhotoUrl: string | null;
  signedVideoUrl: string | null;
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
  const [products, setProducts] = useState<ProductWithSignedUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);

      // 1. Vérification utilisateur connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/login');
        return;
      }

      // 2. Récupération du shop de l'utilisateur
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (shopError || !shop) {
        router.replace('/onboarding');
        return;
      }

      // 3. Récupération des produits FILTRÉS par shop_id
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)  // ✅ FILTRAGE PAR SHOP
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error);
        setProducts([]);
        setLoading(false);
        return;
      }

      // 4. Génération des signed URLs
      if (data) {
        const productsWithSignedUrls = await Promise.all(
          data.map(async (product: Product) => {
            let signedPhotoUrl: string | null = null;
            let signedVideoUrl: string | null = null;

            if (product.photo_url) {
              const { data: signedData, error } = await supabase
                .storage
                .from('shop-photos') 
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
      }
      setLoading(false);
    }
    fetchProducts();
  }, [router]);

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
          {/* Toggle menu button */}
          <button
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-night-foreground/80 text-night px-4 py-2 rounded-full shadow-lg border border-night-foreground"
            onClick={() => setOpenMenu((v) => !v)}
            aria-label="Ouvrir le menu"
          >
            <svg className={`w-6 h-6 transition-transform duration-200 ${openMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          {/* Animated menu */}
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
                await supabase.auth.signOut();
                router.replace('/login');
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
      <nav className="hidden sm:flex gap-4 mb-6 pt-8 px-4 max-w-4xl mx-auto">
        {bottomMenuItems.map((item) => (
          <button
            key={item.label}
            className="bg-night-foreground/10 text-night-foreground rounded px-3 py-1"
            onClick={() => router.push(item.route)}
          >
            {item.label}
          </button>
        ))}
        <button
          className="ml-auto text-red-400 hover:underline"
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }}
        >
          Déconnexion
        </button>
      </nav>

      {/* CONTENT */}
      <section className="max-w-4xl mx-auto pt-6 px-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Mon catalogue</h1>
          <button
            onClick={() => router.push('/products/add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Ajouter un produit
          </button>
        </div>

        {products.length === 0 ? (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-8 text-center">
            <p className="mb-4 text-lg font-semibold text-yellow-200">Votre catalogue est vide !</p>
            <button
              onClick={() => router.push('/products/add')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
            >
              Ajouter mon premier produit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                {product.signedPhotoUrl ? (
                  <img 
                    src={product.signedPhotoUrl} 
                    alt={product.name} 
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-full h-48 bg-night-foreground/10 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-night-foreground/50 text-sm">Pas d'image</span>
                  </div>
                )}
                
                <h2 className="font-semibold text-lg mb-2 truncate">{product.name}</h2>
                <p className="text-blue-400 font-bold text-xl mb-3">{product.price} FCFA</p>
                
                {product.signedVideoUrl && (
                  <video 
                    src={product.signedVideoUrl} 
                    controls 
                    className="w-full h-32 rounded mb-3"
                  />
                )}
                
                <div className="flex gap-2">
                  <Link href={`/products/${product.id}`} className="flex-1">
                    <button className="w-full bg-night-foreground/10 text-night-foreground py-2 rounded text-sm hover:bg-night-foreground/20 transition">
                      Voir détail
                    </button>
                  </Link>
                  <button
                    onClick={() => router.push(`/products/${product.id}/edit`)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition"
                  >
                    Modifier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}