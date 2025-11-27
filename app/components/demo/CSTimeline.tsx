'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CSTimelineProps {
  match: any;
  playerData: any | null;
}

export function CSTimeline({ match, playerData }: CSTimelineProps) {
  // Dati mock per il grafico CS Timeline
  // In futuro, questi dati verranno da position_metrics o da analisi più dettagliate
  const mockData = [
    { time: '0', cs: 0 },
    { time: '5', cs: 20 },
    { time: '10', cs: 50 },
    { time: '15', cs: 80 },
    { time: '20', cs: 120 },
    { time: '25', cs: 160 },
    { time: '30', cs: 200 },
    { time: '35', cs: 240 },
    { time: '40', cs: 280 },
  ];

  // Se abbiamo dati reali, usiamoli
  const chartData = playerData?.position_metrics?.cs_timeline || mockData;

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-2">CS Timeline</h2>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">CS</span>
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="cs" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              name="CS"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

