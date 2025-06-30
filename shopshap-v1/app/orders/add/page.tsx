'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast'; // ✅ CORRECTION: useToasts au lieu de useToast

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

export default function AddOrderPage() {
  const router = useRouter();
  const toast = useToasts(); // ✅ Hook correct maintenant
  
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
    // Message d'aide après chargement
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <span className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mb-4"></span>
        <p>Chargement…</p>
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
      <nav className="hidden sm:flex gap-4 mb-6 pt-8 px-4 max-w-2xl mx-auto">
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
      <section className="max-w-2xl mx-auto pt-6 px-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-night-foreground/70 hover:text-night-foreground transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
            </svg>
            Retour
          </button>
          <h1 className="text-2xl font-bold">Ajouter une commande</h1>
          <div className="w-16"></div>
        </div>

        {/* Message d'information si pas de produits */}
        {products.length === 0 && (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p className="text-yellow-400 font-medium">Aucun produit dans votre catalogue</p>
                <p className="text-yellow-300/80 text-sm">
                  Ajoutez d'abord des produits pour faciliter la création de commandes.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/products/add')}
              className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Ajouter un produit
            </button>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Informations client */}
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              Informations client
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                  Nom du client <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fatou Diallo"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  required
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-night-foreground placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  placeholder="Ex: +225 01 23 45 67 89"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-night-foreground placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Informations produit */}
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
                </svg>
              </div>
              Produit commandé
            </h3>
            
            {/* Sélecteur de produit */}
            {products.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                  Choisir un produit existant (optionnel)
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => handleProductSelect(e.target.value)}
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-night-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                  Nom du produit <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Robe wax taille M"
                  value={customProductName}
                  onChange={e => setCustomProductName(e.target.value)}
                  required
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-night-foreground placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                  Quantité <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  required
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-night-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-night-foreground/80 mb-2">
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
                    className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 pr-16 text-night-foreground placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <span className="absolute right-3 top-3 text-night-foreground/60 text-sm">FCFA</span>
                </div>
              </div>
            </div>

            {/* Total calculé */}
            {totalAmount > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/20 to-green-900/20 border border-blue-800/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-night-foreground/80 font-medium">Total de la commande :</span>
                  <span className="text-blue-400 font-bold text-xl">{totalAmount.toLocaleString()} FCFA</span>
                </div>
              </div>
            )}
          </div>

          {/* Statut et notes */}
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-900/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 6v2m0 0h2m-2 0H7"></path>
                </svg>
              </div>
              Détails de la commande
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                  Statut
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-night-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="pending">⏳ En attente</option>
                  <option value="paid">✅ Payée</option>
                  <option value="delivered">🚚 Livrée</option>
                  <option value="cancelled">❌ Annulée</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                  Preuve de paiement (optionnel)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentProofChange}
                  className="w-full text-sm text-night-foreground/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer transition-colors"
                />
                {paymentProofPreview && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={paymentProofPreview}
                      alt="Preuve de paiement"
                      className="h-20 w-auto rounded-lg border-2 border-night-foreground/20 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProof(null);
                        setPaymentProofPreview(null);
                        toast.info('Image supprimée', 'La preuve de paiement a été retirée');
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                placeholder="Remarques, instructions de livraison, variantes de produit..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-night-foreground placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground py-3 px-4 rounded-lg font-semibold transition-colors border border-night-foreground/30"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !clientName || !customProductName || !unitPrice}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-blue-600/50 disabled:to-green-600/50 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Ajout en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Ajouter la commande
                </div>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}