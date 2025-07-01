'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
  slug?: string;
  theme?: string;
  user_id: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  photo_url?: string;
  stock?: number;
  shop_id: string;
};

type Order = {
  id: string;
  client_name: string;
  product_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  quantity: number;
};

type Stats = {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  recentOrders: Order[];
};

const bottomMenuItems = [
  {
    label: 'Accueil',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6"></path>
      </svg>
    ),
    route: '/dashboard',
    active: true,
  },
  {
    label: 'Catalogue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
      </svg>
    ),
    route: '/products',
  },
  {
    label: 'Commandes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2"></path>
      </svg>
    ),
    route: '/orders',
  },
  {
    label: 'Profil',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
    ),
    route: '/profile',
  },
];

// ✅ Composant ultra-responsive pour le lien de boutique
function ShopLink({ shop }: { shop: Shop }) {
  const toast = useToasts();
  const [copied, setCopied] = useState(false);

  const shopUrl = shop.slug ? `/${shop.slug}` : `/shop/${shop.id}`;
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${shopUrl}` : shopUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Lien copié !', '');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erreur', 'Impossible de copier le lien');
    }
  };

  const handleOpen = () => {
    window.open(fullUrl, '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-blue-400 font-medium text-xs sm:text-sm flex items-center gap-1">
            🔗 <span className="hidden xs:inline">Votre boutique</span><span className="xs:hidden">Boutique</span>
          </p>
          <p className="text-white/80 font-mono text-xs sm:text-sm truncate" title={shopUrl}>
            {shopUrl}
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={handleCopy}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${
              copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? '✓' : 'Copier'}
          </button>
          <button
            onClick={handleOpen}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-colors"
          >
            Voir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopPhotoUrl, setShopPhotoUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const router = useRouter();
  const toast = useToasts();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ✅ Fonction de déconnexion intelligente
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      
      // Effacer le cache local
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      toast.success('Déconnecté', 'À bientôt !');
      router.replace('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur', 'Problème lors de la déconnexion');
    }
  }, [router, toast]);

  // ✅ Fonction avec confirmation
  const handleLogoutWithConfirm = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const fetchDashboardData = async () => {
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

      // Photo du shop
      if (shopData.photo_url) {
        const { data: urlData } = await supabase.storage
          .from('shop-photos')
          .createSignedUrl(shopData.photo_url, 60 * 60);
        setShopPhotoUrl(urlData?.signedUrl ?? null);
      }

      // Récupérer les produits
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);

      // Récupérer les statistiques basiques
      await fetchStats(shopData.id);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (shopId: string) => {
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (!ordersData) return;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const totalOrders = ordersData.length;
      const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
      
      const completedOrders = ordersData.filter(o => o.status === 'paid' || o.status === 'delivered');
      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
      
      const monthOrders = completedOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      });
      const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total_amount, 0);

      const recentOrders = ordersData.slice(0, 3);

      setStats({
        totalOrders,
        pendingOrders,
        totalRevenue,
        monthRevenue,
        recentOrders,
      });

    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white/80 mt-4 text-sm sm:text-base">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-blue-950 pb-20 sm:pb-8">
      {/* Modal de confirmation de déconnexion */}
      {showLogoutConfirm && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowLogoutConfirm(false)}
          />
          
          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Confirmer la déconnexion</h3>
              </div>
              
              <p className="text-gray-300 mb-6 text-sm">
                Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre tableau de bord.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ✅ Navigation Mobile Ultra-Responsive */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
        <div className="relative">
          {/* Bouton Menu Flottant */}
          <button
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2.5 rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95"
            onClick={() => setOpenMenu(!openMenu)}
            aria-label="Menu"
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${openMenu ? "rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth={2} 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {/* Menu Items Responsive */}
          <div className={`bg-night-foreground/10 backdrop-blur-xl border-t border-night-foreground/20 transition-all duration-300 overflow-hidden ${
            openMenu ? "max-h-80 py-2" : "max-h-0 py-0"
          }`}>
            <div className="flex flex-col items-center space-y-1 px-2">
              {bottomMenuItems.map((item) => (
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
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
              
              <button
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/20 transition-all w-full max-w-xs mt-2 border-t border-night-foreground/20 pt-4"
                onClick={() => {
                  setOpenMenu(false);
                  handleLogoutWithConfirm();
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"></path>
                </svg>
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ✅ Navigation Desktop Responsive */}
      <nav className="hidden sm:flex items-center justify-between p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex gap-1 sm:gap-2">
          {bottomMenuItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${
                item.active
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-night-foreground/10 text-night-foreground hover:bg-night-foreground/20'
              }`}
              onClick={() => router.push(item.route)}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </div>
        
        <button
          className="text-red-400 hover:text-red-300 transition-colors text-sm sm:text-base font-medium flex items-center gap-2"
          onClick={handleLogoutWithConfirm}
        >
          <span className="hidden sm:inline">Déconnexion</span>
          <span className="sm:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"></path>
            </svg>
          </span>
        </button>
      </nav>

      {/* ✅ Contenu Principal Ultra-Responsive */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* ✅ Header Ultra-Responsive */}
        <header className="mb-4 sm:mb-6 md:mb-8">
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
            {/* Mobile Layout (< sm) */}
            <div className="sm:hidden">
              <div className="flex items-center gap-3 mb-3">
                {shopPhotoUrl ? (
                  <img
                    src={shopPhotoUrl}
                    alt="Boutique"
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-bold">{shop?.name?.charAt(0)}</span>
                  </div>
                )}
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-bold text-white truncate">
                    {shop?.name}
                  </h1>
                  <p className="text-night-foreground/80 text-sm truncate">
                    {shop?.activity} • {shop?.city}
                  </p>
                </div>
              </div>

              {/* Stats Mobile - 3 colonnes */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{products.length}</div>
                  <div className="text-xs text-night-foreground/60">Produits</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{stats.totalOrders}</div>
                  <div className="text-xs text-night-foreground/60">Commandes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {Math.round(stats.totalRevenue / 1000)}k
                  </div>
                  <div className="text-xs text-night-foreground/60">FCFA</div>
                </div>
              </div>
            </div>

            {/* Desktop/Tablet Layout (>= sm) */}
            <div className="hidden sm:flex items-center gap-4 md:gap-6">
              {shopPhotoUrl ? (
                <img
                  src={shopPhotoUrl}
                  alt="Boutique"
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-bold">{shop?.name?.charAt(0)}</span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">
                  {shop?.name}
                </h1>
                <p className="text-night-foreground/80 text-sm md:text-base">
                  {shop?.activity} • {shop?.city}
                </p>
              </div>

              {/* Stats Desktop */}
              <div className="flex gap-4 md:gap-6">
                <div className="text-center">
                  <div className="text-lg md:text-xl font-bold text-blue-400">{products.length}</div>
                  <div className="text-xs text-night-foreground/60">Produits</div>
                </div>
                <div className="text-center">
                  <div className="text-lg md:text-xl font-bold text-green-400">{stats.totalOrders}</div>
                  <div className="text-xs text-night-foreground/60">Commandes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg md:text-xl font-bold text-purple-400">
                    {Math.round(stats.totalRevenue / 1000)}k
                  </div>
                  <div className="text-xs text-night-foreground/60">FCFA</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ✅ Shop Link Responsive */}
        {shop && <ShopLink shop={shop} />}

        {/* ✅ Stats Cards Ultra-Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400">{stats.totalOrders}</div>
            <div className="text-blue-300 text-xs sm:text-sm">Commandes</div>
          </div>
          
          <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400">{stats.pendingOrders}</div>
            <div className="text-yellow-300 text-xs sm:text-sm">En attente</div>
          </div>
          
          <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-400">
              {stats.monthRevenue > 999 ? `${Math.round(stats.monthRevenue / 1000)}k` : stats.monthRevenue.toLocaleString()}
            </div>
            <div className="text-green-300 text-xs sm:text-sm">Ce mois</div>
          </div>
          
          <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-400">
              {stats.totalRevenue > 999 ? `${Math.round(stats.totalRevenue / 1000)}k` : stats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-purple-300 text-xs sm:text-sm">Total</div>
          </div>
        </div>

        {/* ✅ Commandes Récentes Ultra-Responsive */}
        {stats.recentOrders.length > 0 && (
          <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-bold text-white">Commandes récentes</h2>
              <button
                onClick={() => router.push('/orders')}
                className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium"
              >
                Voir toutes →
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 bg-night-foreground/5 rounded-md sm:rounded-lg">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white text-sm sm:text-base truncate">{order.client_name}</div>
                    <div className="text-xs sm:text-sm text-night-foreground/70 truncate">{order.product_name}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-bold text-white text-sm sm:text-base">
                      {order.total_amount > 999 
                        ? `${Math.round(order.total_amount / 1000)}k` 
                        : order.total_amount.toLocaleString()
                      } FCFA
                    </div>
                    <div className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400' :
                      order.status === 'paid' ? 'bg-green-900/20 text-green-400' :
                      'bg-blue-900/20 text-blue-400'
                    }`}>
                      {order.status === 'pending' ? 'Attente' :
                       order.status === 'paid' ? 'Payée' : 'Livrée'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ Actions Rapides Ultra-Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button
            onClick={() => router.push('/orders/add')}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 flex items-center gap-3 text-sm sm:text-base"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span>Nouvelle commande</span>
          </button>
          
          <button
            onClick={() => router.push('/products/add')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 flex items-center gap-3 text-sm sm:text-base"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
            </svg>
            <span>Nouveau produit</span>
          </button>
          
          <button
            onClick={() => router.push('/orders')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 flex items-center gap-3 text-sm sm:text-base sm:col-span-2 lg:col-span-1"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span>Voir les stats</span>
          </button>
        </div>

        {/* Footer avec timestamp mis à jour */}
        <div className="text-center py-8 mt-8 border-t border-night-foreground/20">
          <div className="text-night-foreground/50 text-xs">
            <p>Connecté : <strong className="text-white">Sdiabate1337</strong></p>
            <p className="mt-1">2025-07-01 13:53:47 UTC</p>
          </div>
        </div>
      </div>
    </main>
  );
}