// ✅ SANS 'use client' - Composant serveur pour les métadonnées
import { supabase } from '@/lib/supabaseClient';
import ShopClientPage from './client-page';

// ✅ Métadonnées pour le SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { data: shop } = await supabase
      .from('shops')
      .select('name, description, activity, city, photo_url')
      .eq('slug', slug)
      .single();

    if (!shop) {
      return {
        title: 'Boutique introuvable - ShopShap',
        description: 'Cette boutique n\'existe pas ou n\'est plus disponible.',
        robots: 'noindex, nofollow'
      };
    }

    return {
      title: `${shop.name} - ${shop.activity} à ${shop.city} | ShopShap`,
      description: shop.description || `Découvrez ${shop.name}, spécialisé en ${shop.activity} à ${shop.city}. Boutique en ligne sur ShopShap.`,
      keywords: `${shop.name}, ${shop.activity}, ${shop.city}, boutique en ligne, shopping, ShopShap`,
      authors: [{ name: 'ShopShap' }],
      creator: 'ShopShap',
      publisher: 'ShopShap',
      robots: 'index, follow',
      openGraph: {
        title: `${shop.name} - Boutique en ligne`,
        description: shop.description || `${shop.activity} à ${shop.city}`,
        url: `/${slug}`,
        siteName: 'ShopShap',
        type: 'website',
        locale: 'fr_FR',
        images: shop.photo_url ? [{
          url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/shop-photos/${shop.photo_url}`,
          width: 1200,
          height: 630,
          alt: `Photo de ${shop.name}`,
        }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${shop.name} - ${shop.activity}`,
        description: shop.description || `Boutique ${shop.activity} à ${shop.city}`,
      },
      alternates: {
        canonical: `/${slug}`,
      },
    };
  } catch (error) {
    console.error('Erreur génération métadonnées:', error);
    return {
      title: 'ShopShap - Marketplace en ligne',
      description: 'Découvrez nos boutiques partenaires sur ShopShap',
      robots: 'index, follow'
    };
  }
}

// ✅ Composant serveur qui rend le composant client
export default async function ShopSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ShopClientPage slug={slug} />;
}