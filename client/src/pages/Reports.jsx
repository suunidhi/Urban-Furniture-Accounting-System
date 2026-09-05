import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileBarChart, TrendingUp, PieChart, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import clsx from 'clsx';

const inputCls = "px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

// ─── Utility ───────────────────────────────────────────────────────────────
const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n) => `${parseFloat(n || 0).toFixed(1)}%`;

// ─── Section Header Row ────────────────────────────────────────────────────
function SectionHeader({ label, total, color = 'text-slate-800' }) {
  return (
    <tr className="bg-slate-50">
      <td colSpan={3} className={clsx('px-5 py-2 text-sm font-bold uppercase tracking-wider', color)}>{label}</td>
      <td className={clsx('px-5 py-2 text-sm font-bold text-right', color)}>{fmt(total)}</td>
    </tr>
  );
}

function AccountRow({ account }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-gray-50">
      <td className="px-5 py-3 text-sm text-slate-500 font-mono">{account.code}</td>
      <td className="px-5 py-3 text-sm text-slate-700">{account.name}</td>
      <td className="px-5 py-3 text-sm text-right text-slate-500">{fmt(account.debit)} / {fmt(account.credit)}</td>
      <td className="px-5 py-3 text-sm text-right font-semibold text-slate-800">{fmt(account.net)}</td>
    </tr>
  );
}

function TotalRow({ label, amount, highlight = false }) {
  return (
    <tr className={clsx('border-t-2 border-gray-200', highlight && 'bg-primary/5')}>
      <td colSpan={3} className={clsx('px-5 py-3 text-sm font-bold', highlight ? 'text-primary' : 'text-slate-700')}>{label}</td>
      <td className={clsx('px-5 py-3 text-sm font-bold text-right', highlight ? 'text-primary' : 'text-slate-800', parseFloat(amount) < 0 && 'text-red-600')}>
        {fmt(amount)}
      </td>
    </tr>
  );
}

