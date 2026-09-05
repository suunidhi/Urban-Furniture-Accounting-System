import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users,
  ShoppingBag, FileText, CreditCard, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import clsx from 'clsx';

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt = (n) => {
  const num = parseFloat(n || 0);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
};

const SOURCE_LABELS = {
  vendor_bill: 'Vendor Bill',
  customer_invoice: 'Customer Invoice',
  payment: 'Payment',
  manual: 'Manual'
};

// ─── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, trend, color, bgColor }) {
  return (
    <div className={clsx('rounded-xl p-5 shadow-sm border border-white/10 flex flex-col gap-3', bgColor)}>
      <div className="flex items-start justify-between">
        <div className={clsx('p-2.5 rounded-lg bg-white/20')}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-white/80 text-xs font-medium">
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Stat Card (simpler, white bg) ────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={clsx('p-3 rounded-lg', iconColor)}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

const COLORS = ['#714B67', '#017E84', '#f59e0b', '#3b82f6', '#10b981'];

// ─── Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();

  const { data: kpis } = useQuery({
    queryKey: ['analytics-kpis'],
    queryFn: async () => (await api.get('/analytics/kpis')).data,
    refetchInterval: 60_000
  });

  const { data: revExpData } = useQuery({
    queryKey: ['analytics-rev-exp'],
    queryFn: async () => (await api.get('/analytics/revenue-vs-expenses')).data
  });

  const { data: monthlySales } = useQuery({
    queryKey: ['analytics-monthly-sales'],
    queryFn: async () => (await api.get('/analytics/monthly-sales')).data
  });

  const { data: topCustomers } = useQuery({
    queryKey: ['analytics-top-customers'],
    queryFn: async () => (await api.get('/analytics/top-customers')).data
  });

  const { data: topVendors } = useQuery({
    queryKey: ['analytics-top-vendors'],
    queryFn: async () => (await api.get('/analytics/top-vendors')).data
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['analytics-recent'],
    queryFn: async () => (await api.get('/analytics/recent-activity')).data
  });

  const netProfit = kpis ? kpis.revenue_ytd - kpis.expenses_ytd : 0;
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's what's happening with Urban Furniture today.</p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Revenue YTD"
          value={fmt(kpis?.revenue_ytd)}
          sub="From posted invoices"
          icon={TrendingUp}
          bgColor="bg-gradient-to-br from-primary to-[#5a3b52]"
        />
        <KpiCard
          label="Expenses YTD"
          value={fmt(kpis?.expenses_ytd)}
          sub="From posted bills"
          icon={TrendingDown}
          bgColor="bg-gradient-to-br from-rose-500 to-rose-700"
        />
        <KpiCard
          label={isProfit ? 'Net Profit YTD' : 'Net Loss YTD'}
          value={fmt(Math.abs(netProfit))}
          sub={isProfit ? 'Profitable period' : 'Loss period'}
          icon={DollarSign}
          bgColor={isProfit ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-red-500 to-red-700'}
        />
        <KpiCard
          label="Sales This Month"
          value={fmt(kpis?.sales_this_month)}
          sub="Confirmed sales orders"
          icon={Activity}
          bgColor="bg-gradient-to-br from-secondary to-[#015f65]"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Accounts Receivable" value={fmt(kpis?.accounts_receivable)} icon={Users} iconColor="bg-blue-500" />
        <StatCard label="Accounts Payable" value={fmt(kpis?.accounts_payable)} icon={CreditCard} iconColor="bg-orange-500" />
        <StatCard label="Open Invoices" value={kpis?.open_invoices ?? '—'} icon={FileText} iconColor="bg-amber-500" />
        <StatCard label="Open Bills" value={kpis?.open_bills ?? '—'} icon={ShoppingBag} iconColor="bg-red-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue vs Expenses — full width chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-1">Revenue vs Expenses</h2>
          <p className="text-xs text-slate-400 mb-4">Last 12 months</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revExpData || []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#714B67" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#714B67" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#714B67" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#expGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers Pie */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-1">Top Customers</h2>
          <p className="text-xs text-slate-400 mb-3">By invoice total</p>
          {topCustomers?.length ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={topCustomers} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                    {topCustomers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {topCustomers.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 truncate max-w-[120px]">{c.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{fmt(c.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Sales Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-1">Monthly Sales</h2>
          <p className="text-xs text-slate-400 mb-4">Current year — confirmed sales orders</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlySales || []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Sales" fill="#017E84" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-1">Recent Activity</h2>
          <p className="text-xs text-slate-400 mb-3">Latest journal entries</p>
          <div className="space-y-2.5">
            {recentActivity?.length ? recentActivity.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {entry.reference || SOURCE_LABELS[entry.source_type] || 'Entry'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(entry.date), 'MMM d')} · {entry.journal}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-slate-800">{fmt(entry.total)}</p>
                  <span className={clsx(
                    'text-xs px-1.5 py-0.5 rounded font-medium',
                    entry.state === 'posted' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  )}>{entry.state}</span>
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-slate-400 text-sm">No activity yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Vendors */}
      {topVendors?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Top Vendors by Spend</h2>
          <div className="space-y-3">
            {topVendors.map((v, i) => {
              const maxTotal = topVendors[0]?.total || 1;
              const pctWidth = (v.total / maxTotal) * 100;
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 w-4 font-medium">{i + 1}</span>
                  <span className="text-sm text-slate-700 w-40 truncate">{v.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pctWidth}%`, transition: 'width 0.5s ease' }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 w-24 text-right">{fmt(v.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
