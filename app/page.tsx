import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Se non c'è utente o errore di autenticazione, vai a login
    if (!user || authError) {
      redirect('/login');
    }

    // Utente loggato: controlla onboarding status
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('onboarding_status')
      .eq('id', user.id)
      .single();

    // Se errore nel fetch profile o profile non esiste, vai a login (potrebbe essere sessione invalida)
    if (profileError || !profile) {
      // Logout e redirect a login
      await supabase.auth.signOut();
      redirect('/login');
    }

    if (profile.onboarding_status === 'complete') {
      redirect('/dashboard/panoramica');
    } else if (profile.onboarding_status) {
      const route = profile.onboarding_status.replace('_', '/');
      redirect(`/onboarding/${route}`);
    } else {
      redirect('/onboarding/profile');
    }
  } catch (error) {
    // In caso di errore, redirect a login
    console.error('[Home] Error:', error);
    redirect('/login');
  }
}
