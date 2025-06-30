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

export default function AddProductPage() {
  const toast = useToasts(); // ✅ Hook unifié
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
    // Message d'accueil après chargement
    setTimeout(() => {
      toast.system.tip('Ajoutez des photos de qualité pour attirer plus de clients');
    }, 1000);
  }, [toast]);

  // Récupère le shop_id du vendeur connecté
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
    toast.info('Vidéo sélectionnée', 'La vidéo aidera vos clients à mieux voir le produit');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Validations avec toasts spécifiques
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
          <h1 className="text-2xl font-bold">Ajouter un produit</h1>
          <div className="w-16"></div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Informations de base */}
          <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-6">
            <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
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
              <p className="text-xs text-night-foreground/60 mt-1">
                💡 Une bonne description aide les clients à mieux comprendre votre produit
              </p>
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

            {/* Photo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                Photo du produit (recommandée)
              </label>
              <div className="space-y-3">
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
                      alt="Aperçu photo"
                      className="h-40 w-auto rounded-lg border-2 border-night-foreground/20 object-cover shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
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
                <p className="text-xs text-night-foreground/60">
                  📷 Ajoutez une photo claire et attrayante (max 5MB)
                </p>
              </div>
            </div>

            {/* Vidéo */}
            <div>
              <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                Vidéo du produit (optionnel)
              </label>
              <div className="space-y-3">
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
                      className="h-40 w-auto rounded-lg border-2 border-night-foreground/20 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
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
                <p className="text-xs text-night-foreground/60">
                  🎥 Montrez votre produit en action (max 50MB)
                </p>
              </div>
            </div>
          </div>

          {/* Aperçu du prix */}
          {price && Number(price) > 0 && (
            <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-night-foreground/80 font-medium">Prix de vente :</span>
                <span className="text-green-400 font-bold text-xl">{Number(price).toLocaleString()} FCFA</span>
              </div>
              {stock && Number(stock) > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-night-foreground/70 text-sm">Stock disponible :</span>
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
              disabled={loading || !name || price === "" || uploadingPhoto || uploadingVideo}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-blue-600/50 disabled:to-green-600/50 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Ajout en cours...</span>
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Ajouter le produit
                </div>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}