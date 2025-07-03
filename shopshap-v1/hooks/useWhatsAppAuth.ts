import { useCallback, useState } from 'react';
import { useToasts } from '@/hooks/useToast';

// Client-side interfaces (without Twilio dependencies)
interface CountryConfig {
  code: string;
  flag: string;
  name: string;
  pattern: RegExp;
  prefix: string;
  example: string;
}

// Supported countries configuration (client-side safe)
export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  {
    code: 'MA',
    flag: '🇲🇦',
    name: 'Maroc',
    pattern: /^(212|0)?[67]\d{8}$/,
    prefix: '212',
    example: '+212612345678'
  },
  {
    code: 'CI',
    flag: '🇨🇮',
    name: 'Côte d\'Ivoire',
    pattern: /^(225|0)?[0-9]\d{7,8}$/,
    prefix: '225',
    example: '+22501234567'
  },
  {
    code: 'SN',
    flag: '🇸🇳',
    name: 'Sénégal',
    pattern: /^(221|0)?[7]\d{8}$/,
    prefix: '221',
    example: '+221701234567'
  },
  {
    code: 'BF',
    flag: '🇧🇫',
    name: 'Burkina Faso',
    pattern: /^(226|0)?[567]\d{7}$/,
    prefix: '226',
    example: '+22650123456'
  },
  {
    code: 'ML',
    flag: '🇲🇱',
    name: 'Mali',
    pattern: /^(223|0)?[679]\d{7}$/,
    prefix: '223',
    example: '+22360123456'
  }
];

/**
 * Client-side phone number validation (same logic as server-side)
 */
function validateAndFormatPhoneNumber(phoneNumber: string): {
  isValid: boolean;
  formatted?: string;
  country?: CountryConfig;
  error?: string;
} {
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Try to match against supported countries
  for (const country of SUPPORTED_COUNTRIES) {
    const testNumber = cleanNumber.replace(/^\+/, '');
    
    if (country.pattern.test(testNumber)) {
      let formatted = testNumber;
      
      // Add country code if missing
      if (!formatted.startsWith(country.prefix)) {
        // Remove leading 0 if present
        if (formatted.startsWith('0')) {
          formatted = formatted.substring(1);
        }
        formatted = country.prefix + formatted;
      }
      
      return {
        isValid: true,
        formatted: '+' + formatted,
        country
      };
    }
  }
  
  return {
    isValid: false,
    error: 'Numéro non supporté. Pays supportés: ' + SUPPORTED_COUNTRIES.map(c => c.name).join(', ')
  };
}

interface UseWhatsAppAuthReturn {
  // State
  isLoading: boolean;
  phoneNumber: string;
  formattedNumber: string;
  detectedCountry: CountryConfig | null;
  isValidNumber: boolean;
  
  // Actions
  setPhoneNumber: (number: string) => void;
  sendCode: () => Promise<{ success: boolean; message: string }>;
  verifyCode: (code: string) => Promise<{ success: boolean; message: string; userData?: Record<string, unknown> }>;
  
  // Helpers
  getSupportedCountries: () => CountryConfig[];
  formatNumberDisplay: (number: string) => string;
}

export function useWhatsAppAuth(): UseWhatsAppAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumberState] = useState('');
  const [formattedNumber, setFormattedNumber] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<CountryConfig | null>(null);
  const [isValidNumber, setIsValidNumber] = useState(false);
  
  const toast = useToasts();

  // Update phone number and validate
  const setPhoneNumber = useCallback((number: string) => {
    setPhoneNumberState(number);
    
    if (!number.trim()) {
      setFormattedNumber('');
      setDetectedCountry(null);
      setIsValidNumber(false);
      return;
    }

    const validation = validateAndFormatPhoneNumber(number);
    if (validation.isValid && validation.formatted && validation.country) {
      setFormattedNumber(validation.formatted);
      setDetectedCountry(validation.country);
      setIsValidNumber(true);
    } else {
      setFormattedNumber('');
      setDetectedCountry(null);
      setIsValidNumber(false);
    }
  }, []);

  // Send verification code via WhatsApp
  const sendCode = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!isValidNumber || !formattedNumber) {
      const errorMsg = 'Veuillez entrer un numéro valide';
      toast.auth.validationError(errorMsg);
      return { success: false, message: errorMsg };
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedNumber
        })
      });

      const result = await response.json();

      if (result.success) {
        const countryFlag = detectedCountry?.flag || '';
        const countryName = detectedCountry?.name || '';
        toast.success(
          'Code envoyé ! 📱', 
          `Code WhatsApp envoyé ${countryFlag} ${countryName}`
        );
        return { success: true, message: result.message };
      } else {
        toast.auth.loginError(result.message);
        return { success: false, message: result.message };
      }

    } catch (error: unknown) {
      console.error('[WhatsApp Hook] Send code error:', error);
      const errorMsg = 'Erreur de connexion. Vérifiez votre réseau.';
      toast.system.networkError();
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [isValidNumber, formattedNumber, detectedCountry, toast]);

  // Verify the received code
  const verifyCode = useCallback(async (code: string): Promise<{ success: boolean; message: string; userData?: Record<string, unknown> }> => {
    if (!code.trim()) {
      const errorMsg = 'Veuillez entrer le code de vérification';
      toast.auth.validationError(errorMsg);
      return { success: false, message: errorMsg };
    }

    if (code.length !== 6) {
      toast.auth.invalidCode();
      return { success: false, message: 'Le code doit contenir 6 chiffres' };
    }

    if (!formattedNumber) {
      const errorMsg = 'Numéro de téléphone manquant';
      toast.auth.verificationError(errorMsg);
      return { success: false, message: errorMsg };
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/whatsapp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedNumber,
          code: code.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.auth.codeVerified();
        
        // Show welcome message
        setTimeout(() => {
          const countryFlag = detectedCountry?.flag || '';
          toast.auth.welcomeMessage();
        }, 1000);

        return { 
          success: true, 
          message: result.message,
          userData: result.user_data
        };
      } else {
        toast.auth.verificationError(result.message);
        return { success: false, message: result.message };
      }

    } catch (error: unknown) {
      console.error('[WhatsApp Hook] Verify code error:', error);
      const errorMsg = 'Erreur de vérification. Veuillez réessayer.';
      toast.system.networkError();
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [formattedNumber, detectedCountry, toast]);

  // Get list of supported countries
  const getSupportedCountries = useCallback((): CountryConfig[] => {
    return SUPPORTED_COUNTRIES;
  }, []);

  // Format number for display
  const formatNumberDisplay = useCallback((number: string): string => {
    if (!number) return '';
    
    const validation = validateAndFormatPhoneNumber(number);
    if (validation.isValid && validation.formatted) {
      return validation.formatted;
    }
    
    return number;
  }, []);

  return {
    // State
    isLoading,
    phoneNumber,
    formattedNumber,
    detectedCountry,
    isValidNumber,
    
    // Actions
    setPhoneNumber,
    sendCode,
    verifyCode,
    
    // Helpers
    getSupportedCountries,
    formatNumberDisplay
  };
}