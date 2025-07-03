import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppVerificationCode, getDebugInfo } from '@/lib/whatsapp-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    // Validation
    if (!phoneNumber) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Numéro de téléphone requis' 
        },
        { status: 400 }
      );
    }

    // Send verification code
    const result = await sendWhatsAppVerificationCode(phoneNumber);

    // Log for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] WhatsApp send result:', result);
    }

    const statusCode = result.success ? 200 : 400;
    return NextResponse.json(result, { status: statusCode });

  } catch (error: unknown) {
    console.error('[API] WhatsApp send error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for debug info (development only)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    );
  }

  try {
    const debugInfo = getDebugInfo();
    return NextResponse.json({
      debug: debugInfo,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error: unknown) {
    console.error('[API] Debug info error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}