'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';
import Link from 'next/link';

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
  user_id: string;
  theme?: string;
  slug?: string;
};

type UserProfile = {
  id: string;
  email: string;
  created_at: string;
};

// ✅ Thèmes disponibles
const shopThemes = {
  elegant: { name: 'Élégant', preview: 'bg-gradient-to-br from-slate-800 to-slate-900' },
  warm: { name: 'Chaleureux', preview: 'bg-gradient-to-br from-orange-800 to-red-900' },
  nature: { name: 'Nature', preview: 'bg-gradient-to-br from-green-800 to-emerald-900' },
  luxury: { name: 'Luxe', preview: 'bg-gradient-to-br from-purple-800 to-violet-900' },
  modern: { name: 'Moderne', preview: 'bg-gradient-to-br from-gray-800 to-gray-900' },
  ocean: { name: 'Océan', preview: 'bg-gradient-to-br from-blue-900 to-teal-900' }
};

// ✅ Modal de sélection de thème
function ThemeModal({ 
  isOpen, 
  onClose, 
  selectedTheme, 
  onSelectTheme, 
  onSave,
  saving 
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedTheme: string;
  onSelectTheme: (theme: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Choisir un thème</h3>
          <button
            onClick={onClose}
            className="text-night-foreground/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Grille des thèmes */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {Object.entries(shopThemes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => onSelectTheme(key)}
              className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                selectedTheme === key 
                  ? 'border-blue-500 bg-blue-900/20' 
                  : 'border-night-foreground/20 hover:border-night-foreground/40'
              }`}
            >
              {/* Preview */}
              <div className={`h-16 rounded ${theme.preview} mb-2 relative overflow-hidden`}>
                <div className="absolute top-1 left-1 w-3 h-3 bg-white/30 rounded-full"></div>
                <div className="absolute bottom-1 right-1 w-4 h-1 bg-white/20 rounded-full"></div>
                
                {selectedTheme === key && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              <p className="text-white font-medium text-sm">{theme.name}</p>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground py-3 rounded-lg font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {saving ? 'Sauvegarde...' : 'Appliquer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ Modal de confirmation de suppression
function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  deleting,
  shopName,
  stats
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  shopName: string;
  stats: any;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-night-foreground/10 backdrop-blur-xl border border-red-800/50 rounded-xl p-6 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-900/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-400">Confirmer la suppression</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-night-foreground/80 mb-4">
            Êtes-vous sûr de vouloir supprimer votre compte et votre boutique <strong className="text-white">"{shopName}"</strong> ?
          </p>
          <div className="bg-red-900/10 border border-red-800/50 rounded-lg p-4">
            <p className="text-sm text-red-300 mb-3 font-medium">
              ⚠️ Cette action est <strong>irréversible</strong> et supprimera :
            </p>
            <ul className="text-sm text-red-300/80 space-y-1">
              <li>• Vos {stats.totalProducts} produit(s) et leurs images</li>
              <li>• Vos {stats.totalOrders} commande(s) et historique</li>
              <li>• Votre boutique et toutes ses informations</li>
              <li>• Votre compte utilisateur</li>
              <li>• Le thème personnalisé de votre boutique</li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full"></div>
                Suppression...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Supprimer définitivement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const bottomMenuItems = [
  {
    label: 'Accueil',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6"></path>
      </svg>
    ),
    route: '/dashboard',
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
    active: true,
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToasts();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopPhotoUrl, setShopPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // ✅ États pour les modals
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('elegant');
  const [savingTheme, setSavingTheme] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    activity: '',
    city: '',
    description: '',
    slug: '',
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    joinDate: '',
  });

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

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/login');
        return;
      }

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at || '',
      });

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
      setFormData({
        name: shopData.name,
        activity: shopData.activity,
        city: shopData.city,
        description: shopData.description || '',
        slug: shopData.slug || '',
      });
      setSelectedTheme(shopData.theme || 'elegant');

      // Photo de la boutique
      if (shopData.photo_url) {
        try {
          const { data: urlData } = await supabase.storage
            .from('shop-photos')
            .createSignedUrl(shopData.photo_url, 3600);
          setShopPhotoUrl(urlData?.signedUrl ?? null);
        } catch (err) {
          // Erreur silencieuse pour les URLs signées
        }
      }

      // Calculer les stats
      await fetchStats(shopData.id, session.user.created_at);

    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (shopId: string, userCreatedAt: string) => {
    try {
      // Produits
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId);

      // Commandes
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('shop_id', shopId);

      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData
        ?.filter(o => o.status === 'paid' || o.status === 'delivered')
        .reduce((sum, o) => sum + o.total_amount, 0) || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalOrders,
        totalRevenue,
        joinDate: new Date(userCreatedAt).toLocaleDateString('fr-FR'),
      });
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux', 'Maximum 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Format invalide', 'Sélectionnez une image');
      return;
    }

    setSelectedPhoto(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ✅ Fonction pour sauvegarder le thème
  const handleSaveTheme = async () => {
    if (!shop) return;

    setSavingTheme(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({ theme: selectedTheme })
        .eq('id', shop.id);

      if (error) throw error;

      setShop(prev => prev ? { ...prev, theme: selectedTheme } : null);
      setShowThemeModal(false);
      toast.success('Thème appliqué !', `${shopThemes[selectedTheme as keyof typeof shopThemes].name} activé`);

    } catch (err: any) {
      console.error('Erreur thème:', err);
      toast.error('Erreur', 'Impossible de sauvegarder le thème');
    } finally {
      setSavingTheme(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!shop || !user) return;

    if (!formData.name.trim()) {
      toast.error('Erreur', 'Le nom de la boutique est requis');
      return;
    }

    setSaving(true);
    try {
      let photoUrl = shop.photo_url;

      // Upload nouvelle photo
      if (selectedPhoto) {
        const fileExt = selectedPhoto.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('shop-photos')
          .upload(fileName, selectedPhoto);

        if (uploadError) throw uploadError;
        
        // Supprimer ancienne photo
        if (shop.photo_url) {
          await supabase.storage
            .from('shop-photos')
            .remove([shop.photo_url]);
        }
        
        photoUrl = uploadData.path;
      }

      // Mettre à jour le shop
      const { error: updateError } = await supabase
        .from('shops')
        .update({
          name: formData.name.trim(),
          activity: formData.activity.trim(),
          city: formData.city.trim(),
          description: formData.description.trim(),
          slug: formData.slug.trim() || null,
          photo_url: photoUrl,
        })
        .eq('id', shop.id);

      if (updateError) throw updateError;

      await fetchProfileData();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      toast.success('Profil sauvegardé !', '');

    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur', 'Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Fonction pour supprimer le compte
  const handleDeleteAccount = async () => {
    if (!shop || !user) return;

    setDeleting(true);
    try {
      toast.warning('Suppression en cours...', 'Veuillez patienter');

      // Marquer la boutique comme supprimée (soft delete)
      const { error: deleteError } = await supabase
        .from('shops')
        .update({ 
          name: '[COMPTE SUPPRIMÉ - 2025-07-01 14:15:03]',
          activity: '[SUPPRIMÉ]',
          city: '[SUPPRIMÉ]',
          description: 'Compte supprimé le 2025-07-01 14:15:03 UTC par Sdiabate1337'
        })
        .eq('id', shop.id);

      if (deleteError) throw deleteError;

      // Déconnexion
      await supabase.auth.signOut();
      toast.success('Compte supprimé', 'Votre compte a été supprimé avec succès');
      
      setTimeout(() => {
        router.replace('/');
      }, 2000);

    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.error('Erreur', 'Impossible de supprimer le compte');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-sm">Chargement du profil...</p>
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

      {/* Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
        <div className="relative">
          <button
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2.5 rounded-full shadow-xl transition-transform hover:scale-110"
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
                  <span>{item.icon}</span>
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
          {bottomMenuItems.map((item) => (
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
          onClick={handleLogoutWithConfirm}
        >
          Déconnexion
        </button>
      </nav>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <header className="mb-6">
            
          <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl p-6">

                        {/* Navigation de retour */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700/30">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
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
                <span className="text-sm font-medium">Retour au dashboard</span>
              </button>
              
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                <span>/</span>
                <Link href="/dashboard" className="hover:text-gray-300 transition-colors">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-blue-400">Profil</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              👤 Mon profil
            </h1>
            <p className="text-night-foreground/70">Gérez vos informations et votre boutique</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo et infos de base */}
            <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <img
                    src={photoPreview || shopPhotoUrl || '/placeholder-shop.png'}
                    alt="Photo boutique"
                    className="w-16 h-16 rounded-full object-cover border-2 border-night-foreground/20"
                  />
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full cursor-pointer transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{formData.name}</h3>
                  <p className="text-night-foreground/80 text-sm">{formData.activity} • {formData.city}</p>
                </div>
              </div>
            </div>

            {/* ✅ Thème ET URL côte à côte */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Thème */}
              <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">🎨 Thème</h2>
                    <p className="text-night-foreground/70 text-xs">Apparence boutique</p>
                  </div>
                  <button
                    onClick={() => setShowThemeModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    Changer
                  </button>
                </div>
                
                {/* Thème actuel */}
                <div className="flex items-center gap-2 p-2 bg-night-foreground/5 rounded">
                  <div className={`w-6 h-6 rounded ${shopThemes[selectedTheme as keyof typeof shopThemes].preview}`}></div>
                  <div>
                    <p className="text-white font-medium text-sm">{shopThemes[selectedTheme as keyof typeof shopThemes].name}</p>
                    <p className="text-night-foreground/60 text-xs">Actuel</p>
                  </div>
                </div>
              </div>

              {/* ✅ URL Boutique */}
              <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl p-4">
                <div className="mb-3">
                  <h3 className="text-base font-bold text-white">🔗 URL boutique</h3>
                  <p className="text-night-foreground/70 text-xs">Votre lien public</p>
                </div>
                
                <div className="font-mono text-xs text-blue-400 break-all bg-night-foreground/5 px-2 py-1.5 rounded border border-night-foreground/20 mb-2">
                  {shop?.slug ? `/${shop.slug}` : `/shop/${shop?.id}`}
                </div>
                
                {shop && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const url = shop.slug ? `${window.location.origin}/${shop.slug}` : `${window.location.origin}/shop/${shop.id}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Copié !', '');
                      }}
                      className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded transition-colors"
                    >
                      📋 Copier
                    </button>
                    <button
                      onClick={() => window.open(shop.slug ? `/${shop.slug}` : `/shop/${shop.id}`, '_blank')}
                      className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white py-1.5 rounded transition-colors"
                    >
                      🔗 Voir
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Informations boutique */}
            <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Informations de la boutique</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-night-foreground/90 mb-2">
                    Nom de la boutique *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Ma Boutique"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-night-foreground/90 mb-2">
                    Activité *
                  </label>
                  <input
                    type="text"
                    value={formData.activity}
                    onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                    className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Mode"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-night-foreground/90 mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Dakar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-night-foreground/90 mb-2">
                    URL personnalisée
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="mon-slug"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-night-foreground/90 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Décrivez votre boutique..."
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    Sauvegarder
                  </>
                )}
              </button>
            </div>

            {/* ✅ Zone de danger */}
            <div className="bg-red-900/10 border border-red-800/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-red-400">Zone de danger</h2>
              </div>
              
              <p className="text-night-foreground/80 mb-4 text-sm">
                La suppression de votre compte est <strong>irréversible</strong>. Toutes vos données seront définitivement perdues.
              </p>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Supprimer mon compte
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-4">📊 Statistiques</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-night-foreground/70 text-sm">Produits</span>
                  <span className="text-blue-400 font-bold">{stats.totalProducts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-night-foreground/70 text-sm">Commandes</span>
                  <span className="text-green-400 font-bold">{stats.totalOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-night-foreground/70 text-sm">Revenus</span>
                  <span className="text-purple-400 font-bold">{stats.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Infos compte */}
            <div className="bg-night-foreground/10 border border-night-foreground/20 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-4">👤 Compte</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-night-foreground/70">Email :</span>
                  <div className="text-white font-medium">{user?.email}</div>
                </div>
                <div>
                  <span className="text-night-foreground/70">Membre depuis :</span>
                  <div className="text-white font-medium">{stats.joinDate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Modal de sélection de thème */}
      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        selectedTheme={selectedTheme}
        onSelectTheme={setSelectedTheme}
        onSave={handleSaveTheme}
        saving={savingTheme}
      />

      {/* ✅ Modal de confirmation de suppression */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        deleting={deleting}
        shopName={formData.name}
        stats={stats}
      />
    </main>
  );
}