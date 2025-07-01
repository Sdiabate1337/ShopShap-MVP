// ✅ Utilitaires pour générer les liens et messages WhatsApp - Version corrigée

export type WhatsAppMessageType = 'product' | 'order_reminder' | 'shop_intro' | 'custom' | 'order_confirmation' | 'delivery_update';

// ✅ Renommer avec préfixe WhatsApp pour éviter les conflits
export interface WhatsAppProductMessage {
  productName: string;
  price: number;
  description?: string;
  shopName: string;
  productUrl?: string;
  stock?: number;
  category?: string;
}

export interface WhatsAppOrderReminderMessage {
  clientName: string;
  productName: string;
  totalAmount: number;
  orderDate: string;
  shopName: string;
  orderId?: string;
  urgencyLevel?: 'low' | 'medium' | 'high';
}

export interface WhatsAppShopIntroMessage {
  shopName: string;
  activity: string;
  city: string;
  description?: string;
  catalogUrl?: string;
  whatsappNumber?: string;
  specialOffer?: string;
}

export interface WhatsAppOrderConfirmationMessage {
  clientName: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  shopName: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
}

export interface WhatsAppDeliveryUpdateMessage {
  clientName: string;
  productName: string;
  status: 'preparing' | 'shipped' | 'out_for_delivery' | 'delivered';
  trackingNumber?: string;
  shopName: string;
  estimatedTime?: string;
}

// ✅ Génère un lien WhatsApp avec message pré-rempli et validation améliorée
export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  // Nettoie et valide le numéro de téléphone
  let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ajoute le préfixe international si nécessaire (Sénégal: +221)
  if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
    cleanPhone = '221' + cleanPhone;
  } else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    cleanPhone = '221' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('221')) {
    cleanPhone = '221' + cleanPhone;
  }
  
  // Supprime le + si présent pour l'URL
  cleanPhone = cleanPhone.replace('+', '');
  
  // Encode le message pour l'URL avec caractères spéciaux WhatsApp
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

// ✅ Messages pour les produits avec signature mise à jour
export function generateProductMessage(data: WhatsAppProductMessage): string {
  const { productName, price, description, shopName, productUrl, stock, category } = data;
  
  let message = `🛍️ *${productName}*\n`;
  
  // Catégorie si disponible
  if (category) {
    message += `📂 Catégorie: ${category}\n`;
  }
  
  message += `\n💰 Prix: *${price.toLocaleString()} FCFA*\n`;
  
  // Stock disponible
  if (stock !== undefined) {
    if (stock > 0) {
      message += `✅ Stock: ${stock} disponible${stock > 1 ? 's' : ''}\n`;
    } else {
      message += `❌ Actuellement en rupture de stock\n`;
    }
  }
  
  message += `\n`;
  
  if (description) {
    message += `📝 *Description:*\n${description}\n\n`;
  }
  
  message += `🏪 Boutique: *${shopName}*\n`;
  message += `📍 Localisation: Sénégal\n\n`;
  
  if (stock === 0) {
    message += `⏰ *Produit épuisé* - Contactez-nous pour être notifié(e) du réapprovisionnement\n\n`;
  } else {
    message += `✨ *Intéressé(e) par cet article ?*\n`;
    message += `📱 Commandez directement via WhatsApp !\n\n`;
  }
  
  if (productUrl) {
    message += `👉 *Voir le produit:* ${productUrl}\n\n`;
  }
  
  // Services offerts
  message += `🎯 *Nos services:*\n`;
  message += `🚚 Livraison à Dakar et environs\n`;
  message += `💳 Paiement sécurisé (Mobile Money, Espèces)\n`;
  message += `🔄 Échange possible sous conditions\n`;
  message += `📞 Support client 7j/7\n\n`;
  
  // Hashtags pour le référencement
  const shopTag = shopName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  message += `#${shopTag} #Shopping #Senegal #Dakar`;
  
  if (category) {
    const categoryTag = category.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    message += ` #${categoryTag}`;
  }
  
  return message;
}

