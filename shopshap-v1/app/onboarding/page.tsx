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
        setError('Erreur lors de l\'upload de la photo.');
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
    <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-night text-night-foreground font-sans">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-8 text-center">Configurer votre boutique</h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <input
              name="name"
              placeholder="Nom de la boutique"
              value={form.name}
              onChange={handleChange}
              required
              className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 w-full text-sm text-night-foreground placeholder:text-night-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <input
              name="activity"
              placeholder="Activité principale"
              value={form.activity}
              onChange={handleChange}
              required
              className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 w-full text-sm text-night-foreground placeholder:text-night-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <input
              name="city"
              placeholder="Ville"
              value={form.city}
              onChange={handleChange}
              required
              className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 w-full text-sm text-night-foreground placeholder:text-night-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-night-foreground/80 mb-2">
              Photo de la boutique (facultatif)
            </label>
            <input
              name="photo"
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="w-full text-sm text-night-foreground/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
            />
          </div>
          <div>
            <textarea
              name="description"
              placeholder="Description rapide (facultatif)"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 w-full text-sm text-night-foreground placeholder:text-night-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 w-full font-semibold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                <span>Enregistrement...</span>
              </div>
            ) : (
              'Créer ma boutique'
            )}
          </button>
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}