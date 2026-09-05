import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Account, AccountType } from '../../types';
import { 
  BookOpen, 
  Plus, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export const ChartOfAccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [ledgerAccountId, setLedgerAccountId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'EXPENSE' as AccountType,
    parentId: null as number | null,
    isActive: true,
  });

  // Fetch accounts with live balances
  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await api.get('/accounts');
      return res.data.data;
    },
  });

  // Fetch single account ledger details
  const { data: accountLedger, isLoading: isLedgerLoading } = useQuery<any>({
    queryKey: ['account-ledger', ledgerAccountId],
    queryFn: async () => {
      if (!ledgerAccountId) return null;
      const res = await api.get(`/accounts/${ledgerAccountId}`);
      return res.data.data;
    },
    enabled: !!ledgerAccountId,
  });

  // Create account mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/accounts', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setModalOpen(false);
      setFormData({
        code: '',
        name: '',
        type: 'EXPENSE',
        parentId: null,
        isActive: true,
      });
      setError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create account.';
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getAccountTypeBadge = (type: AccountType) => {
    switch (type) {
      case 'ASSET':
        return <span className="badge-teal">Asset</span>;
      case 'LIABILITY':
        return <span className="bg-purple-100 text-[#714B67] text-xs font-semibold px-2 py-0.5 rounded">Liability</span>;
      case 'EQUITY':
        return <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded">Capital / Equity</span>;
      case 'INCOME':
        return <span className="badge-green">Income</span>;
      case 'EXPENSE':
      case 'OTHER_EXPENSE':
        return <span className="badge-amber">Expense</span>;
    }
  };

  const filteredAccounts = accounts?.filter((acc) => {
    const matchesType = typeFilter === 'ALL' || acc.type === typeFilter;
    const matchesSearch =
      acc.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      acc.code.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#2F2F2F] tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#714B67]" />
            Chart of Accounts Master
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Standard general ledger classifications, hierarchical accounts, and real-time balances.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Account
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                typeFilter === t
                  ? 'bg-[#F3EAF0] text-[#714B67] font-semibold border border-[#714B67]/30'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t === 'ALL' ? 'All Accounts' : t}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search code or account name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]"
          />
        </div>
      </div>

      {/* Chart of Accounts List - Exactly as Mockup Wireframe */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Parent Account</th>
                <th className="py-3 px-4 text-right">Debit Total</th>
                <th className="py-3 px-4 text-right">Credit Total</th>
                <th className="py-3 px-4 text-right">Net Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : !filteredAccounts || filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No accounts found.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr
                    key={acc.id}
                    onClick={() => setLedgerAccountId(acc.id)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#714B67]">{acc.code}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{acc.name}</td>
                    <td className="py-3 px-4">{getAccountTypeBadge(acc.type)}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {acc.parent ? `${acc.parent.code} - ${acc.parent.name}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-gray-700">
                      ₹{Number((acc as any).totalDebit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-gray-700">
                      ₹{Number((acc as any).totalCredit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      ₹{Number(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLedgerAccountId(acc.id);
                        }}
                        className="text-xs text-[#714B67] hover:underline font-semibold"
                      >
                        View Ledger
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Account Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-[#E5E7EB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#714B67]" />
                New Ledger Account
              </h2>
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
                  Account Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. 1020, 5200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Freight Expense, Petty Cash"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Account Type (Category) *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  <option value="ASSET">Asset (Cash, Bank, Debtors, Inventory)</option>
                  <option value="LIABILITY">Liability (Creditors, Tax Payable)</option>
                  <option value="EQUITY">Capital / Equity</option>
                  <option value="INCOME">Income (Sales Income)</option>
                  <option value="EXPENSE">Expense (Purchases, Operations)</option>
                  <option value="OTHER_EXPENSE">Other Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Parent Account (Hierarchy Optional)
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parentId: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  <option value="">None (Top-Level Account)</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? 'Creating...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Ledger Entries View Drawer */}
      {ledgerAccountId && accountLedger && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full border border-[#E5E7EB] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-[#714B67]">{accountLedger.code}</span>
                  <h2 className="text-lg font-bold text-gray-900">{accountLedger.name}</h2>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {getAccountTypeBadge(accountLedger.type)}
                  <span className="text-xs text-gray-500">General Ledger View</span>
                </div>
              </div>
              <button onClick={() => setLedgerAccountId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Balances summary */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200 text-xs">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500">Total Debit</span>
                <div className="text-base font-bold font-mono text-gray-900 mt-1">
                  ₹{Number(accountLedger.totalDebit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500">Total Credit</span>
                <div className="text-base font-bold font-mono text-gray-900 mt-1">
                  ₹{Number(accountLedger.totalCredit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="text-gray-500">Current Balance</span>
                <div className="text-base font-bold font-mono text-[#714B67] mt-1">
                  ₹{Number(accountLedger.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Scrollable Ledger Items Table */}
            <div className="p-6 overflow-y-auto flex-1">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-3">
                Ledger Entries ({accountLedger.ledger?.length || 0})
              </h4>
              {!accountLedger.ledger || accountLedger.ledger.length === 0 ? (
                <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                  No posted transactions for this account yet.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Entry #</th>
                        <th className="py-2.5 px-3">Journal</th>
                        <th className="py-2.5 px-3">Partner</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Debit</th>
                        <th className="py-2.5 px-3 text-right">Credit</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {accountLedger.ledger.map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-600">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="py-2 px-3 font-semibold text-[#714B67]">{item.entryNumber}</td>
                          <td className="py-2 px-3 text-gray-700">{item.journal}</td>
                          <td className="py-2 px-3 text-gray-800">{item.partner || '—'}</td>
                          <td className="py-2 px-3 text-gray-600 truncate max-w-xs">{item.description || '—'}</td>
                          <td className="py-2 px-3 text-right">{item.debit > 0 ? `₹${item.debit.toLocaleString()}` : '—'}</td>
                          <td className="py-2 px-3 text-right">{item.credit > 0 ? `₹${item.credit.toLocaleString()}` : '—'}</td>
                          <td className="py-2 px-3 text-right font-bold text-gray-900">₹{item.balance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setLedgerAccountId(null)} className="btn-outline text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
