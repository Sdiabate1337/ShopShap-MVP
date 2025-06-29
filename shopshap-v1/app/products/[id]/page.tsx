'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Product = {
  id: number;
  name: string;
  price: number;
  photo_url: string | null;
  video_url: string | null;
  description: string | null;
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        setProduct(data as Product);

        // Génère la signed URL pour l'image si elle existe
        if (data.photo_url) {
          const { data: photoData, error: photoError } = await supabase
            .storage
            .from('shop-photos')
            .createSignedUrl(data.photo_url, 60 * 60); // 1h
          setPhotoUrl(photoData?.signedUrl ?? null);
        } else {
          setPhotoUrl(null);
        }

        // Génère la signed URL pour la vidéo si elle existe
        if (data.video_url) {
          const { data: videoData, error: videoError } = await supabase
            .storage
            .from('product-videos')
            .createSignedUrl(data.video_url, 60 * 60); // 1h
          setVideoUrl(videoData?.signedUrl ?? null);
        } else {
          setVideoUrl(null);
        }
      }
      setLoading(false);
    }
    if (id) fetchProduct();
  }, [id]);

  if (loading) return <div>Chargement...</div>;
  if (!product) return <div>Produit non trouvé</div>;

  return (
    <div>
      <Link href="/products">&larr; Retour à la liste</Link>
      <h1>{product.name}</h1>
      <p>{product.price} €</p>
      {photoUrl && (
        <img src={photoUrl} alt={product.name} style={{ width: 400, objectFit: 'cover' }} />
      )}
      {videoUrl && (
        <div>
          <video src={videoUrl} controls width={400} style={{ marginTop: 12 }} />
        </div>
      )}
      <p style={{ marginTop: 16 }}>{product.description}</p>
    </div>
  );
}