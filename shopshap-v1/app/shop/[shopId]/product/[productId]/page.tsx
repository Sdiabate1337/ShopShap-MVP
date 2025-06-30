'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { generateWhatsAppLink, generateProductMessage } from '@/lib/whatsapp';

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

export default function PublicProductPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  const productId = params.productId as string;
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [shopPhotoUrl, setShopPhotoUrl] = useState<string | null>(null);
  const [productPhotoUrl, setProductPhotoUrl] = useState<string | null>(null);
  const [productVideoUrl, setProductVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductData();
  }, [shopId, productId]);

  async function fetchProductData() {
    setLoading(true);
    try {
      // Récupérer le produit avec les infos de la boutique
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          shops (
            id,
            name,
            activity,
            city,
            photo_url,
            description
          )
        `)
        .eq('id', productId)
        .eq('shop_id', shopId)
        .single();

      if (productError || !productData) {
        console.error('Erreur produit:', productError);
        setError('Produit introuvable');
        return;
      }

      setProduct(productData);
      setShop(productData.shops);

      // Signed URLs
      if (productData.photo_url) {
        const { data: photoData } = await supabase.storage
          .from('shop-photos')
          .createSignedUrl(productData.photo_url, 60 * 60);
        setProductPhotoUrl(photoData?.signedUrl ?? null);
      }

      if (productData.video_url) {
        const { data: videoData } = await supabase.storage
          .from('product-videos')
          .createSignedUrl(productData.video_url, 60 * 60);
        setProductVideoUrl(videoData?.signedUrl ?? null);
      }

      if (productData.shops?.photo_url) {
        const { data: shopPhotoData } = await supabase.storage
          .from('shop-photos')
          .createSignedUrl(productData.shops.photo_url, 60 * 60);
        setShopPhotoUrl(shopPhotoData?.signedUrl ?? null);
      }

    } catch (err) {
      console.error('Erreur chargement produit:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function handleOrderProduct() {
    if (!shop || !product) return;

    const message = generateProductMessage({
      productName: product.name,
      price: product.price,
      description: product.description,
      shopName: shop.name,
      productUrl: window.location.href,
    });

    // Ouvre WhatsApp
    const whatsappUrl = generateWhatsAppLink('', message);
    window.open(whatsappUrl, '_blank');
  }

  function handleShareProduct() {
    if (typeof window !== 'undefined') {
      if (navigator.share && 'share' in navigator) {
        navigator.share({
          title: product?.name,
          text: `Découvrez ${product?.name} - ${product?.price.toLocaleString()} FCFA`,
          url: window.location.href,
        }).catch(err => console.log('Erreur partage:', err));
      } else {
        // Fallback: copier le lien
        navigator.clipboard.writeText(window.location.href);
        alert('Lien copié dans le presse-papiers !');
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-night-foreground/70">Chargement du produit...</p>
      </div>
    );
  }

  if (error || !product || !shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-night text-night-foreground">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Produit introuvable</h1>
          <p className="text-night-foreground/70 mb-6">Ce produit n'existe pas ou n'est plus disponible.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push(`/shop/${shopId}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Voir la boutique
            </button>
            <button
              onClick={() => router.back()}
              className="bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground px-6 py-3 rounded-lg font-semibold transition-colors border border-night-foreground/20"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night text-night-foreground font-sans">
      {/* Header avec breadcrumb */}
      <header className="bg-night-foreground/5 border-b border-night-foreground/20">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <nav className="flex items-center space-x-2 text-sm text-night-foreground/60 mb-4">
            <button
              onClick={() => router.push(`/shop/${shopId}`)}
              className="hover:text-blue-400 transition-colors"
            >
              {shop.name}
            </button>
            <span>›</span>
            <span className="text-night-foreground font-medium">{product.name}</span>
          </nav>
          
          <div className="flex items-center gap-4">
            {shopPhotoUrl && (
              <img
                src={shopPhotoUrl}
                alt={shop.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-night-foreground/20"
              />
            )}
            <div>
              <h2 className="font-semibold text-night-foreground">{shop.name}</h2>
              <p className="text-sm text-night-foreground/70">{shop.activity} • {shop.city}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Média du produit */}
          <div className="space-y-4">
            {productPhotoUrl ? (
              <img
                src={productPhotoUrl}
                alt={product.name}
                className="w-full rounded-lg border border-night-foreground/20 object-cover aspect-square"
              />
            ) : (
              <div className="w-full aspect-square bg-night-foreground/10 rounded-lg border border-night-foreground/20 flex items-center justify-center">
                <svg className="w-16 h-16 text-night-foreground/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {productVideoUrl && (
              <video
                src={productVideoUrl}
                controls
                className="w-full rounded-lg border border-night-foreground/20"
              />
            )}
          </div>

          {/* Informations du produit */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-night-foreground mb-4">{product.name}</h1>
              <div className="text-4xl font-bold text-blue-400 mb-4">
                {product.price.toLocaleString()} FCFA
              </div>
              
              {product.stock !== undefined && product.stock !== null && (
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                  product.stock > 0 
                    ? 'bg-green-900/20 text-green-400 border-green-800' 
                    : 'bg-red-900/20 text-red-400 border-red-800'
                }`}>
                  {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
                </div>
              )}
            </div>

            {product.description && (
              <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-night-foreground mb-2">Description</h3>
                <p className="text-night-foreground/80 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={handleOrderProduct}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                Commander sur WhatsApp
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/shop/${shopId}`)}
                  className="flex-1 bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground py-3 px-4 rounded-lg font-medium border border-night-foreground/20 transition-colors"
                >
                  Voir la boutique
                </button>
                <button
                  onClick={handleShareProduct}
                  className="flex-1 bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 py-3 px-4 rounded-lg font-medium border border-blue-800 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                  </svg>
                  Partager
                </button>
              </div>
            </div>

            {/* Info boutique */}
            <div className="bg-night-foreground/5 border border-night-foreground/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-night-foreground mb-3">À propos de la boutique</h3>
              <div className="flex items-center gap-4">
                {shopPhotoUrl && (
                  <img
                    src={shopPhotoUrl}
                    alt={shop.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-night-foreground/20"
                  />
                )}
                <div>
                  <h4 className="font-semibold text-night-foreground">{shop.name}</h4>
                  <p className="text-night-foreground/70">{shop.activity}</p>
                  <p className="text-night-foreground/60 text-sm">📍 {shop.city}</p>
                  {shop.description && (
                    <p className="text-night-foreground/70 text-sm mt-1">{shop.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-night-foreground/10 border-t border-night-foreground/20 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-2 text-night-foreground">{shop.name}</h3>
          <p className="text-night-foreground/70 mb-4">{shop.activity} • {shop.city}</p>
          <button
            onClick={handleOrderProduct}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Commander sur WhatsApp
          </button>
          <div className="mt-6 pt-6 border-t border-night-foreground/20 text-sm text-night-foreground/50">
            <p>Boutique en ligne propulsée par ShopShap</p>
          </div>
        </div>
      </footer>
    </div>
  );
}