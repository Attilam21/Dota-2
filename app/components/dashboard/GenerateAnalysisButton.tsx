'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GenerateAnalysisButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/coaching/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) throw new Error('Errore generazione analisi');

      router.refresh();
    } catch (error) {
      console.error('Error generating analysis:', error);
      alert('Errore durante la generazione dell\'analisi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
    >
      {loading ? 'Generazione...' : 'Richiedi nuova analisi AI'}
    </button>
  );
}

