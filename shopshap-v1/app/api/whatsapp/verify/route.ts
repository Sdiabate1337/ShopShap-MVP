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

    // ✅ Marquer l'utilisateur comme vérifié dans votre table users
    try {
      const formattedPhone = verificationResult.user_data?.phone;

      if (!formattedPhone) {
        throw new Error('No phone number in verification result');
      }

      // Mettre à jour l'utilisateur existant comme vérifié
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          whatsapp_verified: true, // ✅ Utilise votre colonne existante
          verification_method: 'whatsapp',
          last_sign_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('phone', formattedPhone)
        .select()
        .single();

      if (updateError) {
        console.error('[API] Erreur mise à jour utilisateur:', updateError);
        
        // Si la mise à jour échoue, essayer de créer l'utilisateur (fallback)
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{
            phone: formattedPhone,
            country: verificationResult.user_data?.country,
            verification_method: 'whatsapp',
            whatsapp_verified: true,
            email_verified: false,
            last_sign_in_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (createError) {
          console.error('[API] Erreur création utilisateur fallback:', createError);
          return NextResponse.json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'utilisateur',
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: verificationResult.message,
          user_data: newUser,
          whatsapp_verified: true
        });
      }

      return NextResponse.json({
        success: true,
        message: verificationResult.message,
        user_data: updatedUser,
        whatsapp_verified: true
      });

    } catch (supabaseError: unknown) {
      console.error('[API] Supabase integration error:', supabaseError);

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