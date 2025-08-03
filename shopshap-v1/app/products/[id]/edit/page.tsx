'use client';

import { useState, useEffect, useCallback } from "react";
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
  category?: string;
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

// ✨ Enhanced Loading Skeleton
function EditProductSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8">
      {/* Header Skeleton */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded mb-4"></div>
        <div className="h-12 bg-slate-700/50 rounded w-2/3"></div>
      </div>
      
      {/* Form Sections Skeleton */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 animate-pulse">
          <div className="h-6 bg-slate-700/50 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-slate-700/30 rounded w-1/4"></div>
            <div className="h-12 bg-slate-700/30 rounded"></div>
            <div className="h-4 bg-slate-700/30 rounded w-1/4"></div>
            <div className="h-12 bg-slate-700/30 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ✨ Enhanced File Upload Zone Component
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
      className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${
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

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToasts();
  const productId = params.id as string;

  // ✨ Enhanced State Management
  const [product, setProduct] = useState<Product | null>(null);
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
  
  const [currentMedia, setCurrentMedia] = useState({
    photoUrl: null as string | null,
    videoUrl: null as string | null,
  });
  
  const [uploadStates, setUploadStates] = useState({
    photo: false,
    video: false,
  });
  
  const [dragStates, setDragStates] = useState({
    photo: false,
    video: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (product && !loading) {
      setTimeout(() => {
        toast.info('Mode édition', 'Modifiez les informations et sauvegardez pour mettre à jour votre produit');
      }, 1000);
    }
  }, [product, loading, toast]);

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

  async function fetchProduct() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Session expirée', 'Veuillez vous reconnecter');
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
      setFormData({
        name: productData.name,
        price: productData.price,
        description: productData.description || "",
        stock: productData.stock || "",
        category: productData.category || "",
      });

      // ✨ Enhanced media URL generation
      if (productData.photo_url) {
        const { data: photoData } = await supabase.storage
          .from('shop-photos')
          .createSignedUrl(productData.photo_url, 60 * 60);
        setCurrentMedia(prev => ({ ...prev, photoUrl: photoData?.signedUrl || null }));
      }

      if (productData.video_url) {
        const { data: videoData } = await supabase.storage
          .from('product-videos')
          .createSignedUrl(productData.video_url, 60 * 60);
        setCurrentMedia(prev => ({ ...prev, videoUrl: videoData?.signedUrl || null }));
      }

    } catch (err: any) {
      console.error('Erreur chargement produit:', err);
      toast.error('Erreur réseau', 'Vérifiez votre connexion internet');
    } finally {
      setLoading(false);
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
    toast.success('Nouvelle photo sélectionnée', 'La photo sera mise à jour lors de la sauvegarde');
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
    toast.success('Nouvelle vidéo sélectionnée', 'Parfait pour TikTok - sera mise à jour lors de la sauvegarde');
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
      let photo_url = product?.photo_url;
      let video_url = product?.video_url;

      // ✨ Enhanced photo upload with progress
      if (files.photo) {
        setUploadStates(prev => ({ ...prev, photo: true }));
        toast.info('Upload photo...', 'Téléchargement de votre nouvelle photo en cours');
        
        // Remove old photo if exists
        if (product?.photo_url) {
          await supabase.storage
            .from('shop-photos')
            .remove([product.photo_url]);
        }

        const photoPath = `products/${Date.now()}_${files.photo.name}`;
        const { data, error } = await supabase.storage
          .from('shop-photos')
          .upload(photoPath, files.photo, { cacheControl: "3600" });
        
        if (error) {
          console.error('Erreur upload photo:', error);
          toast.error('Erreur upload', 'Impossible de télécharger la nouvelle photo');
          setSaving(false);
          setUploadStates(prev => ({ ...prev, photo: false }));
          return;
        }
        
        photo_url = data?.path ?? null;
        setUploadStates(prev => ({ ...prev, photo: false }));
        toast.success('Photo mise à jour !', 'Nouvelle image sauvegardée avec succès');
      }

      // ✨ Enhanced video upload with progress
      if (files.video) {
        setUploadStates(prev => ({ ...prev, video: true }));
        toast.info('Upload vidéo...', 'Téléchargement de votre nouvelle vidéo TikTok en cours');
        
        // Remove old video if exists
        if (product?.video_url) {
          await supabase.storage
            .from('product-videos')
            .remove([product.video_url]);
        }

        const videoPath = `products/${Date.now()}_${files.video.name}`;
        const { data, error } = await supabase.storage
          .from('product-videos')
          .upload(videoPath, files.video, { cacheControl: "3600" });
        
        if (error) {
          console.error('Erreur upload vidéo:', error);
          toast.error('Erreur upload', 'Impossible de télécharger la nouvelle vidéo');
          setSaving(false);
          setUploadStates(prev => ({ ...prev, video: false }));
          return;
        }
        
        video_url = data?.path ?? null;
        setUploadStates(prev => ({ ...prev, video: false }));
        toast.success('Vidéo mise à jour !', 'Parfait pour vos posts TikTok !');
      }

      // ✨ Enhanced database update
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          price: Number(formData.price),
          description: formData.description.trim() || null,
          stock: formData.stock === "" ? null : Number(formData.stock),
          category: formData.category.trim() || null,
          photo_url,
          video_url,
        })
        .eq('id', productId);

      if (updateError) {
        console.error('Erreur mise à jour:', updateError);
        toast.error('Erreur sauvegarde', 'Impossible de mettre à jour le produit');
        setSaving(false);
        return;
      }

      // ✨ Enhanced success flow
      toast.success('Produit mis à jour !', `"${formData.name}" a été modifié avec succès`);
      
      // ✨ Smart tips based on changes made
      setTimeout(() => {
        if (files.photo && files.video) {
          toast.info('Excellent ! 🚀', 'Votre produit avec photo et vidéo va cartonner sur TikTok et WhatsApp !');
        } else if (files.photo) {
          toast.info('Belle mise à jour ! 📸', 'Votre nouvelle photo va attirer plus de clients WhatsApp !');
        } else if (files.video) {
          toast.info('Super vidéo ! 🎥', 'Parfait pour booster vos ventes TikTok !');
        } else {
          toast.info('Mise à jour réussie ✨', 'Vos clients verront les modifications immédiatement');
        }
      }, 2000);

      // ✨ Redirect with delay for user to see success
      setTimeout(() => {
        router.push('/products');
      }, 3000);

    } catch (err: any) {
      console.error('Erreur mise à jour produit:', err);
      toast.error('Erreur inattendue', 'Une erreur est survenue, veuillez réessayer');
    } finally {
      setSaving(false);
      setUploadStates({ photo: false, video: false });
    }
  }

  // ✨ Enhanced delete handler
  async function handleDelete() {
    if (!product) return;
    
    setDeleting(true);
    try {
      // Remove media files first
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
        toast.error('Erreur suppression', 'Impossible de supprimer le produit');
        setDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }

      toast.success('Produit supprimé', `"${product.name}" a été retiré de votre catalogue`);
      
      setTimeout(() => {
        toast.info('Conseil 💡', 'N\'oubliez pas d\'informer vos clients de cette suppression sur WhatsApp');
      }, 2000);

      setTimeout(() => {
        router.push('/products');
      }, 3000);

    } catch (err: any) {
      console.error('Erreur suppression produit:', err);
      toast.error('Erreur inattendue', 'Une erreur est survenue lors de la suppression');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // ✨ Enhanced media removal functions
  async function removeCurrentMedia(type: 'photo' | 'video') {
    const mediaUrl = type === 'photo' ? product?.photo_url : product?.video_url;
    if (!mediaUrl) return;
    
    try {
      await supabase.storage
        .from(type === 'photo' ? 'shop-photos' : 'product-videos')
        .remove([mediaUrl]);

      const updateField = type === 'photo' ? { photo_url: null } : { video_url: null };
      const { error } = await supabase
        .from('products')
        .update(updateField)
        .eq('id', productId);

      if (error) {
        console.error(`Erreur suppression ${type}:`, error);
        toast.error('Erreur suppression', `Impossible de supprimer la ${type}`);
        return;
      }

      if (type === 'photo') {
        setCurrentMedia(prev => ({ ...prev, photoUrl: null }));
        setProduct(prev => prev ? { ...prev, photo_url: null } : null);
        toast.success('Photo supprimée', 'La photo a été retirée du produit');
      } else {
        setCurrentMedia(prev => ({ ...prev, videoUrl: null }));
        setProduct(prev => prev ? { ...prev, video_url: null } : null);
        toast.success('Vidéo supprimée', 'La vidéo a été retirée du produit');
      }
    } catch (err) {
      console.error(`Erreur suppression ${type}:`, err);
      toast.error('Erreur inattendue', `Impossible de supprimer la ${type}`);
    }
  }

  // ✨ Enhanced file removal
  const removeNewFile = (type: 'photo' | 'video') => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setPreviews(prev => ({ ...prev, [type]: null }));
    toast.info(`${type === 'photo' ? 'Photo' : 'Vidéo'} annulée`, 'Vous pouvez en sélectionner une autre');
  };

  const handleNavigation = (route: string) => {
    setActiveTab(route);
    router.push(route);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950 p-4">
        <EditProductSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Produit introuvable</h3>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Ce produit n'existe pas ou vous n'y avez pas accès. Il a peut-être été supprimé ou vous n'en êtes pas le propriétaire.
          </p>
          <button
            onClick={() => router.push('/products')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/25 active:scale-95"
          >
            Retour au catalogue
          </button>
        </div>
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
                <span className="text-sm font-medium">Retour</span>
              </button>
              
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                </svg>
                <span className="text-purple-400 font-medium">Modification</span>
              </div>
              
              <button
                onClick={() => {
                  toast.warning('Suppression de produit', 'Confirmez pour supprimer définitivement ce produit');
                  setTimeout(() => setShowDeleteConfirm(true), 1000);
                }}
                className="ml-auto flex items-center gap-2 text-red-400 hover:text-red-300 transition-all duration-300 bg-red-900/20 hover:bg-red-900/30 px-3 py-2 rounded-lg border border-red-800/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                <span className="text-sm font-medium">Supprimer</span>
              </button>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </div>
                Modifier le produit
              </h1>
              <p className="text-slate-400 text-lg">
                Mettez à jour "{product.name}" pour votre catalogue TikTok & WhatsApp
              </p>
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
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
              {/* ✨ Enhanced Photo Section */}
              <div className="space-y-6">
                <FormInput 
                  label="Photo du produit" 
                  helpText="Photo de qualité = plus de ventes WhatsApp !"
                >
                  <div className="space-y-4">
                    {/* Current Photo Display */}
                    {currentMedia.photoUrl && !previews.photo && (
                      <div className="relative group">
                        <img
                          src={currentMedia.photoUrl}
                          alt="Photo actuelle"
                          className="h-48 w-full object-cover rounded-xl shadow-xl border-2 border-slate-600/50"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl"></div>
                        <button
                          type="button"
                          onClick={() => removeCurrentMedia('photo')}
                          className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-600 text-white rounded-xl w-8 h-8 flex items-center justify-center font-bold transition-all duration-300 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                        <span className="absolute bottom-3 left-3 bg-slate-900/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Photo actuelle
                        </span>
                      </div>
                    )}

                    {/* New Photo Upload */}
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
                          {dragStates.photo ? 'Déposez la nouvelle photo ici' : 'Cliquez ou glissez une nouvelle photo'}
                        </p>
                        <p className="text-slate-400 text-sm">
                          JPG, PNG jusqu'à 5MB - Remplacera la photo actuelle
                        </p>
                      </div>
                    </FileUploadZone>
                    
                    {/* New Photo Preview */}
                    {previews.photo && (
                      <div className="relative group">
                        <img
                          src={previews.photo}
                          alt="Nouvelle photo"
                          className="h-48 w-full object-cover rounded-xl shadow-xl border-2 border-emerald-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewFile('photo')}
                          className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-600 text-white rounded-xl w-8 h-8 flex items-center justify-center font-bold transition-all duration-300 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                        <span className="absolute bottom-3 left-3 bg-emerald-600/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                          ✓ Nouvelle photo
                        </span>
                      </div>
                    )}
                    
                    {/* Photo Upload Status */}
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
                </FormInput>
              </div>

              {/* ✨ Enhanced Video Section */}
              <div className="space-y-6">
                <FormInput 
                  label="Vidéo du produit" 
                  helpText="Parfait pour vos contenus TikTok !"
                >
                  <div className="space-y-4">
                    {/* Current Video Display */}
                    {currentMedia.videoUrl && !previews.video && (
                      <div className="relative group">
                        <video
                          src={currentMedia.videoUrl}
                          controls
                          className="h-48 w-full rounded-xl shadow-xl border-2 border-slate-600/50"
                        />
                        <button
                          type="button"
                          onClick={() => removeCurrentMedia('video')}
                          className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-600 text-white rounded-xl w-8 h-8 flex items-center justify-center font-bold transition-all duration-300 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                        <span className="absolute bottom-3 left-3 bg-slate-900/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Vidéo actuelle
                        </span>
                      </div>
                    )}

                    {/* New Video Upload */}
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
                          {dragStates.video ? 'Déposez la nouvelle vidéo ici' : 'Cliquez ou glissez une nouvelle vidéo'}
                        </p>
                        <p className="text-slate-400 text-sm">
                          MP4, MOV jusqu'à 50MB - Remplacera la vidéo actuelle
                        </p>
                      </div>
                    </FileUploadZone>
                    
                    {/* New Video Preview */}
                    {previews.video && (
                      <div className="relative group">
                        <video
                          src={previews.video}
                          controls
                          className="h-48 w-full rounded-xl shadow-xl border-2 border-emerald-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewFile('video')}
                          className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-600 text-white rounded-xl w-8 h-8 flex items-center justify-center font-bold transition-all duration-300 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                        <span className="absolute bottom-3 left-3 bg-emerald-600/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                          ✓ Nouvelle vidéo TikTok
                        </span>
                      </div>
                    )}
                    
                    {/* Video Upload Status */}
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
                </FormInput>
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
                Aperçu des modifications
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-4 bg-slate-800/30 rounded-xl">
                  <span className="text-slate-400 font-medium mb-2">Nouveau prix</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                    {Number(formData.price).toLocaleString()} FCFA
                  </span>
                  {product && Number(formData.price) !== product.price && (
                    <span className="text-xs text-amber-400 mt-1">
                      Ancien: {product.price.toLocaleString()} FCFA
                    </span>
                  )}
                </div>
                
                {formData.stock !== "" && Number(formData.stock) >= 0 && (
                  <div className="flex flex-col items-center p-4 bg-slate-800/30 rounded-xl">
                    <span className="text-slate-400 font-medium mb-2">Nouveau stock</span>
                    <span className="text-emerald-400 font-bold text-xl">{Number(formData.stock)} unité(s)</span>
                    {product && Number(formData.stock) !== (product.stock || 0) && (
                      <span className="text-xs text-amber-400 mt-1">
                        Ancien: {product.stock || 0} unité(s)
                      </span>
                    )}
                  </div>
                )}
                
                {formData.category && (
                  <div className="flex flex-col items-center p-4 bg-slate-800/30 rounded-xl">
                    <span className="text-slate-400 font-medium mb-2">Catégorie</span>
                    <span className="text-purple-400 font-bold">{formData.category}</span>
                    {product && formData.category !== (product.category || '') && (
                      <span className="text-xs text-amber-400 mt-1">
                        {product.category ? `Ancien: ${product.category}` : 'Nouvelle catégorie'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {(files.photo || files.video || previews.photo || previews.video) && (
                <div className="mt-6 p-4 bg-emerald-900/20 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Médias mis à jour: 
                    {(files.photo || previews.photo) && ' Nouvelle photo'}
                    {(files.photo || previews.photo) && (files.video || previews.video) && ' +'}
                    {(files.video || previews.video) && ' Nouvelle vidéo'}
                    - Optimisé pour TikTok et WhatsApp !
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
              Annuler les modifications
            </button>
            
            <button
              type="submit"
              disabled={saving || !formData.name || formData.price === "" || uploadStates.photo || uploadStates.video}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 min-h-[56px] flex items-center justify-center gap-3"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sauvegarde en cours...</span>
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Sauvegarder les modifications</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ✨ Enhanced Footer */}
        <div className="text-center py-8 mt-12 border-t border-slate-700/50">
          <div className="text-slate-500 text-sm">
            <p>Connecté : <strong className="text-white">Sdiabate1337</strong></p>
            <p className="mt-1">2025-08-03 15:54:54 UTC</p>
            <p className="mt-2 text-xs text-slate-600">
              🚀 ShopShap v2.0 - Éditeur de produits avancé pour TikTok & WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* ✨ Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity duration-300"
            onClick={() => setShowDeleteConfirm(false)}
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
                  Êtes-vous sûr de vouloir supprimer <strong className="text-white">"{product?.name}"</strong> ?
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
                      <span>Le produit et toutes ses informations (nom, prix, description, stock)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Les photos et vidéos associées seront effacées du serveur</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Les liens partagés sur TikTok et WhatsApp ne fonctionneront plus</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Les commandes existantes garderont les informations, mais le produit ne sera plus modifiable</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 py-4 px-6 rounded-xl border border-slate-600/50 transition-all duration-300 font-bold hover:scale-105 active:scale-95 min-h-[56px] flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl transition-all duration-300 font-bold hover:scale-105 active:scale-95 shadow-xl hover:shadow-red-600/25 min-h-[56px] flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Suppression en cours...
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
        </>
      )}

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}