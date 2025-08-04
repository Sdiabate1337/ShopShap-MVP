// ✅ SANS 'use client' - Composant serveur pour les métadonnées - CORRIGÉ
import { supabase } from '@/lib/supabaseClient';
import ProductClientPage from './client-page';

// ✅ Métadonnées SEO pour le produit - CORRIGÉES
export async function generateMetadata({ params }: { 
  params: Promise<{ slug: string; productId: string }> 
}) {
  try {
    const { slug, productId } = await params;
    console.log('🔍 Génération métadonnées pour:', { slug, productId });
    
    // Récupérer la boutique par slug
    const { data: shop } = await supabase
      .from('shops')
      .select('id, name, activity, city')
      .eq('slug', slug)
      .single();

    if (!shop) {
      return {
        title: 'Produit introuvable - ShopShap',
        description: 'Ce produit n\'existe pas ou n\'est plus disponible.',
        robots: 'noindex, nofollow'
      };
    }

    // Récupérer le produit
    const { data: product } = await supabase
      .from('products')
      .select('name, description, price, photo_url, category, stock')
      .eq('id', productId)
      .eq('shop_id', shop.id)
      .single();

    if (!product) {
      return {
        title: 'Produit introuvable - ShopShap',
        description: 'Ce produit n\'existe pas ou n\'est plus disponible.',
        robots: 'noindex, nofollow'
      };
    }

    const productImageUrl = product.photo_url 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/shop-photos/${product.photo_url}`
      : null;

    const productTitle = `${product.name} - ${shop.name} | ShopShap`;
    const productDescription = product.description || 
      `${product.name} disponible chez ${shop.name} à ${shop.city}. Prix: ${product.price.toLocaleString()} FCFA`;

    return {
      title: productTitle,
      description: productDescription,
      keywords: `${product.name}, ${shop.name}, ${shop.activity}, ${shop.city}, achat en ligne, ShopShap, ${product.category || ''}`,
      authors: [{ name: shop.name }],
      creator: shop.name,
      publisher: 'ShopShap',
      robots: 'index, follow',
      
      // ✅ OpenGraph CORRIGÉ - Utiliser 'website' au lieu de 'product'
      openGraph: {
        title: `${product.name} - ${product.price.toLocaleString()} FCFA`,
        description: productDescription,
        url: `/${slug}/product/${productId}`,
        siteName: 'ShopShap',
        type: 'website', // ✅ CHANGÉ de 'product' à 'website'
        locale: 'fr_FR',
        images: productImageUrl ? [{
          url: productImageUrl,
          width: 800,
          height: 800,
          alt: product.name,
          type: 'image/jpeg'
        }] : [{
          url: '/og-default.jpg', // Image par défaut
          width: 1200,
          height: 630,
          alt: `${product.name} - ${shop.name}`
        }]
      },
      
      // ✅ Twitter Card AMÉLIORÉE
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} - ${product.price.toLocaleString()} FCFA`,
        description: productDescription.slice(0, 160), // Limite Twitter
        images: productImageUrl ? [productImageUrl] : ['/og-default.jpg'],
        creator: '@ShopShap',
        site: '@ShopShap'
      },
      
      // ✅ Métadonnées alternatives
      alternates: {
        canonical: `/${slug}/product/${productId}`,
        languages: {
          'fr': `/${slug}/product/${productId}`,
          'fr-SN': `/${slug}/product/${productId}`
        }
      },
      
      // ✅ Métadonnées étendues - CORRIGÉES
      other: {
        // Métadonnées e-commerce personnalisées
        'product:price:amount': product.price.toString(),
        'product:price:currency': 'XOF', // Franc CFA
        'product:availability': (product.stock && product.stock > 0) ? 'in stock' : 'out of stock',
        'product:condition': 'new',
        'product:category': product.category || shop.activity,
        'product:brand': shop.name,
        
        // Métadonnées business
        'business:contact_data:street_address': shop.city,
        'business:contact_data:locality': shop.city,
        'business:contact_data:region': 'Dakar',
        'business:contact_data:country_name': 'Sénégal',
        'business:contact_data:website': `/${slug}`,
        
        // Métadonnées de localisation
        'geo:region': 'SN', // Code pays Sénégal
        'geo:placename': shop.city,
        'geo:position': '14.6928;-17.4467', // Coordonnées Dakar
        'ICBM': '14.6928, -17.4467',
        
        // Métadonnées SEO additionnelles
        'theme-color': '#1e40af', // Couleur du thème
        'application-name': 'ShopShap',
        'apple-mobile-web-app-title': 'ShopShap',
        'msapplication-TileColor': '#1e40af',
        
        // Métadonnées de référencement local
        'locality': shop.city,
        'region': 'Dakar',
        'country': 'Sénégal',
        'language': 'fr'
      },
      
      // ✅ Métadonnées pour les réseaux sociaux
      facebook: {
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || undefined
      },
      
      // ✅ Métadonnées pour l'app mobile
      appleWebApp: {
        capable: true,
        title: 'ShopShap',
        statusBarStyle: 'black-translucent'
      },
      
      // ✅ Métadonnées de vérification
      verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
        other: {
          'facebook-domain-verification': process.env.NEXT_PUBLIC_FACEBOOK_VERIFICATION || undefined
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Erreur génération métadonnées produit:', error);
    return {
      title: 'ShopShap - Marketplace en ligne au Sénégal',
      description: 'Découvrez nos produits de qualité en ligne sur ShopShap. Livraison à Dakar et dans tout le Sénégal.',
      robots: 'index, follow',
      openGraph: {
        title: 'ShopShap - Marketplace Sénégal',
        description: 'Marketplace en ligne au Sénégal',
        type: 'website',
        locale: 'fr_FR',
        siteName: 'ShopShap'
      }
    };
  }
}

// ✅ Export par défaut avec gestion d'erreur
export default async function ProductSlugPage({ params }: { 
  params: Promise<{ slug: string; productId: string }> 
}) {
  // ✅ Validation des paramètres
  const { slug, productId } = await params;
  if (!slug || !productId) {
    console.error('❌ Paramètres manquants:', { slug, productId });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Paramètres invalides</h1>
          <p>Cette page nécessite un slug de boutique et un ID de produit valides.</p>
        </div>
      </div>
    );
  }

  return <ProductClientPage slug={slug} productId={productId} />;
}

// ✅ Métadonnées statiques pour améliorer les performances
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Nécessaire pour les métadonnées dynamiques
export const revalidate = 3600; // Revalider toutes les heures