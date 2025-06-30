'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToasts } from '@/hooks/useToast';

export default function LoginPage() {
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToasts(); // ✅ Hook unifié

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation basique
      if (!contact.trim()) {
        toast.product.validationError('Email ou numéro de téléphone');
        setLoading(false);
        return;
      }

      let result;
      if (contact.includes('@')) {
        // Email login: magic link redirige direct sur /onboarding
        toast.system.syncInProgress();
        
        result = await supabase.auth.signInWithOtp({
          email: contact,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`
          }
        });

        if (result.error) throw result.error;

        toast.success('Lien envoyé !', 'Vérifiez votre boîte email et cliquez sur le lien pour vous connecter');
        
      } else {
        // Phone login (OTP), tu restes sur /verify
        // Make sure phone number is in international format (+225xxxxxxx)
        if (!contact.startsWith('+')) {
          toast.auth.loginError('Format du numéro invalide. Utilisez le format +225XXXXXXXX');
          setLoading(false);
          return;
        }

        toast.info('Envoi du code...', 'Vous allez recevoir un SMS avec votre code de vérification');
        
        result = await supabase.auth.signInWithOtp({ phone: contact });

        if (result.error) throw result.error;

        toast.success('Code envoyé !', 'Vérifiez vos SMS et entrez le code sur la page suivante');
        
        // Petit délai pour montrer le toast avant redirection
        setTimeout(() => {
          router.push(`/verify?contact=${encodeURIComponent(contact)}`);
        }, 1500);
      }

    } catch (error: any) {
      console.error('Erreur envoi code:', error);
      
      // Gestion des erreurs spécifiques
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-night via-night to-blue-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header avec logo/branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ShopShap</h1>
          <p className="text-night-foreground/70 text-lg">Votre boutique en ligne</p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-night-foreground/10 backdrop-blur-lg border border-night-foreground/20 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">Connexion</h2>
            <p className="text-night-foreground/70">
              Entrez votre email ou votre numéro WhatsApp pour recevoir votre code de connexion
            </p>
          </div>

          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-night-foreground/90 mb-2">
                Email ou numéro WhatsApp
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="exemple@email.com ou +225XXXXXXXX"
                  className="w-full bg-night-foreground/5 border border-night-foreground/30 rounded-lg px-4 py-3 text-white placeholder-night-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {contact.includes('@') ? (
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 7.89a1 1 0 001.42 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  ) : contact.startsWith('+') ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                  ) : null}
                </div>
              </div>
              
              {/* Aide pour le format */}
              <div className="mt-2 text-xs text-night-foreground/60">
                <p>💡 <strong>Email:</strong> Connexion par lien magique</p>
                <p>📱 <strong>Téléphone:</strong> Format international (+225XXXXXXXX)</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-600/50 disabled:to-purple-600/50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {contact.includes('@') ? 'Envoi du lien...' : 'Envoi du code SMS...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  {contact.includes('@') ? 'Recevoir le lien' : 'Recevoir le code SMS'}
                </>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-night-foreground/20"></div>
            <span className="px-3 text-night-foreground/50 text-sm">ou</span>
            <div className="flex-1 border-t border-night-foreground/20"></div>
          </div>

          {/* Bouton démo (optionnel) */}
          <button
            onClick={handleDemoAccess}
            className="w-full bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground border border-night-foreground/30 font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            Voir la démo
          </button>
        </div>

        {/* Footer informations */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-night-foreground/60 text-sm">
            🔐 Connexion sécurisée sans mot de passe
          </p>
          <p className="text-night-foreground/60 text-sm">
            Nouveau sur ShopShap ? Créez votre boutique après connexion
          </p>
        </div>

        {/* Debug info (à supprimer en production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <p className="text-yellow-400 text-xs font-mono">
              🛠️ Mode développement - Exemples de test :
            </p>
            <p className="text-yellow-300 text-xs mt-1">
              📧 test@example.com | 📱 +22500000000
            </p>
          </div>
        )}
      </div>
    </main>
  );
}