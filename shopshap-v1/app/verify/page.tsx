'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';
import { useWhatsAppAuth } from '@/hooks/useWhatsAppAuth';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToasts();
  const whatsappAuth = useWhatsAppAuth();
  
  const contact = searchParams.get('contact') || '';
  const method = searchParams.get('method') || 'sms'; // 'sms', 'whatsapp', or 'email'
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Initialize WhatsApp auth if method is WhatsApp
  useEffect(() => {
    if (method === 'whatsapp' && contact) {
      whatsappAuth.setPhoneNumber(contact);
    }
  }, [method, contact, whatsappAuth]);

  // Cooldown pour le renvoi de code
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Message d'accueil
  useEffect(() => {
    setTimeout(() => {
      if (method === 'whatsapp') {
        const countryFlag = whatsappAuth.detectedCountry?.flag || '';
        toast.info('Code WhatsApp envoyé !', `Vérifiez WhatsApp ${countryFlag} pour le code de vérification`);
      } else {
        toast.info('Code envoyé !', `Vérifiez vos ${contact.includes('@') ? 'emails' : 'SMS'} pour le code de vérification`);
      }
    }, 500);
  }, [contact, method, toast, whatsappAuth.detectedCountry]);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation du code
      if (!code.trim()) {
        toast.auth.validationError('Le code de vérification');
        setLoading(false);
        return;
      }

      if (code.length < 6) {
        toast.auth.invalidCode();
        setLoading(false);
        return;
      }

      let res;
      
      if (method === 'whatsapp') {
        // ✅ Use WhatsApp verification ONLY - NO Supabase Auth
        toast.info('Vérification WhatsApp...', 'Validation de votre code WhatsApp en cours');
        
        const whatsappResult = await whatsappAuth.verifyCode(code.trim());
        
        if (!whatsappResult.success) {
          setAttempts(prev => prev + 1);
          
          // Handle WhatsApp-specific errors
          if (whatsappResult.message.includes('Code incorrect')) {
            toast.auth.invalidCode();
            if (attempts >= 2) {
              setTimeout(() => {
                toast.warning('Trop de tentatives', 'Demandez un nouveau code si celui-ci ne fonctionne pas');
              }, 2000);
            }
          } else if (whatsappResult.message.includes('expiré')) {
            toast.auth.codeExpired();
          } else {
            toast.auth.verificationError(whatsappResult.message);
          }
          
          setLoading(false);
          return;
        }

        // ✅ WhatsApp verification successful - Store user data locally
        console.log('🎉 WhatsApp verification successful:', whatsappResult);
        
        // Store user data in localStorage for onboarding
        if (whatsappResult.userData) {
          localStorage.setItem('user_data', JSON.stringify(whatsappResult.userData));
          localStorage.setItem('whatsapp_verified', 'true');
          localStorage.setItem('verification_method', 'whatsapp');
        }
        
        // Success messages
        toast.auth.codeVerified();
        
        setTimeout(() => {
          const countryFlag = whatsappAuth.detectedCountry?.flag || '🌍';
          toast.auth.welcomeMessage();
        }, 1500);

        // Redirect to onboarding
        setTimeout(() => {
          router.push('/onboarding');
        }, 2500);
        
        setLoading(false);
        return;
        
      } else if (contact.includes('@')) {
        // ✅ Email verification via Supabase (unchanged)
        toast.info('Vérification...', 'Validation de votre code email en cours');
        res = await supabase.auth.verifyOtp({ 
          email: contact, 
          token: code.trim(), 
          type: 'email' 
        });
      } else {
        // ✅ SMS verification via Supabase (unchanged)
        toast.info('Vérification...', 'Validation de votre code SMS en cours');
        res = await supabase.auth.verifyOtp({ 
          phone: contact, 
          token: code.trim(), 
          type: 'sms' 
        });
      }

      // Handle Supabase auth results (for email/SMS only)
      if (res && res.error) {
        console.error('Erreur vérification:', res.error);
        setAttempts(prev => prev + 1);
        
        // Gestion des erreurs spécifiques
        if (res.error.message?.includes('Invalid token') || res.error.message?.includes('Token has expired')) {
          toast.auth.codeExpired();
        } else if (res.error.message?.includes('Invalid code')) {
          toast.auth.invalidCode();
          // Après 3 tentatives, suggérer un nouveau code
          if (attempts >= 2) {
            setTimeout(() => {
              toast.warning('Trop de tentatives', 'Demandez un nouveau code si celui-ci ne fonctionne pas');
            }, 2000);
          }
        } else {
          toast.auth.verificationError(res.error.message);
        }
        
        setLoading(false);
        return;
      }

      // ✅ Succès pour email/SMS !
      toast.auth.codeVerified();
      
      // Message de bienvenue
      setTimeout(() => {
        toast.auth.welcomeMessage();
      }, 1500);

      // Redirection vers onboarding
      setTimeout(() => {
        router.push('/onboarding');
      }, 2500);

    } catch (err: any) {
      console.error('Erreur validation code:', err);
      toast.system.networkError();
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    try {
      toast.info('Renvoi en cours...', 'Envoi d\'un nouveau code de vérification');
      
      let result;
      
      if (method === 'whatsapp') {
        // ✅ Resend via WhatsApp
        const whatsappResult = await whatsappAuth.sendCode();
        
        if (!whatsappResult.success) {
          toast.auth.loginError(whatsappResult.message);
          return;
        }
        
        result = { error: null }; // Success for WhatsApp
        
      } else if (contact.includes('@')) {
        // ✅ Resend via email
        result = await supabase.auth.signInWithOtp({
          email: contact,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`
          }
        });
      } else {
        // ✅ Resend via SMS
        result = await supabase.auth.signInWithOtp({ phone: contact });
      }

      if (result.error) {
        console.error('Erreur renvoi:', result.error);
        toast.system.serverError();
        return;
      }

      const messageText = method === 'whatsapp' 
        ? 'Un nouveau code WhatsApp a été envoyé'
        : 'Un nouveau code a été envoyé. Vérifiez vos messages';
      
      toast.success('Code renvoyé !', messageText);
      setCode(''); // Reset le code
      setAttempts(0); // Reset les tentatives
      setResendCooldown(60); // Cooldown de 60 secondes
      
    } catch (err) {
      console.error('Erreur renvoi code:', err);
      toast.system.networkError();
    }
  };

  const handleCodeChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(cleanValue);
  };

  const formatContact = (contact: string) => {
    if (contact.includes('@')) {
      const parts = contact.split('@');
      return `${parts[0].slice(0, 2)}***@${parts[1]}`;
    } else {
      return `${contact.slice(0, 4)}****${contact.slice(-2)}`;
    }
  };

  const getMethodIcon = () => {
    if (method === 'whatsapp') {
      return (
        <div className="w-12 h-12 bg-green-900/20 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
          </svg>
        </div>
      );
    } else if (contact.includes('@')) {
      return (
        <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 7.89a1 1 0 001.42 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-12 h-12 bg-green-900/20 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
        </div>
      );
    }
  };

  const getMethodText = () => {
    if (method === 'whatsapp') {
      return '📱 Vérifiez votre WhatsApp';
    } else if (contact.includes('@')) {
      return '📧 Vérifiez votre boîte email';
    } else {
      return '📱 Vérifiez vos SMS';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-blue-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full blur-xl opacity-50 mx-auto"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            {method === 'whatsapp' ? 'Vérification WhatsApp' : 'Vérification'}
          </h1>
          <p className="text-night-foreground/80 text-lg leading-relaxed">
            {method === 'whatsapp' 
              ? 'Entrez le code reçu sur WhatsApp' 
              : 'Entrez le code de vérification pour sécuriser votre compte'
            }
          </p>
        </div>

        {/* Contact Information Card */}
        <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex items-center gap-4">
            {getMethodIcon()}
            <div className="flex-1">
              <p className="text-white font-semibold text-lg">
                {method === 'whatsapp' ? 'Code WhatsApp envoyé' : 'Code envoyé'}
              </p>
              <p className="text-night-foreground/70 font-medium">{formatContact(contact)}</p>
              <p className="text-night-foreground/60 text-sm mt-1">
                {getMethodText()}
              </p>
            </div>
            {method === 'whatsapp' && whatsappAuth.detectedCountry && (
              <div className="text-2xl">
                {whatsappAuth.detectedCountry.flag}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Verification Form */}
        <div className="bg-night-foreground/10 backdrop-blur-xl border border-night-foreground/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleValidate} className="space-y-8">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-night-foreground/90">
                Code de vérification
              </label>
              
              {/* Enhanced Code Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="000000"
                  className="w-full bg-night-foreground/5 border-2 border-night-foreground/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl px-6 py-6 text-white text-center text-3xl font-mono tracking-[0.5em] placeholder-night-foreground/30 focus:outline-none transition-all duration-200"
                  value={code}
                  onChange={e => handleCodeChange(e.target.value)}
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {code.length === 6 ? (
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  ) : (
                    <div className="text-night-foreground/50 text-sm font-medium">
                      {code.length}/6
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-night-foreground/60 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Le code expire dans 10 minutes</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-5 px-6 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Vérification en cours...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Valider le code</span>
                </>
              )}
            </button>
          </form>

          {/* Enhanced Secondary Actions */}
          <div className="mt-8 pt-6 border-t border-night-foreground/20">
            <div className="text-center space-y-4">
              <p className="text-night-foreground/70 font-medium">
                Vous n'avez pas reçu le code ?
              </p>
              
              {resendCooldown > 0 ? (
                <div className="flex items-center justify-center gap-2 text-night-foreground/60">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Renvoyer dans {resendCooldown}s</span>
                </div>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-green-400 hover:text-green-300 font-bold transition-all duration-200 hover:scale-105 bg-green-900/20 hover:bg-green-900/30 px-6 py-3 rounded-xl border border-green-800/50 disabled:opacity-50"
                >
                  📤 Renvoyer le code
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/login')}
            className="text-night-foreground/70 hover:text-night-foreground font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto bg-night-foreground/10 hover:bg-night-foreground/20 px-4 py-2 rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
            </svg>
            <span>Retour à la connexion</span>
          </button>
        </div>

        {/* Enhanced Security Tips */}
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-blue-900/10 backdrop-blur-sm border border-blue-800/30 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div>
                <p className="text-blue-400 font-semibold mb-1">Conseil de sécurité</p>
                <p className="text-blue-300/80 text-sm leading-relaxed">
                  Ne partagez jamais votre code de vérification. Notre équipe ne vous le demandera jamais.
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting Tips */}
          <div className="p-4 bg-yellow-900/10 backdrop-blur-sm border border-yellow-800/30 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-yellow-400 font-semibold mb-1">Problème de réception ?</p>
                <ul className="text-yellow-300/80 text-sm space-y-1">
                  {method === 'whatsapp' ? (
                    <>
                      <li>• Vérifiez que vous avez rejoint le sandbox Twilio</li>
                      <li>• Assurez-vous d'avoir du réseau WhatsApp</li>
                      <li>• Le code peut prendre jusqu'à 2 minutes à arriver</li>
                    </>
                  ) : (
                    <>
                      <li>• Vérifiez votre dossier spam/courrier indésirable</li>
                      <li>• Assurez-vous d'avoir du réseau</li>
                      <li>• Le code peut prendre jusqu'à 2 minutes à arriver</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Attempts Warning */}
        {attempts >= 2 && (
          <div className="mt-6 p-4 bg-red-900/10 backdrop-blur-sm border border-red-800/30 rounded-xl animate-pulse">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <p className="text-red-400 text-sm font-medium">
                Plusieurs tentatives échouées. Demandez un nouveau code si nécessaire.
              </p>
            </div>
          </div>
        )}

        {/* Debug info (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-purple-900/20 border border-purple-800/50 rounded-xl">
            <p className="text-purple-400 text-xs font-mono">
              🛠️ Dev Mode - Contact: {contact} | Method: {method} | Attempts: {attempts} | Cooldown: {resendCooldown}s
            </p>
          </div>
        )}
      </div>
    </main>
  );
}