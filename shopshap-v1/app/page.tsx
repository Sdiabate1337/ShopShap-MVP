import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-night via-night to-blue-950">
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-md opacity-50"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
            </div>
            <span className="text-white font-semibold text-xl">ShopShap</span>
          </div>
          <Link 
            href="/login" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full transition-colors"
          >
            Se connecter
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Vendez plus facilement sur{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              TikTok & WhatsApp
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Créez votre catalogue en ligne en quelques minutes. Partagez un seul lien et recevez vos commandes directement sur WhatsApp.
          </p>
          <p className="text-gray-400 mb-8">Sans compétences techniques</p>
          <Link 
            href="/login" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors inline-block"
          >
            Créer ma boutique gratuitement
          </Link>
          <p className="text-sm text-gray-400 mt-4">Gratuit • Sans engagement</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Tout ce dont vous avez besoin pour vendre
          </h2>
          <p className="text-gray-400 text-center mb-16">
            Une solution complète pour les vendeurs TikTok et WhatsApp en Afrique francophone
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 text-center border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2 group-hover:text-purple-300 transition-colors duration-300">Catalogue mobile</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
                Créez et gérez votre catalogue depuis votre téléphone
              </p>
            </div>
            
            <div className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 text-center border border-slate-700 hover:border-green-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2 group-hover:text-green-300 transition-colors duration-300">Lien WhatsApp direct</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
                Vos clients commandent directement via WhatsApp
              </p>
            </div>
            
            <div className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 text-center border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2 group-hover:text-blue-300 transition-colors duration-300">Partage facilité</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
                Un seul lien à partager sur TikTok, WhatsApp et Facebook
              </p>
            </div>
            
            <div className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 text-center border border-slate-700 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2 group-hover:text-orange-300 transition-colors duration-300">Suivi des ventes</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
                Tableau de bord simple pour suivre vos commandes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Ce que vous gagnez avec ShopShap
          </h2>
          <p className="text-gray-400 text-center mb-16">
            Économisez du temps et augmentez vos ventes avec notre solution
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="group flex items-start space-x-4 hover:transform hover:translate-x-2 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-green-300 transition-colors duration-300">Gagnez du temps au quotidien</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Plus besoin de répéter les mêmes informations à chaque client. Votre catalogue répond automatiquement aux questions sur les prix et détails.
                </p>
              </div>
            </div>
            
            <div className="group flex items-start space-x-4 hover:transform hover:translate-x-2 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-blue-300 transition-colors duration-300">Augmentez vos ventes</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Un processus de commande fluide = moins de clients perdus. Vos followers peuvent commander en 2 clics depuis votre bio TikTok.
                </p>
              </div>
            </div>
            
            <div className="group flex items-start space-x-4 hover:transform hover:translate-x-2 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-purple-300 transition-colors duration-300">Paraissez plus professionnel</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Un catalogue en ligne donne confiance à vos clients et vous démarque de la concurrence qui vend encore "à l'ancienne".
                </p>
              </div>
            </div>
            
            <div className="group flex items-start space-x-4 hover:transform hover:translate-x-2 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-orange-300 transition-colors duration-300">Développez votre activité</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Suivez vos ventes, identifiez vos produits les plus populaires et prenez de meilleures décisions business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à digitaliser votre business ?
          </h2>
          <p className="text-gray-400 mb-8">
            Rejoignez les centaines de vendeurs qui font déjà confiance à ShopShap
          </p>
          <Link 
            href="/login" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors inline-block"
          >
            Commencer maintenant
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Tarifs transparents
          </h2>
          <p className="text-gray-400 text-center mb-16">
            Commencez gratuitement, évoluez selon vos besoins
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
              <h3 className="text-white font-bold text-xl mb-2">Gratuit</h3>
              <div className="text-3xl font-bold text-white mb-4">
                0 <span className="text-lg font-normal text-gray-400">FCFA</span>
              </div>
              <p className="text-gray-400 mb-6">Parfait pour commencer</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-3">✓</span>
                  1 catalogue
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-3">✓</span>
                  5 produits maximum
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-3">✓</span>
                  Lien WhatsApp
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-3">✓</span>
                  Support communautaire
                </li>
              </ul>
              <Link 
                href="/login" 
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-full font-semibold transition-colors block text-center"
              >
                Commencer gratuitement
              </Link>
            </div>
            
            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Populaire
                </span>
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Pro</h3>
              <div className="text-3xl font-bold text-white mb-4">
                2,500 <span className="text-lg font-normal text-gray-400">FCFA</span>
              </div>
              <p className="text-gray-400 mb-6">Par mois</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-3">✓</span>
                  Catalogues illimités
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-3">✓</span>
                  Produits illimités
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-3">✓</span>
                  Catégories personnalisées
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-3">✓</span>
                  Design personnalisé
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-3">✓</span>
                  Statistiques avancées
                </li>
                <li className="flex items-center text-gray-300">
                  <span className="text-green-400 mr-3">✓</span>
                  Support prioritaire
                </li>
              </ul>
              <Link 
                href="/login" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-full font-semibold transition-colors block text-center"
              >
                Choisir le plan Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-md opacity-50"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
              </div>
              <span className="text-white font-semibold text-xl">ShopShap</span>
            </div>
              <p className="text-gray-400 text-sm">
                La solution e-commerce pour les vendeurs TikTok et WhatsApp en Afrique francophone.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Exemples</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Centre d'aide</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">WhatsApp</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Confidentialité</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Conditions</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 ShopShap. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
