export default function DashboardTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">
          ✅ Dashboard Test Page - Funziona!
        </h1>
        <p className="text-green-400 text-lg mb-4">
          Se vedi questa pagina, la route /dashboard/test funziona correttamente.
        </p>
        <p className="text-gray-400">
          Ora prova ad accedere a <code className="bg-gray-800 px-2 py-1 rounded">/dashboard</code>
        </p>
      </div>
    </div>
  );
}

