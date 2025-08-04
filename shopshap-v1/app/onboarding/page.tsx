'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useToasts } from '@/hooks/useToast';

// ✨ Enhanced Types
interface FormData {
  name: string;
  activity: string;
  city: string;
  photo: File | null;
  description: string;
  slug: string;
}

interface ValidationErrors {
  name?: string;
  activity?: string;
  city?: string;
  photo?: string;
  slug?: string;
}

interface UserData {
  id?: string;
  phone?: string;
  email?: string;
  country?: string;
  whatsapp_verified?: boolean;
  verification_method?: string;
}

// ✨ Activity Suggestions
const popularActivities = [
  { icon: '👗', name: 'Mode & Vêtements' },
  { icon: '💄', name: 'Beauté & Cosmétiques' },
  { icon: '📱', name: 'Électronique & Tech' },
  { icon: '🍽️', name: 'Alimentation & Boissons' },
  { icon: '🏠', name: 'Maison & Décoration' },
  { icon: '⚽', name: 'Sport & Loisirs' },
  { icon: '📚', name: 'Éducation & Livres' },
  { icon: '🎨', name: 'Art & Artisanat' },
];

// ✨ City Suggestions
const popularCities = [
  { country: '🇸🇳', name: 'Dakar' },
  { country: '🇨🇮', name: 'Abidjan' },
  { country: '🇲🇱', name: 'Bamako' },
  { country: '🇧🇫', name: 'Ouagadougou' },
  { country: '🇳🇪', name: 'Niamey' },
  { country: '🇹🇩', name: 'N\'Djamena' },
  { country: '🇲🇦', name: 'Casablanca' },
  { country: '🇹🇳', name: 'Tunis' },
];

