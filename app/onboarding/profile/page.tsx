import { ProfileForm } from '@/app/components/onboarding/ProfileForm';

export default function OnboardingProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Completa il tuo profilo</h1>
          <p className="text-gray-400">Profiliamo il tuo stile di gioco prima di generare il coaching</p>
        </div>
        <ProfileForm />
      </div>
    </div>
  );
}

