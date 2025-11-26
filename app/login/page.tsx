import { LoginForm } from '@/app/components/auth/LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">FZTH</h1>
          <p className="text-gray-400">Accesso al tuo profilo Dota 2</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

