// Utilitaires pour générer les liens et messages WhatsApp

export type WhatsAppMessageType = 'product' | 'order_reminder' | 'shop_intro' | 'custom';

export interface ProductMessage {
  productName: string;
  price: number;
  description?: string;
  shopName: string;
  productUrl?: string;
}

export interface OrderReminderMessage {
  clientName: string;
  productName: string;
  totalAmount: number;
  orderDate: string;
  shopName: string;
}

export interface ShopIntroMessage {
  shopName: string;
  activity: string;
  city: string;
  description?: string;
  catalogUrl?: string;
}

// Génère un lien WhatsApp avec message pré-rempli
export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  // Nettoie le numéro de téléphone
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Encode le message pour l'URL
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

// Messages pour les produits
export function generateProductMessage(data: ProductMessage): string {
  const { productName, price, description, shopName, productUrl } = data;
  
  let message = `🛍️ *${productName}*\n\n`;
  message += `💰 Prix: *${price.toLocaleString()} FCFA*\n\n`;
  
  if (description) {
    message += `📝 ${description}\n\n`;
  }
  
  message += `🏪 Boutique: *${shopName}*\n\n`;
  message += `✨ Intéressé(e) par cet article ? Contactez-moi directement !\n\n`;
  
  if (productUrl) {
    message += `👉 Voir le produit: ${productUrl}\n\n`;
  }
  
  message += `#${shopName.replace(/\s+/g, '')} #Fashion #Shopping`;
  
  return message;
}

// Messages de relance commande
export function generateOrderReminderMessage(data: OrderReminderMessage): string {
  const { clientName, productName, totalAmount, orderDate, shopName } = data;
  
  let message = `Bonjour ${clientName} ! 👋\n\n`;
  message += `J'espère que vous allez bien.\n\n`;
  message += `📦 Votre commande: *${productName}*\n`;
  message += `💰 Montant: *${totalAmount.toLocaleString()} FCFA*\n`;
  message += `📅 Commandé le: ${orderDate}\n\n`;
  message += `Avez-vous eu le temps de finaliser le paiement ?\n\n`;
  message += `Je reste disponible pour toute question ! 😊\n\n`;
  message += `Merci,\n*${shopName}*`;
  
  return message;
}

// Message de présentation boutique
export function generateShopIntroMessage(data: ShopIntroMessage): string {
  const { shopName, activity, city, description, catalogUrl } = data;
  
  let message = `👋 Bienvenue chez *${shopName}* !\n\n`;
  message += `🏪 ${activity} à ${city}\n\n`;
  
  if (description) {
    message += `✨ ${description}\n\n`;
  }
  
  message += `📱 Découvrez tous nos produits en ligne et commandez directement via WhatsApp !\n\n`;
  
  if (catalogUrl) {
    message += `👉 Notre catalogue: ${catalogUrl}\n\n`;
  }
  
  message += `🚚 Livraison disponible\n`;
  message += `💳 Paiement sécurisé\n`;
  message += `🎯 Service client réactif\n\n`;
  message += `N'hésitez pas à me contacter ! 😊`;
  
  return message;
}

// Message personnalisé
export function generateCustomMessage(template: string, variables: Record<string, string>): string {
  let message = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    message = message.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return message;
}

// Formate une date pour les messages
export function formatDateForMessage(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}