'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToasts } from '@/hooks/useToast';

export default function OnboardingPage() {
  const { user } = useAuth();
  const toast = useToasts(); // ✅ Hook unifié
  const router = useRouter();
  
  const [form, setForm] = useState({
    name: '',
    activity: '',
    city: '',
    photo: null as File | null,
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Check if user already has a shop
  useEffect(() => {
    const checkShop = async () => {
      if (!user) return;
      
      try {
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
        } else {
          setLoading(false);
          // Message de bienvenue pour nouveau utilisateur
          setTimeout(() => {
            toast.system.tip('Créez votre boutique en quelques étapes simples');
          }, 500);
        }
      } catch (error) {
        console.error('Erreur vérification boutique:', error);
        toast.system.networkError();
        setLoading(false);
      }
    };
    
    if (user) {
      checkShop();
    }
  }, [user, router, toast]);

  if (!user || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <span className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mb-4"></span>
        <p>Chargement…</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

    setForm({ ...form, photo: file });
    
    // Créer preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.shop.photoSelected();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validation des champs requis
      if (!form.name.trim()) {
        toast.product.validationError('Le nom de la boutique');
        setSubmitting(false);
        return;
      }

      if (!form.activity.trim()) {
        toast.product.validationError('L\'activité principale');
        setSubmitting(false);
        return;
      }

      if (!form.city.trim()) {
        toast.product.validationError('La ville');
        setSubmitting(false);
        return;
      }

      let photo_url = '';
      
      // Upload photo si sélectionnée
      if (form.photo) {
        toast.product.uploadStart();
        
        const fileExt = form.photo.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('shop-photos')
          .upload(fileName, form.photo);
          
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

      // Succès !
      toast.auth.registerSuccess(form.name);
      
      // Petite pause pour montrer le toast avant redirection
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-purple-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header avec progression */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Créons votre boutique</h1>
          <p className="text-night-foreground/70">
            Quelques informations pour commencer à vendre
          </p>
          
          {/* Barre de progression */}
          <div className="w-full bg-night-foreground/20 rounded-full h-2 mt-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-1/3 transition-all duration-300"></div>
          </div>
          <p className="text-xs text-night-foreground/60 mt-2">Étape 1 sur 3 - Informations de base</p>
        </div>

        {/* Formulaire */}
        <div className="bg-night-foreground/10 backdrop-blur-lg border border-night-foreground/20 rounded-2xl p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Photo de boutique */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-night-foreground/10 border-2 border-dashed border-night-foreground/30 rounded-full flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-night-foreground/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer transition-colors shadow-lg">
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
              </div>
              <p className="text-sm text-night-foreground/60 mt-2">
                Ajoutez une photo de votre boutique (facultatif)
              </p>
            </div>

            {/* Informations de base */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-night-foreground/90 mb-2">
                  Nom de la boutique *
                </label>
                <input
                  name="name"
                  placeholder="Ex: Boutique Mode Dakar"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-white placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-night-foreground/90 mb-2">
                  Activité principale *
                </label>
                <input
                  name="activity"
                  placeholder="Ex: Mode et vêtements, Électronique, Alimentation..."
                  value={form.activity}
                  onChange={handleChange}
                  required
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-white placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-night-foreground/90 mb-2">
                  Ville *
                </label>
                <input
                  name="city"
                  placeholder="Ex: Dakar, Abidjan, Bamako..."
                  value={form.city}
                  onChange={handleChange}
                  required
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-white placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-night-foreground/90 mb-2">
                  Description (facultatif)
                </label>
                <textarea
                  name="description"
                  placeholder="Décrivez votre boutique, vos spécialités, votre expertise..."
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-white placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-600/50 disabled:to-purple-600/50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Créer ma boutique
                </>
              )}
            </button>
          </form>

          {/* Informations rassurantes */}
          <div className="mt-6 pt-6 border-t border-night-foreground/20">
            <div className="grid grid-cols-2 gap-4 text-center">
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
            </div>
            <p className="text-xs text-center text-night-foreground/60 mt-4">
              🚀 Vous pourrez modifier ces informations à tout moment
            </p>
          </div>
        </div>

        {/* Prochaines étapes */}
        <div className="mt-6 text-center">
          <p className="text-night-foreground/60 text-sm">
            Après création : ajoutez vos produits → partagez votre lien → vendez ! 
          </p>
        </div>
      </div>
    </main>
  );
}