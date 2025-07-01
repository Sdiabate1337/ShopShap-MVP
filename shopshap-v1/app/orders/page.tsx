'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';

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
    active: true,
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

const statusConfig = {
  pending: { 
    label: '⏳ En attente', 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-900/20 border-yellow-800/50',
    bgHover: 'hover:bg-yellow-900/30'
  },
  paid: { 
    label: '✅ Payée', 
    color: 'text-green-400', 
    bg: 'bg-green-900/20 border-green-800/50',
    bgHover: 'hover:bg-green-900/30'
  },
  delivered: { 
    label: '🚚 Livrée', 
    color: 'text-blue-400', 
    bg: 'bg-blue-900/20 border-blue-800/50',
    bgHover: 'hover:bg-blue-900/30'
  },
  cancelled: { 
    label: '❌ Annulée', 
    color: 'text-red-400', 
    bg: 'bg-red-900/20 border-red-800/50',
    bgHover: 'hover:bg-red-900/30'
  },
};

export default function OrdersPage() {
  const router = useRouter();
  const toast = useToasts();
  
  const [orders, setOrders] = useState<OrderWithProofUrl[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithProofUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithProofUrl | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    monthRevenue: 0,
  });

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
          toast.order.newOrder('clients', pendingCount.toString());
        }, 1000);
      } else {
        setTimeout(() => {
          toast.system.tip('Félicitations ! Toutes vos commandes sont à jour');
        }, 1000);
      }
    }
  }, [loading, orders, toast]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.auth.sessionExpired();
        router.replace('/login');
        return;
      }

      // Récupérer le shop
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

      // Récupérer les commandes
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement commandes:', error);
        toast.system.serverError();
        return;
      }

      if (ordersData) {
        // Générer les signed URLs pour les preuves de paiement
        const ordersWithSignedUrls = await Promise.all(
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

        setOrders(ordersWithSignedUrls);
        calculateStats(ordersWithSignedUrls);
        toast.system.syncSuccess();
      }

    } catch (err) {
      console.error('Erreur chargement commandes:', err);
      toast.system.networkError();
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

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.client_phone && order.client_phone.includes(searchTerm))
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }

  async function updateOrderStatus(orderId: string, newStatus: string, clientName?: string) {
    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Erreur mise à jour statut:', error);
        toast.system.serverError();
        return;
      }

      // Mettre à jour localement
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus as any } : order
        )
      );

      // Recalculer les stats
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus as any } : order
      );
      calculateStats(updatedOrders);

      // Toast de succès
      const statusLabels = {
        pending: 'en attente',
        paid: 'payée',
        delivered: 'livrée',
        cancelled: 'annulée'
      };
      
      toast.order.updated(statusLabels[newStatus as keyof typeof statusLabels], clientName);

      // Conseils contextuels
      if (newStatus === 'paid') {
        setTimeout(() => {
          toast.system.tip('N\'oubliez pas de préparer la livraison !');
        }, 2000);
      } else if (newStatus === 'delivered') {
        setTimeout(() => {
          toast.system.tip('Demandez un avis à votre client pour améliorer votre service');
        }, 2000);
      }

    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      toast.system.networkError();
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function deleteOrder(orderId: string, clientName: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Erreur suppression commande:', error);
        toast.system.serverError();
        return;
      }

      // Mettre à jour localement
      const updatedOrders = orders.filter(order => order.id !== orderId);
      setOrders(updatedOrders);
      calculateStats(updatedOrders);
      
      toast.order.deleted();
      setShowDeleteConfirm(null);
      setShowOrderModal(false);

      // Conseil après suppression
      setTimeout(() => {
        toast.system.tip('Pensez à informer le client si nécessaire');
      }, 2000);

    } catch (err) {
      console.error('Erreur suppression commande:', err);
      toast.system.networkError();
    }
  }

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

  function sendWhatsAppReminder(order: OrderWithProofUrl) {
    if (!order.client_phone) {
      toast.warning('Pas de téléphone', 'Aucun numéro enregistré pour ce client');
      return;
    }

    const message = encodeURIComponent(
      `Bonjour ${order.client_name}, 
      
Rappel concernant votre commande :
📦 ${order.product_name} x${order.quantity}
💰 ${order.total_amount.toLocaleString()} FCFA

${order.status === 'pending' ? 
  'Votre commande est prête ! Merci de confirmer votre paiement.' : 
  order.status === 'paid' ? 
  'Votre commande sera livrée sous peu. Merci de votre confiance !' :
  'Merci pour votre commande !'
}

Cordialement 🙏`
    );

    const whatsappUrl = `https://wa.me/${order.client_phone.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    toast.order.reminderSent(order.client_name);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        <p className="text-night-foreground mt-4 text-lg">Chargement des commandes...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-blue-950 pb-20 sm:pb-8">
      {/* Enhanced Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden">
        <div className="relative">
          {/* Menu Toggle Button */}
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

          {/* Menu Items */}
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
              
              {/* Logout Button */}
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
        {/* Enhanced Header Section */}
        <header className="mb-8">
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-xl opacity-50"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2"></path>
                      </svg>
                    </div>
                  </div>
                  Mes commandes
                </h1>
                <div className="flex flex-wrap gap-6 text-night-foreground/80">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Total: <strong className="text-white">{stats.total}</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    En attente: <strong className="text-yellow-400">{stats.pending}</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Revenus du mois: <strong className="text-green-400">{stats.monthRevenue.toLocaleString()} FCFA</strong>
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  toast.info('Nouvelle commande', 'Ajoutez une commande pour vos clients');
                  setTimeout(() => router.push('/orders/add'), 500);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Nouvelle commande
              </button>
            </div>
          </div>
        </header>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-6 shadow-xl transition-all duration-200 ${statusConfig.pending.bgHover}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
                <div className="text-yellow-300 font-medium">En attente</div>
                <div className="text-xs text-yellow-300/70 mt-1">À traiter</div>
              </div>
              <div className="w-12 h-12 bg-yellow-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className={`bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-6 shadow-xl transition-all duration-200 ${statusConfig.paid.bgHover}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-400">{stats.paid}</div>
                <div className="text-green-300 font-medium">Payées</div>
                <div className="text-xs text-green-300/70 mt-1">À livrer</div>
              </div>
              <div className="w-12 h-12 bg-green-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className={`bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-6 shadow-xl transition-all duration-200 ${statusConfig.delivered.bgHover}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-400">{stats.delivered}</div>
                <div className="text-blue-300 font-medium">Livrées</div>
                <div className="text-xs text-blue-300/70 mt-1">Terminées</div>
              </div>
              <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-400">{stats.totalRevenue.toLocaleString()}</div>
                <div className="text-purple-300 font-medium">FCFA total</div>
                <div className="text-xs text-purple-300/70 mt-1">Revenus</div>
              </div>
              <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-6 shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-4 top-4 w-5 h-5 text-night-foreground/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher par client, produit ou téléphone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-12 pr-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white focus:outline-none transition-all duration-200 min-w-48"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">⏳ En attente</option>
              <option value="paid">✅ Payées</option>
              <option value="delivered">🚚 Livrées</option>
              <option value="cancelled">❌ Annulées</option>
            </select>
          </div>
        </div>

        {/* Enhanced Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-12 text-center shadow-xl">
            {orders.length === 0 ? (
              <div>
                <div className="relative">
                  <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-xl opacity-50 mx-auto"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Aucune commande pour le moment</h3>
                <p className="text-night-foreground/80 mb-8 leading-relaxed max-w-md mx-auto">
                  Commencez par ajouter votre première commande pour suivre vos ventes et gérer vos clients
                </p>
                <button
                  onClick={() => {
                    toast.info('Première commande', 'Créez votre première commande pour démarrer');
                    setTimeout(() => router.push('/orders/add'), 500);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  🚀 Ajouter ma première commande
                </button>
              </div>
            ) : (
              <div>
                <svg className="w-16 h-16 text-night-foreground/50 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <p className="text-night-foreground/70 mb-4">Aucune commande ne correspond à vos critères de recherche.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    toast.info('Filtres réinitialisés', 'Affichage de toutes les commandes');
                  }}
                  className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
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
                className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-6 shadow-xl hover:bg-night-foreground/15 transition-all duration-300 cursor-pointer group hover:scale-[1.02]"
                onClick={() => openOrderModal(order)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {order.client_name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="font-bold text-xl text-white">{order.client_name}</h3>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-sm border font-medium ${statusConfig[order.status].bg}`}>
                        <span className={statusConfig[order.status].color}>
                          {statusConfig[order.status].label}
                        </span>
                      </div>
                      
                      {order.payment_proof_url && (
                        <div className="bg-green-900/20 border border-green-800/50 px-3 py-1 rounded-full">
                          <span className="text-green-400 text-sm font-medium">💳 Preuve</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-night-foreground/60">Produit</p>
                        <p className="text-white font-medium">{order.product_name} x{order.quantity}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-night-foreground/60">Total</p>
                        <p className="text-green-400 font-bold text-lg">{order.total_amount.toLocaleString()} FCFA</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-night-foreground/60">Date</p>
                        <p className="text-white font-medium">{formatDate(order.created_at)}</p>
                      </div>
                      {order.client_phone && (
                        <div className="space-y-1">
                          <p className="text-night-foreground/60">Téléphone</p>
                          <p className="text-blue-400 font-medium">{order.client_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {/* Quick Actions */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <>
                        {order.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'paid', order.client_name);
                            }}
                            disabled={updatingStatus === order.id}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-600/50 disabled:to-green-600/50 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                          >
                            {updatingStatus === order.id ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                            ) : (
                              <span>✅</span>
                            )}
                            Payée
                          </button>
                        )}
                        
                        {order.status === 'paid' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'delivered', order.client_name);
                            }}
                            disabled={updatingStatus === order.id}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-600/50 disabled:to-blue-600/50 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                          >
                            {updatingStatus === order.id ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                            ) : (
                              <span>🚚</span>
                            )}
                            Livrée
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* WhatsApp Reminder */}
                    {order.client_phone && order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendWhatsAppReminder(order);
                        }}
                        className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                        title="Envoyer un rappel WhatsApp"
                      >
                        📱 Rappel
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openOrderModal(order);
                      }}
                      className="bg-night-foreground/20 hover:bg-night-foreground/30 text-night-foreground border border-night-foreground/30 px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Order Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-bold text-white tracking-tight">
                Détails de la commande
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-night-foreground/70 hover:text-night-foreground transition-colors p-2 hover:bg-night-foreground/10 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Client Info */}
              <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-2xl p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-3 text-blue-400">
                  <div className="w-8 h-8 bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  Informations client
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedOrder.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-lg">{selectedOrder.client_name}</p>
                      {selectedOrder.client_phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-night-foreground/70">{selectedOrder.client_phone}</span>
                          <button
                            onClick={() => sendWhatsAppReminder(selectedOrder)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                          >
                            📱 WhatsApp
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-2xl p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-3 text-green-400">
                  <div className="w-8 h-8 bg-green-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
                    </svg>
                  </div>
                  Produit commandé
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-night-foreground/60 text-sm mb-1">Nom du produit</p>
                    <p className="text-white font-semibold">{selectedOrder.product_name}</p>
                  </div>
                  <div>
                    <p className="text-night-foreground/60 text-sm mb-1">Quantité</p>
                    <p className="text-white font-semibold">{selectedOrder.quantity}</p>
                  </div>
                  <div>
                    <p className="text-night-foreground/60 text-sm mb-1">Prix unitaire</p>
                    <p className="text-white font-semibold">{selectedOrder.unit_price.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-night-foreground/60 text-sm mb-1">Total</p>
                    <p className="text-green-400 font-bold text-xl">{selectedOrder.total_amount.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </div>

              {/* Status & Dates */}
              <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-2xl p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-3 text-purple-400">
                  <div className="w-8 h-8 bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 6v2m0 0h2m-2 0H7"></path>
                    </svg>
                  </div>
                  Statut et dates
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-night-foreground/60">Statut actuel:</span>
                    <div className={`px-4 py-2 rounded-xl border font-medium ${statusConfig[selectedOrder.status].bg}`}>
                      <span className={statusConfig[selectedOrder.status].color}>
                        {statusConfig[selectedOrder.status].label}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-night-foreground/60">Créée le</p>
                      <p className="text-white font-medium">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-night-foreground/60">Modifiée le</p>
                      <p className="text-white font-medium">{formatDate(selectedOrder.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-2xl p-6">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-3 text-yellow-400">
                    <div className="w-8 h-8 bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </div>
                    Notes
                  </h4>
                  <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-xl p-4">
                    <p className="whitespace-pre-wrap text-white leading-relaxed">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Payment Proof */}
              {selectedOrder.signedProofUrl && (
                <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-2xl p-6">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-3 text-green-400">
                    <div className="w-8 h-8 bg-green-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                      </svg>
                    </div>
                    Preuve de paiement
                  </h4>
                  <div className="border border-night-foreground/20 rounded-xl overflow-hidden">
                    <img
                      src={selectedOrder.signedProofUrl}
                      alt="Preuve de paiement"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-night-foreground/20">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'paid', selectedOrder.client_name);
                      setShowOrderModal(false);
                    }}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <span>✅</span>
                    Marquer comme payée
                  </button>
                )}
                
                {selectedOrder.status === 'paid' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'delivered', selectedOrder.client_name);
                      setShowOrderModal(false);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <span>🚚</span>
                    Marquer comme livrée
                  </button>
                )}
                
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => {
                      toast.warning('Annulation de commande', 'Confirmez pour annuler cette commande');
                      setTimeout(() => updateOrderStatus(selectedOrder.id, 'cancelled', selectedOrder.client_name), 1000);
                      setShowOrderModal(false);
                    }}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <span>❌</span>
                    Annuler la commande
                  </button>
                )}
                
                <button
                  onClick={() => {
                    toast.warning('Suppression de commande', 'Cette action supprimera définitivement la commande');
                    setTimeout(() => setShowDeleteConfirm(selectedOrder.id), 1000);
                  }}
                  className="bg-night-foreground/20 hover:bg-night-foreground/30 text-night-foreground border border-night-foreground/30 py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-red-800/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-red-400">Confirmer la suppression</h3>
            </div>
            
            <div className="mb-8">
              <p className="text-night-foreground/80 mb-4 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer la commande de <strong className="text-white">"{selectedOrder.client_name}"</strong> ?
              </p>
              <div className="bg-red-900/10 border border-red-800/50 rounded-xl p-4">
                <p className="text-sm text-red-300 mb-3 font-medium">
                  ⚠️ Cette action est <strong>irréversible</strong> et supprimera :
                </p>
                <ul className="text-sm text-red-300/80 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                    Les détails de la commande
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                    Les preuves de paiement associées
                  </li>
                                   <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                    L'historique complet
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground py-4 px-6 rounded-xl border border-night-foreground/20 transition-all duration-200 font-bold hover:scale-105"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteOrder(showDeleteConfirm, selectedOrder.client_name)}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 px-6 rounded-xl transition-all duration-300 font-bold hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Oui, supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}