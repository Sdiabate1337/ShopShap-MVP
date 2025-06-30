import { useToastContext } from '@/components/ToastProvider';

export function useToasts() {
  const { success, error, warning, info } = useToastContext();

  return {
    // ✅ Fonctions de base toujours accessibles
    success,
    error,
    warning,
    info,
    
    // ✅ Namespaces organisés par domaine
    auth: {
      loginSuccess: (email: string) => success('Connexion réussie !', `Bienvenue ${email}`),
      loginError: (reason?: string) => error('Connexion échouée', reason || 'Vérifiez vos identifiants'),
      logoutSuccess: () => info('Déconnexion', 'À bientôt sur ShopShap !'),
      registerSuccess: (shopName?: string) => success('Compte créé !', shopName ? `Bienvenue ${shopName}` : 'Bienvenue sur ShopShap'),
      passwordChanged: () => success('Mot de passe modifié', 'Votre compte est maintenant sécurisé'),
      sessionExpired: () => warning('Session expirée', 'Veuillez vous reconnecter'),
      emailTaken: () => warning('Email déjà utilisé', 'Cet email est déjà associé à un compte'),
      weakPassword: () => warning('Mot de passe faible', 'Utilisez au moins 8 caractères avec des chiffres'),
      
      // Méthodes pour la vérification
      validationError: (field: string) => error('Champ requis', `${field} est obligatoire`),
      invalidCode: () => error('Code incorrect', 'Le code saisi n\'est pas valide. Vérifiez et réessayez'),
      codeExpired: () => warning('Code expiré', 'Votre code a expiré. Demandez un nouveau code'),
      codeVerified: () => success('Code validé !', 'Votre identité a été confirmée avec succès'),
      verificationError: (message: string) => error('Erreur de vérification', message),
      welcomeMessage: () => info('Bienvenue !', 'Créons maintenant votre boutique en ligne'),
    },

    product: {
      created: (name: string) => success('Produit créé !', `${name} est maintenant disponible dans votre catalogue`),
      updated: (name: string) => success('Produit modifié !', `Les modifications de ${name} sont visibles`),
      deleted: (name: string) => warning('Produit supprimé', `${name} a été retiré de votre catalogue`),
      stockLow: (name: string, stock: number) => warning('Stock critique', `Il ne reste que ${stock} unité(s) de ${name}`),
      uploadStart: () => info('Upload en cours...', 'Téléchargement de vos images'),
      uploadSuccess: () => success('Images uploadées !', 'Vos photos ont été sauvegardées'),
      uploadError: (reason?: string) => error('Upload échoué', reason || 'Impossible de télécharger l\'image'),
      validationError: (field: string) => error('Champ requis', `${field} est obligatoire`),
      invalidFormat: (field: string, format: string) => warning('Format invalide', `${field} doit être au format: ${format}`),
    },

    order: {
      created: (amount: number) => success('Commande créée !', `Commande de ${amount.toLocaleString()} FCFA enregistrée`),
      updated: (status: string, customer?: string) => success('Statut mis à jour !', `Commande ${customer ? `de ${customer} ` : ''}marquée comme ${status}`),
      deleted: () => warning('Commande supprimée', 'La commande a été retirée de votre historique'),
      paymentReceived: (amount: number) => success('Paiement reçu !', `${amount.toLocaleString()} FCFA crédité`),
      newOrder: (customerName: string, amount: number | string) => {
        if (typeof amount === 'number') {
          return info('Nouvelle commande !', `${customerName} - ${amount.toLocaleString()} FCFA`);
        } else {
          return info('Nouvelles commandes !', `${amount} commandes en attente`);
        }
      },
      bulkUpdate: (count: number, action: string) => success('Action groupée', `${count} commande(s) ${action}`),
      proofUploaded: () => success('Preuve ajoutée !', 'La preuve de paiement a été enregistrée'),
      reminderSent: (customerName: string) => info('Rappel envoyé', `Notification envoyée à ${customerName}`),
    },

    shop: {
      welcome: (name: string) => success('Bon retour !', `Content de vous revoir ${name}`),
      profileUpdated: () => success('Profil mis à jour !', 'Vos modifications ont été sauvegardées avec succès'),
      linkShared: () => info('Lien partagé !', 'Votre catalogue a été partagé'),
      statsUpdated: () => info('Données synchronisées', 'Vos statistiques sont à jour'),
      photoSelected: () => info('Photo sélectionnée', 'N\'oubliez pas de sauvegarder vos modifications'),
    },

    system: {
      saveSuccess: () => success('Sauvegardé !', 'Vos modifications ont été enregistrées'),
      networkError: () => error('Connexion', 'Vérifiez votre connexion internet et réessayez'),
      serverError: () => error('Erreur serveur', 'Un problème temporaire est survenu'),
      syncInProgress: () => info('Synchronisation...', 'Mise à jour de vos données'),
      syncSuccess: () => success('Données synchronisées !', 'Votre boutique est à jour'),
      featureComingSoon: (feature: string) => info('Bientôt disponible', `${feature} arrive dans une prochaine mise à jour`),
      tip: (message: string) => info('💡 Conseil', message),
      actionUndoable: (action: string) => warning('Action effectuée', `${action} ne peut pas être annulé(e)`),
      fileTooLarge: () => error('Fichier trop volumineux', 'La photo ne doit pas dépasser 5MB'),
      invalidFormat: () => error('Format invalide', 'Veuillez sélectionner une image (JPG, PNG, etc.)'),
    },
  };
}