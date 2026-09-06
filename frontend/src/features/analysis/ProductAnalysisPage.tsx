import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, PackageSearch } from 'lucide-react';

const COLORS = ['#714B67', '#017E84', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export const ProductAnalysisPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('1m');
  const [type, setType] = useState('income');
  
  const { data: analysisData, isLoading } = useQuery({
    queryKey: ['product-analysis', timeRange, type],
    queryFn: async () => {
      const res = await api.get('/analysis/product', {
        params: { timeRange, type }
      });
      return res.data.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PackageSearch className="w-7 h-7 text-[#714B67]" />
            Product Analysis
          </h1>
          <p className="text-gray-500 text-sm mt-1">Analyze revenue and expenses by product distribution</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filters:</span>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['7d', '14d', '1m'].map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t === '7d' ? 'Last 7 Days' : t === '14d' ? 'Last 14 Days' : 'Last 1 Month'}
            </button>
          ))}
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg ml-auto">
          {['income', 'expense'].map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${type === t ? 'bg-[#714B67] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[500px] flex items-center justify-center">
        {isLoading ? (
          <p className="text-gray-500">Loading chart data...</p>
        ) : !analysisData || analysisData.length === 0 ? (
          <p className="text-gray-500">No data available for the selected filters.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analysisData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={180}
                innerRadius={80}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                labelLine={true}
              >
                {analysisData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
