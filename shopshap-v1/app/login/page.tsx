'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    let result;
    if (contact.includes('@')) {
      // Email login: magic link redirige direct sur /onboarding
      result = await supabase.auth.signInWithOtp({
        email: contact,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`
        }
      });
    } else {
      // Phone login (OTP), tu restes sur /verify
      // Make sure phone number is in international format (+225xxxxxxx)
      result = await supabase.auth.signInWithOtp({ phone: contact });
    }

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
      // Si téléphone : redirige vers /verify pour saisir le code
      if (!contact.includes('@')) {
        router.push(`/verify?contact=${encodeURIComponent(contact)}`);
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Connexion à ShopShap</h1>
      <form onSubmit={handleSendCode} className="space-y-4">
        <input
          type="text"
          placeholder="Numéro WhatsApp (+225...) ou email"
          className="border rounded px-4 py-2 w-64"
          value={contact}
          onChange={e => setContact(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded px-4 py-2"
        >
          {loading ? 'Envoi du code...' : "Recevoir le code"}
        </button>
        {error && <p className="text-red-600">{error}</p>}
        {success && !contact.includes('@') && (
          <p className="text-green-600">
            Code envoyé ! Entrez-le sur la page suivante.
          </p>
        )}
        {success && contact.includes('@') && (
          <p className="text-green-600">
            Lien envoyé à votre email. Cliquez dessus pour valider la connexion.
          </p>
        )}
      </form>
    </main>
  );
}