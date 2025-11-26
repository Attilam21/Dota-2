import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Utente loggato: controlla onboarding status
      const { data: profile } = await supabase
        .from('user_profile')
        .select('onboarding_status')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_status === 'complete') {
        redirect('/dashboard/panoramica');
      } else if (profile?.onboarding_status) {
        const route = profile.onboarding_status.replace('_', '/');
        redirect(`/onboarding/${route}`);
      } else {
        redirect('/onboarding/profile');
      }
    } else {
      // Utente non loggato: redirect a login
      redirect('/login');
    }
  } catch {
    // In caso di errore, redirect a login
    redirect('/login');
  }
}
