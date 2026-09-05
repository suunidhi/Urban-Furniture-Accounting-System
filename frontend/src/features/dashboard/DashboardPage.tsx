import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  Receipt, 
  CreditCard,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch live Dashboard KPIs
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard-kpis');
      return res.data.data;
    },
    refetchInterval: 10000,
  });

  const kpis = dashboardData?.kpis || {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashBankBalance: 0,
    totalReceivables: 0,
    totalPayables: 0,
  };

  const counts = dashboardData?.counts || {
    invoices: 0,
    bills: 0,
    payments: 0,
  };

  const aging = dashboardData?.receivablesAging || {
    bucket0_30: 0,
    bucket31_60: 0,
    bucket61_90: 0,
    bucket90Plus: 0,
    
  };

  // Chart data
  const revenueExpenseData = [
    { name: 'Revenue', amount: kpis.totalRevenue, fill: '#017E84' },
    { name: 'Expenses', amount: kpis.totalExpenses, fill: '#714B67' },
    { name: 'Net Profit', amount: Math.max(0, kpis.netProfit), fill: '#10B981' },
  ];

  const agingData = [
    { name: '0-30 Days', value: Number(aging.bucket0_30 || 0), color: '#10B981' },
    { name: '31-60 Days', value: Number(aging.bucket31_60 || 0), color: '#F59E0B' },
    { name: '61-90 Days', value: Number(aging.bucket61_90 || 0), color: '#F97316' },
    { name: '90+ Days', value: Number(aging.bucket90Plus || 0), color: '#EF4444' },
  ].filter(d => d.value > 0);

  // Fallback for empty pie chart
  const hasAgingData = agingData.length > 0;
  const pieDisplayData = hasAgingData ? agingData : [{ name: 'Current (0 Due)', value: 1, color: '#10B981' }];

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Executive Accounting Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Welcome back, <span className="font-semibold text-[#714B67]">{user?.name}</span> ({user?.role}). Real-time general ledger financial metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-[#714B67]" />
            <span>FY 2026 Live Accounting</span>
          </div>
          <button
            onClick={() => navigate('/sales/invoices')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#714B67] hover:bg-[#5a3b52] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sales Income</span>
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-gray-900">
              ₹{Number(kpis.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-teal-700 font-medium mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Posted to Account 4000</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchases & COGS</span>
            <span className="p-2 bg-purple-50 text-[#714B67] rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-gray-900">
              ₹{Number(kpis.totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Posted to Account 5000</span>
            </div>
          </div>
        </div>

        {/* Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Debtors (Receivables)</span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-gray-900">
              ₹{Number(kpis.totalReceivables).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <div className="text-[11px] text-gray-500 font-medium mt-1">
              <span>Account 1100 unpaid dues</span>
            </div>
          </div>
        </div>

        {/* Payables */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Creditors (Payables)</span>
            <span className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-gray-900">
              ₹{Number(kpis.totalPayables).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <div className="text-[11px] text-gray-500 font-medium mt-1">
              <span>Account 2000 unpaid bills</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart: Revenue vs Expense Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Financial Performance Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Operating Revenue vs Operating Cost from General Ledger</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${kpis.netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              Net: ₹{Number(kpis.netProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueExpenseData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Amount']}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {revenueExpenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart: Receivables Aging Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900">Receivables Aging Profile</h2>
          <p className="text-xs text-gray-400 mt-0.5">Overdue exposure distribution</p>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDisplayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieDisplayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [hasAgingData ? `₹${Number(val).toLocaleString('en-IN')}` : 'All Current', 'Balance']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Operational Highlights & Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/sales/invoices')}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-[#714B67] cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Invoices</span>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{counts.invoices} Total</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manage customer billing & GST</p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => navigate('/purchases/bills')}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-[#714B67] cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor Bills</span>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{counts.bills} Total</h3>
            <p className="text-xs text-gray-400 mt-0.5">Supplier bills and remittances</p>
          </div>
          <div className="p-3 bg-purple-50 text-[#714B67] rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => navigate('/accounting/reports')}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-[#714B67] cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financial Reports</span>
            <h3 className="text-xl font-bold text-gray-900 mt-1">P&L & Balance Sheet</h3>
            <p className="text-xs text-gray-400 mt-0.5">Live Trial Balance & Compliance</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
