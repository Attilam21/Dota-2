import { ImportMatchesForm } from '@/app/components/onboarding/ImportMatchesForm';

export default function OnboardingImportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Importa le tue partite</h1>
          <p className="text-gray-400">Incolla fino a 10-20 match ID per iniziare l&apos;analisi</p>
        </div>
        <ImportMatchesForm />
      </div>
    </div>
  );
}

