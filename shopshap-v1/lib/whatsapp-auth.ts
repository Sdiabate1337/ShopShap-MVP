import { Twilio } from 'twilio';

// Types for WhatsApp authentication
export interface WhatsAppAuthCode {
  code: string;
  phoneNumber: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

export interface CountryConfig {
  code: string;
  flag: string;
  name: string;
  pattern: RegExp;
  prefix: string;
  example: string;
}

export interface SendCodeResponse {
  success: boolean;
  message: string;
  sid?: string;
  country?: string;
  formatted_number?: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  user_data?: {
    phone: string;
    country?: string;
    verified_at: string;
  };
}

// Supported countries configuration
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

// In-memory storage for codes (in production, use Redis or database)
const authCodes = new Map<string, WhatsAppAuthCode>();

// Rate limiting storage
const rateLimits = new Map<string, { count: number; resetTime: Date }>();

// Constants
const CODE_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_REQUESTS_PER_WINDOW = 3;

// Initialize Twilio client
function getTwilioClient(): Twilio | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    console.error('Twilio credentials not configured');
    return null;
  }
  
  return new Twilio(accountSid, authToken);
}

/**
 * Validates and formats a phone number for the supported countries
 */
export function validateAndFormatPhoneNumber(phoneNumber: string): {
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

/**
 * Checks rate limiting for a phone number
 */
export function checkRateLimit(phoneNumber: string): { allowed: boolean; resetTime?: Date } {
  const now = new Date();
  const key = phoneNumber;
  const existing = rateLimits.get(key);
  
  if (!existing || now > existing.resetTime) {
    // Reset or create new rate limit
    rateLimits.set(key, {
      count: 1,
      resetTime: new Date(now.getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)
    });
    return { allowed: true };
  }
  
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, resetTime: existing.resetTime };
  }
  
  existing.count++;
  return { allowed: true };
}

/**
 * Generates a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates and stores a verification code
 */
export function createVerificationCode(phoneNumber: string): string {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
  
  authCodes.set(phoneNumber, {
    code,
    phoneNumber,
    expiresAt,
    attempts: 0,
    createdAt: new Date()
  });
  
  return code;
}

/**
 * Generates WhatsApp message content
 */
export function generateWhatsAppMessage(code: string, country?: CountryConfig): string {
  const countryFlag = country?.flag || '🌍';
  const countryName = country?.name || '';
  
  let message = `${countryFlag} *ShopShap* - Code de vérification\n\n`;
  message += `Votre code de vérification WhatsApp est :\n\n`;
  message += `*${code}*\n\n`;
  message += `⏰ Ce code expire dans ${CODE_EXPIRY_MINUTES} minutes.\n`;
  message += `🔒 Ne partagez jamais ce code avec qui que ce soit.\n\n`;
  
  if (countryName) {
    message += `📍 Connexion depuis: ${countryName}\n`;
  }
  
  message += `Merci de faire confiance à ShopShap ! 🛍️`;
  
  return message;
}

/**
 * Sends verification code via WhatsApp using Twilio
 */
