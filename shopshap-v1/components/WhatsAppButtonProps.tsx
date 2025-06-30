'use client';

import { generateWhatsAppLink } from '@/lib/whatsapp';

interface WhatsAppButtonProps {
  message: string;
  phoneNumber?: string;
  className?: string;
  children: React.ReactNode;
}

export default function WhatsAppButton({ 
  message, 
  phoneNumber = '', 
  className = '',
  children 
}: WhatsAppButtonProps) {
  function handleClick() {
    const whatsappUrl = generateWhatsAppLink(phoneNumber, message);
    window.open(whatsappUrl, '_blank');
  }

  return (
    <button
      onClick={handleClick}
      className={`bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors ${className}`}
    >
      {children}
    </button>
  );
}