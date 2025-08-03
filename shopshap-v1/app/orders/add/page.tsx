'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';

type Product = {
  id: string;
  name: string;
  price: number;
  stock?: number | null;
  category?: string;
};

type Shop = {
  id: string;
  name: string;
  user_id: string;
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

// ✨ Enhanced Step Progress Component
function StepProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-3">
        <span className="text-sm font-semibold text-slate-400">Étape {currentStep} sur {totalSteps}</span>
        <span className="text-sm font-semibold text-slate-400">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-slate-700/30 rounded-full h-2.5">
        <div 
          className="bg-gradient-to-r from-emerald-600 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

// ✨ Enhanced Form Input Component
function FormInput({ 
  label, 
  required = false, 
  error, 
  children, 
  helpText 
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  helpText?: string;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-300">
        {label} 
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-slate-500 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {helpText}
        </p>
      )}
    </div>
  );
}

// ✨ Enhanced Loading Skeleton
function AddOrderSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8">
      {/* Header Skeleton */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded mb-4"></div>
        <div className="h-12 bg-slate-700/50 rounded w-2/3"></div>
      </div>
      
      {/* Form Sections Skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 animate-pulse">
          <div className="h-6 bg-slate-700/50 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-4 bg-slate-700/30 rounded w-1/3"></div>
              <div className="h-12 bg-slate-700/30 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-700/30 rounded w-1/3"></div>
              <div className="h-12 bg-slate-700/30 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AddOrderPage() {
  const router = useRouter();
  const toast = useToasts();
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('/orders');

  // ✨ Enhanced Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    selectedProductId: '',
    customProductName: '',
    quantity: 1,
    unitPrice: '' as number | '',
    status: 'pending' as 'pending' | 'paid' | 'delivered' | 'cancelled',
    notes: '',
  });

  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    fetchShopAndProducts();
  }, []);

  useEffect(() => {
    if (!loading && products.length === 0) {
      setTimeout(() => {
        toast.info('Conseil 💡', 'Ajoutez d\'abord des produits à votre catalogue pour faciliter la création de commandes');
      }, 1000);
    }
  }, [loading, products.length, toast]);

  async function fetchShopAndProducts() {
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
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (shopError || !shopData) {
        toast.error('Boutique introuvable', 'Configurez d\'abord votre boutique');
        router.replace('/onboarding');
        return;
      }

      setShop(shopData);

      // ✨ Enhanced products retrieval
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, stock, category')
        .eq('shop_id', shopData.id)
        .order('name');

      if (productsError) {
        console.error('Erreur chargement produits:', productsError);
        toast.warning('Attention', 'Impossible de charger les produits du catalogue');
      }

      setProducts(productsData || []);
      
      if (productsData && productsData.length > 0) {
        toast.success('Données chargées', `${productsData.length} produit(s) disponible(s) dans votre catalogue`);
      }

    } catch (err) {
      console.error('Erreur chargement:', err);
      toast.error('Erreur réseau', 'Vérifiez votre connexion internet');
    } finally {
      setLoading(false);
    }
  }

  // ✨ Enhanced form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Le nom du client est requis';
    } else if (formData.clientName.trim().length < 2) {
      newErrors.clientName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.customProductName.trim()) {
      newErrors.customProductName = 'Le nom du produit est requis';
    }

    if (!formData.unitPrice || Number(formData.unitPrice) <= 0) {
      newErrors.unitPrice = 'Le prix doit être supérieur à 0';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La quantité doit être supérieure à 0';
    }

    if (formData.clientPhone && formData.clientPhone.length < 8) {
      newErrors.clientPhone = 'Numéro de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function handleProductSelect(productId: string) {
    setFormData(prev => ({ ...prev, selectedProductId: productId }));
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        customProductName: product.name,
        unitPrice: product.price
      }));
      toast.success('Produit sélectionné', `${product.name} - ${product.price.toLocaleString()} FCFA`);
      
      // ✨ Stock warning
      if (product.stock !== undefined && product.stock !== null && product.stock <= 2) {
        setTimeout(() => {
          toast.warning('Stock faible', `Attention: il ne reste que ${product.stock} unité(s) en stock`);
        }, 500);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        customProductName: '',
        unitPrice: ''
      }));
    }
  }

  // ✨ Enhanced file handling
  function handlePaymentProofChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // ✨ Enhanced validation
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Fichier trop volumineux', 'La preuve de paiement ne doit pas dépasser 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Format invalide', 'Veuillez sélectionner une image (JPG, PNG, etc.)');
        return;
      }

      setPaymentProof(file);
      setPaymentProofPreview(URL.createObjectURL(file));
      toast.success('Preuve de paiement ajoutée', 'Image sélectionnée avec succès');
    } else {
      setPaymentProof(null);
      setPaymentProofPreview(null);
    }
  }

  // ✨ Enhanced submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Formulaire invalide', 'Veuillez corriger les erreurs');
      return;
    }

    setSaving(true);

    try {
      if (!shop) {
        toast.error('Erreur boutique', 'Impossible de trouver votre boutique');
        setSaving(false);
        return;
      }

      let payment_proof_url: string | null = null;

      // ✨ Enhanced payment proof upload
      if (paymentProof) {
        setUploadingProof(true);
        toast.info('Upload en cours...', 'Téléchargement de la preuve de paiement');
        
        const fileName = `${shop.id}/${Date.now()}_${paymentProof.name}`;
        const { data, error } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProof, { cacheControl: '3600' });

        if (error) {
          console.error('Erreur upload:', error);
          toast.error('Erreur upload', 'Impossible d\'uploader la preuve de paiement');
          setSaving(false);
          setUploadingProof(false);
          return;
        }
        
        payment_proof_url = data?.path ?? null;
        setUploadingProof(false);
        toast.success('Preuve uploadée !', 'Image sauvegardée avec succès');
      }

      const totalAmount = Number(formData.unitPrice) * formData.quantity;

      // ✨ Enhanced order creation
      const { error: insertError } = await supabase
        .from('orders')
        .insert([{
          shop_id: shop.id,
          client_name: formData.clientName.trim(),
          client_phone: formData.clientPhone.trim() || null,
          product_id: formData.selectedProductId || null,
          product_name: formData.customProductName.trim(),
          quantity: formData.quantity,
          unit_price: Number(formData.unitPrice),
          total_amount: totalAmount,
          status: formData.status,
          payment_proof_url,
          notes: formData.notes.trim() || null,
        }]);

      if (insertError) {
        console.error('Erreur insertion:', insertError);
        toast.error('Erreur sauvegarde', 'Impossible de créer la commande');
        setSaving(false);
        return;
      }

      // ✨ Enhanced success flow
      toast.success('Commande créée !', `Commande de ${totalAmount.toLocaleString()} FCFA pour ${formData.clientName}`);
      
      // ✨ Reset form
      setFormData({
        clientName: '',
        clientPhone: '',
        selectedProductId: '',
        customProductName: '',
        quantity: 1,
        unitPrice: '',
        status: 'pending',
        notes: '',
      });
      setPaymentProof(null);
      setPaymentProofPreview(null);
      setErrors({});

      // ✨ Smart tips based on status and data
      setTimeout(() => {
        if (formData.status === 'pending' && !formData.clientPhone) {
          toast.info('Conseil 📞', 'Ajoutez un numéro de téléphone pour faciliter le suivi avec le client');
        } else if (formData.status === 'pending' && formData.clientPhone) {
          toast.info('Rappel WhatsApp 📱', 'N\'oubliez pas de contacter votre client pour confirmer la commande');
        } else if (formData.status === 'paid') {
          toast.info('Excellente nouvelle ! 💰', 'Commande déjà payée - préparez la livraison');
        }
      }, 2000);

      // ✨ Redirect with delay for user to see success
      setTimeout(() => {
        router.push('/orders');
      }, 3000);

    } catch (err: any) {
      console.error('Erreur ajout commande:', err);
      toast.error('Erreur inattendue', 'Une erreur est survenue, veuillez réessayer');
    } finally {
      setSaving(false);
      setUploadingProof(false);
    }
  }

  const totalAmount = formData.unitPrice && formData.quantity ? Number(formData.unitPrice) * formData.quantity : 0;
  const currentStep = formData.clientName ? (formData.customProductName ? (totalAmount > 0 ? 3 : 2) : 1) : 1;

  const handleNavigation = (route: string) => {
    setActiveTab(route);
    router.push(route);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950 p-4">
        <AddOrderSkeleton />
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
                Êtes-vous sûr de vouloir vous déconnecter ? Vos données de commande non sauvegardées seront perdues.
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
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* ✨ Enhanced Header */}
        <header>
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/30">
              <button
                onClick={() => router.back()}
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
                <span className="text-sm font-medium">Commandes</span>
              </button>
              
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                </svg>
                <span className="text-emerald-400 font-medium">Nouvelle commande</span>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
                Nouvelle commande
              </h1>
              <p className="text-slate-400 text-lg">
                Ajoutez une commande pour vos clients TikTok & WhatsApp
              </p>
            </div>

            {/* ✨ Progress Indicator */}
            <div className="mt-8">
              <StepProgress currentStep={currentStep} totalSteps={3} />
            </div>
          </div>
        </header>

        {/* ✨ Enhanced No Products Warning */}
        {products.length === 0 && (
          <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-amber-400 font-bold text-lg mb-2">Catalogue vide</h3>
                <p className="text-amber-300/80 leading-relaxed mb-4">
                  Pour faciliter la création de commandes, ajoutez d'abord quelques produits à votre catalogue. 
                  Vous pourrez ensuite les sélectionner rapidement lors de la saisie.
                </p>
                <button
                  onClick={() => router.push('/products/add')}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Ajouter un produit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✨ Enhanced Form */}
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* ✨ Client Information Section */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              Informations client
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormInput 
                label="Nom du client" 
                required 
                error={errors.clientName}
                helpText="Nom complet de votre client"
              >
                <input
                  type="text"
                  placeholder="Ex: Fatou Diallo"
                  value={formData.clientName}
                  onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className={`w-full bg-slate-700/30 border-2 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                    errors.clientName 
                      ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                      : 'border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </FormInput>
              
              <FormInput 
                label="Téléphone" 
                error={errors.clientPhone}
                helpText="Pour les rappels WhatsApp (optionnel)"
              >
                <input
                  type="tel"
                  placeholder="Ex: +225 01 23 45 67 89"
                  value={formData.clientPhone}
                  onChange={e => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className={`w-full bg-slate-700/30 border-2 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                    errors.clientPhone 
                      ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                      : 'border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </FormInput>
            </div>
          </div>

          {/* ✨ Product Information Section */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
                </svg>
              </div>
              Produit commandé
            </h3>
            
            {/* ✨ Enhanced Product Selector */}
            {products.length > 0 && (
              <div className="mb-6">
                <FormInput 
                  label="Sélectionner un produit de votre catalogue" 
                  helpText="Ou saisissez manuellement ci-dessous"
                >
                  <select
                    value={formData.selectedProductId}
                    onChange={e => handleProductSelect(e.target.value)}
                    className="w-full bg-slate-700/30 border-2 border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-4 text-white focus:outline-none transition-all duration-300"
                  >
                    <option value="">-- Choisir un produit existant --</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.price.toLocaleString()} FCFA
                        {product.stock !== undefined && product.stock !== null && product.stock <= 2 && ` (Stock: ${product.stock})`}
                        {product.category && ` [${product.category}]`}
                      </option>
                    ))}
                  </select>
                </FormInput>
              </div>
            )}

            <div className="space-y-6">
              <FormInput 
                label="Nom du produit" 
                required 
                error={errors.customProductName}
                helpText="Nom exact du produit commandé"
              >
                <input
                  type="text"
                  placeholder="Ex: Robe wax taille M"
                  value={formData.customProductName}
                  onChange={e => setFormData(prev => ({ ...prev, customProductName: e.target.value }))}
                  className={`w-full bg-slate-700/30 border-2 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                    errors.customProductName 
                      ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                      : 'border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </FormInput>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormInput 
                  label="Quantité" 
                  required 
                  error={errors.quantity}
                  helpText="Nombre d'unités commandées"
                >
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={e => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    className={`w-full bg-slate-700/30 border-2 rounded-xl px-4 py-4 text-white focus:outline-none transition-all duration-300 ${
                      errors.quantity 
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                        : 'border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </FormInput>
                
                <FormInput 
                  label="Prix unitaire" 
                  required 
                  error={errors.unitPrice}
                  helpText="Prix de vente par unité"
                >
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="15000"
                      value={formData.unitPrice}
                      onChange={e => setFormData(prev => ({ ...prev, unitPrice: e.target.value === "" ? "" : Number(e.target.value) }))}
                      className={`w-full bg-slate-700/30 border-2 rounded-xl px-4 py-4 pr-20 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                        errors.unitPrice 
                          ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                          : 'border-slate-600/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                    <span className="absolute right-4 top-4 text-slate-400 font-semibold">FCFA</span>
                  </div>
                </FormInput>
              </div>
            </div>

            {/* ✨ Enhanced Total Display */}
            {totalAmount > 0 && (
              <div className="mt-8 p-6 bg-gradient-to-r from-emerald-900/20 via-blue-900/20 to-purple-900/20 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-semibold text-lg">Total de la commande :</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                    {totalAmount.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ✨ Order Details Section */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 6v2m0 0h2m-2 0H7"></path>
                </svg>
              </div>
              Détails de la commande
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormInput 
                label="Statut de la commande"
                helpText="État actuel de la commande"
              >
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-slate-700/30 border-2 border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-4 text-white focus:outline-none transition-all duration-300"
                >
                  <option value="pending">⏳ En attente</option>
                  <option value="paid">✅ Payée</option>
                  <option value="delivered">🚚 Livrée</option>
                  <option value="cancelled">❌ Annulée</option>
                </select>
              </FormInput>
              
              <FormInput 
                label="Preuve de paiement"
                helpText="Capture d'écran du paiement (optionnel)"
              >
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentProofChange}
                    disabled={uploadingProof}
                    className="w-full text-sm text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-600 file:to-blue-600 file:text-white hover:file:from-purple-700 hover:file:to-blue-700 file:cursor-pointer file:transition-all file:duration-300 disabled:file:from-slate-600 disabled:file:to-slate-600"
                  />
                  
                  {paymentProofPreview && (
                    <div className="relative inline-block group">
                      <img
                        src={paymentProofPreview}
                        alt="Preuve de paiement"
                        className="h-24 w-auto rounded-xl border-2 border-slate-600/50 shadow-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentProof(null);
                          setPaymentProofPreview(null);
                          toast.info('Image supprimée', 'La preuve de paiement a été retirée');
                        }}
                        className="absolute -top-2 -right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-xl w-8 h-8 flex items-center justify-center font-bold transition-all duration-300 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {uploadingProof && (
                    <div className="flex items-center gap-3 text-purple-400 bg-purple-900/20 rounded-xl p-4">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-semibold">Upload en cours...</span>
                    </div>
                  )}
                </div>
              </FormInput>
            </div>
            
            <div className="mt-6">
              <FormInput 
                label="Notes et remarques"
                helpText="Instructions de livraison, variantes, etc. (optionnel)"
              >
                <textarea
                  placeholder="Remarques, instructions de livraison, variantes de produit..."
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full bg-slate-700/30 border-2 border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 resize-none"
                />
              </FormInput>
            </div>
          </div>

          {/* ✨ Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border-2 border-slate-600/50 hover:border-slate-500/50 py-4 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 min-h-[56px] flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={saving || !formData.clientName || !formData.customProductName || !formData.unitPrice || uploadingProof}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 min-h-[56px] flex items-center justify-center gap-3"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Création en cours...</span>
                </>
              ) : uploadingProof ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Upload en cours...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <span>Créer la commande</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ✨ Enhanced Footer */}
        <div className="text-center py-8 mt-12 border-t border-slate-700/50">
          <div className="text-slate-500 text-sm">
            <p>Connecté : <strong className="text-white">Sdiabate1337</strong></p>
            <p className="mt-1">2025-08-03 16:12:41 UTC</p>
            <p className="mt-2 text-xs text-slate-600">
              🚀 ShopShap v2.0 - Créateur de commandes optimisé TikTok & WhatsApp
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}