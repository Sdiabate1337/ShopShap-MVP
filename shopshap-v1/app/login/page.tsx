'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';
import { useWhatsAppAuth } from '@/hooks/useWhatsAppAuth';

// ✨ Country suggestions for phone input
const popularCountries = [
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+225', flag: '🇨🇮', name: 'Côte d\'Ivoire' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: '+235', flag: '🇹🇩', name: 'Tchad' },
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
];

// ✨ Type definitions
type AuthMethod = 'supabase' | 'whatsapp';
type InputType = 'email' | 'phone' | null;

// ✨ Modern Loading Animation
function ModernLoadingButton({ inputType, authMethod }: { inputType: InputType; authMethod: AuthMethod }) {
  return (
    <div className="flex items-center gap-3">
      {/* Animated spinner */}
      <div className="relative">
        <div className="w-6 h-6 border-2 border-white/30 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-6 h-6 border-2 border-transparent border-t-white rounded-full animate-spin" style={{animationDuration: '0.8s'}}></div>
      </div>
      
      <span className="font-semibold">
        {inputType === 'email' ? 'Envoi du lien magique...' : 
         inputType === 'phone' && authMethod === 'whatsapp' ? 'Envoi WhatsApp...' :
         'Envoi du code...'}
      </span>
    </div>
  );
}

