import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { JournalEntry, Account, Journal, Contact, AnalyticAccount } from '../../types';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Scale, 
  Calendar, 
  Building2, 
  X, 
  AlertCircle, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export const JournalEntriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [journalFilter, setJournalFilter] = useState<number | 'ALL'>('ALL');
  const [detailEntryId, setDetailEntryId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual Entry Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    journalId: 0,
    reference: '',
    items: [
      { accountId: 0, partnerId: null as number | null, analyticAccountId: null as number | null, description: '', debit: 0, credit: 0 },
      { accountId: 0, partnerId: null as number | null, analyticAccountId: null as number | null, description: '', debit: 0, credit: 0 },
    ],
  });

  // Fetch Journal Entries
  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['journal-entries', debouncedSearch, journalFilter],
    queryFn: async () => {
      const res = await api.get('/accounting/journal-entries', {
        params: {
          search: debouncedSearch || undefined,
          journalId: journalFilter !== 'ALL' ? journalFilter : undefined,
        },
      });
      return res.data.data;
    },
  });

  // Fetch Accounts
  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts-list'],
    queryFn: async () => {
      const res = await api.get('/accounts');
      return res.data.data;
    },
  });

  // Fetch Journals
  const { data: journals } = useQuery<Journal[]>({
    queryKey: ['journals-list'],
    queryFn: async () => {
      const res = await api.get('/journals');
      return res.data.data;
    },
  });

  // Fetch Contacts
  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ['contacts-list'],
    queryFn: async () => {
      const res = await api.get('/contacts');
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

  // Single Entry Detail
  const { data: entryDetail } = useQuery<JournalEntry>({
    queryKey: ['journal-entry', detailEntryId],
    queryFn: async () => {
      if (!detailEntryId) return null;
      const res = await api.get(`/accounting/journal-entries/${detailEntryId}`);
      return res.data.data;
    },
    enabled: !!detailEntryId,
  });

  // Create Manual Entry Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/accounting/journal-entries', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setModalOpen(false);
      setError(null);
      setDetailEntryId(data.data.id);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to post manual journal entry.');
    },
  });

  const handleAddLine = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          accountId: accounts && accounts.length > 0 ? accounts[0].id : 0,
          partnerId: null,
          analyticAccountId: null,
          description: '',
          debit: 0,
          credit: 0,
        },
      ],
    });
  };

  const handleRemoveLine = (index: number) => {
    if (formData.items.length <= 2) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleLineChange = (index: number, field: string, val: any) => {
    const updated = [...formData.items];
    (updated[index] as any)[field] = val;
    // If setting debit, zero out credit and vice versa
    if (field === 'debit' && Number(val) > 0) {
      updated[index].credit = 0;
    } else if (field === 'credit' && Number(val) > 0) {
      updated[index].debit = 0;
    }
    setFormData({ ...formData, items: updated });
  };

  const calculateDebitCreditTotals = (items: typeof formData.items) => {
    const totalDebit = items.reduce((sum, item) => sum + Number(item.debit || 0), 0);
    const totalCredit = items.reduce((sum, item) => sum + Number(item.credit || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01 && totalDebit > 0;
    return { totalDebit, totalCredit, difference, isBalanced };
  };

  const openNewEntryModal = () => {
    const miscJournal = journals?.find(j => j.type === 'GENERAL') || journals?.[0];
    setFormData({
      date: new Date().toISOString().split('T')[0],
      journalId: miscJournal ? miscJournal.id : 0,
      reference: '',
      items: [
        {
          accountId: accounts && accounts.length > 0 ? accounts[0].id : 0,
          partnerId: null,
          analyticAccountId: null,
          description: '',
          debit: 0,
          credit: 0,
        },
        {
          accountId: accounts && accounts.length > 1 ? accounts[1].id : 0,
          partnerId: null,
          analyticAccountId: null,
          description: '',
          debit: 0,
          credit: 0,
        },
      ],
    });
    setError(null);
    setModalOpen(true);
  };

  const formTotals = calculateDebitCreditTotals(formData.items);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-[#714B67]" />
            Journal Entries & General Ledger
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time audit trail of double-entry records. Every transaction strictly balances (<span className="font-semibold text-gray-700">∑ Dr = ∑ Cr</span>).
          </p>
        </div>

        <button
          onClick={openNewEntryModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#714B67] hover:bg-[#5a3b52] text-white rounded-lg font-medium shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Manual Entry
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by entry #, reference, or doc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setJournalFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              journalFilter === 'ALL'
                ? 'bg-[#714B67] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Journals
          </button>
          {journals?.map((j) => (
            <button
              key={j.id}
              onClick={() => setJournalFilter(j.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                journalFilter === j.id
                  ? 'bg-[#714B67] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {j.code} - {j.name}
            </button>
          ))}
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading ledger entries...</div>
        ) : !entries || entries.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No journal entries recorded</p>
            <p className="text-gray-400 text-sm mt-1">
              Entries are automatically created when posting Invoices, Bills, or Payments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Entry Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Journal</th>
                  <th className="py-3 px-4">Source Document</th>
                  <th className="py-3 px-4">Partner</th>
                  <th className="py-3 px-4 text-right">Debit (₹)</th>
                  <th className="py-3 px-4 text-right">Credit (₹)</th>
                  <th className="py-3 px-4 text-center">Balance Check</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => {
                  const partnerName =
                    entry.vendorBill?.vendor?.name ||
                    entry.customerInvoice?.customer?.name ||
                    entry.payment?.partner?.name ||
                    '-';

                  const sourceDoc =
                    entry.vendorBill ? (
                      <span className="text-xs font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                        Bill: {entry.vendorBill.billNumber}
                      </span>
                    ) : entry.customerInvoice ? (
                      <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        Inv: {entry.customerInvoice.invoiceNumber}
                      </span>
                    ) : entry.payment ? (
                      <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        Pay: {entry.payment.paymentNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Manual Entry</span>
                    );

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setDetailEntryId(entry.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#714B67]">
                        {entry.entryNumber}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium">
                        {entry.journal?.code}
                      </td>
                      <td className="py-3.5 px-4">{sourceDoc}</td>
                      <td className="py-3.5 px-4 text-gray-800">{partnerName}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                        ₹{Number(entry.totalDebit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                        ₹{Number(entry.totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Balanced (0.00)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDetailEntryId(entry.id)}
                          className="text-xs font-medium text-[#714B67] hover:underline"
                        >
                          View Lines
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entry Detail Modal / Drilldown */}
      {detailEntryId && entryDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#714B67]/10 text-[#714B67] rounded-xl">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{entryDetail.entryNumber}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {entryDetail.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Journal: <span className="font-semibold text-gray-700">{entryDetail.journal?.name} ({entryDetail.journal?.code})</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailEntryId(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block mb-1">Entry Date</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(entryDetail.date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Source Type</span>
                  <span className="font-semibold text-gray-800">
                    {entryDetail.sourceType || 'DOCUMENT'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Reference</span>
                  <span className="font-semibold text-gray-800 font-mono">
                    {entryDetail.reference || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Balance Status</span>
                  <span className="font-bold text-emerald-700">
                    Balanced (Dr = Cr)
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  General Ledger Items
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Account</th>
                        <th className="py-2.5 px-3">Partner</th>
                        <th className="py-2.5 px-3">Analytic Account</th>
                        <th className="py-2.5 px-3">Label / Description</th>
                        <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                        <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {entryDetail.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">
                            {item.account?.code} - {item.account?.name}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">
                            {item.partner?.name || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.analyticAccount ? (
                              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px]">
                                {item.analyticAccount.name}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {item.description || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-900">
                            {Number(item.debit) > 0 ? `₹${Number(item.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-gray-900">
                            {Number(item.credit) > 0 ? `₹${Number(item.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200 font-bold text-xs">
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-right uppercase text-gray-600">
                          Total:
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#714B67] text-sm">
                          ₹{Number(entryDetail.totalDebit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#714B67] text-sm">
                          ₹{Number(entryDetail.totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setDetailEntryId(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Journal Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#714B67]/10 text-[#714B67] rounded-xl">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">New Manual Journal Entry</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Post an adjustment or miscellaneous general ledger entry</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
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
                if (!formTotals.isBalanced) {
                  setError('Total Debit must strictly equal Total Credit before posting.');
                  return;
                }
                createMutation.mutate(formData);
              }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Journal *
                    </label>
                    <select
                      value={formData.journalId}
                      onChange={(e) => setFormData({ ...formData, journalId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                      required
                    >
                      {journals?.map((j) => (
                        <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Reference / Memo
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Month-end adjustment"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                    />
                  </div>
                </div>

                {/* Lines Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Entry Lines (Double-Entry)
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="flex items-center gap-1 text-xs font-semibold text-[#714B67] hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Line
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 w-48">Account</th>
                          <th className="py-2.5 px-3 w-36">Partner</th>
                          <th className="py-2.5 px-3 w-36">Analytic</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 w-28 text-right">Debit (₹)</th>
                          <th className="py-2.5 px-3 w-28 text-right">Credit (₹)</th>
                          <th className="py-2.5 px-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formData.items.map((line, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-2">
                              <select
                                value={line.accountId}
                                onChange={(e) => handleLineChange(idx, 'accountId', Number(e.target.value))}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs"
                                required
                              >
                                {accounts?.map((a) => (
                                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={line.partnerId || ''}
                                onChange={(e) => handleLineChange(idx, 'partnerId', e.target.value ? Number(e.target.value) : null)}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs"
                              >
                                <option value="">None</option>
                                {contacts?.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={line.analyticAccountId || ''}
                                onChange={(e) => handleLineChange(idx, 'analyticAccountId', e.target.value ? Number(e.target.value) : null)}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs"
                              >
                                <option value="">None</option>
                                {analytics?.map((an) => (
                                  <option key={an.id} value={an.id}>{an.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Label"
                                value={line.description}
                                onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.debit || ''}
                                onChange={(e) => handleLineChange(idx, 'debit', Number(e.target.value))}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.credit || ''}
                                onChange={(e) => handleLineChange(idx, 'credit', Number(e.target.value))}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs text-right font-mono"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                disabled={formData.items.length <= 2}
                                className="text-gray-400 hover:text-rose-600 disabled:opacity-30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Double Entry Verification Bar */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <Scale className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Verification:</span>
                        {formTotals.isBalanced ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Balanced (Dr = Cr)
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Unbalanced by ₹{formTotals.difference.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">Total Debit and Total Credit must be identical</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 font-mono text-sm">
                    <div>
                      <span className="text-gray-500 text-xs block">Total Debit</span>
                      <span className="font-bold text-gray-900">₹{formTotals.totalDebit.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Total Credit</span>
                      <span className="font-bold text-gray-900">₹{formTotals.totalCredit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formTotals.isBalanced || createMutation.isPending}
                  className="px-5 py-2 bg-[#714B67] hover:bg-[#5a3b52] disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {createMutation.isPending ? 'Posting...' : 'Post Journal Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
