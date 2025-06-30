'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number | null;
  photo_url: string | null;
  video_url: string | null;
  shop_id: string;
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

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToasts(); // ✅ Hook unifié
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState<number | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    // Message d'accueil pour l'édition
    if (product && !loading) {
      setTimeout(() => {
        toast.system.tip('Modifiez les informations et sauvegardez pour mettre à jour votre produit');
      }, 1000);
    }
  }, [product, loading, toast]);

  async function fetchProduct() {
    setLoading(true);
    try {
      // Vérifier l'utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.auth.sessionExpired();
        router.replace('/login');
        return;
      }

      // Récupérer le produit avec vérification de propriété
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          shops!inner(user_id)
        `)
        .eq('id', productId)
        .eq('shops.user_id', session.user.id)
        .single();

      if (productError || !productData) {
        console.error('Erreur produit:', productError);
        toast.error('Produit introuvable', 'Ce produit n\'existe pas ou vous n\'y avez pas accès');
        setTimeout(() => router.push('/products'), 2000);
        return;
      }

      setProduct(productData);
      setName(productData.name);
      setPrice(productData.price);
      setDescription(productData.description || "");
      setStock(productData.stock || "");

      // Générer les signed URLs pour les médias existants
      if (productData.photo_url) {
        const { data: photoData } = await supabase.storage
          .from('shop-photos') // ✅ Correction du bucket
          .createSignedUrl(productData.photo_url, 60 * 60);
        setCurrentPhotoUrl(photoData?.signedUrl || null);
      }

      if (productData.video_url) {
        const { data: videoData } = await supabase.storage
          .from('product-videos')
          .createSignedUrl(productData.video_url, 60 * 60);
        setCurrentVideoUrl(videoData?.signedUrl || null);
      }

    } catch (err: any) {
      console.error('Erreur chargement produit:', err);
      toast.system.networkError();
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    
    if (!file) return;

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

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    toast.shop.photoSelected();
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    
    if (!file) return;

    // Vérification taille (max 50MB pour les vidéos)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Vidéo trop volumineuse', 'La vidéo ne doit pas dépasser 50MB');
      return;
    }

    // Vérification type
    if (!file.type.startsWith('video/')) {
      toast.error('Format invalide', 'Veuillez sélectionner une vidéo (MP4, MOV, etc.)');
      return;
    }

    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    toast.info('Vidéo sélectionnée', 'La nouvelle vidéo remplacera l\'ancienne');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Validations avec toasts spécifiques
      if (!name.trim()) {
        toast.product.validationError('Le nom du produit');
        setSaving(false);
        return;
      }

      if (!price || Number(price) <= 0) {
        toast.product.validationError('Le prix du produit');
        setSaving(false);
        return;
      }

      let photo_url = product?.photo_url;
      let video_url = product?.video_url;

      // Upload nouvelle photo si sélectionnée
      if (photo) {
        setUploadingPhoto(true);
        toast.product.uploadStart();
        
        // Supprimer l'ancienne photo si elle existe
        if (product?.photo_url) {
          await supabase.storage
            .from('shop-photos')
            .remove([product.photo_url]);
        }

        const photoPath = `products/${Date.now()}_${photo.name}`;
        const { data, error } = await supabase.storage
          .from('shop-photos')
          .upload(photoPath, photo, { cacheControl: "3600" });
        
        if (error) {
          console.error('Erreur upload photo:', error);
          toast.product.uploadError('Impossible d\'uploader la nouvelle photo');
          setSaving(false);
          setUploadingPhoto(false);
          return;
        }
        
        photo_url = data?.path ?? null;
        setUploadingPhoto(false);
        toast.product.uploadSuccess();
      }

      // Upload nouvelle vidéo si sélectionnée
      if (video) {
        setUploadingVideo(true);
        toast.info('Upload vidéo...', 'Téléchargement de votre nouvelle vidéo en cours');
        
        // Supprimer l'ancienne vidéo si elle existe
        if (product?.video_url) {
          await supabase.storage
            .from('product-videos')
            .remove([product.video_url]);
        }

        const videoPath = `products/${Date.now()}_${video.name}`;
        const { data, error } = await supabase.storage
          .from('product-videos')
          .upload(videoPath, video, { cacheControl: "3600" });
        
        if (error) {
          console.error('Erreur upload vidéo:', error);
          toast.error('Upload vidéo échoué', 'Impossible d\'uploader la nouvelle vidéo');
          setSaving(false);
          setUploadingVideo(false);
          return;
        }
        
        video_url = data?.path ?? null;
        setUploadingVideo(false);
        toast.success('Vidéo uploadée !', 'Votre nouvelle vidéo a été sauvegardée');
      }

      // Mettre à jour le produit
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: name.trim(),
          price: Number(price),
          description: description.trim() || null,
          stock: stock === "" ? null : Number(stock),
          photo_url,
          video_url,
        })
        .eq('id', productId);

      if (updateError) {
        console.error('Erreur mise à jour:', updateError);
        toast.system.serverError();
        setSaving(false);
        return;
      }

      // Succès !
      toast.product.updated(name.trim());
      
      // Conseil après modification
      setTimeout(() => {
        if (!photo && !product?.photo_url) {
          toast.system.tip('Pensez à ajouter une photo pour améliorer la visibilité de ce produit');
        } else {
          toast.system.tip('Vos clients verront les modifications immédiatement');
        }
      }, 2000);

      // Redirection avec délai
      setTimeout(() => {
        router.push('/products');
      }, 3000);

    } catch (err: any) {
      console.error('Erreur mise à jour produit:', err);
      toast.system.networkError();
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
      setUploadingVideo(false);
    }
  }

  async function handleDelete() {
    if (!product) return;
    
    setDeleting(true);
    try {
      // Supprimer les fichiers du storage
      if (product.photo_url) {
        await supabase.storage
          .from('shop-photos')
          .remove([product.photo_url]);
      }
      if (product.video_url) {
        await supabase.storage
          .from('product-videos')
          .remove([product.video_url]);
      }

      // Supprimer le produit de la base
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Erreur suppression:', error);
        toast.system.serverError();
        setDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }

      toast.product.deleted(product.name);
      
      // Conseil après suppression
      setTimeout(() => {
        toast.system.tip('N\'oubliez pas d\'informer vos clients de cette suppression');
      }, 2000);

      setTimeout(() => {
        router.push('/products');
      }, 3000);

    } catch (err: any) {
      console.error('Erreur suppression produit:', err);
      toast.system.networkError();
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function removeCurrentPhoto() {
    if (!product?.photo_url) return;
    
    try {
      // Supprimer du storage
      await supabase.storage
        .from('shop-photos')
        .remove([product.photo_url]);

      // Mettre à jour en base
      const { error } = await supabase
        .from('products')
        .update({ photo_url: null })
        .eq('id', productId);

      if (error) {
        console.error('Erreur suppression photo:', error);
        toast.system.serverError();
        return;
      }

      setCurrentPhotoUrl(null);
      setProduct(prev => prev ? { ...prev, photo_url: null } : null);
      toast.info('Photo supprimée', 'La photo a été retirée du produit');
    } catch (err) {
      console.error('Erreur suppression photo:', err);
      toast.system.networkError();
    }
  }

  async function removeCurrentVideo() {
    if (!product?.video_url) return;
    
    try {
      // Supprimer du storage
      await supabase.storage
        .from('product-videos')
        .remove([product.video_url]);

      // Mettre à jour en base
      const { error } = await supabase
        .from('products')
        .update({ video_url: null })
        .eq('id', productId);

      if (error) {
        console.error('Erreur suppression vidéo:', error);
        toast.system.serverError();
        return;
      }

      setCurrentVideoUrl(null);
      setProduct(prev => prev ? { ...prev, video_url: null } : null);
      toast.info('Vidéo supprimée', 'La vidéo a été retirée du produit');
    } catch (err) {
      console.error('Erreur suppression vidéo:', err);
      toast.system.networkError();
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <span className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mb-4"></span>
        <p>Chargement du produit…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <h3 className="text-xl font-semibold mb-2 text-red-400">Produit introuvable</h3>
          <p className="text-night-foreground/70 mb-4">Ce produit n'existe pas ou vous n'y avez pas accès</p>
          <button
            onClick={() => router.push('/products')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Retour au catalogue
          </button>
        </div>
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
          <h1 className="text-2xl font-bold">Modifier le produit</h1>
          <button
            onClick={() => {
              toast.warning('Suppression de produit', 'Confirmez pour supprimer définitivement ce produit');
              setTimeout(() => setShowDeleteConfirm(true), 1000);
            }}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Supprimer
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Informations de base */}
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </div>
              Informations principales
            </h3>

            {/* Nom du produit */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                Nom du produit <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Robe wax africaine taille M"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-night-foreground placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Prix et Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                  Prix <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="15000"
                    value={price}
                    onChange={e => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 pr-16 text-night-foreground placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <span className="absolute right-3 top-3 text-night-foreground/60 text-sm">FCFA</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                  Stock (optionnel)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="10"
                  value={stock}
                  onChange={e => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-night-foreground placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-night-foreground/60 mt-1">
                  Laissez vide si vous ne voulez pas gérer le stock
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                Description (optionnel)
              </label>
              <textarea
                placeholder="Décrivez votre produit : matière, taille, couleur, qualité..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-night-foreground placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Médias */}
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              Photos et vidéos
            </h3>

            {/* Photo actuelle et nouvelle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                Photo du produit
              </label>
              <div className="space-y-3">
                {/* Photo actuelle */}
                {currentPhotoUrl && !photoPreview && (
                  <div className="relative inline-block group">
                    <img
                      src={currentPhotoUrl}
                      alt="Photo actuelle"
                      className="h-40 w-auto rounded-lg border-2 border-night-foreground/20 object-cover shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removeCurrentPhoto}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                    <span className="absolute -bottom-6 left-0 text-xs text-night-foreground/60">Photo actuelle</span>
                  </div>
                )}

                {/* Nouvelle photo */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                  className="w-full text-sm text-night-foreground/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer disabled:file:bg-blue-600/50 disabled:file:cursor-not-allowed transition-colors"
                />
                {photoPreview && (
                  <div className="relative inline-block group">
                    <img
                      src={photoPreview}
                      alt="Nouvelle photo"
                      className="h-40 w-auto rounded-lg border-2 border-green-500/50 object-cover shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                        toast.info('Photo annulée', 'La nouvelle photo a été retirée');
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                    <span className="absolute -bottom-6 left-0 text-xs text-green-400">✓ Nouvelle photo</span>
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Upload de la photo en cours...
                  </div>
                )}
              </div>
            </div>

            {/* Vidéo actuelle et nouvelle */}
            <div>
              <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                Vidéo du produit (optionnel)
              </label>
              <div className="space-y-3">
                {/* Vidéo actuelle */}
                {currentVideoUrl && !videoPreview && (
                  <div className="relative inline-block group">
                    <video
                      src={currentVideoUrl}
                      controls
                      className="h-40 w-auto rounded-lg border-2 border-night-foreground/20 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removeCurrentVideo}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                    <span className="absolute -bottom-6 left-0 text-xs text-night-foreground/60">Vidéo actuelle</span>
                  </div>
                )}

                {/* Nouvelle vidéo */}
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  disabled={uploadingVideo}
                  className="w-full text-sm text-night-foreground/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer disabled:file:bg-purple-600/50 disabled:file:cursor-not-allowed transition-colors"
                />
                {videoPreview && (
                  <div className="relative inline-block group">
                    <video
                      src={videoPreview}
                      controls
                      className="h-40 w-auto rounded-lg border-2 border-green-500/50 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setVideo(null);
                        setVideoPreview(null);
                        toast.info('Vidéo annulée', 'La nouvelle vidéo a été retirée');
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                    <span className="absolute -bottom-6 left-0 text-xs text-green-400">✓ Nouvelle vidéo</span>
                  </div>
                )}
                {uploadingVideo && (
                  <div className="flex items-center gap-2 text-purple-400 text-sm">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Upload de la vidéo en cours...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Aperçu des changements */}
          {price && Number(price) > 0 && (
            <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-night-foreground/80 font-medium">Nouveau prix :</span>
                <span className="text-green-400 font-bold text-xl">{Number(price).toLocaleString()} FCFA</span>
              </div>
              {stock !== "" && Number(stock) >= 0 && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-night-foreground/70 text-sm">Nouveau stock :</span>
                  <span className="text-blue-400 font-medium">{Number(stock)} unité(s)</span>
                </div>
              )}
            </div>
          )}

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
              disabled={saving || !name || price === "" || uploadingPhoto || uploadingVideo}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-blue-600/50 disabled:to-green-600/50 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sauvegarde...</span>
                </div>
              ) : uploadingPhoto || uploadingVideo ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Upload...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Sauvegarder les modifications
                </div>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Modal de confirmation de suppression */}
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
                Êtes-vous sûr de vouloir supprimer <strong>"{product?.name}"</strong> ?
              </p>
              <div className="bg-red-900/10 border border-red-800/50 rounded-lg p-3">
                <p className="text-sm text-red-300">
                  ⚠️ Cette action est <strong>irréversible</strong> :
                </p>
                <ul className="text-sm text-red-300/80 mt-2 space-y-1">
                  <li>• Le produit sera supprimé définitivement</li>
                  <li>• Les photos et vidéos seront effacées</li>
                  <li>• Les liens partagés ne fonctionneront plus</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground py-3 px-4 rounded-lg border border-night-foreground/20 transition-colors font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white py-3 px-4 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Suppression...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Oui, supprimer définitivement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}