// ─── Balance Sheet Tab ─────────────────────────────────────────────────────
function BalanceSheetTab() {
  const [asOf, setAsOf] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['balance-sheet', asOf],
    queryFn: async () => (await api.get(`/reports/balance-sheet?date=${asOf}`)).data
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">As of Date</label>
          <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className={inputCls} />
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors">
          <RefreshCw size={14} /> Run Report
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Generating report...</div>
      ) : data && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800">Balance Sheet</h2>
              <p className="text-xs text-slate-400">As of {format(new Date(data.as_of), 'MMMM d, yyyy')}</p>
            </div>
          </div>
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Code</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Debit / Credit</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Balance</th>
              </tr>
            </thead>
            <tbody>
              <SectionHeader label="Assets" total={data.totals.assets} color="text-blue-700" />
              {data.assets.map(a => <AccountRow key={a.id} account={a} />)}
              <TotalRow label="Total Assets" amount={data.totals.assets} />

              <tr><td colSpan={4} className="py-2" /></tr>

              <SectionHeader label="Liabilities" total={data.totals.liabilities} color="text-red-700" />
              {data.liabilities.map(a => <AccountRow key={a.id} account={a} />)}
              <TotalRow label="Total Liabilities" amount={data.totals.liabilities} />

              <tr><td colSpan={4} className="py-2" /></tr>

              <SectionHeader label="Capital / Equity" total={data.totals.capital} color="text-green-700" />
              {data.capital.map(a => <AccountRow key={a.id} account={a} />)}
              <TotalRow label="Total Capital" amount={data.totals.capital} />

              <TotalRow label="Total Liabilities + Capital" amount={data.totals.liabilities_and_capital} highlight />
            </tbody>
          </table>
          <div className={clsx('px-5 py-3 text-xs text-center', Math.abs(data.totals.assets - data.totals.liabilities_and_capital) < 0.01 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
            {Math.abs(data.totals.assets - data.totals.liabilities_and_capital) < 0.01
              ? '✓ Balance sheet is balanced'
              : `⚠ Imbalance detected: ${fmt(data.totals.assets - data.totals.liabilities_and_capital)}`}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Profit & Loss Tab ─────────────────────────────────────────────────────
function ProfitLossTab() {
  const now = new Date();
  const [from, setFrom] = useState(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(now, 'yyyy-MM-dd'));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['profit-loss', from, to],
    queryFn: async () => (await api.get(`/reports/profit-loss?from=${from}&to=${to}`)).data
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls} />
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors">
          <RefreshCw size={14} /> Run Report
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Generating report...</div>
      ) : data && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-slate-800">Profit & Loss Statement</h2>
            <p className="text-xs text-slate-400">
              {format(new Date(data.period.from), 'MMM d, yyyy')} – {format(new Date(data.period.to), 'MMM d, yyyy')}
            </p>
          </div>
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Code</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Debit / Credit</th>
                <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Net</th>
              </tr>
            </thead>
            <tbody>
              <SectionHeader label="Income" total={data.totals.income} color="text-green-700" />
              {data.income.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-3 text-sm text-slate-400 italic">No income entries in this period</td></tr>
              )}
              {data.income.map(a => <AccountRow key={a.id} account={a} />)}
              <TotalRow label="Total Income" amount={data.totals.income} />

              <tr><td colSpan={4} className="py-2" /></tr>

              <SectionHeader label="Expenses" total={data.totals.expenses} color="text-red-700" />
              {data.expenses.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-3 text-sm text-slate-400 italic">No expense entries in this period</td></tr>
              )}
              {data.expenses.map(a => <AccountRow key={a.id} account={a} />)}
              <TotalRow label="Total Expenses" amount={data.totals.expenses} />

              <TotalRow
                label={data.totals.net_profit >= 0 ? 'Net Profit' : 'Net Loss'}
                amount={data.totals.net_profit}
                highlight
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Budget Report Tab ─────────────────────────────────────────────────────
function BudgetReportTab() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['budget-report', from, to],
    queryFn: async () => (await api.get(`/reports/budget?${params.toString()}`)).data
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Period From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} placeholder="All" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Period To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls} />
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors">
          <RefreshCw size={14} /> Run Report
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Generating report...</div>
      ) : data && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-slate-800">Budget Report</h2>
            <p className="text-xs text-slate-400">Planned vs Committed vs Achieved · Generated {format(new Date(data.generated_at), 'MMM d, yyyy HH:mm')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-100">
                <tr>
                  {['Budget', 'Period', 'Analytic Account', 'Planned', 'Committed', 'Achieved', 'Variance', 'Utilization', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.rows.length === 0 && (
                  <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-400">No budgets found</td></tr>
                )}
                {data.rows.map(row => (
                  <tr key={row.id} className={clsx('hover:bg-slate-50 transition-colors', row.over_budget && 'bg-red-50/40')}>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {format(new Date(row.period_start), 'MMM d')} – {format(new Date(row.period_end), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.analytic_account}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{fmt(row.planned)}</td>
                    <td className="px-4 py-3 text-sm text-amber-700 font-medium">{fmt(row.committed)}</td>
                    <td className="px-4 py-3 text-sm font-medium">{fmt(row.achieved)}</td>
                    <td className={clsx('px-4 py-3 text-sm font-semibold', row.variance < 0 ? 'text-red-600' : 'text-green-600')}>
                      {row.variance < 0 ? '-' : '+'}{fmt(Math.abs(row.variance))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div
                            className={clsx('h-1.5 rounded-full', row.utilization_pct >= 100 ? 'bg-red-500' : row.utilization_pct >= 75 ? 'bg-amber-500' : 'bg-green-500')}
                            style={{ width: `${Math.min(row.utilization_pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{pct(row.utilization_pct)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('px-2 py-0.5 text-xs rounded-full font-medium capitalize',
                        row.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      )}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {data.rows.length > 0 && (
                <tfoot className="bg-slate-100 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-bold text-slate-700">Totals</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800">{fmt(data.totals.planned)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-amber-700">{fmt(data.totals.committed)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800">{fmt(data.totals.achieved)}</td>
                    <td className={clsx('px-4 py-3 text-sm font-bold', data.totals.variance < 0 ? 'text-red-600' : 'text-green-600')}>
                      {data.totals.variance < 0 ? '-' : '+'}{fmt(Math.abs(data.totals.variance))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Reports Page ─────────────────────────────────────────────────────
const TABS = [
  { id: 'balance', label: 'Balance Sheet', icon: FileBarChart },
  { id: 'pnl', label: 'Profit & Loss', icon: TrendingUp },
  { id: 'budget', label: 'Budget Report', icon: PieChart },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('balance');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Financial statements and budget analysis</p>
      </div>

      <div className="flex border-b border-gray-200 gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'balance' && <BalanceSheetTab />}
      {activeTab === 'pnl' && <ProfitLossTab />}
      {activeTab === 'budget' && <BudgetReportTab />}
    </div>
  );
}
