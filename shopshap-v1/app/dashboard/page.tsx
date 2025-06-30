'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ShareButton from '@/components/ShareButton';
import { useToasts } from '@/hooks/useToast'; // ✅ UN SEUL IMPORT

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
};

type Product = {
  description: any;
  id: string;
  name: string;
  price: number;
  photo_url?: string;
  stock?: number;
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
  paidOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  weekRevenue: number;
  averageOrderValue: number;
  topProduct: { name: string; count: number; revenue: number } | null;
  topClient: { name: string; count: number; revenue: number } | null;
  recentOrders: Order[];
  monthlyGrowth: number;
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
  const [shopPhotoUrl, setShopPhotoUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productPhotoUrls, setProductPhotoUrls] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    weekRevenue: 0,
    averageOrderValue: 0,
    topProduct: null,
    topClient: null,
    recentOrders: [],
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);
  const router = useRouter();

  // 🎯 Hook unifié pour les toasts
  const toast = useToasts();

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

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

      // Photos des produits
      const urls: Record<string, string> = {};
      if (productsData && productsData.length > 0) {
        await Promise.all(
          productsData.map(async (product: Product) => {
            if (product.photo_url) {
              const { data: urlData } = await supabase.storage
                .from('shop-photos')
                .createSignedUrl(product.photo_url, 60 * 60);
              if (urlData?.signedUrl) {
                urls[product.id] = urlData.signedUrl;
              }
            }
          })
        );
      }
      setProductPhotoUrls(urls);

      // Récupérer et calculer les statistiques
      await fetchAndCalculateStats(shopData.id);

      // 🎯 Afficher les notifications contextuelles
      await showContextualNotifications(shopData, productsData || [], session.user);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.system.networkError(); // ✅ Plus simple et clair
    } finally {
      setLoading(false);
    }
  };

  const fetchAndCalculateStats = async (shopId: string) => {
    try {
      // Récupérer toutes les commandes
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (!ordersData) return;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Calculs de base
      const totalOrders = ordersData.length;
      const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
      const paidOrders = ordersData.filter(o => o.status === 'paid').length;
      const deliveredOrders = ordersData.filter(o => o.status === 'delivered').length;

      const completedOrders = ordersData.filter(o => o.status === 'paid' || o.status === 'delivered');
      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
      
      const monthOrders = completedOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      });
      const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total_amount, 0);

      const weekOrders = completedOrders.filter(o => new Date(o.created_at) >= weekAgo);
      const weekRevenue = weekOrders.reduce((sum, o) => sum + o.total_amount, 0);

      const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

      // Croissance mensuelle
      const lastMonthOrders = completedOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
      });
      const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const monthlyGrowth = lastMonthRevenue > 0 
        ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : monthRevenue > 0 ? 100 : 0;

      // Produit le plus vendu
      const productStats: Record<string, { count: number; revenue: number; name: string }> = {};
      completedOrders.forEach(order => {
        const key = order.product_name;
        if (!productStats[key]) {
          productStats[key] = { count: 0, revenue: 0, name: order.product_name };
        }
        productStats[key].count += order.quantity || 1;
        productStats[key].revenue += order.total_amount;
      });

      const topProduct = Object.values(productStats).length > 0 
        ? Object.values(productStats).reduce((max, current) => 
            current.count > max.count ? current : max
          )
        : null;

      // Client le plus fidèle
      const clientStats: Record<string, { count: number; revenue: number; name: string }> = {};
      completedOrders.forEach(order => {
        const key = order.client_name;
        if (!clientStats[key]) {
          clientStats[key] = { count: 0, revenue: 0, name: order.client_name };
        }
        clientStats[key].count += 1;
        clientStats[key].revenue += order.total_amount;
      });

      const topClient = Object.values(clientStats).length > 0 
        ? Object.values(clientStats).reduce((max, current) => 
            current.revenue > max.revenue ? current : max
          )
        : null;

      // Commandes récentes (5 dernières)
      const recentOrders = ordersData.slice(0, 5);

      setStats({
        totalOrders,
        pendingOrders,
        paidOrders,
        deliveredOrders,
        totalRevenue,
        monthRevenue,
        weekRevenue,
        averageOrderValue,
        topProduct,
        topClient,
        recentOrders,
        monthlyGrowth,
      });

    } catch (error) {
      console.error('Erreur calcul statistiques:', error);
      toast.system.serverError(); // ✅ Plus simple et clair
    }
  };

  // 🎯 Fonction pour afficher les notifications contextuelles
  const showContextualNotifications = async (shop: Shop, products: Product[], user: any) => {
    try {
      // Vérifier si c'est la première visite aujourd'hui
      const lastVisitKey = `lastVisit_${user.id}`;
      const lastVisit = localStorage.getItem(lastVisitKey);
      const today = new Date().toDateString();
      
      if (!lastVisit || lastVisit !== today) {
        // Première visite aujourd'hui
        toast.shop.welcome(shop.name); // ✅ Plus sémantique
        
        // Vérifications initiales
        if (products.length === 0) {
          toast.system.tip('Ajoutez vos premiers produits pour commencer à vendre');
        } else if (products.length < 3) {
          toast.system.tip('Ajoutez plus de produits pour attirer plus de clients');
        }
        
        // Sauvegarder la visite
        localStorage.setItem(lastVisitKey, today);
      }

      // Notifications basées sur l'état actuel
      setTimeout(() => {
        // Commandes en attente (après 2 secondes)
        if (stats.pendingOrders > 5) {
          toast.order.newOrder('Plusieurs clients', `${stats.pendingOrders}`); // ✅ Plus cohérent
        } else if (stats.pendingOrders > 0) {
          toast.system.tip(`Vous avez ${stats.pendingOrders} commande(s) en attente de traitement`);
        }
      }, 2000);

      setTimeout(() => {
        // Produits avec stock faible (après 3 secondes)
        const lowStockProducts = products.filter(p => p.stock !== undefined && p.stock !== null && p.stock <= 2 && p.stock > 0);
        if (lowStockProducts.length > 0) {
          lowStockProducts.forEach(product => {
            toast.product.stockLow(product.name, product.stock || 0); // ✅ Plus cohérent
          });
        }
      }, 3000);

      setTimeout(() => {
        // Encouragements basés sur les performances (après 4 secondes)
        if (stats.monthlyGrowth > 20) {
          toast.success('Excellente croissance !', `+${stats.monthlyGrowth.toFixed(1)}% ce mois ! Continuez comme ça 🚀`);
        } else if (stats.totalRevenue > 100000) {
          toast.success('Cap franchi !', 'Félicitations, vous avez dépassé 100k FCFA de revenus !');
        }
      }, 4000);

    } catch (error) {
      console.error('Erreur notifications contextuelles:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 🎯 Handler pour les actions avec toasts
  const handleQuickAction = (action: string, route: string) => {
    switch (action) {
      case 'new-order':
        toast.system.tip('Remplissez les informations client et produit'); // ✅ Plus cohérent
        break;
      case 'new-product':
        toast.system.tip('Ajoutez photos et description pour maximiser les ventes');
        break;
      case 'view-stats':
        toast.system.tip('Analysez vos performances et commandes');
        break;
    }
    
    setTimeout(() => {
      router.push(route);
    }, 1000);
  };

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
                toast.auth.logoutSuccess(); // ✅ Plus sémantique
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
            toast.auth.logoutSuccess(); // ✅ Plus sémantique
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
        {/* Header avec profil ET bouton lien pro */}
        <div className="flex items-center gap-4 mb-8">
          {shopPhotoUrl && (
            <img
              src={shopPhotoUrl}
              alt="Boutique"
              className="w-16 h-16 rounded-full object-cover border-2 border-night-foreground/20"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Bienvenue, {shop?.name} 👋
            </h1>
            <div className="text-night-foreground/70">{shop?.activity} à {shop?.city}</div>
            {shop?.description && (
              <p className="text-night-foreground/50 text-sm mt-1">{shop.description}</p>
            )}
          </div>
          
          {/* Bouton Ton lien pro */}
          {shop && (
            <div className="flex flex-col gap-2">
              <ShareButton
                url={`/shop/${shop.id}`}
                title={shop.name}
                description={`${shop.activity} à ${shop.city}${shop.description ? ` - ${shop.description}` : ''}`}
                type="shop"
                variant="primary"
                size="md"
                onClick={() => toast.shop.linkShared()} // ✅ Feedback du partage
              />
              <p className="text-xs text-night-foreground/60 text-center">Partage ta boutique</p>
            </div>
          )}
        </div>

        {/* Carte spéciale "Lien pro" visible */}
        {shop && (
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">🔗 Ton lien professionnel</h3>
                <p className="text-night-foreground/70 text-sm mb-3">
                  Partage ton catalogue en ligne avec tes clients. Ils pourront voir tous tes produits et commander directement via WhatsApp.
                </p>
              </div>
              <ShareButton
                url={`/shop/${shop.id}`}
                title={shop.name}
                description={`Découvrez ${shop.activity} à ${shop.city}`}
                type="shop"
                variant="secondary"
                size="lg"
                className="ml-4"
                onClick={() => toast.shop.linkShared()} // ✅ Feedback du partage
              />
            </div>
          </div>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-400 text-2xl font-bold">{stats.totalOrders}</div>
                <div className="text-blue-300 text-sm">Commandes totales</div>
              </div>
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2"></path>
              </svg>
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-yellow-400 text-2xl font-bold">{stats.pendingOrders}</div>
                <div className="text-yellow-300 text-sm">En attente</div>
              </div>
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-400 text-xl font-bold">{stats.monthRevenue.toLocaleString()}</div>
                <div className="text-green-300 text-sm">FCFA ce mois</div>
              </div>
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            {stats.monthlyGrowth !== 0 && (
              <div className={`text-xs mt-1 ${stats.monthlyGrowth > 0 ? 'text-green-300' : 'text-red-300'}`}>
                {stats.monthlyGrowth > 0 ? '↗' : '↘'} {Math.abs(stats.monthlyGrowth).toFixed(1)}% vs mois dernier
              </div>
            )}
          </div>

          <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-400 text-xl font-bold">{stats.averageOrderValue.toLocaleString()}</div>
                <div className="text-purple-300 text-sm">FCFA / commande</div>
              </div>
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Insights et Top performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top produit */}
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🏆 Produit star
            </h3>
            {stats.topProduct ? (
              <div className="space-y-2">
                <div className="font-medium text-blue-400">{stats.topProduct.name}</div>
                <div className="text-night-foreground/70 text-sm">
                  {stats.topProduct.count} ventes • {stats.topProduct.revenue.toLocaleString()} FCFA
                </div>
                <div className="w-full bg-night-foreground/10 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.topProduct.count / stats.totalOrders) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <p className="text-night-foreground/50">Aucune vente pour le moment</p>
            )}
          </div>

          {/* Top client */}
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              👑 Cliente fidèle
            </h3>
            {stats.topClient ? (
              <div className="space-y-2">
                <div className="font-medium text-green-400">{stats.topClient.name}</div>
                <div className="text-night-foreground/70 text-sm">
                  {stats.topClient.count} commandes • {stats.topClient.revenue.toLocaleString()} FCFA
                </div>
                <div className="w-full bg-night-foreground/10 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.topClient.revenue / stats.totalRevenue) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <p className="text-night-foreground/50">Aucune commande pour le moment</p>
            )}
          </div>
        </div>

        {/* Commandes récentes */}
        {stats.recentOrders.length > 0 && (
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">📋 Commandes récentes</h3>
              <button
                onClick={() => router.push('/orders')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Voir toutes →
              </button>
            </div>
            <div className="space-y-3">
              {stats.recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-night-foreground/5 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{order.client_name}</div>
                    <div className="text-sm text-night-foreground/70">{order.product_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{order.total_amount.toLocaleString()} FCFA</div>
                    <div className="text-xs text-night-foreground/50">{formatDate(order.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section Mes produits AVEC boutons partage */}
        {products.length > 0 && (
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">🛍️ Mes produits ({products.length})</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/products')}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Voir tout →
                </button>
                <button
                  onClick={() => handleQuickAction('new-product', '/products/add')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  + Ajouter
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.slice(0, 6).map(product => (
                <div key={product.id} className="bg-night-foreground/5 rounded-lg p-4 border border-night-foreground/10 group">
                  {product.photo_url && productPhotoUrls[product.id] ? (
                    <img
                      src={productPhotoUrls[product.id]}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="w-full h-32 bg-night-foreground/10 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-night-foreground/50 text-sm">Pas d'image</span>
                    </div>
                  )}
                  <div className="font-medium truncate">{product.name}</div>
                  <div className="text-blue-400 font-semibold mb-2">{product.price.toLocaleString()} FCFA</div>
                  {product.stock !== undefined && product.stock !== null && (
                    <div className={`text-xs mb-3 ${product.stock <= 2 ? 'text-yellow-400' : 'text-night-foreground/60'}`}>
                      Stock: {product.stock}
                      {product.stock <= 2 && product.stock > 0 && ' ⚠️'}
                    </div>
                  )}
                  
                  {/* Actions avec bouton partage */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/products/${product.id}/edit`)}
                      className="flex-1 bg-night-foreground/20 text-night-foreground text-center py-2 px-3 rounded text-xs hover:bg-night-foreground/30 transition"
                    >
                      Modifier
                    </button>
                    {shop && (
                      <ShareButton
                        url={`/shop/${shop.id}/product/${product.id}`}
                        title={product.name}
                        description={`${product.price.toLocaleString()} FCFA ${product.description ? `- ${product.description.slice(0, 50)}...` : ''}`}
                        type="product"
                        variant="minimal"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => toast.shop.linkShared()} // ✅ Feedback du partage
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions rapides avec toasts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <button
            onClick={() => handleQuickAction('new-order', '/orders/add')}
            className="bg-green-600 text-white p-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Nouvelle commande
          </button>
          <button
            onClick={() => handleQuickAction('new-product', '/products/add')}
            className="bg-blue-600 text-white p-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
            </svg>
            Nouveau produit
          </button>
          <button
            onClick={() => handleQuickAction('view-stats', '/orders')}
            className="bg-purple-600 text-white p-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Voir les stats
          </button>
        </div>
      </section>
    </main>
  );
}