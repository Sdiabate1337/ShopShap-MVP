'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';

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
    active: true,
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
    color: 'amber',
  },
];

// ✨ Enhanced Progress Indicator Component
function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-slate-400">Étape {currentStep} sur {totalSteps}</span>
        <span className="text-sm font-medium text-slate-400">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-slate-700/30 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

// ✨ Enhanced File Upload Component
function FileUploadZone({ 
  accept, 
  onChange, 
  disabled, 
  children, 
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop
}: {
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
  isDragOver?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
        isDragOver 
          ? 'border-purple-400 bg-purple-900/20' 
          : 'border-slate-600/50 hover:border-slate-500/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800/30'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      {children}
    </div>
  );
}

// ✨ Enhanced Input Component
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

export default function AddProductPage() {
  const toast = useToasts();
  const router = useRouter();
  
  // ✨ Enhanced State Management
  const [formData, setFormData] = useState({
    name: "",
    price: "" as number | "",
    description: "",
    stock: "" as number | "",
    category: "",
  });
  
  const [files, setFiles] = useState({
    photo: null as File | null,
    video: null as File | null,
  });
  
  const [previews, setPreviews] = useState({
    photo: null as string | null,
    video: null as string | null,
  });
  
  const [uploadStates, setUploadStates] = useState({
    photo: false,
    video: false,
  });
  
  const [dragStates, setDragStates] = useState({
    photo: false,
    video: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('/products');
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
    // ✨ Enhanced initial tip
    setTimeout(() => {
      toast.info('Conseil 💡', 'Ajoutez des photos de qualité pour attirer plus de clients TikTok et WhatsApp');
    }, 1500);
  }, [toast]);

  // ✨ Enhanced form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }

    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = 'Le prix doit être supérieur à 0';
    }

    if (formData.stock !== "" && Number(formData.stock) < 0) {
      newErrors.stock = 'Le stock ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✨ Enhanced shop ID fetcher
  async function getShopIdForUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Session expirée', 'Veuillez vous reconnecter');
        router.replace('/login');
        return null;
      }
      
      const { data, error } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();
        
      if (error || !data) {
        toast.error('Erreur', 'Impossible de trouver votre boutique');
        router.replace('/onboarding');
        return null;
      }
      
      return data.id;
    } catch (error) {
      toast.error('Erreur réseau', 'Vérifiez votre connexion internet');
      return null;
    }
  }

  // ✨ Enhanced file handlers with drag & drop
  const handleDragOver = (e: React.DragEvent, type: 'photo' | 'video') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, type: 'photo' | 'video') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e: React.DragEvent, type: 'photo' | 'video') => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: false }));
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const file = droppedFiles[0];
    
    if (file) {
      if (type === 'photo') {
        handlePhotoChange({ target: { files: [file] } } as any);
      } else {
        handleVideoChange({ target: { files: [file] } } as any);
      }
    }
  };

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    
    if (!file) return;

    // ✨ Enhanced validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux', 'La photo ne doit pas dépasser 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Format invalide', 'Veuillez sélectionner une image (JPG, PNG, etc.)');
      return;
    }

    setFiles(prev => ({ ...prev, photo: file }));
    setPreviews(prev => ({ ...prev, photo: URL.createObjectURL(file) }));
    toast.success('Photo sélectionnée', 'Image ajoutée avec succès');
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    
    if (!file) return;

    // ✨ Enhanced validation
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Vidéo trop volumineuse', 'La vidéo ne doit pas dépasser 50MB');
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast.error('Format invalide', 'Veuillez sélectionner une vidéo (MP4, MOV, etc.)');
      return;
    }

    setFiles(prev => ({ ...prev, video: file }));
    setPreviews(prev => ({ ...prev, video: URL.createObjectURL(file) }));
    toast.success('Vidéo sélectionnée', 'Vidéo ajoutée avec succès - parfait pour TikTok !');
  }

  // ✨ Enhanced submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Formulaire invalide', 'Veuillez corriger les erreurs');
      return;
    }

    setLoading(true);

    try {
      const shop_id = await getShopIdForUser();
      if (!shop_id) {
        setLoading(false);
        return;
      }

      let photo_path: string | null = null;
      let video_path: string | null = null;

      // ✨ Enhanced photo upload with progress
      if (files.photo) {
        setUploadStates(prev => ({ ...prev, photo: true }));
        toast.info('Upload photo...', 'Téléchargement en cours');
        
        const photoStoragePath = `products/${Date.now()}_${files.photo.name}`;
        const { data, error } = await supabase.storage
          .from("shop-photos")
          .upload(photoStoragePath, files.photo, { cacheControl: "3600" });
          
        if (error) {
          console.error('Erreur upload photo:', error);
          toast.error('Erreur upload', 'Impossible de télécharger la photo');
          setLoading(false);
          setUploadStates(prev => ({ ...prev, photo: false }));
          return;
        }
        
        photo_path = data?.path ?? null;
        setUploadStates(prev => ({ ...prev, photo: false }));
        toast.success('Photo uploadée !', 'Image sauvegardée avec succès');
      }

      // ✨ Enhanced video upload with progress
      if (files.video) {
        setUploadStates(prev => ({ ...prev, video: true }));
        toast.info('Upload vidéo...', 'Téléchargement de votre vidéo TikTok en cours');
        
        const videoStoragePath = `products/${Date.now()}_${files.video.name}`;
        const { data, error } = await supabase.storage
          .from('product-videos')
          .upload(videoStoragePath, files.video, { cacheControl: "3600" });
          
        if (error) {
          console.error('Erreur upload vidéo:', error);
          toast.error('Erreur upload', 'Impossible de télécharger la vidéo');
          setLoading(false);
          setUploadStates(prev => ({ ...prev, video: false }));
          return;
        }
        
        video_path = data?.path ?? null;
        setUploadStates(prev => ({ ...prev, video: false }));
        toast.success('Vidéo uploadée !', 'Parfait pour vos posts TikTok !');
      }

      // ✨ Enhanced database insertion
      const { error: insertError } = await supabase
        .from("products")
        .insert([
          {
            shop_id,
            name: formData.name.trim(),
            price: Number(formData.price),
            description: formData.description.trim() || null,
            stock: formData.stock === "" ? null : Number(formData.stock),
            category: formData.category.trim() || null,
            photo_url: photo_path,
            video_url: video_path,
          },
        ]);
        
      if (insertError) {
        console.error('Erreur insertion produit:', insertError);
        toast.error('Erreur sauvegarde', 'Impossible de créer le produit');
        setLoading(false);
        return;
      }

      // ✨ Enhanced success flow
      toast.success('Produit créé !', `"${formData.name}" a été ajouté à votre catalogue`);
      
      // ✨ Smart tips based on what user added
      setTimeout(() => {
        if (files.photo && files.video) {
          toast.info('Conseils de vente 🚀', 'Partagez ce produit avec photo et vidéo sur TikTok pour maximiser vos ventes !');
        } else if (files.photo) {
          toast.info('Conseils de vente 📸', 'Votre photo de qualité va attirer plus de clients WhatsApp !');
        } else {
          toast.info('Conseil 💡', 'Ajoutez une photo lors de la modification pour augmenter vos ventes');
        }
      }, 2000);

      // ✨ Reset form
      setFormData({
        name: "",
        price: "",
        description: "",
        stock: "",
        category: "",
      });
      setFiles({ photo: null, video: null });
      setPreviews({ photo: null, video: null });
      setErrors({});

      // ✨ Redirect with delay for user to see success
      setTimeout(() => {
        router.push("/products");
      }, 3000);

    } catch (err: any) {
      console.error('Erreur ajout produit:', err);
      toast.error('Erreur inattendue', 'Une erreur est survenue, veuillez réessayer');
    } finally {
      setLoading(false);
      setUploadStates({ photo: false, video: false });
    }
  }

  // ✨ Enhanced file removal
  const removeFile = (type: 'photo' | 'video') => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setPreviews(prev => ({ ...prev, [type]: null }));
    toast.info(`${type === 'photo' ? 'Photo' : 'Vidéo'} supprimée`, 'Vous pouvez en sélectionner une autre');
  };

  const handleNavigation = (route: string) => {
    setActiveTab(route);
    router.push(route);
  };

  const currentStep = files.photo ? (files.video ? 3 : 2) : 1;
  const totalSteps = 3;

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
                Êtes-vous sûr de vouloir vous déconnecter ? Vos modifications en cours seront perdues.
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
                <span className="text-sm font-medium">Catalogue</span>
              </button>
              
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                </svg>
                <span className="text-purple-400 font-medium">Nouveau produit</span>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
                Ajouter un produit
              </h1>
              <p className="text-slate-400 text-lg">
                Créez un nouveau produit pour votre catalogue TikTok & WhatsApp
              </p>
            </div>

            {/* ✨ Progress Indicator */}
            <div className="mt-8">
              <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
            </div>
          </div>
        </header>

        {/* ✨ Enhanced Form */}
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* ✨ Basic Information Section */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              Informations du produit
            </h3>

            <div className="space-y-6">
              {/* Product Name */}
              <FormInput 
                label="Nom du produit" 
                required 
                error={errors.name}
                helpText="Utilisez un nom clair et attractif pour vos clients TikTok"
              >
                <input
                  type="text"
                  placeholder="Ex: Robe wax africaine taille M"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full bg-slate-700/30 border-2 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                    errors.name 
                      ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                      : 'border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                  }`}
                />
              </FormInput>

              {/* Price and Stock Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormInput 
                  label="Prix de vente" 
                  required 
                  error={errors.price}
                  helpText="Prix attractif pour vos clients WhatsApp"
                >
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      placeholder="15000"
                      value={formData.price}
                      onChange={e => setFormData(prev => ({ ...prev, price: e.target.value === "" ? "" : Number(e.target.value) }))}
                      className={`w-full bg-slate-700/30 border-2 rounded-xl px-4 py-4 pr-20 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                        errors.price 
                          ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                          : 'border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                      }`}
                    />
                    <span className="absolute right-4 top-4 text-slate-400 font-semibold">FCFA</span>
                  </div>
                </FormInput>
                
                <FormInput 
                  label="Stock disponible" 
                  error={errors.stock}
                  helpText="Optionnel - gérez votre inventaire facilement"
                >
                  <input
                    type="number"
                    min={0}
                    placeholder="10"
                    value={formData.stock}
                    onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className={`w-full bg-slate-700/30 border-2 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                      errors.stock 
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' 
                        : 'border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                    }`}
                  />
                </FormInput>
              </div>

              {/* Category */}
              <FormInput 
                label="Catégorie" 
                helpText="Aidez vos clients à mieux trouver votre produit"
              >
                <input
                  type="text"
                  placeholder="Ex: Mode, Beauté, Accessoires..."
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-slate-700/30 border-2 border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300"
                />
              </FormInput>

              {/* Description */}
              <FormInput 
                label="Description détaillée" 
                helpText="Décrivez votre produit pour rassurer vos acheteurs"
              >
                <textarea
                  placeholder="Matière, taille, couleur, qualité, conseils d'utilisation..."
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-slate-700/30 border-2 border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 resize-none"
                />
              </FormInput>
            </div>
          </div>

          {/* ✨ Enhanced Media Section */}
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              Photos et vidéos
              <span className="text-sm bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded-full">Boost ventes</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ✨ Enhanced Photo Upload */}
              <div className="space-y-4">
                <FormInput 
                  label="Photo du produit" 
                  helpText="Photo de qualité = plus de ventes WhatsApp !"
                >
                  <FileUploadZone
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={uploadStates.photo}
                    isDragOver={dragStates.photo}
                    onDragOver={(e) => handleDragOver(e, 'photo')}
                    onDragLeave={(e) => handleDragLeave(e, 'photo')}
                    onDrop={(e) => handleDrop(e, 'photo')}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                      </div>
                      <p className="text-white font-semibold mb-2">
                        {dragStates.photo ? 'Déposez la photo ici' : 'Cliquez ou glissez une photo'}
                      </p>
                      <p className="text-slate-400 text-sm">
                        JPG, PNG jusqu'à 5MB
                      </p>
                    </div>
                  </FileUploadZone>
                </FormInput>
                  
                {previews.photo && (
                  <div className="relative inline-block group">
                    <img
                      src={previews.photo}
                      alt="Aperçu photo"
                      className="h-48 w-full rounded-xl border-2 border-slate-600/50 object-cover shadow-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile('photo')}
                      className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-600 text-white rounded-xl w-8 h-8 flex items-center justify-center font-bold transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                )}
                
                {uploadStates.photo && (
                  <div className="flex items-center gap-3 text-blue-400 bg-blue-900/20 rounded-xl p-4 backdrop-blur-sm">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-semibold">Upload de la photo en cours...</span>
                  </div>
                )}
              </div>

              {/* ✨ Enhanced Video Upload */}
              <div className="space-y-4">
                <FormInput 
                  label="Vidéo du produit" 
                  helpText="Parfait pour vos contenus TikTok !"
                >
                  <FileUploadZone
                    accept="video/*"
                    onChange={handleVideoChange}
                    disabled={uploadStates.video}
                    isDragOver={dragStates.video}
                    onDragOver={(e) => handleDragOver(e, 'video')}
                    onDragLeave={(e) => handleDragLeave(e, 'video')}
                    onDrop={(e) => handleDrop(e, 'video')}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <p className="text-white font-semibold mb-2">
                        {dragStates.video ? 'Déposez la vidéo ici' : 'Cliquez ou glissez une vidéo'}
                      </p>
                      <p className="text-slate-400 text-sm">
                        MP4, MOV jusqu'à 50MB
                      </p>
                    </div>
                  </FileUploadZone>
                </FormInput>
                  
                {previews.video && (
                  <div className="relative inline-block group">
                    <video
                      src={previews.video}
                      controls
                      className="h-48 w-full rounded-xl border-2 border-slate-600/50 shadow-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile('video')}
                      className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-600 text-white rounded-xl w-8 h-8 flex items-center justify-center font-bold transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                )}
                
                {uploadStates.video && (
                  <div className="flex items-center gap-3 text-purple-400 bg-purple-900/20 rounded-xl p-4 backdrop-blur-sm">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-semibold">Upload de la vidéo en cours...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✨ Enhanced Preview Section */}
          {formData.price && Number(formData.price) > 0 && (
            <div className="bg-gradient-to-r from-emerald-900/20 via-blue-900/20 to-purple-900/20 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm">
              <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </div>
                Aperçu du produit
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-4 bg-slate-800/30 rounded-xl">
                  <span className="text-slate-400 font-medium mb-2">Prix de vente</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                    {Number(formData.price).toLocaleString()} FCFA
                  </span>
                </div>
                
                {formData.stock && Number(formData.stock) > 0 && (
                  <div className="flex flex-col items-center p-4 bg-slate-800/30 rounded-xl">
                    <span className="text-slate-400 font-medium mb-2">Stock disponible</span>
                    <span className="text-emerald-400 font-bold text-xl">{Number(formData.stock)} unité(s)</span>
                  </div>
                )}
                
                {formData.category && (
                  <div className="flex flex-col items-center p-4 bg-slate-800/30 rounded-xl">
                    <span className="text-slate-400 font-medium mb-2">Catégorie</span>
                    <span className="text-purple-400 font-bold">{formData.category}</span>
                  </div>
                )}
              </div>
              
              {(files.photo || files.video) && (
                <div className="mt-6 p-4 bg-emerald-900/20 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Médias ajoutés: 
                    {files.photo && ' Photo'}
                    {files.photo && files.video && ' +'}
                    {files.video && ' Vidéo'}
                    - Parfait pour TikTok et WhatsApp !
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={loading || !formData.name || formData.price === "" || uploadStates.photo || uploadStates.video}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 min-h-[56px] flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Création en cours...</span>
                </>
              ) : uploadStates.photo || uploadStates.video ? (
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
                  <span>Créer le produit</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ✨ Enhanced Footer */}
        <div className="text-center py-8 mt-12 border-t border-slate-700/50">
          <div className="text-slate-500 text-sm">
            <p>Connecté : <strong className="text-white">Sdiabate1337</strong></p>
            <p className="mt-1">2025-08-03 15:26:55 UTC</p>
            <p className="mt-2 text-xs text-slate-600">
              🚀 ShopShap v2.0 - Créateur de produits optimisé TikTok & WhatsApp
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}