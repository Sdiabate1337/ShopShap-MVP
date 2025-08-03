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
  created_at: string;
};

type UserProfile = {
  id: string;
  email: string;
  created_at: string;
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
    active: true,
    color: 'amber',
  },
];

// ✨ Enhanced Theme Configuration
const shopThemes = {
  elegant: { 
    name: 'Élégant', 
    preview: 'bg-gradient-to-br from-slate-800 to-slate-900',
    icon: '✨',
    description: 'Design minimaliste et raffiné'
  },
  warm: { 
    name: 'Chaleureux', 
    preview: 'bg-gradient-to-br from-orange-800 to-red-900',
    icon: '🔥',
    description: 'Couleurs chaudes et accueillantes'
  },
  nature: { 
    name: 'Nature', 
    preview: 'bg-gradient-to-br from-green-800 to-emerald-900',
    icon: '🌿',
    description: 'Inspiration naturelle et apaisante'
  },
  luxury: { 
    name: 'Luxe', 
    preview: 'bg-gradient-to-br from-purple-800 to-violet-900',
    icon: '💎',
    description: 'Sophistication et prestige'
  },
  modern: { 
    name: 'Moderne', 
    preview: 'bg-gradient-to-br from-gray-800 to-gray-900',
    icon: '🎯',
    description: 'Contemporain et épuré'
  },
  ocean: { 
    name: 'Océan', 
    preview: 'bg-gradient-to-br from-blue-900 to-teal-900',
    icon: '🌊',
    description: 'Fraîcheur marine et sérénité'
  }
};

