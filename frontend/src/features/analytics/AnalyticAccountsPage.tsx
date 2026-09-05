import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { AnalyticAccount, AnalyticType } from '../../types';
import { FolderKanban, Plus, LayoutList, LayoutGrid, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';

export const AnalyticAccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE' as AnalyticType,
    isActive: true,
  });

  const { data: analytics, isLoading } = useQuery<AnalyticAccount[]>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await api.get('/analytics');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/analytics', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setModalOpen(false);
      setFormData({
        name: '',
        type: 'EXPENSE',
        isActive: true,
      });
      setError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create analytic account.';
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#2F2F2F] tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-[#714B67]" />
            Analytic Accounts
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Cost centers and financial markers tracking profitability across projects, departments, and budgets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#714B67] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[#714B67] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setError(null);
              setModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Analytic Account
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-lg border border-gray-200">
          Loading analytic accounts...
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">Analytic Account</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Active Budgets</th>
                <th className="py-3 px-4">Transaction References</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {(analytics?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((an) => (
                <tr key={an.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-[#714B67]" />
                    <span>{an.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    {an.type === 'EXPENSE' ? (
                      <span className="badge-amber">Expense Tracking</span>
                    ) : (
                      <span className="badge-green">Income Tracking</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-600 font-mono">
                    {(an as any)._count?.budgets || 0} Budgets
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-600 font-mono">
                    {((an as any)._count?.vendorBillLines || 0) + ((an as any)._count?.customerInvoiceLines || 0)} Lines
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(analytics?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((an) => (
            <div
              key={an.id}
              className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm hover:border-[#714B67]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="badge-purple">Analytic Marker</span>
                  {an.type === 'EXPENSE' ? (
                    <span className="badge-amber">Expense</span>
                  ) : (
                    <span className="badge-green">Income</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base mt-3">{an.name}</h3>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                <span>{(an as any)._count?.budgets || 0} Linked Budgets</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {analytics && analytics.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={analytics.length}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-[#E5E7EB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <h2 className="text-lg font-bold text-gray-900">New Analytic Account</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Analytic Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Project 1, Office Renovations"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Analytic Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AnalyticType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  <option value="EXPENSE">Expense (Tracks costs & vendor bills)</option>
                  <option value="INCOME">Income (Tracks revenue & customer invoices)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? 'Saving...' : 'Save Analytic Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
