'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';

type Product = {
  id: string;
  name: string;
  price: number;
};

type Shop = {
  id: string;
  name: string;
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

export default function AddOrderPage() {
  const router = useRouter();
  const toast = useToasts();
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [status, setStatus] = useState<'pending' | 'paid' | 'delivered' | 'cancelled'>('pending');
  const [notes, setNotes] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchShopAndProducts();
  }, []);

  useEffect(() => {
    if (!loading && products.length === 0) {
      setTimeout(() => {
        toast.system.tip('Ajoutez d\'abord des produits à votre catalogue pour faciliter la saisie');
      }, 1000);
    }
  }, [loading, products.length, toast]);

  async function fetchShopAndProducts() {
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

      // Récupérer les produits pour le sélecteur
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('shop_id', shopData.id)
        .order('name');

      setProducts(productsData || []);
    } catch (err) {
      console.error('Erreur chargement:', err);
      toast.system.networkError();
    } finally {
      setLoading(false);
    }
  }

  function handleProductSelect(productId: string) {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setCustomProductName(product.name);
      setUnitPrice(product.price);
      toast.info('Produit sélectionné', `${product.name} - ${product.price.toLocaleString()} FCFA`);
    } else {
      setCustomProductName('');
      setUnitPrice('');
    }
  }

  function handlePaymentProofChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Vérification taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.system.fileTooLarge();
        return;
      }

      // Vérification type
      if (!file.type.startsWith('image/')) {
        toast.system.invalidFormat();
        return;
      }

      setPaymentProof(file);
      setPaymentProofPreview(URL.createObjectURL(file));
      toast.order.proofUploaded();
    } else {
      setPaymentProof(null);
      setPaymentProofPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (!shop) {
        toast.system.serverError();
        return;
      }

      // Validations avec toasts spécifiques
      if (!clientName.trim()) {
        toast.product.validationError('Le nom du client');
        setSaving(false);
        return;
      }

      if (!customProductName.trim()) {
        toast.product.validationError('Le nom du produit');
        setSaving(false);
        return;
      }

      if (!unitPrice || Number(unitPrice) <= 0) {
        toast.product.validationError('Le prix unitaire');
        setSaving(false);
        return;
      }

      if (quantity <= 0) {
        toast.product.validationError('La quantité');
        setSaving(false);
        return;
      }

      let payment_proof_url: string | null = null;

      // Upload preuve de paiement si fournie
      if (paymentProof) {
        toast.product.uploadStart();
        
        const fileName = `${shop.id}/${Date.now()}_${paymentProof.name}`;
        const { data, error } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProof, { cacheControl: '3600' });

        if (error) {
          toast.product.uploadError('Impossible d\'uploader la preuve de paiement');
          setSaving(false);
          return;
        }
        
        payment_proof_url = data?.path ?? null;
      }

      const totalAmount = Number(unitPrice) * quantity;

      // Créer la commande
      const { error: insertError } = await supabase
        .from('orders')
        .insert([{
          shop_id: shop.id,
          client_name: clientName.trim(),
          client_phone: clientPhone.trim() || null,
          product_id: selectedProductId || null,
          product_name: customProductName.trim(),
          quantity,
          unit_price: Number(unitPrice),
          total_amount: totalAmount,
          status,
          payment_proof_url,
          notes: notes.trim() || null,
        }]);

      if (insertError) {
        console.error('Erreur insertion:', insertError);
        toast.system.serverError();
        setSaving(false);
        return;
      }

      // Succès !
      toast.order.created(totalAmount);
      
      // Reset form
      setClientName('');
      setClientPhone('');
      setSelectedProductId('');
      setCustomProductName('');
      setQuantity(1);
      setUnitPrice('');
      setStatus('pending');
      setNotes('');
      setPaymentProof(null);
      setPaymentProofPreview(null);

      // Message de conseil
      setTimeout(() => {
        toast.system.tip('Pensez à contacter votre client pour confirmer la commande');
      }, 2000);

      // Redirection avec délai pour voir les toasts
      setTimeout(() => {
        router.push('/orders');
      }, 3000);

    } catch (err: any) {
      console.error('Erreur ajout commande:', err);
      toast.system.networkError();
    } finally {
      setSaving(false);
    }
  }

  const totalAmount = unitPrice && quantity ? Number(unitPrice) * quantity : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        <p className="text-night-foreground mt-4 text-lg">Chargement...</p>
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
      <nav className="hidden sm:flex items-center justify-between p-6 max-w-4xl mx-auto">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Enhanced Header */}
        <header className="mb-8">
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-3 text-night-foreground/80 hover:text-night-foreground transition-all duration-200 bg-night-foreground/10 hover:bg-night-foreground/20 px-4 py-2 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span className="font-medium">Retour</span>
              </button>
              
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-xl opacity-50"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                    </div>
                  </div>
                  Nouvelle commande
                </h1>
                <p className="text-night-foreground/70 mt-2 font-medium">
                  Ajoutez une commande pour vos clients
                </p>
              </div>
              
              <div className="w-24"></div>
            </div>
          </div>
        </header>

        {/* Enhanced No Products Warning */}
        {products.length === 0 && (
          <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-800/50 rounded-2xl p-6 mb-8 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-yellow-400 font-bold text-lg mb-2">Aucun produit dans votre catalogue</h3>
                <p className="text-yellow-300/80 leading-relaxed mb-4">
                  Pour faciliter la création de commandes, ajoutez d'abord quelques produits à votre catalogue. 
                  Vous pourrez ensuite les sélectionner rapidement lors de la saisie.
                </p>
                <button
                  onClick={() => router.push('/products/add')}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 flex items-center gap-2"
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

        {/* Enhanced Form */}
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Client Information */}
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              Informations client
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Nom du client <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fatou Diallo"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  required
                  className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  placeholder="Ex: +225 01 23 45 67 89"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
                </svg>
              </div>
              Produit commandé
            </h3>
            
            {/* Product Selector */}
            {products.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-night-foreground/90 mb-3">
                  Choisir un produit existant (optionnel)
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => handleProductSelect(e.target.value)}
                  className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white focus:outline-none transition-all duration-200"
                >
                  <option value="">-- Ou saisir manuellement --</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.price.toLocaleString()} FCFA
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Nom du produit <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Robe wax taille M"
                  value={customProductName}
                  onChange={e => setCustomProductName(e.target.value)}
                  required
                  className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200"
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Quantité <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  required
                  className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white focus:outline-none transition-all duration-200"
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Prix unitaire <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="15000"
                    value={unitPrice}
                    onChange={e => setUnitPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 pr-16 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200"
                  />
                  <span className="absolute right-4 top-4 text-night-foreground/60 font-medium">FCFA</span>
                </div>
              </div>
            </div>

            {/* Total Display */}
            {totalAmount > 0 && (
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-2xl backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <span className="text-night-foreground/80 font-semibold text-lg">Total de la commande :</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {totalAmount.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 6v2m0 0h2m-2 0H7"></path>
                </svg>
              </div>
              Détails de la commande
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Statut de la commande
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white focus:outline-none transition-all duration-200"
                >
                  <option value="pending">⏳ En attente</option>
                  <option value="paid">✅ Payée</option>
                  <option value="delivered">🚚 Livrée</option>
                  <option value="cancelled">❌ Annulée</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Preuve de paiement (optionnel)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentProofChange}
                    className="w-full text-sm text-night-foreground/70 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white hover:file:from-blue-700 hover:file:to-purple-700 file:cursor-pointer file:transition-all file:duration-200"
                  />
                </div>
                {paymentProofPreview && (
                  <div className="mt-4 relative inline-block">
                    <img
                      src={paymentProofPreview}
                      alt="Preuve de paiement"
                      className="h-24 w-auto rounded-xl border-2 border-night-foreground/20 shadow-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProof(null);
                        setPaymentProofPreview(null);
                        toast.info('Image supprimée', 'La preuve de paiement a été retirée');
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold transition-all duration-200 hover:scale-110 shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <label className="block text-sm font-semibold text-night-foreground/90">
                Notes et remarques (optionnel)
              </label>
              <textarea
                placeholder="Remarques, instructions de livraison, variantes de produit..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground border-2 border-night-foreground/30 hover:border-night-foreground/50 py-4 px-6 rounded-xl font-bold transition-all duration-200 hover:scale-105"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !clientName || !customProductName || !unitPrice}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Ajout en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Ajouter la commande
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}