// ✅ Messages de relance commande avec signature mise à jour
export function generateOrderReminderMessage(data: WhatsAppOrderReminderMessage): string {
  const { clientName, productName, totalAmount, orderDate, shopName, orderId, urgencyLevel = 'medium' } = data;
  
  const urgencyEmojis = {
    low: '🔔',
    medium: '⏰',
    high: '🚨'
  };
  
  const urgencyMessages = {
    low: 'Petit rappel amical concernant',
    medium: 'Rappel concernant',
    high: 'Rappel urgent concernant'
  };
  
  let message = `${urgencyEmojis[urgencyLevel]} Bonjour ${clientName} ! 👋\n\n`;
  message += `J'espère que vous allez bien. 😊\n\n`;
  message += `${urgencyMessages[urgencyLevel]} votre commande:\n\n`;
  
  message += `📦 *Produit:* ${productName}\n`;
  message += `💰 *Montant:* ${totalAmount.toLocaleString()} FCFA\n`;
  message += `📅 *Date de commande:* ${formatDateForMessage(orderDate)}\n`;
  
  if (orderId) {
    message += `🔢 *N° de commande:* ${orderId}\n`;
  }
  
  message += `\n`;
  
  if (urgencyLevel === 'high') {
    message += `⚠️ *Attention:* Cette commande est en attente depuis plusieurs jours.\n\n`;
  }
  
  message += `❓ *Statut de votre commande:*\n`;
  message += `• Avez-vous pu finaliser le paiement ?\n`;
  message += `• Souhaitez-vous modifier quelque chose ?\n`;
  message += `• Avez-vous des questions ?\n\n`;
  
  message += `💡 *Options de paiement disponibles:*\n`;
  message += `📱 Orange Money / Wave / Free Money\n`;
  message += `💵 Paiement à la livraison\n`;
  message += `🏦 Virement bancaire\n\n`;
  
  message += `Je reste à votre disposition pour toute question ! 🤝\n\n`;
  message += `Cordialement,\n*${shopName}* 🏪`;
  
  return message;
}

// ✅ Message de présentation boutique avec signature mise à jour
export function generateShopIntroMessage(data: WhatsAppShopIntroMessage): string {
  const { shopName, activity, city, description, catalogUrl, whatsappNumber, specialOffer } = data;
  
  let message = `🎉 *Bienvenue chez ${shopName}* ! 🎉\n\n`;
  
  message += `🏪 *Notre activité:* ${activity}\n`;
  message += `📍 *Localisation:* ${city}, Sénégal\n\n`;
  
  if (description) {
    message += `✨ *À propos de nous:*\n${description}\n\n`;
  }
  
  // Offre spéciale si disponible
  if (specialOffer) {
    message += `🎁 *OFFRE SPÉCIALE:* ${specialOffer}\n\n`;
  }
  
  message += `📱 *Découvrez notre univers:*\n`;
  message += `• Produits de qualité sélectionnés avec soin\n`;
  message += `• Prix compétitifs et transparents\n`;
  message += `• Service client personnalisé\n`;
  message += `• Commandes faciles via WhatsApp\n\n`;
  
  if (catalogUrl) {
    message += `🛍️ *Notre catalogue complet:*\n${catalogUrl}\n\n`;
  }
  
  message += `🚀 *Nos services:*\n`;
  message += `🚚 Livraison rapide à Dakar (24-48h)\n`;
  message += `📦 Livraison national (2-5 jours)\n`;
  message += `💳 Paiement Mobile Money & Espèces\n`;
  message += `🔄 Échange/Remboursement sous 7j\n`;
  message += `📞 Support 7j/7 de 8h à 20h\n\n`;
  
  if (whatsappNumber) {
    message += `📱 *Contact direct:* ${whatsappNumber}\n\n`;
  }
  
  message += `💬 *Comment commander ?*\n`;
  message += `1️⃣ Parcourez notre catalogue\n`;
  message += `2️⃣ Contactez-nous avec le produit souhaité\n`;
  message += `3️⃣ Confirmez votre commande\n`;
  message += `4️⃣ Recevez votre colis ! 📦\n\n`;
  
  message += `N'hésitez pas à me poser vos questions ! 😊\n\n`;
  
  message += `Au plaisir de vous servir ! 🤝\n`;
  message += `*L'équipe ${shopName}* 👥`;
  
  return message;
}

// ✅ Confirmation de commande avec signature mise à jour
export function generateOrderConfirmationMessage(data: WhatsAppOrderConfirmationMessage): string {
  const { clientName, productName, quantity, totalAmount, shopName, deliveryAddress, estimatedDelivery } = data;
  
  let message = `✅ *Commande confirmée !* ✅\n\n`;
  message += `Bonjour ${clientName}, 👋\n\n`;
  message += `Merci pour votre confiance ! Votre commande a été reçue et confirmée.\n\n`;
  
  message += `📦 *Détails de votre commande:*\n`;
  message += `• Produit: *${productName}*\n`;
  message += `• Quantité: ${quantity}\n`;
  message += `• Montant total: *${totalAmount.toLocaleString()} FCFA*\n\n`;
  
  if (deliveryAddress) {
    message += `📍 *Adresse de livraison:*\n${deliveryAddress}\n\n`;
  }
  
  if (estimatedDelivery) {
    message += `🚚 *Livraison estimée:* ${estimatedDelivery}\n\n`;
  }
  
  message += `📱 *Prochaines étapes:*\n`;
  message += `1️⃣ Préparation de votre commande\n`;
  message += `2️⃣ Notification de l'expédition\n`;
  message += `3️⃣ Livraison à votre adresse\n\n`;
  
  message += `🔔 Vous recevrez des mises à jour en temps réel !\n\n`;
  message += `Merci de faire confiance à *${shopName}* ! 🙏`;
  
  return message;
}

