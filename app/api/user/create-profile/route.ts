import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, nickname } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Il trigger handle_new_user() crea automaticamente user_profile quando si registra
    // Aspettiamo un po' per assicurarci che il trigger sia eseguito
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verifica se il profilo esiste già (dovrebbe essere creato dal trigger)
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profile')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      // Profilo esiste già (creato dal trigger), aggiorna solo nickname
      const { error: updateError } = await supabaseAdmin
        .from('user_profile')
        .update({
          nickname: nickname || null,
          onboarding_status: 'profile_pending',
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[create-profile] Update error:', updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Se il profilo non esiste ancora, aspetta ancora un po' e riprova UPDATE
    // (il trigger potrebbe essere in ritardo)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: retryProfile } = await supabaseAdmin
      .from('user_profile')
      .select('id')
      .eq('id', userId)
      .single();

    if (retryProfile) {
      const { error: updateError } = await supabaseAdmin
        .from('user_profile')
        .update({
          nickname: nickname || null,
          onboarding_status: 'profile_pending',
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[create-profile] Retry update error:', updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Se dopo 1.5 secondi il profilo non esiste ancora, c'è un problema
    // Non facciamo INSERT perché causerebbe foreign key constraint error
    // se l'utente non esiste ancora in auth.users
    console.error('[create-profile] Profile not found after waiting for trigger');
    return NextResponse.json(
      { error: 'Profile not created by trigger. Please try again or contact support.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[create-profile] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