// ✨ Enhanced Input with Country Selector
function EnhancedContactInput({ 
  contact, 
  setContact, 
  inputType, 
  isValidInput,
  showCountries,
  setShowCountries 
}: {
  contact: string;
  setContact: (value: string) => void;
  inputType: InputType;
  isValidInput: boolean;
  showCountries: boolean;
  setShowCountries: (show: boolean) => void;
}) {
  const handleCountrySelect = (countryCode: string) => {
    setContact(countryCode);
    setShowCountries(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          id="contact-input"
          type="text"
          placeholder="exemple@email.com ou +225XXXXXXXX"
          className={`w-full bg-slate-800/40 backdrop-blur-xl border-2 rounded-2xl px-6 py-4 pr-32 text-white placeholder-slate-400 focus:outline-none transition-all duration-300 text-lg ${
            !contact.trim() 
              ? 'border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-700/30' 
              : isValidInput 
                ? 'border-green-500/50 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 focus:bg-green-900/10' 
                : 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 focus:bg-red-900/10'
          }`}
          value={contact}
          onChange={e => setContact(e.target.value)}
          onFocus={() => {
            if (!contact.trim() || (!contact.includes('@') && !contact.startsWith('+'))) {
              setShowCountries(true);
            }
          }}
          required
        />
        
        {/* Country Code Helper Button */}
        {!inputType && !contact.trim() && (
          <button
            type="button"
            onClick={() => setShowCountries(!showCountries)}
            className="absolute right-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </button>
        )}
        
        {/* Validation Indicator */}
        {contact.trim() && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            {isValidInput ? (
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Country Codes Dropdown */}
      {showCountries && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-10 max-h-80 overflow-y-auto">
          <div className="p-4 border-b border-slate-700/50">
            <p className="text-slate-300 font-semibold text-sm">Sélectionnez votre pays :</p>
          </div>
          {popularCountries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleCountrySelect(country.code)}
              className="w-full text-left px-6 py-4 hover:bg-slate-700/50 transition-colors duration-200 flex items-center gap-4 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <span className="text-2xl">{country.flag}</span>
              <div className="flex-1">
                <div className="text-white font-medium">{country.name}</div>
                <div className="text-slate-400 text-sm font-mono">{country.code}</div>
              </div>
            </button>
          ))}
          <div className="p-4 border-t border-slate-700/50">
            <p className="text-slate-500 text-xs text-center">
              Ou tapez directement votre numéro au format international
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ✨ Authentication Method Selector - CORRECTION ICI
function AuthMethodSelector({ 
  inputType, 
  authMethod, 
  setAuthMethod, 
  isValidInput, 
  whatsappAuth 
}: {
  inputType: InputType;
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void; // ✅ Type corrigé
  isValidInput: boolean;
  whatsappAuth: any;
}) {
  if (inputType !== 'phone' || !isValidInput) return null;

  return (
    <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-300 font-semibold text-sm">Mode d'envoi :</span>
        <div className="flex items-center gap-2">
          {whatsappAuth.isValidNumber && whatsappAuth.detectedCountry && (
            <span className="text-lg">{whatsappAuth.detectedCountry.flag}</span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {whatsappAuth.isValidNumber && (
          <button
            type="button"
            onClick={() => setAuthMethod('whatsapp')} // ✅ Type maintenant compatible
            className={`group p-4 rounded-xl border-2 transition-all duration-300 ${
              authMethod === 'whatsapp'
                ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/25'
                : 'border-slate-600/50 hover:border-green-400/50 hover:bg-green-500/10'
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                authMethod === 'whatsapp' ? 'bg-green-500/30' : 'bg-green-500/10 group-hover:bg-green-500/20'
              }`}>
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm">WhatsApp</p>
                <p className="text-slate-400 text-xs">Rapide & sécurisé</p>
              </div>
            </div>
          </button>
        )}
        
        <button
          type="button"
          onClick={() => setAuthMethod('supabase')} // ✅ Type maintenant compatible
          className={`group p-4 rounded-xl border-2 transition-all duration-300 ${
            authMethod === 'supabase'
              ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
              : 'border-slate-600/50 hover:border-blue-400/50 hover:bg-blue-500/10'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              authMethod === 'supabase' ? 'bg-blue-500/30' : 'bg-blue-500/10 group-hover:bg-blue-500/20'
            }`}>
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">SMS</p>
              <p className="text-slate-400 text-xs">Code par SMS</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ✨ Main Login Component - TYPES CORRIGÉS
export default function UltraModernLoginPage() {
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState<InputType>(null); // ✅ Type spécifique
  const [isValidInput, setIsValidInput] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('supabase'); // ✅ Type spécifique
  const [showCountries, setShowCountries] = useState(false);
  const router = useRouter();
  const toast = useToasts();
  const whatsappAuth = useWhatsAppAuth();

  // ✨ Enhanced input detection and validation
  useEffect(() => {
    const trimmedContact = contact.trim();
    
    if (!trimmedContact) {
      setInputType(null);
      setIsValidInput(false);
      return;
    }

    if (trimmedContact.includes('@')) {
      setInputType('email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setIsValidInput(emailRegex.test(trimmedContact));
      setAuthMethod('supabase');
    } else if (trimmedContact.startsWith('+')) {
      setInputType('phone');
      whatsappAuth.setPhoneNumber(trimmedContact);
      if (whatsappAuth.isValidNumber) {
        setIsValidInput(true);
        setAuthMethod('whatsapp');
      } else {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        setIsValidInput(phoneRegex.test(trimmedContact));
        setAuthMethod('supabase');
      }
    } else {
      setInputType(null);
      setIsValidInput(false);
    }

    // Hide countries dropdown when user starts typing
    if (trimmedContact && showCountries) {
      setShowCountries(false);
    }
  }, [contact, whatsappAuth, showCountries]);

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
        toast.info('Envoi du lien magique...', 'Vérifiez votre boîte email dans quelques instants');
        
        result = await supabase.auth.signInWithOtp({
          email: contact.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`
          }
        });

        if (result.error) throw result.error;

        toast.success('Email envoyé ! 📧', 'Cliquez sur le lien dans votre boîte email pour vous connecter');
        
      } else if (inputType === 'phone') {
        if (authMethod === 'whatsapp' && whatsappAuth.isValidNumber) {
          const countryFlag = whatsappAuth.detectedCountry?.flag || '';
          const countryName = whatsappAuth.detectedCountry?.name || '';
          
          toast.info(
            `Envoi WhatsApp ${countryFlag}...`, 
            `Code envoyé via WhatsApp ${countryName}`
          );
          
          const whatsappResult = await whatsappAuth.sendCode();
          
          if (!whatsappResult.success) {
            throw new Error(whatsappResult.message);
          }

          setTimeout(() => {
            router.push(`/verify?contact=${encodeURIComponent(contact.trim())}&method=whatsapp`);
          }, 1500);
          
        } else {
          toast.info('Envoi du code SMS...', 'Vous allez recevoir un SMS avec votre code');
          
          result = await supabase.auth.signInWithOtp({ phone: contact.trim() });

          if (result.error) throw result.error;

          toast.success('SMS envoyé ! 📱', 'Entrez le code reçu sur la page suivante');
          
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
    toast.system.featureComingSoon('Accès démo bientôt disponible');
  };

  // ✨ Click outside to close countries dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCountries && !(event.target as Element).closest('[data-countries-dropdown]')) {
        setShowCountries(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCountries]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* ✨ Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-lg relative z-10" data-countries-dropdown>
        {/* ✨ Enhanced Header */}
        <header className="text-center mb-12">
          <div className="relative mb-8">
            <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-2xl opacity-60 mx-auto animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
            Shop<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Shap</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium leading-relaxed">
            Votre boutique en ligne connectée à WhatsApp
          </p>
        </header>

        {/* ✨ Enhanced Form Card */}
        <div className="bg-slate-800/30 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 lg:p-10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Bienvenue</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Connectez-vous avec votre email ou votre numéro WhatsApp pour accéder à votre boutique
            </p>
          </div>

          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="space-y-4">
              <label 
                htmlFor="contact-input"
                className="block text-sm font-bold text-slate-300"
              >
                Email ou numéro WhatsApp
              </label>
              
              <EnhancedContactInput
                contact={contact}
                setContact={setContact}
                inputType={inputType}
                isValidInput={isValidInput}
                showCountries={showCountries}
                setShowCountries={setShowCountries}
              />

              {/* ✨ Dynamic Help Text */}
              <div className="space-y-3 text-sm">
                {inputType === 'email' && (
                  <div className="flex items-center gap-3 text-blue-400 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 7.89a1 1 0 001.42 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Connexion par email</p>
                      <p className="text-blue-300/80">Vous recevrez un lien magique sécurisé</p>
                    </div>
                  </div>
                )}
                
                {inputType === 'phone' && whatsappAuth.isValidNumber && whatsappAuth.detectedCountry && (
                  <div className="flex items-center gap-3 text-green-400 bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{whatsappAuth.detectedCountry.flag}</span>
                    </div>
                    <div>
                      <p className="font-semibold">WhatsApp détecté - {whatsappAuth.detectedCountry.name}</p>
                      <p className="text-green-300/80">Connexion rapide et sécurisée disponible</p>
                    </div>
                  </div>
                )}
                
                {inputType === 'phone' && !whatsappAuth.isValidNumber && isValidInput && (
                  <div className="flex items-center gap-3 text-blue-400 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Connexion par SMS</p>
                      <p className="text-blue-300/80">Code de vérification par message</p>
                    </div>
                  </div>
                )}
                
                {!inputType && contact.trim() && (
                  <div className="flex items-center gap-3 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Format invalide</p>
                      <p className="text-red-300/80">Utilisez un email ou un numéro international (+225XXXXXXXX)</p>
                    </div>
                  </div>
                )}
                
                {!contact.trim() && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-slate-400 p-4 bg-slate-800/20 rounded-xl border border-slate-700/30">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 7.89a1 1 0 001.42 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Email</p>
                        <p className="text-xs">Lien magique</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-400 p-4 bg-slate-800/20 rounded-xl border border-slate-700/30">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-white">WhatsApp</p>
                        <p className="text-xs">Code rapide</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ✨ Authentication Method Selector */}
            <AuthMethodSelector
              inputType={inputType}
              authMethod={authMethod}
              setAuthMethod={setAuthMethod} // ✅ Maintenant compatible
              isValidInput={isValidInput}
              whatsappAuth={whatsappAuth}
            />

            {/* ✨ Enhanced Submit Button */}
            <button
              type="submit"
              disabled={loading || !isValidInput}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl hover:shadow-blue-600/25 hover:scale-105 active:scale-95 text-lg"
            >
              {loading ? (
                <ModernLoadingButton inputType={inputType} authMethod={authMethod} />
              ) : (
                <>
                  {inputType === 'email' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 7.89a1 1 0 001.42 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  ) : inputType === 'phone' && authMethod === 'whatsapp' ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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



          {/* ✨ Enhanced Benefits Section */}
          <div className="mt-10 pt-8 border-t border-slate-700/50">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Sécurisé</p>
                  <p className="text-slate-500 text-xs">Sans mot de passe</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Rapide</p>
                  <p className="text-slate-500 text-xs">Connexion instantanée</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Simple</p>
                  <p className="text-slate-500 text-xs">Interface intuitive</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✨ Enhanced Footer */}
        <footer className="text-center mt-10 space-y-4">
 
          <p className="text-slate-500 text-xs">
            Dernière mise à jour: 2025-08-03 18:04:07 UTC - Développé avec ❤️ pour l'Afrique
          </p>
        </footer>
      </div>
    </main>
  );
}