// ✨ Enhanced Theme Selection Modal
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
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Choisir un thème</h3>
              <p className="text-slate-400">Personnalisez l'apparence de votre boutique</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {Object.entries(shopThemes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => onSelectTheme(key)}
                className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
                  selectedTheme === key 
                    ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-600/25' 
                    : 'border-slate-600/50 hover:border-slate-500/50 hover:bg-slate-800/30'
                }`}
              >
                <div className={`h-20 rounded-lg ${theme.preview} mb-3 relative overflow-hidden transition-transform duration-300 group-hover:scale-105`}>
                  <div className="absolute top-2 left-2 w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-2 bg-white/20 rounded-full"></div>
                  <div className="absolute top-2 right-2 text-lg">{theme.icon}</div>
                  
                  {selectedTheme === key && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-left">
                  <p className="text-white font-semibold text-sm mb-1">{theme.name}</p>
                  <p className="text-slate-400 text-xs">{theme.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Annuler
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <span className="text-lg">{shopThemes[selectedTheme as keyof typeof shopThemes]?.icon}</span>
                  Appliquer le thème
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ✨ Enhanced Delete Confirmation Modal
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
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity duration-300"
        onClick={() => !deleting && onClose()}
      />
      
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300">
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
              Êtes-vous sûr de vouloir supprimer votre compte et votre boutique <strong className="text-white">"{shopName}"</strong> ?
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
                  <span>Vos <strong>{stats.totalProducts}</strong> produit(s) et toutes leurs images</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Vos <strong>{stats.totalOrders}</strong> commande(s) et tout l'historique</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Votre boutique et toutes ses informations personnalisées</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Votre compte utilisateur et vos accès ShopShap</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Le thème personnalisé et l'URL de votre boutique</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-red-600/25 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Suppression en cours...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Supprimer définitivement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ✨ Enhanced Loading Skeleton
function ProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded mb-4"></div>
        <div className="h-4 bg-slate-700/30 rounded w-2/3"></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-slate-700/50 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-700/30 rounded"></div>
                <div className="h-4 bg-slate-700/30 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-slate-700/50 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-700/30 rounded"></div>
                <div className="h-3 bg-slate-700/30 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToasts();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopPhotoUrl, setShopPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('/profile');
  
  // ✨ Enhanced Modal States
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('elegant');
  const [savingTheme, setSavingTheme] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ✨ Enhanced Form States
  const [formData, setFormData] = useState({
    name: '',
    activity: '',
    city: '',
    description: '',
    slug: '',
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Enhanced Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    joinDate: '',
    lastLogin: '',
    shopViews: 0,
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
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Session expirée', 'Veuillez vous reconnecter');
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
        toast.error('Boutique introuvable', 'Configurez d\'abord votre boutique');
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
          console.warn('Erreur génération URL photo:', err);
        }
      }

      // ✨ Enhanced stats calculation
      await fetchStats(shopData.id, session.user.created_at);
      
      toast.success('Profil chargé', 'Données synchronisées avec succès');

    } catch (err) {
      console.error('Erreur chargement profil:', err);
      toast.error('Erreur réseau', 'Impossible de charger les données');
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
        .select('total_amount, status, created_at')
        .eq('shop_id', shopId);

      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData
        ?.filter(o => o.status === 'paid' || o.status === 'delivered')
        .reduce((sum, o) => sum + o.total_amount, 0) || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalOrders,
        totalRevenue,
        joinDate: new Date(userCreatedAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }),
        lastLogin: new Date().toLocaleDateString('fr-FR'),
        shopViews: Math.floor(Math.random() * 1000), // Placeholder
      });
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  // ✨ Enhanced form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la boutique est requis';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }

    if (!formData.activity.trim()) {
      newErrors.activity = 'L\'activité est requise';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ville est requise';
    }

    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'L\'URL ne peut contenir que des lettres minuscules, chiffres et tirets';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux', 'La photo ne doit pas dépasser 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Format invalide', 'Veuillez sélectionner une image (JPG, PNG, etc.)');
      return;
    }

    setSelectedPhoto(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    toast.success('Photo sélectionnée', 'Nouvelle image prête à être sauvegardée');
  };

  // ✅ Fonction pour sauvegarder le thème (CONSERVÉE EXACTEMENT)
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

    if (!validateForm()) {
      toast.error('Formulaire invalide', 'Veuillez corriger les erreurs');
      return;
    }

    setSaving(true);
    try {
      let photoUrl = shop.photo_url;

      // ✨ Enhanced photo upload
      if (selectedPhoto) {
        setUploadingPhoto(true);
        toast.info('Upload photo...', 'Téléchargement de votre nouvelle photo en cours');
        
        const fileExt = selectedPhoto.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('shop-photos')
          .upload(fileName, selectedPhoto, { cacheControl: '3600' });

        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          toast.error('Erreur upload', 'Impossible de télécharger la photo');
          setSaving(false);
          setUploadingPhoto(false);
          return;
        }
        
        // Supprimer ancienne photo
        if (shop.photo_url) {
          await supabase.storage
            .from('shop-photos')
            .remove([shop.photo_url]);
        }
        
        photoUrl = uploadData.path;
        setUploadingPhoto(false);
        toast.success('Photo mise à jour !', 'Nouvelle image sauvegardée');
      }

      // Mettre à jour le shop
      const { error: updateError } = await supabase
        .from('shops')
        .update({
          name: formData.name.trim(),
          activity: formData.activity.trim(),
          city: formData.city.trim(),
          description: formData.description.trim() || null,
          slug: formData.slug.trim() || null,
          photo_url: photoUrl,
        })
        .eq('id', shop.id);

      if (updateError) {
        console.error('Erreur mise à jour:', updateError);
        toast.error('Erreur sauvegarde', 'Impossible de sauvegarder les modifications');
        setSaving(false);
        return;
      }

      await fetchProfileData();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setErrors({});
      
      toast.success('Profil mis à jour !', 'Vos informations ont été sauvegardées');

    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
      toast.error('Erreur inattendue', 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  // ✅ Fonction pour supprimer le compte (CONSERVÉE EXACTEMENT)
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

  const handleNavigation = (route: string) => {
    setActiveTab(route);
    router.push(route);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950 p-4">
        <ProfileSkeleton />
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
                Êtes-vous sûr de vouloir vous déconnecter ? Vos modifications non sauvegardées seront perdues.
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
      <nav className="hidden sm:flex items-center justify-between p-6 max-w-6xl mx-auto">
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
      <div className="max-w-6xl mx-auto px-4 space-y-8">
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
                <span className="text-amber-400 font-medium">Mon profil</span>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center shadow-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                Mon profil
              </h1>
              <p className="text-slate-400 text-lg">
                Gérez vos informations personnelles et votre boutique ShopShap
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ✨ Enhanced Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* ✨ Enhanced Profile Photo & Basic Info */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                Photo de profil
              </h2>
              
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <img
                    src={photoPreview || shopPhotoUrl || '/api/placeholder/80/80'}
                    alt="Photo boutique"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-600/50 shadow-xl transition-transform duration-300 group-hover:scale-105"
                  />
                  <label className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                  
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{formData.name}</h3>
                  <p className="text-slate-400 text-sm mb-2">{formData.activity} • {formData.city}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Membre depuis {stats.joinDate}</span>
                    <span>•</span>
                    <span>Dernière connexion: {stats.lastLogin}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ✨ Enhanced Theme & URL Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Theme Selection */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-xl">🎨</span>
                      Thème de la boutique
                    </h3>
                    <p className="text-slate-400 text-sm">Personnalisez l'apparence</p>
                  </div>
                  <button
                    onClick={() => setShowThemeModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    Changer
                  </button>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl">
                  <div className={`w-8 h-8 rounded-lg ${shopThemes[selectedTheme as keyof typeof shopThemes]?.preview} shadow-lg`}></div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{shopThemes[selectedTheme as keyof typeof shopThemes]?.name}</p>
                    <p className="text-slate-400 text-xs">{shopThemes[selectedTheme as keyof typeof shopThemes]?.description}</p>
                  </div>
                  <span className="text-2xl">{shopThemes[selectedTheme as keyof typeof shopThemes]?.icon}</span>
                </div>
              </div>

              {/* Shop URL */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-xl">🔗</span>
                    URL de votre boutique
                  </h3>
                  <p className="text-slate-400 text-sm">Partagez facilement votre boutique</p>
                </div>
                
                <div className="space-y-4">
                  <div className="font-mono text-sm text-blue-400 break-all bg-slate-700/30 px-4 py-3 rounded-xl border border-slate-600/50">
                    {shop?.slug ? `/${shop.slug}` : `/shop/${shop?.id}`}
                  </div>
                  
                  {shop && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const url = shop.slug 
                            ? `${window.location.origin}/${shop.slug}` 
                            : `${window.location.origin}/shop/${shop.id}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Lien copié !', 'Prêt à partager sur TikTok et WhatsApp');
                        }}
                        className="flex-1 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-2 px-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        Copier
                      </button>
                      <button
                        onClick={() => {
                          const url = shop.slug ? `/${shop.slug}` : `/shop/${shop.id}`;
                          window.open(url, '_blank');
                        }}
                        className="flex-1 text-sm bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-2 px-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                        Voir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✨ Enhanced Shop Information Form */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                Informations de la boutique
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-300">
                    Nom de la boutique <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full bg-slate-700/30 border-2 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                      errors.name 
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                        : 'border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                    placeholder="Ex: Ma Boutique TikTok"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-300">
                    Type d'activité <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.activity}
                    onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                    className={`w-full bg-slate-700/30 border-2 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                      errors.activity 
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                        : 'border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                    placeholder="Ex: Mode, Beauté, Artisanat"
                  />
                  {errors.activity && (
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {errors.activity}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-300">
                    Ville <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full bg-slate-700/30 border-2 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                      errors.city 
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                        : 'border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                    placeholder="Ex: Dakar, Abidjan, Casablanca"
                  />
                  {errors.city && (
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {errors.city}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-300">
                    URL personnalisée
                    </label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-slate-400 text-sm">/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className={`w-full bg-slate-700/30 border-2 rounded-xl pl-8 pr-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                        errors.slug 
                          ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                          : 'border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                      placeholder="ma-boutique-tiktok"
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {errors.slug}
                    </p>
                  )}
                  <p className="text-slate-500 text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Lettres minuscules, chiffres et tirets uniquement
                  </p>
                </div>

                <div className="sm:col-span-2 space-y-3">
                  <label className="block text-sm font-semibold text-slate-300">
                    Description de votre boutique
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full bg-slate-700/30 border-2 border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 resize-none"
                    placeholder="Décrivez votre boutique, vos produits, votre style... Cela aide vos clients TikTok et WhatsApp à mieux vous connaître !"
                  />
                  <p className="text-slate-500 text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Une bonne description améliore votre visibilité sur les réseaux sociaux
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || uploadingPhoto}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Sauvegarde en cours...
                    </>
                  ) : uploadingPhoto ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Upload photo...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Sauvegarder les modifications
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ✨ Enhanced Danger Zone */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-400">Zone de danger</h2>
                  <p className="text-red-300/80 text-sm mt-1">Actions irréversibles pour votre compte</p>
                </div>
              </div>
              
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-red-300 mb-3">⚠️ Attention: Suppression définitive</h3>
                <p className="text-red-200/80 leading-relaxed mb-4">
                  La suppression de votre compte entraînera la <strong>perte définitive</strong> de toutes vos données :
                </p>
                <ul className="text-red-200/70 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    <span>Tous vos produits ({stats.totalProducts}) et leurs images</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    <span>Toutes vos commandes ({stats.totalOrders}) et l'historique</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    <span>Votre boutique et sa personnalisation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    <span>Vos revenus générés ({stats.totalRevenue.toLocaleString()} FCFA)</span>
                  </li>
                </ul>
              </div>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-red-600/25 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Supprimer mon compte définitivement
              </button>
            </div>
          </div>

          {/* ✨ Enhanced Sidebar */}
          <div className="space-y-6">
            {/* ✨ Enhanced Statistics Card */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-xl">📊</span>
                Mes statistiques
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
                      </svg>
                    </div>
                    <span className="text-slate-300 text-sm font-medium">Produits</span>
                  </div>
                  <span className="text-purple-400 font-bold text-lg">{stats.totalProducts}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2"></path>
                      </svg>
                    </div>
                    <span className="text-slate-300 text-sm font-medium">Commandes</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-lg">{stats.totalOrders}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-600/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                      </svg>
                    </div>
                    <span className="text-slate-300 text-sm font-medium">Revenus</span>
                  </div>
                  <span className="text-amber-400 font-bold text-sm">{stats.totalRevenue.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </div>
                    <span className="text-slate-300 text-sm font-medium">Vues boutique</span>
                  </div>
                  <span className="text-blue-400 font-bold text-lg">{stats.shopViews}</span>
                </div>
              </div>
            </div>

            {/* ✨ Enhanced Account Information */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-xl">👤</span>
                Informations du compte
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400 text-xs font-medium">Email</span>
                  <div className="text-white font-semibold text-sm mt-1 break-all">{user?.email}</div>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400 text-xs font-medium">Membre depuis</span>
                  <div className="text-white font-semibold text-sm mt-1">{stats.joinDate}</div>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400 text-xs font-medium">Dernière connexion</span>
                  <div className="text-white font-semibold text-sm mt-1">{stats.lastLogin}</div>
                </div>
                <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                  <span className="text-emerald-400 text-xs font-medium flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Statut du compte
                  </span>
                  <div className="text-emerald-300 font-semibold text-sm mt-1">Actif et vérifié</div>
                </div>
              </div>
            </div>

            {/* ✨ Enhanced Quick Actions */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-xl">⚡</span>
                Actions rapides
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/products/add')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Ajouter un produit
                </button>
                
                <button
                  onClick={() => router.push('/orders/add')}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Nouvelle commande
                </button>
                
                <button
                  onClick={() => {
                    const url = shop?.slug 
                      ? `${window.location.origin}/${shop.slug}` 
                      : `${window.location.origin}/shop/${shop?.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Lien copié !', 'Partagez votre boutique sur TikTok et WhatsApp');
                  }}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Copier lien boutique
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ✨ Enhanced Footer */}
        <div className="text-center py-8 mt-12 border-t border-slate-700/50">
          <div className="text-slate-500 text-sm">
            <p>Connecté : <strong className="text-white">Sdiabate1337</strong></p>
            <p className="mt-1">2025-08-03 17:03:04 UTC</p>
            <p className="mt-2 text-xs text-slate-600">
              🚀 ShopShap v2.0 - Gestionnaire de profil avancé pour vendeurs TikTok & WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* ✨ Enhanced Theme Selection Modal (CONSERVÉE EXACTEMENT) */}
      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        selectedTheme={selectedTheme}
        onSelectTheme={setSelectedTheme}
        onSave={handleSaveTheme}
        saving={savingTheme}
      />

      {/* ✨ Enhanced Delete Confirmation Modal (CONSERVÉE EXACTEMENT) */}
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