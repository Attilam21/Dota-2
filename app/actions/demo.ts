'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Server Action to load player's last match
 * This avoids POST → GET conversion issues with redirects
 */
export async function loadPlayerLastMatch(formData: FormData) {
  const accountId = formData.get('account_id');

  if (!accountId || typeof accountId !== 'string') {
    return { error: 'Account ID richiesto' };
  }

  const accountIdNum = parseInt(accountId, 10);
  if (isNaN(accountIdNum) || accountIdNum <= 0) {
    return { error: 'Inserisci un OpenDota Account ID valido (numero positivo)' };
  }

  try {
    // Get the app URL (use environment variable or construct from request)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    console.log('[demo action] Loading last match for account_id:', accountIdNum);
    console.log('[demo action] Using app URL:', appUrl);

    const apiUrl = `${appUrl}/api/demo/load-player-last-match`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account_id: accountIdNum }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[demo action] API error:', errorData);
      return { error: errorData.details || errorData.error || 'Errore nel caricamento della partita' };
    }

    const data = await response.json();

    if (data.status !== 'ok' && data.status !== 'success') {
      return { error: data.details || data.error || 'Errore nel caricamento della partita' };
    }

    // Store match data in cookies (server-side, persists across redirects)
    if (data.match_id) {
      const cookieStore = await cookies();
      cookieStore.set('demo_match_id', String(data.match_id), {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
      });

      if (data.account_id) {
        cookieStore.set('demo_account_id', String(data.account_id), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60, // 1 hour
        });
      }

      console.log('[demo action] Stored match data in cookies:', {
        match_id: data.match_id,
        account_id: data.account_id,
      });
    }

    // Server-side redirect preserves the request context
    // This avoids POST → GET conversion issues
    redirect('/dashboard');
  } catch (error) {
    console.error('[demo action] Unexpected error:', error);
    
    // If it's a redirect error, re-throw it (Next.js redirect throws)
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    
    return { error: error instanceof Error ? error.message : 'Errore connessione API' };
  }
}

