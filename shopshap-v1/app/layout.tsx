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
  manifest: '/manifest.json',
  themeColor: '#1e40af',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ShopShap'
  },
  openGraph: {
    type: 'website',
    siteName: 'ShopShap',
    title: 'ShopShap - Marketplace en ligne',
    description: 'Votre marketplace de confiance pour acheter et vendre en ligne au Sénégal',
    locale: 'fr_FR'
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  other: {
    'msapplication-TileColor': '#1e40af',
    'msapplication-config': '/browserconfig.xml'
  }
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ShopShap" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="ShopShap" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="antialiased bg-night text-night-foreground">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('✅ SW registered: ', registration.scope);
                    })
                    .catch(function(registrationError) {
                      console.warn('⚠️ SW registration failed: ', registrationError);
                    });
                });
              }
            `
          }}
        />

        {/* PWA Install Prompt Handler */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              let deferredPrompt;
              let installButton;

              window.addEventListener('beforeinstallprompt', (e) => {
                console.log('💾 PWA install prompt available');
                e.preventDefault();
                deferredPrompt = e;
                
                // Show install button if available
                installButton = document.querySelector('.pwa-install-btn');
                if (installButton) {
                  installButton.style.display = 'block';
                  installButton.addEventListener('click', () => {
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                          console.log('✅ PWA installed');
                        }
                        deferredPrompt = null;
                      });
                    }
                  });
                }
              });

              window.addEventListener('appinstalled', () => {
                console.log('✅ PWA was installed');
                if (installButton) {
                  installButton.style.display = 'none';
                }
                deferredPrompt = null;
              });
            `
          }}
        />
        
      </body>
    </html>
  );
}