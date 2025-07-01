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
    active: true,
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
    ),
    route: '/profile',
  },
];

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToasts();
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
    if (product && !loading) {
      setTimeout(() => {
        toast.system.tip('Modifiez les informations et sauvegardez pour mettre à jour votre produit');
      }, 1000);
    }
  }, [product, loading, toast]);

  async function fetchProduct() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.auth.sessionExpired();
        router.replace('/login');
        return;
      }

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

      if (productData.photo_url) {
        const { data: photoData } = await supabase.storage
          .from('shop-photos')
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

    if (file.size > 5 * 1024 * 1024) {
      toast.system.fileTooLarge();
      return;
    }

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

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Vidéo trop volumineuse', 'La vidéo ne doit pas dépasser 50MB');
      return;
    }

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

      if (photo) {
        setUploadingPhoto(true);
        toast.product.uploadStart();
        
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

      if (video) {
        setUploadingVideo(true);
        toast.info('Upload vidéo...', 'Téléchargement de votre nouvelle vidéo en cours');
        
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

      toast.product.updated(name.trim());
      
      setTimeout(() => {
        if (!photo && !product?.photo_url) {
          toast.system.tip('Pensez à ajouter une photo pour améliorer la visibilité de ce produit');
        } else {
          toast.system.tip('Vos clients verront les modifications immédiatement');
        }
      }, 2000);

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
      await supabase.storage
        .from('shop-photos')
        .remove([product.photo_url]);

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
      await supabase.storage
        .from('product-videos')
        .remove([product.video_url]);

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night ${theme.primary}`}">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        <p className="text-night-foreground mt-4 text-lg">Chargement du produit...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 w-20 h-20 bg-red-500 rounded-full blur-xl opacity-50 mx-auto"></div>
            <div className="relative w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border border-red-800/50">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Produit introuvable</h3>
          <p className="text-night-foreground/70 mb-8 leading-relaxed">Ce produit n'existe pas ou vous n'y avez pas accès</p>
          <button
            onClick={() => router.push('/products')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105"
          >
            Retour au catalogue
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-blue-950 pb-20 sm:pb-8">
      {/* Enhanced Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden">
        <div className="relative">
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
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-3 text-night-foreground/80 hover:text-night-foreground transition-all duration-200 bg-night-foreground/10 hover:bg-night-foreground/20 px-4 py-2 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span className="font-medium">Retour</span>
              </button>
              
              <button
                onClick={() => {
                  toast.warning('Suppression de produit', 'Confirmez pour supprimer définitivement ce produit');
                  setTimeout(() => setShowDeleteConfirm(true), 1000);
                }}
                className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-all duration-200 bg-red-900/20 hover:bg-red-900/30 px-4 py-2 rounded-xl border border-red-800/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                <span className="font-medium">Supprimer</span>
              </button>
            </div>

            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-xl opacity-50"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </div>
              </div>
              Modifier le produit
            </h1>
            
            <p className="text-night-foreground/70 mt-2 text-lg font-medium">
              Mettez à jour les informations de "{product.name}"
            </p>
          </div>
        </header>

        {/* Enhanced Form */}
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </div>
              Informations principales
            </h3>

            <div className="space-y-6">
              {/* Product Name */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Nom du produit <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Robe wax africaine taille M"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200"
                />
              </div>

              {/* Price and Stock */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-night-foreground/90">
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
                      className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 pr-16 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200"
                    />
                    <span className="absolute right-4 top-4 text-night-foreground/60 font-medium">FCFA</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-night-foreground/90">
                    Stock (optionnel)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="10"
                    value={stock}
                    onChange={e => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200"
                  />
                  <p className="text-xs text-night-foreground/60">
                    Laissez vide si vous ne voulez pas gérer le stock
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Description (optionnel)
                </label>
                <textarea
                  placeholder="Décrivez votre produit : matière, taille, couleur, qualité..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Media Section */}
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              Photos et vidéos
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Photo Section */}
              <div className="space-y-6">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Photo du produit
                </label>
                
                <div className="space-y-4">
                  {/* Current Photo */}
                  {currentPhotoUrl && !photoPreview && (
                    <div className="relative group">
                      <img
                        src={currentPhotoUrl}
                        alt="Photo actuelle"
                        className="h-48 w-full object-cover rounded-xl shadow-xl border-2 border-night-foreground/20"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl"></div>
                      <button
                        type="button"
                        onClick={removeCurrentPhoto}
                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold transition-all duration-200 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-3 left-3 bg-night-foreground/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Photo actuelle
                      </span>
                    </div>
                  )}

                  {/* New Photo Upload */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={uploadingPhoto}
                    className="w-full text-sm text-night-foreground/70 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white hover:file:from-blue-700 hover:file:to-purple-700 file:cursor-pointer file:transition-all file:duration-200 disabled:file:from-gray-600 disabled:file:to-gray-600"
                  />
                  
                  {/* New Photo Preview */}
                  {photoPreview && (
                    <div className="relative group">
                      <img
                        src={photoPreview}
                        alt="Nouvelle photo"
                        className="h-48 w-full object-cover rounded-xl shadow-xl border-2 border-green-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoPreview(null);
                          toast.info('Photo annulée', 'La nouvelle photo a été retirée');
                        }}
                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold transition-all duration-200 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-3 left-3 bg-green-600/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                        ✓ Nouvelle photo
                      </span>
                    </div>
                  )}
                  
                  {/* Photo Upload Status */}
                  {uploadingPhoto && (
                    <div className="flex items-center gap-3 text-blue-400 bg-blue-900/20 rounded-xl p-4">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-medium">Upload de la photo en cours...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Section */}
              <div className="space-y-6">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Vidéo du produit (optionnel)
                </label>
                
                <div className="space-y-4">
                  {/* Current Video */}
                  {currentVideoUrl && !videoPreview && (
                    <div className="relative group">
                      <video
                        src={currentVideoUrl}
                        controls
                        className="h-48 w-full rounded-xl shadow-xl border-2 border-night-foreground/20"
                      />
                      <button
                        type="button"
                        onClick={removeCurrentVideo}
                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold transition-all duration-200 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-3 left-3 bg-night-foreground/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Vidéo actuelle
                      </span>
                    </div>
                  )}

                  {/* New Video Upload */}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    disabled={uploadingVideo}
                    className="w-full text-sm text-night-foreground/70 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:text-white hover:file:from-purple-700 hover:file:to-pink-700 file:cursor-pointer file:transition-all file:duration-200 disabled:file:from-gray-600 disabled:file:to-gray-600"
                  />
                  
                  {/* New Video Preview */}
                  {videoPreview && (
                    <div className="relative group">
                      <video
                        src={videoPreview}
                        controls
                        className="h-48 w-full rounded-xl shadow-xl border-2 border-green-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVideo(null);
                          setVideoPreview(null);
                          toast.info('Vidéo annulée', 'La nouvelle vidéo a été retirée');
                        }}
                        className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold transition-all duration-200 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-3 left-3 bg-green-600/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                        ✓ Nouvelle vidéo
                      </span>
                    </div>
                  )}
                  
                  {/* Video Upload Status */}
                  {uploadingVideo && (
                    <div className="flex items-center gap-3 text-purple-400 bg-purple-900/20 rounded-xl p-4">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-medium">Upload de la vidéo en cours...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Price Preview */}
          {price && Number(price) > 0 && (
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-2xl p-6 backdrop-blur-sm">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Aperçu des modifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-night-foreground/80 font-medium">Nouveau prix :</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {Number(price).toLocaleString()} FCFA
                  </span>
                </div>
                {stock !== "" && Number(stock) >= 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-night-foreground/70">Nouveau stock :</span>
                    <span className="text-green-400 font-bold">{Number(stock)} unité(s)</span>
                  </div>
                )}
              </div>
            </div>
          )}

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
              disabled={saving || !name || price === "" || uploadingPhoto || uploadingVideo}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sauvegarde...</span>
                </div>
              ) : uploadingPhoto || uploadingVideo ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Upload en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Sauvegarder les modifications
                </div>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-red-800/50 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-200 scale-100">
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
                Êtes-vous sûr de vouloir supprimer <strong className="text-white">"{product?.name}"</strong> ?
              </p>
              <div className="bg-red-900/10 border border-red-800/50 rounded-xl p-4">
                <p className="text-sm text-red-300 mb-3 font-medium">
                  ⚠️ Cette action est <strong>irréversible</strong> et supprimera :
                </p>
                <ul className="text-sm text-red-300/80 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                    Le produit sera supprimé définitivement
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                    Les photos et vidéos seront effacées
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                    Les liens partagés ne fonctionneront plus
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground py-4 px-6 rounded-xl border border-night-foreground/20 transition-all duration-200 font-bold hover:scale-105"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 px-6 rounded-xl transition-all duration-300 font-bold hover:scale-105 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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