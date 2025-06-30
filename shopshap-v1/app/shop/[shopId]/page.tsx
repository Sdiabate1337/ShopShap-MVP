'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { generateWhatsAppLink, generateShopIntroMessage } from '@/lib/whatsapp';
import Link from 'next/link';

type Shop = {
  id: string;
  name: string;
  activity: string;
  city: string;
  photo_url?: string;
  description?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  photo_url?: string;
  video_url?: string;
  description?: string;
  stock?: number;
};

type ProductWithUrls = Product & {
  signedPhotoUrl?: string;
  signedVideoUrl?: string;
};

export default function PublicShopPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopPhotoUrl, setShopPhotoUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShopData();
  }, [shopId]);

  async function fetchShopData() {
    setLoading(true);
    try {
      // Récupérer les infos de la boutique
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (shopError || !shopData) {
        setError('Boutique introuvable');
        return;
      }

      setShop(shopData);

      // Photo de la boutique
      if (shopData.photo_url) {
        const { data: urlData } = await supabase.storage
          .from('shop-photos')
          .createSignedUrl(shopData.photo_url, 60 * 60);
        setShopPhotoUrl(urlData?.signedUrl ?? null);
      }

      // Récupérer les produits
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Erreur produits:', productsError);
        return;
      }

      if (productsData) {
        // Générer les signed URLs
        const productsWithUrls = await Promise.all(
          productsData.map(async (product: Product) => {
            let signedPhotoUrl: string | undefined;
            let signedVideoUrl: string | undefined;

            if (product.photo_url) {
              const { data: photoData } = await supabase.storage
                .from('shop-photos')
                .createSignedUrl(product.photo_url, 60 * 60);
              signedPhotoUrl = photoData?.signedUrl ?? undefined;
            }

            if (product.video_url) {
              const { data: videoData } = await supabase.storage
                .from('product-videos')
                .createSignedUrl(product.video_url, 60 * 60);
              signedVideoUrl = videoData?.signedUrl ?? undefined;
            }

            return {
              ...product,
              signedPhotoUrl,
              signedVideoUrl,
            };
          })
        );

        setProducts(productsWithUrls);
      }

    } catch (err) {
      console.error('Erreur chargement boutique:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function handleContactShop() {
    if (!shop || typeof window === 'undefined') return;

    const message = generateShopIntroMessage({
      shopName: shop.name,
      activity: shop.activity,
      city: shop.city,
      description: shop.description,
      catalogUrl: window.location.href,
    });

    // Ouvre WhatsApp dans un nouvel onglet
    const whatsappUrl = generateWhatsAppLink('', message);
    window.open(whatsappUrl, '_blank');
  }

  function handleContactForProduct(product: ProductWithUrls) {
    if (!shop || typeof window === 'undefined') return;

    const message = `🛍️ *${product.name}*\n\n💰 Prix: *${product.price.toLocaleString()} FCFA*\n\n${product.description ? `📝 ${product.description}\n\n` : ''}🏪 Boutique: *${shop.name}*\n\n✨ Je suis intéressé(e) par cet article !\n\n👉 ${window.location.origin}/shop/${shop.id}/product/${product.id}`;

    const whatsappUrl = generateWhatsAppLink('', message);
    window.open(whatsappUrl, '_blank');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-night-foreground/70">Chargement de la boutique...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Boutique introuvable</h1>
          <p className="text-night-foreground/70">Cette boutique n'existe pas ou n'est plus disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night text-night-foreground font-sans">
      {/* Header de la boutique */}
      <header className="bg-night-foreground/5 border-b border-night-foreground/20">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {shopPhotoUrl && (
              <img
                src={shopPhotoUrl}
                alt={shop.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-blue-800/50"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-night-foreground">{shop.name}</h1>
              <p className="text-lg text-blue-400 font-medium">{shop.activity}</p>
              <p className="text-night-foreground/70">📍 {shop.city}</p>
              {shop.description && (
                <p className="text-night-foreground/80 mt-2">{shop.description}</p>
              )}
            </div>
            <button
              onClick={handleContactShop}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              Contacter sur WhatsApp
            </button>
          </div>
        </div>
      </header>

      {/* Catalogue de produits */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-night-foreground mb-2">Notre catalogue</h2>
          <p className="text-night-foreground/70">{products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-night-foreground/40 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-night-foreground mb-2">Catalogue en cours de mise à jour</h3>
            <p className="text-night-foreground/60 mb-6">De nouveaux produits seront bientôt disponibles !</p>
            <button
              onClick={handleContactShop}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Nous contacter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg overflow-hidden hover:bg-night-foreground/10 transition-all duration-200 group">
                {product.signedPhotoUrl ? (
                  <img
                    src={product.signedPhotoUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-night-foreground/10 flex items-center justify-center">
                    <svg className="w-12 h-12 text-night-foreground/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-night-foreground mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-2xl font-bold text-blue-400 mb-3">{product.price.toLocaleString()} FCFA</p>
                  
                  {product.description && (
                    <p className="text-night-foreground/70 text-sm mb-3 line-clamp-2">{product.description}</p>
                  )}
                  
                  {product.stock !== undefined && product.stock !== null && (
                    <p className={`text-xs mb-3 px-2 py-1 rounded-full inline-block ${
                      product.stock > 0 
                        ? 'text-green-400 bg-green-900/20' 
                        : 'text-red-400 bg-red-900/20'
                    }`}>
                      {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Link 
                      href={`/shop/${shopId}/product/${product.id}`}
                      className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground text-center py-2 px-3 rounded border border-night-foreground/20 transition-colors text-sm font-medium"
                    >
                      Voir détail
                    </Link>
                    <button
                      onClick={() => handleContactForProduct(product)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded transition-colors text-sm font-medium"
                    >
                      Commander
                    </button>
                  </div>
                </div>

                {product.signedVideoUrl && (
                  <div className="px-4 pb-4">
                    <video
                      src={product.signedVideoUrl}
                      controls
                      className="w-full h-32 rounded border border-night-foreground/20 object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-night-foreground/10 border-t border-night-foreground/20 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-2 text-night-foreground">{shop.name}</h3>
          <p className="text-night-foreground/70 mb-4">{shop.activity} • {shop.city}</p>
          <button
            onClick={handleContactShop}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Nous contacter sur WhatsApp
          </button>
          <div className="mt-6 pt-6 border-t border-night-foreground/20 text-sm text-night-foreground/50">
            <p>Boutique en ligne propulsée par ShopShap</p>
          </div>
        </div>
      </footer>
    </div>
  );
}