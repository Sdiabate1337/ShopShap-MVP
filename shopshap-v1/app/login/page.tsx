'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';
import { useWhatsAppAuth } from '@/hooks/useWhatsAppAuth';

export default function LoginPage() {
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState<'email' | 'phone' | null>(null);
  const [isValidInput, setIsValidInput] = useState(false);
  const [authMethod, setAuthMethod] = useState<'supabase' | 'whatsapp'>('supabase');
  const router = useRouter();
  const toast = useToasts();
  const whatsappAuth = useWhatsAppAuth();

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
      setAuthMethod('supabase'); // Email always uses Supabase
    } else if (trimmedContact.startsWith('+')) {
      setInputType('phone');
      // For phones, check if it's a WhatsApp supported number
      whatsappAuth.setPhoneNumber(trimmedContact);
      if (whatsappAuth.isValidNumber) {
        setIsValidInput(true);
        // Default to WhatsApp for supported countries
        setAuthMethod('whatsapp');
      } else {
        // Basic phone validation (international format) for Supabase fallback
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        setIsValidInput(phoneRegex.test(trimmedContact));
        setAuthMethod('supabase');
      }
    } else {
      setInputType(null);
      setIsValidInput(false);
    }
  }, [contact, whatsappAuth]);

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
        if (authMethod === 'whatsapp' && whatsappAuth.isValidNumber) {
          // Use WhatsApp authentication
          const countryFlag = whatsappAuth.detectedCountry?.flag || '';
          const countryName = whatsappAuth.detectedCountry?.name || '';
          
          toast.info(
            `Envoi WhatsApp ${countryFlag}...`, 
            `Envoi du code sur WhatsApp ${countryName}`
          );
          
          const whatsappResult = await whatsappAuth.sendCode();
          
          if (!whatsappResult.success) {
            throw new Error(whatsappResult.message);
          }

          // Redirect to verify page with WhatsApp context
          setTimeout(() => {
            router.push(`/verify?contact=${encodeURIComponent(contact.trim())}&method=whatsapp`);
          }, 1500);
          
        } else {
          // Fallback to Supabase SMS
          toast.info('Envoi du code SMS...', 'Vous allez recevoir un SMS avec votre code');
          
          result = await supabase.auth.signInWithOtp({ phone: contact.trim() });

          if (result.error) throw result.error;

          toast.success('SMS envoyé ! 📱', 'Vérifiez vos messages et entrez le code sur la page suivante');
          
          setTimeout(() => {
            router.push(`/verify?contact=${encodeURIComponent(contact.trim())}&method=sms`);
          }, 1500);
        }
      }

    } catch (error: unknown) {
      console.error('Erreur envoi code:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      
      if (errorMessage.includes('Invalid phone number')) {
        toast.auth.loginError('Numéro de téléphone invalide');
      } else if (errorMessage.includes('Invalid email')) {
        toast.auth.loginError('Adresse email invalide');
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('Trop de tentatives')) {
        toast.warning('Trop de tentatives', 'Veuillez attendre quelques minutes avant de réessayer');
      } else {
        toast.auth.loginError(errorMessage);
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
      // Show WhatsApp icon if method is whatsapp and valid
      if (authMethod === 'whatsapp' && whatsappAuth.isValidNumber) {
        return (
          <div className="flex items-center space-x-1">
            <span className="text-lg">{whatsappAuth.detectedCountry?.flag}</span>
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
          </div>
        );
      }
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
                  <div className="space-y-2">
                    {whatsappAuth.isValidNumber && whatsappAuth.detectedCountry ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <span className="text-base">{whatsappAuth.detectedCountry.flag}</span>
                        <span>WhatsApp disponible - {whatsappAuth.detectedCountry.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Vous recevrez un code de vérification par SMS</span>
                      </div>
                    )}
                    
                    {/* Method toggle for phone numbers */}
                    {inputType === 'phone' && isValidInput && (
                      <div className="flex items-center justify-between p-3 bg-night-foreground/5 rounded-lg border border-night-foreground/20">
                        <span className="text-night-foreground/80 text-sm">Mode d'envoi:</span>
                        <div className="flex items-center space-x-2">
                          {whatsappAuth.isValidNumber && (
                            <button
                              type="button"
                              onClick={() => setAuthMethod('whatsapp')}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                authMethod === 'whatsapp'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-night-foreground/10 text-night-foreground/70 hover:bg-green-500/20'
                              }`}
                            >
                              📱 WhatsApp
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setAuthMethod('supabase')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                              authMethod === 'supabase'
                                ? 'bg-blue-500 text-white'
                                : 'bg-night-foreground/10 text-night-foreground/70 hover:bg-blue-500/20'
                            }`}
                          >
                            💬 SMS
                          </button>
                        </div>
                      </div>
                    )}
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
                  <span>
                    {inputType === 'email' ? 'Envoi du lien...' : 
                     inputType === 'phone' && authMethod === 'whatsapp' ? 'Envoi WhatsApp...' :
                     'Envoi du code...'}
                  </span>
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
                     inputType === 'phone' && authMethod === 'whatsapp' ? 'Envoyer code WhatsApp' :
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
        </footer>

      </div>
    </main>
  );
}