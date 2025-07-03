# ShopShap WhatsApp Authentication System

## 🚀 Overview

Complete WhatsApp authentication system for ShopShap e-commerce platform, enabling users to authenticate via WhatsApp messages using Twilio integration.

## ✨ Features

### 🌍 Multi-Country Support
- **Morocco** 🇲🇦 (+212)
- **Côte d'Ivoire** 🇨🇮 (+225) 
- **Sénégal** 🇸🇳 (+221)
- **Burkina Faso** 🇧🇫 (+226)
- **Mali** 🇲🇱 (+223)

### 🛡️ Security & Reliability
- **Rate Limiting**: Protection against abuse (3 requests per 15 minutes)
- **Code Expiration**: 10-minute expiry for security
- **Attempt Limiting**: Maximum 3 verification attempts
- **Input Validation**: Comprehensive phone number validation
- **Error Handling**: Graceful error handling with user-friendly messages

### 🎨 User Experience
- **Smart Detection**: Automatic country detection with flags
- **Method Toggle**: Choose between WhatsApp and SMS
- **Visual Feedback**: Real-time validation indicators
- **Toast Notifications**: Contextual success/error messages
- **Seamless Integration**: Works alongside existing Supabase auth

## 🏗️ Architecture

### API Routes
```
/api/whatsapp/send    - Send verification codes
/api/whatsapp/verify  - Verify received codes
```

### Core Components
- `lib/whatsapp-auth.ts` - Server-side authentication service
- `hooks/useWhatsAppAuth.ts` - React hook for UI integration
- `app/login/page.tsx` - Enhanced login with WhatsApp support
- `app/verify/page.tsx` - Code verification with method detection

## 🔧 Configuration

### Environment Variables

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Twilio Setup

1. **Create Twilio Account**: Sign up at [twilio.com](https://twilio.com)
2. **WhatsApp Sandbox**: 
   - Go to Console → Messaging → Try it out → Send a WhatsApp message
   - Follow sandbox setup instructions
3. **Production**: Apply for WhatsApp Business API approval

## 📱 Usage Flow

### 1. Login Page
```typescript
// User enters phone number
+212714460468  // Morocco number detected
+221701234567  // Senegal number detected
```

### 2. Method Selection
```typescript
// Automatic detection or manual toggle
authMethod: 'whatsapp' | 'supabase'
```

### 3. Code Verification
```typescript
// 6-digit code sent via WhatsApp
123456  // User enters received code
```

## 🧪 API Examples

### Send Code
```bash
curl -X POST /api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+212714460468"}'
```

Response:
```json
{
  "success": true,
  "message": "Code envoyé sur WhatsApp 🇲🇦 Maroc",
  "sid": "SM...",
  "country": "Maroc",
  "formatted_number": "+212714460468"
}
```

### Verify Code
```bash
curl -X POST /api/whatsapp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+212714460468",
    "code": "123456"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Code vérifié avec succès",
  "user_data": {
    "phone": "+212714460468",
    "country": "MA",
    "verified_at": "2024-01-01T12:00:00.000Z"
  },
  "whatsapp_verified": true
}
```

## 🎯 Error Handling

### Rate Limiting
```json
{
  "success": false,
  "message": "Trop de tentatives. Réessayez dans 12 minute(s)."
}
```

### Invalid Number
```json
{
  "success": false,
  "message": "Numéro non supporté. Pays supportés: Maroc, Côte d'Ivoire, Sénégal, Burkina Faso, Mali"
}
```

### Code Verification Errors
```json
{
  "success": false,
  "message": "Code incorrect. 2 tentative(s) restante(s)."
}
```

## 🔍 Development & Testing

### Debug Mode
In development, access debug information:
```bash
curl http://localhost:3000/api/whatsapp/send
```

### Testing Numbers
For Twilio sandbox testing, use the provided sandbox numbers and follow the opt-in process.

## 🚀 Production Deployment

### Checklist
- [ ] Configure production Twilio credentials
- [ ] Apply for WhatsApp Business API
- [ ] Set up proper environment variables
- [ ] Configure rate limiting for production scale
- [ ] Set up monitoring and logging
- [ ] Test with real phone numbers

### Security Considerations
- Store Twilio credentials securely
- Implement proper logging (without sensitive data)
- Monitor for abuse patterns
- Consider implementing CAPTCHA for additional security

## 📊 Monitoring

### Key Metrics
- Code send success rate
- Verification success rate
- Rate limit hits
- Country distribution
- Error patterns

### Logs
```typescript
[WhatsApp Auth] Sending code to whatsapp:+212714460468
[WhatsApp Auth] Message sent successfully. SID: SM...
[WhatsApp Auth] Code verification successful for +212714460468
```

## 🤝 Integration with Existing Auth

The WhatsApp authentication seamlessly integrates with the existing Supabase authentication system:

1. **WhatsApp verification** validates the phone number
2. **Supabase session** is created for user management
3. **Fallback support** for non-supported countries via SMS
4. **Unified user experience** across all authentication methods

## 📝 Future Enhancements

- [ ] Database persistence for codes (replace in-memory storage)
- [ ] Redis integration for distributed rate limiting
- [ ] Additional country support
- [ ] WhatsApp Business API features
- [ ] Analytics dashboard
- [ ] A/B testing for conversion rates

---

Built with ❤️ for ShopShap - Connecting African entrepreneurs through technology