export async function sendWhatsAppVerificationCode(phoneNumber: string): Promise<SendCodeResponse> {
  try {
    // Validate phone number
    const validation = validateAndFormatPhoneNumber(phoneNumber);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || 'Numéro de téléphone invalide'
      };
    }
    
    const formattedNumber = validation.formatted!;
    const country = validation.country;
    
    // Check rate limiting
    const rateLimitCheck = checkRateLimit(formattedNumber);
    if (!rateLimitCheck.allowed) {
      const resetTime = rateLimitCheck.resetTime!;
      const waitMinutes = Math.ceil((resetTime.getTime() - Date.now()) / (60 * 1000));
      return {
        success: false,
        message: `Trop de tentatives. Réessayez dans ${waitMinutes} minute(s).`
      };
    }
    
    // Generate verification code
    const code = createVerificationCode(formattedNumber);
    
    // Get Twilio client
    const twilio = getTwilioClient();
    if (!twilio) {
      return {
        success: false,
        message: 'Service indisponible. Veuillez réessayer plus tard.'
      };
    }
    
    // Generate message
    const messageBody = generateWhatsAppMessage(code, country);
    
    // Send via Twilio WhatsApp
    const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox number
    const to = `whatsapp:${formattedNumber}`;
    
    console.log(`[WhatsApp Auth] Sending code to ${to}`);
    console.log(`[WhatsApp Auth] Message: ${messageBody}`);
    
    const message = await twilio.messages.create({
      body: messageBody,
      from: from,
      to: to
    });
    
    console.log(`[WhatsApp Auth] Message sent successfully. SID: ${message.sid}`);
    
    return {
      success: true,
      message: `Code envoyé sur WhatsApp ${country?.flag || ''} ${country?.name || ''}`,
      sid: message.sid,
      country: country?.name,
      formatted_number: formattedNumber
    };
    
  } catch (error: unknown) {
    console.error('[WhatsApp Auth] Error sending message:', error);
    
    // Handle specific Twilio errors
    if (error && typeof error === 'object' && 'code' in error) {
      const twilioError = error as { code: number; message?: string };
      if (twilioError.code === 21211) {
        return {
          success: false,
          message: 'Numéro de téléphone invalide'
        };
      } else if (twilioError.code === 21614) {
        return {
          success: false,
          message: 'Ce numéro ne peut pas recevoir de messages WhatsApp'
        };
      } else if (twilioError.code === 21408) {
        return {
          success: false,
          message: 'Permission refusée pour ce numéro'
        };
      }
    }
    
    return {
      success: false,
      message: 'Erreur lors de l\'envoi. Veuillez réessayer.'
    };
  }
}

/**
 * Verifies the provided code against stored codes
 */
export async function verifyWhatsAppCode(phoneNumber: string, providedCode: string): Promise<VerifyCodeResponse> {
  try {
    // Validate phone number format first
    const validation = validateAndFormatPhoneNumber(phoneNumber);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Numéro de téléphone invalide'
      };
    }
    
    const formattedNumber = validation.formatted!;
    const storedAuth = authCodes.get(formattedNumber);
    
    if (!storedAuth) {
      return {
        success: false,
        message: 'Aucun code trouvé. Demandez un nouveau code.'
      };
    }
    
    // Check if code is expired
    if (new Date() > storedAuth.expiresAt) {
      authCodes.delete(formattedNumber);
      return {
        success: false,
        message: 'Code expiré. Demandez un nouveau code.'
      };
    }
    
    // Check attempts
    if (storedAuth.attempts >= MAX_ATTEMPTS) {
      authCodes.delete(formattedNumber);
      return {
        success: false,
        message: 'Trop de tentatives. Demandez un nouveau code.'
      };
    }
    
    // Verify code
    if (storedAuth.code !== providedCode.trim()) {
      storedAuth.attempts++;
      const remainingAttempts = MAX_ATTEMPTS - storedAuth.attempts;
      
      if (remainingAttempts <= 0) {
        authCodes.delete(formattedNumber);
        return {
          success: false,
          message: 'Code incorrect. Trop de tentatives.'
        };
      }
      
      return {
        success: false,
        message: `Code incorrect. ${remainingAttempts} tentative(s) restante(s).`
      };
    }
    
    // Success! Clean up
    authCodes.delete(formattedNumber);
    
    return {
      success: true,
      message: 'Code vérifié avec succès',
      user_data: {
        phone: formattedNumber,
        country: validation.country?.code,
        verified_at: new Date().toISOString()
      }
    };
    
  } catch (error: unknown) {
    console.error('[WhatsApp Auth] Error verifying code:', error);
    return {
      success: false,
      message: 'Erreur lors de la vérification. Veuillez réessayer.'
    };
  }
}

/**
 * Gets debug information (development only)
 */
export function getDebugInfo(): Record<string, unknown> | null {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return {
    activeCodes: Array.from(authCodes.entries()).map(([phone, auth]) => ({
      phone,
      code: auth.code,
      expiresAt: auth.expiresAt,
      attempts: auth.attempts
    })),
    rateLimits: Array.from(rateLimits.entries()).map(([phone, limit]) => ({
      phone,
      count: limit.count,
      resetTime: limit.resetTime
    }))
  };
}