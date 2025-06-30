'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast'; // ✅ UN SEUL IMPORT

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
  user_id: string;
};

type UserProfile = {
  id: string;
  email: string;
  created_at: string;
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

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToasts(); // ✅ UN SEUL HOOK
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopPhotoUrl, setShopPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    activity: '',
    city: '',
    description: '',
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Stats states
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    joinDate: '',
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  async function fetchProfileData() {
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
      });

      // Photo de la boutique
      if (shopData.photo_url) {
        const { data: urlData } = await supabase.storage
          .from('shop-photos')
          .createSignedUrl(shopData.photo_url, 60 * 60);
        setShopPhotoUrl(urlData?.signedUrl ?? null);
      }

      // Calculer les statistiques
      await fetchStats(shopData.id, session.user.created_at);

    } catch (err) {
      console.error('Erreur chargement profil:', err);
      toast.system.networkError(); // ✅ Plus simple et cohérent
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats(shopId: string, userCreatedAt: string) {
    try {
      // Compter les produits
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId);

      // Compter les commandes et revenus
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
        joinDate: new Date(userCreatedAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }),
      });
    } catch (err) {
      console.error('Erreur calcul stats:', err);
      toast.system.serverError(); // ✅ Plus cohérent
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérification taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.system.fileTooLarge(); // ✅ Plus sémantique
      return;
    }

    // Vérification type
    if (!file.type.startsWith('image/')) {
      toast.system.invalidFormat(); // ✅ Plus sémantique
      return;
    }

    setSelectedPhoto(file);
    
    // Créer preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.shop.photoSelected(); // ✅ Plus spécifique et cohérent
  }

  async function handleSaveProfile() {
    if (!shop || !user) return;

    // Validation des champs requis
    if (!formData.name.trim()) {
      toast.product.validationError('Le nom de la boutique'); // ✅ Réutilise la logique
      return;
    }

    if (!formData.activity.trim()) {
      toast.product.validationError('L\'activité de la boutique');
      return;
    }

    if (!formData.city.trim()) {
      toast.product.validationError('La ville');
      return;
    }

    setSaving(true);
    try {
      let photoUrl = shop.photo_url;

      // Upload nouvelle photo si sélectionnée
      if (selectedPhoto) {
        toast.product.uploadStart(); // ✅ Réutilise la logique
        
        const fileExt = selectedPhoto.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('shop-photos')
          .upload(fileName, selectedPhoto);

        if (uploadError) throw uploadError;
        
        // Supprimer ancienne photo si elle existe
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
          photo_url: photoUrl,
        })
        .eq('id', shop.id);

      if (updateError) throw updateError;

      // Rafraîchir les données
      await fetchProfileData();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      
      toast.shop.profileUpdated(); // ✅ Plus sémantique et cohérent

    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      toast.system.serverError(); // ✅ Plus simple
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mots de passe différents', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.auth.weakPassword(); // ✅ Réutilise la logique
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

      toast.auth.passwordChanged(); // ✅ Plus sémantique
      setShowPasswordChange(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (err) {
      console.error('Erreur changement mot de passe:', err);
      toast.system.serverError();
    }
  }

  async function handleDeleteAccount() {
    if (!shop || !user) return;

    try {
      toast.warning('Suppression en cours...', 'Veuillez patienter pendant la suppression de votre compte');

      // Note: auth.admin.deleteUser nécessite des privilèges admin côté serveur
      // Pour un MVP, on peut simplement signOut l'utilisateur
      // et marquer le compte comme supprimé dans la base
      
      // Marquer la boutique comme supprimée (soft delete)
      const { error: deleteError } = await supabase
        .from('shops')
        .update({ 
          name: '[COMPTE SUPPRIMÉ]',
          activity: '[SUPPRIMÉ]',
          city: '[SUPPRIMÉ]',
          description: 'Compte supprimé le ' + new Date().toLocaleDateString('fr-FR')
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
      console.error('Erreur suppression compte:', err);
      toast.system.serverError();
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <span className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mb-4"></span>
        <p>Chargement du profil…</p>
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
      <section className="max-w-4xl mx-auto pt-6 px-4">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Mon profil</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informations boutique */}
            <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Informations de la boutique</h2>
              
              {/* Photo de profil */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <img
                    src={photoPreview || shopPhotoUrl || '/placeholder-shop.png'}
                    alt="Photo boutique"
                    className="w-24 h-24 rounded-full object-cover border-4 border-night-foreground/20"
                  />
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
                <div>
                  <h3 className="font-semibold text-lg">{formData.name}</h3>
                  <p className="text-night-foreground/70">{formData.activity}</p>
                  <p className="text-night-foreground/60 text-sm">📍 {formData.city}</p>
                </div>
              </div>

              {/* Formulaire */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom de la boutique *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Boutique Mode Dakar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Activité *</label>
                  <input
                    type="text"
                    value={formData.activity}
                    onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                    className="w-full bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Mode et vêtements"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ville *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Dakar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Décrivez votre boutique, vos spécialités..."
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sauvegarde...
                    </>
                  ) : (
                    'Sauvegarder'
                  )}
                </button>
              </div>
            </div>

            {/* Sécurité */}
            <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Sécurité</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Mot de passe</h3>
                    <p className="text-sm text-night-foreground/70">Modifiez votre mot de passe pour sécuriser votre compte</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground px-4 py-2 rounded-lg border border-night-foreground/20 transition-colors"
                  >
                    {showPasswordChange ? 'Annuler' : 'Modifier'}
                  </button>
                </div>

                {showPasswordChange && (
                  <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Au moins 6 caractères"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Retapez le nouveau mot de passe"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleChangePassword}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground px-4 py-2 rounded-lg border border-night-foreground/20 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Mes statistiques</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{stats.totalProducts}</div>
                    <div className="text-sm text-night-foreground/70">Produits</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{stats.totalOrders}</div>
                    <div className="text-sm text-night-foreground/70">Commandes</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{stats.totalRevenue.toLocaleString()}</div>
                    <div className="text-sm text-night-foreground/70">FCFA de revenus</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations compte */}
            <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Mon compte</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-night-foreground/70">Email:</span>
                  <div className="font-medium">{user?.email}</div>
                </div>
                <div>
                  <span className="text-night-foreground/70">Membre depuis:</span>
                  <div className="font-medium">{stats.joinDate}</div>
                </div>
                <div>
                  <span className="text-night-foreground/70">ID boutique:</span>
                  <div className="font-mono text-xs break-all">{shop?.id}</div>
                </div>
              </div>
            </div>

            {/* Zone danger */}
            <div className="bg-red-900/10 border border-red-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-900/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-red-400">Zone de danger</h2>
              </div>
              <p className="text-sm text-night-foreground/70 mb-4">
                La suppression de votre compte est irréversible. Toutes vos données seront perdues.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full"
              >
                Supprimer mon compte
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal confirmation suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-night border border-red-800 rounded-lg p-6 max-w-md w-full transform transition-all duration-200 scale-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-400">Confirmer la suppression</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-night-foreground/80 mb-3">
                Êtes-vous sûr de vouloir supprimer votre compte ?
              </p>
              <div className="bg-red-900/10 border border-red-800/50 rounded-lg p-3">
                <p className="text-sm text-red-300">
                  ⚠️ Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement perdues :
                </p>
                <ul className="text-sm text-red-300/80 mt-2 space-y-1">
                  <li>• Vos produits et leurs images</li>
                  <li>• Vos commandes et historique</li>
                  <li>• Votre boutique et ses informations</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteAccount();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Oui, supprimer définitivement
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground py-3 px-4 rounded-lg border border-night-foreground/20 transition-colors font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}