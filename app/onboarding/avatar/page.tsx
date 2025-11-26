import { AvatarSelector } from '@/app/components/onboarding/AvatarSelector';

export default function OnboardingAvatarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Scegli il tuo avatar</h1>
          <p className="text-gray-400">Seleziona un avatar che ti rappresenta</p>
        </div>
        <AvatarSelector />
      </div>
    </div>
  );
}