// ✅ Messages de livraison avec signature mise à jour
export function generateDeliveryUpdateMessage(data: WhatsAppDeliveryUpdateMessage): string {
  const { clientName, productName, status, trackingNumber, shopName, estimatedTime } = data;
  
  const statusEmojis = {
    preparing: '📦',
    shipped: '🚚',
    out_for_delivery: '🛵',
    delivered: '✅'
  };
  
  const statusMessages = {
    preparing: 'Votre commande est en cours de préparation',
    shipped: 'Votre commande a été expédiée',
    out_for_delivery: 'Votre commande est en cours de livraison',
    delivered: 'Votre commande a été livrée'
  };
  
  let message = `${statusEmojis[status]} *Mise à jour de livraison* ${statusEmojis[status]}\n\n`;
  message += `Bonjour ${clientName} ! 👋\n\n`;
  message += `${statusMessages[status]} :\n`;
  message += `📦 *${productName}*\n\n`;
  
  if (trackingNumber) {
    message += `🔢 *Numéro de suivi:* ${trackingNumber}\n\n`;
  }
  
  switch (status) {
    case 'preparing':
      message += `⏱️ Votre commande est actuellement préparée par notre équipe.\n`;
      if (estimatedTime) {
        message += `📅 Expédition prévue: ${estimatedTime}\n`;
      }
      break;
      
    case 'shipped':
      message += `🎉 Bonne nouvelle ! Votre commande est en route.\n`;
      if (estimatedTime) {
        message += `📅 Livraison estimée: ${estimatedTime}\n`;
      }
      break;
      
    case 'out_for_delivery':
      message += `🏃‍♂️ Notre livreur est en route vers votre adresse !\n`;
      if (estimatedTime) {
        message += `⏰ Arrivée estimée: ${estimatedTime}\n`;
      }
      message += `📱 Il vous contactera avant la livraison.\n`;
      break;
      
    case 'delivered':
      message += `🎉 Félicitations ! Votre commande a été livrée avec succès.\n\n`;
      message += `💭 Nous espérons que vous êtes satisfait(e) de votre achat !\n`;
      message += `⭐ N'hésitez pas à nous laisser un avis.\n`;
      break;
  }
  
  message += `\n📞 Pour toute question, contactez-nous directement.\n\n`;
  message += `Merci de votre confiance !\n*${shopName}* 🏪`;
  
  return message;
}

// ✅ Message personnalisé avec variables amélioré
export function generateCustomMessage(template: string, variables: Record<string, string | number>): string {
  let message = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    message = message.replace(placeholder, String(value));
  });
  
  // Ajouter la date actuelle si {{date}} est utilisé
  const currentDate = formatDateForMessage(new Date().toISOString());
  message = message.replace(/{{date}}/g, currentDate);
  
  // Ajouter l'heure actuelle si {{time}} est utilisé
  const currentTime = new Date().toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  message = message.replace(/{{time}}/g, currentTime);
  
  return message;
}

// ✅ Formate une date pour les messages avec options
export function formatDateForMessage(dateString: string, options?: {
  includeTime?: boolean;
  relative?: boolean;
}): string {
  const date = new Date(dateString);
  const now = new Date();
  
  if (options?.relative) {
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "aujourd'hui";
    if (diffDays === 1) return "hier";
    if (diffDays === -1) return "demain";
    if (diffDays > 1) return `il y a ${diffDays} jours`;
    if (diffDays < -1) return `dans ${Math.abs(diffDays)} jours`;
  }
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  };
  
  if (options?.includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
  }
  
  return date.toLocaleDateString('fr-FR', dateOptions);
}

// ✅ Valide un numéro de téléphone sénégalais
export function validateSenegalPhoneNumber(phoneNumber: string): boolean {
  const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
  
  // Formats valides pour le Sénégal:
  // 77/78/70/76/75 + 7 chiffres (format local)
  // 221 + 77/78/70/76/75 + 7 chiffres (format international)
  const senegalPattern = /^(221)?(7[5-8])\d{7}$/;
  
  return senegalPattern.test(cleanPhone);
}

// ✅ Génère un message de bienvenue pour nouveau client
export function generateWelcomeMessage(shopName: string, clientName?: string): string {
  let message = `🎉 *Bienvenue chez ${shopName}* ! 🎉\n\n`;
  
  if (clientName) {
    message += `Bonjour ${clientName} ! 👋\n\n`;
  }
  
  message += `Merci de vous intéresser à nos produits ! 😊\n\n`;
  message += `🎁 *Offre de bienvenue:*\n`;
  message += `• Livraison gratuite sur votre première commande à Dakar\n`;
  message += `• Conseil personnalisé\n`;
  message += `• Support prioritaire\n\n`;
  
  message += `💬 Comment puis-je vous aider aujourd'hui ?\n\n`;
  message += `Au plaisir de vous servir ! 🤝`;
  
  return message;
}
