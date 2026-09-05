import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Payment, Contact, Journal, PaymentType, PaymentMethod } from '../../types';
import { 
  CreditCard, 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  FileText, 
  X,
  Plus,
  TrendingUp,
  BarChart2,
  PieChart as PieChartIcon,
  Landmark,
  Wallet,
  Layers
} from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useDebounce } from '../../hooks/useDebounce';

interface PaymentsPageProps {
  defaultType?: 'ALL' | 'CUSTOMER' | 'VENDOR';
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ defaultType = 'ALL' }) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [typeFilter, setTypeFilter] = useState<string>(defaultType);
  const [detailPaymentId, setDetailPaymentId] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [showCharts, setShowCharts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter]);

  // Sync if route prop changes
  useEffect(() => {
    if (defaultType) {
      setTypeFilter(defaultType);
    }
  }, [defaultType]);

  // Fetch payments
  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['payments', debouncedSearch, typeFilter],
    queryFn: async () => {
      const res = await api.get('/payments', {
        params: {
          search: debouncedSearch || undefined,
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
        },
      });
      return res.data.data;
    },
  });

  // Single payment detail
  const { data: paymentDetail } = useQuery<Payment>({
    queryKey: ['payment', detailPaymentId],
    queryFn: async () => {
      if (!detailPaymentId) return null;
      const res = await api.get(`/payments/${detailPaymentId}`);
      return res.data.data;
    },
    enabled: !!detailPaymentId,
  });

  // Analytics datasets for Vendor / Purchase Payments
  const analytics = useMemo(() => {
    if (!payments) return null;
    const vendorPayments = typeFilter === 'CUSTOMER' ? payments : payments.filter(p => p.type === 'VENDOR');
    const targetPayments = typeFilter === 'ALL' ? payments : vendorPayments;

    const totalAmount = targetPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const count = targetPayments.length;
    const avgAmount = count > 0 ? totalAmount / count : 0;

    // By date timeline
    const dateMap: Record<string, { date: string; amount: number; count: number }> = {};
    const sorted = [...targetPayments].sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
    sorted.forEach((p) => {
      const d = new Date(p.paymentDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (!dateMap[d]) {
        dateMap[d] = { date: d, amount: 0, count: 0 };
      }
      dateMap[d].amount += Number(p.amount);
      dateMap[d].count += 1;
    });
    const timelineData = Object.values(dateMap);

    // By payment method
    let bankAmount = 0;
    let cashAmount = 0;
    targetPayments.forEach((p) => {
      if (p.paymentMethod === 'BANK') bankAmount += Number(p.amount);
      else cashAmount += Number(p.amount);
    });
    const methodData = [
      { name: 'Bank Transfer', value: bankAmount, color: '#714B67' },
      { name: 'Cash Payment', value: cashAmount, color: '#017E84' },
    ].filter(m => m.value > 0);

    // By Vendor
    const vendorMap: Record<string, number> = {};
    targetPayments.forEach((p) => {
      const vName = p.partner?.name || 'Other Partner';
      vendorMap[vName] = (vendorMap[vName] || 0) + Number(p.amount);
    });
    const vendorData = Object.entries(vendorMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalAmount,
      count,
      avgAmount,
      bankAmount,
      cashAmount,
      timelineData,
      methodData,
      vendorData,
    };
  }, [payments, typeFilter]);

  const isPurchasePayment = typeFilter === 'VENDOR' || defaultType === 'VENDOR';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-[#714B67]" />
            {isPurchasePayment ? 'Purchase Payments & Supplier Disbursements' : 'Payments & Bank Receipts'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isPurchasePayment
              ? 'Interactive cash outflow ledger and supplier payment reconciliation'
              : 'Complete audit trail of all customer collections and supplier disbursements'}
          </p>
        </div>

        {isPurchasePayment && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                showCharts
                  ? 'bg-[#F3EAF0] text-[#714B67] border-[#714B67]/30'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              {showCharts ? 'Hide Visual Analytics' : 'Show Visual Analytics'}
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by payment #, partner, or UTR/ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'CUSTOMER', 'VENDOR'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-[#714B67] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'ALL' ? 'All Transactions' : t === 'CUSTOMER' ? 'Customer Receipts' : 'Vendor Payments'}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Visual Analytics for Purchase Payments */}
      {(isPurchasePayment || typeFilter === 'VENDOR') && showCharts && analytics && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium">Total Outflows</span>
                <p className="text-xl font-bold font-mono text-gray-900 mt-1">
                  ₹{analytics.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> Settled disbursements
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium">Disbursements Count</span>
                <p className="text-xl font-bold font-mono text-gray-900 mt-1">
                  {analytics.count}
                </p>
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  Processed vouchers
                </span>
              </div>
              <div className="p-3 bg-[#714B67]/10 rounded-xl text-[#714B67]">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium">Average Outflow</span>
                <p className="text-xl font-bold font-mono text-gray-900 mt-1">
                  ₹{analytics.avgAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  Per vendor transaction
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium">Bank vs Cash Split</span>
                <div className="flex items-center gap-2 mt-1 font-mono text-xs">
                  <span className="text-[#714B67] font-bold">
                    Bank: {analytics.totalAmount > 0 ? Math.round((analytics.bankAmount / analytics.totalAmount) * 100) : 0}%
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-[#017E84] font-bold">
                    Cash: {analytics.totalAmount > 0 ? Math.round((analytics.cashAmount / analytics.totalAmount) * 100) : 0}%
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  Disbursement methods
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Landmark className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Interactive Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1: Outflows Trend over Time */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#714B67]" />
                    Disbursement Trend Over Time
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Timeline of payments issued to vendors</p>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      chartType === 'area' ? 'bg-white text-gray-900 font-semibold shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      chartType === 'bar' ? 'bg-white text-gray-900 font-semibold shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Bar
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                {analytics.timelineData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No timeline disbursements recorded yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                      <AreaChart data={analytics.timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#714B67" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#714B67" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                        />
                        <Tooltip
                          formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Disbursement']}
                          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#714B67"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorAmount)"
                        />
                      </AreaChart>
                    ) : (
                      <BarChart data={analytics.timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                        />
                        <Tooltip
                          formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Disbursement']}
                          labelStyle={{ fontWeight: 600, color: '#1F2937' }}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                        />
                        <Bar dataKey="amount" fill="#714B67" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Method Distribution Donut */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-[#017E84]" />
                  Payment Methods
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Bank vs Cash disbursement breakdown</p>
              </div>

              <div className="h-48 w-full my-auto">
                {analytics.methodData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No payment methods data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.methodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {analytics.methodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Total']}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend & values */}
              <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#714B67]"></span>
                    Bank Transfer
                  </span>
                  <span className="font-mono font-semibold text-gray-800">
                    ₹{analytics.bankAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#017E84]"></span>
                    Cash Payment
                  </span>
                  <span className="font-mono font-semibold text-gray-800">
                    ₹{analytics.cashAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Top Vendors Breakdown */}
          {analytics.vendorData.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-[#714B67]" />
                Top Beneficiary Vendors by Outflow
              </h3>
              <p className="text-xs text-gray-400 mb-4">Highest disbursement recipients in the accounting ledger</p>
              
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.vendorData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#374151' }}
                      width={90}
                    />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Paid']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                    />
                    <Bar dataKey="amount" fill="#017E84" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading payments ledger...</div>
        ) : !payments || payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No payment records found</p>
            <p className="text-gray-400 text-sm mt-1">
              Payments are recorded when reconciling Invoices or Vendor Bills
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Partner</th>
                  <th className="py-3 px-4">Journal / Method</th>
                  <th className="py-3 px-4">Reference / UTR</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(payments?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setDetailPaymentId(p.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#714B67]">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.type === 'CUSTOMER' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <ArrowDownLeft className="w-3 h-3" />
                          Receipt (Inflow)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <ArrowUpRight className="w-3 h-3" />
                          Payment (Outflow)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {p.partner?.name}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs">
                      {p.journal?.name} ({p.paymentMethod})
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono text-xs">
                      {p.reference || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                      {p.type === 'CUSTOMER' ? '+' : '-'}₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDetailPaymentId(p.id)}
                        className="text-xs font-medium text-[#714B67] hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {payments && payments.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={payments.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Payment Detail Modal */}
      {detailPaymentId && paymentDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#714B67]/10 text-[#714B67] rounded-xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{paymentDetail.paymentNumber}</h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {paymentDetail.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {paymentDetail.type === 'CUSTOMER' ? 'Customer Collection' : 'Supplier Payment'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailPaymentId(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block mb-1">Partner</span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {paymentDetail.partner?.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Payment Date</span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {new Date(paymentDetail.paymentDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Journal</span>
                  <span className="font-semibold text-gray-800">
                    {paymentDetail.journal?.name} ({paymentDetail.paymentMethod})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Reference / UTR</span>
                  <span className="font-semibold text-gray-800 font-mono">
                    {paymentDetail.reference || 'None'}
                  </span>
                </div>
              </div>

              {/* Accounting Traceability Alert */}
              {paymentDetail.journalEntry && (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-700" />
                    <span>
                      Posted to General Ledger Entry:{' '}
                      <strong className="font-mono">{paymentDetail.journalEntry.entryNumber}</strong> (Balanced Dr = Cr)
                    </span>
                  </div>
                  <span className="text-purple-700 font-medium">Verified Double-Entry</span>
                </div>
              )}

              {/* Allocations */}
              {paymentDetail.allocations && paymentDetail.allocations.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Reconciled Documents
                  </h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Document</th>
                          <th className="py-2.5 px-3 text-right">Allocated Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paymentDetail.allocations.map((alloc) => (
                          <tr key={alloc.id}>
                            <td className="py-2.5 px-3 font-medium text-gray-800">
                              {alloc.customerInvoiceId ? `Customer Invoice #${alloc.customerInvoiceId}` : `Vendor Bill #${alloc.vendorBillId}`}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                              ₹{Number(alloc.amountAllocated).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Amount Display */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">Total Transaction Amount:</span>
                <span className="text-2xl font-extrabold text-[#714B67]">
                  ₹{Number(paymentDetail.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setDetailPaymentId(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
