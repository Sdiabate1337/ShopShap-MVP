'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const bottomMenuItems = [
  {
    label: 'Accueil',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6"></path>
      </svg>
    ),
    route: '/dashboard',
  },
  {
    label: 'Catalogue',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"></path>
      </svg>
    ),
    route: '/products',
  },
  {
    label: 'Commandes',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2"></path>
      </svg>
    ),
    route: '/orders',
  },
  {
    label: 'Profil',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z"></path>
      </svg>
    ),
    route: '/profile',
  },
];

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState<number | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const router = useRouter();

  // Récupère le shop_id du vendeur connecté
  async function getShopIdForUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("shops")
      .select("id")
      .eq("user_id", user.id)
      .single();
    return data?.id || null;
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setVideo(file);
    setVideoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const shop_id = await getShopIdForUser();
      if (!shop_id) throw new Error("Boutique introuvable.");

      let photo_path: string | null = null;
      let video_path: string | null = null;

      // Upload photo
      if (photo) {
        const photoStoragePath = `products/${Date.now()}_${photo.name}`;
        const { data, error } = await supabase.storage
          .from("shop-photos")
          .upload(photoStoragePath, photo, { cacheControl: "3600" });
        if (error) throw error;
        photo_path = data?.path ?? null;
      }

      // Upload vidéo
      if (video) {
        const videoStoragePath = `products/${Date.now()}_${video.name}`;
        const { data, error } = await supabase.storage
          .from('product-videos')
          .upload(videoStoragePath, video, { cacheControl: "3600" });
        if (error) throw error;
        video_path = data?.path ?? null;
      }

      // Ajout produit en BDD
      const { error: insertError } = await supabase
        .from("products")
        .insert([
          {
            shop_id,
            name,
            price,
            description,
            stock: stock === "" ? null : stock,
            photo_url: photo_path,
            video_url: video_path,
          },
        ]);
      if (insertError) throw insertError;

      setSuccess("Produit ajouté avec succès !");
      // Reset form
      setName("");
      setPrice("");
      setStock("");
      setDescription("");
      setPhoto(null);
      setPhotoPreview(null);
      setVideo(null);
      setVideoPreview(null);

      setTimeout(() => {
        router.push("/products");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-full min-h-screen bg-night text-night-foreground pb-20 sm:pb-8 font-sans">
      {/* MENU BOTTOM NAV MOBILE */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden">
        <div className="relative w-full">
          <button
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-night-foreground/80 text-night px-4 py-2 rounded-full shadow-lg border border-night-foreground"
            onClick={() => setOpenMenu((v) => !v)}
            aria-label="Ouvrir le menu"
          >
            <svg className={`w-6 h-6 transition-transform duration-200 ${openMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div className={`flex flex-col items-center bg-night border-t border-night-foreground w-full transition-all duration-200 ${openMenu ? "h-52 py-4" : "h-0 py-0 overflow-hidden"}`}>
            {bottomMenuItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-2 text-night-foreground py-2 w-full justify-center hover:bg-night-foreground/10 transition"
                onClick={() => {
                  setOpenMenu(false);
                  router.push(item.route);
                }}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
            <button
              className="flex items-center gap-2 text-red-400 py-2 w-full justify-center hover:bg-red-800/10 transition mt-2"
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace('/login');
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"></path>
              </svg>
              <span className="text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </nav>

      {/* DESKTOP MENU */}
      <nav className="hidden sm:flex gap-4 mb-6 pt-8 px-4 max-w-2xl mx-auto">
        {bottomMenuItems.map((item) => (
          <button
            key={item.label}
            className="bg-night-foreground/10 text-night-foreground rounded px-3 py-1"
            onClick={() => router.push(item.route)}
          >
            {item.label}
          </button>
        ))}
        <button
          className="ml-auto text-red-400 hover:underline"
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }}
        >
          Déconnexion
        </button>
      </nav>

      {/* CONTENT */}
      <section className="max-w-2xl mx-auto pt-6 px-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-night-foreground/70 hover:text-night-foreground transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
            </svg>
            Retour
          </button>
          <h1 className="text-2xl font-bold">Ajouter un produit</h1>
          <div className="w-16"></div> {/* Spacer pour centrer le titre */}
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Nom du produit */}
          <div>
            <label className="block text-sm font-medium text-night-foreground/80 mb-2">
              Nom du produit <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Robe wax africaine"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 text-night-foreground placeholder:text-night-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Prix et Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                Prix <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="15000"
                  value={price}
                  onChange={e => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  required
                  className="w-full bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 pr-16 text-night-foreground placeholder:text-night-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-3 text-night-foreground/60 text-sm">FCFA</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-night-foreground/80 mb-2">
                Stock (optionnel)
              </label>
              <input
                type="number"
                min={0}
                placeholder="10"
                value={stock}
                onChange={e => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 text-night-foreground placeholder:text-night-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-night-foreground/80 mb-2">
              Description (optionnel)
            </label>
            <textarea
              placeholder="Décrivez votre produit..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-night-foreground/5 border border-night-foreground/20 rounded-lg px-4 py-3 text-night-foreground placeholder:text-night-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-night-foreground/80 mb-2">
              Photo du produit (optionnel)
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full text-sm text-night-foreground/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
              />
              {photoPreview && (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Aperçu photo"
                    className="h-32 w-auto rounded-lg border border-night-foreground/20 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Vidéo */}
          <div>
            <label className="block text-sm font-medium text-night-foreground/80 mb-2">
              Vidéo du produit (optionnel)
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full text-sm text-night-foreground/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
              />
              {videoPreview && (
                <div className="relative inline-block">
                  <video
                    src={videoPreview}
                    controls
                    className="h-32 w-auto rounded-lg border border-night-foreground/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setVideo(null);
                      setVideoPreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages d'erreur et succès */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
              <p className="text-green-400 text-sm text-center">{success}</p>
            </div>
          )}

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={loading || !name || price === ""}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                <span>Ajout en cours...</span>
              </div>
            ) : (
              'Ajouter le produit'
            )}
          </button>
        </form>
      </section>
    </main>
  );
}