// ✨ Modern Loading Component
function ModernLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      <div className="relative">
        {/* Animated rings */}
        <div className="w-24 h-24 border-4 border-blue-200/20 rounded-full animate-pulse"></div>
        <div className="absolute inset-2 w-20 h-20 border-4 border-blue-400/40 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-4 w-16 h-16 border-4 border-purple-400/40 border-t-purple-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '2s'}}></div>
        
        {/* Center shop icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
        <p className="text-white/90 text-xl font-semibold">Préparation de votre espace</p>
        <p className="text-white/60 text-sm">Configuration de votre boutique en cours...</p>
      </div>
    </div>
  );
}

// ✨ Enhanced Progress Bar
function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="relative mt-8">
      <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden border border-slate-700/50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transition-all duration-700 ease-out relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex justify-between text-xs mt-3">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i + 1 <= currentStep 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg' 
                : 'bg-slate-700/50'
            }`}></div>
            <span className={`mt-2 font-medium ${
              i + 1 <= currentStep ? 'text-blue-400' : 'text-slate-500'
            }`}>
              {i === 0 ? 'Infos' : i === 1 ? 'Lieu' : 'Style'}
            </span>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-4">
        <span className="text-slate-400 text-sm">Étape </span>
        <span className="text-white font-bold">{currentStep}</span>
        <span className="text-slate-400 text-sm"> sur {totalSteps}</span>
      </div>
    </div>
  );
}

// ✨ Enhanced Photo Upload Component
function PhotoUploadZone({ photoPreview, onFileChange, onRemove, errors }: {
  photoPreview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  errors: ValidationErrors;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const fakeEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>;
      onFileChange(fakeEvent);
    }
  };

  return (
    <div className="text-center space-y-4">
      <div className="relative inline-block">
        <div 
          className={`w-40 h-40 border-2 border-dashed rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
            isDragging 
              ? 'border-blue-500 bg-blue-500/10 scale-105' 
              : photoPreview 
              ? 'border-slate-600/50 bg-slate-800/30' 
              : 'border-slate-600/50 bg-slate-800/20 hover:border-blue-400/50 hover:bg-slate-800/40'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {photoPreview ? (
            <div className="relative w-full h-full group">
              <img 
                src={photoPreview} 
                alt="Aperçu" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button
                  type="button"
                  onClick={onRemove}
                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Ajoutez une photo</p>
                <p className="text-slate-400 text-xs">Glissez ou cliquez pour choisir</p>
              </div>
            </div>
          )}
        </div>
        
        {!photoPreview && (
          <label className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-2xl cursor-pointer transition-all duration-300 shadow-xl hover:scale-110 active:scale-95">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
      
      <div className="space-y-2">
        <p className="text-slate-400 text-sm">
          Une belle photo inspire confiance à vos clients
        </p>
        <p className="text-slate-500 text-xs">
          JPG, PNG • Max 5MB • Recommandé: 400x400px
        </p>
        {errors.photo && (
          <p className="text-red-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {errors.photo}
          </p>
        )}
      </div>
    </div>
  );
}

// ✨ Enhanced Input Field Component
function EnhancedInput({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  error, 
  required = false,
  suggestions = [],
  onSuggestionClick 
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  suggestions?: any[];
  onSuggestionClick?: (suggestion: string) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const hasValue = value.trim().length > 0;
  
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      
      <div className="relative">
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className={`w-full bg-slate-800/40 backdrop-blur-xl border-2 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
            error 
              ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 focus:bg-red-900/10'
              : hasValue && !error
              ? 'border-green-500/50 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 focus:bg-green-900/10'
              : 'border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-700/30'
          }`}
        />
        
        {/* Success Indicator */}
        {hasValue && !error && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
        )}
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-10 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onSuggestionClick?.(suggestion.name || suggestion);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-6 py-3 hover:bg-slate-700/50 transition-colors duration-200 flex items-center gap-3 first:rounded-t-2xl last:rounded-b-2xl"
              >
                {suggestion.icon && <span className="text-lg">{suggestion.icon}</span>}
                {suggestion.country && <span className="text-lg">{suggestion.country}</span>}
                <span className="text-white">{suggestion.name || suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ✨ Main Onboarding Component
export default function UltraModernOnboardingPage() {
  const toast = useToasts();
  const router = useRouter();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: '',
    activity: '',
    city: '',
    photo: null,
    description: '',
    slug: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // ✅ Authentication check with useCallback to prevent re-renders
  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 [Auth] Vérification authentification...');

      // 1. Check Supabase session first
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ [Auth] Session Supabase trouvée:', session.user.id);
        const userData = {
          id: session.user.id,
          phone: session.user.phone,
          email: session.user.email,
          verification_method: session.user.phone ? 'whatsapp' : 'email',
          user_metadata: session.user.user_metadata
        };
        setUser(userData);
        return userData;
      }

      // 2. Check WhatsApp localStorage
      const whatsappVerified = localStorage.getItem('whatsapp_verified');
      const userData = localStorage.getItem('user_data');
      
      if (whatsappVerified === 'true' && userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          
          if (parsedUserData.id) {
            console.log('✅ [Auth] WhatsApp user trouvé:', parsedUserData.id);
            const userDataFormatted = {
              id: parsedUserData.id,
              phone: parsedUserData.phone,
              verification_method: 'whatsapp',
              country: parsedUserData.country,
              whatsapp_verified: true
            };
            setUser(userDataFormatted);
            return userDataFormatted;
          } else {
            throw new Error('User data incomplete');
          }
        } catch (error) {
          console.error('❌ [Auth] Erreur parsing user data:', error);
          localStorage.removeItem('whatsapp_verified');
          localStorage.removeItem('user_data');
          router.push('/login');
          return null;
        }
      } else {
        console.log('❌ [Auth] Aucune authentification trouvée');
        router.push('/login');
        return null;
      }
      
    } catch (error) {
      console.error('❌ [Auth] Erreur vérification:', error);
      router.push('/login');
      return null;
    }
  }, [router]);

  // ✅ Shop check with useCallback
  const checkShopAndLoadData = useCallback(async (userData: UserData) => {
    if (!userData?.id) {
      console.log('⚠️ [Shop] Pas de userData, skip vérification boutique');
      return;
    }
    
    try {
      console.log('🏪 [Shop] Vérification boutique existante pour:', userData.id);

      // Search for existing shop using user_id (UUID)
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (shopError && shopError.code !== 'PGRST116') {
        console.error('❌ [Shop] Erreur recherche boutique:', shopError);
        throw shopError;
      }
        
      if (shop) {
        console.log('✅ [Shop] Boutique existante trouvée:', shop.name);
        toast.success?.('Boutique trouvée', `Redirection vers ${shop.name}...`);
        setTimeout(() => {
          router.replace('/dashboard');
        }, 1000);
        return;
      }

      console.log('ℹ️ [Shop] Aucune boutique trouvée, procédure onboarding');

      // Load saved data
      const savedData = localStorage.getItem(`onboarding_${userData.id}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setForm(prev => ({ ...prev, ...parsed }));
          toast.info?.('Données récupérées', 'Vos informations précédentes ont été restaurées');
        } catch (parseError) {
          console.error('❌ [Shop] Erreur parsing saved data:', parseError);
          localStorage.removeItem(`onboarding_${userData.id}`);
        }
      }
      
      // Tip after a short delay
      setTimeout(() => {
        toast.system?.tip?.('Créez votre boutique ShopShap en 3 étapes simples');
      }, 500);
      
    } catch (error) {
      console.error('❌ [Shop] Erreur vérification boutique:', error);
      toast.system?.networkError?.();
    }
  }, [router, toast]);

  // ✅ Main useEffect with empty dependency array
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 [Init] Démarrage initialisation onboarding');
        const userData = await checkAuth();
        
        if (isMounted && userData) {
          await checkShopAndLoadData(userData);
        }
      } catch (error) {
        console.error('❌ [Init] Erreur initialisation:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []); // ✅ Empty dependency array

  // ✅ Form validation with useCallback
  const validateForm = useCallback(() => {
    const newErrors: ValidationErrors = {};
    
    if (form.name.trim() && form.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (form.activity.trim() && form.activity.trim().length < 3) {
      newErrors.activity = 'L\'activité doit contenir au moins 3 caractères';
    }
    
    if (form.city.trim() && form.city.trim().length < 2) {
      newErrors.city = 'La ville doit contenir au moins 2 caractères';
    }
    
    if (form.slug.trim() && !/^[a-z0-9-]+$/.test(form.slug)) {
      newErrors.slug = 'Seules les lettres minuscules, chiffres et tirets sont autorisés';
    }
    
    setErrors(newErrors);
    
    const isValid = currentStep === 1 
      ? form.name.trim().length >= 2 && form.activity.trim().length >= 3
      : currentStep === 2
      ? form.city.trim().length >= 2
      : true;
    
    setIsFormValid(isValid && Object.keys(newErrors).length === 0);
  }, [form, currentStep]);

  // ✅ Validation effect
  useEffect(() => {
    validateForm();
  }, [validateForm]);

  // ✅ Auto-save with useCallback
  const saveFormData = useCallback(() => {
    if (user?.id && (form.name || form.activity || form.city || form.description)) {
      const dataToSave = {
        ...form,
        photo: null
      };
      localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(dataToSave));
    }
  }, [user?.id, form]);

  useEffect(() => {
    saveFormData();
  }, [saveFormData]);

  // ✅ Auto-generate slug with useCallback
  const generateSlug = useCallback(() => {
    if (form.name.trim()) {
      const slug = form.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      if (slug !== form.slug) {
        setForm(prev => ({ ...prev, slug }));
      }
    }
  }, [form.name, form.slug]);

  useEffect(() => {
    generateSlug();
  }, [generateSlug]);

  if (loading) {
    return <ModernLoadingSpinner />;
  }

  if (!user) {
    return <ModernLoadingSpinner />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.system?.fileTooLarge();
      setErrors(prev => ({ ...prev, photo: 'Fichier trop volumineux (max 5MB)' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.system?.invalidFormat();
      setErrors(prev => ({ ...prev, photo: 'Format non supporté' }));
      return;
    }

    setForm(prev => ({ ...prev, photo: file }));
    setErrors(prev => ({ ...prev, photo: undefined }));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.shop?.photoSelected();
  };

  const removePhoto = () => {
    setForm(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
    setErrors(prev => ({ ...prev, photo: undefined }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let photo_url = '';
      
      if (form.photo) {
        toast.product?.uploadStart();
        setUploadProgress(0);
        
        const fileExt = form.photo.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 15, 90));
        }, 200);
        
        const { data, error: uploadError } = await supabase.storage
          .from('shop-photos')
          .upload(fileName, form.photo);
          
        clearInterval(progressInterval);
        setUploadProgress(100);
          
        if (uploadError) {
          console.error('❌ Erreur upload:', uploadError);
          toast.product?.uploadError('Impossible d\'uploader la photo');
          setSubmitting(false);
          return;
        }
        
        photo_url = data?.path || '';
        toast.product?.uploadSuccess();
      }

      // ✅ Create shop with UUID
      const shopData = {
        user_id: user?.id || crypto.randomUUID(), // ✅ Add null check with fallback UUID
        name: form.name.trim(),
        activity: form.activity.trim(),
        city: form.city.trim(),
        photo_url,
        description: form.description.trim(),
        slug: form.slug.trim() || `shop-${(user?.id || crypto.randomUUID()).slice(0, 8)}`,
        theme: 'elegant',
        currency: 'FCFA',
        phone: user?.phone || '',
        owner_phone: user?.phone || '',
        whatsapp: user?.phone || '',
        whatsapp_verified: user?.whatsapp_verified || false
      };

      console.log('✅ Création boutique avec données:', shopData);

      const { error: insertError } = await supabase
        .from('shops')
        .insert([shopData]);

      if (insertError) {
        console.error('❌ Erreur création boutique:', insertError);
        toast.system?.serverError();
        setSubmitting(false);
        return;
      }

      // Clean up
      localStorage.removeItem(`onboarding_${user.id}`);

      toast.auth?.registerSuccess(form.name);
      
      setTimeout(() => {
        toast.shop?.welcome(form.name);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }, 1500);

    } catch (error) {
      console.error('❌ Erreur onboarding:', error);
      toast.system?.networkError();
      setSubmitting(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Parlons de votre boutique</h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
                Donnez-nous les informations essentielles pour créer votre espace de vente professionnel
              </p>
              
              {/* Show user verification status */}
              {user.phone && (
                <div className="mt-4 inline-flex items-center gap-2 bg-green-900/20 border border-green-700/30 rounded-full px-4 py-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-green-300 text-sm font-medium">
                    WhatsApp vérifié : {user.phone}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <EnhancedInput
                label="Nom de la boutique"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex: Boutique Mode Dakar, TechShop Abidjan..."
                error={errors.name}
                required
              />

              <EnhancedInput
                label="Activité principale"
                name="activity"
                value={form.activity}
                onChange={handleChange}
                placeholder="Ex: Mode et vêtements, Électronique..."
                error={errors.activity}
                required
                suggestions={popularActivities}
                onSuggestionClick={(suggestion) => 
                  setForm(prev => ({ ...prev, activity: suggestion }))
                }
              />
            </div>

            <div className="bg-slate-800/20 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">💡 Conseil ShopShap</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Choisissez un nom mémorable et décrivez précisément votre activité. 
                    Cela aide vos clients à vous trouver et à comprendre ce que vous vendez.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600/20 to-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Où vous trouvez-vous ?</h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
                Cela aidera vos clients à vous localiser et à organiser leurs livraisons
              </p>
            </div>

            <div className="space-y-6">
              <EnhancedInput
                label="Votre ville"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Ex: Dakar, Abidjan, Bamako..."
                error={errors.city}
                required
                suggestions={popularCities}
                onSuggestionClick={(suggestion) => 
                  setForm(prev => ({ ...prev, city: suggestion }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-900/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-700/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h4 className="text-emerald-300 font-semibold">Livraison locale</h4>
                </div>
                <p className="text-emerald-200/80 text-sm">
                  Proposez des livraisons rapides dans votre ville
                </p>
              </div>

              <div className="bg-blue-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-700/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <h4 className="text-blue-300 font-semibold">Visibilité</h4>
                </div>
                <p className="text-blue-200/80 text-sm">
                  Apparaissez dans les recherches locales
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Personnalisez votre boutique</h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
                Rendez votre boutique unique avec une photo et une description attrayante
              </p>
            </div>

            <PhotoUploadZone
              photoPreview={photoPreview}
              onFileChange={handleFile}
              onRemove={removePhoto}
              errors={errors}
            />

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-300">
                Description de votre boutique
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Parlez de vos spécialités, votre expertise, ce qui vous rend unique... Donnez envie à vos clients de découvrir vos produits !"
                rows={4}
                className="w-full bg-slate-800/40 backdrop-blur-xl border-2 border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-slate-700/30 rounded-2xl px-6 py-4 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 resize-none"
              />
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Une bonne description améliore vos ventes
                </span>
                <span className="text-slate-400">
                  {form.description.length}/500
                </span>
              </div>
            </div>

            <EnhancedInput
              label="URL personnalisée (optionnel)"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="ma-boutique-dakar"
              error={errors.slug}
            />

            {form.slug && (
              <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl p-4 border border-purple-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-purple-300 font-medium text-sm">Votre lien sera :</p>
                    <p className="text-purple-200 text-sm font-mono">shopshap.com/{form.slug}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Enhanced Header */}
        <header className="text-center mb-12">
          <div className="relative mb-8">
            <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-2xl opacity-60 mx-auto animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
            Créons votre <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">boutique</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-lg mx-auto">
            Quelques étapes simples pour commencer à vendre sur WhatsApp et TikTok
          </p>
          
          <ProgressBar currentStep={currentStep} totalSteps={3} />
        </header>

        {/* Enhanced Form */}
        <div className="bg-slate-800/30 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 lg:p-12 shadow-2xl">
          <form onSubmit={handleSubmit}>
            {getStepContent()}

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-8 p-6 bg-blue-900/20 backdrop-blur-xl rounded-2xl border border-blue-700/30">
                <div className="flex justify-between text-sm text-blue-300 mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Upload de votre photo...</span>
                  </div>
                  <span className="font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-800/30 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Enhanced Navigation */}
            <div className="flex gap-4 mt-10">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white border-2 border-slate-600/50 hover:border-slate-500/50 font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  <span>Précédent</span>
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isFormValid}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl hover:shadow-blue-600/25 hover:scale-105 active:scale-95"
                >
                  <span>Continuer</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !form.name.trim() || !form.activity.trim() || !form.city.trim()}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl hover:shadow-emerald-600/25 hover:scale-105 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      <span>Créer ma boutique</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Enhanced Separator */}
          <div className="flex items-center my-10">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent"></div>
            <span className="px-6 text-slate-500 text-sm font-medium">avantages</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent"></div>
          </div>

          {/* Enhanced Benefits */}
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">100% Gratuit</p>
                <p className="text-slate-500 text-xs">Toujours</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Sécurisé</p>
                <p className="text-slate-500 text-xs">Données protégées</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Évolutif</p>
                <p className="text-slate-500 text-xs">Grandit avec vous</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="text-center mt-10 space-y-4">
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span className="font-semibold">Modifiable à tout moment après création</span>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/30">
            <p className="text-slate-300 text-sm leading-relaxed">
              <strong className="text-white">Après création :</strong> Ajoutez vos produits → Personnalisez votre thème → Partagez votre lien → Commencez à vendre !
            </p>
          </div>
          
          <p className="text-slate-500 text-xs">
            Dernière mise à jour: 2025-08-03 21:50:15 UTC - Développé avec ❤️ pour l'Afrique
          </p>
        </footer>

        {/* Debug info (Development only) */}
        {process.env.NODE_ENV === 'development' && user && (
          <div className="mt-6 p-3 bg-purple-900/20 border border-purple-800/50 rounded-xl">
            <p className="text-purple-400 text-xs font-mono mb-2">
              🛠️ Dev Mode - User Auth Status:
            </p>
            <div className="space-y-1 text-xs">
              <p className="text-green-400">✅ UUID: {user.id}</p>
              <p className="text-blue-400">📱 Phone: {user.phone || 'N/A'}</p>
              <p className="text-yellow-400">📧 Email: {user.email || 'N/A'}</p>
              <p className="text-purple-400">🔐 Method: {user.verification_method}</p>
              <p className="text-cyan-400">🌍 Country: {user.country || 'N/A'}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}