'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';
import Link from 'next/link';

type Order = {
  id: string;
  client_name: string;
  client_phone: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'delivered' | 'cancelled';
  payment_proof_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type OrderWithProofUrl = Order & {
  signedProofUrl: string | null;
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
    active: true,
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

// ✨ Enhanced Status Configuration
const statusConfig = {
  pending: { 
    label: 'En attente', 
    icon: '⏳',
    color: 'text-amber-400', 
    bg: 'bg-amber-900/30 border-amber-500/30',
    bgCard: 'bg-amber-900/20',
    iconBg: 'bg-amber-600/20',
  },
  paid: { 
    label: 'Payée', 
    icon: '✅',
    color: 'text-emerald-400', 
    bg: 'bg-emerald-900/30 border-emerald-500/30',
    bgCard: 'bg-emerald-900/20',
    iconBg: 'bg-emerald-600/20',
  },
  delivered: { 
    label: 'Livrée', 
    icon: '🚚',
    color: 'text-blue-400', 
    bg: 'bg-blue-900/30 border-blue-500/30',
    bgCard: 'bg-blue-900/20',
    iconBg: 'bg-blue-600/20',
  },
  cancelled: { 
    label: 'Annulée', 
    icon: '❌',
    color: 'text-red-400', 
    bg: 'bg-red-900/30 border-red-500/30',
    bgCard: 'bg-red-900/20',
    iconBg: 'bg-red-600/20',
  },
};

// ✨ Enhanced Loading Skeleton
function OrdersSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* Header Skeleton */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded mb-4"></div>
        <div className="h-12 bg-slate-700/50 rounded w-2/3"></div>
      </div>
      
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 animate-pulse">
            <div className="h-8 bg-slate-700/50 rounded mb-2"></div>
            <div className="h-4 bg-slate-700/30 rounded w-2/3"></div>
          </div>
        ))}
      </div>
      
      {/* Orders List Skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-slate-700/50 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-700/50 rounded mb-2"></div>
              <div className="h-3 bg-slate-700/30 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ✨ Enhanced Stat Card Component
function StatCard({ 
  label, 
  value, 
  icon, 
  color,
  sublabel,
  isLoading = false 
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: keyof typeof statusConfig | 'purple';
  sublabel?: string;
  isLoading?: boolean;
}) {
  const colorClasses = {
    pending: statusConfig.pending,
    paid: statusConfig.paid,
    delivered: statusConfig.delivered,
    cancelled: statusConfig.cancelled,
    purple: {
      color: 'text-purple-400',
      bg: 'bg-purple-900/30 border-purple-500/30',
      bgCard: 'bg-purple-900/20',
      iconBg: 'bg-purple-600/20',
    }
  };

  const classes = colorClasses[color];

  if (isLoading) {
    return (
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded mb-2"></div>
        <div className="h-4 bg-slate-700/30 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-lg group ${classes.bgCard}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={`text-3xl font-bold ${classes.color} mb-1 transition-colors duration-300`}>
            {typeof value === 'number' && value > 999 ? `${Math.round(value / 1000)}k` : value.toLocaleString()}
          </div>
          <div className={`${classes.color} font-semibold mb-1`}>
            {label}
          </div>
          {sublabel && (
            <div className="text-slate-500 text-xs">
              {sublabel}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${classes.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const toast = useToasts();
  
  const [orders, setOrders] = useState<OrderWithProofUrl[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithProofUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithProofUrl | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('/orders');

  // ✨ Enhanced Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    monthRevenue: 0,
  });

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
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    if (!loading && orders.length > 0) {
      const pendingCount = orders.filter(o => o.status === 'pending').length;
      if (pendingCount > 0) {
        setTimeout(() => {
          toast.warning('Commandes en attente', `${pendingCount} commande(s) nécessitent votre attention`);
        }, 1000);
      } else {
        setTimeout(() => {
          toast.success('Tout est à jour !', 'Félicitations, toutes vos commandes sont traitées');
        }, 1000);
      }
    }
  }, [loading, orders, toast]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Session expirée', 'Veuillez vous reconnecter');
        router.replace('/login');
        return;
      }

      // ✨ Enhanced shop retrieval
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (shopError || !shopData) {
        toast.error('Boutique introuvable', 'Configurez d\'abord votre boutique');
        router.replace('/onboarding');
        return;
      }

      // ✨ Enhanced orders retrieval
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement commandes:', error);
        toast.error('Erreur chargement', 'Impossible de charger les commandes');
        return;
      }

      if (ordersData) {
        // ✨ Enhanced signed URLs generation
        const ordersWithSignedUrls = await Promise.allSettled(
          ordersData.map(async (order: Order) => {
            let signedProofUrl: string | null = null;
            
            if (order.payment_proof_url) {
              try {
                const { data: signedData, error } = await supabase.storage
                  .from('payment-proofs')
                  .createSignedUrl(order.payment_proof_url, 60 * 60);
                
                if (!error && signedData?.signedUrl) {
                  signedProofUrl = signedData.signedUrl;
                }
              } catch (err) {
                console.warn('Erreur génération signed URL:', err);
              }
            }

            return {
              ...order,
              signedProofUrl,
            };
          })
        );

        const successfulOrders = ordersWithSignedUrls
          .filter((result): result is PromiseFulfilledResult<OrderWithProofUrl> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value);

        setOrders(successfulOrders);
        calculateStats(successfulOrders);
        toast.success('Données synchronisées', 'Commandes mises à jour');
      }

    } catch (err) {
      console.error('Erreur chargement commandes:', err);
      toast.error('Erreur réseau', 'Vérifiez votre connexion internet');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(ordersList: OrderWithProofUrl[]) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const stats = {
      total: ordersList.length,
      pending: ordersList.filter(o => o.status === 'pending').length,
      paid: ordersList.filter(o => o.status === 'paid').length,
      delivered: ordersList.filter(o => o.status === 'delivered').length,
      cancelled: ordersList.filter(o => o.status === 'cancelled').length,
      totalRevenue: ordersList
        .filter(o => o.status === 'paid' || o.status === 'delivered')
        .reduce((sum, o) => sum + o.total_amount, 0),
      monthRevenue: ordersList
        .filter(o => {
          const orderDate = new Date(o.created_at);
          return (o.status === 'paid' || o.status === 'delivered') &&
                 orderDate.getMonth() === currentMonth &&
                 orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, o) => sum + o.total_amount, 0),
    };

    setStats(stats);
  }

  function filterOrders() {
    let filtered = orders;

    // ✨ Enhanced search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.client_phone && order.client_phone.includes(searchTerm)) ||
        (order.notes && order.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // ✨ Enhanced status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }

  // ✨ Enhanced status update function
  async function updateOrderStatus(orderId: string, newStatus: string, clientName?: string) {
    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Erreur mise à jour statut:', error);
        toast.error('Erreur mise à jour', 'Impossible de modifier le statut');
        return;
      }

      // ✨ Enhanced local update
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId 
            ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() } 
            : order
        )
      );

      // ✨ Enhanced stats recalculation
      const updatedOrders = orders.map(order =>
        order.id === orderId 
          ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() } 
          : order
      );
      calculateStats(updatedOrders);

      // ✨ Enhanced success messages
      const statusMessages = {
        pending: 'remise en attente',
        paid: 'marquée comme payée',
        delivered: 'marquée comme livrée',
        cancelled: 'annulée'
      };
      
      toast.success('Statut mis à jour', `Commande ${statusMessages[newStatus as keyof typeof statusMessages]}${clientName ? ` pour ${clientName}` : ''}`);

      // ✨ Enhanced contextual tips
      if (newStatus === 'paid') {
        setTimeout(() => {
          toast.info('Conseil 💡', 'N\'oubliez pas de préparer la livraison et d\'informer le client !');
        }, 2000);
      } else if (newStatus === 'delivered') {
        setTimeout(() => {
          toast.info('Excellent ! 🎉', 'Demandez un avis à votre client pour améliorer votre service');
        }, 2000);
      } else if (newStatus === 'cancelled') {
        setTimeout(() => {
          toast.info('Conseil 💬', 'Pensez à expliquer la raison de l\'annulation au client');
        }, 2000);
      }

    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      toast.error('Erreur inattendue', 'Une erreur est survenue lors de la mise à jour');
    } finally {
      setUpdatingStatus(null);
    }
  }

  // ✨ Enhanced delete function
  async function deleteOrder(orderId: string, clientName: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Erreur suppression commande:', error);
        toast.error('Erreur suppression', 'Impossible de supprimer la commande');
        return;
      }

      // ✨ Enhanced local update
      const updatedOrders = orders.filter(order => order.id !== orderId);
      setOrders(updatedOrders);
      calculateStats(updatedOrders);
      
      toast.success('Commande supprimée', `Commande de ${clientName} supprimée définitivement`);
      setShowDeleteConfirm(null);
      setShowOrderModal(false);

      // ✨ Enhanced post-deletion tip
      setTimeout(() => {
        toast.info('Conseil 📞', 'Pensez à informer le client si nécessaire');
      }, 2000);

    } catch (err) {
      console.error('Erreur suppression commande:', err);
      toast.error('Erreur inattendue', 'Une erreur est survenue lors de la suppression');
    }
  }

  // ✨ Enhanced date formatting
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function openOrderModal(order: OrderWithProofUrl) {
    setSelectedOrder(order);
    setShowOrderModal(true);
  }

  // ✨ Enhanced WhatsApp function
  function sendWhatsAppReminder(order: OrderWithProofUrl) {
    if (!order.client_phone) {
      toast.warning('Pas de téléphone', 'Aucun numéro enregistré pour ce client');
      return;
    }

    const statusMessages = {
      pending: 'Votre commande est prête ! Merci de confirmer votre paiement pour que nous puissions procéder à la livraison.',
      paid: 'Votre commande sera livrée sous peu. Merci de votre confiance et de votre paiement !',
      delivered: 'Merci pour votre commande ! N\'hésitez pas à nous faire un retour.',
      cancelled: 'Votre commande a été annulée. N\'hésitez pas à nous recontacter.'
    };

    const message = encodeURIComponent(
      `Bonjour ${order.client_name} ! 👋
      
🛍️ Rappel concernant votre commande :
📦 ${order.product_name} x${order.quantity}
💰 ${order.total_amount.toLocaleString()} FCFA

${statusMessages[order.status]}

N'hésitez pas si vous avez des questions !
Cordialement 🙏`
    );

    const whatsappUrl = `https://wa.me/${order.client_phone.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success('Message envoyé', `Rappel WhatsApp envoyé à ${order.client_name}`);
  }

  const handleNavigation = (route: string) => {
    setActiveTab(route);
    router.push(route);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950 p-4">
        <OrdersSkeleton />
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
                Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à vos commandes.
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
                <span className="text-emerald-400 font-medium">Commandes</span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2"></path>
                    </svg>
                  </div>
                  Mes commandes
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Total: <strong className="text-white">{stats.total}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                    <span>En attente: <strong className="text-amber-400">{stats.pending}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span>Revenus ce mois: <strong className="text-emerald-400">{stats.monthRevenue.toLocaleString()} FCFA</strong></span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/orders/add')}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-600/25 active:scale-95 flex items-center gap-3 min-h-[44px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Nouvelle commande
              </button>
            </div>
          </div>
        </header>

        {/* ✨ Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="En attente"
            value={stats.pending}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            }
            color="pending"
            sublabel="À traiter"
            isLoading={loading}
          />
          
          <StatCard
            label="Payées"
            value={stats.paid}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
              </svg>
            }
            color="paid"
            sublabel="À livrer"
            isLoading={loading}
          />
          
          <StatCard
            label="Livrées"
            value={stats.delivered}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7"></path>
              </svg>
            }
            color="delivered"
            sublabel="Terminées"
            isLoading={loading}
          />
          
          <StatCard
            label="Revenus total"
            value={`${stats.totalRevenue.toLocaleString()}`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            }
            color="purple"
            sublabel="FCFA"
            isLoading={loading}
          />
        </div>

        {/* ✨ Enhanced Filters */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher par client, produit, téléphone ou notes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700/30 border-2 border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-700/30 border-2 border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-3 text-white focus:outline-none transition-all duration-300 min-w-[180px]"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">⏳ En attente</option>
              <option value="paid">✅ Payées</option>
              <option value="delivered">🚚 Livrées</option>
              <option value="cancelled">❌ Annulées</option>
            </select>
            
            <div className="flex items-center px-4 py-3 bg-slate-700/20 rounded-xl text-slate-400 text-sm font-medium whitespace-nowrap">
              {searchTerm || statusFilter !== 'all' 
                ? `${filteredOrders.length}/${orders.length} résultats` 
                : `${orders.length} commande${orders.length > 1 ? 's' : ''}`
              }
            </div>
          </div>
        </div>

        {/* ✨ Enhanced Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 text-center">
            {orders.length === 0 ? (
              <div>
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Aucune commande pour le moment</h3>
                <p className="text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">
                  Commencez par ajouter votre première commande pour suivre vos ventes et gérer vos clients TikTok et WhatsApp
                </p>
                <button
                  onClick={() => router.push('/orders/add')}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-600/25 active:scale-95"
                >
                  🚀 Ajouter ma première commande
                </button>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Aucune commande trouvée</h3>
                <p className="text-slate-400 mb-6">
                  Aucune commande ne correspond à vos critères de recherche
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    toast.info('Filtres réinitialisés', 'Affichage de toutes les commandes');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 underline font-medium transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <div
                key={order.id}
                className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                onClick={() => openOrderModal(order)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {order.client_name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="font-bold text-xl text-white group-hover:text-emerald-300 transition-colors duration-300">
                          {order.client_name}
                        </h3>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-sm border font-semibold flex items-center gap-2 ${statusConfig[order.status].bg}`}>
                        <span>{statusConfig[order.status].icon}</span>
                        <span className={statusConfig[order.status].color}>
                          {statusConfig[order.status].label}
                        </span>
                      </div>
                      
                      {order.payment_proof_url && (
                        <div className="bg-emerald-900/30 border border-emerald-500/30 px-3 py-1 rounded-full">
                          <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                            💳 Preuve de paiement
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-slate-500 font-medium">Produit</p>
                        <p className="text-white font-semibold">{order.product_name} <span className="text-slate-400">x{order.quantity}</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500 font-medium">Total</p>
                        <p className="text-emerald-400 font-bold text-lg">{order.total_amount.toLocaleString()} FCFA</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500 font-medium">Date</p>
                        <p className="text-white font-medium">{formatDate(order.created_at)}</p>
                      </div>
                      {order.client_phone && (
                        <div className="space-y-1">
                          <p className="text-slate-500 font-medium">Téléphone</p>
                          <p className="text-blue-400 font-medium">{order.client_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {/* ✨ Enhanced Quick Actions */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <>
                        {order.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'paid', order.client_name);
                            }}
                            disabled={updatingStatus === order.id}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-emerald-600/50 disabled:to-emerald-600/50 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 min-h-[44px]"
                          >
                            {updatingStatus === order.id ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                            ) : (
                              <span>✅</span>
                            )}
                            Marquer payée
                          </button>
                        )}
                        
                        {order.status === 'paid' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'delivered', order.client_name);
                            }}
                            disabled={updatingStatus === order.id}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-600/50 disabled:to-blue-600/50 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 min-h-[44px]"
                          >
                            {updatingStatus === order.id ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                            ) : (
                              <span>🚚</span>
                            )}
                            Marquer livrée
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* ✨ Enhanced WhatsApp Button */}
                    {order.client_phone && order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendWhatsAppReminder(order);
                        }}
                        className="bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 min-h-[44px]"
                        title="Envoyer un rappel WhatsApp"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                        Rappel
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openOrderModal(order);
                      }}
                      className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 hover:border-slate-500 px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 min-h-[44px]"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✨ Enhanced Footer */}
        <div className="text-center py-8 mt-12 border-t border-slate-700/50">
          <div className="text-slate-500 text-sm">
            <p>Connecté : <strong className="text-white">Sdiabate1337</strong></p>
            <p className="mt-1">2025-08-03 16:02:40 UTC</p>
            <p className="mt-2 text-xs text-slate-600">
              🚀 ShopShap v2.0 - Gestion complète de commandes TikTok & WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* ✨ Enhanced Order Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-bold text-white tracking-tight">
                Détails de la commande
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* ✨ Enhanced Client Info */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-blue-400">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  Informations client
                </h4>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {selectedOrder.client_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-xl mb-1">{selectedOrder.client_name}</p>
                    {selectedOrder.client_phone && (
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{selectedOrder.client_phone}</span>
                        <button
                          onClick={() => sendWhatsAppReminder(selectedOrder)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ✨ Enhanced Product Info */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-emerald-400">
                  <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
                    </svg>
                  </div>
                  Produit commandé
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-slate-500 text-sm mb-1 font-medium">Nom du produit</p>
                      <p className="text-white font-bold text-lg">{selectedOrder.product_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm mb-1 font-medium">Quantité</p>
                      <p className="text-white font-bold text-lg">{selectedOrder.quantity} unité(s)</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-slate-500 text-sm mb-1 font-medium">Prix unitaire</p>
                      <p className="text-white font-bold text-lg">{selectedOrder.unit_price.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm mb-1 font-medium">Total</p>
                      <p className="text-emerald-400 font-bold text-2xl">{selectedOrder.total_amount.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✨ Enhanced Status & Dates */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-purple-400">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 6v2m0 0h2m-2 0H7"></path>
                    </svg>
                  </div>
                  Statut et suivi
                </h4>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 font-medium">Statut actuel:</span>
                    <div className={`px-4 py-2 rounded-xl border font-bold flex items-center gap-2 ${statusConfig[selectedOrder.status].bg}`}>
                      <span className="text-lg">{statusConfig[selectedOrder.status].icon}</span>
                      <span className={statusConfig[selectedOrder.status].color}>
                        {statusConfig[selectedOrder.status].label}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <p className="text-slate-400 text-sm mb-1 font-medium">Créée le</p>
                      <p className="text-white font-bold">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <p className="text-slate-400 text-sm mb-1 font-medium">Modifiée le</p>
                      <p className="text-white font-bold">{formatDate(selectedOrder.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✨ Enhanced Notes */}
              {selectedOrder.notes && (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                  <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-amber-400">
                    <div className="w-10 h-10 bg-amber-600/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </div>
                    Notes additionnelles
                  </h4>
                  <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4">
                    <p className="whitespace-pre-wrap text-white leading-relaxed">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* ✨ Enhanced Payment Proof */}
              {selectedOrder.signedProofUrl && (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                  <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-emerald-400">
                    <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                      </svg>
                    </div>
                    Preuve de paiement
                  </h4>
                  <div className="border border-slate-600/50 rounded-xl overflow-hidden shadow-xl">
                    <img
                      src={selectedOrder.signedProofUrl}
                      alt="Preuve de paiement"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* ✨ Enhanced Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-700/50">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'paid', selectedOrder.client_name);
                      setShowOrderModal(false);
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-600/25 active:scale-95 flex items-center justify-center gap-3 min-h-[56px]"
                  >
                    <span className="text-lg">✅</span>
                    Marquer comme payée
                  </button>
                )}
                
                {selectedOrder.status === 'paid' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'delivered', selectedOrder.client_name);
                      setShowOrderModal(false);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-600/25 active:scale-95 flex items-center justify-center gap-3 min-h-[56px]"
                  >
                    <span className="text-lg">🚚</span>
                    Marquer comme livrée
                  </button>
                )}
                
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => {
                      toast.warning('Annulation de commande', 'La commande va être annulée');
                      setTimeout(() => {
                        updateOrderStatus(selectedOrder.id, 'cancelled', selectedOrder.client_name);
                        setShowOrderModal(false);
                      }, 1000);
                    }}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-600/25 active:scale-95 flex items-center justify-center gap-3 min-h-[56px]"
                  >
                    <span className="text-lg">❌</span>
                    Annuler la commande
                  </button>
                )}
                
                <button
                  onClick={() => {
                    toast.warning('Suppression de commande', 'Cette action supprimera définitivement la commande');
                    setTimeout(() => setShowDeleteConfirm(selectedOrder.id), 1000);
                  }}
                  className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 hover:border-slate-500 py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 min-h-[56px]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✨ Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && selectedOrder && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-60 transition-opacity duration-300"
            onClick={() => setShowDeleteConfirm(null)}
          />
          
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60 transition-all duration-300">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-400">Confirmer la suppression</h3>
                  <p className="text-slate-400 text-sm mt-1">Cette action est irréversible</p>
                </div>
              </div>
              
              <div className="mb-8">
                <p className="text-slate-300 mb-4 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer la commande de <strong className="text-white">"{selectedOrder.client_name}"</strong> ?
                </p>
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                  <p className="text-sm text-red-300 mb-4 font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    ⚠️ Cette action supprimera définitivement :
                  </p>
                  <ul className="text-sm text-red-300/90 space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Tous les détails de la commande (produit, quantité, prix)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Les preuves de paiement et documents associés</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>L'historique complet des modifications</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Les données de suivi et notes personnalisées</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 py-4 px-6 rounded-xl border border-slate-600/50 transition-all duration-300 font-bold hover:scale-105 active:scale-95 min-h-[56px] flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Annuler
                </button>
                <button
                  onClick={() => deleteOrder(showDeleteConfirm, selectedOrder.client_name)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 px-6 rounded-xl transition-all duration-300 font-bold hover:scale-105 active:scale-95 shadow-xl hover:shadow-red-600/25 min-h-[56px] flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Oui, supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        
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
      `}</style>
    </main>
  );
}