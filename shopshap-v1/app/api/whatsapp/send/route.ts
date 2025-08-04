import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppVerificationCode, getDebugInfo } from '@/lib/whatsapp-auth';
import { supabase } from '@/lib/supabaseClient';

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

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // ✅ Créer ou mettre à jour l'utilisateur dans votre table users
    try {
      const formattedPhone = result.formatted_number;
      
      if (formattedPhone) {
        // Vérifier si l'utilisateur existe déjà par téléphone
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('phone', formattedPhone)
          .single();

        if (!existingUser && (!fetchError || fetchError.code === 'PGRST116')) {
          // Créer un nouvel utilisateur
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
              phone: formattedPhone,
              country: result.country,
              verification_method: 'whatsapp',
              whatsapp_verified: false, // Sera mis à true lors de la vérification
              email_verified: false,
              last_code_sent: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }])
            .select()
            .single();

          if (createError) {
            console.error('[API] Erreur création utilisateur:', createError);
            // Ne pas faire échouer l'envoi du code pour cette erreur
          } else {
            console.log('[API] Utilisateur créé avec succès:', newUser.id);
          }
        } else if (existingUser) {
          // Utilisateur existe déjà, mettre à jour le timestamp
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              last_code_sent: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              verification_method: 'whatsapp' // S'assurer que la méthode est WhatsApp
            })
            .eq('phone', formattedPhone);

          if (updateError) {
            console.error('[API] Erreur mise à jour utilisateur:', updateError);
          } else {
            console.log('[API] Utilisateur mis à jour:', existingUser.id);
          }
        }
      }
    } catch (supabaseError) {
      console.error('[API] Erreur intégration Supabase lors de l\'envoi:', supabaseError);
      // Ne pas faire échouer l'envoi du code
    }

    // Log for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] WhatsApp send result:', result);
    }

    return NextResponse.json(result, { status: 200 });

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