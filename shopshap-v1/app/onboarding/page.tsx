'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function OnboardingPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    activity: '',
    city: '',
    photo: null as File | null,
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if user already has a shop
  useEffect(() => {
    const checkShop = async () => {
      if (!user) return;
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (shop) {
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    };
    checkShop();
  }, [user, router]);

  if (!user || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <span className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mb-4"></span>
        <p>Chargement…</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, photo: e.target.files?.[0] || null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    let photo_url = '';
    if (form.photo) {
      const fileExt = form.photo.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('shop-photos')
        .upload(fileName, form.photo);
      if (uploadError) {
        setError('Erreur lors de l’upload de la photo.');
        setSubmitting(false);
        return;
      }
      photo_url = data?.path || '';
    }

    const { error: insertError } = await supabase
      .from('shops')
      .insert([{
        user_id: user.id,
        name: form.name,
        activity: form.activity,
        city: form.city,
        photo_url,
        description: form.description
      }]);
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-2 bg-white">
      <h1 className="text-xl font-bold mb-6 text-center">Configurer votre boutique</h1>
      <form className="space-y-4 w-full max-w-xs" onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Nom de la boutique"
          value={form.name}
          onChange={handleChange}
          required
          className="border rounded px-4 py-2 w-full text-sm"
        />
        <input
          name="activity"
          placeholder="Activité principale"
          value={form.activity}
          onChange={handleChange}
          required
          className="border rounded px-4 py-2 w-full text-sm"
        />
        <input
          name="city"
          placeholder="Ville"
          value={form.city}
          onChange={handleChange}
          required
          className="border rounded px-4 py-2 w-full text-sm"
        />
        <input
          name="photo"
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="w-full text-sm"
        />
        <textarea
          name="description"
          placeholder="Description rapide (facultatif)"
          value={form.description}
          onChange={handleChange}
          className="border rounded px-4 py-2 w-full text-sm min-h-[70px] resize-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white rounded px-4 py-2 w-full font-semibold"
        >
          {submitting ? 'Enregistrement...' : 'Créer ma boutique'}
        </button>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </form>
    </main>
  );
}