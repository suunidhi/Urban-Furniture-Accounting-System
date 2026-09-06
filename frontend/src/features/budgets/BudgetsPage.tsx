import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Budget, AnalyticAccount, Contact, BudgetStatus } from '../../types';
import { 
  Target, 
  Plus, 
  Search, 
  CheckCircle2, 
  RotateCcw, 
  LayoutList, 
  LayoutGrid, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  User, 
  X, 
  GitFork, 
  ArrowRight,
  BarChart as BarChartIcon
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../../components/ui/Pagination';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const BudgetsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'graph'>('list');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, viewMode]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reviseModalOpen, setReviseModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [detailBudgetId, setDetailBudgetId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Budget Form
  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    responsibleId: null as number | null,
    analyticAccountId: 0,
    committedAmount: 0,
    notes: '',
  });

  // Revision Form
  const [revisionData, setRevisionData] = useState({
    committedAmount: 0,
    startDate: '',
    endDate: '',
    notes: '',
  });

  // Fetch Budgets
  const { data: budgets, isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets', debouncedSearch, statusFilter],
    queryFn: async () => {
      const res = await api.get('/budgets', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      });
      return res.data.data;
    },
  });

  // Fetch Analytics
  const { data: analytics } = useQuery<AnalyticAccount[]>({
    queryKey: ['analytics-list'],
    queryFn: async () => {
      const res = await api.get('/analytics');
      return res.data.data;
    },
  });

  // Fetch Responsible Contacts
  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ['contacts-list'],
    queryFn: async () => {
      const res = await api.get('/contacts');
      return res.data.data;
    },
  });

  // Single Budget Detail
  const { data: budgetDetail } = useQuery<Budget>({
    queryKey: ['budget', detailBudgetId],
    queryFn: async () => {
      if (!detailBudgetId) return null;
      const res = await api.get(`/budgets/${detailBudgetId}`);
      return res.data.data;
    },
    enabled: !!detailBudgetId,
  });

  // Create Budget Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/budgets', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setCreateModalOpen(false);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create budget.');
    },
  });

  // Confirm Budget Mutation
  const confirmMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/budgets/${id}/confirm`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', detailBudgetId] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to confirm budget.');
    },
  });

  // Revise Budget Mutation
  const reviseMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: typeof revisionData }) => {
      const res = await api.post(`/budgets/${id}/revise`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', detailBudgetId] });
      setReviseModalOpen(false);
      alert('Budget revised successfully! New revision has been instantiated.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to revise budget.');
    },
  });

  const openCreateModal = () => {
    setFormData({
      name: '',
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
      responsibleId: null,
      analyticAccountId: analytics && analytics.length > 0 ? analytics[0].id : 0,
      committedAmount: 0,
      notes: '',
    });
    setError(null);
    setCreateModalOpen(true);
  };

  const openReviseModal = (b: Budget) => {
    setSelectedBudget(b);
    setRevisionData({
      committedAmount: Number(b.committedAmount),
      startDate: new Date(b.startDate).toISOString().split('T')[0],
      endDate: new Date(b.endDate).toISOString().split('T')[0],
      notes: '',
    });
    setReviseModalOpen(true);
  };

  const getStatusBadge = (status: BudgetStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Draft</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Confirmed</span>;
      case 'REVISED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Revised</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-7 h-7 text-[#714B67]" />
            Budgets & Performance
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track operational spending against targets, compute live achievements from GL, and manage revisions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'graph' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChartIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#714B67] hover:bg-[#5a3b52] text-white rounded-lg font-medium shadow-sm transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Budget
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by budget name or analytic account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'DRAFT', 'CONFIRMED', 'REVISED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-[#714B67] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main View */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          Loading budgets and computing financial progress...
        </div>
      ) : !budgets || budgets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No budgets found</p>
          <p className="text-gray-400 text-sm mt-1">
            Create an operational budget linked to an Analytic Account to track variance.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Budget Name</th>
                  <th className="py-3 px-4">Analytic Account</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Committed (₹)</th>
                  <th className="py-3 px-4 text-right">Achieved (₹)</th>
                  <th className="py-3 px-4 w-44">Achievement %</th>
                  <th className="py-3 px-4 text-right">Remaining (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(budgets?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((b) => {
                  const pct = Number(b.achievedPercentage || 0);
                  const isOver = pct > 100;

                  return (
                    <tr
                      key={b.id}
                      onClick={() => setDetailBudgetId(b.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#714B67]">
                        <div className="flex items-center gap-1.5">
                          {b.name}
                          {b.originalBudgetId && (
                            <span title="Revised version">
                              <GitFork className="w-3.5 h-3.5 text-purple-600" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {b.analyticAccount?.name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs">
                        {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                        ₹{Number(b.committedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                        ₹{Number(b.achievedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className={isOver ? 'text-rose-600' : 'text-emerald-700'}>{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-700">
                        ₹{Number(b.amountToAchieve || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {b.status === 'DRAFT' && (
                            <button
                              onClick={() => confirmMutation.mutate(b.id)}
                              className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium hover:bg-emerald-100"
                            >
                              Confirm
                            </button>
                          )}
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => openReviseModal(b)}
                              className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-medium hover:bg-purple-100 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Revise
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(budgets?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((b) => {
            const pct = Number(b.achievedPercentage || 0);
            const isOver = pct > 100;

            return (
              <div
                key={b.id}
                onClick={() => setDetailBudgetId(b.id)}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                      {b.name}
                      {b.originalBudgetId && (
                        <span title="Revised version">
                          <GitFork className="w-3.5 h-3.5 text-purple-600" />
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-purple-700 font-medium mt-0.5">
                      Analytic: {b.analyticAccount?.name} ({b.type})
                    </p>
                  </div>
                  {getStatusBadge(b.status)}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Progress */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Achievement Progress</span>
                    <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-emerald-700'}`}>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Committed</span>
                    <span className="font-bold text-gray-900">
                      ₹{Number(b.committedAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Achieved</span>
                    <span className="font-bold text-emerald-700">
                      ₹{Number(b.achievedAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Remaining</span>
                    <span className="font-bold text-gray-700">
                      ₹{Number(b.amountToAchieve || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  {b.status === 'DRAFT' && (
                    <button
                      onClick={() => confirmMutation.mutate(b.id)}
                      className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                    >
                      Confirm
                    </button>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => openReviseModal(b)}
                      className="text-xs px-3 py-1.5 bg-[#714B67] hover:bg-[#5a3b52] text-white rounded-lg font-medium flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Revise Budget
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Graph View */
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Budgets Overview (Amount vs Achieved)</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={budgets}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="committedAmount" name="Planned Amount" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="achievedAmount" name="Achieved Amount" fill="#714B67" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && budgets && budgets.length > 10 && viewMode !== 'graph' && (
        <Pagination
          currentPage={currentPage}
          totalItems={budgets.length}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Budget Detail Modal */}
      {detailBudgetId && budgetDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#714B67]/10 text-[#714B67] rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{budgetDetail.name}</h2>
                    {getStatusBadge(budgetDetail.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Analytic Account: <span className="font-semibold text-gray-700">{budgetDetail.analyticAccount?.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailBudgetId(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Revision Lineage */}
              {(budgetDetail.originalBudget || (budgetDetail.revisedBudgets && budgetDetail.revisedBudgets.length > 0)) && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <GitFork className="w-4 h-4 text-purple-700" />
                    Revision Lineage
                  </span>
                  {budgetDetail.originalBudget && (
                    <div className="flex items-center justify-between text-purple-800">
                      <span>Revised from parent: <strong>{budgetDetail.originalBudget.name}</strong></span>
                      <button
                        onClick={() => setDetailBudgetId(budgetDetail.originalBudget!.id)}
                        className="text-purple-700 underline font-medium"
                      >
                        Inspect Parent
                      </button>
                    </div>
                  )}
                  {budgetDetail.revisedBudgets && budgetDetail.revisedBudgets.length > 0 && (
                    <div>
                      <span className="text-purple-700 block mb-1">Successor Revisions:</span>
                      <div className="space-y-1">
                        {budgetDetail.revisedBudgets.map((r) => (
                          <div key={r.id} className="flex justify-between items-center text-purple-900 bg-white/70 p-1.5 rounded">
                            <span>{r.name} ({r.status})</span>
                            <button
                              onClick={() => setDetailBudgetId(r.id)}
                              className="text-purple-700 underline font-medium"
                            >
                              Inspect Revision
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block mb-1">Committed Target</span>
                  <span className="text-sm font-bold text-gray-900">
                    ₹{Number(budgetDetail.committedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Live Achieved (GL)</span>
                  <span className="text-sm font-bold text-emerald-700">
                    ₹{Number(budgetDetail.achievedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Achievement Rate</span>
                  <span className="text-sm font-bold text-purple-700">
                    {budgetDetail.achievedPercentage}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Balance Remaining</span>
                  <span className="text-sm font-bold text-gray-700">
                    ₹{Number(budgetDetail.amountToAchieve || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {budgetDetail.notes && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600">
                  <span className="font-semibold block mb-0.5 text-gray-700">Notes & Objective:</span>
                  {budgetDetail.notes}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setDetailBudgetId(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#714B67]/10 text-[#714B67] rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Create New Budget</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Establish financial targets for projects or departments</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="m-6 mb-0 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Budget Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Operations Budget"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Analytic Account *
                </label>
                <select
                  value={formData.analyticAccountId}
                  onChange={(e) => setFormData({ ...formData, analyticAccountId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                  required
                >
                  <option value={0} disabled>Select Analytic Account</option>
                  {analytics?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Committed Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.committedAmount || ''}
                  onChange={(e) => setFormData({ ...formData, committedAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#714B67]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Responsible Contact
                </label>
                <select
                  value={formData.responsibleId || ''}
                  onChange={(e) => setFormData({ ...formData, responsibleId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                >
                  <option value="">None</option>
                  {contacts?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 bg-[#714B67] hover:bg-[#5a3b52] text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Draft Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revise Budget Modal */}
      {reviseModalOpen && selectedBudget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Revise Budget</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedBudget.name}</p>
                </div>
              </div>
              <button
                onClick={() => setReviseModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                reviseMutation.mutate({ id: selectedBudget.id, payload: revisionData });
              }}
              className="p-6 space-y-4"
            >
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-900">
                This action will mark the current budget as <strong className="font-semibold">REVISED</strong> and create an updated active revision version.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  New Committed Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={revisionData.committedAmount}
                  onChange={(e) => setRevisionData({ ...revisionData, committedAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#714B67]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={revisionData.startDate}
                    onChange={(e) => setRevisionData({ ...revisionData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={revisionData.endDate}
                    onChange={(e) => setRevisionData({ ...revisionData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Revision
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scope expansion or increased material cost"
                  value={revisionData.notes}
                  onChange={(e) => setRevisionData({ ...revisionData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviseModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviseMutation.isPending}
                  className="px-5 py-2 bg-[#714B67] hover:bg-[#5a3b52] text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {reviseMutation.isPending ? 'Applying Revision...' : 'Confirm Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
