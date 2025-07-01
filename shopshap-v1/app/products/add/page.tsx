'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';

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

export default function AddProductPage() {
  const toast = useToasts();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState<number | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      toast.system.tip('Ajoutez des photos de qualité pour attirer plus de clients');
    }, 1000);
  }, [toast]);

  async function getShopIdForUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.auth.sessionExpired();
        router.replace('/login');
        return null;
      }
      
      const { data, error } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();
        
      if (error || !data) {
        toast.system.serverError();
        router.replace('/onboarding');
        return null;
      }
      
      return data.id;
    } catch (error) {
      toast.system.networkError();
      return null;
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
    toast.info('Vidéo sélectionnée', 'La vidéo aidera vos clients à mieux voir le produit');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!name.trim()) {
        toast.product.validationError('Le nom du produit');
        setLoading(false);
        return;
      }

      if (!price || Number(price) <= 0) {
        toast.product.validationError('Le prix du produit');
        setLoading(false);
        return;
      }

      const shop_id = await getShopIdForUser();
      if (!shop_id) {
        setLoading(false);
        return;
      }

      let photo_path: string | null = null;
      let video_path: string | null = null;

      // Upload photo avec feedback
      if (photo) {
        setUploadingPhoto(true);
        toast.product.uploadStart();
        
        const photoStoragePath = `products/${Date.now()}_${photo.name}`;
        const { data, error } = await supabase.storage
          .from("shop-photos")
          .upload(photoStoragePath, photo, { cacheControl: "3600" });
          
        if (error) {
          console.error('Erreur upload photo:', error);
          toast.product.uploadError('Impossible d\'uploader la photo');
          setLoading(false);
          setUploadingPhoto(false);
          return;
        }
        
        photo_path = data?.path ?? null;
        setUploadingPhoto(false);
        toast.product.uploadSuccess();
      }

      // Upload vidéo avec feedback
      if (video) {
        setUploadingVideo(true);
        toast.info('Upload vidéo...', 'Téléchargement de votre vidéo en cours');
        
        const videoStoragePath = `products/${Date.now()}_${video.name}`;
        const { data, error } = await supabase.storage
          .from('product-videos')
          .upload(videoStoragePath, video, { cacheControl: "3600" });
          
        if (error) {
          console.error('Erreur upload vidéo:', error);
          toast.error('Upload vidéo échoué', 'Impossible d\'uploader la vidéo');
          setLoading(false);
          setUploadingVideo(false);
          return;
        }
        
        video_path = data?.path ?? null;
        setUploadingVideo(false);
        toast.success('Vidéo uploadée !', 'Votre vidéo a été sauvegardée');
      }

      // Ajout produit en BDD
      const { error: insertError } = await supabase
        .from("products")
        .insert([
          {
            shop_id,
            name: name.trim(),
            price: Number(price),
            description: description.trim() || null,
            stock: stock === "" ? null : Number(stock),
            photo_url: photo_path,
            video_url: video_path,
          },
        ]);
        
      if (insertError) {
        console.error('Erreur insertion produit:', insertError);
        toast.system.serverError();
        setLoading(false);
        return;
      }

      // Succès !
      toast.product.created(name.trim());
      
      // Reset form
      setName("");
      setPrice("");
      setStock("");
      setDescription("");
      setPhoto(null);
      setPhotoPreview(null);
      setVideo(null);
      setVideoPreview(null);

      // Conseils après ajout
      setTimeout(() => {
        if (!photo) {
          toast.system.tip('Pensez à ajouter une photo pour vos prochains produits');
        } else {
          toast.system.tip('Partagez ce produit avec vos clients sur WhatsApp !');
        }
      }, 2000);

      // Redirection avec délai
      setTimeout(() => {
        router.push("/products");
      }, 3000);

    } catch (err: any) {
      console.error('Erreur ajout produit:', err);
      toast.system.networkError();
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
      setUploadingVideo(false);
    }
  }

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    toast.info('Photo supprimée', 'Vous pouvez en sélectionner une autre');
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoPreview(null);
    toast.info('Vidéo supprimée', 'Vous pouvez en sélectionner une autre');
  };

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
                  Nouveau produit
                </h1>
                <p className="text-night-foreground/70 mt-2 font-medium">
                  Ajoutez un produit à votre catalogue
                </p>
              </div>
              
              <div className="w-24"></div>
            </div>
          </div>
        </header>

        {/* Enhanced Form */}
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
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
                <p className="text-xs text-night-foreground/60 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Une bonne description aide les clients à mieux comprendre votre produit
                </p>
              </div>
            </div>
          </div>

          {/* Media Section */}
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
              {/* Photo */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Photo du produit (recommandée)
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={uploadingPhoto}
                    className="w-full text-sm text-night-foreground/70 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white hover:file:from-blue-700 hover:file:to-purple-700 file:cursor-pointer file:transition-all file:duration-200 disabled:file:from-gray-600 disabled:file:to-gray-600"
                  />
                  
                  {photoPreview && (
                    <div className="relative inline-block group">
                      <img
                        src={photoPreview}
                        alt="Aperçu photo"
                        className="h-48 w-auto rounded-xl border-2 border-night-foreground/20 object-cover shadow-xl"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold transition-all duration-200 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  {uploadingPhoto && (
                    <div className="flex items-center gap-3 text-blue-400 bg-blue-900/20 rounded-xl p-4">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-medium">Upload de la photo en cours...</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-night-foreground/60 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Ajoutez une photo claire et attrayante (max 5MB)
                  </p>
                </div>
              </div>

              {/* Video */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Vidéo du produit (optionnel)
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    disabled={uploadingVideo}
                    className="w-full text-sm text-night-foreground/70 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:text-white hover:file:from-purple-700 hover:file:to-pink-700 file:cursor-pointer file:transition-all file:duration-200 disabled:file:from-gray-600 disabled:file:to-gray-600"
                  />
                  
                  {videoPreview && (
                    <div className="relative inline-block group">
                      <video
                        src={videoPreview}
                        controls
                        className="h-48 w-auto rounded-xl border-2 border-night-foreground/20 shadow-xl"
                      />
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold transition-all duration-200 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  {uploadingVideo && (
                    <div className="flex items-center gap-3 text-purple-400 bg-purple-900/20 rounded-xl p-4">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-medium">Upload de la vidéo en cours...</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-night-foreground/60 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    Montrez votre produit en action (max 50MB)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Preview */}
          {price && Number(price) > 0 && (
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-2xl p-6 backdrop-blur-sm">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Aperçu des informations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-night-foreground/80 font-medium">Prix de vente :</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {Number(price).toLocaleString()} FCFA
                  </span>
                </div>
                {stock && Number(stock) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-night-foreground/70">Stock disponible :</span>
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
              disabled={loading || !name || price === "" || uploadingPhoto || uploadingVideo}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Ajout en cours...</span>
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Ajouter le produit
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}