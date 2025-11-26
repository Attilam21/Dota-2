import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHero } from '@/app/components/dashboard/DashboardHero';
import { KPICards } from '@/app/components/dashboard/KPICards';
import { AdvancedMetrics } from '@/app/components/dashboard/AdvancedMetrics';
import { TrendChart } from '@/app/components/dashboard/TrendChart';
import { GamePhaseAnalysis } from '@/app/components/dashboard/GamePhaseAnalysis';
import { RecentMatchesTable } from '@/app/components/dashboard/RecentMatchesTable';
import { CoachingSection } from '@/app/components/dashboard/CoachingSection';

export const dynamic = 'force-dynamic';

export default async function PanoramicaPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profile')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.onboarding_status !== 'complete') {
    redirect('/onboarding/profile');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section con KPI */}
        <DashboardHero profile={profile} userId={user.id} />

        {/* KPI Principali */}
        <KPICards userId={user.id} />

        {/* Metriche Avanzate */}
        <AdvancedMetrics userId={user.id} />

        {/* Trend Grafici */}
        <TrendChart userId={user.id} />

        {/* Analisi per Fase di Gioco */}
        <GamePhaseAnalysis userId={user.id} />

        {/* Partite Recenti */}
        <RecentMatchesTable userId={user.id} />

        {/* Coaching & Tasks */}
        <CoachingSection userId={user.id} />
      </div>
    </div>
  );
}

