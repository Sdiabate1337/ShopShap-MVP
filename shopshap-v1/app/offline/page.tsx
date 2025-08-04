export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-lg mx-auto text-center">
        {/* Offline Icon */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-3xl opacity-30 scale-110 animate-pulse" />
          <div className="relative w-32 h-32 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg 
              className="w-16 h-16 text-white" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth={2} 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Hors ligne
          </span>
        </h1>

        {/* Description */}
        <p className="text-xl text-white/80 mb-8 leading-relaxed">
          Vous êtes actuellement hors ligne. Cette page sera disponible dès que votre connexion sera rétablie.
        </p>

        {/* Connection tips for African users */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 text-left">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Conseils de connexion
          </h2>
          <ul className="text-white/70 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              Vérifiez votre signal réseau (3G/4G)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              Déplacez-vous vers une zone avec meilleur signal
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              Essayez de vous connecter au WiFi si disponible
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              Redémarrez votre application ou navigateur
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl flex items-center justify-center gap-3"
            aria-label="Réessayer la connexion"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Réessayer
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold border border-white/20 hover:border-white/40 transition-all duration-300 flex items-center justify-center gap-3"
            aria-label="Retour à la page précédente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </button>
        </div>

        {/* Status indicator */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-center gap-3 text-white/60">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm">Mode hors ligne activé</span>
          </div>
          <p className="text-xs text-white/40 mt-2">
            ShopShap - Optimisé pour l'Afrique
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Hors ligne - ShopShap',
  description: 'Page hors ligne pour ShopShap, optimisée pour les utilisateurs mobiles africains.',
  robots: 'noindex, nofollow',
};