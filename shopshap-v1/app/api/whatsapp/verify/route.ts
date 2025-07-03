import { NextRequest, NextResponse } from 'next/server';
import { verifyWhatsAppCode } from '@/lib/whatsapp-auth';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, code } = body;

    // Validation
    if (!phoneNumber || !code) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Numéro de téléphone et code requis' 
        },
        { status: 400 }
      );
    }

    // Verify the WhatsApp code
    const verificationResult = await verifyWhatsAppCode(phoneNumber, code);

    if (!verificationResult.success) {
      return NextResponse.json(verificationResult, { status: 400 });
    }

    // If code verification successful, create or sign in user with Supabase
    try {
      // For WhatsApp auth, we'll use the phone number to sign in with Supabase
      // This creates a seamless integration with the existing auth system
      const formattedPhone = verificationResult.user_data?.phone;
      
      if (!formattedPhone) {
        throw new Error('No phone number in verification result');
      }

      // Check if user exists in Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles') // Assuming you have a profiles table
        .select('*')
        .eq('phone', formattedPhone)
        .single();

      let userData = existingUser;

      // If user doesn't exist, we'll create a minimal user record
      // The actual Supabase auth session will be handled on the client side
      if (!existingUser && fetchError?.code === 'PGRST116') {
        // User doesn't exist, prepare data for client-side creation
        userData = {
          phone: formattedPhone,
          country: verificationResult.user_data?.country,
          created_via: 'whatsapp',
          verified_at: verificationResult.user_data?.verified_at
        };
      }

      // Log for debugging (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] WhatsApp verify result:', verificationResult);
        console.log('[API] User data:', userData);
      }

      return NextResponse.json({
        success: true,
        message: verificationResult.message,
        user_data: userData,
        whatsapp_verified: true
      });

    } catch (supabaseError: unknown) {
      console.error('[API] Supabase integration error:', supabaseError);
      
      // Even if Supabase integration fails, the WhatsApp verification was successful
      // Return success but note the integration issue
      return NextResponse.json({
        success: true,
        message: verificationResult.message,
        whatsapp_verified: true,
        integration_warning: 'Code vérifié, mais problème d\'intégration utilisateur'
      });
    }

  } catch (error: unknown) {
    console.error('[API] WhatsApp verify error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur interne du serveur' 
      },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}