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
    active: true,
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
function StatCardSkeleton() {
  return (
    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 animate-pulse">
      <div className="h-8 bg-slate-700/50 rounded-lg mb-2"></div>
      <div className="h-4 bg-slate-700/30 rounded w-2/3"></div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* Header Skeleton */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-slate-700/50 rounded mb-2"></div>
            <div className="h-4 bg-slate-700/30 rounded w-1/2"></div>
          </div>
        </div>
      </div>
      
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ✨ Enhanced Shop Link Component
function ShopLink({ shop }: { shop: Shop }) {
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
      toast.success('Lien copié !', 'Prêt à partager sur TikTok et WhatsApp');
      
      setTimeout(() => {
        setCopied(false);
        setIsAnimating(false);
      }, 3000);
    } catch (err) {
      toast.error('Erreur', 'Impossible de copier le lien');
    }
  };

  const handleOpen = () => {
    setIsAnimating(true);
    window.open(fullUrl, '_blank');
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`🛍️ Découvrez ma boutique ${shop.name} !\n\n${fullUrl}\n\n#${shop.activity} #Shopping`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-emerald-900/20 via-blue-900/20 to-purple-900/20 border border-emerald-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm group hover:border-emerald-400/50 transition-all duration-300">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <p className="text-emerald-400 font-semibold text-sm">🔗 Votre boutique en ligne</p>
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
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-600/25 hover:scale-105 active:scale-95'
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
                Copier
              </>
            )}
          </button>
          
          <button
            onClick={handleOpen}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/25 hover:scale-105 active:scale-95 min-h-[44px]"
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

// ✨ Enhanced Stat Card Component
function StatCard({ 
  label, 
  value, 
  trend, 
  icon, 
  color = 'blue',
  prefix = '',
  suffix = '',
  isLoading = false 
}: {
  label: string;
  value: number | string;
  trend?: number;
  icon: React.ReactNode;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'red';
  prefix?: string;
  suffix?: string;
  isLoading?: boolean;
}) {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: 'bg-blue-600/20 text-blue-400',
    },
    emerald: {
      bg: 'from-emerald-500/20 to-emerald-600/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      icon: 'bg-emerald-600/20 text-emerald-400',
    },
    amber: {
      bg: 'from-amber-500/20 to-amber-600/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: 'bg-amber-600/20 text-amber-400',
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-600/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      icon: 'bg-purple-600/20 text-purple-400',
    },
    red: {
      bg: 'from-red-500/20 to-red-600/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: 'bg-red-600/20 text-red-400',
    },
  };

  const classes = colorClasses[color];

  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <div className={`bg-gradient-to-br ${classes.bg} backdrop-blur-sm border ${classes.border} rounded-xl p-4 group hover:scale-105 transition-all duration-300 hover:shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${classes.icon} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-emerald-900/30 text-emerald-400' : 
            trend < 0 ? 'bg-red-900/30 text-red-400' : 
            'bg-slate-800/30 text-slate-400'
          }`}>
            {trend > 0 && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l9.2-9.2M17 17V7H7"></path>
              </svg>
            )}
            {trend < 0 && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 7L7.8 16.2M7 7v10h10"></path>
              </svg>
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <div className={`text-2xl sm:text-3xl font-bold ${classes.text} mb-1 transition-colors duration-300`}>
        {prefix}{typeof value === 'number' && value > 999 ? `${Math.round(value / 1000)}k` : value.toLocaleString()}{suffix}
      </div>
      
      <div className="text-slate-400 text-sm font-medium">
        {label}
      </div>
    </div>
  );
}

