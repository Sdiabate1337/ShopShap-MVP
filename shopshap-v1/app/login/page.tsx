'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';

export default function LoginPage() {
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState<'email' | 'phone' | null>(null);
  const [isValidInput, setIsValidInput] = useState(false);
  const router = useRouter();
  const toast = useToasts();

  // Auto-detect input type and validate
  useEffect(() => {
    const trimmedContact = contact.trim();
    
    if (!trimmedContact) {
      setInputType(null);
      setIsValidInput(false);
      return;
    }

    if (trimmedContact.includes('@')) {
      setInputType('email');
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setIsValidInput(emailRegex.test(trimmedContact));
    } else if (trimmedContact.startsWith('+')) {
      setInputType('phone');
      // Basic phone validation (international format)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      setIsValidInput(phoneRegex.test(trimmedContact));
    } else {
      setInputType(null);
      setIsValidInput(false);
    }
  }, [contact]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidInput) {
      toast.product.validationError('Veuillez entrer un email ou numéro valide');
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (inputType === 'email') {
        toast.info('Envoi du lien magique...', 'Cela peut prendre quelques secondes');
        
        result = await supabase.auth.signInWithOtp({
          email: contact.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`
          }
        });

        if (result.error) throw result.error;

        toast.success('Email envoyé ! 📧', 'Vérifiez votre boîte email et cliquez sur le lien pour vous connecter');
        
      } else if (inputType === 'phone') {
        toast.info('Envoi du code SMS...', 'Vous allez recevoir un SMS avec votre code');
        
        result = await supabase.auth.signInWithOtp({ phone: contact.trim() });

        if (result.error) throw result.error;

        toast.success('SMS envoyé ! 📱', 'Vérifiez vos messages et entrez le code sur la page suivante');
        
        setTimeout(() => {
          router.push(`/verify?contact=${encodeURIComponent(contact.trim())}`);
        }, 1500);
      }

    } catch (error: any) {
      console.error('Erreur envoi code:', error);
      
      if (error.message?.includes('Invalid phone number')) {
        toast.auth.loginError('Numéro de téléphone invalide');
      } else if (error.message?.includes('Invalid email')) {
        toast.auth.loginError('Adresse email invalide');
      } else if (error.message?.includes('rate limit')) {
        toast.warning('Trop de tentatives', 'Veuillez attendre quelques minutes avant de réessayer');
      } else {
        toast.auth.loginError(error.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    toast.system.featureComingSoon('Accès démo');
  };

  const getInputIcon = () => {
    if (inputType === 'email') {
      return (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 7.89a1 1 0 001.42 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
      );
    }
    if (inputType === 'phone') {
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      );
    }
    return null;
  };

  const getValidationIndicator = () => {
    if (!contact.trim()) return null;
    
    return (
      <div className="absolute inset-y-0 right-12 flex items-center">
        {isValidInput ? (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-blue-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Enhanced Header */}
        <header className="text-center mb-8">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-xl opacity-50 mx-auto"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">ShopShap</h1>
          <p className="text-night-foreground/70 text-lg font-medium">Votre boutique en ligne connectée</p>
        </header>

        {/* Enhanced Form Card */}
        <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-3xl p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-3">Bienvenue</h2>
            <p className="text-night-foreground/80 leading-relaxed">
              Connectez-vous avec votre email ou votre numéro WhatsApp pour accéder à votre boutique
            </p>
          </div>

          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="space-y-3">
              <label 
                htmlFor="contact-input"
                className="block text-sm font-semibold text-night-foreground/90"
              >
                Email ou numéro WhatsApp
              </label>
              
              <div className="relative">
                <input
                  id="contact-input"
                  type="text"
                  placeholder="exemple@email.com ou +225XXXXXXXX"
                  className={`w-full bg-night-foreground/5 border-2 rounded-xl px-4 py-4 pr-24 text-white placeholder-night-foreground/50 focus:outline-none transition-all duration-200 ${
                    !contact.trim() 
                      ? 'border-night-foreground/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                      : isValidInput 
                        ? 'border-green-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20' 
                        : 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  }`}
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  required
                  aria-describedby="contact-help"
                />
                
                {/* Validation indicator */}
                {getValidationIndicator()}
                
                {/* Type indicator */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  {getInputIcon()}
                </div>
              </div>

              {/* Dynamic help text */}
              <div id="contact-help" className="space-y-2 text-xs">
                {inputType === 'email' && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Vous recevrez un lien magique par email</span>
                  </div>
                )}
                
                {inputType === 'phone' && (
                  <div className="flex items-center gap-2 text-green-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Vous recevrez un code de vérification par SMS</span>
                  </div>
                )}
                
                {!inputType && contact.trim() && (
                  <div className="flex items-center gap-2 text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.18 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <span>Format invalide. Utilisez un email ou un numéro international (+225XXXXXXXX)</span>
                  </div>
                )}
                
                {!contact.trim() && (
                  <div className="text-night-foreground/60 space-y-1">
                    <p>💡 <strong>Email:</strong> Connexion rapide par lien magique</p>
                    <p>📱 <strong>Téléphone:</strong> Code SMS (format international)</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isValidInput}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
              aria-label={inputType === 'email' ? 'Recevoir le lien de connexion' : 'Recevoir le code SMS'}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{inputType === 'email' ? 'Envoi du lien...' : 'Envoi du code...'}</span>
                </>
              ) : (
                <>
                  {inputType === 'email' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 7.89a1 1 0 001.42 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  )}
                  <span>
                    {inputType === 'email' ? 'Recevoir le lien magique' : 
                     inputType === 'phone' ? 'Recevoir le code SMS' : 
                     'Se connecter'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Enhanced Separator */}
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-night-foreground/30 to-transparent"></div>
            <span className="px-4 text-night-foreground/60 text-sm font-medium">ou</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-night-foreground/30 to-transparent"></div>
          </div>

          {/* Enhanced Demo Button */}
          <button
            onClick={handleDemoAccess}
            className="w-full bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground border-2 border-night-foreground/30 hover:border-night-foreground/50 font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-105 active:scale-95"
            aria-label="Accéder à la démonstration"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            <span>Découvrir la démo</span>
          </button>
        </div>

        {/* Enhanced Footer */}
        <footer className="text-center mt-8 space-y-3">
          <div className="flex items-center justify-center gap-2 text-night-foreground/70">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span className="text-sm font-medium">Connexion sécurisée sans mot de passe</span>
          </div>
          
          <p className="text-night-foreground/60 text-sm">
            <strong>Nouveau sur ShopShap ?</strong> Votre boutique sera créée automatiquement après connexion
          </p>
        </footer>

        {/* Enhanced Debug Panel */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-800/50 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span className="text-yellow-400 text-sm font-semibold">Mode Développement</span>
            </div>
            <div className="space-y-1 text-xs">
              <p className="text-yellow-300">
                <span className="font-mono bg-yellow-900/30 px-2 py-1 rounded">test@example.com</span> - Test email
              </p>
              <p className="text-yellow-300">
                <span className="font-mono bg-yellow-900/30 px-2 py-1 rounded">+22500000000</span> - Test phone
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}