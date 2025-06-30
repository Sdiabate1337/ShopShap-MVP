'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToasts(); // ✅ Hook unifié
  
  const contact = searchParams.get('contact') || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

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
      if (contact.includes('@')) {
        toast.info('Vérification...', 'Validation de votre code email en cours');
        res = await supabase.auth.verifyOtp({ 
          email: contact, 
          token: code.trim(), 
          type: 'email' 
        });
      } else {
        toast.info('Vérification...', 'Validation de votre code SMS en cours');
        res = await supabase.auth.verifyOtp({ 
          phone: contact, 
          token: code.trim(), 
          type: 'sms' 
        });
      }

      if (res.error) {
        console.error('Erreur vérification:', res.error);
        
        // Gestion des erreurs spécifiques
        if (res.error.message?.includes('Invalid token') || res.error.message?.includes('Token has expired')) {
          toast.auth.codeExpired();
        } else if (res.error.message?.includes('Invalid code')) {
          toast.auth.invalidCode();
        } else {
          toast.auth.verificationError(res.error.message);
        }
        
        setLoading(false);
        return;
      }

      // Succès !
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
    try {
      toast.info('Renvoi en cours...', 'Envoi d\'un nouveau code de vérification');
      
      let result;
      if (contact.includes('@')) {
        result = await supabase.auth.signInWithOtp({
          email: contact,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`
          }
        });
      } else {
        result = await supabase.auth.signInWithOtp({ phone: contact });
      }

      if (result.error) {
        console.error('Erreur renvoi:', result.error);
        toast.system.serverError();
        return;
      }

      toast.success('Code renvoyé !', 'Un nouveau code a été envoyé. Vérifiez vos messages');
      setCode(''); // Reset le code
      
    } catch (err) {
      console.error('Erreur renvoi code:', err);
      toast.system.networkError();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-green-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header avec branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Vérification</h1>
          <p className="text-night-foreground/70 text-lg">
            Entrez le code reçu pour confirmer votre identité
          </p>
        </div>

        {/* Informations sur le contact */}
        <div className="bg-night-foreground/10 backdrop-blur-lg border border-night-foreground/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            {contact.includes('@') ? (
              <div className="w-10 h-10 bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 7.89a1 1 0 001.42 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
              </div>
            )}
            <div>
              <p className="text-white font-medium">Code envoyé à :</p>
              <p className="text-night-foreground/70 text-sm">{contact}</p>
            </div>
          </div>
        </div>

        {/* Formulaire de vérification */}
        <div className="bg-night-foreground/10 backdrop-blur-lg border border-night-foreground/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleValidate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-night-foreground/90 mb-2">
                Code de vérification
              </label>
              <input
                type="text"
                placeholder="Entrez le code à 6 chiffres"
                className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-4 text-white text-center text-2xl font-mono tracking-widest placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} // Seulement les chiffres, max 6
                required
                maxLength={6}
                autoComplete="one-time-code"
              />
              <p className="text-xs text-night-foreground/60 mt-2 text-center">
                📱 Vérifiez vos {contact.includes('@') ? 'emails' : 'SMS'} (pensez aux spams)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-green-600/50 disabled:to-blue-600/50 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Vérification en cours...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Valider le code
                </>
              )}
            </button>
          </form>

          {/* Actions secondaires */}
          <div className="mt-6 pt-6 border-t border-night-foreground/20">
            <div className="text-center space-y-3">
              <p className="text-night-foreground/60 text-sm">
                Vous n'avez pas reçu le code ?
              </p>
              <button
                onClick={handleResendCode}
                disabled={loading}
                className="text-green-400 hover:text-green-300 font-medium text-sm transition-colors disabled:opacity-50"
              >
                Renvoyer le code
              </button>
            </div>
          </div>
        </div>

        {/* Bouton retour */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/login')}
            className="text-night-foreground/60 hover:text-night-foreground text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
            </svg>
            Retour à la connexion
          </button>
        </div>

        {/* Conseils de sécurité */}
        <div className="mt-8 p-4 bg-blue-900/10 border border-blue-800/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <div>
              <p className="text-blue-400 text-sm font-medium mb-1">Conseil de sécurité</p>
              <p className="text-blue-300/80 text-xs">
                Ne partagez jamais votre code de vérification. Notre équipe ne vous le demandera jamais.
              </p>
            </div>
          </div>
        </div>

        {/* Debug info (à supprimer en production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <p className="text-yellow-400 text-xs font-mono">
              🛠️ Mode développement - Contact: {contact}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}