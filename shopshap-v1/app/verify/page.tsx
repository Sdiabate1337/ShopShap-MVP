'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contact = searchParams.get('contact') || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    let res;
    if (contact.includes('@')) {
      res = await supabase.auth.verifyOtp({ email: contact, token: code, type: 'email' });
    } else {
      res = await supabase.auth.verifyOtp({ phone: contact, token: code, type: 'sms' });
    }
    setLoading(false);
    if (res.error) {
      setError(res.error.message);
    } else {
      // L'utilisateur est maintenant authentifié et créé !
      router.push('/onboarding');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-xl font-bold mb-4">Vérification du code</h1>
      <form onSubmit={handleValidate} className="space-y-4">
        <input
          type="text"
          placeholder="Code reçu"
          className="border rounded px-4 py-2 w-64"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2"
          disabled={loading}
        >
          {loading ? 'Vérification...' : 'Valider'}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </main>
  );
}