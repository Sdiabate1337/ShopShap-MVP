'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  photo_url?: string;
  stock?: number;
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

export default function DashboardPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchShopAndProducts = async () => {
      setLoading(true);
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

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });
      setProducts(productsData || []);
      setLoading(false);
    };

    fetchShopAndProducts();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <span className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mb-4"></span>
        <p>Chargement du dashboard…</p>
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
      <nav className="hidden sm:flex gap-4 mb-6 pt-8 px-4 max-w-2xl mx-auto">
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
      <section className="max-w-2xl mx-auto pt-6 px-2 sm:px-4">
        {/* Bienvenue et profil */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {shop?.photo_url && (
            <img
              src={shop.photo_url.startsWith('http') ? shop.photo_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/shop-photos/${shop.photo_url}`}
              alt="Boutique"
              className="w-14 h-14 rounded-full object-cover border border-night-foreground"
            />
          )}
          <div className="flex-1 min-w-[50%]">
            <h1 className="text-lg sm:text-2xl font-bold leading-tight break-words">
              Bienvenue, {shop?.name} 👋
            </h1>
            <div className="text-night-foreground/70 text-sm">{shop?.activity} à {shop?.city}</div>
            {shop?.description && (
              <p className="text-night-foreground/50 text-xs mt-1">{shop.description}</p>
            )}
          </div>
        </div>

        {/* Statut catalogue */}
        {products.length === 0 ? (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 text-center mb-6">
            <p className="mb-3 text-base sm:text-lg font-semibold text-yellow-200">Votre catalogue est vide !</p>
            <button
              onClick={() => router.push('/products/add')}
              className="bg-blue-600 text-white w-full py-3 rounded-lg text-base font-bold hover:bg-blue-700"
            >
              Ajouter mon premier produit
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
              <h2 className="text-base sm:text-lg font-bold">Mes produits</h2>
              <button
                onClick={() => router.push('/products/add')}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold w-full sm:w-auto hover:bg-blue-700"
              >
                + Ajouter un produit
              </button>
            </div>
            <ul className="space-y-3">
              {products.map(product => (
                <li
                  key={product.id}
                  className="flex items-center gap-3 bg-night-foreground/5 rounded-lg p-3 shadow-sm"
                >
                  {product.photo_url && (
                    <img
                      src={product.photo_url.startsWith('http') ? product.photo_url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-photos/${product.photo_url}`}
                      alt={product.name}
                      className="w-12 h-12 rounded object-cover border border-night-foreground"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{product.name}</div>
                    <div className="text-night-foreground/60 text-xs">{product.price} FCFA</div>
                  </div>
                  <button
                    onClick={() => router.push(`/products/${product.id}/edit`)}
                    className="text-blue-400 underline text-xs"
                  >
                    Modifier
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}