// ✨ Enhanced Action Card Component
function ActionCard({ 
  title, 
  description, 
  icon, 
  onClick, 
  color = 'blue',
  badge 
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'blue' | 'emerald' | 'purple' | 'amber';
  badge?: number;
}) {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/25',
    emerald: 'from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-600/25',
    purple: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-600/25',
    amber: 'from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-600/25',
  };

  return (
    <button
      onClick={onClick}
      className={`relative bg-gradient-to-r ${colorClasses[color]} text-white p-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 text-left w-full min-h-[120px] group`}
    >
      {badge && badge > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
          {badge > 99 ? '99+' : badge}
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{title}</h3>
          {description && (
            <p className="text-white/80 text-sm">{description}</p>
          )}
        </div>
        <svg className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
        </svg>
      </div>
    </button>
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('/dashboard');
  
  const router = useRouter();
  const toast = useToasts();

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const fetchDashboardData = async () => {
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

      if (shopData.photo_url) {
        const { data: urlData } = await supabase.storage
          .from('shop-photos')
          .createSignedUrl(shopData.photo_url, 60 * 60);
        setShopPhotoUrl(urlData?.signedUrl ?? null);
      }

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);
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

  const handleNavigation = (route: string) => {
    setActiveTab(route);
    router.push(route);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950 p-4">
        <DashboardSkeleton />
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
                Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre tableau de bord.
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
        <header className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-6">
            {shopPhotoUrl ? (
              <img
                src={shopPhotoUrl}
                alt="Boutique"
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-slate-600/50"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">{shop?.name?.charAt(0)}</span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {shop?.name}
              </h1>
              <p className="text-slate-400 text-lg">
                {shop?.activity} • {shop?.city}
              </p>
            </div>

            <div className="hidden sm:flex gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">{products.length}</div>
                <div className="text-xs text-slate-500">Produits</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">{stats.totalOrders}</div>
                <div className="text-xs text-slate-500">Commandes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {Math.round(stats.totalRevenue / 1000)}k FCFA
                </div>
                <div className="text-xs text-slate-500">Revenus</div>
              </div>
            </div>
          </div>
        </header>

        {/* ✨ Enhanced Shop Link */}
        {shop && <ShopLink shop={shop} />}

        {/* ✨ Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Commandes totales"
            value={stats.totalOrders}
            trend={12}
            color="blue"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            }
            isLoading={loading}
          />
          
          <StatCard
            label="En attente"
            value={stats.pendingOrders}
            color="amber"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            }
            isLoading={loading}
          />
          
          <StatCard
            label="Revenus ce mois"
            value={stats.monthRevenue}
            trend={24}
            color="emerald"
            suffix=" FCFA"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            }
            isLoading={loading}
          />
          
          <StatCard
            label="Revenus total"
            value={stats.totalRevenue}
            trend={8}
            color="purple"
            suffix=" FCFA"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            }
            isLoading={loading}
          />
        </div>

        {/* ✨ Enhanced Recent Orders */}
        {stats.recentOrders.length > 0 && (
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Commandes récentes</h2>
              <button
                onClick={() => router.push('/orders')}
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2 hover:bg-blue-900/20 px-3 py-2 rounded-lg transition-all duration-300"
              >
                Voir toutes
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {stats.recentOrders.map((order, index) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{order.client_name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white truncate">{order.client_name}</div>
                      <div className="text-sm text-slate-400 truncate">{order.product_name}</div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-bold text-white">
                      {order.total_amount.toLocaleString()} FCFA
                    </div>
                    <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                      order.status === 'pending' ? 'bg-amber-900/30 text-amber-400' :
                      order.status === 'paid' ? 'bg-emerald-900/30 text-emerald-400' :
                      'bg-blue-900/30 text-blue-400'
                    }`}>
                      {order.status === 'pending' ? 'En attente' :
                       order.status === 'paid' ? 'Payée' : 'Livrée'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✨ Enhanced Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            title="Nouvelle commande"
            description="Ajouter une commande manuellement"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            }
            onClick={() => router.push('/orders/add')}
            color="emerald"
          />
          
          <ActionCard
            title="Nouveau produit"
            description="Enrichir votre catalogue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
              </svg>
            }
            onClick={() => router.push('/products/add')}
            color="blue"
          />
          
          <ActionCard
            title="Statistiques"
            description="Analyser vos performances"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            }
            onClick={() => router.push('/orders')}
            color="purple"
            badge={stats.pendingOrders}
          />
        </div>

        {/* ✨ Enhanced Footer */}
        <div className="text-center py-8 mt-8 border-t border-slate-700/50">
          <div className="text-slate-500 text-sm">
            <p>Connecté : <strong className="text-white">Sdiabate1337</strong></p>
            <p className="mt-1">2025-08-03 15:07:16 UTC</p>
            <p className="mt-2 text-xs text-slate-600">
              🚀 ShopShap v2.0 - Tableau de bord moderne
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}