/**
 * SIMPLE DASHBOARD TEST PAGE
 * This is a minimal version to test if routing works
 * If you can see this page, routing is working!
 */
export default function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-white mb-4">
          ✅ DASHBOARD FUNZIONA!
        </h1>
        <p className="text-green-400 text-2xl mb-4">
          Se vedi questa pagina, il routing funziona correttamente!
        </p>
        <p className="text-gray-400 text-lg">
          Route: <code className="bg-gray-800 px-3 py-1 rounded text-white">/dashboard/simple</code>
        </p>
        <div className="mt-8">
          <a 
            href="/dashboard" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Vai alla Dashboard Completa
          </a>
        </div>
      </div>
    </div>
  );
}

