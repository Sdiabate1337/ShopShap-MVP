import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/components/ToastProvider';

export const metadata: Metadata = {
  title: 'ShopShap - Boutiques en ligne Afrique',
  description: 'Plateforme de boutiques en ligne optimisée pour l\'Afrique. Commandez facilement via WhatsApp. Performance mobile optimisée pour connexions 3G/4G.',
  keywords: 'boutique en ligne, e-commerce, vente, produits, commandes, ShopShap, Afrique, WhatsApp, mobile, 3G',
  authors: [{ name: 'ShopShap Team', url: 'https://shopshap.com' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover'
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ShopShap',
    startupImage: '/icons/apple-startup-768x1024.png'
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://shopshap.com',
    siteName: 'ShopShap',
    title: 'ShopShap - Boutiques en ligne Afrique',
    description: 'Plateforme optimisée pour l\'e-commerce mobile en Afrique. Commandez via WhatsApp.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ShopShap - Boutiques en ligne',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopShap - Boutiques en ligne Afrique',
    description: 'E-commerce mobile optimisé pour l\'Afrique',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'shopping'
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="fr">
      <head>
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />
        <link rel="dns-prefetch" href="//api.whatsapp.com" />
        <link rel="dns-prefetch" href="//wa.me" />
        
        {/* Preconnect for critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />
        
        {/* Critical font preload - simplified for SSR compatibility */}
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" 
          as="style" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
        
        {/* Favicon variations */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Microsoft tiles */}
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Mobile optimization meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="dark light" />
        
        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Resource hints for critical assets */}
        <link rel="modulepreload" href="/_next/static/chunks/main-app.js" />
        
        {/* Critical CSS inline for fastest rendering */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical rendering path optimization */
            html { font-family: system-ui, -apple-system, sans-serif; }
            body { margin: 0; background: #0a0a0a; color: #fff; }
            .loading-skeleton { 
              background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
            }
            @keyframes loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            /* Prevent layout shift */
            img { max-width: 100%; height: auto; }
            /* Critical button styles */
            .btn-primary { 
              background: linear-gradient(45deg, #3b82f6, #6366f1);
              border: none;
              border-radius: 12px;
              color: white;
              padding: 12px 24px;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s;
            }
            .btn-primary:hover { transform: scale(1.05); }
          `
        }} />
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