'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToasts } from '@/hooks/useToast';

// Types
interface FormData {
  name: string;
  activity: string;
  city: string;
  photo: File | null;
  description: string;
}

interface ValidationErrors {
  name?: string;
  activity?: string;
  city?: string;
  photo?: string;
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const toast = useToasts();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: '',
    activity: '',
    city: '',
    photo: null,
    description: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Validation en temps réel
  useEffect(() => {
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
    
    setErrors(newErrors);
    
    // Vérifier si le formulaire est valide pour l'étape actuelle
    const isValid = currentStep === 1 
      ? form.name.trim().length >= 2 && form.activity.trim().length >= 3
      : currentStep === 2
      ? form.city.trim().length >= 2
      : true;
    
    setIsFormValid(isValid && Object.keys(newErrors).length === 0);
  }, [form, currentStep]);

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    if (user && (form.name || form.activity || form.city || form.description)) {
      localStorage.setItem(`onboarding_${user.id}`, JSON.stringify({
        ...form,
        photo: null // Ne pas sauvegarder le fichier
      }));
    }
  }, [form, user]);

  // Récupération des données sauvegardées
  useEffect(() => {
    const checkShopAndLoadData = async () => {
      if (!user) return;
      
      try {
        // Vérifier si l'utilisateur a déjà une boutique
        const { data: shop } = await supabase
          .from('shops')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (shop) {
          toast.shop.welcome('Votre boutique');
          setTimeout(() => {
            router.replace('/dashboard');
          }, 1000);
          return;
        }

        // Charger les données sauvegardées
        const savedData = localStorage.getItem(`onboarding_${user.id}`);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setForm(prev => ({ ...prev, ...parsed }));
          toast.info('Données récupérées', 'Nous avons récupéré vos informations précédentes');
        }
        
        setLoading(false);
        
        // Message de bienvenue
        setTimeout(() => {
          toast.system.tip('Créez votre boutique en quelques étapes simples');
        }, 500);
        
      } catch (error) {
        console.error('Erreur initialisation:', error);
        toast.system.networkError();
        setLoading(false);
      }
    };
    
    if (user) {
      checkShopAndLoadData();
    }
  }, [user, router, toast]);

  if (!user || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-night via-night to-blue-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        <p className="text-night-foreground mt-4 text-lg">Préparation de votre espace...</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.system.fileTooLarge();
      setErrors(prev => ({ ...prev, photo: 'Fichier trop volumineux (max 5MB)' }));
      return;
    }

    // Validation type
    if (!file.type.startsWith('image/')) {
      toast.system.invalidFormat();
      setErrors(prev => ({ ...prev, photo: 'Format non supporté' }));
      return;
    }

    setForm(prev => ({ ...prev, photo: file }));
    setErrors(prev => ({ ...prev, photo: undefined }));
    
    // Créer preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.shop.photoSelected();
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
      
      // Upload photo si sélectionnée
      if (form.photo) {
        toast.product.uploadStart();
        setUploadProgress(0);
        
        const fileExt = form.photo.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        
        // Simuler progression d'upload
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 20, 90));
        }, 200);
        
        const { data, error: uploadError } = await supabase.storage
          .from('shop-photos')
          .upload(fileName, form.photo);
          
        clearInterval(progressInterval);
        setUploadProgress(100);
          
        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          toast.product.uploadError('Impossible d\'uploader la photo');
          setSubmitting(false);
          return;
        }
        
        photo_url = data?.path || '';
        toast.product.uploadSuccess();
      }

      // Créer la boutique
      const { error: insertError } = await supabase
        .from('shops')
        .insert([{
          user_id: user.id,
          name: form.name.trim(),
          activity: form.activity.trim(),
          city: form.city.trim(),
          photo_url,
          description: form.description.trim()
        }]);

      if (insertError) {
        console.error('Erreur création boutique:', insertError);
        toast.system.serverError();
        setSubmitting(false);
        return;
      }

      // Nettoyer localStorage
      localStorage.removeItem(`onboarding_${user.id}`);

      // Succès !
      toast.auth.registerSuccess(form.name);
      
      setTimeout(() => {
        toast.shop.welcome(form.name);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }, 1500);

    } catch (error) {
      console.error('Erreur onboarding:', error);
      toast.system.networkError();
      setSubmitting(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-3">Parlons de votre boutique</h2>
              <p className="text-night-foreground/80 leading-relaxed">
                Donnez-nous les informations essentielles pour créer votre espace de vente
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Nom de la boutique *
                </label>
                <input
                  name="name"
                  placeholder="Ex: Boutique Mode Dakar"
                  value={form.name}
                  onChange={handleChange}
                  className={`w-full bg-night-foreground/5 border-2 rounded-xl px-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200 ${
                    errors.name 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : form.name.trim() && !errors.name
                      ? 'border-green-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      : 'border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                {errors.name && (
                  <div className="flex items-center gap-2 text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.18 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <span className="text-xs">{errors.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-night-foreground/90">
                  Activité principale *
                </label>
                <input
                  name="activity"
                  placeholder="Ex: Mode et vêtements, Électronique, Alimentation..."
                  value={form.activity}
                  onChange={handleChange}
                  className={`w-full bg-night-foreground/5 border-2 rounded-xl px-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200 ${
                    errors.activity 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : form.activity.trim() && !errors.activity
                      ? 'border-green-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      : 'border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                {errors.activity && (
                  <div className="flex items-center gap-2 text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.18 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <span className="text-xs">{errors.activity}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-3">Où vous trouvez-vous ?</h2>
              <p className="text-night-foreground/80 leading-relaxed">
                Cela aidera vos clients à vous localiser et à organiser leurs commandes
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-night-foreground/90">
                Votre ville *
              </label>
              <input
                name="city"
                placeholder="Ex: Dakar, Abidjan, Bamako..."
                value={form.city}
                onChange={handleChange}
                className={`w-full bg-night-foreground/5 border-2 rounded-xl px-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200 ${
                  errors.city 
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : form.city.trim() && !errors.city
                    ? 'border-green-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                    : 'border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
              {errors.city && (
                <div className="flex items-center gap-2 text-red-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.18 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  <span className="text-xs">{errors.city}</span>
                </div>
              )}
            </div>

            <div className="bg-night-foreground/5 rounded-xl p-4 border border-night-foreground/20">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p className="text-night-foreground/90 text-sm font-medium">Pourquoi cette information ?</p>
                  <p className="text-night-foreground/70 text-xs mt-1">
                    Vos clients pourront vous trouver plus facilement et vous pourrez proposer des livraisons locales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-3">Personnalisez votre boutique</h2>
              <p className="text-night-foreground/80 leading-relaxed">
                Ajoutez une photo et une description pour rendre votre boutique plus attractive
              </p>
            </div>

            {/* Photo de boutique */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-night-foreground/10 border-2 border-dashed border-night-foreground/30 rounded-2xl flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <div className="relative w-full h-full">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="w-10 h-10 text-night-foreground/50 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <p className="text-xs text-night-foreground/60">Ajouter une photo</p>
                    </div>
                  )}
                </div>
                {!photoPreview && (
                  <label className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-full cursor-pointer transition-all duration-300 shadow-xl hover:scale-105">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <input
                      name="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFile}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-sm text-night-foreground/60 mt-3">
                Une belle photo donne confiance à vos clients (facultatif)
              </p>
              {errors.photo && (
                <p className="text-red-400 text-xs mt-1">{errors.photo}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-night-foreground/90">
                Description de votre boutique
              </label>
              <textarea
                name="description"
                placeholder="Parlez de vos spécialités, votre expertise, ce qui vous rend unique..."
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-4 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200 resize-none"
              />
              <div className="text-night-foreground/60 space-y-1">
                <p className="text-xs">{form.description.length}/500 caractères (facultatif)</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-blue-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header avec progression - exactement comme login */}
        <header className="text-center mb-8">
          <div className="relative">
            {/* Glow effect - identique au login */}
            <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-xl opacity-50 mx-auto"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Créons votre boutique</h1>
          <p className="text-night-foreground/70 text-lg font-medium">Quelques étapes pour commencer à vendre</p>
          
          {/* Barre de progression */}
          <div className="relative mt-6">
            <div className="w-full bg-night-foreground/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-night-foreground/60 mt-2">
              <span className={currentStep >= 1 ? 'text-blue-400 font-medium' : ''}>Informations</span>
              <span className={currentStep >= 2 ? 'text-blue-400 font-medium' : ''}>Localisation</span>
              <span className={currentStep >= 3 ? 'text-blue-400 font-medium' : ''}>Personnalisation</span>
            </div>
            <p className="text-night-foreground/60 text-sm mt-2">Étape {currentStep} sur 3</p>
          </div>
        </header>

        {/* Formulaire - exactement même style que login */}
        <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit}>
            {getStepContent()}

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-night-foreground/70 mb-2">
                  <span>Upload en cours...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-night-foreground/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Navigation - exactement même style que login */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground border-2 border-night-foreground/30 hover:border-night-foreground/50 font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-105 active:scale-95"
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
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
                >
                  <span>Suivant</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !form.name.trim() || !form.activity.trim() || !form.city.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      <span>Créer ma boutique</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Enhanced Separator - comme login */}
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-night-foreground/30 to-transparent"></div>
            <span className="px-4 text-night-foreground/60 text-sm font-medium">informations</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-night-foreground/30 to-transparent"></div>
          </div>

          {/* Informations rassurantes - exactement comme login */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="w-8 h-8 bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-xs text-night-foreground/70">100% Gratuit</p>
            </div>
            <div className="space-y-1">
              <div className="w-8 h-8 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <p className="text-xs text-night-foreground/70">Sécurisé</p>
            </div>
            <div className="space-y-1">
              <div className="w-8 h-8 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
              </div>
              <p className="text-xs text-night-foreground/70">Modifiable</p>
            </div>
          </div>
        </div>

        {/* Enhanced Footer - exactement comme login */}
        <footer className="text-center mt-8 space-y-3">
          <div className="flex items-center justify-center gap-2 text-night-foreground/70">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span className="text-sm font-medium">🚀 Modification possible à tout moment</span>
          </div>
          
          <p className="text-night-foreground/60 text-sm">
            <strong>Après création :</strong> ajoutez vos produits → partagez votre lien → vendez !
          </p>
        </footer>
      </div>
    </main>
  );
}