import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  LineChart, Line,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Filter, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon, Activity } from 'lucide-react';

const COLORS = ['#714B67', '#017E84', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export const FreestyleAnalysisPage: React.FC = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [type, setType] = useState('all');
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('bar');
  const [groupBy, setGroupBy] = useState<'byDate' | 'byProduct' | 'byContact'>('byDate');
  
  const { data: analysisData, isLoading } = useQuery({
    queryKey: ['freestyle-analysis', startDate, endDate, type],
    queryFn: async () => {
      const res = await api.get('/analysis/freestyle', {
        params: { startDate, endDate, type }
      });
      return res.data.data;
    },
    enabled: !!startDate && !!endDate
  });

  const getChartData = () => {
    if (!analysisData) return [];
    return analysisData[groupBy] || [];
  };

  const chartData = getChartData();

  const renderChart = () => {
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey={groupBy === 'byDate' ? 'date' : 'name'}
              cx="50%"
              cy="50%"
              outerRadius={180}
              innerRadius={80}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
              labelLine={true}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={groupBy === 'byDate' ? 'date' : 'name'} />
            <YAxis tickFormatter={(value) => `₹${value}`} />
            <RechartsTooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
            <Legend />
            <Bar dataKey="value" name="Amount" fill="#714B67" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={groupBy === 'byDate' ? 'date' : 'name'} />
          <YAxis tickFormatter={(value) => `₹${value}`} />
          <RechartsTooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
          <Legend />
          <Line type="monotone" dataKey="value" name="Amount" stroke="#017E84" strokeWidth={3} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-[#714B67]" />
            Freestyle Analysis
          </h1>
          <p className="text-gray-500 text-sm mt-1">Advanced multi-dimensional data visualization</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col xl:flex-row items-center gap-4">
        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded text-xs"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded text-xs"
          />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['all', 'income', 'expense'].map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${type === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <span className="text-sm font-semibold text-gray-700">Group By:</span>
          <select 
            value={groupBy} 
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
          >
            <option value="byDate">Date</option>
            <option value="byProduct">Product</option>
            <option value="byContact">Customer/Vendor</option>
          </select>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg ml-auto">
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded-md transition-colors ${chartType === 'bar' ? 'bg-[#714B67] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            title="Bar Chart"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-1.5 rounded-md transition-colors ${chartType === 'line' ? 'bg-[#714B67] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            title="Line Chart"
          >
            <LineChartIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-1.5 rounded-md transition-colors ${chartType === 'pie' ? 'bg-[#714B67] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            title="Pie Chart"
          >
            <PieChartIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[500px] flex items-center justify-center">
        {isLoading ? (
          <p className="text-gray-500">Loading chart data...</p>
        ) : !chartData || chartData.length === 0 ? (
          <p className="text-gray-500">No data available for the selected filters.</p>
        ) : (
          renderChart()
        )}
      </div>
    </div>
  );
};
