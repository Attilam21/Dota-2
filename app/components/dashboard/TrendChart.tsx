'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendData {
  date: string;
  aggressiveness: number;
  farm_efficiency: number;
  macro: number;
  survivability: number;
}

export function TrendChart({ userId }: { userId: string }) {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrendData() {
      try {
        const response = await fetch(`/api/dashboard/trend?user_id=${userId}`);
        if (response.ok) {
          const result = await response.json();
          setData(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching trend data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrendData();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
        <div className="text-center text-gray-400">Caricamento dati...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Trend Ultime Partite</h2>
        <div className="text-center text-gray-400">Nessun dato disponibile</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Trend Ultime Partite</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="aggressiveness"
            stroke="#EF4444"
            strokeWidth={2}
            name="Aggressività"
            dot={{ fill: '#EF4444', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="farm_efficiency"
            stroke="#10B981"
            strokeWidth={2}
            name="Farm Efficiency"
            dot={{ fill: '#10B981', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="macro"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Macro"
            dot={{ fill: '#3B82F6', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="survivability"
            stroke="#A855F7"
            strokeWidth={2}
            name="Survivability"
            dot={{ fill: '#A855F7', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

