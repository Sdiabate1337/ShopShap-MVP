'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast'; // ✅ Hook unifié

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

const statusConfig = {
  pending: { label: '⏳ En attente', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800' },
  paid: { label: '✅ Payée', color: 'text-green-400', bg: 'bg-green-900/20 border-green-800' },
  delivered: { label: '🚚 Livrée', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800' },
  cancelled: { label: '❌ Annulée', color: 'text-red-400', bg: 'bg-red-900/20 border-red-800' },
};

export default function OrdersPage() {
  const router = useRouter();
  const toast = useToasts(); // ✅ Hook unifié
  
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
    // Message d'accueil après chargement
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

      // Conseils contextualz
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <span className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mb-4"></span>
        <p>Chargement des commandes…</p>
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
            className="bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground rounded px-3 py-1 transition-colors"
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
              Mes commandes
            </h1>
            <div className="flex gap-4 text-sm text-night-foreground/70">
              <span>Total: <strong className="text-white">{stats.total}</strong></span>
              <span>En attente: <strong className="text-yellow-400">{stats.pending}</strong></span>
              <span>Revenus du mois: <strong className="text-green-400">{stats.monthRevenue.toLocaleString()} FCFA</strong></span>
            </div>
          </div>
          <button
            onClick={() => {
              toast.info('Nouvelle commande', 'Ajoutez une commande pour vos clients');
              setTimeout(() => router.push('/orders/add'), 500);
            }}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Nouvelle commande
          </button>
        </div>

        {/* Stats cards avec animations */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 hover:bg-yellow-900/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-yellow-400 text-3xl font-bold">{stats.pending}</div>
              <div className="text-yellow-300 text-sm">
                <div className="font-medium">En attente</div>
                <div className="text-xs opacity-70">À traiter</div>
              </div>
            </div>
          </div>
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 hover:bg-green-900/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-green-400 text-3xl font-bold">{stats.paid}</div>
              <div className="text-green-300 text-sm">
                <div className="font-medium">Payées</div>
                <div className="text-xs opacity-70">À livrer</div>
              </div>
            </div>
          </div>
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 hover:bg-blue-900/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-blue-400 text-3xl font-bold">{stats.delivered}</div>
              <div className="text-blue-300 text-sm">
                <div className="font-medium">Livrées</div>
                <div className="text-xs opacity-70">Terminées</div>
              </div>
            </div>
          </div>
          <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-lg p-4 hover:bg-night-foreground/15 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-night-foreground text-2xl font-bold">{stats.totalRevenue.toLocaleString()}</div>
              <div className="text-night-foreground/70 text-sm">
                <div className="font-medium">FCFA total</div>
                <div className="text-xs opacity-70">Revenus</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-3 w-5 h-5 text-night-foreground/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                type="text"
                placeholder="Rechercher par client, produit ou téléphone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg pl-10 pr-4 py-3 text-night-foreground placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-night-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">⏳ En attente</option>
            <option value="paid">✅ Payées</option>
            <option value="delivered">🚚 Livrées</option>
            <option value="cancelled">❌ Annulées</option>
          </select>
        </div>

        {/* Liste des commandes */}
        {filteredOrders.length === 0 ? (
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-12 text-center">
            {orders.length === 0 ? (
              <div>
                <div className="w-20 h-20 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">Aucune commande pour le moment</h3>
                <p className="text-night-foreground/70 mb-6">
                  Commencez par ajouter votre première commande pour suivre vos ventes
                </p>
                <button
                  onClick={() => {
                    toast.info('Première commande', 'Créez votre première commande pour démarrer');
                    setTimeout(() => router.push('/orders/add'), 500);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  🚀 Ajouter ma première commande
                </button>
              </div>
            ) : (
              <div>
                <svg className="w-16 h-16 text-night-foreground/50 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <p className="text-night-foreground/70">Aucune commande ne correspond à vos critères de recherche.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    toast.info('Filtres réinitialisés', 'Affichage de toutes les commandes');
                  }}
                  className="mt-4 text-blue-400 hover:text-blue-300 underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6 hover:bg-night-foreground/10 transition-colors cursor-pointer transform hover:scale-[1.01] hover:shadow-lg"
                onClick={() => openOrderModal(order)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg text-white">{order.client_name}</h3>
                      <div className={`px-3 py-1 rounded-full text-xs border ${statusConfig[order.status].bg}`}>
                        <span className={statusConfig[order.status].color}>
                          {statusConfig[order.status].label}
                        </span>
                      </div>
                      {order.payment_proof_url && (
                        <div className="bg-green-900/20 px-2 py-1 rounded-full">
                          <span className="text-green-400 text-xs">💳 Preuve</span>
                        </div>
                      )}
                    </div>
                    <div className="text-night-foreground/70 text-sm space-y-1">
                      <p><strong className="text-night-foreground/90">Produit:</strong> {order.product_name} x{order.quantity}</p>
                      <p><strong className="text-night-foreground/90">Total:</strong> <span className="text-green-400 font-semibold">{order.total_amount.toLocaleString()} FCFA</span></p>
                      <p><strong className="text-night-foreground/90">Date:</strong> {formatDate(order.created_at)}</p>
                      {order.client_phone && <p><strong className="text-night-foreground/90">Tél:</strong> {order.client_phone}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Actions rapides selon le statut */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'paid', order.client_name);
                            }}
                            disabled={updatingStatus === order.id}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            {updatingStatus === order.id ? (
                              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
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
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            {updatingStatus === order.id ? (
                              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                            ) : (
                              <span>🚚</span>
                            )}
                            Livrée
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Rappel WhatsApp */}
                    {order.client_phone && order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendWhatsAppReminder(order);
                        }}
                        className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
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
                      className="bg-night-foreground/20 hover:bg-night-foreground/30 text-night-foreground px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal détails commande */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-night border border-night-foreground/20 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Détails de la commande
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-night-foreground/70 hover:text-night-foreground transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations client */}
              <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Client
                </h4>
                <div className="space-y-2">
                  <p><strong>Nom:</strong> {selectedOrder.client_name}</p>
                  {selectedOrder.client_phone && (
                    <p className="flex items-center gap-2">
                      <strong>Téléphone:</strong> 
                      <span>{selectedOrder.client_phone}</span>
                      <button
                        onClick={() => sendWhatsAppReminder(selectedOrder)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        📱 WhatsApp
                      </button>
                    </p>
                  )}
                </div>
              </div>

              {/* Informations produit */}
              <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
                  </svg>
                  Produit commandé
                </h4>
                <div className="space-y-2">
                  <p><strong>Nom:</strong> {selectedOrder.product_name}</p>
                  <p><strong>Quantité:</strong> {selectedOrder.quantity}</p>
                  <p><strong>Prix unitaire:</strong> {selectedOrder.unit_price.toLocaleString()} FCFA</p>
                  <p className="text-lg"><strong>Total:</strong> <span className="text-green-400 font-bold">{selectedOrder.total_amount.toLocaleString()} FCFA</span></p>
                </div>
              </div>

              {/* Statut et dates */}
              <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 6v2m0 0h2m-2 0H7"></path>
                  </svg>
                  Informations
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <strong>Statut:</strong>
                    <div className={`px-3 py-1 rounded-full text-sm border ${statusConfig[selectedOrder.status].bg}`}>
                      <span className={statusConfig[selectedOrder.status].color}>
                        {statusConfig[selectedOrder.status].label}
                      </span>
                    </div>
                  </div>
                  <p><strong>Créée le:</strong> {formatDate(selectedOrder.created_at)}</p>
                  <p><strong>Modifiée le:</strong> {formatDate(selectedOrder.updated_at)}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-yellow-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Notes
                  </h4>
                  <p className="whitespace-pre-wrap bg-night-foreground/5 p-3 rounded border">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Preuve de paiement */}
              {selectedOrder.signedProofUrl && (
                <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                    </svg>
                    Preuve de paiement
                  </h4>
                  <img
                    src={selectedOrder.signedProofUrl}
                    alt="Preuve de paiement"
                    className="max-w-full h-auto rounded-lg border border-night-foreground/20 shadow-lg"
                  />
                </div>
              )}

              {/* Actions rapides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-night-foreground/20">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'paid', selectedOrder.client_name);
                      setShowOrderModal(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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
                    className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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
                  className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {showDeleteConfirm && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-night border border-red-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-400">Confirmer la suppression</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-night-foreground/80 mb-3">
                Êtes-vous sûr de vouloir supprimer la commande de <strong>"{selectedOrder.client_name}"</strong> ?
              </p>
              <div className="bg-red-900/10 border border-red-800/50 rounded-lg p-3">
                <p className="text-sm text-red-300 mb-2">
                  ⚠️ Cette action est <strong>irréversible</strong> et supprimera :
                </p>
                <ul className="text-sm text-red-300/80 space-y-1">
                  <li>• Les détails de la commande</li>
                  <li>• Les preuves de paiement associées</li>
                  <li>• L'historique complet</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground py-3 px-4 rounded-lg border border-night-foreground/20 transition-colors font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteOrder(showDeleteConfirm, selectedOrder.client_name)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
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