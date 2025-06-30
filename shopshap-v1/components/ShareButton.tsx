'use client';

import { useState } from 'react';

export interface ShareButtonProps {
  url: string;
  title: string;
  description: string;
  type: 'product' | 'shop';
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void; // ✅ Callback pour les toasts
}

export default function ShareButton({
  url,
  title,
  description,
  type,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);

    try {
      const fullUrl = `${window.location.origin}${url}`;
      
      // Essayer l'API Web Share native en premier
      if (navigator.share) {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        });
        
        // ✅ Partage réussi via API native
        if (onClick) {
          onClick();
        }
      } else {
        // Fallback: copier dans le presse-papiers + WhatsApp
        await navigator.clipboard.writeText(fullUrl);
        
        // ✅ Lien copié avec succès
        if (onClick) {
          onClick();
        }
        
        // Optionnel: Ouvrir WhatsApp avec le lien
        const whatsappMessage = encodeURIComponent(
          `${title}\n\n${description}\n\n👉 ${fullUrl}`
        );
        const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
        
        // Délai pour laisser le toast apparaître avant d'ouvrir WhatsApp
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 500);
      }
    } catch (error: any) {
      console.error('Erreur lors du partage:', error);
      
      // ✅ Gestion intelligente des erreurs
      if (error.name === 'AbortError' || 
          error.message?.includes('canceled') || 
          error.message?.includes('cancelled')) {
        // L'utilisateur a annulé le partage - comportement normal
        // Ne pas déclencher d'erreur ni de toast
        setIsSharing(false);
        return;
      }
      
      // ✅ Vraie erreur - essayer le fallback
      try {
        const fullUrl = `${window.location.origin}${url}`;
        await navigator.clipboard.writeText(fullUrl);
        
        // ✅ Fallback réussi
        if (onClick) {
          onClick();
        }
      } catch (clipboardError) {
        console.error('Erreur copie presse-papiers:', clipboardError);
        
        // ✅ Fallback ultime : sélectionner le texte pour copie manuelle
        const textArea = document.createElement('textarea');
        textArea.value = `${window.location.origin}${url}`;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
          document.execCommand('copy');
          if (onClick) {
            onClick();
          }
        } catch (execError) {
          console.error('Impossible de copier le lien:', execError);
          // Dans ce cas extrême, on peut afficher une alert avec le lien
          alert(`Voici le lien à partager :\n${window.location.origin}${url}`);
        }
        
        document.body.removeChild(textArea);
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Styles basés sur le variant et la size
  const getButtonStyles = () => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-lg disabled:opacity-50";
    
    // Tailles
    const sizeStyles = {
      sm: "text-xs px-2 py-1",
      md: "text-sm px-4 py-2",
      lg: "text-base px-6 py-3",
    };
    
    // Variants
    const variantStyles = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl",
      secondary: "bg-night-foreground/10 hover:bg-night-foreground/20 text-night-foreground border border-night-foreground/20",
      minimal: "bg-transparent hover:bg-night-foreground/10 text-night-foreground/70 hover:text-night-foreground",
    };
    
    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'md': return 'w-4 h-4';
      case 'lg': return 'w-5 h-5';
      default: return 'w-4 h-4';
    }
  };

  const getButtonText = () => {
    if (isSharing) return 'Partage...';
    
    switch (variant) {
      case 'minimal':
        return '';
      case 'secondary':
        return size === 'sm' ? 'Partager' : 'Partager le lien';
      default:
        return size === 'sm' ? 'Partager' : type === 'shop' ? 'Partager ma boutique' : 'Partager ce produit';
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`${getButtonStyles()} ${className}`}
      aria-label={`Partager ${type === 'shop' ? 'la boutique' : 'le produit'} ${title}`}
      title={`Partager ${type === 'shop' ? 'votre boutique' : 'ce produit'} avec vos clients`}
    >
      {isSharing ? (
        <svg className={`${getIconSize()} animate-spin`} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className={getIconSize()} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
        </svg>
      )}
      
      {getButtonText() && (
        <span className={variant === 'minimal' ? 'sr-only' : ''}>
          {getButtonText()}
        </span>
      )}
    </button>
  );
}