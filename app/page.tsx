import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // CRITICAL: For demo access, users can go directly to /demo
  // This page handles authenticated users only
  let user = null;
  
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    // Se non c'è utente o errore di autenticazione, vai a login
    if (!authUser || authError) {
      redirect('/login');
    }
    
    user = authUser;
  } catch (error: unknown) {
    // CRITICAL: Catch NEXT_REDIRECT and other errors
    // NEXT_REDIRECT is thrown by createClient() when no session exists
    // This is expected for demo users, so we redirect to login
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNextRedirect = errorMessage.includes('NEXT_REDIRECT') || 
                          (error as any)?.digest?.includes('NEXT_REDIRECT');
    
    if (isNextRedirect) {
      // NEXT_REDIRECT means no valid session - redirect to login (this is expected)
      redirect('/login');
    } else {
      // Other errors - log and redirect to login
      console.error('[Home] Unexpected error:', error);
      redirect('/login');
    }
  }
  
  // If we reach here, user is authenticated
  if (!user) {
    redirect('/login');
  }

  try {
    // Utente loggato: controlla onboarding status
    const supabase = await createClient();
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
      // Redirect to /dashboard - it will handle redirect to /dashboard/panoramica for authenticated users
      redirect('/dashboard');
    } else if (profile.onboarding_status) {
      const route = profile.onboarding_status.replace('_', '/');
      redirect(`/onboarding/${route}`);
    } else {
      redirect('/onboarding/profile');
    }
  } catch (error: unknown) {
    // Handle errors in profile fetch
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNextRedirect = errorMessage.includes('NEXT_REDIRECT') || 
                          (error as any)?.digest?.includes('NEXT_REDIRECT');
    
    if (isNextRedirect) {
      // NEXT_REDIRECT during profile fetch - redirect to login
      redirect('/login');
    } else {
      console.error('[Home] Error fetching profile:', error);
      redirect('/login');
    }
  }
}
