'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from '@/lib/supabaseClient';

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number | null;
  photo_url: string | null;
  video_url: string | null;
  shop_id: string;
};

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

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState<number | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  async function fetchProduct() {
    setLoading(true);
    try {
      // Vérifier l'utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/login');
        return;
      }

      // Récupérer le produit avec vérification de propriété
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          shops!inner(user_id)
        `)
        .eq('id', productId)
        .eq('shops.user_id', session.user.id)
        .single();

      if (productError || !productData) {
        setError('Produit introuvable ou accès non autorisé');
        return;
      }

      setProduct(productData);
      setName(productData.name);
      setPrice(productData.price);
      setDescription(productData.description || "");
      setStock(productData.stock || "");

      // Générer les signed URLs pour les médias existants
      if (productData.photo_url) {
        const { data: photoData } = await supabase.storage
          .from('product-photos')
          .createSignedUrl(productData.photo_url, 60 * 60);
        setCurrentPhotoUrl(photoData?.signedUrl || null);
      }

      if (productData.video_url) {
        const { data: videoData } = await supabase.storage
          .from('product-videos')
          .createSignedUrl(productData.video_url, 60 * 60);
        setCurrentVideoUrl(videoData?.signedUrl || null);
      }

    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
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
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let photo_url = product?.photo_url;
      let video_url = product?.video_url;

      // Upload nouvelle photo si sélectionnée
      if (photo) {
        // Supprimer l'ancienne photo si elle existe
        if (product?.photo_url) {
          await supabase.storage
            .from('product-photos')
            .remove([product.photo_url]);
        }

        const photoPath = `products/${Date.now()}_${photo.name}`;
        const { data, error } = await supabase.storage
          .from('product-photos')
          .upload(photoPath, photo, { cacheControl: "3600" });
        
        if (error) throw error;
        photo_url = data?.path ?? null;
      }

      // Upload nouvelle vidéo si sélectionnée
      if (video) {
        // Supprimer l'ancienne vidéo si elle existe
        if (product?.video_url) {
          await supabase.storage
            .from('product-videos')
            .remove([product.video_url]);
        }

        const videoPath = `products/${Date.now()}_${video.name}`;
        const { data, error } = await supabase.storage
          .from('product-videos')
          .upload(videoPath, video, { cacheControl: "3600" });
        
        if (error) throw error;
        video_url = data?.path ?? null;
      }

      // Mettre à jour le produit
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name,
          price,
          description: description || null,
          stock: stock === "" ? null : stock,
          photo_url,
          video_url,
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      setSuccess('Produit mis à jour avec succès !');
      setTimeout(() => {
        router.push('/products');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      // Supprimer les fichiers du storage
      if (product?.photo_url) {
        await supabase.storage
          .from('product-photos')
          .remove([product.photo_url]);
      }
      if (product?.video_url) {
        await supabase.storage
          .from('product-videos')
          .remove([product.video_url]);
      }

      // Supprimer le produit de la base
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      router.push('/products');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function removeCurrentPhoto() {
    if (!product?.photo_url) return;
    
    try {
      // Supprimer du storage
      await supabase.storage
        .from('product-photos')
        .remove([product.photo_url]);

      // Mettre à jour en base
      const { error } = await supabase
        .from('products')
        .update({ photo_url: null })
        .eq('id', productId);

      if (error) throw error;

      setCurrentPhotoUrl(null);
      setProduct(prev => prev ? { ...prev, photo_url: null } : null);
    } catch (err) {
      console.error('Erreur suppression photo:', err);
    }
  }

  async function removeCurrentVideo() {
    if (!product?.video_url) return;
    
    try {
      // Supprimer du storage
      await supabase.storage
        .from('product-videos')
        .remove([product.video_url]);

      // Mettre à jour en base
      const { error } = await supabase
        .from('products')
        .update({ video_url: null })
        .eq('id', productId);

      if (error) throw error;

      setCurrentVideoUrl(null);
      setProduct(prev => prev ? { ...prev, video_url: null } : null);
    } catch (err) {
      console.error('Erreur suppression vidéo:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <span className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full mb-4"></span>
        <p>Chargement du produit…</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => router.push('/products')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retour au catalogue
        </button>
      </div>
    );
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
          <h1 className="text-2xl font-bold">Modifier le produit</h1>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Supprimer
          </button>
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

          {/* Photo actuelle et nouvelle */}
          <div>
            <label className="block text-sm font-medium text-night-foreground/80 mb-2">
              Photo du produit
            </label>
            <div className="space-y-3">
              {/* Photo actuelle */}
              {currentPhotoUrl && !photoPreview && (
                <div className="relative inline-block">
                  <img
                    src={currentPhotoUrl}
                    alt="Photo actuelle"
                    className="h-32 w-auto rounded-lg border border-night-foreground/20 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeCurrentPhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                  <span className="absolute -bottom-6 left-0 text-xs text-night-foreground/60">Photo actuelle</span>
                </div>
              )}

              {/* Nouvelle photo */}
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
                    alt="Nouvelle photo"
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
                  <span className="absolute -bottom-6 left-0 text-xs text-green-400">Nouvelle photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Vidéo actuelle et nouvelle */}
          <div>
            <label className="block text-sm font-medium text-night-foreground/80 mb-2">
              Vidéo du produit
            </label>
            <div className="space-y-3">
              {/* Vidéo actuelle */}
              {currentVideoUrl && !videoPreview && (
                <div className="relative inline-block">
                  <video
                    src={currentVideoUrl}
                    controls
                    className="h-32 w-auto rounded-lg border border-night-foreground/20"
                  />
                  <button
                    type="button"
                    onClick={removeCurrentVideo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                  <span className="absolute -bottom-6 left-0 text-xs text-night-foreground/60">Vidéo actuelle</span>
                </div>
              )}

              {/* Nouvelle vidéo */}
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
                  <span className="absolute -bottom-6 left-0 text-xs text-green-400">Nouvelle vidéo</span>
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

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-night-foreground/10 text-night-foreground py-3 px-4 rounded-lg font-semibold hover:bg-night-foreground/20 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !name || price === ""}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                  <span>Sauvegarde...</span>
                </div>
              ) : (
                'Sauvegarder'
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-night border border-night-foreground/20 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-night-foreground">Confirmer la suppression</h3>
            <p className="text-night-foreground/70 mb-6">
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 bg-night-foreground/10 text-night-foreground py-2 px-4 rounded-lg hover:bg-night-foreground/20 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                    <span>Suppression...</span>
                  </div>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}