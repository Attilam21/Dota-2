import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se le variabili d'ambiente non sono disponibili, passa la richiesta senza autenticazione
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Proteggi route dashboard
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect se già loggato
  if ((pathname === '/login' || pathname === '/register') && user) {
    // Controlla onboarding status
    const { data: profile } = await supabase
      .from('user_profile')
      .select('onboarding_status')
      .eq('id', user.id)
      .single();

    if (profile?.onboarding_status === 'complete') {
      return NextResponse.redirect(new URL('/dashboard/panoramica', request.url));
    } else if (profile?.onboarding_status) {
      return NextResponse.redirect(new URL(`/onboarding/${profile.onboarding_status.replace('_', '/')}`, request.url));
    } else {
      return NextResponse.redirect(new URL('/onboarding/profile', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

