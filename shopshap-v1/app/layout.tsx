import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/components/ToastProvider';

export const metadata: Metadata = {
  title: 'ShopShap - Votre boutique en ligne',
  description: 'Créez et gérez votre boutique en ligne facilement avec ShopShap. Vendez vos produits et gérez vos commandes en toute simplicité.',
  keywords: 'boutique en ligne, e-commerce, vente, produits, commandes, ShopShap',
  authors: [{ name: 'ShopShap Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-night text-night-foreground">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>

        
      </body>
    </html>
  );
}